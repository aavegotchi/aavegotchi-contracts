import { ethers, network } from "hardhat";
import { impersonate } from "../scripts/helperFunctions";
import { AragonFundraisingController, IERC20 } from "../typechain";
import { expect } from "chai";
import { utils } from "ethers";

const reserveAddress = "0xfB76E9be55758d0042e003c1E46E186360F0627e"; // Treasury
const fundraisingControllerAddress =
  "0xe5ECFB44bccd7A585fA7F4a8E02C450e525AF2E4";
const collateralAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F"; // DAI
const sellerAddress = "0x188BBAe46d0821ffDbc0Db258c49e393CE2e0aA2";
const buyerAddress = "0x4eC8eDC38aE9DD5feF3fDb857DDBbb329B8E703F";
const collateralManagerAddress = "0xF63e1edbcb3BE8d5fB124F4A228F5412f48E5ae7";
const withdrawerAddress = "0xF63e1edbcb3BE8d5fB124F4A228F5412f48E5ae7";
const orderValue = "100000000000000000";

describe("Aragon Fundraising Close Test", async function () {
  this.timeout(200000000);

  let fundraisingController: AragonFundraisingController;
  let fundraisingControllerWithSeller: AragonFundraisingController;
  let fundraisingControllerWithBuyer: AragonFundraisingController;
  let fundraisingControllerWithCollateralManager: AragonFundraisingController;
  let fundraisingControllerWithWithdrawer: AragonFundraisingController;
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
    fundraisingControllerWithWithdrawer = await impersonate(
      withdrawerAddress,
      fundraisingController,
      ethers,
      network
    );

    collateral = (await ethers.getContractAt(
      "contracts/shared/interfaces/IERC20.sol:IERC20",
      collateralAddress
    )) as IERC20;

    marketMakerAddress = await fundraisingController.marketMaker();

    await network.provider.request({
      method: "hardhat_setBalance",
      params: [collateralManagerAddress, "0x100000000000000000000000"],
    });
    await network.provider.request({
      method: "hardhat_setBalance",
      params: [withdrawerAddress, "0x100000000000000000000000"],
    });
  });

  it("Order should be succeeded before removing collateral", async function () {
    let receipt = await (await fundraisingControllerWithSeller.openSellOrder(collateralAddress, orderValue)).wait();
    let topic = utils.id("OpenSellOrder(address,uint256,address,uint256)");
    let event = receipt!.events!.find(
      (event) => event.topics && event.topics[0] === topic
    );
    expect(event!.address).to.equal(marketMakerAddress);

    receipt = await (await fundraisingControllerWithBuyer.openBuyOrder(collateralAddress, orderValue)).wait();
    topic = utils.id("OpenBuyOrder(address,uint256,address,uint256,uint256)");
    event = receipt!.events!.find(
      (event) => event.topics && event.topics[0] === topic
    );
    expect(event!.address).to.equal(marketMakerAddress);
  });

  it("Order should be failed after removing collateral", async function () {
    await (
      await fundraisingControllerWithCollateralManager.removeCollateralToken(
        collateralAddress
      )
    ).wait();

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

  // it("Test withdraw removing collateral", async function () {
  //   const balanceBefore = await collateral.balanceOf(reserveAddress);
  //
  //   await (
  //     await fundraisingControllerWithWithdrawer.withdraw(
  //       collateralAddress
  //     )
  //   ).wait();
  //
  //   const balanceAfter = await collateral.balanceOf(reserveAddress);
  // });

});
