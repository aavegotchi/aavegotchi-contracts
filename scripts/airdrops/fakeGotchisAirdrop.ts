import { run, network, ethers } from "hardhat";
import { request } from "graphql-request";
import { Signer } from "@ethersproject/abstract-signer";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  maticDiamondAddress,
  getDiamondSigner,
  maticFakeGotchiCards,
  itemManagerAlt,
  gasPrice,
} from "../../scripts/helperFunctions";
import {
  getRfSznTypeRanking,
  hasDuplicateGotchiIds,
} from "../../scripts/helperFunctions";
import {
  IFakeGotchi,
  LendingGetterAndSetterFacet,
  AavegotchiFacet,
} from "../../typechain";
import { dataArgs as dataArgs1 } from "../../data/airdrops/rarityfarming/szn4/rnd1";
import { dataArgs as dataArgs2 } from "../../data/airdrops/rarityfarming/szn4/rnd2";
import { dataArgs as dataArgs3 } from "../../data/airdrops/rarityfarming/szn4/rnd3";
import { dataArgs as dataArgs4 } from "../../data/airdrops/rarityfarming/szn4/rnd4";

export async function main() {
  function delay(milliseconds: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, milliseconds);
    });
  }

  const maticGraphUrl: string =
    "https://api.thegraph.com/subgraphs/name/aavegotchi/aavegotchi-core-matic";
  const testing = ["hardhat", "localhost"].includes(network.name);
  const cardOwner = "0x8D46fd7160940d89dA026D59B2e819208E714E82";

  let signer: Signer;

  if (testing) {
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [cardOwner],
    });
    signer = await ethers.getSigner(cardOwner);
  } else if (network.name === "matic") {
    const accounts = await ethers.getSigners();
    signer = accounts[0]; //new LedgerSigner(ethers.provider);

    console.log("signer:", signer);
  } else {
    throw Error("Incorrect network selected");
  }

  const fakeGotchis = (await ethers.getContractAt(
    "IFakeGotchi",
    maticFakeGotchiCards,
    signer
  )) as IFakeGotchi;

  const lendingGetter = (await ethers.getContractAt(
    "LendingGetterAndSetterFacet",
    maticDiamondAddress,
    signer
  )) as LendingGetterAndSetterFacet;

  const aavegotchiFacet = (await ethers.getContractAt(
    "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
    maticDiamondAddress,
    signer
  )) as AavegotchiFacet;

  const itemsTransferFacet = await ethers.getContractAt(
    "ItemsTransferFacet",
    maticDiamondAddress,
    signer
  );

  let ownerBalance = await fakeGotchis.balanceOf(cardOwner, 0);
  console.log("Owner balance: ", ownerBalance.toString());

  interface Gotchi {
    id: string;
  }

  interface OriginalAddress {
    aavegotchis: {
      gotchiId: number;
      owner: Gotchi;
      originalOwner: Gotchi;
    }[];
  }

  function getOriginalOwnerAddress(_id: number): Promise<OriginalAddress> {
    // let addresses: string[] = [];
    // let gotchiInfo = await aavegotchiFacet.getAavegotchi(_id);
    // let address: string = gotchiInfo.owner.toString();
    // console.log("Owner Address: ", address);
    // console.log("Gotchi Info: ", gotchiInfo.toString());
    let query = `
    {aavegotchis(where: {gotchiId_in: [${_id}]}) {
      gotchiId
      owner{
        id
      }
      originalOwner{
        id
      }
    }}
    `;

    // let graphRequest = await request(maticGraphUrl, query);
    // console.log("TheGraph: ", graphRequest);

    return request(maticGraphUrl, query);
    // let addressesString = addresses.map((e) => `"${e}"`).join(",");
  }

  //Gotchi IDs
  const rarityArray = [
    dataArgs1.rarityGotchis,
    dataArgs2.rarityGotchis,
    dataArgs3.rarityGotchis,
    dataArgs4.rarityGotchis,
  ];
  const kinshipArray = [
    dataArgs1.kinshipGotchis,
    dataArgs2.kinshipGotchis,
    dataArgs3.kinshipGotchis,
    dataArgs4.kinshipGotchis,
  ];
  const xpArray = [
    dataArgs1.xpGotchis,
    dataArgs2.xpGotchis,
    dataArgs3.xpGotchis,
    dataArgs4.xpGotchis,
  ];

  const rarity = await getRfSznTypeRanking(rarityArray, "rarity");
  console.log("Rarity: ", rarity);
  const top334Rarity = rarity.slice(0, 334);
  console.log("Top 334 Rarity Length: ", top334Rarity.length);
  console.log("Top 334 Rarity: ", top334Rarity);

  const kinship = await getRfSznTypeRanking(kinshipArray, "kinship");
  console.log("Kinship: ", kinship);
  const top333Kinship = kinship.slice(0, 333);
  console.log("Top 333 Kinship Length: ", top333Kinship.length);
  console.log("Top 333 Kinship: ", top333Kinship);

  const xp = await getRfSznTypeRanking(xpArray, "xp");
  console.log("XP: ", xp);
  const top333XP = xp.slice(0, 333);
  console.log("Top 333 XP Length: ", top333XP.length);
  console.log("Top 333 XP: ", top333XP);

  let gotchiIdsArray: number[] = [];

  for (let x = 0; x < top334Rarity.length; x++) {
    gotchiIdsArray.push(top334Rarity[x]);
  }
  for (let y = 0; y < top333Kinship.length; y++) {
    gotchiIdsArray.push(top333Kinship[y]);
  }
  for (let z = 0; z < top333XP.length; z++) {
    gotchiIdsArray.push(top333XP[z]);
  }

  let addressArray: string[] = [];
  let zeroAddresses: any[] = [];

  for (let i = 0; i < gotchiIdsArray.length; i++) {
    // let ownerAddress: string;
    let isLent = await lendingGetter.isAavegotchiLent(gotchiIdsArray[i]);
    let data = await getOriginalOwnerAddress(gotchiIdsArray[i]);
    let curOwner = data.aavegotchis[0].owner.id;

    if (isLent) {
      let ogOwner = data.aavegotchis[0].originalOwner.id;
      if (ogOwner === "0x0000000000000000000000000000000000000000") {
        zeroAddresses.push(data.aavegotchis[0]);
      } else {
        console.log("Lent Gotchi Id: ", gotchiIdsArray[i]);
        console.log("### New Owner Address ###: ", curOwner);
        console.log("### Original Owner Address ###: ", ogOwner);

        addressArray.push(ogOwner);
      }
    } else {
      if (curOwner === "0x0000000000000000000000000000000000000000") {
        zeroAddresses.push(data.aavegotchis[0]);
      } else {
        console.log("***NOT Lent Gotchi Id*** ", gotchiIdsArray[i]);
        console.log("### Owner Address ###: ", curOwner);

        addressArray.push(curOwner);
      }
    }
  }

  console.log("!!! All Airdrop Addresses !!!", addressArray);
  console.log("Airdrop Addresses array length: ", addressArray.length);
  console.log("Gotchi Ids w/ owner zero address: ", zeroAddresses);
  console.log(
    "Gotchi Ids w/ owner zero address array length: ",
    zeroAddresses.length
  );

  //Airdrop
  console.log("Begin airdrops!");
  let count: number = 0;

  for (let b = 0; b < addressArray.length; b++) {
    await fakeGotchis.safeBatchTransferFrom(
      cardOwner,
      addressArray[b],
      [0],
      [1],
      []
    );
    count++;
    await delay(1500);
  }

  console.log("Airdrop count: ", count);

  console.log("Owner old balance: ", ownerBalance.toString());
  ownerBalance = await fakeGotchis.balanceOf(cardOwner, 0);
  console.log("Owner new balance: ", ownerBalance.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
