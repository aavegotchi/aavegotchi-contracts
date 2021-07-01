// npx hardhat flatten ./contracts/Aavegotchi/facets/AavegotchiFacet.sol > ./flat/AavegotchiFacet.sol.flat
// npx hardhat verifyFacet --apikey 8BZW8WAFKXEMBPQJ85JI895A61EKWE2FAT --contract 0xc317D47d094958b2D7f2e689598d3EC3fD75577F --facet AavegotchiFacet

// npx hardhat verifyFacet --apikey 8BZW8WAFKXEMBPQJ85JI895A61EKWE2FAT --contract 0x70b03b843122887B907d177C97d0CD837cC5667c --facet AavegotchiFacet
/* global ethers hre task */

const axios = require('axios');

function getCompilerVersion(code) {
  try {
    // TODO: not sure if we should use this
    const version = code.match(/pragma solidity (.*);/)[1];
  } catch (e) {
  }
  return 'v0.8.1+commit.df193b15';
}

function verifyRequest(guid, apikey) {
  console.log('Fetching Verify Status...')
  // Check Status
  return axios.get('https://api.polygonscan.com/api', {
    params: {
      apikey,
      guid,
      module: 'contract',
      action: "checkverifystatus"
    }
  }).then(response => {
    if (response.data.status == 1) {
      console.log('Verified Successfully');
    } else {
      if (response.data.result == 'Pending in queue') {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve(verifyRequest(guid, apikey));
          }, 5000);
        });
      }
      console.log('Verification failed');
      console.log("message : " + response.data.message); //OK, NOTOK
      console.log("result : " + response.data.result);   //result explanation
    }
  })
}


task('verifyFacet', 'Generates ABI file for diamond, includes all ABIs of facets')
.addOptionalParam("noflatten", 'Flatten the file or not')
.addParam("apikey", 'Polygon scan api key')
.addParam("contract", 'Faucet contract address')
.addParam("facet", 'Facet File name without extension')
.setAction(async (taskArgs, { run }) => {
  const noFlatten = taskArgs.noflatten == 'true';
  const apikey = taskArgs.apikey;
  const contractaddress = taskArgs.contract;
  const file = taskArgs.facet;
  let contractname = file;

  let sourceCode = null;
  if (noFlatten) {
    try {
      sourceCode = fs.readFileSync(`./flat/${file}.sol.flat`, 'utf8')
    } catch (err) {
      sourceCode = null;
    }
  }
  if (!sourceCode) {
    sourceCode = await run('flatten:get-flattened-sources', {
      files: [
        `./contracts/Aavegotchi/facets/${file}.sol`,
      ]
    });
  }
  sourceCode = sourceCode.replace(/\/\/ SPDX\-License\-Identifier\: MIT/g,'JavaScript');

  const compilerversion = getCompilerVersion(sourceCode);
  const codeformat = 'solidity-single-file';
  const optimizationUsed = 0;
  const runs = 200;
  const constructorArguements = '';
  const licenseType = 3;
  const data = {
    apikey,
    module: 'contract',
    action: 'verifysourcecode',
    contractaddress,
    sourceCode,
    codeformat,
    contractname,
    compilerversion,
    optimizationUsed,
    runs,
    constructorArguements,
    evmversion: '',
    licenseType,
    libraryname1: '',
    libraryaddress1: '',
    libraryname2: '',
    libraryaddress2: '',
    libraryname3: '',
    libraryaddress3: '',
    libraryname4: '',
    libraryaddress4: '',
    libraryname5: '',
    libraryaddress5: '',
    libraryname6: '',
    libraryaddress6: '',
    libraryname7: '',
    libraryaddress7: '',
    libraryname8: '',
    libraryaddress8: '',
    libraryname9: '',
    libraryaddress9: '',
    libraryname10: '',
    libraryaddress10: '',
  }

  const params = new URLSearchParams()

  Object.keys(data).map(key => {
    params.append(key, data[key]);
  })

  const config = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }

  return axios.post('https://api.polygonscan.com/api', params, config)
  .then((response) => {
    if (response.data.status == 1) {
      console.log('Request Succeeded. GUID : ' + response.data.result);
    } else {
      console.log('Request Failed');
      console.log("message : " + response.data.message); //OK, NOTOK
      console.log("result : " + response.data.result);   //result explanation
      return;
    }
    const guid = response.data.result;
    
    return verifyRequest(guid, apikey);
  })
  .catch((err) => {
    console.log('ERROR', err);
  })
})
