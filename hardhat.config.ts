import { HardhatUserConfig } from "hardhat/config";
import "dotenv/config";

// Minimal imports - let's see if toolbox was the issue
// We need typechain for generating types, and a way for hardhat to find solidity files.
// Hardhat's core compile task should handle Solidity without needing a specific plugin for that.
// However, to use ethers.js related features in tests/scripts, we'd need @nomicfoundation/hardhat-ethers.
// For now, let's focus on pure compilation.
import "@typechain/hardhat"; // For TypeChain integration
// The Solidity compilation capability is built into Hardhat; specific plugins like
// @nomicfoundation/hardhat-solc or similar are not usually needed explicitly unless
// using very custom solc versions or configurations.

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {},
  },
  // gasReporter can be removed if it's causing issues, but unlikely for discovery.
  // gasReporter: {
  //   enabled: process.env.REPORT_GAS === "true",
  //   currency: "USD",
  // },
  paths: {
    sources: "./contracts", // This is the crucial line
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  typechain: {
    outDir: "src/types/typechain",
    target: "ethers-v6",
  },
};

export default config;
