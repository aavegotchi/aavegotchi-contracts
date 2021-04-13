const { ethers } = require("hardhat");
const hre = require("hardhat");
async function main() {
    
    const diamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'




    let owner = await (await ethers.getContractAt('OwnershipFacet', diamondAddress)).owner()
    console.log(owner)
    


    //MIA
    let MIA = ['0xedfb7bbBb0bc31C4D3DB77F6A56FE2E414A9bE63',
    '0x999C7997864b9bA4bAE06EBc0Aa59Cae1c91eD0e',
    '0xd16bddE3c4388E90E3f640896c9B92f28A71bF08',
    '0x75CFbc49986b7137d6a6df6C584f49510a2C756e',
    '0xf84835Af6A324F73c9102a889513B56dE36Fb43a',
    '0x1A760e3A431c8B9C075eD1280C8835a1a0F1651b',
    '0x45F7c1B3E66E5936bFd3834Effed93c82d8d069C',
    '0x65F9DeaCd2eb34ea0e86BE918F922eD5fCab75A0',
    '0x6fF1497328dCeCD7B2D26E80353cfA8f240dCF1a',
    '0xBcE3BD3b206946AbBe094903Ae2B4244B52fb4e9',
    '0x59c3D7966837E8C6B96251b6Ea0eF2cD4b17015C',
    '0x67023130eaAb2969E26e5a25E2AbF901C01bCDA0',
    '0x72C74e48bD7d4e28DEf498A5DFa737Ff33Cb5317']

    let quantities = [1]
    let fullsets = [55, 56, 57, 58, 59]

    const dao = await ethers.getContractAt('DAOFacet', diamondAddress)

    await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [owner]
    }
    )

  
    const signer = ethers.provider.getSigner(owner)

   console.log('increasing wearable limits')
await (await dao.connect(signer)).updateItemTypeMaxQuantity(fullsets, [13,13,13,13,13] )
  
    for (let i = 0; i < MIA.length; i++) {

        const sendrecipients = await (await dao.connect(signer)).mintItems(MIA[i], fullsets, quantities)
        const receipt = await sendrecipients.wait()
        if (!receipt.status) {
            throw Error(`Not Sent: ${sendrecipients.hash}`)
        }
        console.log(i,'Minted items', fullsets, 'and sent to', MIA[i], 'at txn', sendrecipients.hash)
    }



}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })