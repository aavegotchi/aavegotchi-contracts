import { LedgerSigner } from "@anders-t/ethers-ledger";
import { Signer } from "ethers";
import { ethers, network } from "hardhat";
import { OwnershipFacet } from "../typechain";
import { impersonate, maticDiamondAddress } from "./helperFunctions";
import { sendToMultisig } from "./libraries/multisig/multisig";

async function main() {
  let signer: Signer = new LedgerSigner(ethers.provider);

  if (network.name === "hardhat") {
    signer = (await ethers.getSigners())[0];
  }

  const newOwner = "0x585E06CA576D0565a035301819FD2cfD7104c1E8";

  console.log("Transferring ownership of diamond: " + maticDiamondAddress);
  let diamond = (await ethers.getContractAt(
    "OwnershipFacet",
    maticDiamondAddress,
    signer
  )) as OwnershipFacet;

  if (network.name === "hardhat") {
    diamond = await impersonate(
      await diamond.owner(),
      diamond,
      ethers,
      network
    );
  }

  const tx = await sendToMultisig(
    await diamond.owner(),
    signer,
    await diamond.populateTransaction.transferOwnership(newOwner),
    ethers
  );
  console.log("Transaction hash: " + tx.hash);
  await tx.wait();
  console.log("Transaction sent to multisig!");

  // const owner = await diamond.owner();
  // console.log("New owner:", owner);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
