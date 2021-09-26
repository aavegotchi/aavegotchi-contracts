import { ethers, network } from "hardhat";

import {
  wearablesLeftSvgs,
  wearablesRightSvgs,
  wearablesBackSvgs,
  wearablesLeftSleeveSvgs,
  wearablesRightSleeveSvgs,
  wearablesBackSleeveSvgs,
} from "../../svgs/wearables-sides";

import { sideViewDimensions9 } from "../../svgs/sideViewDimensions";
import { SvgFacet } from "../../typechain";

async function main() {


  const gasPrice = 7666197020;
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  let account1Signer;
  let account1Address;
  let signer;

  let owner = await (
    await ethers.getContractAt("OwnershipFacet", diamondAddress)
  ).owner();
  const testing = ["hardhat", "localhost"].includes(network.name);

  if (testing) {
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [owner],
    });
    signer = await ethers.getSigner(owner);
    let dao = await ethers.getContractAt("DAOFacet", diamondAddress, signer);
    [account1Signer] = await ethers.getSigners();
    account1Address = await account1Signer.getAddress();
    let tx = await dao.addItemManagers([account1Address]);
    let receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Error:: ${tx.hash}`);
    }


} else if (network.name === "matic") {
  const accounts = await ethers.getSigners();
  const account = await accounts[0].getAddress();
  /* console.log("account:", account); */

  signer = accounts[0]; //new LedgerSigner(ethers.provider);
} else {
  throw Error("Incorrect network selected");
}

async function updateSvgs(svg: any, svgType:any,svgId:number,updatesigner:any){
  const svgFacet = (await ethers.getContractAt(
    "SvgFacet",
    diamondAddress,
    updatesigner
  )) as SvgFacet;
  let ids:[number]=[248]
  let svgLength = new TextEncoder().encode(svg[svgId]).length;
    const array = [
      {
        svgType: ethers.utils.formatBytes32String(svgType),
        ids: ids,
        sizes: [svgLength],
      },
    ];
  
    let tx=await svgFacet.updateSvg(svg[svgId],array,{gasPrice:gasPrice})
    let receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Error:: ${tx.hash}`);
    }

  
}
//
let arrFixes=[245,246,247]

let itemSigner;
if (testing) {
  itemSigner = account1Signer;
} else {
  itemSigner = signer;
}
console.log("updating sideviews")
await updateSvgs(wearablesLeftSvgs,"wearables-left",248,itemSigner)
await updateSvgs(wearablesRightSvgs,"wearables-right",248,itemSigner)
await updateSvgs(wearablesBackSvgs,"wearables-back",248,itemSigner)


}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.addR5sideViews = main;