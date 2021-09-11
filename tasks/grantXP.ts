import { LedgerSigner } from "@ethersproject/hardware-wallets";
import { sendToMultisig } from "../scripts/libraries/multisig/multisig";

//@ts-ignore
import { ethers, network } from "hardhat";
import { AddressZero } from "@ethersproject/constants";
import { task } from "hardhat/config";
import {
  Contract,
  ContractFactory,
  ContractReceipt,
  ContractTransaction,
  PopulatedTransaction,
} from "@ethersproject/contracts";
import { Signer } from "@ethersproject/abstract-signer";

import { OwnershipFacet } from "../typechain/OwnershipFacet";
import { IDiamondCut } from "../typechain/IDiamondCut";
import { Transaction } from "@ethersproject/transactions";
import { getSelectors } from "../scripts/helperFunctions";

type FacetCutType = { Add: 0; Replace: 1; Remove: 2 };
const FacetCutAction: FacetCutType = { Add: 0, Replace: 1, Remove: 2 };

interface Cut {
  facetAddress: string;
  action: 0 | 1 | 2;
  functionSelectors: string[];
}

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
