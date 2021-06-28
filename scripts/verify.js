// npx hardhat flatten ./contracts/Aavegotchi/facets/BridgeFacet.sol > ./flat/BridgeFacet.sol.flat
// FILE=BridgeFacet ADDRESS=0xE3D9759Ab6E3d36c645b362E163cc667e1422eB7 node scripts/verify.js

require('dotenv').config()
const axios = require('axios');
const fs = require('fs');

const apikey = process.env.POLYGON_API_KEY;

// Get contract address from env
const contractaddress = process.env.ADDRESS;
if (!contractaddress) {
  console.log('No contract address provided');
  return;
}

// Get file name from env
const file = process.env.FILE;
let contractname = file;

let sourceCode = null;
if (!file) {
  console.log('No file provided');
  return;
}

// Get flatten source code
try {
  sourceCode = fs.readFileSync(`./flat/${file}.sol.flat`, 'utf8')
} catch (err) {
  console.error(err);
  return;
}

if (!sourceCode) {
  console.log('File content empty');
  return;
}

// Get compiler version
let compilerversion = '';
try {
  compilerversion = sourceCode.match(/pragma solidity (.*);/)[1];
} catch (e) {
  console.log(e);
  return;
}
compilerversion = 'v0.8.1+commit.df193b15';

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

const verifyRequest = function (guid) {
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
            resolve(verifyRequest(guid));
          }, 5000);
        });
      }
      console.log('Verification failed');
      console.log("message : " + response.data.message); //OK, NOTOK
      console.log("result : " + response.data.result);   //result explanation
    }
  })
}

console.log('Sending Verify Request...');
// Send Verify request
axios.post('https://api.polygonscan.com/api', params, config)
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
  
  return verifyRequest(guid);
})
.catch((err) => {
  console.log('ERROR', error);
})