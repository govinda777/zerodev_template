// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol"; // Added Pausable

contract StakingPool is Ownable, ReentrancyGuard, Pausable { // Added Pausable
    IERC20 public immutable stakingToken;

    struct StakeInfo {
        uint256 amount;
        uint256 timestamp; // Last time rewards were calculated or stake was updated
        // uint256 rewardDebt; // Removed as per simplified calculation
    }

    mapping(address => StakeInfo) public stakes;
    mapping(address => uint256) public rewards; // Stores pending rewards

    uint256 public totalStaked;
    uint256 public rewardRate; // e.g., 100 for 1% per day, 10 for 0.1% per day. Needs to be set by owner.
    uint256 public constant REWARD_PRECISION = 10000; // For percentage calculations (e.g., 1% = 100/10000)
    uint256 public constant TIME_UNIT = 1 days; // Rewards accrue per day

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount, uint256 rewardPaid);
    event RewardsClaimed(address indexed user, uint256 reward);
    event RewardRateChanged(uint256 newRate);

    constructor(address _stakingTokenAddress, uint256 _initialRewardRate) Ownable(msg.sender) {
        stakingToken = IERC20(_stakingTokenAddress);
        rewardRate = _initialRewardRate;
    }

    function setRewardRate(uint256 _newRate) external onlyOwner {
        rewardRate = _newRate;
        emit RewardRateChanged(_newRate);
    }

    function _updateRewards(address user) internal {
        if (stakes[user].amount == 0) return; // No stake, no rewards to update.

        uint256 pending = calculatePendingRewards(user);
        if (pending > 0) {
            rewards[user] += pending;
        }
        // Always update timestamp to prevent double counting for the same period in subsequent calls.
        stakes[user].timestamp = block.timestamp;
    }

    function stake(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Cannot stake 0");

        _updateRewards(msg.sender); // Update rewards before changing stake amount

        require(stakingToken.transferFrom(msg.sender, address(this), amount), "Token transfer failed");

        stakes[msg.sender].amount += amount;
        // stakes[msg.sender].timestamp = block.timestamp; // Timestamp updated in _updateRewards
        totalStaked += amount;

        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) external nonReentrant whenNotPaused { // Typically whenNotPaused is not needed for unstake
        require(stakes[msg.sender].amount >= amount, "Insufficient stake");
        require(amount > 0, "Cannot unstake 0");

        _updateRewards(msg.sender); // Calculate and store pending rewards before reducing stake

        uint256 currentStake = stakes[msg.sender].amount;
        stakes[msg.sender].amount -= amount;
        totalStaked -= amount;

        uint256 rewardToPay = rewards[msg.sender];
        rewards[msg.sender] = 0; // Reset pending rewards for the user

        // Transfer staked amount + accumulated rewards
        uint256 totalToTransfer = amount + rewardToPay;

        // Ensure contract has enough tokens (staked amount + rewards)
        // This check is important if rewards are minted or come from a separate pool.
        // If rewards are just part of the stakingToken supply held by the contract,
        // this check is implicitly handled by the transfer call.
        // For this example, we assume rewards are paid from the contract's balance of stakingToken.
        require(stakingToken.balanceOf(address(this)) >= totalToTransfer, "Contract insufficient balance for unstake + rewards");

        require(stakingToken.transfer(msg.sender, totalToTransfer), "Token transfer failed");

        emit Unstaked(msg.sender, amount, rewardToPay);
    }

    function claimRewards() external nonReentrant whenNotPaused {
        _updateRewards(msg.sender); // Calculate and store pending rewards

        uint256 rewardToClaim = rewards[msg.sender];
        require(rewardToClaim > 0, "No rewards to claim");

        rewards[msg.sender] = 0; // Reset pending rewards

        require(stakingToken.balanceOf(address(this)) >= rewardToClaim, "Contract insufficient balance for rewards");
        require(stakingToken.transfer(msg.sender, rewardToClaim), "Reward transfer failed");

        emit RewardsClaimed(msg.sender, rewardToClaim);
    }

    function calculatePendingRewards(address user) public view returns (uint256) {
        StakeInfo memory stakeInfo = stakes[user];
        if (stakeInfo.amount == 0 || stakeInfo.timestamp == 0) return 0; // No stake or never staked
        if (stakeInfo.timestamp >= block.timestamp) return 0; // Timestamp is in the future or current, no rewards yet for this block

        uint256 stakingDuration = block.timestamp - stakeInfo.timestamp;
        // Rewards = amount * rate * duration / (precision * time_unit)
        return (stakeInfo.amount * rewardRate * stakingDuration) / (REWARD_PRECISION * TIME_UNIT);
    }

    // View function to see total pending rewards for a user (already accrued + newly calculated)
    function getPendingRewards(address user) external view returns (uint256) {
        return rewards[user] + calculatePendingRewards(user);
    }

    // View function for user's stake details
    function getStakeInfo(address user) external view returns (uint256 amount, uint256 timestamp) {
        StakeInfo memory stakeData = stakes[user];
        return (stakeData.amount, stakeData.timestamp);
    }

    function pauseStaking() external onlyOwner {
        _pause();
    }

    function unpauseStaking() external onlyOwner {
        _unpause();
    }
}
