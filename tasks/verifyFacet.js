// npx hardhat flatten ./contracts/Aavegotchi/facets/AavegotchiFacet.sol > ./flat/AavegotchiFacet.sol.flat
// npx hardhat verifyFacet --apikey xxx --contract 0xfa7a3bb12848A7856Dd2769Cd763310096c053F1 --facet AavegotchiGameFacet --noflatten true


const axios = require('axios');
const fs = require('fs');

const addresses = [
  // '0x4f908Fa47F10bc2254dae7c74d8B797C1749A8a6', // 120 days
  // '0x58f64b56B1e15D8C932c51287d814EDaa8d6feb9', // 120 days
  // '0xAE7DF9f59FEc446903c64f21a76d039Bc81712ef', // 120 days
  // '0xefD4Cc25E5D01F84411D8Fca321F74bdf65E3d02', // 88 days
  // '0xfa7a3bb12848A7856Dd2769Cd763310096c053F1', // 6 days // AavegotchiGameFacet
  // '0xf35c518e373D71e4966295cF1E30f0c0555Cc85F', // 44 days // SvgFacet
  // '0xE6fC4684bb1a6A71DB11B25Be01F9D3b1eCe10c6', // 3 days
  // '0xc317D47d094958b2D7f2e689598d3EC3fD75577F', // 88 days
  // '0x70b03b843122887B907d177C97d0CD837cC5667c', // 44 days
  // '0x0BfA0cfC88ff56C37e2AfA32af9BeE77f6f970ED', // 83 days // ShopFacet
  // '0x1e09Fc5511fbFc4b4cf718b22962D1870804c279', // 31 days
  // '0x433484AAfDa3820A851cf560F23026c375E76194', // 120 days
  // '0x2eC212685CdEba693772dd0716551Eda4eb6965b', // 58 days
  // '0x691a713894403bF3b8a8A871BAB0D755D4b15096', // 78 days // AavegotchiFacet
  // '0xBffAAA85d2289ad818fd54d228cedF2efd48EF32', // 57 days // EscrowFacet
  // '0x68B7BF18184E0cC160f046E567Cc5cdbbf0d89d6', // 55 days
  // '0x1AbA526A0508bf55844625597F10539999caB598', // 18 days // DaoFacet
  // '0x1e80aC550386dd9af8e308DA0144d2B17EE7fD8c' // CollateralFacet
];
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
  let contractname = file; // `contracts/Aavegotchi/facets/${file}.sol:${file}`; // file

  let sourceCode = null;
  const flatFile = `./flat/${file}.sol.flat`;
  if (noFlatten) {
    console.log ('No Flatten');
    try {
      sourceCode = fs.readFileSync(flatFile, 'utf8')
    } catch (err) {
      console.log(err);
      sourceCode = null;
    }
  }
  if (!sourceCode) {
    console.log ('Flatten File Not Found. Flattening');
    sourceCode = await run('flatten:get-flattened-sources', {
      files: [
        `./contracts/Aavegotchi/facets/${file}.sol`,
      ]
    });
  }
  sourceCode = sourceCode.replace('\/\/ SPDX\-License\-Identifier\: MIT', 'licenseindicator');
  sourceCode = sourceCode.replace(/\/\/ SPDX\-License\-Identifier\: MIT/g,'');
  sourceCode = sourceCode.replace('licenseindicator', '\/\/ SPDX\-License\-Identifier\: MIT');

  sourceCode = sourceCode.replace('pragma solidity 0\.8\.1\;', 'solidityindicator');
  sourceCode = sourceCode.replace(/pragma solidity 0\.8\.1\;/g,'');
  sourceCode = sourceCode.replace('solidityindicator', 'pragma solidity 0\.8\.1\;');

  try {
    fs.writeFileSync(flatFile, sourceCode);
  } catch (err) {
    console.log('Writing Flattened Source Code Failed');
  }

  const compilerversion = getCompilerVersion(sourceCode);
  const codeformat = 'solidity-single-file';
  const optimizationUsed = 1;
  const runs = 200;
  const constructorArguements = '';
  const licenseType = 3;

  const config = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }

  addresses.push(contractaddress);
  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i];
    try {
      const data = {
        apikey,
        module: 'contract',
        action: 'verifysourcecode',
        contractaddress: address,
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
      
      const response = await axios.post('https://api.polygonscan.com/api', params, config)
      console.log('===============================');
      console.log('CONTRACT : ' + address);
      if (response.data.status == 1) {
        console.log('Request Succeeded. GUID : ' + response.data.result);
      } else {
        console.log('Request Failed');
        console.log("message : " + response.data.message); //OK, NOTOK
        console.log("result : " + response.data.result);   //result explanation
        return;
      }
      const guid = response.data.result;
      
      await verifyRequest(guid, apikey);
    } catch (e) {
      console.log('CONTRACT : ' + address);
      console.log('ERROR', e);
    }
  }
})
