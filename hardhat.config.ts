/* global task ethers */
import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import "hardhat-contract-sizer";
import "solidity-coverage";
//import './tasks/generateDiamondABI.js';
import * as dotenv from "dotenv";
import "@typechain/hardhat";

dotenv.config({ path: __dirname + "/.env" });

//  require("./tasks/verifyFacet.js");
require("./tasks/deployUpgrade.ts");
/* require("./tasks/updateItemDimensions.ts");
require("./tasks/updateSvgs.ts");
require("./tasks/updateItemSideDimensions.ts"); */
// require("./tasks/addItemTypes.ts");

// You have to export an object to set up your config
// This object can have the following optional entries:
// defaultNetwork, networks, solc, and paths.
// Go to https://buidler.dev/config/ to learn more
export default {
  networks: {
    hardhat: {
      forking: {
        url: process.env.MATIC_URL,
        timeout: 12000000,
        // blockNumber: 12552123
        // blockNumber: 13024371
      },
      blockGasLimit: 20000000,
      timeout: 120000,
      gas: "auto",
    },
    localhost: {
      timeout: 16000000,
    },
    // matic: {
    //   url: process.env.MATIC_URL,
    //   // url: 'https://rpc-mainnet.maticvigil.com/',
    //   accounts: [process.env.SECRET],
    //   // blockGasLimit: 20000000,
    //   blockGasLimit: 20000000,
    //   gasPrice: 1000000000,
    //   timeout: 90000
    // }
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
  // This is a sample solc configuration that specifies which version of solc to use
  solidity: {
    compilers: [
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
