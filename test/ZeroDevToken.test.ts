import { expect } from "chai";
import { ethers } from "hardhat";
import { ZeroDevToken } from "../src/types/typechain"; // Adjust if typechain output path is different
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ZeroDevToken", function () {
    let token: ZeroDevToken;
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;

    const INITIAL_SUPPLY = ethers.parseUnits("1000000", 18); // 1,000,000 * 10^18
    const MAX_SUPPLY = ethers.parseUnits("10000000", 18);    // 10,000,000 * 10^18

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        const TokenFactory = await ethers.getContractFactory("ZeroDevToken");
        token = (await TokenFactory.deploy()) as unknown as ZeroDevToken;
        await token.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should deploy with the correct name and symbol", async function () {
            expect(await token.name()).to.equal("ZeroDev Token");
            expect(await token.symbol()).to.equal("ZDT");
        });

        it("Should assign the initial supply of tokens to the owner", async function () {
            const ownerBalance = await token.balanceOf(owner.address);
            expect(ownerBalance).to.equal(INITIAL_SUPPLY);
        });

        it("Should set the correct initial and max supply constants", async function () {
            expect(await token.INITIAL_SUPPLY()).to.equal(INITIAL_SUPPLY);
            expect(await token.MAX_SUPPLY()).to.equal(MAX_SUPPLY);
        });
    });

    describe("Minting", function () {
        it("Should allow owner to mint tokens", async function () {
            const mintAmount = ethers.parseUnits("1000", 18);
            await token.connect(owner).mint(addr1.address, mintAmount);
            expect(await token.balanceOf(addr1.address)).to.equal(mintAmount);
        });

        it("Should allow an authorized minter to mint tokens", async function () {
            await token.connect(owner).addMinter(addr1.address);
            const mintAmount = ethers.parseUnits("500", 18);
            await token.connect(addr1).mint(addr2.address, mintAmount);
            expect(await token.balanceOf(addr2.address)).to.equal(mintAmount);
        });

        it("Should prevent unauthorized address from minting tokens", async function () {
            const mintAmount = ethers.parseUnits("100", 18);
            await expect(
                token.connect(addr1).mint(addr2.address, mintAmount)
            ).to.be.revertedWith("Not authorized to mint");
        });

        it("Should not allow minting beyond MAX_SUPPLY", async function () {
            const currentTotalSupply = await token.totalSupply();
            const remainingSupply = MAX_SUPPLY - currentTotalSupply;

            // Mint up to nearly max supply to owner first to make calculation easier
            if (remainingSupply > BigInt(0)) {
                 // Check if owner has enough to avoid underflow if currentTotalSupply is already INITIAL_SUPPLY by owner
                if (currentTotalSupply < MAX_SUPPLY) {
                    // await token.connect(owner).mint(owner.address, remainingSupply); // This mints to owner
                }
            }
            // The above logic is a bit complex, let's simplify.
            // We know INITIAL_SUPPLY is 1M, MAX_SUPPLY is 10M.
            // Owner already has 1M.
            // Let's try to mint 9M + 1 wei.
            const excessiveAmount = MAX_SUPPLY - INITIAL_SUPPLY + BigInt(1);

            await expect(
                token.connect(owner).mint(addr1.address, excessiveAmount)
            ).to.be.revertedWith("Exceeds max supply");
        });

        it("Should not allow minting when paused by owner", async function () {
            await token.connect(owner).pause();
            const mintAmount = ethers.parseUnits("100", 18);
            await expect(
                token.connect(owner).mint(addr1.address, mintAmount)
            ).to.be.revertedWith("Pausable: paused");
        });
    });

    describe("Minter Management", function () {
        it("Should allow owner to add a minter", async function () {
            await token.connect(owner).addMinter(addr1.address);
            expect(await token.minters(addr1.address)).to.be.true;
        });

        it("Should emit MinterAdded event when a minter is added", async function () {
            await expect(token.connect(owner).addMinter(addr1.address))
                .to.emit(token, "MinterAdded")
                .withArgs(addr1.address);
        });

        it("Should allow owner to remove a minter", async function () {
            await token.connect(owner).addMinter(addr1.address);
            expect(await token.minters(addr1.address)).to.be.true;
            await token.connect(owner).removeMinter(addr1.address);
            expect(await token.minters(addr1.address)).to.be.false;
        });

        it("Should emit MinterRemoved event when a minter is removed", async function () {
            await token.connect(owner).addMinter(addr1.address);
            await expect(token.connect(owner).removeMinter(addr1.address))
                .to.emit(token, "MinterRemoved")
                .withArgs(addr1.address);
        });

        it("Should prevent non-owner from adding a minter", async function () {
            await expect(
                token.connect(addr1).addMinter(addr2.address)
            ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
        });

        it("Should prevent non-owner from removing a minter", async function () {
            await token.connect(owner).addMinter(addr1.address);
            await expect(
                token.connect(addr2).removeMinter(addr1.address)
            ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
        });
    });

    describe("Pausable", function () {
        it("Should allow owner to pause and unpause", async function () {
            await token.connect(owner).pause();
            expect(await token.paused()).to.equal(true);
            await token.connect(owner).unpause();
            expect(await token.paused()).to.equal(false);
        });

        it("Should prevent non-owner from pausing", async function () {
            await expect(token.connect(addr1).pause()).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
        });

        it("Should prevent non-owner from unpausing", async function () {
            await token.connect(owner).pause();
            await expect(token.connect(addr1).unpause()).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
        });

        it("Transfers should be blocked when paused", async function () {
            await token.connect(owner).pause();
            await expect(
                token.connect(owner).transfer(addr1.address, ethers.parseUnits("1", 18))
            ).to.be.revertedWith("Pausable: paused");
        });
    });

    describe("ERC20 Standard Functionality", function() {
        it("Should handle transfers correctly", async function() {
            const initialOwnerBalance = await token.balanceOf(owner.address);
            const transferAmount = ethers.parseUnits("100", 18);

            // Transfer from owner to addr1
            await token.connect(owner).transfer(addr1.address, transferAmount);

            expect(await token.balanceOf(addr1.address)).to.equal(transferAmount);
            expect(await token.balanceOf(owner.address)).to.equal(initialOwnerBalance - transferAmount);
        });

        it("Should handle allowances correctly", async function() {
            const approveAmount = ethers.parseUnits("50", 18);
            await token.connect(owner).approve(addr1.address, approveAmount);
            expect(await token.allowance(owner.address, addr1.address)).to.equal(approveAmount);

            // addr1 transfers from owner to addr2
            await token.connect(addr1).transferFrom(owner.address, addr2.address, approveAmount);
            expect(await token.balanceOf(addr2.address)).to.equal(approveAmount);
            expect(await token.allowance(owner.address, addr1.address)).to.equal(0);
        });
    });
});
