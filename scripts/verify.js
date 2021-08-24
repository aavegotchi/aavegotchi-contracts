const { run } = require("hardhat");

async function verify() {
  const address = "0xfAD3092DB52618359e004C0b9846805890d80b78"; // deployed address
  const facet = "DAOFacet"; // name of facet
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
