import { ethers, network } from "hardhat";
import { impersonate } from "../scripts/helperFunctions";
import { Voting } from "../typechain";
import { expect } from "chai";

const aragonAddress = '0x93CF86a83bAA323407857C0A25e768869E12C721'
const voteCreator = '0x8eFea71B63DB02C00229794d90ec4ba8ecD4Ea81'
const supportAgtHolders = ['0xEaFa2626c7194EE7332e5F7cB719754786c719E6', '0xA68b381b1Ab044618F3030d1c1B7CEd5c514CB81', '0x91a8D9000eBf2594DdD06b5D77097Dd31F8CaB60']
const unsupportAgtHolders = ['0x153667ed39BA421160CA7C0413C98262AdE88e38']
// const agtHolders = ['0xEaFa2626c7194EE7332e5F7cB719754786c719E6', '0xA68b381b1Ab044618F3030d1c1B7CEd5c514CB81', '0x91a8D9000eBf2594DdD06b5D77097Dd31F8CaB60', '0x153667ed39BA421160CA7C0413C98262AdE88e38', '0x585E06CA576D0565a035301819FD2cfD7104c1E8', ]

const newMinQuorum = "400000000000000000"
const newMinQuorum1 = "740000000000000000"
const newSupportRequiredPct = "740000000000000000"

const supportRequiredPctChanger = '0x93CF86a83bAA323407857C0A25e768869E12C721'
const minAcceptQuorumChanger = '0x93CF86a83bAA323407857C0A25e768869E12C721'
// const supportRequiredPctChangers = ['0x054086d40cf8Fd5bF6200eDa7f9C6877B0302dd1','0x5a1aEB260C119F72B11fc218cDF163d474cEFAcC',
//   '0x0C97d7f0864B08E8f49A37FA4fBd52e340f63557', '0xb677136aC25e5e8763Eaf7f80D54de7D86313546',]

describe("Aragon vote test", async function () {
  this.timeout(200000000);

  let votingContract: Voting;
  let votingContractWithCreator: Voting;
  let voteTime: number;

  before(async function() {
    votingContract = (await ethers.getContractAt(
      "Voting",
      aragonAddress
    )) as Voting;

    voteTime = (await votingContract.voteTime()).toNumber()

    // create new vote
    votingContractWithCreator = await impersonate(
      voteCreator,
      votingContract,
      ethers,
      network
    );
    await network.provider.request({
      method: "hardhat_setBalance",
      params: [voteCreator, "0x100000000000000000000000"],
    });
    await network.provider.request({
      method: "hardhat_setBalance",
      params: [minAcceptQuorumChanger, "0x100000000000000000000000"],
    });
    await network.provider.request({
      method: "hardhat_setBalance",
      params: [supportRequiredPctChanger, "0x100000000000000000000000"],
    });
  })

  it("Should be rejected before changeSupportRequiredPct", async function () {
    const receipt = await (await votingContractWithCreator["newVote(bytes,string)"]([], "")).wait();
    const event = receipt!.events!.find((e) => e.event === "StartVote")
    const voteId = event!.args!.voteId;

    for (let x = 0; x < supportAgtHolders.length; x++) {
      votingContract = await impersonate(
        supportAgtHolders[x],
        votingContract,
        ethers,
        network
      );
      await (await votingContract.vote(voteId, true, true)).wait();
    }

    for (let x = 0; x < unsupportAgtHolders.length; x++) {
      votingContract = await impersonate(
        unsupportAgtHolders[x],
        votingContract,
        ethers,
        network
      );
      await (await votingContract.vote(voteId, false, true)).wait();
    }

    ethers.provider.send('evm_increaseTime', [voteTime + 100])
    ethers.provider.send('evm_mine')

    // console.log(`vote: `, await votingContract.getVote(voteId));
    console.log(`can execute: `, await votingContract.canExecute(voteId));
    expect(await votingContract.canExecute(voteId)).to.equal(false);
  });

  it("Should be rejected after changeSupportRequiredPct and has not min quorum", async function () {
    const votingContractWithQuorumChanger = await impersonate(
      minAcceptQuorumChanger,
      votingContract,
      ethers,
      network
    );
    let receipt = await (await votingContractWithQuorumChanger.changeMinAcceptQuorumPct(newMinQuorum1)).wait();
    let event = receipt!.events!.find((e) => e.event === "ChangeMinQuorum")
    expect(event!.args.minAcceptQuorumPct.toString()).to.equal(newMinQuorum1);

    const votingContractWithPctChanger = await impersonate(
      supportRequiredPctChanger,
      votingContract,
      ethers,
      network
    );
    receipt = await (await votingContractWithPctChanger.changeSupportRequiredPct(newSupportRequiredPct)).wait();
    event = receipt!.events!.find((e) => e.event === "ChangeSupportRequired")
    expect(event!.args.supportRequiredPct.toString()).to.equal(newSupportRequiredPct);

    receipt = await (await votingContractWithCreator["newVote(bytes,string)"]([], "")).wait();
    event = receipt!.events!.find((e) => e.event === "StartVote")
    const voteId = event!.args!.voteId;

    for (let x = 0; x < supportAgtHolders.length; x++) {
      votingContract = await impersonate(
        supportAgtHolders[x],
        votingContract,
        ethers,
        network
      );
      await (await votingContract.vote(voteId, true, true)).wait();
    }

    for (let x = 0; x < unsupportAgtHolders.length; x++) {
      votingContract = await impersonate(
        unsupportAgtHolders[x],
        votingContract,
        ethers,
        network
      );
      await (await votingContract.vote(voteId, false, true)).wait();
    }

    ethers.provider.send('evm_increaseTime', [voteTime + 100])
    ethers.provider.send('evm_mine')

    // console.log(`vote: `, await votingContract.getVote(voteId));
    console.log(`can execute: `, await votingContract.canExecute(voteId));
    expect(await votingContract.canExecute(voteId)).to.equal(false);
  });

  it("Should be executed after changeSupportRequiredPct and has min quorum", async function () {
    const votingContractWithQuorumChanger = await impersonate(
      minAcceptQuorumChanger,
      votingContract,
      ethers,
      network
    );
    let receipt = await (await votingContractWithQuorumChanger.changeMinAcceptQuorumPct(newMinQuorum)).wait();
    let event = receipt!.events!.find((e) => e.event === "ChangeMinQuorum")
    expect(event!.args.minAcceptQuorumPct.toString()).to.equal(newMinQuorum);

    const votingContractWithPctChanger = await impersonate(
      supportRequiredPctChanger,
      votingContract,
      ethers,
      network
    );
    receipt = await (await votingContractWithPctChanger.changeSupportRequiredPct(newSupportRequiredPct)).wait();
    event = receipt!.events!.find((e) => e.event === "ChangeSupportRequired")
    expect(event!.args.supportRequiredPct.toString()).to.equal(newSupportRequiredPct);

    receipt = await (await votingContractWithCreator["newVote(bytes,string)"]([], "")).wait();
    event = receipt!.events!.find((e) => e.event === "StartVote")
    const voteId = event!.args!.voteId;

    for (let x = 0; x < supportAgtHolders.length; x++) {
      votingContract = await impersonate(
        supportAgtHolders[x],
        votingContract,
        ethers,
        network
      );
      await (await votingContract.vote(voteId, true, true)).wait();
    }

    for (let x = 0; x < unsupportAgtHolders.length; x++) {
      votingContract = await impersonate(
        unsupportAgtHolders[x],
        votingContract,
        ethers,
        network
      );
      await (await votingContract.vote(voteId, false, true)).wait();
    }

    ethers.provider.send('evm_increaseTime', [voteTime + 100])
    ethers.provider.send('evm_mine')

    // console.log(`vote: `, await votingContract.getVote(voteId));
    console.log(`can execute: `, await votingContract.canExecute(voteId));
    expect(await votingContract.canExecute(voteId)).to.equal(true);
  });
});
