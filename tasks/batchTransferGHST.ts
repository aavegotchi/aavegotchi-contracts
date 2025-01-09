import { task } from "hardhat/config";
import { ContractReceipt, ContractTransaction } from "@ethersproject/contracts";
import { Signer } from "@ethersproject/abstract-signer";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { gasPrice } from "../scripts/helperFunctions";
import * as helpers from "@nomicfoundation/hardhat-network-helpers";

// GHST token address on Polygon
const GHST_TOKEN_ADDRESS = "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7";

interface TaskArgs {
  airdropName: string;
  addresses: string;
  amounts: string;
}

task(
  "batchTransferGHST",
  "Transfers GHST to multiple wallet addresses in a single transaction"
)
  .addParam("addresses", "Comma-separated list of addresses")
  .addParam("amounts", "Comma-separated list of amounts")
  .setAction(async (taskArgs: TaskArgs, hre: HardhatRuntimeEnvironment) => {
    const addresses: string[] = taskArgs.addresses.split(",");
    const amounts: string[] = taskArgs.amounts.split(",");
    if (addresses.length !== amounts.length) {
      throw new Error("Addresses and amounts length mismatch");
    }

    // Calculate total amount being sent
    const totalAmount = amounts.reduce(
      (sum, amount) => sum + parseFloat(amount),
      0
    );
    console.log(`Total GHST to be sent: ${totalAmount}`);

    const senderAddress = "0x8D46fd7160940d89dA026D59B2e819208E714E82"; // Replace with your sender address
    let signer: Signer;

    // Handle different network environments
    const testing = ["hardhat", "localhost"].includes(hre.network.name);
    if (testing) {
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [senderAddress],
      });

      await helpers.mine();

      signer = await hre.ethers.provider.getSigner(senderAddress);
    } else if (hre.network.name === "matic") {
      const accounts = await hre.ethers.getSigners();
      signer = accounts[0];
    } else {
      throw Error("Incorrect network selected");
    }

    // Get GHST token contract
    const ghstToken = await hre.ethers.getContractAt(
      [
        "function transfer(address,uint256) external returns (bool)",
        "function balanceOf(address) external view returns (uint256)",
      ],
      GHST_TOKEN_ADDRESS,
      signer
    );

    //check that the sending wallet has enough GHST
    const senderBalance = await ghstToken.balanceOf(senderAddress);

    console.log(`Sender balance: ${senderBalance}`);

    if (senderBalance < totalAmount) {
      throw new Error("Insufficient GHST balance in the sending wallet");
    }

    // Perform transfers
    const fs = require("fs");
    const path = require("path");
    const logDir = path.join(__dirname, "../logs");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const logPath = path.join(
      logDir,
      `ghst-transfers-${taskArgs.airdropName}.json`
    );

    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Initialize or load existing log data
    let logData = {
      timestamp,
      transfers: [] as TransferLog[],
    };

    // Load existing log file if it exists
    if (fs.existsSync(logPath)) {
      logData = JSON.parse(fs.readFileSync(logPath, "utf8"));
    }

    // Load existing successful transfers from the current airdrop log file
    const existingTransfers = new Set<string>();
    logData.transfers
      .filter((t: any) => t.status === "SUCCESS")
      .forEach((t: any) => existingTransfers.add(`${t.to}-${t.amount}`));

    interface TransferLog {
      index: number;
      total: number;
      network: string;
      from: string;
      to: string;
      amount: string;
      transactionHash?: string;
      status?: string;
      error?: string;
    }

    for (let i = 0; i < addresses.length; i++) {
      const transferKey = `${addresses[i]}-${amounts[i]} GHST`;
      if (existingTransfers.has(transferKey)) {
        console.log(
          `Skipping already processed transfer to ${addresses[i]} of ${amounts[i]} GHST`
        );
        continue;
      }

      const sendAmount = hre.ethers.utils.parseEther(amounts[i]);

      const transferLog: TransferLog = {
        index: i + 1,
        total: addresses.length,
        network: hre.network.name,
        from: await signer.getAddress(),
        to: addresses[i],
        amount: sendAmount.toString(),
      };

      // Log transfer details to console
      console.log(JSON.stringify(transferLog, null, 2));

      const tx: ContractTransaction = await ghstToken.transfer(
        addresses[i],
        sendAmount,
        { gasPrice: gasPrice }
      );

      transferLog.transactionHash = tx.hash;
      console.log(`Transaction Hash: ${tx.hash}`);

      try {
        const receipt: ContractReceipt = await tx.wait();
        transferLog.status = receipt.status ? "SUCCESS" : "FAILED";
        console.log(`Status: ${transferLog.status}`);

        if (!receipt.status) {
          const errorMsg = `Transfer failed for transaction ${tx.hash}`;
          transferLog.error = errorMsg;
          throw Error(errorMsg);
        }

        // Append new transfer to existing log data
        logData.transfers.push(transferLog);
        fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));
      } catch (error: unknown) {
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error occurred";
        transferLog.status = "FAILED";
        transferLog.error = errorMsg;
        console.log(`Status: FAILED\nError: ${errorMsg}`);

        // Add failed transfer to log data before throwing
        logData.transfers.push(transferLog);
        fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));
        throw error;
      }
    }

    console.log("All transfers completed successfully");
  });
