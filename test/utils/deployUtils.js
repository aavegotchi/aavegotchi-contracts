
const deployContract = async (contractName) => {
    let contract = await ethers.getContractFactory(contractName);
    contract = await contract.deploy()
    contract.deployed()
    return contract
}


const deployContracts = async (contractNames) => {
    return Promise.all(contractNames.map(async (contractName) => (
        await deployContract(contractName)
    )))
}

exports.deployContract = deployContract
exports.deployContracts = deployContracts