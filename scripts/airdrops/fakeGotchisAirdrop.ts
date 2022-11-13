import { network, ethers } from "hardhat";
import { request } from "graphql-request";
import { Signer } from "@ethersproject/abstract-signer";
import { gasPrice, maticFakeGotchiCards } from "../../scripts/helperFunctions";
import { getRfSznTypeRanking } from "../../scripts/helperFunctions";
import { IFakeGotchi } from "../../typechain";
import { dataArgs as dataArgs4 } from "../../data/airdrops/rarityfarming/szn4/rnd4";

export async function main() {
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

  function getOriginalOwnerAddress(_ids: number[]): Promise<OriginalAddress> {
    const ids = _ids.map((val) => `"${val}"`);

    let query = `
    {aavegotchis(first:1000 where: {gotchiId_in: [${ids}]}) {
      gotchiId
      owner{
        id
      }
      originalOwner{
        id
      }
    }}
    `;
    return request(maticGraphUrl, query);
  }

  //Gotchi IDs
  const rarityArray = [dataArgs4.rarityGotchis];
  const kinshipArray = [dataArgs4.kinshipGotchis];
  const xpArray = [dataArgs4.xpGotchis];

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

  const data = await getOriginalOwnerAddress(gotchiIdsArray);

  for (let i = 0; i < gotchiIdsArray.length; i++) {
    const gotchiId = gotchiIdsArray[i];
    const ownerData = data.aavegotchis.find(
      (val) => val.gotchiId.toString() === gotchiId.toString()
    );

    const isLent = ownerData?.originalOwner.id !== ownerData?.owner.id;

    let curOwner = ownerData?.owner.id;

    if (isLent) {
      let ogOwner = ownerData?.originalOwner.id;
      if (ogOwner === "0x0000000000000000000000000000000000000000") {
        console.log(`${gotchiId} is owned by zero address! be careful`);

        zeroAddresses.push(ownerData);
      } else {
        addressArray.push(ogOwner ? ogOwner : "not found");
      }
    } else {
      if (curOwner === "0x0000000000000000000000000000000000000000") {
        zeroAddresses.push(ownerData);
      } else {
        addressArray.push(curOwner ? curOwner : "not found");
      }
    }
  }

  console.log("!!! All Airdrop Addresses !!!", addressArray);
  console.log("Airdrop Addresses array length: ", addressArray.length);
  console.log("Unique airdrop Addresses: ", [...new Set(addressArray)].length);
  console.log("Gotchi Ids w/ owner zero address: ", zeroAddresses);
  console.log(
    "Gotchi Ids w/ owner zero address array length: ",
    zeroAddresses.length
  );

  //Airdrop
  console.log("Begin airdrops!");

  const perBatch = 1000;

  const skip = ["0xe52405604bf644349f57b36ca6e85cf095fab8da"];

  for (let index = 0; index < addressArray.length / perBatch; index++) {
    const addresses = addressArray
      .slice(index * perBatch, (index + 1) * perBatch)
      .filter((val) => !skip.includes(val));

    console.log("batch:", index);
    const ids = new Array(addresses.length).fill(0);
    const amounts = new Array(addresses.length).fill(1);

    if (addresses.length > 0) {
      console.log("addresses:", addresses);

      const tx = await fakeGotchis.safeBatchTransferTo(
        cardOwner,
        addresses,
        ids,
        amounts,
        [],
        { gasPrice: gasPrice }
      );

      await tx.wait();
    }
  }

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
