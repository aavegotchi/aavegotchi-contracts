import { run } from "hardhat";

async function verify() {
  const address = "0xb81c32635524c24B02d8286B6Fc5157151e4c273"; // deployed address
  const facet = "BridgeFacet"; // name of facet
  await run("verifyFacet", {
    apikey: process.env.ETHERSCAN,
    contract: address,
    facet: facet,
    directory: "Ethereum",
    apiURL: "https://api.etherscan.io/api",
  });
}

verify()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.VerifyFacet = verify;
