import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { gasPrice, maticDiamondAddress } from "../scripts/helperFunctions";
import { LedgerSigner } from "@ethersproject/hardware-wallets";
import { Signer } from "@ethersproject/abstract-signer";
import { DAOFacet } from "../typechain";
import { ContractReceipt, ContractTransaction } from "@ethersproject/contracts";
import { UserGotchisOwned } from "../types";
import { getSubgraphGotchis } from "../scripts/query/queryAavegotchis";

interface TaskArgs {
  filename: string;
  xpAmount: string;
  batchSize: string;
}

task("grantXP", "Grants XP to Gotchis by addresses")
  .addParam("filename", "File that contains the airdrop")
  .addParam("xpAmount", "Amount of XP that each Aavegotchi should receive")
  .addParam(
    "batchSize",
    "How many Aavegotchis to send at a time. Default is 500"
  )

  .setAction(async (taskArgs: TaskArgs, hre: HardhatRuntimeEnvironment) => {
    const filename: string = taskArgs.filename;
    const xpAmount: number = Number(taskArgs.xpAmount);
    const batchSize: number = Number(taskArgs.batchSize);

    let { addresses } = require(`../data/airdrops/${filename}.ts`);

    const diamondAddress = maticDiamondAddress;
    const gameManager = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";
    console.log(gameManager);
    let signer: Signer;
    const testing = ["hardhat", "localhost"].includes(hre.network.name);
    if (testing) {
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [gameManager],
      });
      signer = await hre.ethers.provider.getSigner(gameManager);
    } else if (hre.network.name === "matic") {
      const accounts = await hre.ethers.getSigners();
      signer = accounts[0]; /* new LedgerSigner(
        hre.ethers.provider,
        "hid",
        "m/44'/60'/2'/0/0"
      ); */
    } else {
      throw Error("Incorrect network selected");
    }

    const finalAddresses: string[] = [];

    for (let index = 0; index < addresses.length; index++) {
      let address = addresses[index];
      if (address.includes(".eth")) {
        let ethSigner = new hre.ethers.providers.JsonRpcProvider(
          process.env.MAINNET_URL
        );

        const resolved = await ethSigner.resolveName(address);
        address = resolved;
      }

      if (await hre.ethers.utils.isAddress(address)) {
        finalAddresses.push(address);
      }
    }

    //Set new addresses after replacing .eth addresses with resolved names
    addresses = finalAddresses;

    //Get Polygon
    const polygonUsers: UserGotchisOwned[] = await getSubgraphGotchis(
      addresses,
      "matic"
    );
    const polygonGotchis = polygonUsers
      .map((item) => item.gotchisOwned.length)
      .reduce((agg, cur) => agg + cur);
    console.log(
      `Found ${polygonUsers.length} Polygon Users with ${polygonGotchis} Gotchis`
    );

    //Get mainnet
    const mainnetUsers: UserGotchisOwned[] = await getSubgraphGotchis(
      addresses,
      "eth"
    );
    const mainnetGotchis = mainnetUsers
      .map((item) => item.gotchisOwned.length)
      .reduce((agg, cur) => agg + cur);
    console.log(
      `Found ${mainnetUsers.length} Ethereum Users with ${mainnetGotchis} Gotchis`
    );

    const finalUsers = polygonUsers.concat(mainnetUsers);

    const tokenIds: string[] = [];

    //Extract token ids
    polygonUsers.forEach((user) => {
      user.gotchisOwned.forEach((gotchi) => {
        if (gotchi.status === "3") {
          if (tokenIds.includes(gotchi.id))
            throw new Error(`Duplicate token ID: ${gotchi.id}`);
          else tokenIds.push(gotchi.id);
        }
      });
    });

    mainnetUsers.forEach((user) => {
      user.gotchisOwned.forEach((gotchi) => {
        if (gotchi.status === "3") {
          if (tokenIds.includes(gotchi.id))
            throw new Error(`Duplicate token ID: ${gotchi.id}`);
          else tokenIds.push(gotchi.id);
        }
      });
    });

    //Check how many unused addresses there are (addresses that voted, but do not have Aavegotchis)
    const unusedAddresses: string[] = [];
    const lowerCaseAddresses = addresses.map((address: string) =>
      address.toLowerCase()
    );
    lowerCaseAddresses.forEach((address: string) => {
      const found = finalUsers.find((val) => val.id === address);
      if (!found) unusedAddresses.push(address);
    });

    console.log(
      `There were ${unusedAddresses.length} addresses without Gotchis.`
    );

    const batches = Math.ceil(tokenIds.length / batchSize);

    console.log(
      `Sending ${xpAmount} XP to ${tokenIds.length} Aavegotchis in ${finalUsers.length} addresses!`
    );

    const dao = (
      await hre.ethers.getContractAt("DAOFacet", diamondAddress)
    ).connect(signer) as DAOFacet;

    for (let index = 0; index < batches; index++) {
      console.log("Current batch id:", index);

      const offset = batchSize * index;
      const sendTokenIds = tokenIds.slice(offset, offset + batchSize);

      console.log("send token ids:", sendTokenIds);

      console.log(
        `Sending ${xpAmount} XP to ${sendTokenIds.length} Aavegotchis `
      );

      const tx: ContractTransaction = await dao.grantExperience(
        sendTokenIds,
        Array(sendTokenIds.length).fill(xpAmount),
        { gasPrice: gasPrice }
      );
      console.log("tx:", tx.hash);
      let receipt: ContractReceipt = await tx.wait();
      // console.log("Gas used:", strDisplay(receipt.gasUsed.toString()));
      if (!receipt.status) {
        throw Error(`Error:: ${tx.hash}`);
      }
      console.log(
        "Airdropped XP to Aaavegotchis. Last tokenID:",
        sendTokenIds[sendTokenIds.length - 1]
      );
    }
  });
