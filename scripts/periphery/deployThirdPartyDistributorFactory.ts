import { ethers } from "hardhat";
import * as hre from "hardhat";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const ThirdPartyDistributorFactory = await hre.ethers.getContractFactory(
    "ThirdPartyDistributorFactory"
  );
  const thirdPartyDistributorFactory =
    await ThirdPartyDistributorFactory.deploy();
  console.log(thirdPartyDistributorFactory.address);
  await sleep(60000);
  await hre.run("verify:verify", {
    address: thirdPartyDistributorFactory.address,
    constructorArguments: [],
  });
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
