import { run } from "hardhat";

async function verify() {
  const address = "0xb7fd49c7b662B5135D1bB03b51FfC51a6b908230"; // deployed address
  const facet = "AavegotchiFacet"; // name of facet
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
