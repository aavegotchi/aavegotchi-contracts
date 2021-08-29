const { run } = require("hardhat");

async function verify() {
  const address = "0x68B7BF18184E0cC160f046E567Cc5cdbbf0d89d6"; // deployed address
  const facet = "ItemsTransferFacet"; // name of facet
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
