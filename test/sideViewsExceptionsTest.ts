import { ethers, network } from "hardhat";
import { expect } from "chai";
import { SvgViewsFacet } from "../typechain";
import { upgrade } from "../scripts/upgrades/upgrade-sideViewsExceptions";
import { itemManager } from "../scripts/helperFunctions";
import { Signer } from "@ethersproject/abstract-signer";

describe("Testing Exceptions", async function () {
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  const randomAddress = "0x0d2026b3EE6eC71FC6746ADb6311F6d3Ba1C000B";
  let svgViewsFacet: SvgViewsFacet;
  let signer: Signer;

  const rightExceptions: any[] = [];

  before(async function () {
    await upgrade();
  });

  it.only("Should create exceptions from upgrade script", async function () {
    console.log("Testing Upgrade Script");
  });

  it.only("Should NOT create an exception becuase signer is NOT ItemManager or Owner", async function () {
    svgViewsFacet = (await ethers.getContractAt(
      "SvgViewsFacet",
      diamondAddress
    )) as SvgViewsFacet;

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [randomAddress],
    });

    rightExceptions.push(
      {
        itemId: 3,
        slotPosition: 4,
        exceptionBool: true,
      },
      {
        itemId: 6,
        slotPosition: 4,
        exceptionBool: true,
      }
    );

    await expect(
      svgViewsFacet.setSideViewExceptions(rightExceptions)
    ).to.be.revertedWith(
      "LibAppStorage: only an Owner or ItemManager can call this function"
    );
  });

  it.only("Should remove right hand id's 201 and 217 from exceptions", async function () {
    const testing = ["hardhat", "localhost"].includes(network.name);

    if (testing) {
      await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [itemManager],
      });
      signer = await ethers.getSigner(itemManager);
    } else if (network.name === "matic") {
      const accounts = await ethers.getSigners();
      signer = accounts[0]; //new LedgerSigner(ethers.provider);

      console.log("signer:", signer);
    } else {
      throw Error("Incorrect network selected");
    }

    svgViewsFacet = (await ethers.getContractAt(
      "SvgViewsFacet",
      diamondAddress,
      signer
    )) as SvgViewsFacet;

    //hand exceptions
    rightExceptions.push(
      {
        itemId: 201,
        slotPosition: 4,
        exceptionBool: false,
      },
      {
        itemId: 217,
        slotPosition: 4,
        exceptionBool: false,
      }
    );

    await svgViewsFacet.setSideViewExceptions(rightExceptions);
  });
});
