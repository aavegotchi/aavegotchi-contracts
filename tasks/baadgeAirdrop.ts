import { task } from "hardhat/config";
import { Signer } from "@ethersproject/abstract-signer";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  maticDiamondAddress,
  getDiamondSigner,
  itemManagerAlt,
  gasPrice,
} from "../scripts/helperFunctions";
import { ItemsTransferFacet } from "../typechain";

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
      let _ids: Number[] = [];
      let _values: Number[] = [];
      let batchIds: any[] = [];
      let batchValues: any[] = [];

      let amountDropped = 0;

      console.log("BadgeIds: ", badgeIds);
      _ids.push(Number(badgeIds));
      _values.push(1);

      if (Number(maxProcess) >= amountDropped) {
        for (let index = 0; index < awardsArray.length; index++) {
          tokenIds.push(Number(awardsArray[index]));
          batchIds.push(_ids);
          batchValues.push(_values);
        }
        amountDropped += 1;
      }

      console.log("Batch Ids for airdrop: ", batchIds);
      console.log("tokenids:", tokenIds);

      const signer: Signer = await getDiamondSigner(hre, itemManagerAlt, false);

      const itemsTransferFacet = (await hre.ethers.getContractAt(
        "ItemsTransferFacet",
        maticDiamondAddress,
        signer
      )) as ItemsTransferFacet;

      const tx = await itemsTransferFacet.batchBatchTransferToParent(
        itemManagerAlt,
        maticDiamondAddress,
        tokenIds,
        batchIds,
        batchValues,
        { gasPrice: gasPrice }
      );
      console.log("Tx hash:", tx.hash);
      let receipt = await tx.wait();
      console.log("Airdropped SvgIds: ", batchIds);
      console.log("Airdropped to Gotchi Ids: ", tokenIds);

      if (!receipt.status) {
        throw Error(`Error:: ${tx.hash}`);
      }
    }
  );
