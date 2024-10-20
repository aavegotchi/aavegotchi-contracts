import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("WGHST", function () {
  let wghst: Contract;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const WGHST = await ethers.getContractFactory("WGHST");
    wghst = await WGHST.deploy();
    await wghst.deployed();
  });

  it("Should have correct name, symbol, and decimals", async function () {
    expect(await wghst.name()).to.equal("Wrapped GHST");
    expect(await wghst.symbol()).to.equal("WGHST");
    expect(await wghst.decimals()).to.equal(18);
  });

  it("Should allow deposits and withdrawals", async function () {
    const depositAmount = ethers.utils.parseEther("1");
    await wghst.deposit({ value: depositAmount });
    expect(await wghst.balanceOf(owner.address)).to.equal(depositAmount);

    await wghst.withdraw(depositAmount);
    expect(await wghst.balanceOf(owner.address)).to.equal(0);
  });

  it("Should emit Deposit and Withdrawal events", async function () {
    const depositAmount = ethers.utils.parseEther("1");
    await expect(wghst.deposit({ value: depositAmount }))
      .to.emit(wghst, "Deposit")
      .withArgs(owner.address, depositAmount);

    await expect(wghst.withdraw(depositAmount))
      .to.emit(wghst, "Withdrawal")
      .withArgs(owner.address, depositAmount);
  });

  it("Should handle receive function", async function () {
    const depositAmount = ethers.utils.parseEther("1");
    await owner.sendTransaction({ to: wghst.address, value: depositAmount });
    expect(await wghst.balanceOf(owner.address)).to.equal(depositAmount);
  });

  it("Should return correct total supply", async function () {
    const depositAmount = ethers.utils.parseEther("1");
    await wghst.deposit({ value: depositAmount });
    expect(await wghst.totalSupply()).to.equal(depositAmount);
  });

  it("Should allow approvals and transfers", async function () {
    const amount = ethers.utils.parseEther("1");
    await wghst.deposit({ value: amount });

    await expect(wghst.approve(addr1.address, amount))
      .to.emit(wghst, "Approval")
      .withArgs(owner.address, addr1.address, amount);

    expect(await wghst.allowance(owner.address, addr1.address)).to.equal(
      amount
    );

    await expect(wghst.transfer(addr1.address, amount))
      .to.emit(wghst, "Transfer")
      .withArgs(owner.address, addr1.address, amount);

    expect(await wghst.balanceOf(addr1.address)).to.equal(amount);
  });

  it("Should allow transferFrom", async function () {
    const amount = ethers.utils.parseEther("1");
    await wghst.deposit({ value: amount });
    await wghst.approve(addr1.address, amount);

    await expect(
      wghst.connect(addr1).transferFrom(owner.address, addr2.address, amount)
    )
      .to.emit(wghst, "Transfer")
      .withArgs(owner.address, addr2.address, amount);

    expect(await wghst.balanceOf(addr2.address)).to.equal(amount);
    expect(await wghst.allowance(owner.address, addr1.address)).to.equal(0);
  });

  it("Should handle max approval correctly", async function () {
    const amount = ethers.utils.parseEther("1");
    await wghst.deposit({ value: amount });
    await wghst.approve(addr1.address, ethers.constants.MaxUint256);

    await wghst
      .connect(addr1)
      .transferFrom(owner.address, addr2.address, amount);
    expect(await wghst.allowance(owner.address, addr1.address)).to.equal(
      ethers.constants.MaxUint256
    );
  });

  it("Should revert on insufficient balance", async function () {
    const amount = ethers.utils.parseEther("1");
    await expect(wghst.withdraw(amount)).to.be.revertedWithCustomError(
      wghst,
      "InsufficientBalance"
    );
    await expect(
      wghst.transfer(addr1.address, amount)
    ).to.be.revertedWithCustomError(wghst, "InsufficientBalance");
    await expect(
      wghst.transferFrom(owner.address, addr1.address, amount)
    ).to.be.revertedWithCustomError(wghst, "InsufficientBalance");
  });

  it("Should revert on insufficient allowance", async function () {
    const amount = ethers.utils.parseEther("1");
    await wghst.deposit({ value: amount });
    await expect(
      wghst.connect(addr1).transferFrom(owner.address, addr2.address, amount)
    ).to.be.revertedWithCustomError(wghst, "InsufficientAllowance");
  });
});
