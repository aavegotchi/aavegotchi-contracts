import axios from "axios";

import { ethers } from "hardhat";
import { BigNumber } from "ethers";

import * as fs from "fs";

import * as dotenv from "dotenv";
import { log } from "console";

export let abi = [
  "event CastVote (uint256 indexed voteId, address indexed voter, bool supports, uint256 stake)",
];

export const voteEventTopic =
  "0xb34ee265e3d4f5ec4e8b52d59b2a9be8fceca2f274ebc080d8fba797fea9391f";

export interface Transaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  transactionIndex: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  isError: string;
  txreceipt_status: string;
  input: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  gasUsed: string;
  confirmations: string;
  methodId: string;
  functionName: string;
}

export interface RetrievedData {
  hash: string;
  from: string;
}

export interface LogEvent {
  topics: string[];
  data: string;
}

export interface VoteTxn {
  voteId: BigNumber;
  voter: string;
  supports: boolean;
  stake: BigNumber;
}

// const etherscanAPIKEY = process.env.ETHERSCAN as string;
// const etherscanAPIURL = "https://api.etherscan.io/api";
const AragonAddress = "0xf63e1edbcb3be8d5fb124f4a228f5412f48e5ae7";
//infura preferred
const ethMainnetAPI = process.env.ETH_MAINNET_API as string;
const startBlock = 16327551;
const endBlock = 16848528;

// async function fetchAllTransactions(fromBlock: number, toBlock: number) {
//   const start = performance.now();
//   let txs: Transaction[];
//   let output: RetrievedData[] = [];
//   let votes: VoteTxn[] = [];
//   try {
//     const response = await axios.get(etherscanAPIURL, {
//       params: {
//         module: "account",
//         action: "txlist",
//         address: AragonAddress,
//         startblock: fromBlock,
//         endblock: toBlock,
//         sort: "asc",
//         apikey: etherscanAPIKEY,
//       },
//     });

//     txs = response.data.result;
//     console.log(txs.length);
//     for (let i = 0; i < txs.length; i++) {
//       if (txs[i].methodId === "0xdf133bca" && txs[i].txreceipt_status === "1") {
//         const ret: RetrievedData = {
//           hash: txs[i].hash,
//           from: txs[i].from,
//         };
//         output.push(ret);
//       }
//     }
//   } catch (error) {
//     console.error(error);
//   }
//   const rawEvents = await processResponse(
//     output,
//     etherscanAPIURL,
//     etherscanAPIKEY
//   );

//   for (let i = 0; i < rawEvents.length; i++) {
//     //@ts-ignore
//     votes.push(destructureEvent(parse(rawEvents[i]), output[i].from));
//   }
//   console.log(votes);
//   await writeToFile("scripts/query/aragonVotes/bondingCurve.json", votes);
// }

async function getLogsViEthers() {
  const mainnetProvider = new ethers.providers.JsonRpcProvider(ethMainnetAPI);
  const allLogs = await mainnetProvider.getLogs({
    address: AragonAddress,
    fromBlock: startBlock,
    toBlock: endBlock,
    topics: [voteEventTopic],
  });
  console.log(allLogs.length, "total vote txns");
  let v: VoteTxn[] = [];
  for (let i = 0; i < allLogs.length; i++) {
    v.push(destructureEvent(parse(allLogs[i]), allLogs[i].address));
  }
  //await writeToFile("scripts/query/aragonVotes/bondingCurveFromEthers.json", v);
  await getPropAddresses(v);
}

function destructureEvent(e: any[], from: string) {
  const [voteId, voter, supports, stake] = e;
  const t: VoteTxn = {
    voteId: voteId,
    voter: voter,
    supports: supports,
    stake: stake,
  };
  return t;
}

async function getPropAddresses(data: VoteTxn[]) {
  let prop3: string[] = [];
  let prop4: string[] = [];
  let prop5: string[] = [];

  for (let i = 0; i < data.length; i++) {
    if (data[i].voteId.toString() === "3") {
      prop3.push(data[i].voter);
    }
    if (data[i].voteId.toString() === "4") {
      prop4.push(data[i].voter);
    }
    if (data[i].voteId.toString() === "5") {
      prop5.push(data[i].voter);
    }

    //merge prop4 and prop5 and remove duplicates
    prop4 = [...new Set([...prop4, ...prop5])];
  }
  console.log(`${prop3.length} addresses voted on prop 3`);
  console.log(`${prop4.length} addresses voted on prop 4 or 5`);

  //write them out to separate files

  await writeToFile(`data/airdrops/aragonVotes/prop3.ts`, prop3);
  await writeToFile(`data/airdrops/aragonVotes/prop4or5.ts`, prop4);
}

// async function processResponse(
//   data: RetrievedData[],
//   API_URL: string,
//   API_KEY: string
// ) {
//   let topics: LogEvent[] = [];
//   console.log(`Found ${data.length} txns`);

//   for (let i = 0; i < data.length; i++) {
//     console.log(i);

//     const receipt = await fetchTxnReceipt(data[i].hash, API_URL, API_KEY);
//     const swapEvent = extractVoteEvent(receipt.result.logs);
//     const t: LogEvent = {
//       topics: swapEvent.topics,
//       data: swapEvent.data,
//     };
//     topics.push(t);
//   }
//   return topics;
// }

// async function fetchTxnReceipt(hash: string, API_URL: string, API_KEY: string) {
//   try {
//     const response = await axios.get(
//       `${API_URL}?module=proxy&action=eth_getTransactionReceipt&txhash=${hash}&apikey=${API_KEY}`
//     );
//     return response.data;
//   } catch (error) {
//     console.error(error);
//     throw error;
//   }
// }

// function extractVoteEvent(logs: any[]) {
//   try {
//     return logs.find(function (obj) {
//       return obj.topics.includes(voteEventTopic);
//     });
//   } catch (error) {
//     console.error(error);
//     return null;
//   }
// }

function parse(e: LogEvent) {
  let iface = new ethers.utils.Interface(abi);
  return iface.parseLog(e).args as any;
}

export async function writeToFile(fullPath: string, data: any) {
  await new Promise<void>((resolve, reject) => {
    fs.writeFile(fullPath, JSON.stringify(data), (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

// fetchAllTransactions(startBlock, endBlock)
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   });

getLogsViEthers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
