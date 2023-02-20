import { ethers, network } from "hardhat";
import { gasPrice } from "../helperFunctions";
import { LedgerSigner } from "@anders-t/ethers-ledger";

const offset = 1_000_000_000;

const tileIds = [28, 29, 30, 31]; //le cyan grass
const alloyCategory = 7;
// const schematicCategory = 8; unused
const geodesCategory = 9;
const essenceCategory = 10;
const coresCategory = 11;

const alloyIds = [offset];
const essenceIds = [offset + 1];

const geodeIds = []; //[offset + 2, offset +3, offset+4, offset+5, offset+6, offset+7];
for (let i = offset + 2; i < offset + 8; i++) {
  geodeIds.push(i);
}

const coreIds = [];
for (let i = offset + 8; i < offset + 44; i++) {
  coreIds.push(i);
}

console.log("core ids:", coreIds);

const finalArray = [
  [alloyCategory, alloyIds],
  [geodesCategory, geodeIds],
  [essenceCategory, essenceIds],
  [coresCategory, coreIds],
];

// // Forge asset token IDs
// uint256 constant ALLOY = WEARABLE_GAP_OFFSET + 0;
// uint256 constant ESSENCE = WEARABLE_GAP_OFFSET + 1;

// uint256 constant GEODE_COMMON = WEARABLE_GAP_OFFSET + 2;
// uint256 constant GEODE_UNCOMMON = WEARABLE_GAP_OFFSET + 3;
// uint256 constant GEODE_RARE = WEARABLE_GAP_OFFSET + 4;
// uint256 constant GEODE_LEGENDARY = WEARABLE_GAP_OFFSET + 5;
// uint256 constant GEODE_MYTHICAL = WEARABLE_GAP_OFFSET + 6;
// uint256 constant GEODE_GODLIKE = WEARABLE_GAP_OFFSET + 7;

// uint256 constant CORE_BODY_COMMON = WEARABLE_GAP_OFFSET + 8;
// uint256 constant CORE_BODY_UNCOMMON = WEARABLE_GAP_OFFSET + 9;
// uint256 constant CORE_BODY_RARE = WEARABLE_GAP_OFFSET + 10;
// uint256 constant CORE_BODY_LEGENDARY = WEARABLE_GAP_OFFSET + 11;
// uint256 constant CORE_BODY_MYTHICAL = WEARABLE_GAP_OFFSET + 12;
// uint256 constant CORE_BODY_GODLIKE = WEARABLE_GAP_OFFSET + 13;

// uint256 constant CORE_FACE_COMMON = WEARABLE_GAP_OFFSET + 14;
// uint256 constant CORE_FACE_UNCOMMON = WEARABLE_GAP_OFFSET + 15;
// uint256 constant CORE_FACE_RARE = WEARABLE_GAP_OFFSET + 16;
// uint256 constant CORE_FACE_LEGENDARY = WEARABLE_GAP_OFFSET + 17;
// uint256 constant CORE_FACE_MYTHICAL = WEARABLE_GAP_OFFSET + 18;
// uint256 constant CORE_FACE_GODLIKE = WEARABLE_GAP_OFFSET + 19;

// uint256 constant CORE_EYES_COMMON = WEARABLE_GAP_OFFSET + 20;
// uint256 constant CORE_EYES_UNCOMMON = WEARABLE_GAP_OFFSET + 21;
// uint256 constant CORE_EYES_RARE = WEARABLE_GAP_OFFSET + 22;
// uint256 constant CORE_EYES_LEGENDARY = WEARABLE_GAP_OFFSET + 23;
// uint256 constant CORE_EYES_MYTHICAL = WEARABLE_GAP_OFFSET + 24;
// uint256 constant CORE_EYES_GODLIKE = WEARABLE_GAP_OFFSET + 25;

// uint256 constant CORE_HEAD_COMMON = WEARABLE_GAP_OFFSET + 26;
// uint256 constant CORE_HEAD_UNCOMMON = WEARABLE_GAP_OFFSET + 27;
// uint256 constant CORE_HEAD_RARE = WEARABLE_GAP_OFFSET + 28;
// uint256 constant CORE_HEAD_LEGENDARY = WEARABLE_GAP_OFFSET + 29;
// uint256 constant CORE_HEAD_MYTHICAL = WEARABLE_GAP_OFFSET + 30;
// uint256 constant CORE_HEAD_GODLIKE = WEARABLE_GAP_OFFSET + 31;

// uint256 constant CORE_HANDS_COMMON = WEARABLE_GAP_OFFSET + 32;
// uint256 constant CORE_HANDS_UNCOMMON = WEARABLE_GAP_OFFSET + 33;
// uint256 constant CORE_HANDS_RARE = WEARABLE_GAP_OFFSET + 34;
// uint256 constant CORE_HANDS_LEGENDARY = WEARABLE_GAP_OFFSET + 35;
// uint256 constant CORE_HANDS_MYTHICAL = WEARABLE_GAP_OFFSET + 36;
// uint256 constant CORE_HANDS_GODLIKE = WEARABLE_GAP_OFFSET + 37;

// uint256 constant CORE_PET_COMMON = WEARABLE_GAP_OFFSET + 38;
// uint256 constant CORE_PET_UNCOMMON = WEARABLE_GAP_OFFSET + 39;
// uint256 constant CORE_PET_RARE = WEARABLE_GAP_OFFSET + 40;
// uint256 constant CORE_PET_LEGENDARY = WEARABLE_GAP_OFFSET + 41;
// uint256 constant CORE_PET_MYTHICAL = WEARABLE_GAP_OFFSET + 42;
// uint256 constant CORE_PET_GODLIKE = WEARABLE_GAP_OFFSET + 43;

/* TODO: end */

export async function addForgeAssetsToBaazaar(forgeDiamond: string) {
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  let signer;

  const testing = ["hardhat", "localhost"].includes(network.name);
  if (testing) {
    const itemManager = "0x8D46fd7160940d89dA026D59B2e819208E714E82";
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [itemManager],
    });
    signer = await ethers.provider.getSigner(itemManager);
  } else if (network.name === "matic") {
    signer = (await ethers.getSigners())[0];
  } else {
    throw Error("Incorrect network selected");
  }

  let erc1155MarketplaceFacet = await ethers.getContractAt(
    "ERC1155MarketplaceFacet",
    diamondAddress,
    signer
  );
  let tx;
  let receipt;

  const categories: any[] = [];

  finalArray.forEach((el) => {
    const category = el[0];
    const toAdd = el[1] as number[];

    console.log("to add:", toAdd);

    for (let index = 0; index < toAdd.length; index++) {
      categories.push({
        erc1155TokenAddress: forgeDiamond,
        erc1155TypeId: toAdd[index],
        category: category,
      });
    }
  });

  console.log("categories:", categories);

  // adding tile type categories

  if (testing) {
    tx = await erc1155MarketplaceFacet.setERC1155Categories(categories);
    console.log(
      "Adding categories for both installation and tile diamond tx:",
      tx.hash
    );
    receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Adding categories failed: ${tx.hash}`);
    }
    console.log("Adding categories succeeded:", tx.hash);
  } else {
    try {
      tx = await erc1155MarketplaceFacet.setERC1155Categories(categories, {
        gasPrice: gasPrice,
      });
      await tx.wait();
      console.log("tx:", tx);
    } catch (error) {
      console.log("error:", error);
    }
  }

  console.log("Checking tile diamond categories...");
  for (let i = 0; i < finalArray.length; i++) {
    const element = finalArray[i];

    const toAdd = element[1] as number[];
    const category = element[0];

    for (let i = 0; i < toAdd.length; i++) {
      const categorySaved = await erc1155MarketplaceFacet.getERC1155Category(
        forgeDiamond,
        toAdd[i]
      );

      console.log(
        categorySaved.toNumber() === category
          ? `correct: ${toAdd[i]}`
          : `incorrect: ${i}`
      );
    }
  }
}

if (require.main === module) {
  addForgeAssetsToBaazaar("0x4fDfc1B53Fd1D80d969C984ba7a8CE4c7bAaD442")
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
