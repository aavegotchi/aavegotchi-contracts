const {getDeployedContract, deployContract, deployContracts} = require("./deployUtils");
const { getCollaterals } = require("../../scripts/testCollateralTypes");
const { itemTypes } = require("../../scripts/itemTypes");
const { wearableSets } = require('../../scripts/wearableSets.js')
const { aavegotchiSvgs } = require('../../svgs/aavegotchi.js')
const { wearablesSvgs } = require('../../svgs/wearables.js')
const { collateralsSvgs } = require('../../svgs/collaterals.js')
const { eyeShapeSvgs } = require('../../svgs/eyeShapes.js')


 const setup = async () => {
    let deployed = []

    const Ghost = await deployContract("GHSTFacet");
    deployed.push(Ghost)
    await Ghost.contract.mint()

    const facets = await _deployFacets()
    deployed = deployed.concat(facets)

    const LinkToken = await deployContract('LinkTokenMock');
    const accounts = await ethers.getSigners()
    const account = await accounts[0].getAddress()

    console.log("account", account)
    const dao = await accounts[1].getAddress()
    const daoTreasury = await accounts[2].getAddress()
    const rarityFarming = await accounts[3].getAddress()
    const pixelCraft = await accounts[4].getAddress()
    const keyHash = '0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4'
    const fee = ethers.utils.parseEther('0.0001')
    const vrfCoordinator = account;
    const linkAddress = LinkToken.contract.address
    const initialHauntSize = '100'
    const portalPrice = ethers.utils.parseEther('100')
    const childChainManager = account


    console.log("GHST", Ghost.contract.address)

    const args = [
        dao, 
        daoTreasury, 
        pixelCraft, 
        rarityFarming, 
        Ghost.contract.address, 
        keyHash, 
        fee, 
        vrfCoordinator, 
        linkAddress, 
        initialHauntSize, 
        portalPrice, 
        childChainManager
    
    ]

    const Diamond = await _deployAavegotchiDiamond(facets, args, account);
    deployed.push(Diamond)

    const DAOFacet = daoFacet = await ethers.getContractAt('DAOFacet', Diamond.contract.address)

    await DAOFacet.addCollateralTypes(getCollaterals("hardhat", Ghost.contract.address))
    
    // This takes a while and causes tests to time out
    // await DAOFacet.addItemTypes(itemTypes.slice(0, itemTypes.length / 3))

    // await DAOFacet.addItemTypes(itemTypes.slice(itemTypes.length / 3, (itemTypes.length / 3) * 2))

    // await DAOFacet.addItemTypes(itemTypes.slice((itemTypes.length / 3) * 2))

    // await DAOFacet.addWearableSets(wearableSets.slice(0, wearableSets.length / 2))

    // await DAOFacet.addWearableSets(wearableSets.slice(wearableSets.length / 2))

    //_deploySvg(Diamond.contract)

    return {
        deploymentAccountAddress: account,
        burnAccountAddress: '0x0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF',
        daoAccountAddress: dao,
        rarityFarmingAccountAddress: rarityFarming,
        pixelCraftAccountAddress: pixelCraft,
        ghstTokenContract: Ghost.contract,
        contracts: deployed
    }
}



 const _deployFacets = async () => {
    const facetNames = [
        'contracts/Aavegotchi/facets/BridgeFacet.sol:BridgeFacet',
        'contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet',
        'AavegotchiGameFacet',
        'SvgFacet',
        'contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet',
        'ItemsTransferFacet',
        'CollateralFacet',
        'DAOFacet',
        'VrfFacet',
        'ShopFacet',
        'MetaTransactionsFacet',
        'ERC1155MarketplaceFacet',
        'ERC721MarketplaceFacet'
    ]

    const facets = await deployContracts(facetNames)

    return facets
 }

 

 const _deployAavegotchiDiamond = async (facets, args, owner, txArgs = {}) => {
    const FacetCutAction = {
        Add: 0,
        Replace: 1,
        Remove: 2
    }

    const diamondFactory = await ethers.getContractFactory('Diamond')
    const deployedDiamond = await diamondFactory.deploy(owner)
    await deployedDiamond.deployed()

    const Diamond = {name: "Diamond", contract: deployedDiamond}
    const InitDiamond = await deployContract('contracts/Aavegotchi/InitDiamond.sol:InitDiamond')

    const _deployDiamondCut = async () => {
        
        const _getSelectors = (contract) => {
            const signatures = Object.keys(contract.interface.functions)
            const selectors = signatures.reduce((acc, val) => {
                if (val !== 'init(bytes)') {
                    acc.push(contract.interface.getSighash(val))
                }
                return acc
            }, [])
            return selectors
        }
    
        const diamondCut = facets.map((deployedObj) => (
            [
                deployedObj.contract.address, 
                FacetCutAction.Add, 
                _getSelectors(deployedObj.contract) 
            ]
        ))

        const functionCall = InitDiamond.contract.interface.encodeFunctionData('init', args)


        const DiamondCutFacet = await ethers.getContractAt('DiamondCutFacet', Diamond.contract.address)

        console.log("DIAMONG", Diamond.contract.address)

        const tx = await DiamondCutFacet.diamondCut(diamondCut, InitDiamond.contract.address, functionCall, txArgs)
    
        const result =await tx.wait()

        if (!result.status) {
            console.log('TRANSACTION FAILED!!! -------------------------------------------')
            console.log('See block explorer app for details.')
        }

        console.log('DiamondCut success!')
        console.log('Transaction hash:' + tx.hash)
        console.log('--')
    }

    await _deployDiamondCut();


    return Diamond;
}


const _deploySvg = async (aavegotchiDiamond) => {

    const _setupSvg = (...svgData) => {
        const svgTypesAndSizes = []
        const svgs = []
        for (const [svgType, svg] of svgData) {
        svgs.push(svg.join(''))
        svgTypesAndSizes.push([ethers.utils.formatBytes32String(svgType), svg.map(value => value.length)])
        }
        return [svgs.join(''), svgTypesAndSizes]
    }
    

    const svgFacet = await ethers.getContractAt('SvgFacet', aavegotchiDiamond.address)

    let svgItemsStart = 0
    let svgItemsEnd = 0
    while (true) {
        let itemsSize = 0
        while (true) {
            if (svgItemsEnd === wearablesSvgs.length) {
                break
            }
            itemsSize += wearablesSvgs[svgItemsEnd].length
            if (itemsSize > 24576) {
                break
            }
            svgItemsEnd++
        }
        ;[svg, svgTypesAndSizes] = _setupSvg(
            ['wearables', wearablesSvgs.slice(svgItemsStart, svgItemsEnd)]
        )
     
        tx = await svgFacet.storeSvg(svg, svgTypesAndSizes)
    
        if (svgItemsEnd === wearablesSvgs.length) {
            break
        }
        svgItemsStart = svgItemsEnd
    }


    // --------------------------------
    ;[svg, svgTypesAndSizes] = _setupSvg(
        ['aavegotchi', aavegotchiSvgs]
    )
    await svgFacet.storeSvg(svg, svgTypesAndSizes)

    ;[svg, svgTypesAndSizes] = _setupSvg(
        ['collaterals', collateralsSvgs],
        ['eyeShapes', eyeShapeSvgs]
    )
    await svgFacet.storeSvg(svg, svgTypesAndSizes)


}

exports.setup = setup