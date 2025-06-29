// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./ZeroDevToken.sol"; // Assuming ZeroDevToken has minting capability accessible by faucet

contract TokenFaucet is Ownable, Pausable {
    ZeroDevToken public immutable token; // Use ZeroDevToken directly for minting
    uint256 public dripAmount;
    uint256 public cooldownPeriod;

    mapping(address => uint256) public lastClaimedTimestamp;

    event TokensClaimed(address indexed recipient, uint256 amount);
    event DripAmountChanged(uint256 newAmount);
    event CooldownChanged(uint256 newCooldown);

    constructor(
        address _tokenAddress,
        uint256 _dripAmount,
        uint256 _cooldownPeriod
    ) Ownable(msg.sender) {
        require(_tokenAddress != address(0), "Invalid token address");
        token = ZeroDevToken(_tokenAddress); // Initialize with ZeroDevToken instance
        dripAmount = _dripAmount;
        cooldownPeriod = _cooldownPeriod;
    }

    function requestTokens() external whenNotPaused {
        require(block.timestamp >= lastClaimedTimestamp[msg.sender] + cooldownPeriod, "Cooldown active");

        lastClaimedTimestamp[msg.sender] = block.timestamp;

        // The Faucet contract itself needs to be a minter on the ZeroDevToken contract
        // or have tokens transferred to it that it can then dispense.
        // Assuming Faucet is a minter:
        try token.mint(msg.sender, dripAmount) {
             emit TokensClaimed(msg.sender, dripAmount);
        } catch {
            revert("Faucet: Token minting failed. Ensure Faucet contract has minting rights or sufficient balance.");
        }
    }

    function setDripAmount(uint256 _newAmount) external onlyOwner {
        require(_newAmount > 0, "Drip amount must be positive");
        dripAmount = _newAmount;
        emit DripAmountChanged(_newAmount);
    }

    function setCooldownPeriod(uint256 _newCooldown) external onlyOwner {
        // Consider adding a reasonable minimum cooldown if necessary
        cooldownPeriod = _newCooldown;
        emit CooldownChanged(_newCooldown);
    }

    // Allow owner to withdraw any tokens accidentally sent to this contract
    // (Only if these are not the tokens intended for dripping, e.g. another ERC20)
    function withdrawOtherTokens(address _otherTokenAddress, uint256 _amount) external onlyOwner {
        require(_otherTokenAddress != address(token), "Cannot withdraw faucet's primary token this way");
        IERC20 otherToken = IERC20(_otherTokenAddress);
        require(otherToken.transfer(owner(), _amount), "Withdraw failed");
    }

    // In case the Faucet is not a minter but holds tokens to dispense
    // The owner would need to fund this contract with ZeroDevToken
    function fundFaucet(uint256 _amount) external {
        // This function is if the faucet dispenses from its own balance rather than minting.
        // Requires the sender to approve tokens to this contract first.
        // For the current design (faucet as minter), this is not strictly needed for ZDT
        // but could be useful if it were to dispense pre-minted tokens.
        require(token.transferFrom(msg.sender, address(this), _amount), "Funding transfer failed");
    }

    function pauseFaucet() external onlyOwner {
        _pause();
    }

    function unpauseFaucet() external onlyOwner {
        _unpause();
    }

    function canClaim(address _user) external view returns (bool) {
        return block.timestamp >= lastClaimedTimestamp[_user] + cooldownPeriod;
    }
}
