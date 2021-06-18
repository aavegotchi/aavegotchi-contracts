/* global ethers */

const { LedgerSigner } = require("@ethersproject/hardware-wallets");

let signer;
const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";

async function main() {
  const testing = ["hardhat", "localhost"].includes(hre.network.name);
  if (testing) {
    let itemManager = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";
    await hre.network.provider.request({
      method: "hardhat_reset",
      params: [{
        forking: {
          jsonRpcUrl: process.env.MATIC_URL
        }
      }]
    });

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [itemManager]
    });
    signer = await ethers.provider.getSigner(itemManager);
  } else if (hre.network.name === "matic") {
    signer = new LedgerSigner(ethers.provider);
  } else {
    throw Error("Incorrect network selected");
  }

  let tx;
  let receipt;
  const svgFacet = (await ethers.getContractAt("SvgFacet", diamondAddress)).connect(signer);

  const eyeShapes = ethers.utils.formatBytes32String("eyeShapes");
  const svg = "<g class=\"gotchi-eyeColor\"><path d=\"M35,20h1v1h-1V20z\" fill=\"#fff\"/><path d=\"M37 22v-1h-1v2h2v-1zm0\" fill=\"#ffdeec\"/><g fill=\"#ff3085\"><path d=\"M36 20v-1h-1v-1h-1v3h1v-1z\"/><path d=\"M36 20h1v1h-1z\"/><path d=\"M37 21h1v1h-1z\"/><path d=\"M40 24v-1h-1v-1h-1v1h-2v3h1v2h3v-1h1v-3h-1zm-3\"/><path d=\"M35 21h1v2h-1z\"/></g><path d=\"M22,20h1v1h-1V20z\" fill=\"#fff\"/><path d=\"M24 22v-1h-1v2h2v-1zm0\" fill=\"#ffdeec\"/><g fill=\"#ff3085\"><path d=\"M23 20v-1h-1v-1h-1v3h1v-1z\"/><path d=\"M23 20h1v1h-1z\"/><path d=\"M24 21h1v1h-1z\"/><path d=\"M27 24v-1h-1v-1h-1v1h-2v3h1v2h3v-1h1v-3h-1zm-3\"/><path d=\"M22 21h1v2h-1z\"/></g></g>";
  const _typesAndIdsAndSizes = [{
    svgType: eyeShapes,
    ids: [23],
    sizes: [svg.length]
  }];
  tx = await svgFacet.updateSvg(svg, _typesAndIdsAndSizes);
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error with transaction: ${tx.hash}`);
  }
  console.log("Transaction succcess:", tx.hash);

  const uniEyeSVG = await svgFacet.getSvg(eyeShapes, 23);
  console.log(uniEyeSVG);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
