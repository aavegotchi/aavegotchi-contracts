import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { appendToArray, getValidProposals, hasId, propType, writeToJsonFile } from "../scripts/query/queryValidProposals";
import { GrantXPSnapshotTaskArgs } from "./grantXP_snapshot";


export interface SettleXPTaskArgs {
  proposals: string;
  batchSize: string

}
let proposalArray: { id: string; title: string }[] = []

task("settleXP", "Settles XP to Gotchis that voted on certain proposals")
  .addParam("proposals", "How many proposals to settle")
  .addParam("batchSize", "How many Aavegotchis to send at a time. Default is 500")
  .setAction(async (taskArgs: SettleXPTaskArgs, hre: HardhatRuntimeEnvironment) => {

    const proposalCount = Number(taskArgs.proposals)
    const batchSize = taskArgs.batchSize
    const allproposals = await getValidProposals();
    let finalLength: number
    if (allproposals.length < proposalCount) {
      finalLength = allproposals.length
    }
    else {
      finalLength = proposalCount
    }

    for (let i = 0; i < finalLength; i++) {
      if (await hasId(allproposals[i].id)) {
        console.log(`The proposal "${allproposals[i].title}" has already being given xp`);
      }
      else {
        //give xp
        const taskArg: GrantXPSnapshotTaskArgs = {
          proposalId: allproposals[i].id,
          propType: propType(allproposals[i].title),
          batchSize: batchSize
        }
        await hre.run("grantXP_snapshot", taskArg)
        appendToArray(allproposals[i], proposalArray)
      }
    }
    writeToJsonFile(proposalArray)
  });
