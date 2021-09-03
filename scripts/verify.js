const { run } = require("hardhat");

async function verify() {
  const address = "0x8d4C8559E07cF784B8912a306a2b9f3B3f34E92E"; // deployed address
  const facet = "SvgFacet"; // name of facet
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
