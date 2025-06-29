import { expect } from "chai";
import { ethers, network } from "hardhat";
import { ZeroDevToken, StakingPool } from "../src/types/typechain";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("StakingPool", function () {
    let zdtToken: ZeroDevToken;
    let stakingPool: StakingPool;
    let owner: SignerWithAddress;
    let staker1: SignerWithAddress;
    let staker2: SignerWithAddress;

    const INITIAL_REWARD_RATE = 100; // 1% per day (100 / 10000)
    const ONE_DAY_IN_SECONDS = 1 * 24 * 60 * 60;

    async function increaseTime(duration: number) {
        await network.provider.send("evm_increaseTime", [duration]);
        await network.provider.send("evm_mine");
    }

    beforeEach(async function () {
        [owner, staker1, staker2] = await ethers.getSigners();

        // Deploy ZeroDevToken
        const TokenFactory = await ethers.getContractFactory("ZeroDevToken");
        zdtToken = (await TokenFactory.deploy()) as unknown as ZeroDevToken;
        await zdtToken.waitForDeployment();
        const zdtTokenAddress = await zdtToken.getAddress();

        // Deploy StakingPool
        const StakingPoolFactory = await ethers.getContractFactory("StakingPool");
        stakingPool = (await StakingPoolFactory.deploy(zdtTokenAddress, INITIAL_REWARD_RATE)) as unknown as StakingPool;
        await stakingPool.waitForDeployment();
        const stakingPoolAddress = await stakingPool.getAddress();

        // Distribute some ZDT to stakers
        await zdtToken.connect(owner).transfer(staker1.address, ethers.parseUnits("10000", 18));
        await zdtToken.connect(owner).transfer(staker2.address, ethers.parseUnits("5000", 18));

        // Approve the staking pool to spend stakers' tokens
        await zdtToken.connect(staker1).approve(stakingPoolAddress, ethers.parseUnits("10000", 18));
        await zdtToken.connect(staker2).approve(stakingPoolAddress, ethers.parseUnits("5000", 18));

        // For rewards, the StakingPool contract itself needs tokens.
        // Let's assume the owner (or a treasury) funds the pool for rewards.
        // This is crucial if rewards aren't minted but paid from a balance.
        // The current StakingPool.sol pays rewards from its own balance of stakingToken.
        await zdtToken.connect(owner).transfer(stakingPoolAddress, ethers.parseUnits("100000", 18)); // Fund with 100k ZDT for rewards
    });

    describe("Deployment & Configuration", function () {
        it("Should set the correct staking token and reward rate on deployment", async function () {
            expect(await stakingPool.stakingToken()).to.equal(await zdtToken.getAddress());
            expect(await stakingPool.rewardRate()).to.equal(INITIAL_REWARD_RATE);
        });

        it("Should allow owner to set a new reward rate", async function () {
            const newRate = 200; // 2%
            await expect(stakingPool.connect(owner).setRewardRate(newRate))
                .to.emit(stakingPool, "RewardRateChanged")
                .withArgs(newRate);
            expect(await stakingPool.rewardRate()).to.equal(newRate);
        });

        it("Should prevent non-owner from setting reward rate", async function () {
            await expect(
                stakingPool.connect(staker1).setRewardRate(150)
            ).to.be.revertedWithCustomError(stakingPool, "OwnableUnauthorizedAccount");
        });
    });

    describe("Staking", function () {
        it("Should allow a user to stake tokens", async function () {
            const stakeAmount = ethers.parseUnits("1000", 18);
            await expect(stakingPool.connect(staker1).stake(stakeAmount))
                .to.emit(stakingPool, "Staked")
                .withArgs(staker1.address, stakeAmount);

            const stakeInfo = await stakingPool.getStakeInfo(staker1.address);
            expect(stakeInfo.amount).to.equal(stakeAmount);
            expect(await stakingPool.totalStaked()).to.equal(stakeAmount);
            expect(await zdtToken.balanceOf(await stakingPool.getAddress())).to.include(stakeAmount); // Pool balance increases
        });

        it("Should not allow staking 0 tokens", async function () {
            await expect(stakingPool.connect(staker1).stake(0)).to.be.revertedWith("Cannot stake 0");
        });

        it("Should update rewards and timestamp when re-staking", async function() {
            const firstStakeAmount = ethers.parseUnits("100", 18);
            await stakingPool.connect(staker1).stake(firstStakeAmount);
            const initialTimestamp = (await stakingPool.getStakeInfo(staker1.address)).timestamp;

            await increaseTime(ONE_DAY_IN_SECONDS); // Pass 1 day

            const secondStakeAmount = ethers.parseUnits("50", 18);
            await stakingPool.connect(staker1).stake(secondStakeAmount);

            const stakeInfo = await stakingPool.getStakeInfo(staker1.address);
            expect(stakeInfo.amount).to.equal(firstStakeAmount + secondStakeAmount);
            expect(stakeInfo.timestamp).to.be.gt(initialTimestamp); // Timestamp should update

            // Check if pending rewards from first stake period were accounted for
            const expectedRewardForFirstDay = (firstStakeAmount * BigInt(INITIAL_REWARD_RATE) * BigInt(ONE_DAY_IN_SECONDS)) / (BigInt(10000) * BigInt(ONE_DAY_IN_SECONDS));
            expect(await stakingPool.rewards(staker1.address)).to.equal(expectedRewardForFirstDay);
        });
    });

    describe("Unstaking", function () {
        const stakeAmount = ethers.parseUnits("1000", 18);

        beforeEach(async function() {
            await stakingPool.connect(staker1).stake(stakeAmount);
        });

        it("Should allow a user to unstake tokens and claim rewards", async function () {
            await increaseTime(ONE_DAY_IN_SECONDS); // Let some rewards accrue

            const initialStakerBalance = await zdtToken.balanceOf(staker1.address);
            const expectedReward = (stakeAmount * BigInt(INITIAL_REWARD_RATE) * BigInt(ONE_DAY_IN_SECONDS)) / (BigInt(10000) * BigInt(ONE_DAY_IN_SECONDS));

            await expect(stakingPool.connect(staker1).unstake(stakeAmount))
                .to.emit(stakingPool, "Unstaked")
                .withArgs(staker1.address, stakeAmount, expectedReward);

            const stakeInfo = await stakingPool.getStakeInfo(staker1.address);
            expect(stakeInfo.amount).to.equal(0);
            expect(await stakingPool.totalStaked()).to.equal(0);
            expect(await stakingPool.rewards(staker1.address)).to.equal(0); // Rewards should be paid out

            const finalStakerBalance = await zdtToken.balanceOf(staker1.address);
            expect(finalStakerBalance).to.equal(initialStakerBalance + stakeAmount + expectedReward);
        });

        it("Should not allow unstaking 0 tokens", async function () {
            await expect(stakingPool.connect(staker1).unstake(0)).to.be.revertedWith("Cannot unstake 0");
        });

        it("Should not allow unstaking more than staked amount", async function () {
            await expect(stakingPool.connect(staker1).unstake(stakeAmount + ethers.parseUnits("1", 18)))
                .to.be.revertedWith("Insufficient stake");
        });

        it("Should handle partial unstaking correctly", async function() {
            await increaseTime(ONE_DAY_IN_SECONDS);
            const partialUnstakeAmount = ethers.parseUnits("400", 18);
            const remainingStakeAmount = stakeAmount - partialUnstakeAmount;

            const expectedReward = (stakeAmount * BigInt(INITIAL_REWARD_RATE) * BigInt(ONE_DAY_IN_SECONDS)) / (BigInt(10000) * BigInt(ONE_DAY_IN_SECONDS));

            const initialStakerBalance = await zdtToken.balanceOf(staker1.address);
            await stakingPool.connect(staker1).unstake(partialUnstakeAmount);

            const stakeInfo = await stakingPool.getStakeInfo(staker1.address);
            expect(stakeInfo.amount).to.equal(remainingStakeAmount);
            expect(await stakingPool.totalStaked()).to.equal(remainingStakeAmount);
            expect(await stakingPool.rewards(staker1.address)).to.equal(0); // Rewards paid

            const finalStakerBalance = await zdtToken.balanceOf(staker1.address);
            expect(finalStakerBalance).to.equal(initialStakerBalance + partialUnstakeAmount + expectedReward);
        });
    });

    describe("Reward Calculation & Claiming", function () {
        const stakeAmount = ethers.parseUnits("1000", 18);

        beforeEach(async function() {
            await stakingPool.connect(staker1).stake(stakeAmount);
        });

        it("calculatePendingRewards should return correct amount", async function () {
            await increaseTime(ONE_DAY_IN_SECONDS);
            const expectedReward = (stakeAmount * BigInt(INITIAL_REWARD_RATE) * BigInt(ONE_DAY_IN_SECONDS)) / (BigInt(10000) * BigInt(ONE_DAY_IN_SECONDS));
            expect(await stakingPool.calculatePendingRewards(staker1.address)).to.equal(expectedReward);
        });

        it("getPendingRewards should include already accrued and newly calculated rewards", async function() {
            await increaseTime(ONE_DAY_IN_SECONDS); // Accrue first day
            await stakingPool.connect(staker1).claimRewards(); // Claim first day, resets internal `rewards` mapping for user but not stake timestamp

            await increaseTime(ONE_DAY_IN_SECONDS); // Accrue second day
            const expectedRewardForSecondDay = (stakeAmount * BigInt(INITIAL_REWARD_RATE) * BigInt(ONE_DAY_IN_SECONDS)) / (BigInt(10000) * BigInt(ONE_DAY_IN_SECONDS));

            // getPendingRewards = rewards[user] (should be 0 after claim) + calculatePendingRewards (for second day)
            expect(await stakingPool.getPendingRewards(staker1.address)).to.equal(expectedRewardForSecondDay);
        });


        it("Should allow a user to claim rewards", async function () {
            await increaseTime(ONE_DAY_IN_SECONDS * 2); // Accrue for 2 days

            const expectedReward = (stakeAmount * BigInt(INITIAL_REWARD_RATE) * BigInt(ONE_DAY_IN_SECONDS * 2)) / (BigInt(10000) * BigInt(ONE_DAY_IN_SECONDS));
            const initialStakerBalance = await zdtToken.balanceOf(staker1.address);
            const initialStakeTimestamp = (await stakingPool.getStakeInfo(staker1.address)).timestamp;

            await expect(stakingPool.connect(staker1).claimRewards())
                .to.emit(stakingPool, "RewardsClaimed")
                .withArgs(staker1.address, expectedReward);

            expect(await stakingPool.rewards(staker1.address)).to.equal(0); // Pending rewards reset
            const finalStakerBalance = await zdtToken.balanceOf(staker1.address);
            expect(finalStakerBalance).to.equal(initialStakerBalance + expectedReward);

            const newStakeTimestamp = (await stakingPool.getStakeInfo(staker1.address)).timestamp;
            expect(newStakeTimestamp).to.be.gt(initialStakeTimestamp); // Timestamp updated
        });

        it("Should revert if no rewards to claim", async function () {
            // No time passed, or rewards already claimed
            await expect(stakingPool.connect(staker1).claimRewards()).to.be.revertedWith("No rewards to claim");
        });
    });

    describe("Pausable Staking", function () {
        it("Should allow owner to pause and unpause staking", async function () {
            await stakingPool.connect(owner).pauseStaking();
            expect(await stakingPool.paused()).to.be.true;

            await stakingPool.connect(owner).unpauseStaking();
            expect(await stakingPool.paused()).to.be.false;
        });

        it("Should prevent staking when paused", async function () {
            await stakingPool.connect(owner).pauseStaking();
            await expect(
                stakingPool.connect(staker1).stake(ethers.parseUnits("100", 18))
            ).to.be.revertedWith("Pausable: paused");
        });

        it("Should prevent claiming rewards when paused", async function() {
            await stakingPool.connect(staker1).stake(ethers.parseUnits("100", 18));
            await increaseTime(ONE_DAY_IN_SECONDS);
            await stakingPool.connect(owner).pauseStaking();
            await expect(
                stakingPool.connect(staker1).claimRewards()
            ).to.be.revertedWith("Pausable: paused");
        });

        // Note: Unstaking is often allowed even when paused to let users retrieve funds.
        // The current StakingPool.sol has whenNotPaused on unstake.
        // If unstaking should be allowed when paused, remove whenNotPaused from unstake.
        it("Should prevent unstaking when paused (as per current contract modifier)", async function() {
            await stakingPool.connect(staker1).stake(ethers.parseUnits("100", 18));
            await stakingPool.connect(owner).pauseStaking();
            await expect(
                stakingPool.connect(staker1).unstake(ethers.parseUnits("100", 18))
            ).to.be.revertedWith("Pausable: paused");
        });
    });
});
