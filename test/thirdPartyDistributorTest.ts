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
  it("Should not be able to update distributions with sum < 100", async () => {
    await expect(
      distributor.connect(owner).updateDistribution([
        {
          beneficiary: await beneficiaries[0].getAddress(),
          proportion: 80,
        },
        {
          beneficiary: await beneficiaries[1].getAddress(),
          proportion: 19,
        },
      ])
    ).to.be.revertedWith("SumOfDistributionsNot100(99)");
  });
  describe("Public Release", async () => {
    it("Should be able to batch partial release", async () => {
      await token1.mint(distributor.address, 100);
      await token2.mint(distributor.address, 1000);
      expect(await token1.balanceOf(distributor.address)).to.equal(100);
      expect(await token2.balanceOf(distributor.address)).to.equal(1000);
      await distributor.partialReleaseTokens([
        {
          token: token1.address,
          amount: 50,
        },
        {
          token: token2.address,
          amount: 500,
        },
      ]);
      expect(await token1.balanceOf(distributor.address)).to.equal(50);
      expect(await token2.balanceOf(distributor.address)).to.equal(500);
      expect(
        await token1.balanceOf(await beneficiaries[0].getAddress())
      ).to.equal(5);
      expect(
        await token1.balanceOf(await beneficiaries[1].getAddress())
      ).to.equal(45);
      expect(
        await token2.balanceOf(await beneficiaries[0].getAddress())
      ).to.equal(50);
      expect(
        await token2.balanceOf(await beneficiaries[1].getAddress())
      ).to.equal(450);
    });
    it("Should revert if amount is too high", async () => {
      await expect(
        distributor.partialReleaseToken(token1.address, 101)
      ).to.be.revertedWith('NotEnoughBalance("' + token1.address + '", 101)');
    });
    it("Should be able to batch release", async () => {
      await distributor.releaseTokens([token1.address, token2.address]);
      expect(await token1.balanceOf(distributor.address)).to.equal(0);
      expect(await token2.balanceOf(distributor.address)).to.equal(0);
      expect(
        await token1.balanceOf(await beneficiaries[0].getAddress())
      ).to.equal(10);
      expect(
        await token1.balanceOf(await beneficiaries[1].getAddress())
      ).to.equal(90);
      expect(
        await token2.balanceOf(await beneficiaries[0].getAddress())
      ).to.equal(100);
      expect(
        await token2.balanceOf(await beneficiaries[1].getAddress())
      ).to.equal(900);
    });
  });
  describe("Owner Release", async () => {
    it("Owner sets release call to onlyOwner and burn all tokens", async () => {
      await distributor.connect(owner).updateReleaseAccess(1);
      expect(await distributor.releaseAccess()).to.equal(1);
      await token1.burn(
        distributor.address,
        await token1.balanceOf(distributor.address)
      );
      await token2.burn(
        distributor.address,
        await token2.balanceOf(distributor.address)
      );
      await token1.burn(
        await beneficiaries[0].getAddress(),
        await token1.balanceOf(await beneficiaries[0].getAddress())
      );
      await token1.burn(
        await beneficiaries[1].getAddress(),
        await token1.balanceOf(await beneficiaries[1].getAddress())
      );
      await token2.burn(
        await beneficiaries[0].getAddress(),
        await token2.balanceOf(await beneficiaries[0].getAddress())
      );
      await token2.burn(
        await beneficiaries[1].getAddress(),
        await token2.balanceOf(await beneficiaries[1].getAddress())
      );
      expect(await token1.balanceOf(distributor.address)).to.equal(0);
      expect(await token2.balanceOf(distributor.address)).to.equal(0);
      expect(
        await token1.balanceOf(await beneficiaries[0].getAddress())
      ).to.equal(0);
      expect(
        await token1.balanceOf(await beneficiaries[1].getAddress())
      ).to.equal(0);
      expect(
        await token2.balanceOf(await beneficiaries[0].getAddress())
      ).to.equal(0);
      expect(
        await token2.balanceOf(await beneficiaries[1].getAddress())
      ).to.equal(0);
    });
    it("Should be able to release as owner", async () => {
      await token1.mint(distributor.address, 1000);
      expect(await token1.balanceOf(distributor.address)).to.equal(1000);
      await distributor.connect(owner).partialReleaseToken(token1.address, 50);
      expect(await token1.balanceOf(distributor.address)).to.equal(950);
    });
    it("Should not be able to release as not owner", async () => {
      await expect(
        distributor
          .connect(beneficiaries[0])
          .partialReleaseToken(token1.address, 50)
      ).to.be.revertedWith(
        'ImproperAccess("' + (await beneficiaries[0].getAddress()) + '", 1)'
      );
    });
  });
  describe("Beneficiary Release", async () => {
    it("Should be able to release as beneficiary", async () => {
      await distributor.connect(owner).updateReleaseAccess(2);
      await distributor
        .connect(beneficiaries[0])
        .partialReleaseToken(token1.address, 50);
      expect(await token1.balanceOf(distributor.address)).to.equal(900);
    });
    it("Should not be able to release as not beneficiary", async () => {
      await expect(
        distributor.connect(owner).partialReleaseToken(token1.address, 50)
      ).to.be.revertedWith(
        'ImproperAccess("' + (await owner.getAddress()) + '", 2)'
      );
    });
  });
  describe("Owner or Beneficiary Release", async () => {
    it("Should be able to release as owner", async () => {
      await distributor.connect(owner).updateReleaseAccess(3);
      await distributor.connect(owner).partialReleaseToken(token1.address, 50);
      expect(await token1.balanceOf(distributor.address)).to.equal(850);
    });
    it("Should be able to release as beneficiary", async () => {
      await distributor.connect(owner).updateReleaseAccess(3);
      await distributor
        .connect(beneficiaries[0])
        .partialReleaseToken(token1.address, 50);
      expect(await token1.balanceOf(distributor.address)).to.equal(800);
    });
    it("Should not be able to release as not owner or beneficiary", async () => {
      await expect(
        distributor
          .connect(otherSigners[0])
          .partialReleaseToken(token1.address, 50)
      ).to.be.revertedWith(
        'ImproperAccess("' + (await otherSigners[0].getAddress()) + '", 3)'
      );
    });
  });
});
