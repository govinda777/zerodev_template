import { ethers, network } from "hardhat";
import fs from "fs";
import path from "path";
import { ZeroDevToken, TokenShop, TokenFaucet, StakingPool, NFTRewards } from "../src/types/typechain";

// Define a type for our deployment addresses JSON structure
interface DeployedAddresses {
  ZeroDevToken?: string;
  TokenFaucet?: string;
  TokenShop?: string;
  StakingPool?: string;
  NFTRewards?: string;
}

// Helper function to read deployment addresses
function getDeployedAddresses(networkName: string): DeployedAddresses {
  const filePath = path.join(__dirname, "..", "deployments", `${networkName}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as DeployedAddresses;
  }
  throw new Error(`Deployment file not found for network ${networkName} at ${filePath}`);
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const networkName = network.name;
  console.log(`Setting up initial state for contracts on network: ${networkName} with account: ${deployer.address}`);

  const addresses = getDeployedAddresses(networkName);

  if (!addresses.ZeroDevToken || !addresses.TokenShop || !addresses.TokenFaucet || !addresses.StakingPool || !addresses.NFTRewards) {
    throw new Error("One or more contract addresses are missing in the deployment file.");
  }

  // Get contract instances
  const zeroDevToken = (await ethers.getContractAt("ZeroDevToken", addresses.ZeroDevToken, deployer)) as unknown as ZeroDevToken;
  const tokenShop = (await ethers.getContractAt("TokenShop", addresses.TokenShop, deployer)) as unknown as TokenShop;
  const tokenFaucet = (await ethers.getContractAt("TokenFaucet", addresses.TokenFaucet, deployer)) as unknown as TokenFaucet;
  const stakingPool = (await ethers.getContractAt("StakingPool", addresses.StakingPool, deployer)) as unknown as StakingPool;
  const nftRewards = (await ethers.getContractAt("NFTRewards", addresses.NFTRewards, deployer)) as unknown as NFTRewards;

  console.log("Contract instances retrieved.");

  // 1. Add initial products to TokenShop
  console.log("\nAdding initial products to TokenShop...");
  const products = [
    { name: "ZDT Power User Badge", description: "A shiny badge for power users.", price: ethers.parseUnits("50", 18), stock: 1000 },
    { name: "Gas Rebate Voucher", description: "Get a rebate on your next transaction.", price: ethers.parseUnits("25", 18), stock: 500 },
    { name: "Exclusive Skin Shard", description: "Collect 3 to unlock an exclusive skin.", price: ethers.parseUnits("100", 18), stock: 200 },
  ];

  for (const product of products) {
    try {
      const tx = await tokenShop.addProduct(product.name, product.description, product.price, product.stock);
      await tx.wait();
      console.log(`Added product: ${product.name}`);
    } catch (error: any) {
      // Check if product already exists (not standard, but good for re-runnability if ids are predictable)
      // For this contract, addProduct always creates a new ID, so this check is less relevant unless we query first.
      console.warn(`Could not add product "${product.name}": ${error.message.substring(0,100)}`);
    }
  }
  console.log("Initial products added to TokenShop.");

  // 2. Fund Faucet with tokens (if it's not a minter, or as a backup)
  // The deploy script already made Faucet a minter on ZeroDevToken.
  // If the Faucet were to dispense from its own balance instead of minting, this would be critical.
  // For now, we can skip this as the Faucet can mint its own tokens.
  // const faucetFunding = ethers.parseUnits("100000", 18); // 100,000 ZDT
  // console.log(`\n(Optional) Ensuring TokenFaucet has ZDT to dispense (current model uses minting)...`);
  // try {
  //    const tx = await zeroDevToken.transfer(await tokenFaucet.getAddress(), faucetFunding);
  //    await tx.wait();
  //    console.log(`TokenFaucet directly funded with ${ethers.formatUnits(faucetFunding, 18)} ZDT.`);
  // } catch (error: any) {
  //    console.warn(`Could not directly fund TokenFaucet: ${error.message}`);
  // }


  // 3. Setup/Verify Staking Rewards
  // The deploy script already funded the StakingPool. We can verify its balance.
  // We also set an initial reward rate during deployment.
  console.log("\nVerifying StakingPool setup...");
  const currentRewardRate = await stakingPool.rewardRate();
  console.log(`StakingPool current reward rate: ${currentRewardRate.toString()}`);
  const stakingPoolBalance = await zeroDevToken.balanceOf(await stakingPool.getAddress());
  console.log(`StakingPool ZDT balance (for rewards): ${ethers.formatUnits(stakingPoolBalance, 18)} ZDT`);
  // if (stakingPoolBalance < ethers.parseUnits("10000", 18)) { // Arbitrary low threshold
  //   console.warn("StakingPool balance is low. Consider funding more for rewards.");
  // }

  // 4. Configure permissions (Example: NFTRewards minter)
  // Decide which contract or address should be allowed to mint NFTs.
  // For example, if the StakingPool should award NFTs for certain achievements.
  // Or if the TokenShop should award NFTs for large purchases.
  // For now, only the owner of NFTRewards can mint.
  // Example: Grant minting rights on NFTRewards to StakingPool (if StakingPool had such a feature)
  // console.log(`\n(Example) Granting NFTRewards minting rights to StakingPool (${await stakingPool.getAddress()})...`);
  // This would require NFTRewards to have an `addMinter` or similar role management function.
  // The current NFTRewards.sol only allows `onlyOwner` to mint.
  // So, this step is more conceptual for this version of NFTRewards.sol
  console.log("\nNFTRewards minting is currently owner-only. No additional permissions to set up in this script.");


  // 5. (Optional) Mint some initial NFTs if needed for bootstrapping the ecosystem
  console.log("\n(Optional) Minting some initial NFTs...");
  const sampleNFTRecipient = deployer.address; // Mint to deployer for now
  const nftsToMint = [
    { uri: "bafkreihdwdcefgh4gridvut7k4kfcfaxwcnbeo732gm2x73nvewoax77by", rarity: "Common" }, // Example IPFS CIDs
    { uri: "bafkreiem4twkq42254skdqxkyffr3nd6xu2j2k4yefy3j5c5z7z3z7z3z7", rarity: "Rare" },
  ];
  if ((await nftRewards.totalSupply()) == BigInt(0)) { // Only mint if no NFTs exist yet
      for (const nft of nftsToMint) {
        try {
            const tx = await nftRewards.safeMint(sampleNFTRecipient, nft.uri, nft.rarity);
            await tx.wait();
            const newId = await nftRewards.getCurrentTokenId(); // Or read from event
            console.log(`Minted NFT with ID ${newId} to ${sampleNFTRecipient} (URI: ${nft.uri}, Rarity: ${nft.rarity})`);
        } catch (error: any) {
            console.warn(`Could not mint sample NFT (URI: ${nft.uri}): ${error.message.substring(0,100)}`);
        }
      }
      console.log("Initial sample NFTs minted.");
  } else {
      console.log("NFTs already exist, skipping initial minting of samples.");
  }


  console.log("\nInitial state setup script finished.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
