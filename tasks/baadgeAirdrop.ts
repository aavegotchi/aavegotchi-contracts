import { task } from "hardhat/config";
import { Signer } from "@ethersproject/abstract-signer";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  maticDiamondAddress,
  gameManager,
  getDiamondSigner,
} from "../scripts/helperFunctions";
import { BaadgeAirdrop } from "../scripts/itemTypeHelpers";

export interface AirdropBaadgeTaskArgs {
  maxProcess: string;
  badgeIds: string;
  awardsArray: string;
}

task(
  "airdropBaadges",
  "Airdrop baadges given badgeIds to awardsArray within MaxProcess"
)
  .addParam("maxProcess", "Maxium amount of baadges to be airdropped")
  .addParam("badgeIds", "List of SVG IDs to be airdropped")
  .addParam("awardsArray", "Gotchi Id recipients of baadge airdrop")

  .setAction(
    async (taskArgs: AirdropBaadgeTaskArgs, hre: HardhatRuntimeEnvironment) => {
      const badgeIds: string[] = taskArgs.badgeIds
        .split(",")
        .filter((str) => str.length > 0);
      const maxProcess: string = taskArgs.maxProcess;
      const awardsArray: string[] = taskArgs.awardsArray
        .split(",")
        .filter((str) => str.length > 0);

      let tokenIds: number[] = [];
      let _ids: any[] = [];
      let _values: any[] = [];

      for (let index = 0; index < awardsArray.length; index++) {
        let finalRewards: any = {};

        finalRewards.recipients = awardsArray[index];
        finalRewards.badgeId = badgeIds[index];
        finalRewards.value = 1;

        Object.keys(finalRewards).forEach((key) => {
          let values = finalRewards[key];
          tokenIds.push(Number(finalRewards.recipients));
          _ids.push(Number(finalRewards.badgeId));
          _values.push(Array(values.length).fill(1));
        });
      }

      const txData = [];

      let txGroup = [];
      let tokenIdsNum = 0;

      for (let index = 0; index < tokenIds.length; index++) {
        if (Number(maxProcess) < tokenIdsNum + 1) {
          txData.push(txGroup);
          txGroup = [];
          tokenIdsNum = 0;
        }

        txGroup.push({
          index,
        });
        tokenIdsNum += 1;
      }

      if (tokenIdsNum > 0) {
        txData.push(txGroup);
        txGroup = [];
        tokenIdsNum = 0;
      }

      const signer: Signer = await getDiamondSigner(hre, gameManager, false);

      const itemsTransferFacet = await hre.ethers.getContractAt(
        "ItemsTransferFacet",
        maticDiamondAddress,
        signer
      );
      const itemsFacet = await hre.ethers.getContractAt(
        "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
        maticDiamondAddress,
        signer
      );

      for (const [i, txGroup] of txData.entries()) {
        let batchBeginning = txGroup[0].index;
        let batchEnd = txGroup[txGroup.length - 1].index;
        let batchTokenIds = tokenIds.slice(batchBeginning, batchEnd + 1);
        let batchBadgeIds = _ids.slice(batchBeginning, batchEnd + 1);
        let batchBadgeValues = _values.slice(batchBeginning, batchEnd + 1);

        console.log(
          `Sending Batch ${i} to tokenIDs ${batchBeginning}-${batchEnd}`
        );

        const tx = await itemsTransferFacet.batchBatchTransferToParent(
          gameManager,
          maticDiamondAddress,
          batchTokenIds,
          batchBadgeIds,
          batchBadgeValues
        );
        console.log("Tx hash:", tx.hash);
        let receipt = await tx.wait();

        if (!receipt.status) {
          throw Error(`Error:: ${tx.hash}`);
        }
      }
    }
  );
