import axios from "axios";
import fs from "fs";
import { task } from "hardhat/config";

const addresses: string[] = [];

function getCompilerVersion() {
  /*try {
    const version = code.match(/pragma solidity (.*);/)[1];
  } catch (e) {}
  */
  return "v0.8.1+commit.df193b15";
}

function verifyRequest(guid: string, apikey: string, apiUrl: string) {
  console.log("Fetching Verify Status...");
  // Check Status
  return axios
    .get(apiUrl, {
      params: {
        apikey,
        guid,
        module: "contract",
        action: "checkverifystatus",
      },
    })
    .then((response) => {
      if (response.data.status == 1) {
        console.log("Verified Successfully");
      } else {
        if (response.data.result == "Pending in queue") {
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              resolve(verifyRequest(guid, apikey, apiUrl));
            }, 5000);
          });
        }
        console.log("Verification failed");
        console.log("message : " + response.data.message); //OK, NOTOK
        console.log("result : " + response.data.result); //result explanation
      }
    });
}

task(
  "verifyFacet",
  "Generates ABI file for diamond, includes all ABIs of facets"
)
  .addOptionalParam("noflatten", "Flatten the file or not")
  .addParam("apikey", "Polygon scan api key")
  .addParam("contract", "Facet contract address")
  .addParam("directory", "The directory of the facet")
  .addParam("facet", "Facet File name without extension")
  .addParam("apiURL", "The API url")
  .setAction(async (taskArgs, { run }) => {
    const noFlatten = taskArgs.noflatten == "true";
    const apikey = taskArgs.apikey;
    const contractaddress = taskArgs.contract;
    const file = taskArgs.facet;
    const directory = taskArgs.directory;
    const apiURL = taskArgs.apiURL;
    let contractname = file; // `contracts/Aavegotchi/facets/${file}.sol:${file}`; // file

    let sourceCode = null;
    const flatFile = `./flat/${file}.sol.flat`;
    if (noFlatten) {
      console.log("No Flatten");
      try {
        sourceCode = fs.readFileSync(flatFile, "utf8");
      } catch (err) {
        console.log(err);
        sourceCode = null;
      }
    }
    if (!sourceCode) {
      console.log("Flatten File Not Found. Flattening");

      sourceCode = await run("flatten:get-flattened-sources", {
        files: [`./contracts/${directory}/facets/${file}.sol`],
      });
    }
    sourceCode = sourceCode.replace(
      "// SPDX-License-Identifier: MIT",
      "licenseindicator"
    );
    sourceCode = sourceCode.replace(
      /\/\/ SPDX\-License\-Identifier\: MIT/g,
      ""
    );
    sourceCode = sourceCode.replace(
      "licenseindicator",
      "// SPDX-License-Identifier: MIT"
    );

    sourceCode = sourceCode.replace(
      "pragma solidity 0.8.1;",
      "solidityindicator"
    );
    sourceCode = sourceCode.replace(/pragma solidity 0\.8\.1\;/g, "");
    sourceCode = sourceCode.replace(
      "solidityindicator",
      "pragma solidity 0.8.1;"
    );

    try {
      fs.writeFileSync(flatFile, sourceCode);
    } catch (err) {
      console.log("Writing Flattened Source Code Failed");
    }

    const compilerversion = getCompilerVersion();
    const codeformat = "solidity-single-file";
    const optimizationUsed = 1;
    const runs = 200;
    const constructorArguements = "";
    const licenseType = 3;

    const config = {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    };

    addresses.push(contractaddress);

    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[i];
      try {
        const data = {
          apikey,
          module: "contract",
          action: "verifysourcecode",
          contractaddress: address,
          sourceCode,
          codeformat,
          contractname,
          compilerversion,
          optimizationUsed,
          runs,
          constructorArguements,
          evmversion: "",
          licenseType,
          libraryname1: "",
          libraryaddress1: "",
          libraryname2: "",
          libraryaddress2: "",
          libraryname3: "",
          libraryaddress3: "",
          libraryname4: "",
          libraryaddress4: "",
          libraryname5: "",
          libraryaddress5: "",
          libraryname6: "",
          libraryaddress6: "",
          libraryname7: "",
          libraryaddress7: "",
          libraryname8: "",
          libraryaddress8: "",
          libraryname9: "",
          libraryaddress9: "",
          libraryname10: "",
          libraryaddress10: "",
        };

        const params = new URLSearchParams();

        Object.keys(data).map((key) => {
          //@ts-ignore
          params.append(key, data[key]);
        });

        const response = await axios.post(apiURL, params, config);
        console.log("===============================");
        console.log("CONTRACT : " + address);
        if (response.data.status == 1) {
          console.log("Request Succeeded. GUID : " + response.data.result);
        } else {
          console.log("Request Failed");
          console.log("message : " + response.data.message); //OK, NOTOK
          console.log("result : " + response.data.result); //result explanation
          return;
        }
        const guid = response.data.result;

        await verifyRequest(guid, apikey, apiURL);
      } catch (e) {
        console.log("CONTRACT : " + address);
        console.log("ERROR", e);
      }
    }
  });
