/* global task ethers */

import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "hardhat-contract-sizer";
import "solidity-coverage";
//import './tasks/generateDiamondABI.js';
import * as dotenv from "dotenv";
import "@typechain/hardhat";
import { BigNumber } from "ethers";

dotenv.config({ path: __dirname + "/.env" });

require("./tasks/deployUpgrade.ts");
require("./tasks/addBaadgeSvgs.ts");
require("./tasks/mintBaadgeSvgs.ts");
require("./tasks/baadgeAirdrop.ts");
require("./tasks/updateItemDimensions.ts");
require("./tasks/updateSvgs.ts");
require("./tasks/updateItemSideDimensions.ts");
require("./tasks/batchDeposit.ts");
require("./tasks/rarityPayouts");
require("./tasks/grantXP");
require("./tasks/grantXP_snapshot");
require("./tasks/grantXP_minigame");
require("./tasks/grantXP_aavegotchis");
require("./tasks/addItemTypes");
require("./tasks/addWearableSets");
require("./tasks/grantXP_customValues");
require("./tasks/generateDiamondABI");

// You have to export an object to set up your config
// This object can have the following optional entries:
// defaultNetwork, networks, solc, and paths.
// Go to https://buidler.dev/config/ to learn more
export default {
  etherscan: {
    apiKey: process.env.POLYGON_API_KEY,
  },
  networks: {
    hardhat: {
      forking: {
        url: process.env.MATIC_URL,
        timeout: 12000000,
        // blockNumber: 27108687,
      },
      blockGasLimit: 20000000,
      timeout: 120000,
      gas: "auto",
    },
    localhost: {
      timeout: 16000000,
    },
    matic: {
      url: process.env.MATIC_URL,
      accounts: [process.env.ITEM_MANAGER],
      // blockGasLimit: 20000000,
      // gasPrice: 1000000000,
      maxFeePerGas: BigNumber.from("80").mul(1e9),
      maxPriorityFeePerGas: BigNumber.from("50").mul(1e9),
      gasLimit: 2000000,
      timeout: 90000,
    },
    // mumbai: {
    //   url: 'https://rpc-mumbai.matic.today',
    //   accounts: [process.env.SECRET],
    //   blockGasLimit: 20000000,
    //   gasPrice: 1000000000
    // },
    // gorli: {
    //   url: process.env.GORLI,
    //   accounts: [process.env.SECRET],
    //   blockGasLimit: 20000000,
    //   gasPrice: 2100000000
    // },
    // kovan: {
    //   url: process.env.KOVAN_URL,
    //   accounts: [process.env.SECRET],
    //   gasPrice: 5000000000
    // },
    // ethereum: {
    //   url: process.env.MAINNET_URL,
    //   accounts: [process.env.SECRET],
    //   blockGasLimit: 20000000,
    //   gasPrice: 2100000000
    // }
  },
  gasReporter: {
    currency: "USD",
    gasPrice: 100,
    enabled: false,
  },
  contractSizer: {
    alphaSort: false,
    runOnCompile: false,
    disambiguatePaths: true,
  },
  mocha: {
    timeout: 2000000,
  },
  // This is a sample solc configuration that specifies which version of solc to use
  solidity: {
    compilers: [
      {
        version: "0.8.13",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.1",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.7.4",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
};
