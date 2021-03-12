const {getDeployedContract, deployContract, deployContracts} = require("./deployUtils");
const { getCollaterals } = require("../../scripts/testCollateralTypes");
const { itemTypes } = require("../../scripts/itemTypes");
const { wearableSets } = require('../../scripts/wearableSets.js')
const { aavegotchiSvgs } = require('../../svgs/aavegotchi.js')
const { wearablesSvgs } = require('../../svgs/wearables.js')
const { collateralsSvgs } = require('../../svgs/collaterals.js')
const { eyeShapeSvgs } = require('../../svgs/eyeShapes.js')


 const setup = async () => {

    const accounts = await ethers.getSigners()
    const account = await accounts[0].getAddress()

    const LinkToken = await deployContract('LinkTokenMock');

    const facets = await _deployFacets()
    
    const dao = await accounts[1].getAddress()
    const daoTreasury = await accounts[1].getAddress()
    const rarityFarming = await accounts[3].getAddress()
    const pixelCraft = await accounts[4].getAddress()
    const keyHash = '0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4'
    const fee = ethers.utils.parseEther('0.0001')
    const vrfCoordinator = account;
    const linkAddress = LinkToken.address
    const childChainManager = account
    const name = ''
    const symbol = ''


    const Ghost = await deployContract("GHSTFacet");

    const GhostDiamond = await _deployDiamond([Ghost], 'contracts/GHST/InitDiamond.sol:InitDiamond', [], account, {})

    const ghstTokenContract = await ethers.getContractAt('GHSTFacet', GhostDiamond.address)
    await ghstTokenContract.mint();

    const args = [[
        dao, 
        daoTreasury, 
        pixelCraft, 
        rarityFarming, 
        ghstTokenContract.address, 
        keyHash, 
        fee, 
        vrfCoordinator, 
        linkAddress, 
        childChainManager,
        name,
        symbol
    
    ]]
    
    const aavegotchiDiamond = await _deployDiamond(facets, 'contracts/Aavegotchi/InitDiamond.sol:InitDiamond', args, account, {});
    
    const DAOFacet = await ethers.getContractAt('DAOFacet', aavegotchiDiamond.address)

    const initialHauntSize = '10000'
    const portalPrice = ethers.utils.parseEther('100')
    await DAOFacet.createHaunt(initialHauntSize, portalPrice, '0x000000')

    await DAOFacet.addCollateralTypes(getCollaterals("hardhat", ghstTokenContract.address))
    
    // This takes a while and causes tests to time out
    // await DAOFacet.addItemTypes(itemTypes.slice(0, itemTypes.length / 3))

    // await DAOFacet.addItemTypes(itemTypes.slice(itemTypes.length / 3, (itemTypes.length / 3) * 2))

    // await DAOFacet.addItemTypes(itemTypes.slice((itemTypes.length / 3) * 2))

    // await DAOFacet.addWearableSets(wearableSets.slice(0, wearableSets.length / 2))

    // await DAOFacet.addWearableSets(wearableSets.slice(wearableSets.length / 2))

    //_deploySvg(Diamond)

    
    const diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', aavegotchiDiamond.address)
    const vrfFacet = await ethers.getContractAt('VrfFacet', aavegotchiDiamond.address)
    const vrfTestFacet = await ethers.getContractAt('VrfTestFacet', aavegotchiDiamond.address)
    const aavegotchiFacet = await ethers.getContractAt('contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet', aavegotchiDiamond.address)
    const aavegotchiGameFacet = await ethers.getContractAt('AavegotchiGameFacet', aavegotchiDiamond.address)
    const collateralFacet = await ethers.getContractAt('CollateralFacet', aavegotchiDiamond.address)
    const shopFacet = await ethers.getContractAt('ShopFacet', aavegotchiDiamond.address)
    const daoFacet = await ethers.getContractAt('DAOFacet', aavegotchiDiamond.address)
    const erc1155MarketplaceFacet = await ethers.getContractAt('ERC1155MarketplaceFacet', aavegotchiDiamond.address)
    const erc721MarketplaceFacet = await ethers.getContractAt('ERC721MarketplaceFacet', aavegotchiDiamond.address)
    const bridgeFacet = await ethers.getContractAt('contracts/Aavegotchi/facets/BridgeFacet.sol:BridgeFacet', aavegotchiDiamond.address)
    //const itemsFacet = await ethers.getContractAt('contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet', aavegotchiDiamond.address)
    //const itemsTransferFacet = await ethers.getContractAt('ItemsTransferFacet', aavegotchiDiamond.address)
    const libAavegotchiTestFacet = await ethers.getContractAt('LibAavegotchiTestFacet', aavegotchiDiamond.address)
    //const svgFacet = await ethers.getContractAt('SvgFacet', aavegotchiDiamond.address)

    return {
        account: account,
        dao,
        daoTreasury,
        pixelCraft,
        rarityFarming,
        burnAddress: '0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF',
        aavegotchiDiamond: aavegotchiDiamond,
        diamondLoupeFacet: diamondLoupeFacet,
        bridgeFacet: bridgeFacet,
        ghstTokenContract: ghstTokenContract,
        // itemsFacet: itemsFacet,
        // itemsTransferFacet: itemsTransferFacet,
        aavegotchiFacet: aavegotchiFacet,
        aavegotchiGameFacet: aavegotchiGameFacet,
        collateralFacet: collateralFacet,
        vrfFacet: vrfFacet,
        vrfTestFacet,
        daoFacet: daoFacet,
        // svgFacet: svgFacet,
        erc1155MarketplaceFacet: erc1155MarketplaceFacet,
        erc721MarketplaceFacet: erc721MarketplaceFacet,
        shopFacet: shopFacet,
        linkAddress,
        linkContract: LinkToken,
        libAavegotchiTestFacet
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
        'ERC721MarketplaceFacet',
        'LibAavegotchiTestFacet',
        'VrfTestFacet'
    ]

    const facets = await deployContracts(facetNames)

    return facets
 }

 

 const _deployDiamond = async (facets, initDiamond, args, owner, txArgs = {}) => {
    const FacetCutAction = {
        Add: 0,
        Replace: 1,
        Remove: 2
    }

    const diamondFactory = await ethers.getContractFactory('Diamond')
    const deployedDiamond = await diamondFactory.deploy(owner)
    await deployedDiamond.deployed()

    const Diamond = deployedDiamond
    const InitDiamond = await deployContract(initDiamond)

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
                deployedObj.address, 
                FacetCutAction.Add, 
                _getSelectors(deployedObj) 
            ]
        ))


        const functionCall = InitDiamond.interface.encodeFunctionData('init', args)

        const DiamondCutFacet = await ethers.getContractAt('DiamondCutFacet', Diamond.address)

        const tx = await DiamondCutFacet.diamondCut(diamondCut, InitDiamond.address, functionCall, txArgs)
    
        const result =await tx.wait()

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