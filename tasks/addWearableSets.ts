import { LedgerSigner } from "@ethersproject/hardware-wallets";
import { task } from "hardhat/config";
import { ContractReceipt, ContractTransaction } from "@ethersproject/contracts";
import { Signer } from "@ethersproject/abstract-signer";
import { DAOFacet } from "../typechain/DAOFacet";
import { gasPrice } from "../scripts/helperFunctions";
import { BigNumberish } from "@ethersproject/bignumber";
import { HardhatRuntimeEnvironment } from "hardhat/types";

export interface WearableSet {
  setId?: number | undefined;
  name: string;
  wearableIds: BigNumberish[];
  traitsBonuses: [
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish
  ];
  allowedCollaterals: BigNumberish[];
}

function trimSetNames(sets: WearableSet[]): WearableSet[] {
  const output: WearableSet[] = [];
  sets.forEach((set) => {
    set.name = set.name.trim();
    output.push(set);
  });
  return output;
}

export interface AddWearableSetsTaskArgs {
  itemManager: string;
  diamondAddress: string;
  setsFile: string;
}

task("addWearableSets", "Uploads Wearable Sets to the Aavegotchi Diamond")
  .addParam("itemManager", "Address of the item manager")
  .addParam("diamondAddress", "Address of the Diamond to add")
  .addParam("setsFile", "File name of the sets to add")

  .setAction(
    async (
      taskArgs: AddWearableSetsTaskArgs,
      hre: HardhatRuntimeEnvironment
    ) => {
      const itemFile: string = taskArgs.setsFile;
      const diamondAddress: string = taskArgs.diamondAddress;
      const itemManager = taskArgs.itemManager;

      const { sets } = require(`../data/wearableSets/${itemFile}.ts`);

      console.log("sets:", sets);

      //Ensure no names have empty strings at the end
      const finalWearableSets: WearableSet[] = trimSetNames(sets);

      console.log("wearable sets:", finalWearableSets);

      let signer: Signer;

      let owner = itemManager;
      const testing = ["hardhat", "localhost"].includes(hre.network.name);
      if (testing) {
        await hre.network.provider.request({
          method: "hardhat_impersonateAccount",
          params: [owner],
        });
        signer = await hre.ethers.provider.getSigner(owner);
      } else if (hre.network.name === "matic") {
        signer = new LedgerSigner(
          hre.ethers.provider,
          "hid",
          "m/44'/60'/2'/0/0"
        );
      } else {
        throw Error("Incorrect network selected");
      }

      let tx: ContractTransaction;
      let receipt: ContractReceipt;

      const daoFacet = (await hre.ethers.getContractAt(
        "DAOFacet",
        diamondAddress,
        signer
      )) as DAOFacet;

      tx = await daoFacet.addWearableSets(finalWearableSets, {
        gasPrice: gasPrice,
      });

      receipt = await tx.wait();
      if (!receipt.status) {
        throw Error(`Error:: ${tx.hash}`);
      }
      console.log("Sets were added:", tx.hash);
    }
  );
