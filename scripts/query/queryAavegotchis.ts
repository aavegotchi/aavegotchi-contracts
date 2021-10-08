const { request, gql } = require("graphql-request");
const {
  addresses,
} = require("../../data/airdrops/coreprop/LiquidityManagerFrens.ts");
let queryData: any;
const maticGraphUrl: string =
  "https://api.thegraph.com/subgraphs/name/aavegotchi/aavegotchi-core-matic";
const ethGraphUrl: string =
  "https://thegraph.com/hosted-service/subgraph/aavegotchi/aavegotchi-ethereum";

async function getPolygonGotchis() {
  queryData = `
  {users(where:{id_in:[${addresses.map(
    (add: string) => '"' + add + '"'
  )}]},first:1000) {
    id
    gotchisOwned(first:1000) {
      id
    }}
    

  }
`;

  request(maticGraphUrl, queryData).then((data: { users: any }) =>
    console.log(JSON.stringify(data.users), data.users.length)
  );
}

async function getMainnetGotchis() {
  queryData = `
  {users(where:{id_in:[${addresses.map(
    (add: string) => '"' + add + '"'
  )}]},first:1000) {
    id
    gotchisOwned(first:1000) {
      id
    }}}
  `;
  request(ethGraphUrl, queryData).then((data: { users: any }) =>
    console.log(JSON.stringify(data.users), data.users.length)
  );
}
//getPolygonGotchis();
//getMainnetGotchis();
