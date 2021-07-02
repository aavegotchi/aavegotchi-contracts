function getSelectors (contract) {
  const signatures = Object.keys(contract.interface.functions)
  const selectors = signatures.reduce((acc, val) => {
    if (val !== 'init(bytes)') {
      acc.push(contract.interface.getSighash(val))
    }
    return acc
  }, [])
  return selectors
}

function getSelector (func) {
  const abiInterface = new ethers.utils.Interface([func])
  return abiInterface.getSighash(ethers.utils.Fragment.from(func))
}

async function main () {
  const existings = [
    '0xb50d6662', '0x33dc83b1',
    '0x095ea7b3', '0x70a08231',
    '0x37c1d569', '0x081812fc',
    '0xe985e9c5', '0x06fdde03',
    '0x6352211e', '0x42842e0e',
    '0xb88d4fde', '0xa22cb465',
    '0x95d89b41', '0x4f6ccce7',
    '0x9e59e598', '0x2f745c59',
    '0xc87b56dd', '0x18160ddd',
    '0x23b872dd'
  ];
  const selectors = [
    'function totalSupply() external',
    'function balanceOf(address _owner) external',
    'function getAavegotchi(uint256 _tokenId) external',
    'function aavegotchiClaimTime(uint256 _tokenId) external',
    'function tokenByIndex(uint256 _index) external',
    'function tokenOfOwnerByIndex(address _owner, uint256 _index) external',
    'function tokenIdsOfOwner(address _owner) external',
    'function allAavegotchisOfOwner(address _owner) external',
    'function ownerOf(uint256 _tokenId) external',
    'function getApproved(uint256 _tokenId) external',
    'function isApprovedForAll(address _owner, address _operator) external',
    'function safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes calldata _data) external',
    'function safeTransferFrom( address _from, address _to, uint256 _tokenId) external',
    'function transferFrom(address _from, address _to, uint256 _tokenId) external',
    'function internalTransferFrom(address _sender, address _from, address _to, uint256 _tokenId) internal',
    'function approve(address _approved, uint256 _tokenId) external',
    'function setApprovalForAll(address _operator, bool _approved) external',
    'function name() external',
    'function symbol() external',
    'function tokenURI(uint256 _tokenId) external',
    'function aavegotchiClaimTime(uint256 _tokenId) external'
  ]

  selectors.map(selector => {
    if (!existings.includes(getSelector(selector))) {
      console.log(selector + ' : ' + getSelector(selector));
    }
  })
  return;
  const diamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'
  let signer
  const owner = await (await ethers.getContractAt('OwnershipFacet', diamondAddress)).owner()
  
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [owner]
  })
  signer = await ethers.getSigner(owner)
  const diamondCut = (await ethers.getContractAt('IDiamondLoupe', diamondAddress)).connect(signer) 

  const storage = await diamondCut.facets();
  console.log('Storage', storage);
}

main()
  .then(() => console.log('upgrade completed') /* process.exit(0) */)
  .catch(error => {
    console.error(error)
    process.exit(1)
  })

exports.itemManager = main
