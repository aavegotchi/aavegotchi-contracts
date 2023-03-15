import { ethers } from "hardhat";
import { BigNumberish } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();
interface ProposalTitle {
  proposals: [
    {
      title: string;
    }
  ];
}

export async function impersonateSigner(network: any, address: string) {
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [address],
  });
  return await ethers.getSigner(address);
}

export async function fundSigner(
  network: any,
  address: string,
  amount: BigNumberish
) {
  await network.provider.request({
    method: "hardhat_setBalance",
    params: [address, ethers.utils.hexlify(amount)],
  });
}

export async function impersonateAndFundSigner(
  network: any,
  address: string,
  amount: BigNumberish = ethers.utils.parseEther("1000")
) {
  await fundSigner(network, address, amount);
  return await impersonateSigner(network, address);
}
