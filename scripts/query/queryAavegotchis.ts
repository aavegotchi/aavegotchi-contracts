import { request } from "graphql-request";
import { UserGotchisOwned } from "../../types";

let queryData: any;
const maticGraphUrl: string =
  "https://api.thegraph.com/subgraphs/name/aavegotchi/aavegotchi-core-matic";
//"https://api.thegraph.com/subgraphs/name/aavegotchi/aavegotchi-core-matic";
const ethGraphUrl: string =
  "https://thegraph.com/hosted-service/subgraph/aavegotchi/aavegotchi-ethereum";

export async function getPolygonGotchis(
  addresses: string[]
): Promise<UserGotchisOwned[]> {
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

  const res = await request(maticGraphUrl, queryData);
  return res.users;
}

export async function getMainnetGotchis(
  addresses: string[]
): Promise<UserGotchisOwned[]> {
  queryData = `
  {users(where:{id_in:[${addresses.map(
    (add: string) => '"' + add + '"'
  )}]},first:1000) {
    id
    gotchisOwned(first:1000) {
      id
    }}}
  `;

  const res = await request(maticGraphUrl, queryData);
  return res.users;
}
