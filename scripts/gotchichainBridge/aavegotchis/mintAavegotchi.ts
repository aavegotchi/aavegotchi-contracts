/* global ethers hre */

import { ethers } from "hardhat";

const aavegotchDiamondAddressMumbai = process.env.AAVEGOTCHI_DIAMOND_ADDRESS_MUMBAI as string
const ghstDiamondAddressMumbai = process.env.GHST_DIAMOND_ADDRESS_MUMBAI as string

const txParams = {
  gasPrice: "5000000000"
}

export default async function main() {
  const to = (await ethers.getSigners())[0].address
  const shopFacetPolygonSide = await ethers.getContractAt("ShopFacet", aavegotchDiamondAddressMumbai)
  const aavegotchiFacetPolygonSide = await ethers.getContractAt("contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet", aavegotchDiamondAddressMumbai)
  const aavegotchiGameFacetPolygonSide = await ethers.getContractAt("AavegotchiGameFacet", aavegotchDiamondAddressMumbai)
  const vrfFacetPolygonSide = await ethers.getContractAt("VrfFacet", aavegotchDiamondAddressMumbai)
  const ghstTokenPolygonSide = await ethers.getContractAt(abi, ghstDiamondAddressMumbai)

  const { haunt_ } = await aavegotchiGameFacetPolygonSide.currentHaunt()
  console.log(`Current haunt price: ${haunt_.portalPrice}`)
  
  let tx 
  
  console.log(`Minting ${haunt_.portalPrice} GHST to ${to}`)
  const ghstValue = haunt_.portalPrice.add(ethers.utils.parseEther("10000"))
  tx = await ghstTokenPolygonSide.mint(ghstValue, to, txParams)
  console.log(`Waiting for tx to be validated, tx hash: ${tx.hash}`)
  await tx.wait()

  console.log('Approving GHST to shop')
  tx = await ghstTokenPolygonSide.approve(shopFacetPolygonSide.address, ghstValue, { ...txParams })
  console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
  await tx.wait()

  console.log('Purchasing Aavegotchi')
  tx = await shopFacetPolygonSide.buyPortals(to, haunt_.portalPrice, txParams)
  console.log(`Waiting for tx to be validated, tx hash: ${tx.hash}`)
  let txReceipt = await tx.wait()

  let tokenId = ""
  txReceipt.logs?.forEach((event: any) => {
    if (event.topics[0] === shopFacetPolygonSide.interface.getEventTopic("BuyPortals")) {
      tokenId = shopFacetPolygonSide.interface.decodeEventLog("BuyPortals", event.data)._tokenId
    }
  })

  console.log("Openning Portal")
  tx = await vrfFacetPolygonSide.openPortals([tokenId], txParams);
  console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
  await tx.wait()
  
  let gotchi = await aavegotchiFacetPolygonSide.getAavegotchi(tokenId);
  console.log(`Aavegotchi ID: ${tokenId} status is open portal (${gotchi.status.toString() == "2"}) `);
  
  console.log("Claimming Aavegotchi")
  tx = await aavegotchiGameFacetPolygonSide.claimAavegotchi(tokenId, 0, ethers.utils.parseEther("10000"), txParams);
  console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
  await tx.wait()

  gotchi = await aavegotchiFacetPolygonSide.getAavegotchi(tokenId);
  console.log(`Aavegotchi ID: ${tokenId} status is claimed (${gotchi.status.toString() == "3"})`);
  console.log('aavegotchi owner', gotchi.owner)

  console.log(`Purchased aavegotchi, tokenId: ${tokenId}`);
}

const abi = [
  {
    "inputs": [

    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_spender",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "remaining",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_value",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "success",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [

    ],
    "name": "decimals",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_value",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_to",
        "type": "address"
      }
    ],
    "name": "mint",
    "outputs": [

    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [

    ],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [

    ],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [

    ],
    "name": "totalSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_value",
        "type": "uint256"
      }
    ],
    "name": "transfer",
    "outputs": [
      {
        "internalType": "bool",
        "name": "success",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_value",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [
      {
        "internalType": "bool",
        "name": "success",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

exports.deployProject = main;
