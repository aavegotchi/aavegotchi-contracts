import request from "graphql-request";
import { snapshotGraphUrl } from "../../helpers/constants";

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

interface Voter {
  voter: string;
}

export async function getVotingAddresses(proposalId: string) {
  let votingAddresses: string[] = [];
  const addresses = await request(snapshotGraphUrl, graphqlRequest(proposalId));

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

  console.log("Found voting addresses:", votingAddresses.length);
  // console.log(votingAddresses.slice(30, 600));

  return votingAddresses;
}
