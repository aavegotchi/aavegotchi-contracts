const { run } = require("hardhat");

async function verify() {
  const address = "0x854555cD2D82f956627cAc66bf6f4858e71A39d4"; // deployed address
  const facet = "AavegotchiGameFacet"; // name of facet
  await run("verifyFacet", {
    apikey: process.env.POLYGON_API_KEY,
    contract: address,
    facet,
  });
}

verify()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.VerifyFacet = verify;
