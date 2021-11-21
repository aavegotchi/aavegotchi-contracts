import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { gasPrice, maticDiamondAddress } from "../scripts/helperFunctions";
import { LedgerSigner } from "@ethersproject/hardware-wallets";
import { Signer } from "@ethersproject/abstract-signer";
import { DAOFacet } from "../typechain";
import { ContractReceipt, ContractTransaction } from "@ethersproject/contracts";
import { UserGotchisOwned } from "../types";
import { getSubgraphGotchis } from "../scripts/query/queryAavegotchis";
import request from "graphql-request";

export interface GrantXPSnapshotTaskArgs {
  proposalId: string;
  propType: "coreprop" | "sigprop";
  batchSize: string;
}

export interface ProposalDetails {
  id: string;
  title: string;
  votes: number;
}

interface Voter {
  voter: string;
}

const snapshotHub = "https://hub.snapshot.org/graphql";

const graphqlRequest = (proposalId: string) => {
  return `
  {first1000: votes(first:1000, where:{proposal_in:["${proposalId}"]}) {
    voter
  }
    second1000:votes(skip:1000, first:1000, where:{proposal_in:["${proposalId}"]}) {
      voter
  }
     third1000:votes(skip: 2000, first:1000, where:{proposal_in:["${proposalId}"]}) {
      voter
  }
    fourth1000:votes(skip: 3000, first:1000, where:{proposal_in:["${proposalId}"]}) {
      voter
  }
    fifth1000:votes(skip: 4000, first:1000, where:{proposal_in:["${proposalId}"]}) {
      voter
    }
  }
  `;
};

async function getVotingAddresses(proposalId: string) {
  let votingAddresses: string[] = [];
  const addresses = await request(snapshotHub, graphqlRequest(proposalId));

  addresses.first1000.forEach((voter: Voter) => {
    votingAddresses.push(voter.voter);
  });

  addresses.second1000.forEach((voter: Voter) => {
    if (!votingAddresses.includes(voter.voter))
      votingAddresses.push(voter.voter);
  });

  addresses.third1000.forEach((voter: Voter) => {
    if (!votingAddresses.includes(voter.voter))
      votingAddresses.push(voter.voter);
  });

  addresses.fourth1000.forEach((voter: Voter) => {
    if (!votingAddresses.includes(voter.voter))
      votingAddresses.push(voter.voter);
  });

  addresses.fifth1000.forEach((voter: Voter) => {
    if (!votingAddresses.includes(voter.voter))
      votingAddresses.push(voter.voter);
  });

  console.log("final voting addresses:", votingAddresses);
  return votingAddresses;
}

async function getProposalDetails(proposalId: string) {
  const query = `
  {proposal(id:"${proposalId}") {
    id
    votes
    title
  }}
  `;

  const res = await request(snapshotHub, query);

  return res.proposal;
}

task("grantXP_snapshot", "Grants XP to Gotchis by addresses")
  .addParam("proposalId", "ID of the Snapshot proposal")
  .addParam("propType", "sigprop or coreprop")
  .addParam(
    "batchSize",
    "How many Aavegotchis to send at a time. Default is 500"
  )

  .setAction(
    async (
      taskArgs: GrantXPSnapshotTaskArgs,
      hre: HardhatRuntimeEnvironment
    ) => {
      const proposalId: string = taskArgs.proposalId;
      const xpAmount: number = taskArgs.propType === "sigprop" ? 10 : 20;
      const batchSize: number = Number(taskArgs.batchSize);

      const addresses = await getVotingAddresses(proposalId);
      const propDetails: ProposalDetails = await getProposalDetails(proposalId);

      if (propDetails.votes !== addresses.length) {
        throw new Error("Proposal voter count doesn't match");
      }

      const diamondAddress = maticDiamondAddress;
      const gameManager = "0x8D46fd7160940d89dA026D59B2e819208E714E82";
      console.log(gameManager);
      let signer: Signer;
      const testing = ["hardhat", "localhost"].includes(hre.network.name);
      if (testing) {
        await hre.network.provider.request({
          method: "hardhat_impersonateAccount",
          params: [gameManager],
        });
        signer = await hre.ethers.provider.getSigner(gameManager);
      } else if (hre.network.name === "matic") {
        const accounts = await hre.ethers.getSigners();
        signer = accounts[0]; /* new LedgerSigner(
          hre.ethers.provider,
          "hid",
          "m/44'/60'/2'/0/0"
        ); */
      } else {
        throw Error("Incorrect network selected");
      }

      //Get Polygon
      const polygonUsers: UserGotchisOwned[] = await getSubgraphGotchis(
        addresses,
        "matic"
      );
      const polygonGotchis = polygonUsers
        .map((item) => item.gotchisOwned.length)
        .reduce((agg, cur) => agg + cur);
      console.log(
        `Found ${polygonUsers.length} Polygon Users with ${polygonGotchis} Gotchis`
      );

      //Get mainnet
      const mainnetUsers: UserGotchisOwned[] = await getSubgraphGotchis(
        addresses,
        "eth"
      );
      const mainnetGotchis = mainnetUsers
        .map((item) => item.gotchisOwned.length)
        .reduce((agg, cur) => agg + cur);
      console.log(
        `Found ${mainnetUsers.length} Ethereum Users with ${mainnetGotchis} Gotchis`
      );

      const finalUsers = polygonUsers.concat(mainnetUsers);

      const tokenIds: string[] = [];

      //Extract token ids
      polygonUsers.forEach((user) => {
        user.gotchisOwned.forEach((gotchi) => {
          if (tokenIds.includes(gotchi.id))
            throw new Error(`Duplicate token ID: ${gotchi.id}`);
          else tokenIds.push(gotchi.id);
        });
      });

      mainnetUsers.forEach((user) => {
        user.gotchisOwned.forEach((gotchi) => {
          if (tokenIds.includes(gotchi.id))
            throw new Error(`Duplicate token ID: ${gotchi.id}`);
          else tokenIds.push(gotchi.id);
        });
      });

      //Check how many unused addresses there are (addresses that voted, but do not have Aavegotchis)
      const unusedAddresses: string[] = [];
      const lowerCaseAddresses = addresses.map((address: string) =>
        address.toLowerCase()
      );
      lowerCaseAddresses.forEach((address: string) => {
        const found = finalUsers.find((val) => val.id === address);
        if (!found) unusedAddresses.push(address);
      });

      console.log(
        `There were ${unusedAddresses.length} voting addresses without Gotchis.`
      );

      const batches = Math.ceil(tokenIds.length / batchSize);

      console.log(`Deploying ${taskArgs.propType}: ${propDetails.title}!!!`);

      console.log(
        `Sending ${xpAmount} XP to ${tokenIds.length} Aavegotchis in ${finalUsers.length} addresses!`
      );

      const dao = (
        await hre.ethers.getContractAt("DAOFacet", diamondAddress)
      ).connect(signer) as DAOFacet;

      for (let index = 0; index < batches; index++) {
        console.log("Current batch id:", index);

        const offset = batchSize * index;
        const sendTokenIds = tokenIds.slice(offset, offset + batchSize);

        console.log("send token ids:", sendTokenIds);

        console.log(
          `Sending ${xpAmount} XP to ${sendTokenIds.length} Aavegotchis `
        );

        const tx: ContractTransaction = await dao.grantExperience(
          sendTokenIds,
          Array(sendTokenIds.length).fill(xpAmount),
          { gasPrice: gasPrice }
        );
        console.log("tx:", tx.hash);
        let receipt: ContractReceipt = await tx.wait();
        // console.log("Gas used:", strDisplay(receipt.gasUsed.toString()));
        if (!receipt.status) {
          throw Error(`Error:: ${tx.hash}`);
        }
        console.log(
          "Airdropped XP to Aaavegotchis. Last tokenID:",
          sendTokenIds[sendTokenIds.length - 1]
        );
      }
    }
  );
