import { LedgerSigner } from "@anders-t/ethers-ledger";
import { Signer } from "ethers";
import { ethers, network } from "hardhat";
import { MerkleDropFacet, OwnershipFacet } from "../typechain";
import { impersonate, maticDiamondAddress } from "./helperFunctions";

async function main() {
  let signer: Signer = new LedgerSigner(ethers.provider);
  let ownerShip = (await ethers.getContractAt(
    "OwnershipFacet",
    maticDiamondAddress
  )) as OwnershipFacet;

  let dropFacet: MerkleDropFacet;

  if (network.name === "hardhat") {
    const owner = await ownerShip.owner();
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [owner],
    });
    signer = await ethers.provider.getSigner(owner);
  }

  console.log("Deploying an xp airdrop");

  /*

  {
  '0x36968D7dBB96346dCA8F5467c7CA2078d6F91366': {
    address: '0x36968D7dBB96346dCA8F5467c7CA2078d6F91366',
    gotchiIds: [ '1484' ]
  },
  '0x81B405f915D2442e66dC374d34B45b836fe90e94': {
    address: '0x81B405f915D2442e66dC374d34B45b836fe90e94',
    gotchiIds: [ '4430', '8' ]
  }
}

{
  "0x36968D7dBB96346dCA8F5467c7CA2078d6F91366": {
    "leaf": "0x0x7809ff4bfdd4bc774e2e1d611e2fbc2a9860afa6fc3402ac3e50370186f2b3ca",
    "proof": [
      "0x435825e5c79292a5762079f980aa576e0f24584995b2c6d9e89210a652c36332"
    ]
  },
  "0x81B405f915D2442e66dC374d34B45b836fe90e94": {
    "leaf": "0x0x435825e5c79292a5762079f980aa576e0f24584995b2c6d9e89210a652c36332",
    "proof": [
      "0x7809ff4bfdd4bc774e2e1d611e2fbc2a9860afa6fc3402ac3e50370186f2b3ca"
    ]
  }
}
*/

  const propId =
    "0x9036ec1b899d16cdf2845a54555129303d133d19d7ad5d790f0aaed1b6d48913";
  const xpAmount = "0";
  const root =
    "0xb5f23f843ba6df7f7c24ac4d03b29b71ee6c70b880190171f082432c82984d28";

  dropFacet = (await ethers.getContractAt(
    "MerkleDropFacet",
    maticDiamondAddress,
    signer
  )) as MerkleDropFacet;

  if (network.name === "hardhat") {
    dropFacet = await impersonate(
      await ownerShip.owner(),
      dropFacet,
      ethers,
      network
    );
  }

  const tx = await dropFacet.createXPDrop(propId, root, xpAmount);
  const tx2 = await tx.wait();
  console.log("added xp at hash", tx.hash);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
