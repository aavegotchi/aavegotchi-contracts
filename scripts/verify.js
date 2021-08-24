const { run } = require("hardhat");

async function verify() {
  const address = "0xD28Aa26821B0a3fba58D13344CD626C921692e71"; // deployed address
  const facet = "AavegotchiFacet"; // name of facet
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
