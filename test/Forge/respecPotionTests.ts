import { ethers, network } from "hardhat";
import { expect } from "chai";
import { AavegotchiGameFacet, DAOFacet, ForgeTokenFacet } from "../../typechain";
import {
  impersonate,
  itemManagerAlt,
  maticDiamondAddress,
  maticDiamondUpgrader,
  maticForgeDiamond,
} from "../../scripts/helperFunctions";

import { upgradeAavegotchiForRepec } from "../../scripts/upgrades/upgrade-aavegotchiForRespec";
import { releaseRespec } from "../../scripts/upgrades/upgrade-respecFinal";
import axios from "axios";

let impDaoOwner : DAOFacet;
let impGame : AavegotchiGameFacet;
let impForgeToken : ForgeTokenFacet;

const ESSENCE = 1_000_000_001;

describe("Testing Respec potion", async function () {
  const testUser = "0x60c4ae0EE854a20eA7796a9678090767679B30FC";
  let aavegotchiGameFacet: AavegotchiGameFacet;
  let daoFacet: DAOFacet;
  let forgeTokenFacet: ForgeTokenFacet;

  before(async function () {
    await releaseRespec();

    aavegotchiGameFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/AavegotchiGameFacet.sol:AavegotchiGameFacet",
      maticDiamondAddress
    )) as AavegotchiGameFacet;

    daoFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/DAOFacet.sol:DAOFacet",
      maticDiamondAddress
    )) as DAOFacet;

    forgeTokenFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/ForgeDiamond/facets/ForgeTokenFacet.sol:ForgeTokenFacet",
      maticForgeDiamond
    )) as ForgeTokenFacet;

    impDaoOwner = await impersonate(
      "0x01F010a5e001fe9d6940758EA5e8c777885E351e",
      daoFacet,
      ethers,
      network
    );

    impGame = await impersonate(
      testUser,
      aavegotchiGameFacet,
      ethers,
      network
    );

    impForgeToken = await impersonate(
      testUser,
      forgeTokenFacet,
      ethers,
      network
    );

    // await impDaoOwner.setDaoDirectorTreasury("0x939b67F6F6BE63E09B0258621c5A24eecB92631c")
    await impForgeToken.setApprovalForAll(maticDiamondAddress, true)
  });

  describe("tests", async function () {
    it("should reset skill points and cost 50 essence if called again", async function () {
      let essenceBal = await forgeTokenFacet.balanceOf(testUser, ESSENCE)

      await impGame.resetSkillPoints(474)

      expect(await impGame.availableSkillPoints(474)).to.equal(10)
      // eql uses deep comparison
      expect(await impGame.getNumericTraits(474)).to.eql([99, 93, 92, 95, 91, 92])
      // expect no cost
      expect(await forgeTokenFacet.balanceOf(testUser, ESSENCE)).to.equal(Number(essenceBal))


      // spend the points
      await impGame.spendSkillPoints(474, [2, 2, 3, 3])
      expect(await impGame.getNumericTraits(474)).to.eql([101, 95, 95, 98, 91, 92])

      // reset again and check essence cost
      await impGame.resetSkillPoints(474)

      expect(await impGame.availableSkillPoints(474)).to.equal(10)
      expect(await impGame.getNumericTraits(474)).to.eql([99, 93, 92, 95, 91, 92])

      // make sure getGotchiBaseNumericTraits is accurate
      expect(await impGame.getGotchiBaseNumericTraits(474)).to.eql([99, 93, 92, 95, 91, 92])
      expect(await forgeTokenFacet.balanceOf(testUser, ESSENCE)).to.equal(Number(essenceBal) - 50)
    });

    it("should revert", async function () {
      await expect(impGame.resetSkillPoints(1)).to.be.reverted
    });

    it("should revert if not enough essence", async function () {
      let essenceBal = await forgeTokenFacet.balanceOf(testUser, ESSENCE)
      await impForgeToken.safeTransferFrom(testUser, "0x000000000000000000000000000000000000dEaD", ESSENCE, essenceBal, "0x");
      await expect(impGame.resetSkillPoints(474)).to.be.revertedWith("Not enough Essence")
    });

    it("should test correct base traits from contract vs finding via subgraph portal options", async () => {
      // WARNING: This is an extremely long running test. Reduce the loop counts (i < 25) to run on smaller subset

      const subgraph = 'https://subgraph.satsuma-prod.com/tWYl5n5y04oz/aavegotchi/aavegotchi-core-matic/api';
      let reqs = [];
      let skipAmt = 0;
      const query = `
                {
                  aavegotchis (
                    orderBy: id,
                    first: 1000,
                    skip: ${skipAmt}
                    where: {
                      status:3
                    }
                    ) {
                      id
                      numericTraits
                      status
                      collateral
                      portal {
                        options {
                          id
                          baseRarityScore
                          numericTraits
                          collateralType
                        }
                      }
                    }
                }
                `
      for (let i = 0; i < 25; i++){
        skipAmt = i * 1000
        reqs.push(axios.post(subgraph, {query: query}))
      }

      let resps = await Promise.all(reqs)

      for (let resp of resps) {
        let data = resp.data.data;

        for (let gotchi of data.aavegotchis) {
          console.log("id", gotchi.id)

          let baseFromPortal = gotchi.portal.options.filter(
            p => p.collateralType == gotchi.collateral &&
              p.numericTraits[4] == gotchi.numericTraits[4] &&
              p.numericTraits[5] == gotchi.numericTraits[5])

          if (baseFromPortal.length > 1) {
            console.error("multiple matches for " + gotchi.id)
          } else if (baseFromPortal.length == 1) {
            expect(await impGame.getGotchiBaseNumericTraits(gotchi.id)).to.eql(baseFromPortal[0].numericTraits)
          } else {
            console.error("no matches for " + gotchi.id)
          }
        }
      }
    });
  });
});
