import { run } from "hardhat";

async function verify() {
  const address = "0x6C7CE64BB23dB2981A3769020F67d1d718167705"; // deployed address
  const facet = "DAOFacet"; // name of facet
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
