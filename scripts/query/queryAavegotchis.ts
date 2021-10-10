const { request } = require("graphql-request");

let queryData: any;
const maticGraphUrl: string =
  "https://aavegotchi.stakesquid-frens.gq/subgraphs/name/aavegotchi/aavegotchi-core-matic";
//"https://api.thegraph.com/subgraphs/name/aavegotchi/aavegotchi-core-matic";
const ethGraphUrl: string =
  "https://thegraph.com/hosted-service/subgraph/aavegotchi/aavegotchi-ethereum";

export async function getPolygonGotchis(addresses: string[]) {
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

  await request(maticGraphUrl, queryData).then((data: { users: any }) => {
    return JSON.stringify(data.users);
    // console.log(JSON.stringify(data.users), data.users.length)
  });
}

export async function getMainnetGotchis(addresses: string[]) {
  queryData = `
  {users(where:{id_in:[${addresses.map(
    (add: string) => '"' + add + '"'
  )}]},first:1000) {
    id
    gotchisOwned(first:1000) {
      id
    }}}
  `;
  await request(ethGraphUrl, queryData).then((data: { users: any }) => {
    return JSON.stringify(data.users);
    // console.log(JSON.stringify(data.users), data.users.length)
  });
}
//getPolygonGotchis();
//getMainnetGotchis();
