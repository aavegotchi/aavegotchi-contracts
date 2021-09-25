import { task } from "hardhat/config";

task("grantXP", "Grants XP to Gotchis in a list")
  .addParam("aavegotchis", "Array of all the Aavegotchis")
  .addParam("amount", "Amount of XP that each Aavegotchi should receive")
  .addOptionalParam(
    "batchSize",
    "How many Aavegotchis to send at a time. Default is 500"
  )

  .setAction(async (taskArgs) => {
    const aavegotchis: string[] = taskArgs.aavegotchis;
    const amount: number = taskArgs.amount;
    const batchSize: number = taskArgs.batchSize;
  });
