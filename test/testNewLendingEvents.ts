/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";

import { impersonate } from "../scripts/helperFunctions";
import { GotchiLendingFacet, LendingGetterAndSetterFacet } from "../typechain";
import { expect } from "chai";
import { upgrade } from "../scripts/upgrades/upgrade-kinshipBurning";

import { BigNumber, ContractReceipt } from "ethers";

const gCancel = [
  `event GotchiLendingCancelled((uint32 listingId,address lender,uint32 tokenId,uint96 initialCost,uint32 period,uint8[3] revenueSplit,address originalOwner,address thirdParty,uint32 whitelistId,address[] revenueTokens,uint256 timeCancelled,uint256 channellingStatus))`,
];
const gAdd = [
  `event GotchiLendingAdded((uint32 listingId,address lender,uint32 tokenId,uint96 initialCost,uint32 period,uint8[3] revenueSplit,address originalOwner,address thirdParty,uint32 whitelistId,address[] revenueTokens,uint256 timeCreated,uint256 channellingStatus))`,
];
const gExecute = [
  `event GotchiLendingExecuted((uint32 listingId,address lender,address borrower,uint32 tokenId,uint96 initialCost,uint32 period,uint8[3] revenueSplit,address originalOwner,address thirdParty,uint32 whitelistId,address[] revenueTokens,uint256 timeAgreed,uint256 channellingStatus))`,
];

const gClaim = [
  `event GotchiLendingClaimed((uint32 listingId,address lender,address borrower,uint32 tokenId,uint96 initialCost,uint32 period,uint8[3] revenueSplit,address originalOwner,address thirdParty,uint32 whitelistId,address[] revenueTokens,uint256[] amounts,uint256 timeClaimed,uint256 channellingStatus))`,
];

const gEnd = [
  `event GotchiLendingEnded((uint32 listingId,address lender,address borrower,uint32 tokenId,uint96 initialCost,uint32 period,uint8[3] revenueSplit,address originalOwner,address thirdParty,uint32 whitelistId,address[] revenueTokens,uint256 timeEnded,uint256 channellingStatus))`,
];

const user: string = "0x4083FE56Ed8e2784CD720ec6851a01E7e931076b";
interface IGotchiLending {
  listingId: string;
  lender: string;
  tokenId: BigNumber;
  initialCost: BigNumber;
  period: number;
  revenueSplit: [BigNumber, BigNumber, BigNumber];
  originalOwner: string;
  thirdParty: string;
  whitelistId: BigNumber;
  revenueTokens: string[];
  timeCancelled?: BigNumber;
  timeEnded?: BigNumber;
  timeClaimed?: BigNumber;
  timeAgreed?: BigNumber;
  timeCreated?: BigNumber;
  borrower?: string;
  channellingStatus: BigNumber;
}

let gotchiLendingFacet: GotchiLendingFacet;
let getAndSetFacet: LendingGetterAndSetterFacet;
describe("Testing Correct events for lending actions", async function () {
  this.timeout(3000000);
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";

  let newListingId: string;
  let owner: string;

  let cancellationDetails: {
    tokenId: any;
    initialCost: any;
    period: any;
    revenueSplit: any;
    originalOwner: any;
    thirdParty: any;
    whitelistId: any;
    revenueTokens: any;
    channellingStatus: any;
    listingId?: string;
    lender?: string;
    timeCancelled?: number;
  };

  // this.timeout(300000)
  before(async function () {
    await upgrade();

    gotchiLendingFacet = (await ethers.getContractAt(
      "GotchiLendingFacet",
      diamondAddress
    )) as GotchiLendingFacet;

    getAndSetFacet = (await ethers.getContractAt(
      "LendingGetterAndSetterFacet",
      diamondAddress
    )) as LendingGetterAndSetterFacet;

    // aavegotchiFacet = (await ethers.getContractAt(
    //   "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
    //   diamondAddress
    // )) as AavegotchiFacet;
  });

  it("Test event for lending cancellation ", async function () {
    const listingId = "1730619";

    const info = await getAndSetFacet.getLendingListingInfo(listingId);

    gotchiLendingFacet = await impersonate(
      info.lender,
      gotchiLendingFacet,
      ethers,
      network
    );

    //make sure the listingCancelled event is emitted

    const GotchiLendingCancellation = {
      listingId: listingId,
      lender: info.lender,
      tokenId: info.erc721TokenId,
      initialCost: info.initialCost,
      period: info.period,
      revenueSplit: info.revenueSplit,
      originalOwner: info.originalOwner,
      thirdParty: info.thirdParty,
      whitelistId: info.whitelistId,
      revenueTokens: info.revenueTokens,
      timeCancelled: getCurrentTimestamp(),
      channellingStatus: 0,
    };

    //cache details for later
    cancellationDetails = GotchiLendingCancellation;

    const tx = await gotchiLendingFacet.cancelGotchiLending(listingId);
    const tx2 = await tx.wait();

    owner = info.lender;

    modularAssert("cancel", tx2, GotchiLendingCancellation);
  });

  it("Test event for lending creation ", async function () {
    //make sure the listingCancelled event is emitted
    //create similar listing
    const tx = await gotchiLendingFacet.addGotchiLending(
      cancellationDetails.tokenId,
      cancellationDetails.initialCost,
      cancellationDetails.period,
      cancellationDetails.revenueSplit,
      cancellationDetails.originalOwner,
      cancellationDetails.thirdParty,
      cancellationDetails.whitelistId,
      cancellationDetails.revenueTokens,
      0
    );

    const tx2 = await tx.wait();

    newListingId = await modularAssert("add", tx2, cancellationDetails);
  });

  it("Test for channeling permission changes", async function () {
    getAndSetFacet = await impersonate(owner, getAndSetFacet, ethers, network);

    const tx = await getAndSetFacet.setLendingChannelingStatus(newListingId, 1);

    const tx2 = await tx.wait();

    const newChannelingStatus = await getAndSetFacet.getListingChannelingStatus(
      newListingId
    );

    expect(newChannelingStatus).to.equal(1);
  });

  it("Test event for lending execution ", async function () {
    gotchiLendingFacet = await impersonate(
      user,
      gotchiLendingFacet,
      ethers,
      network
    );
    const tx = await gotchiLendingFacet.agreeGotchiLending(
      newListingId,
      cancellationDetails.tokenId,
      cancellationDetails.initialCost,
      cancellationDetails.period,
      cancellationDetails.revenueSplit
    );
    const tx2 = await tx.wait();

    cancellationDetails.listingId = newListingId;
    newListingId = await modularAssert("execute", tx2, cancellationDetails);
  });

  it("Cannot change channeling status while listing has been executed", async function () {
    getAndSetFacet = await impersonate(owner, getAndSetFacet, ethers, network);

    await expect(
      getAndSetFacet.setLendingChannelingStatus(newListingId, 1)
    ).to.be.revertedWith("LibGotchiLending: Listing already agreed");
  });

  it("Test event for lending claim ", async function () {
    const tx = await gotchiLendingFacet.claimGotchiLending(
      cancellationDetails.tokenId
    );
    const tx2 = await tx.wait();

    modularAssert("claim", tx2, cancellationDetails);
  });

  it("Test event for lending end", async function () {
    //warp time by 2 days
    await network.provider.send("evm_increaseTime", [172800]);
    await network.provider.send("evm_mine");

    const tx = await gotchiLendingFacet.claimAndEndGotchiLending(
      cancellationDetails.tokenId
    );
    const tx2 = await tx.wait();

    modularAssert("end", tx2, cancellationDetails);
  });
});

async function modularAssert(
  action: "add" | "execute" | "cancel" | "claim" | "end",
  dataIn: ContractReceipt,
  info: any
) {
  //get the last event

  const data = dataIn.events![dataIn.events!.length - 1];

  const ev = {
    topics: data.topics,
    data: data.data,
  };
  let pItems: IGotchiLending[] = [];
  if (action === "add") {
    pItems = parse(ev, gAdd) as IGotchiLending[];
    expect(pItems[0].timeCreated).within(
      info.timeCancelled - 100,
      info.timeCancelled + 100
    );
  }
  if (action === "execute") {
    pItems = parse(ev, gExecute) as IGotchiLending[];
    expect(pItems[0].timeAgreed).within(
      info.timeCancelled - 100,
      info.timeCancelled + 100
    );
  }
  if (action === "cancel") {
    pItems = parse(ev, gCancel) as IGotchiLending[];
    expect(pItems[0].timeCancelled).within(
      info.timeCancelled - 100,
      info.timeCancelled + 100
    );
  }
  if (action === "claim") {
    pItems = parse(ev, gClaim) as IGotchiLending[];
    expect(pItems[0].timeClaimed).within(
      info.timeCancelled - 100,
      info.timeCancelled + 100
    );
  }
  if (action === "end") {
    pItems = parse(ev, gEnd) as IGotchiLending[];
  }

  if (action !== "add") {
    expect(pItems[0].listingId.toString()).to.eql(info.listingId.toString());
  }

  expect(pItems[0].lender).to.equal(info.lender);
  expect(pItems[0].tokenId).to.equal(info.tokenId);
  expect(pItems[0].initialCost).to.equal(info.initialCost);
  expect(pItems[0].period).to.equal(info.period);
  expect(pItems[0].revenueSplit.length).to.equal(info.revenueSplit.length);
  expect(pItems[0].originalOwner).to.equal(info.originalOwner);
  expect(pItems[0].thirdParty).to.equal(info.thirdParty);
  expect(pItems[0].whitelistId).to.equal(info.whitelistId);
  expect(pItems[0].revenueTokens.length).to.equal(info.revenueTokens.length);

  const currentChannelingStatus =
    await getAndSetFacet.getListingChannelingStatus(pItems[0].listingId);
  expect(pItems[0].channellingStatus).to.equal(currentChannelingStatus);

  return pItems[0].listingId;
}

//get current timestamp in seconds
function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

interface LogEvent {
  topics: string[];
  data: string;
}

function parse(e: LogEvent, abi: string[]) {
  let iface = new ethers.utils.Interface(abi);

  return iface.parseLog(e).args;
}
