import { run } from "hardhat";

async function verify() {
  await run("verify:verify", {
    apikey: process.env.POLYGON_API_KEY,
    contract: 'contracts/Aavegotchi/facets/WhitelistFacet.sol:WhitelistFacet',
    address: "0x20A04363E78017126350BB220dEF309A7f93bB99", // deployed address,
    // constructorArguments: [
    //   "",
    // ]
  });
}

verify()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.VerifyFacet = verify;
