import { ethers } from "hardhat";
import { BigNumber, BigNumberish, Signer } from "ethers";
import { expect } from "chai";
import { ThirdPartyDistributor, ERC20MintableBurnable } from "../../typechain";

describe("Third Party Distribution Test", async () => {
  let token1: ERC20MintableBurnable;
  let token2: ERC20MintableBurnable;
  let distributor: ThirdPartyDistributor;
  let owner: Signer;
  let beneficiaries: Signer[];
  let otherSigners: Signer[];

  before(async () => {
    const accounts = await ethers.getSigners();
    owner = accounts[0];
    beneficiaries = accounts.slice(1, 5);
    otherSigners = accounts.slice(5, 10);
    token1 = (await (
      await ethers.getContractFactory("ERC20MintableBurnable")
    ).deploy()) as ERC20MintableBurnable;
    token2 = (await (
      await ethers.getContractFactory("ERC20MintableBurnable")
    ).deploy()) as ERC20MintableBurnable;
  });

  it("Should deploy with multiple beneficiaries", async () => {
    distributor = (await (
      await ethers.getContractFactory("ThirdPartyDistributor")
    ).deploy(
      await owner.getAddress(),
      [
        {
          beneficiary: await beneficiaries[0].getAddress(),
          proportion: 80,
        },
        {
          beneficiary: await beneficiaries[1].getAddress(),
          proportion: 11,
        },
        {
          beneficiary: await beneficiaries[2].getAddress(),
          proportion: 9,
        },
      ],
      0
    )) as ThirdPartyDistributor;
    let distributions: any[] = [];
    distributions.push(await distributor.distributions(0));
    distributions.push(await distributor.distributions(1));
    distributions.push(await distributor.distributions(2));
    expect(distributions[0].beneficiary).to.equal(
      await beneficiaries[0].getAddress()
    );
    expect(distributions[1].beneficiary).to.equal(
      await beneficiaries[1].getAddress()
    );
    expect(distributions[2].beneficiary).to.equal(
      await beneficiaries[2].getAddress()
    );
    expect(distributions[0].proportion).to.equal(80);
    expect(distributions[1].proportion).to.equal(11);
    expect(distributions[2].proportion).to.equal(9);
    expect(await distributor.numBeneficiaries()).to.equal(3);
  });
  it("Should be able to update distributions", async () => {
    await distributor.connect(owner).updateDistribution([
      {
        beneficiary: await beneficiaries[1].getAddress(),
        proportion: 90,
      },
      {
        beneficiary: await beneficiaries[0].getAddress(),
        proportion: 10,
      },
    ]);
    let distributions: any[] = [];
    distributions.push(await distributor.distributions(0));
    distributions.push(await distributor.distributions(1));
    expect(distributions[0].beneficiary).to.equal(
      await beneficiaries[1].getAddress()
    );
    expect(distributions[1].beneficiary).to.equal(
      await beneficiaries[0].getAddress()
    );
    expect(distributions[0].proportion).to.equal(90);
    expect(distributions[1].proportion).to.equal(10);
    expect(await distributor.numBeneficiaries()).to.equal(2);
  });
  it("Should not be able to update distributions with sum > 100", async () => {
    await expect(
      distributor.connect(owner).updateDistribution([
        {
          beneficiary: await beneficiaries[0].getAddress(),
          proportion: 80,
        },
        {
          beneficiary: await beneficiaries[1].getAddress(),
          proportion: 21,
        },
      ])
    ).to.be.revertedWith("SumOfDistributionsNot100(101)");
  });
  it("Should not be able to update distributions with sum < 100", async () => {});
  describe("Public Release", async () => {
    it("Should be able to batch partial release", async () => {});
    it("Should be able to batch release", async () => {});
    it("Should revert if amount is too high", async () => {});
  });
  describe("Owner Release", async () => {
    it("Should be able to release as owner");
    it("Should not be able to release as not owner");
  });
  describe("Beneficiary Release", async () => {
    it("Should be able to release as beneficiary");
    it("Should not be able to release as not beneficiary");
  });
  describe("Owner or Beneficiary Release", async () => {
    it("Should be able to release as owner");
    it("Should be able to release as beneficiary");
    it("Should not be able to release as not owner or beneficiary");
  });
});
