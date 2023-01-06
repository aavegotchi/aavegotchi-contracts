import { ethers, network } from "hardhat";
import { impersonate } from "../scripts/helperFunctions";
import {
  ACL,
  Agent,
  AragonFundraisingController,
  IERC20,
  IKernel,
  Voting,
} from "../typechain";
import { encodeCallScript } from "@aragon/contract-helpers-test/src/aragon-os";
import { expect } from "chai";
import { utils } from "ethers";

const reserveAddress = "0xfB76E9be55758d0042e003c1E46E186360F0627e"; // Treasury
const fundraisingControllerAddress =
  "0xe5ECFB44bccd7A585fA7F4a8E02C450e525AF2E4";
const collateralAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F"; // DAI
const sellerAddress = "0xC97252f98B7159251D410fE237674dC5bF7465A1"; // DAI, GHST Holder
const buyerAddress = "0x0339BBf78947CeA3D07DA41493B8F0be541f78dc"; // DAI, GHST Holder

// Voting
const collateralManagerAddress = "0xF63e1edbcb3BE8d5fB124F4A228F5412f48E5ae7"; // proxy of voting contract
const voteCreator = "0x8eFea71B63DB02C00229794d90ec4ba8ecD4Ea81";
const ghstBridgeAddress = "0x40ec5B33f54e0E8A33A975908C5BA1c14e5BbbDf";
const voters = [
  "0xFFE6280ae4E864D9aF836B562359FD828EcE8020",
  "0x71BeeFcF9f31872CCEC0Bc9789f211609685205a",
  "0x50C114E2f3fA1DaFCfbE675b342f5868bf1727f0",
  ghstBridgeAddress,
]; // GHST holders

const withdrawerAddress = "0x968820f1b81AB25EAC8B3Dfcc3337752685640Ca"; // any address
const testAddress = "0xEaFa2626c7194EE7332e5F7cB719754786c719E6";
const orderValue = "1000000000000000";
const TRANSFER_ROLE =
  "0x8502233096d909befbda0999bb8ea2f3a6be3c138b9fbf003752a4c8bce86f6c";

describe("Aragon Fundraising Close Test", async function () {
  this.timeout(200000000);

  let fundraisingController: AragonFundraisingController;
  let fundraisingControllerWithSeller: AragonFundraisingController;
  let fundraisingControllerWithBuyer: AragonFundraisingController;
  let fundraisingControllerWithCollateralManager: AragonFundraisingController;
  let agentWithWithdrawer: Agent;
  let votingContract: Voting;
  let votingContractWithCreator: Voting;
  let collateral: IERC20;

  let marketMakerAddress: string;

  before(async function () {
    fundraisingController = (await ethers.getContractAt(
      "AragonFundraisingController",
      fundraisingControllerAddress
    )) as AragonFundraisingController;

    fundraisingControllerWithSeller = await impersonate(
      sellerAddress,
      fundraisingController,
      ethers,
      network
    );
    fundraisingControllerWithBuyer = await impersonate(
      buyerAddress,
      fundraisingController,
      ethers,
      network
    );
    fundraisingControllerWithCollateralManager = await impersonate(
      collateralManagerAddress,
      fundraisingController,
      ethers,
      network
    );

    const agent = (await ethers.getContractAt(
      "Agent",
      reserveAddress
    )) as Agent;
    agentWithWithdrawer = await impersonate(
      withdrawerAddress,
      agent,
      ethers,
      network
    );

    collateral = (await ethers.getContractAt(
      "contracts/shared/interfaces/IERC20.sol:IERC20",
      collateralAddress
    )) as IERC20;

    marketMakerAddress = await fundraisingController.marketMaker();

    votingContract = (await ethers.getContractAt(
      "Voting",
      collateralManagerAddress
    )) as Voting;
    votingContractWithCreator = await impersonate(
      voteCreator,
      votingContract,
      ethers,
      network
    );
    await network.provider.request({
      method: "hardhat_setBalance",
      params: [collateralManagerAddress, "0x100000000000000000000000"],
    });
    await network.provider.request({
      method: "hardhat_setBalance",
      params: [withdrawerAddress, "0x100000000000000000000000"],
    });
    await network.provider.request({
      method: "hardhat_setBalance",
      params: [voteCreator, "0x100000000000000000000000"],
    });
    for (let x = 0; x < voters.length; x++) {
      await network.provider.request({
        method: "hardhat_setBalance",
        params: [voters[x], "0x100000000000000000000000"],
      });
    }
  });

  it("Order should be succeeded before removing collateral", async function () {
    let receipt = await (
      await fundraisingControllerWithSeller.openSellOrder(
        collateralAddress,
        orderValue
      )
    ).wait();
    let topic = utils.id("OpenSellOrder(address,uint256,address,uint256)");
    let event = receipt!.events!.find(
      (event) => event.topics && event.topics[0] === topic
    );
    expect(event!.address).to.equal(marketMakerAddress);

    receipt = await (
      await fundraisingControllerWithBuyer.openBuyOrder(
        collateralAddress,
        orderValue
      )
    ).wait();
    topic = utils.id("OpenBuyOrder(address,uint256,address,uint256,uint256)");
    event = receipt!.events!.find(
      (event) => event.topics && event.topics[0] === topic
    );
    expect(event!.address).to.equal(marketMakerAddress);
  });

  it("Order should be failed after removing collateral", async function () {
    // remove collateral by vote
    const action = {
      to: fundraisingControllerAddress,
      calldata: fundraisingController.interface.encodeFunctionData(
        "removeCollateralToken",
        [collateralAddress]
      ),
    };
    const script = encodeCallScript([action]);
    const receipt = await (
      await votingContractWithCreator["newVote(bytes,string)"](script, "")
    ).wait();
    const event = receipt!.events!.find((e: any) => e.event === "StartVote");
    const voteId = event!.args!.voteId;

    for (let x = 0; x < voters.length; x++) {
      votingContract = await impersonate(
        voters[x],
        votingContract,
        ethers,
        network
      );
      await (await votingContract.vote(voteId, true, true)).wait();
    }
    // await (
    //   await fundraisingControllerWithCollateralManager.removeCollateralToken(
    //     collateralAddress
    //   )
    // ).wait();

    await expect(
      fundraisingControllerWithSeller.openSellOrder(
        collateralAddress,
        orderValue
      )
    ).to.be.revertedWith("MM_COLLATERAL_NOT_WHITELISTED");
    await expect(
      fundraisingControllerWithSeller.openBuyOrder(
        collateralAddress,
        orderValue
      )
    ).to.be.revertedWith("MM_COLLATERAL_NOT_WHITELISTED");
  });

  it("Test withdraw removing collateral", async function () {
    // grant transfer role by vote
    const kernelAddress = await fundraisingController.kernel();
    const kernel = (await ethers.getContractAt(
      "contracts/test/Voting.sol:IKernel",
      kernelAddress
    )) as IKernel;
    const aclAddress = await kernel.acl();
    const acl = (await ethers.getContractAt("ACL", kernelAddress)) as ACL;

    const action = {
      to: aclAddress,
      calldata: acl.interface.encodeFunctionData("grantPermission", [
        withdrawerAddress,
        reserveAddress,
        TRANSFER_ROLE,
      ]),
    };
    const script = encodeCallScript([action]);
    const receipt = await (
      await votingContractWithCreator["newVote(bytes,string)"](script, "")
    ).wait();
    const event = receipt!.events!.find((e: any) => e.event === "StartVote");
    const voteId = event!.args!.voteId;

    for (let x = 0; x < voters.length; x++) {
      votingContract = await impersonate(
        voters[x],
        votingContract,
        ethers,
        network
      );
      await (await votingContract.vote(voteId, true, true)).wait();
    }
    // console.log(
    //   `vote for granting transfer role: `,
    //   await votingContract.getVote(voteId)
    // );

    // transfer collateral after getting roles
    const balanceBefore = await collateral.balanceOf(reserveAddress);
    console.log(utils.formatEther(balanceBefore));
    await (
      await agentWithWithdrawer.transfer(
        collateralAddress,
        testAddress,
        balanceBefore
      )
    ).wait();

    const balanceAfter = await collateral.balanceOf(reserveAddress);
    console.log(utils.formatEther(balanceAfter));
    expect(balanceAfter).to.equal(0);
  });
});
