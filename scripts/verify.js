const { run } = require("hardhat");

async function verify() {
  const address = "0xEA849a2B683Fed2BbE49610b7A01607fb386DE0A"; // deployed address
  const facet = "SvgFacet"; // name of facet
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
