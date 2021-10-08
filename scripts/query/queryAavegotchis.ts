const { request, gql } = require("graphql-request");
const {
  LiquidityManagerSigProp,
} = require("../../data/airdrops/sigprop/LiquidityManagerSigProp.ts");
let queryData: any;

async function out() {
  queryData = `
  {users(where:{id_in:[${LiquidityManagerSigProp.map(
    (add: string) => '"' + add + '"'
  )}]},first:1000) {
    id
    gotchisOwned(first:1000) {
      id
    }}
    
    users(where:{id_in:[${LiquidityManagerSigProp.map(
      (add: string) => '"' + add + '"'
    )}]},first:100,skip:100) {
      id
      gotchisOwned(first:1000) {
        id
      }
  }
  }
`;

  request(
    "https://api.thegraph.com/subgraphs/name/aavegotchi/aavegotchi-core-matic",
    queryData
  ).then((data: { users: any }) =>
    console.log(JSON.stringify(data.users), data.users.length)
  );
}

async function getMainnetGotchis() {
  queryData = `
  {users(where:{id_in:[${LiquidityManagerSigProp.map(
    (add: string) => '"' + add + '"'
  )}]},first:1000) {
    id
    gotchisOwned(first:1000) {
      id
    }}}
  `;
  request(
    "https://api.thegraph.com/subgraphs/name/froid1911/aavegotchi-eth-subgraph",
    queryData
  ).then((data: { users: any }) =>
    console.log(JSON.stringify(data.users), data.users.length)
  );
}
//out();
getMainnetGotchis();
