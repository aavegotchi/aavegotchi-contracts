import fs from "fs";
import csv from "csv-parser";
import { NonceManager } from "@ethersproject/experimental";
import { Signer, ContractTransaction, ContractReceipt } from "ethers";
import { network, ethers } from "hardhat";
import { DAOFacet } from "../typechain";
import { maticDiamondAddress, gasPrice } from "./helperFunctions";

let addressToAavegotchiId = new Map<string, string>();
export function getStrategotchiAddresses(
  csv1Path: string,
  csv2Path: string
): Promise<{ addresses: string[]; aavegotchiIds: string[] }> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(csv1Path)) {
      reject(new Error("File does not exist: " + csv1Path));
      return;
    }

    let addresses2: string[] = [];
    let aavegotchiIds2: string[] = [];
    let addressesNotRegistered: string[] = [];

    fs.createReadStream(csv1Path)
      .pipe(csv())
      .on("data", (row) => {
        let address = row["What is your Ethereum address? "]
          .toLowerCase()
          .trim();
        addressToAavegotchiId.set(
          address,
          row["Which Aavegotchi ID would you like to receive your XP?"]
        );
      })
      .on("end", () => {
        fs.createReadStream(csv2Path)
          .pipe(csv())
          .on("data", (row) => {
            let address = row["address"].toLowerCase().trim();

            //only push if address is also in csv1
            if (addressToAavegotchiId.has(address)) {
              addresses2.push(address);
              aavegotchiIds2.push(addressToAavegotchiId.get(address) || "");
            } else {
              addressesNotRegistered.push(address);
            }
          })
          .on("end", () => {
            aavegotchiIds2 = aavegotchiIds2.map((id) => id.replace(/\D/g, ""));
            resolve({ addresses: addresses2, aavegotchiIds: aavegotchiIds2 });
          })
          .on("error", (error) => {
            reject(error);
          });
      })

      .on("error", (error) => {
        reject(error);
      });
  });
}

const t1 = [200, 100, 75, 60, 45, 30, 15, 10, 5];
const t2 = [400, 200, 150, 120, 90, 60, 30, 20, 10];

//if tournament number is 1
//rank 1 e.g index 0 gets 200XP
//rank 2 e.g index 1 gets 100XP
//rank 3 e.g index 2 gets 75XP
//rank 4 e.g index 3 gets 60XP
//rank 5-10 e.g index 4-9 gets 45XP
//rank 11-20 e.g index 10-19 gets 30XP
//rank 21-50 e.g index 20-49 gets 15XP
//rank 51-100 e.g index 50-99 gets 10XP
//rank 101-200 e.g index 100-199 gets 5XP

//if tournament number is 2
//rank 1 e.g index 0 gets 400XP
//rank 2 e.g index 1 gets 200XP
//rank 3 e.g index 2 gets 150XP
//rank 4 e.g index 3 gets 120XP
//rank 5-10 e.g index 4-9 gets 90XP
//rank 11-20 e.g index 10-19 gets 60XP
//rank 21-50 e.g index 20-49 gets 30XP
//rank 51-100 e.g index 50-99 gets 20XP
//rank 101-200 e.g index 100-199 gets 10XP

export function constructRewardArray(
  length: number,
  tournamentNumber: number
): number[] {
  let rewardArray: number[] = [];
  const t = tournamentNumber === 1 ? t1 : t2;
  for (let i = 0; i < length; i++) {
    if (i < 4) {
      rewardArray.push(t[i]);
    } else if (i < 10) {
      rewardArray.push(t[4]); // 5th-10th position reward
    } else if (i < 20) {
      rewardArray.push(t[5]); // 11th-20th position reward
    } else if (i < 50) {
      rewardArray.push(t[6]); // 21st-50th position reward
    } else if (i < 100) {
      rewardArray.push(t[7]); // 51st-100th position reward
    } else {
      rewardArray.push(t[8]); // 101st-200th position reward
    }
  }
  return rewardArray;
}

export function getFilePaths(
  typeformCSV: string,
  strategotchiCSV: string,
  tournament: number
) {
  const baseStrategotchiURL = "data/airdrops/strategotchi/";
  let typeFormPath = baseStrategotchiURL + `t${tournament}/${typeformCSV}.csv`;
  let strategotchiPath =
    baseStrategotchiURL + `t${tournament}/${strategotchiCSV}.csv`;

  return [typeFormPath, strategotchiPath];
}

export async function dropXPStrategotchi1(
  gotchiIds: string[],
  xpValues: string[]
) {
  const gameManager = "0x8D46fd7160940d89dA026D59B2e819208E714E82";
  console.log(gameManager);
  let signer: Signer;
  const diamondAddress = maticDiamondAddress;
  const testing = ["hardhat", "localhost"].includes(network.name);
  if (testing) {
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [gameManager],
    });
    signer = await ethers.provider.getSigner(gameManager);
  } else if (network.name === "matic") {
    const accounts = await ethers.getSigners();
    signer = accounts[0];
    // signer = new LedgerSigner(hre.ethers.provider, "hid", "m/44'/60'/2'/0/0");
  } else throw Error("Incorrect network selected");
  const managedSigner = new NonceManager(signer);
  console.log(`Sending XP to ${gotchiIds.length} Aavegotchis `);
  const dao = (await ethers.getContractAt("DAOFacet", diamondAddress)).connect(
    managedSigner
  ) as DAOFacet;
  for (let index = 0; index < gotchiIds.length; index++) {
    console.log(
      `Sending ${xpValues[index]} XP to Aavegotchi ${gotchiIds[index]} `
    );
  }

  const tx: ContractTransaction = await dao.grantExperience(
    gotchiIds,
    xpValues,
    { gasPrice: gasPrice }
  );
  console.log("tx:", tx.hash);
  let receipt: ContractReceipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`);
  }
}
