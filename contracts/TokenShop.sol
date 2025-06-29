// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract TokenShop is Ownable, ReentrancyGuard, Pausable {
    IERC20 public immutable token;

    struct Product {
        uint256 id;
        string name;
        string description;
        uint256 price;
        uint256 stock;
        bool isActive; // Renamed from 'active' for clarity
    }

    mapping(uint256 => Product) public products;
    mapping(address => mapping(uint256 => uint256)) public purchases; // user => productId => quantity

    uint256 public nextProductId = 1;
    uint256 public totalRevenueCollected; // Renamed from totalRevenue for clarity

    event ProductAdded(uint256 indexed productId, string name, uint256 price, uint256 initialStock);
    event ProductUpdated(uint256 indexed productId, string name, uint256 price, uint256 stock, bool isActive);
    event ProductPurchased(address indexed buyer, uint256 indexed productId, uint256 quantity, uint256 totalCost);
    event ProductStockUpdated(uint256 indexed productId, uint256 newStock);
    event RevenueWithdrawn(address indexed to, uint256 amount);

    constructor(address tokenAddress) Ownable(msg.sender) {
        require(tokenAddress != address(0), "Token address cannot be zero");
        token = IERC20(tokenAddress);
    }

    function addProduct(
        string memory name,
        string memory description,
        uint256 price,
        uint256 stock
    ) external onlyOwner {
        require(bytes(name).length > 0, "Product name cannot be empty");
        require(price > 0, "Product price must be greater than zero");

        products[nextProductId] = Product({
            id: nextProductId,
            name: name,
            description: description,
            price: price,
            stock: stock,
            isActive: true
        });

        emit ProductAdded(nextProductId, name, price, stock);
        nextProductId++;
    }

    function updateProduct(
        uint256 productId,
        string memory name,
        string memory description,
        uint256 price,
        uint256 stock,
        bool isActive
    ) external onlyOwner {
        require(productId > 0 && productId < nextProductId, "Invalid product ID");
        require(bytes(name).length > 0, "Product name cannot be empty");
        require(price > 0, "Product price must be greater than zero");

        Product storage product = products[productId];
        product.name = name;
        product.description = description;
        product.price = price;
        product.stock = stock;
        product.isActive = isActive;

        emit ProductUpdated(productId, name, price, stock, isActive);
    }

    function purchaseProduct(uint256 productId, uint256 quantity)
        external
        nonReentrant
        whenNotPaused
    {
        require(productId > 0 && productId < nextProductId, "Invalid product ID");
        require(quantity > 0, "Quantity must be greater than zero");

        Product storage product = products[productId];
        require(product.isActive, "Product not active");
        require(product.stock >= quantity, "Insufficient stock");

        uint256 totalCost = product.price * quantity;
        // Check for overflow with totalCost, though less likely with typical ERC20 decimals and prices
        require(totalCost / quantity == product.price, "Total cost calculation overflow");

        uint256 allowance = token.allowance(msg.sender, address(this));
        require(allowance >= totalCost, "Check token allowance");
        require(token.transferFrom(msg.sender, address(this), totalCost), "Payment failed");

        product.stock -= quantity;
        purchases[msg.sender][productId] += quantity;
        totalRevenueCollected += totalCost;

        emit ProductPurchased(msg.sender, productId, quantity, totalCost);
        emit ProductStockUpdated(productId, product.stock);
    }

    function withdrawRevenue() external onlyOwner {
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "No revenue to withdraw");
        // To prevent withdrawing more than collected if other tokens are accidentally sent.
        uint256 amountToWithdraw = balance < totalRevenueCollected ? balance : totalRevenueCollected;

        require(token.transfer(owner(), amountToWithdraw), "Revenue transfer failed");
        totalRevenueCollected -= amountToWithdraw; // Adjust collected revenue
        emit RevenueWithdrawn(owner(), amountToWithdraw);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // View function to get product details
    function getProduct(uint256 productId) external view returns (Product memory) {
        require(productId > 0 && productId < nextProductId, "Invalid product ID");
        return products[productId];
    }
}
