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
        bool active;
    }

    mapping(uint256 => Product) public products;
    mapping(address => mapping(uint256 => uint256)) public purchases; // buyer => productId => quantity

    uint256 public nextProductId = 1;
    uint256 public totalRevenue; // In token units

    event ProductAdded(uint256 indexed productId, string name, uint256 price, uint256 stock);
    event ProductUpdated(uint256 indexed productId, string name, uint256 price, uint256 stock, bool active);
    event ProductPurchased(address indexed buyer, uint256 indexed productId, uint256 quantity, uint256 totalCost);
    event RevenueWithdrawn(address indexed owner, uint256 amount);

    constructor(address _tokenAddress) Ownable(msg.sender) {
        token = IERC20(_tokenAddress);
    }

    function addProduct(
        string memory name,
        string memory description,
        uint256 price,
        uint256 stock
    ) external onlyOwner {
        require(price > 0, "Product price must be greater than 0");
        products[nextProductId] = Product({
            id: nextProductId,
            name: name,
            description: description,
            price: price,
            stock: stock,
            active: true
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
        bool active
    ) external onlyOwner {
        require(productId > 0 && productId < nextProductId, "Invalid product ID");
        require(price > 0, "Product price must be greater than 0");
        Product storage product = products[productId];

        product.name = name;
        product.description = description;
        product.price = price;
        product.stock = stock;
        product.active = active;

        emit ProductUpdated(productId, name, price, stock, active);
    }

    function purchaseProduct(uint256 productId, uint256 quantity)
        external
        nonReentrant
        whenNotPaused
    {
        require(quantity > 0, "Quantity must be greater than 0");
        Product storage product = products[productId];
        require(product.active, "Product not active");
        require(product.stock >= quantity, "Insufficient stock");

        uint256 totalCost = product.price * quantity;
        // Check allowance first
        require(token.allowance(msg.sender, address(this)) >= totalCost, "Token allowance insufficient");
        require(token.transferFrom(msg.sender, address(this), totalCost), "Payment failed");

        product.stock -= quantity;
        purchases[msg.sender][productId] += quantity;
        totalRevenue += totalCost;

        emit ProductPurchased(msg.sender, productId, quantity, totalCost);
    }

    function withdrawRevenue() external onlyOwner {
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "No revenue to withdraw");
        require(token.transfer(owner(), balance), "Transfer failed");
        emit RevenueWithdrawn(owner(), balance);
    }

    function getProduct(uint256 productId) external view returns (Product memory) {
        require(productId > 0 && productId < nextProductId, "Invalid product ID");
        return products[productId];
    }

    function pauseShop() external onlyOwner {
        _pause();
    }

    function unpauseShop() external onlyOwner {
        _unpause();
    }
}
