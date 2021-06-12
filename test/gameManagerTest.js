const { expect } = require('chai')
const { ethers } = require('hardhat')
const truffleAsserts = require('truffle-assertions')
const { GameManager } = require('../scripts/upgrades/upgrade-gameManager.js');

describe('Test GameManager role', async function () {
  const diamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d';
  let txData, owner, gameManager, generalUser, signer, daoFacet, gameManagerDaoFacet, signerDaoFacet, aavegotchiFacet;
  let aavegotchiID = 7938;
  
  before(async function () {
    this.timeout(1000000)
    await GameManager();

    owner = await (await ethers.getContractAt('OwnershipFacet', diamondAddress)).owner();
    signer = await ethers.provider.getSigner(owner);
    [gameManager, generalUser] = await ethers.getSigners();
    daoFacet = (await ethers.getContractAt('DAOFacet', diamondAddress))
    signerDaoFacet = await daoFacet.connect(signer);
    gameManagerDaoFacet = await daoFacet.connect(gameManager);
    aavegotchiFacet = (await ethers.getContractAt('contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet', diamondAddress)).connect(signer)    
  })

  it('should allow dao or owner to add or remove a game manager and trigger event', async function () {
    // Add Game Manager
    let addTx = await signerDaoFacet.addGameManagers([owner], [3000])
    txData = await addTx.wait()

    // Check Event dispatched
    const addedEvents = txData.events
    expect(addedEvents[0].event).to.equal('GameManagerAdded')
    const addedAddr = ((addedEvents[0].args).gameManager_)
    expect(addedAddr).to.equal(owner)

    const limit = ((addedEvents[0].args).limit_)
    expect(limit.toNumber()).to.equal(3000)

    // Check view function works
    let isManager = await signerDaoFacet.isGameManager(owner);
    expect(isManager).to.equal(true);

    // Remove Game Manager
    let removeTx = await signerDaoFacet.removeGameManagers([owner])
    txData = await removeTx.wait()

    // Check Event dispatched
    const removedEvents = txData.events
    expect(removedEvents[0].event).to.equal('GameManagerRemoved')
    const removedAddr = ((removedEvents[0].args).gameManager_)
    expect(removedAddr).to.equal(owner)

    isManager = await signerDaoFacet.isGameManager(owner);
    expect(isManager).to.equal(false);
  })

  it('should allow game managers to grant experience and restore the xp balance in 24 hours', async function(){
    // Add Game Manager with 100 Balance
    let addTx = await signerDaoFacet.addGameManagers([gameManager.address], [100])
    const balance = await signerDaoFacet.gameManagerBalance(gameManager.address);
    expect(balance.toNumber()).to.equal(100);
    await addTx.wait()

    // Grant 50 xp and check remaining balance
    txData = await gameManagerDaoFacet.grantExperience([aavegotchiID], [50]);
    expect(await signerDaoFacet.gameManagerBalance(gameManager.address)).to.equal(50);

    // Simulate 24 hours later
    ethers.provider.send('evm_increaseTime', [24 * 3600])
    ethers.provider.send('evm_mine')

    // Try to grant 100 xp to check if balance refreshed
    txData = await gameManagerDaoFacet.grantExperience([aavegotchiID], [100]);
    expect(await signerDaoFacet.gameManagerBalance(gameManager.address)).to.equal(0);
  })

  it('should reject game manager without enough xp balance', async function(){
    // Add Game Manager with 100 xp
    let addTx = await signerDaoFacet.addGameManagers([gameManager.address], [100])
    const balance = await signerDaoFacet.gameManagerBalance(gameManager.address);
    expect(balance.toNumber()).to.equal(100);
    await addTx.wait()

    // Grant 50 xp and remaining balance is 50
    txData = await gameManagerDaoFacet.grantExperience([aavegotchiID], [50]);
    expect(await signerDaoFacet.gameManagerBalance(gameManager.address)).to.equal(50);

    // Try grant 80 xp and check error
  
      await expect(gameManagerDaoFacet.grantExperience([aavegotchiID], [80])).to.be.revertedWith("DAOFacet: Game Manager's xp grant limit is reached")

    // Balance is not changed
    expect(await signerDaoFacet.gameManagerBalance(gameManager.address)).to.equal(50);
  })

  it('should reject general users to grant experience', async function(){
    const generalUserDaoFacet = await daoFacet.connect(generalUser);
    // Check if game manager
    let isManager = await signerDaoFacet.isGameManager(generalUser.address);
    expect(isManager).to.equal(false);

   
    await expect(generalUserDaoFacet.grantExperience([aavegotchiID], [50])).to.be.revertedWith("LibAppStorage: Do not have access")
   
  })
})