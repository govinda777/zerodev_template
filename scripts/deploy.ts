import { ethers, network, run } from "hardhat";
import fs from "fs";
import path from "path";

// Define a type for our deployment addresses JSON structure
interface DeployedAddresses {
  [contractName: string]: string;
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  const deployedAddresses: DeployedAddresses = {};

  // 1. Deploy ZeroDevToken
  console.log("\nDeploying ZeroDevToken...");
  const ZeroDevTokenFactory = await ethers.getContractFactory("ZeroDevToken");
  const zeroDevToken = await ZeroDevTokenFactory.deploy();
  await zeroDevToken.waitForDeployment();
  const zeroDevTokenAddress = await zeroDevToken.getAddress();
  deployedAddresses["ZeroDevToken"] = zeroDevTokenAddress;
  console.log(`ZeroDevToken deployed to: ${zeroDevTokenAddress}`);

  // 2. Deploy TokenFaucet
  // Constructor args: address _tokenAddress, uint256 _dripAmount, uint256 _cooldownPeriod
  const dripAmount = ethers.parseUnits("100", 18); // 100 ZDT
  const cooldownPeriod = 60 * 60 * 24; // 24 hours
  console.log("\nDeploying TokenFaucet...");
  const TokenFaucetFactory = await ethers.getContractFactory("TokenFaucet");
  const tokenFaucet = await TokenFaucetFactory.deploy(zeroDevTokenAddress, dripAmount, cooldownPeriod);
  await tokenFaucet.waitForDeployment();
  const tokenFaucetAddress = await tokenFaucet.getAddress();
  deployedAddresses["TokenFaucet"] = tokenFaucetAddress;
  console.log(`TokenFaucet deployed to: ${tokenFaucetAddress}`);

  // As per TokenFaucet.sol, the faucet needs minting rights on ZeroDevToken.
  // Grant minting role to the Faucet contract.
  console.log(`\nGranting minting role to TokenFaucet (${tokenFaucetAddress}) on ZeroDevToken...`);
  const addMinterTx = await zeroDevToken.connect(deployer).addMinter(tokenFaucetAddress);
  await addMinterTx.wait();
  console.log("Minter role granted to TokenFaucet.");


  // 3. Deploy TokenShop
  // Constructor args: address _tokenAddress
  console.log("\nDeploying TokenShop...");
  const TokenShopFactory = await ethers.getContractFactory("TokenShop");
  const tokenShop = await TokenShopFactory.deploy(zeroDevTokenAddress);
  await tokenShop.waitForDeployment();
  const tokenShopAddress = await tokenShop.getAddress();
  deployedAddresses["TokenShop"] = tokenShopAddress;
  console.log(`TokenShop deployed to: ${tokenShopAddress}`);

  // 4. Deploy StakingPool
  // Constructor args: address _stakingTokenAddress, uint256 _initialRewardRate
  const initialRewardRate = 100; // Example: 1% per day (100 / 10000)
  console.log("\nDeploying StakingPool...");
  const StakingPoolFactory = await ethers.getContractFactory("StakingPool");
  const stakingPool = await StakingPoolFactory.deploy(zeroDevTokenAddress, initialRewardRate);
  await stakingPool.waitForDeployment();
  const stakingPoolAddress = await stakingPool.getAddress();
  deployedAddresses["StakingPool"] = stakingPoolAddress;
  console.log(`StakingPool deployed to: ${stakingPoolAddress}`);

  // Fund StakingPool with some ZDT for rewards (as per StakingPool.test.ts setup)
  // This assumes rewards are paid from the pool's balance.
  const rewardFundingAmount = ethers.parseUnits("500000", 18); // 500,000 ZDT
  console.log(`\nFunding StakingPool with ${ethers.formatUnits(rewardFundingAmount, 18)} ZDT for rewards...`);
  const fundTx = await zeroDevToken.connect(deployer).transfer(stakingPoolAddress, rewardFundingAmount);
  await fundTx.wait();
  console.log("StakingPool funded for rewards.");


  // 5. Deploy NFTRewards
  // Constructor args: string memory name, string memory symbol
  const nftName = "ZeroDev Achievement NFT";
  const nftSymbol = "ZAN";
  console.log("\nDeploying NFTRewards...");
  const NFTRewardsFactory = await ethers.getContractFactory("NFTRewards");
  const nftRewards = await NFTRewardsFactory.deploy(nftName, nftSymbol);
  await nftRewards.waitForDeployment();
  const nftRewardsAddress = await nftRewards.getAddress();
  deployedAddresses["NFTRewards"] = nftRewardsAddress;
  console.log(`NFTRewards deployed to: ${nftRewardsAddress}`);


  // Save deployment addresses
  const networkName = network.name;
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  const filePath = path.join(deploymentsDir, `${networkName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(deployedAddresses, null, 2));
  console.log(`\nDeployment addresses saved to ${filePath}`);

  // Optional: Verify contracts on Etherscan if not on a local network
  if (networkName !== "hardhat" && networkName !== "localhost") {
    console.log("\nVerifying contracts on Etherscan...");
    try {
      await run("verify:verify", {
        address: zeroDevTokenAddress,
        constructorArguments: [],
        contract: "contracts/ZeroDevToken.sol:ZeroDevToken"
      });
      await run("verify:verify", {
        address: tokenFaucetAddress,
        constructorArguments: [zeroDevTokenAddress, dripAmount, cooldownPeriod],
        contract: "contracts/TokenFaucet.sol:TokenFaucet"
      });
      await run("verify:verify", {
        address: tokenShopAddress,
        constructorArguments: [zeroDevTokenAddress],
        contract: "contracts/TokenShop.sol:TokenShop"
      });
      await run("verify:verify", {
        address: stakingPoolAddress,
        constructorArguments: [zeroDevTokenAddress, initialRewardRate],
        contract: "contracts/StakingPool.sol:StakingPool"
      });
      await run("verify:verify", {
        address: nftRewardsAddress,
        constructorArguments: [nftName, nftSymbol],
        contract: "contracts/NFTRewards.sol:NFTRewards"
      });
      console.log("Verification tasks submitted.");
    } catch (error) {
      console.error("Error during contract verification:", error);
    }
  }

  console.log("\nDeployment script finished.");
  // The setup-initial-state.ts script would be run separately after this.
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
