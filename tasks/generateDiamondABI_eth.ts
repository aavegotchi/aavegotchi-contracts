const fs = require("fs");
import { AbiCoder } from "@ethersproject/abi";
import { task } from "hardhat/config";

const basePath = "/contracts/Ethereum/facets/";
// const libraryBasePath = "/contracts/Ethereum/libraries/";
const sharedLibraryBasePath = "/contracts/shared/libraries/";

task(
  "diamondABI_eth",
  "Generates ABI file for diamond, includes all ABIs of facets"
).setAction(async () => {
  let files = fs.readdirSync("." + basePath);
  let abi: AbiCoder[] = [];
  for (const file of files) {
    const jsonFile = file.replace("sol", "json");
    let json = fs.readFileSync(`./artifacts/${basePath}${file}/${jsonFile}`);
    json = JSON.parse(json);
    abi.push(...json.abi);
  }
  /*
  files = fs.readdirSync("." + libraryBasePath);
  for (const file of files) {
    const jsonFile = file.replace("sol", "json");
    let json = fs.readFileSync(
      `./artifacts/${libraryBasePath}${file}/${jsonFile}`
    );
    json = JSON.parse(json);
    abi.push(...json.abi);
  }
  */
  files = fs.readdirSync("." + sharedLibraryBasePath);
  for (const file of files) {
    const jsonFile = file.replace("sol", "json");
    let json = fs.readFileSync(
      `./artifacts/${sharedLibraryBasePath}${file}/${jsonFile}`
    );
    json = JSON.parse(json);
    abi.push(...json.abi);
  }
  let finalAbi = JSON.stringify(abi);
  fs.writeFileSync("./diamondABI/diamond_eth.json", finalAbi);
  console.log("ABI written to diamondABI/diamond_eth.json");
});
