import { HardhatUserConfig } from "hardhat/config";
// These will be installed in the next step. For now, keep them commented
// if we were to compile right after this file creation.
// However, we install them before the first compile attempt.
import "@nomicfoundation/hardhat-toolbox"; // This line will cause an error if toolbox isn't installed yet.
                                        // But we install it before compile.
import "dotenv/config";
import "@typechain/hardhat";

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
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
  },
  paths: {
    sources: "./contracts",
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
