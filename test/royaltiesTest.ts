import { ethers } from "hardhat";
import { expect } from "chai";
import { ERC1155MarketplaceFacet, ERC20Token } from "../typechain";
import { upgrade } from "../scripts/upgrades/upgrade-royalties";
import { maticDiamondAddress } from "../scripts/helperFunctions";
import { itemManager } from "../scripts/helperFunctions";
import { Signer } from "@ethersproject/abstract-signer";

describe("Testing Royalties", async function () {
  this.timeout(200000000);

  let erc1155MarketplaceFacet: ERC1155MarketplaceFacet;
  let erc20Token: ERC20Token;
  let signer: Signer;

  before(async function () {
    await upgrade();
  });
});
