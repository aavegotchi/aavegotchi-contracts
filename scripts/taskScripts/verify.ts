import { run } from "hardhat";

async function verify() {
  const address = "0x8a9005F1d6c079551C7Ee90D399e27aA10Cc4732"; // deployed address
  const facet = "DAOFacet"; // name of facet
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
