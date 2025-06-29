import { expect } from "chai";
import { ethers } from "hardhat";
import { ZeroDevToken, TokenShop } from "../src/types/typechain";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("TokenShop", function () {
    let zdtToken: ZeroDevToken;
    let shop: TokenShop;
    let owner: SignerWithAddress;
    let buyer1: SignerWithAddress;
    let buyer2: SignerWithAddress;

    const ZDT_INITIAL_SUPPLY = ethers.parseUnits("1000000", 18);

    beforeEach(async function () {
        [owner, buyer1, buyer2] = await ethers.getSigners();

        // Deploy ZeroDevToken
        const TokenFactory = await ethers.getContractFactory("ZeroDevToken");
        zdtToken = (await TokenFactory.deploy()) as unknown as ZeroDevToken;
        await zdtToken.waitForDeployment();
        const zdtTokenAddress = await zdtToken.getAddress();

        // Deploy TokenShop, linking it to the ZDT token
        const ShopFactory = await ethers.getContractFactory("TokenShop");
        shop = (await ShopFactory.deploy(zdtTokenAddress)) as unknown as TokenShop;
        await shop.waitForDeployment();
        const shopAddress = await shop.getAddress();

        // Distribute some ZDT to buyers for testing
        await zdtToken.connect(owner).transfer(buyer1.address, ethers.parseUnits("1000", 18));
        await zdtToken.connect(owner).transfer(buyer2.address, ethers.parseUnits("500", 18));

        // Approve the shop to spend buyer's tokens
        await zdtToken.connect(buyer1).approve(shopAddress, ethers.parseUnits("1000", 18));
        await zdtToken.connect(buyer2).approve(shopAddress, ethers.parseUnits("500", 18));
    });

    describe("Product Management", function () {
        it("Should allow owner to add a product", async function () {
            const productName = "Cool Gadget";
            const productPrice = ethers.parseUnits("100", 18);
            const productStock = 10;

            await expect(shop.connect(owner).addProduct(productName, "A very cool gadget", productPrice, productStock))
                .to.emit(shop, "ProductAdded")
                .withArgs(1, productName, productPrice, productStock); // productId is 1

            const product = await shop.getProduct(1);
            expect(product.id).to.equal(1);
            expect(product.name).to.equal(productName);
            expect(product.price).to.equal(productPrice);
            expect(product.stock).to.equal(productStock);
            expect(product.active).to.be.true;
        });

        it("Should not allow adding a product with price 0", async function () {
            await expect(
                shop.connect(owner).addProduct("Freebie", "A free item", 0, 100)
            ).to.be.revertedWith("Product price must be greater than 0");
        });

        it("Should allow owner to update a product", async function () {
            await shop.connect(owner).addProduct("Old Name", "Old Desc", ethers.parseUnits("10", 18), 5);

            const newName = "New Name";
            const newPrice = ethers.parseUnits("15", 18);
            const newStock = 8;
            const newActiveState = false;

            await expect(shop.connect(owner).updateProduct(1, newName, "New Desc", newPrice, newStock, newActiveState))
                .to.emit(shop, "ProductUpdated")
                .withArgs(1, newName, newPrice, newStock, newActiveState);

            const product = await shop.getProduct(1);
            expect(product.name).to.equal(newName);
            expect(product.price).to.equal(newPrice);
            expect(product.stock).to.equal(newStock);
            expect(product.active).to.equal(newActiveState);
        });

        it("Should prevent non-owner from adding a product", async function () {
            await expect(
                shop.connect(buyer1).addProduct("Unauthorized Product", "Desc", ethers.parseUnits("1", 18), 1)
            ).to.be.revertedWithCustomError(shop, "OwnableUnauthorizedAccount");
        });
    });

    describe("Product Purchases", function () {
        const productName = "Test Item";
        const productPrice = ethers.parseUnits("50", 18);
        const productStock = 5;

        beforeEach(async function() {
            // Add a product for purchase tests
            await shop.connect(owner).addProduct(productName, "A test item", productPrice, productStock);
        });

        it("Should allow a user to purchase a product with sufficient balance and stock", async function () {
            const quantity = 2;
            const totalCost = productPrice * BigInt(quantity);
            const initialBuyerBalance = await zdtToken.balanceOf(buyer1.address);
            const shopAddress = await shop.getAddress();

            await expect(shop.connect(buyer1).purchaseProduct(1, quantity))
                .to.emit(shop, "ProductPurchased")
                .withArgs(buyer1.address, 1, quantity, totalCost);

            const product = await shop.getProduct(1);
            expect(product.stock).to.equal(productStock - quantity);

            const finalBuyerBalance = await zdtToken.balanceOf(buyer1.address);
            expect(finalBuyerBalance).to.equal(initialBuyerBalance - totalCost);

            const shopBalance = await zdtToken.balanceOf(shopAddress);
            expect(shopBalance).to.equal(totalCost); // Assuming shop starts with 0 ZDT

            expect(await shop.purchases(buyer1.address, 1)).to.equal(quantity);
            expect(await shop.totalRevenue()).to.equal(totalCost);
        });

        it("Should reject purchase if product is not active", async function () {
            await shop.connect(owner).updateProduct(1, productName, "Desc", productPrice, productStock, false);
            await expect(
                shop.connect(buyer1).purchaseProduct(1, 1)
            ).to.be.revertedWith("Product not active");
        });

        it("Should reject purchase if insufficient stock", async function () {
            await expect(
                shop.connect(buyer1).purchaseProduct(1, productStock + 1)
            ).to.be.revertedWith("Insufficient stock");
        });

        it("Should reject purchase if buyer has insufficient token balance (implicitly via transferFrom)", async function () {
            // buyer2 has 500 ZDT, product costs 50 ZDT. Let's try to buy 11 (cost 550 ZDT)
            await expect(
                shop.connect(buyer2).purchaseProduct(1, 11)
            ).to.be.revertedWith("Token allowance insufficient"); // Or "ERC20: transfer amount exceeds balance" if allowance is high enough
        });

        it("Should reject purchase if buyer has not approved enough tokens", async function() {
            const shopAddress = await shop.getAddress();
            // buyer2 has 500 ZDT, product costs 50 ZDT. Approve only 10 ZDT.
            await zdtToken.connect(buyer2).approve(shopAddress, ethers.parseUnits("10", 18));
            await expect(
                shop.connect(buyer2).purchaseProduct(1, 1) // Tries to transfer 50 ZDT
            ).to.be.revertedWith("Token allowance insufficient");
        });

        it("Should reject purchase with quantity 0", async function () {
            await expect(
                shop.connect(buyer1).purchaseProduct(1, 0)
            ).to.be.revertedWith("Quantity must be greater than 0");
        });

        it("Should not allow purchases when shop is paused", async function() {
            await shop.connect(owner).pauseShop();
            await expect(
                shop.connect(buyer1).purchaseProduct(1, 1)
            ).to.be.revertedWith("Pausable: paused");
        });
    });

    describe("Revenue Withdrawal", function () {
        const productPrice = ethers.parseUnits("50", 18);

        beforeEach(async function() {
            await shop.connect(owner).addProduct("Revenue Item", "Item for revenue", productPrice, 2);
            await shop.connect(buyer1).purchaseProduct(1, 1); // Cost 50 ZDT
        });

        it("Should allow owner to withdraw revenue", async function () {
            const shopAddress = await shop.getAddress();
            const initialOwnerZDTBalance = await zdtToken.balanceOf(owner.address);
            const shopZDTBalance = await zdtToken.balanceOf(shopAddress); // Should be 50 ZDT

            expect(shopZDTBalance).to.equal(productPrice);

            await expect(shop.connect(owner).withdrawRevenue())
                .to.emit(shop, "RevenueWithdrawn")
                .withArgs(owner.address, shopZDTBalance);

            expect(await zdtToken.balanceOf(shopAddress)).to.equal(0);
            expect(await zdtToken.balanceOf(owner.address)).to.equal(initialOwnerZDTBalance + shopZDTBalance);
            // Total revenue variable in contract is not reset by withdraw.
            expect(await shop.totalRevenue()).to.equal(productPrice);
        });

        it("Should prevent non-owner from withdrawing revenue", async function () {
            await expect(
                shop.connect(buyer1).withdrawRevenue()
            ).to.be.revertedWithCustomError(shop, "OwnableUnauthorizedAccount");
        });

        it("Should revert if no revenue to withdraw", async function() {
            // First withdraw all existing revenue
            await shop.connect(owner).withdrawRevenue();
            // Attempt to withdraw again
            await expect(
                shop.connect(owner).withdrawRevenue()
            ).to.be.revertedWith("No revenue to withdraw");
        });
    });

    describe("Pausable Shop", function () {
        it("Should allow owner to pause and unpause the shop", async function () {
            await shop.connect(owner).pauseShop();
            expect(await shop.paused()).to.be.true;
            await shop.connect(owner).unpauseShop();
            expect(await shop.paused()).to.be.false;
        });
    });
});
