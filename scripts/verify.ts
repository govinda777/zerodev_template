import { run, network } from "hardhat";
import fs from "fs";
import path from "path";

// Define a type for our deployment addresses JSON structure
interface DeployedAddresses {
  [contractName: string]: string | undefined; // Allow undefined for safety
}

// Helper function to read deployment addresses
function getDeployedAddresses(networkName: string): DeployedAddresses | null {
  const filePath = path.join(__dirname, "..", "deployments", `${networkName}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as DeployedAddresses;
  }
  console.error(`Deployment file not found for network ${networkName} at ${filePath}`);
  return null;
}

async function main() {
  const networkName = network.name;
  console.log(`Starting verification process for network: ${networkName}`);

  if (networkName === "hardhat" || networkName === "localhost") {
    console.log("Skipping verification for local network.");
    return;
  }

  const deployedAddresses = getDeployedAddresses(networkName);
  if (!deployedAddresses) {
    console.error("Could not load deployed addresses. Exiting verification.");
    return;
  }

  console.log("Loaded deployed addresses:", deployedAddresses);

  // --- ZeroDevToken ---
  const zeroDevTokenAddress = deployedAddresses.ZeroDevToken;
  if (zeroDevTokenAddress) {
    console.log(`\nVerifying ZeroDevToken at ${zeroDevTokenAddress}...`);
    try {
      await run("verify:verify", {
        address: zeroDevTokenAddress,
        constructorArguments: [], // As per its constructor
        contract: "contracts/ZeroDevToken.sol:ZeroDevToken",
      });
      console.log("ZeroDevToken verification submitted.");
    } catch (error) {
      console.error("Error verifying ZeroDevToken:", error);
    }
  } else {
    console.log("ZeroDevToken address not found, skipping its verification.");
  }

  // --- TokenFaucet ---
  const tokenFaucetAddress = deployedAddresses.TokenFaucet;
  const zdtForFaucet = deployedAddresses.ZeroDevToken; // Faucet depends on ZDT address
  if (tokenFaucetAddress && zdtForFaucet) {
    // TODO: Retrieve actual dripAmount and cooldownPeriod used during deployment
    // For now, using placeholders or assuming they are hardcoded/derivable if script is run right after deploy
    // This highlights a limitation of a standalone verify script if constructor args aren't stored.
    // The deploy.ts script is better suited for immediate verification.
    // These values should ideally be saved in the deployment JSON or deploy.ts should handle verification.
    const dripAmount = ethers.parseUnits("100", 18); // Placeholder, must match deployment
    const cooldownPeriod = 60 * 60 * 24; // Placeholder, must match deployment
    console.log(`\nVerifying TokenFaucet at ${tokenFaucetAddress}...`);
    try {
      await run("verify:verify", {
        address: tokenFaucetAddress,
        constructorArguments: [zdtForFaucet, dripAmount, cooldownPeriod],
        contract: "contracts/TokenFaucet.sol:TokenFaucet",
      });
      console.log("TokenFaucet verification submitted.");
    } catch (error) {
      console.error("Error verifying TokenFaucet:", error);
    }
  } else {
    console.log("TokenFaucet or its dependent ZeroDevToken address not found, skipping verification.");
  }

  // --- TokenShop ---
  const tokenShopAddress = deployedAddresses.TokenShop;
  const zdtForShop = deployedAddresses.ZeroDevToken; // Shop depends on ZDT address
  if (tokenShopAddress && zdtForShop) {
    console.log(`\nVerifying TokenShop at ${tokenShopAddress}...`);
    try {
      await run("verify:verify", {
        address: tokenShopAddress,
        constructorArguments: [zdtForShop],
        contract: "contracts/TokenShop.sol:TokenShop",
      });
      console.log("TokenShop verification submitted.");
    } catch (error) {
      console.error("Error verifying TokenShop:", error);
    }
  } else {
    console.log("TokenShop or its dependent ZeroDevToken address not found, skipping verification.");
  }

  // --- StakingPool ---
  const stakingPoolAddress = deployedAddresses.StakingPool;
  const zdtForStaking = deployedAddresses.ZeroDevToken; // StakingPool depends on ZDT
  if (stakingPoolAddress && zdtForStaking) {
    // TODO: Retrieve actual initialRewardRate used during deployment.
    const initialRewardRate = 100; // Placeholder, must match deployment
    console.log(`\nVerifying StakingPool at ${stakingPoolAddress}...`);
    try {
      await run("verify:verify", {
        address: stakingPoolAddress,
        constructorArguments: [zdtForStaking, initialRewardRate],
        contract: "contracts/StakingPool.sol:StakingPool",
      });
      console.log("StakingPool verification submitted.");
    } catch (error) {
      console.error("Error verifying StakingPool:", error);
    }
  } else {
    console.log("StakingPool or its dependent ZeroDevToken address not found, skipping verification.");
  }

  // --- NFTRewards ---
  const nftRewardsAddress = deployedAddresses.NFTRewards;
  if (nftRewardsAddress) {
    // TODO: Retrieve actual name and symbol used during deployment.
    const nftName = "ZeroDev Achievement NFT"; // Placeholder
    const nftSymbol = "ZAN"; // Placeholder
    console.log(`\nVerifying NFTRewards at ${nftRewardsAddress}...`);
    try {
      await run("verify:verify", {
        address: nftRewardsAddress,
        constructorArguments: [nftName, nftSymbol],
        contract: "contracts/NFTRewards.sol:NFTRewards",
      });
      console.log("NFTRewards verification submitted.");
    } catch (error) {
      console.error("Error verifying NFTRewards:", error);
    }
  } else {
    console.log("NFTRewards address not found, skipping its verification.");
  }

  console.log("\nVerification script finished. Check Etherscan for status.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
