import { ethers } from "hardhat";
import { WGHST__factory } from "../typechain";

export async function deployWGHST() {
  console.log("Deploying WGHST contract...");

  const [deployer] = await ethers.getSigners();

  console.log("Deploying contract with the account:", deployer.address);

  const WGHSTFactory = (await ethers.getContractFactory(
    "WGHST"
  )) as WGHST__factory;
  const wghst = await WGHSTFactory.deploy();

  await wghst.deployed();

  // console.log("WGHST deployed to:", wghst.address);

  // //deposit 1 eth
  // await wghst.deposit({ value: ethers.utils.parseEther("1") });

  // console.log(
  //   "WGHST balance of deployer:",
  //   await wghst.balanceOf(deployer.address)
  // );

  // await wghst.withdraw(ethers.utils.parseEther("1"));

  // console.log(
  //   "WGHST balance of deployer:",
  //   await wghst.balanceOf(deployer.address)
  // );

  // // Transfer GHST directly to WGHST
  // await deployer.sendTransaction({
  //   to: wghst.address,
  //   value: ethers.utils.parseEther("1"),
  // });

  // console.log(
  //   "WGHST balance of deployer:",
  //   await wghst.balanceOf(deployer.address)
  // );

  // await wghst.withdraw(ethers.utils.parseEther("1"));

  // console.log(
  //   "WGHST balance of deployer:",
  //   await wghst.balanceOf(deployer.address)
  // );

  return wghst;
}

if (require.main === module) {
  deployWGHST()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
