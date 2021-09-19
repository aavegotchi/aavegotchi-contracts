import { run } from "hardhat";

async function verify() {
  const address = "0x77E472722D7E4a0cFEB0B473b726EEaA55Ee1b19"; // deployed address
  const facet = "AavegotchiGameFacet"; // name of facet
  await run("verifyFacet", {
    apikey: process.env.POLYGON_API_KEY,
    contract: address,
    facet: facet,
    directory: "Aavegotchi",
  });
}

verify()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.VerifyFacet = verify;
