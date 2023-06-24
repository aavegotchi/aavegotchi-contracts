/* global task ethers */

// import "@nomiclabs/hardhat-waffle";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomiclabs/hardhat-ethers";
import "hardhat-contract-sizer";
import "@nomiclabs/hardhat-etherscan";
import "solidity-coverage";
//import './tasks/generateDiamondABI.js';
import * as dotenv from "dotenv";
import "@typechain/hardhat";
import { BigNumber } from "ethers";

require("hardhat-tracer");

dotenv.config({ path: __dirname + "/.env" });

//  require("./tasks/verifyFacet.js");
require("./tasks/deployUpgrade.ts");
require("./tasks/addBaadgeSvgs.ts");
require("./tasks/mintBaadgeSvgs.ts");
require("./tasks/baadgeAirdrop.ts");
require("./tasks/updateItemDimensions.ts");
require("./tasks/updateSvgs.ts");
require("./tasks/updateItemSideDimensions.ts");
require("./tasks/batchDeposit.ts");
require("./tasks/rarityPayouts");
require("./tasks/grantXP_snapshot");
require("./tasks/grantXP_minigame");
require("./tasks/grantXP");
require("./tasks/addItemTypes");
require("./tasks/addWearableSets");
require("./tasks/grantXP_customValues");
require("./tasks/generateDiamondABI");
require("./tasks/updateWearableExceptions");
require("./tasks/deployXPDrop");

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
        // blockNumber: 31480850,
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
      // url: 'https://rpc-mainnet.maticvigil.com/',
      accounts: [process.env.ITEM_MANAGER],
      // blockGasLimit: 20000000,
      blockGasLimit: 20000000,
      gasPrice: 400000000000,
      timeout: 90000,
    },
    tenderly: {
      url: process.env.TENDERLY_FORK,
      chainId: Number(process.env.TENDERLY_NETWORK_ID),
      accounts: [process.env.ITEM_MANAGER],
      // blockGasLimit: 20000000,
      blockGasLimit: 20000000,
      gasPrice: 1000000000,
      timeout: 90000,
    },
    mumbai: {
      url: process.env.MUMBAI_URL,
      accounts: [process.env.SECRET],
      blockGasLimit: 20000000,
      gasPrice: 1000000000,
    },
    supernet: {
      url: process.env.SUPERNET_URL,
      // accounts: [process.env.SECRET],
    },
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
      {
        version: "0.4.24",
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
