import {
  ForgeFacet,
  ForgeTokenFacet,
  OwnershipFacet,
} from "../../../typechain";
import { ethers, network } from "hardhat";
import { maticForgeDiamond } from "../../helperFunctions";
import {
  CORE_BODY_COMMON,
  CORE_BODY_GODLIKE,
  CORE_EYES_COMMON,
  CORE_EYES_GODLIKE,
  CORE_EYES_LEGENDARY,
  CORE_EYES_UNCOMMON,
  CORE_FACE_GODLIKE,
  CORE_FACE_LEGENDARY,
  CORE_FACE_RARE,
  CORE_FACE_UNCOMMON,
  CORE_HANDS_GODLIKE,
  CORE_HEAD_GODLIKE,
  CORE_PET_COMMON,
  CORE_PET_GODLIKE,
  CORE_PET_RARE,
} from "../../../helpers/constants";

const toAddress = "0x8D46fd7160940d89dA026D59B2e819208E714E82";

export async function batchMintForgeItems() {
  let signer;
  const testing = ["hardhat", "localhost"].includes(network.name);
  if (testing) {
    const ownershipFacet = await ethers.getContractAt(
      "OwnershipFacet",
      maticForgeDiamond
    );
    const owner = await ownershipFacet.owner();

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [owner],
    });
    signer = await ethers.provider.getSigner(owner);
  } else if (network.name === "matic") {
    const accounts = await ethers.getSigners();
    signer = accounts[0]; //new LedgerSigner(ethers.provider, "hid", "m/44'/60'/2'/0/0");
  } else {
    throw Error("Incorrect network selected");
  }

  let forgeFacet = (await ethers.getContractAt(
    "contracts/Aavegotchi/ForgeDiamond/facets/ForgeFacet.sol:ForgeFacet",
    maticForgeDiamond,
    signer
  )) as ForgeFacet;

  const tokenIds = [];
  const tokenAmounts = [];

  // schematic
  const common = [350, 351, 352, 353];
  const uncommon = [354, 356];
  const rare = [355, 357];
  const legendary = [358, 359, 360, 361];
  const mythical = [362, 363, 364, 365];
  const godlike = [366, 367, 368, 369];
  const ids = [common, uncommon, rare, legendary, mythical, godlike];
  const amounts = [1000, 500, 250, 0, 50, 5];
  for (let i = 0; i < ids.length; i++) {
    if (amounts[i] === 0) {
      continue;
    }
    for (let j = 0; j < ids[i].length; j++) {
      tokenIds.push(ids[i][j]);
      tokenAmounts.push(amounts[i]);
    }
  }

  // core
  const coreIds = [
    CORE_BODY_COMMON,
    CORE_EYES_COMMON,
    CORE_PET_COMMON,
    CORE_FACE_RARE,
    CORE_FACE_UNCOMMON,
    CORE_EYES_UNCOMMON,
    CORE_PET_RARE,
    CORE_EYES_LEGENDARY,
    CORE_FACE_LEGENDARY,
    CORE_HANDS_GODLIKE,
    CORE_FACE_GODLIKE,
    CORE_HEAD_GODLIKE,
    CORE_BODY_GODLIKE,
    CORE_EYES_GODLIKE,
    CORE_PET_GODLIKE,
  ];
  const coreAmounts = [
    600, 300, 300, 300, 250, 250, 50, 50, 50, 2, 2, 1, 1, 1, 1,
  ];

  for (let i = 0; i < coreIds.length; i++) {
    if (coreAmounts[i] === 0) {
      continue;
    }
    tokenIds.push(coreIds[i]);
    tokenAmounts.push(coreAmounts[i]);
  }

  const tx = await forgeFacet.adminMintBatch(toAddress, tokenIds, tokenAmounts);
  const receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error with transaction: ${tx.hash}`);
  }

  let forgeTokenFacet = (await ethers.getContractAt(
    "contracts/Aavegotchi/ForgeDiamond/facets/ForgeTokenFacet.sol:ForgeTokenFacet",
    maticForgeDiamond,
    signer
  )) as ForgeTokenFacet;
  const balance = await forgeTokenFacet.balanceOfOwner(toAddress);
  console.log("balance", balance);
}

if (require.main === module) {
  batchMintForgeItems()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
