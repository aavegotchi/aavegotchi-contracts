/* global ethers */
/* eslint-disable  prefer-const */

import { Network, Alchemy } from "alchemy-sdk";

async function main() {
  // Optional Config object, but defaults to demo api-key and eth-mainnet.
  const settings = {
    apiKey: process.env.ALCHEMY_API_KEY, // Replace with your Alchemy API Key.
    network: Network.MATIC_MAINNET, // Replace with your network.
  };

  const alchemy = new Alchemy(settings);

  // // // Print all NFTs returned in the response:
  // const nfts = await alchemy.nft.getNftsForOwner(
  //   "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5",
  //   { contractAddresses: ["0xA4E3513c98b30d4D7cc578d2C328Bd550725D1D0"] }
  // );

  // const contract = await alchemy.nft.getNftsForContract(
  //   "0xA4E3513c98b30d4D7cc578d2C328Bd550725D1D0"
  // );

  const nfts = await alchemy.nft.getNftsForOwner(
    "0x51208e5cC9215c6360210C48F81C8270637a5218"
  );

  console.log("nfts:", nfts);

  // const transfers = await alchemy.nft.getTransfersForContract(
  //   "0xA4E3513c98b30d4D7cc578d2C328Bd550725D1D0"
  // );

  console.log("trasfers:", nfts);

  // nfts.ownedNfts.forEach((item) => {
  //   console.log(`${item.contract.address} ${item.title} is ${item.tokenType}`);

  //   console.log("metadata:", item.rawMetadata);
  // });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
