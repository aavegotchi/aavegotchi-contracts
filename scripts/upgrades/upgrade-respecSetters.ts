import { DAOFacet  } from "../../typechain";
import { ethers, network } from "hardhat";
import { diamondOwner, impersonate, maticDiamondAddress } from "../helperFunctions";

const daoDirectorTreasuryAddr = "0x939b67F6F6BE63E09B0258621c5A24eecB92631c";

export async function setRespecProperties() {
  console.log("Starting setRespecProperties...");

  let daoFacet = (await ethers.getContractAt(
    "contracts/Aavegotchi/facets/DAOFacet.sol:DAOFacet",
    maticDiamondAddress,
    (
      await ethers.getSigners()
    )[0]
  )) as DAOFacet;

  if (network.name === "hardhat") {
    daoFacet = await impersonate(
      await diamondOwner(maticDiamondAddress, ethers),
      daoFacet,
      ethers,
      network
    );
  }

  await daoFacet.setDaoDirectorTreasury(daoDirectorTreasuryAddr)

  console.log("Finished setRespecProperties.");
}
