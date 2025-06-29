// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract TokenFaucet is Ownable, Pausable, ReentrancyGuard {
    IERC20 public token; // Made mutable to allow token update if necessary by owner
    uint256 public withdrawalAmount; // Amount of tokens per claim
    uint256 public cooldownTime;     // Cooldown period in seconds

    mapping(address => uint256) public lastClaimTime; // User's last claim timestamp

    event TokensClaimed(address indexed recipient, uint256 amount);
    event FaucetFunded(address indexed funder, uint256 amount);
    event WithdrawalAmountUpdated(uint256 oldAmount, uint256 newAmount);
    event CooldownTimeUpdated(uint256 oldTime, uint256 newTime);
    event TokenAddressUpdated(address indexed oldToken, address indexed newToken);

    constructor(
        address tokenAddress,
        uint256 _initialWithdrawalAmount,
        uint256 _initialCooldownTime
    ) Ownable(msg.sender) {
        require(tokenAddress != address(0), "Token address cannot be zero");
        require(_initialWithdrawalAmount > 0, "Withdrawal amount must be positive");
        require(_initialCooldownTime > 0, "Cooldown time must be positive");

        token = IERC20(tokenAddress);
        withdrawalAmount = _initialWithdrawalAmount;
        cooldownTime = _initialCooldownTime;
    }

    function requestTokens() external nonReentrant whenNotPaused {
        require(block.timestamp >= lastClaimTime[msg.sender] + cooldownTime, "Cooldown period not over");

        uint256 currentWithdrawalAmount = withdrawalAmount; // Use local variable for consistency in checks and transfer
        uint256 contractBalance = token.balanceOf(address(this));
        require(contractBalance >= currentWithdrawalAmount, "Faucet is empty or has insufficient funds");

        lastClaimTime[msg.sender] = block.timestamp;
        require(token.transfer(msg.sender, currentWithdrawalAmount), "Token transfer failed");

        emit TokensClaimed(msg.sender, currentWithdrawalAmount);
    }

    function fundFaucet(uint256 amount) external {
        require(amount > 0, "Amount must be positive");
        // Allow anyone to fund the faucet by transferring tokens to this contract's address.
        // This function specifically uses transferFrom, implying the faucet contract needs approval.
        // A simpler way for anyone to fund is just to send tokens to the faucet's address.
        // If using this function, msg.sender must have approved the faucet contract to spend their tokens.
        require(token.transferFrom(msg.sender, address(this), amount), "Token transfer for funding failed");
        emit FaucetFunded(msg.sender, amount);
    }

    function withdrawExcessTokens(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be positive");
        uint256 contractBalance = token.balanceOf(address(this));
        require(contractBalance >= amount, "Insufficient balance to withdraw");
        require(token.transfer(owner(), amount), "Withdrawal failed");
    }

    function setWithdrawalAmount(uint256 newAmount) external onlyOwner {
        require(newAmount > 0, "Withdrawal amount must be positive");
        emit WithdrawalAmountUpdated(withdrawalAmount, newAmount);
        withdrawalAmount = newAmount;
    }

    function setCooldownTime(uint256 newCooldown) external onlyOwner {
        require(newCooldown > 0, "Cooldown time must be positive");
        emit CooldownTimeUpdated(cooldownTime, newCooldown);
        cooldownTime = newCooldown;
    }

    function setTokenAddress(address newTokenAddress) external onlyOwner {
        require(newTokenAddress != address(0), "New token address cannot be zero");
        emit TokenAddressUpdated(address(token), newTokenAddress);
        token = IERC20(newTokenAddress);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function getCooldownEndTime(address user) external view returns (uint256) {
        if (lastClaimTime[user] == 0) { // Never claimed before
             return 0; // Or block.timestamp, depending on desired UX for first-time claimers. 0 means can claim now.
        }
        return lastClaimTime[user] + cooldownTime;
    }

    function getFaucetDetails() external view returns (address tokenAddress, uint256 currentWithdrawalAmount, uint256 currentCooldownTime, uint256 faucetBalance) {
        return (address(token), withdrawalAmount, cooldownTime, token.balanceOf(address(this)));
    }
}
