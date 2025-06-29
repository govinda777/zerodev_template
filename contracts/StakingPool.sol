// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol"; // Added Pausable

contract StakingPool is Ownable, ReentrancyGuard, Pausable {
    IERC20 public immutable stakingToken;

    struct StakeInfo {
        uint256 amount;             // Amount of tokens staked
        uint256 lastRewardUpdateTime; // Timestamp of the last reward calculation update for this user
        uint256 rewardDebt;         // Stores the reward amount already accounted for (to prevent double claiming)
    }

    mapping(address => StakeInfo) public stakes;

    uint256 public totalStaked;
    uint256 public rewardRatePerSecond; // e.g., (1% per day) / (24 * 60 * 60 seconds) with appropriate precision
    uint256 public constant REWARD_PRECISION = 10**18; // For reward calculations
    uint256 public constant MIN_STAKE_AMOUNT = 1 * 10**18; // Minimum 1 token to stake (assuming 18 decimals)

    uint256 public accTokenPerShare; // Accumulated tokens per share, used for calculating rewards
    uint256 public lastGlobalRewardUpdateTime; // Last time rewards were updated globally (e.g., when rewardRate changes or someone stakes/unstakes)

    event Staked(address indexed user, uint256 amount, uint256 totalUserStake);
    event Unstaked(address indexed user, uint256 amount, uint256 remainingUserStake);
    event RewardsClaimed(address indexed user, uint256 rewardAmount);
    event RewardRateUpdated(uint256 oldRate, uint256 newRate);

    constructor(address _stakingTokenAddress, uint256 _initialRewardRatePerDayPercent) Ownable(msg.sender) {
        require(_stakingTokenAddress != address(0), "Token address cannot be zero");
        stakingToken = IERC20(_stakingTokenAddress);
        // Example: _initialRewardRatePerDayPercent = 100 for 1% per day (100 means 1.00%)
        // Convert daily percentage to per second rate with precision
        // (Rate / 100) * (1 / seconds_in_day) * PRECISION
        // (Rate * PRECISION) / (100 * seconds_in_day)
        rewardRatePerSecond = (_initialRewardRatePerDayPercent * REWARD_PRECISION) / (100 * 1 days);
        lastGlobalRewardUpdateTime = block.timestamp;
    }

    modifier updateReward(address user) {
        _updateGlobalRewardAccumulation();
        if (stakes[user].amount > 0) {
            uint256 pending = (stakes[user].amount * accTokenPerShare / REWARD_PRECISION) - stakes[user].rewardDebt;
            if (pending > 0) {
                // Safe transfer for rewards accumulated so far, or credit them internally before proceeding
                // For simplicity in this modifier, we'll just update the debt. Actual transfer in claimRewards.
            }
        }
        stakes[user].rewardDebt = stakes[user].amount * accTokenPerShare / REWARD_PRECISION; // Update debt before state change
        _;
    }

    function _updateGlobalRewardAccumulation() internal {
        if (totalStaked == 0) {
            lastGlobalRewardUpdateTime = block.timestamp;
            return;
        }
        if (block.timestamp > lastGlobalRewardUpdateTime) {
            uint256 timeDelta = block.timestamp - lastGlobalRewardUpdateTime;
            uint256 reward = timeDelta * rewardRatePerSecond; // This is the reward per token
            accTokenPerShare += (reward * REWARD_PRECISION) / totalStaked; // Careful with precision here
        }
        lastGlobalRewardUpdateTime = block.timestamp;
    }

    function stake(uint256 amount) external nonReentrant whenNotPaused updateReward(msg.sender) {
        require(amount >= MIN_STAKE_AMOUNT, "Stake amount too small");

        require(stakingToken.transferFrom(msg.sender, address(this), amount), "Token transfer failed");

        stakes[msg.sender].amount += amount;
        totalStaked += amount;

        emit Staked(msg.sender, amount, stakes[msg.sender].amount);
    }

    function unstake(uint256 amount) external nonReentrant whenNotPaused updateReward(msg.sender) {
        StakeInfo storage userStake = stakes[msg.sender];
        require(userStake.amount > 0, "No tokens staked");
        require(amount > 0, "Cannot unstake 0 tokens");

        uint256 amountToUnstake = amount > userStake.amount ? userStake.amount : amount;

        // Claim pending rewards before unstaking
        claimRewardsInternal(msg.sender);

        userStake.amount -= amountToUnstake;
        totalStaked -= amountToUnstake;

        require(stakingToken.transfer(msg.sender, amountToUnstake), "Token transfer failed");

        emit Unstaked(msg.sender, amountToUnstake, userStake.amount);
    }

    function claimRewards() external nonReentrant whenNotPaused {
        claimRewardsInternal(msg.sender);
    }

    function claimRewardsInternal(address user) internal {
        _updateGlobalRewardAccumulation(); // Ensure accTokenPerShare is up-to-date
        uint256 pendingReward = pendingRewards(user);

        if (pendingReward > 0) {
            stakes[user].rewardDebt = stakes[user].amount * accTokenPerShare / REWARD_PRECISION; // Update before transfer
            // Ensure the contract has enough tokens to pay out rewards.
            // This example assumes the staking pool itself holds the reward tokens.
            // If rewards are funded externally, ensure balance is sufficient.
            uint256 contractBalance = stakingToken.balanceOf(address(this));
            uint256 actualRewardToTransfer = pendingReward > contractBalance - totalStaked ? contractBalance - totalStaked : pendingReward;
            // We should only transfer if actualRewardToTransfer > 0 and it comes from a dedicated reward pool, not the staked capital.
            // This basic model implies rewards are part of the totalStaked or funded to the contract.
            // A more robust system would have a separate reward pool.

            // For this example, let's assume rewards are minted or transferred to the pool by an admin.
            // And the pool has enough balance.
            if (actualRewardToTransfer > 0) {
                 require(stakingToken.transfer(user, actualRewardToTransfer), "Reward transfer failed");
                 emit RewardsClaimed(user, actualRewardToTransfer);
            }
        }
    }

    function pendingRewards(address user) public view returns (uint256) {
        StakeInfo memory userStake = stakes[user];
        if (userStake.amount == 0) {
            return 0;
        }
        uint256 currentAccTokenPerShare = accTokenPerShare;
        if (totalStaked > 0 && block.timestamp > lastGlobalRewardUpdateTime) {
             uint256 timeDelta = block.timestamp - lastGlobalRewardUpdateTime;
             uint256 reward = timeDelta * rewardRatePerSecond;
             currentAccTokenPerShare += (reward * REWARD_PRECISION) / totalStaked;
        }
        return (userStake.amount * currentAccTokenPerShare / REWARD_PRECISION) - userStake.rewardDebt;
    }

    function updateRewardRate(uint256 _newDailyRatePercent) external onlyOwner {
        _updateGlobalRewardAccumulation(); // Process rewards up to this point with the old rate
        uint256 oldRatePerSecond = rewardRatePerSecond;
        rewardRatePerSecond = (_newDailyRatePercent * REWARD_PRECISION) / (100 * 1 days);
        lastGlobalRewardUpdateTime = block.timestamp; // Reset timestamp for new rate calculations
        emit RewardRateUpdated(oldRatePerSecond, rewardRatePerSecond);
    }

    function getStakeInfo(address user) external view returns (uint256 amount, uint256 pending) {
        amount = stakes[user].amount;
        pending = pendingRewards(user);
        return (amount, pending);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
