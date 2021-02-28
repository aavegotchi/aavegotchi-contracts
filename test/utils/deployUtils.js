const { Contract } = require("ethers");

const deployContract = async (contractName) => {
    let contract = await ethers.getContractFactory(contractName);
    contract = await contract.deploy()
    contract.deployed()
    return {
        name: contractName,
        contract
    }
}


const deployContracts = async (contractNames) => {
    return Promise.all(contractNames.map(async (contractName) => (
        await deployContract(contractName)
    )))
}

const getDeployedContract = (contracts, contractName) => {
    return contracts.find(c => c.name === contractName).contract
}


exports.deployContract = deployContract
exports.deployContracts = deployContracts
exports.getDeployedContract = getDeployedContract