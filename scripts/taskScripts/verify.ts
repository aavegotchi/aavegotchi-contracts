import { run } from "hardhat";

async function verify() {
  const address = "0xd7bc3854AA7BBA6902dF2ADC1f04449e60852faA"; // deployed address
  const facet = "AavegotchiGameFacet"; // name of facet
  await run("verifyFacet", {
    apikey: process.env.POLYGON_API_KEY,
    contract: address,
    facet: facet,
    directory: "Aavegotchi",
    apiURL: "https://api.polygonscan.com/api",
  });
}

verify()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.VerifyFacet = verify;
