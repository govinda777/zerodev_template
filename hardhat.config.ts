import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "dotenv/config";
import "solidity-coverage";
// import "hardhat-gas-reporter"; // Uncomment if needed

const SEPOLIA_RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.infura.io/v3/YOUR_KEY";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24", // Pinning to a specific version like 0.8.20 or higher as per prompt
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
      // allowUnlimitedContractSize: true, // Uncomment if needed for very large contracts
    },
    localhost: {
      chainId: 31337,
      url: "http://127.0.0.1:8545/",
      // accounts: [PRIVATE_KEY], // Optional: if you want to use a specific account
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: PRIVATE_KEY !== "0x" ? [PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY,
    },
  },
  gasReporter: { // Optional: uncomment and configure if needed
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
    // coinmarketcap: process.env.COINMARKETCAP_API_KEY, // Optional
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache_hardhat", // Renamed from ./cache to avoid conflict with Next.js
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 40000, // 40 seconds
  },
};

export default config;
