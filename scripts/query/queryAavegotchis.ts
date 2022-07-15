import { request } from "graphql-request";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { GotchisOwned, UserGotchisOwned } from "../../types";

export const maticGraphUrl: string =
  "https://api.thegraph.com/subgraphs/name/aavegotchi/aavegotchi-core-matic";
export const ethGraphUrl: string =
  "https://api.thegraph.com/subgraphs/name/aavegotchi/aavegotchi-ethereum";

export async function getSubgraphGotchis(
  addresses: string[],
  network: "matic" | "eth"
): Promise<UserGotchisOwned[]> {
  const batchSize = 100;

  const batches = Math.ceil(addresses.length / batchSize);

  console.log("batches:", batches);

  let queryData = `{`;

  for (let index = 0; index < batches; index++) {
    const batchId = index;
    const offset = batchId * batchSize;
    queryData = queryData.concat(`
    batch${batchId}: users(where:{id_in:[${addresses
      .slice(offset, offset + batchSize)
      .map(
        (add: string) => '"' + add.toLowerCase() + '"'
      )}]},first:${batchSize}) {
      id
      gotchisOwned(first:1000) {
        id
        status
      }}
`);
  }

  queryData = queryData.concat(`}`);

  if (queryData == "{}") return [];

  const res = await request(
    network === "matic" ? maticGraphUrl : ethGraphUrl,
    queryData
  );

  let finalResponse: UserGotchisOwned[] = [];
  for (let index = 0; index < batches; index++) {
    const batch: UserGotchisOwned[] = res[`batch${index}`];
    finalResponse = finalResponse.concat(batch);
  }

  return finalResponse;
}

export async function getEthSubgraphGotchis(
  addresses: string[],
  network: "matic" | "eth"
): Promise<UserGotchisOwned[]> {
  const batchSize = 100;

  const batches = Math.ceil(addresses.length / batchSize);

  let queryData = `{`;

  for (let index = 0; index < batches; index++) {
    const batchId = index;
    const offset = batchId * batchSize;
    queryData = queryData.concat(`
    batch${batchId}: users(where:{id_in:[${addresses
      .slice(offset, offset + batchSize)
      .map(
        (add: string) => '"' + add.toLowerCase() + '"'
      )}]},first:${batchSize}) {
      id
      gotchisOwned(first:1000) {
        id
      }}
`);
  }

  queryData = queryData.concat(`}`);

  if (queryData == "{}") return [];

  const res = await request(
    network === "matic" ? maticGraphUrl : ethGraphUrl,
    queryData
  );

  let finalResponse: UserGotchisOwned[] = [];
  for (let index = 0; index < batches; index++) {
    const batch: UserGotchisOwned[] = res[`batch${index}`];
    finalResponse = finalResponse.concat(batch);
  }

  return finalResponse;
}

export async function queryAavegotchis(ids: string[]) {
  ids = ids.map((id) => `"${id}"`);

  const query = `
  {aavegotchis(where:{id_in:[${ids}]}) {
    id
    status
  }}
  `;

  const res = await request(maticGraphUrl, query);

  return res;
}

export async function getPolygonAndMainnetGotchis(
  addresses: string[],
  hre: HardhatRuntimeEnvironment
) {
  const finalAddresses: string[] = [];

  //first batch into 1000 addresses each

  // for (let index = 0; index < addresses.length; index++) {
  //   let address = addresses[index];
  //   if (address.includes(".eth")) {
  //     let ethSigner = new hre.ethers.providers.JsonRpcProvider(
  //       process.env.MAINNET_URL
  //     );

  //     const resolved = await ethSigner.resolveName(address);
  //     address = resolved.toString();
  //   }

  //   if (await hre.ethers.utils.isAddress(address)) {
  //     finalAddresses.push(address);
  //   }
  // }

  //Set new addresses after replacing .eth addresses with resolved names
  addresses = finalAddresses;

  const batchSize = 1000;
  const batches = Math.ceil(addresses.length / batchSize);

  let polygonUsers: UserGotchisOwned[] = [];

  for (let index = 0; index < batches; index++) {
    const batch = addresses.slice(index * batchSize, batchSize * (index + 1));

    //Get Polygon
    const users: UserGotchisOwned[] = await getSubgraphGotchis(batch, "matic");

    polygonUsers = polygonUsers.concat(users);
  }

  // polygonUsers.forEach((address) => {
  //   console.log(
  //     `address:" ${address.id} and gotchis owned: ${address.gotchisOwned.map(
  //       (got) => got.id
  //     )}`
  //   );
  // });

  const polygonGotchis = polygonUsers
    .map((item) => item.gotchisOwned.length)
    .reduce((agg, cur) => agg + cur);
  console.log(
    `Found ${polygonUsers.length} Polygon Users with ${polygonGotchis} Gotchis`
  );

  console.log("polygon gotchis:", polygonGotchis);

  //Get mainnet
  let mainnetUsers: UserGotchisOwned[] = [];

  for (let index = 0; index < batches; index++) {
    const batch = addresses.slice(index * batchSize, batchSize * (index + 1));

    //Get Ethereum
    const users: UserGotchisOwned[] = await getEthSubgraphGotchis(batch, "eth");
    mainnetUsers = mainnetUsers.concat(users);
  }

  const mainnetGotchis = mainnetUsers
    .map((item) => item.gotchisOwned.length)
    .reduce((agg, cur) => agg + cur);
  console.log(
    `Found ${mainnetUsers.length} Ethereum Users with ${mainnetGotchis} Gotchis`
  );

  const finalUsers = polygonUsers.concat(mainnetUsers);

  const tokenIds: string[] = [];

  //Handle Polygon gotchis
  polygonUsers.forEach((user) => {
    user.gotchisOwned.forEach((gotchi) => {
      if (gotchi.status === "3") {
        if (tokenIds.includes(gotchi.id))
          throw new Error(`Duplicate token ID: ${gotchi.id}`);
        else tokenIds.push(gotchi.id);
      } else {
        //console.log(`${gotchi.id} is not a gotchi! (Status: ${gotchi.status})`);
      }
    });
  });

  //Handle mainnet Gotchis
  let mainnetTokenIds: string[] = [];

  //first get all gotchis
  mainnetUsers.forEach((user) => {
    user.gotchisOwned.forEach((gotchi) => {
      if (tokenIds.includes(gotchi.id))
        throw new Error(`Duplicate token ID: ${gotchi.id}`);
      else mainnetTokenIds.push(gotchi.id);
    });
  });

  //then get gotchi object on polygon for those gotchi ids to ensure they are gotchis (not portals)
  const finalMainnetIds = await queryAavegotchis(mainnetTokenIds);
  finalMainnetIds.aavegotchis.forEach((gotchi: GotchisOwned) => {
    if (gotchi.status === "3") {
      if (tokenIds.includes(gotchi.id))
        throw new Error(`Duplicate token ID: ${gotchi.id}`);
      else tokenIds.push(gotchi.id);
    } else {
      // console.log(`${gotchi.id} is not a gotchi! (Status: ${gotchi.status})`);
    }
  });

  //final check to prevent duplicate token ids
  const checkedIds: string[] = [];
  tokenIds.forEach((id) => {
    if (checkedIds.includes(id)) {
      throw new Error("Duplicate id");
    }
    checkedIds.push(id);
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
    `There were ${unusedAddresses.length} addresses without Gotchis.`
  );

  return { finalUsers: finalUsers, tokenIds: tokenIds };
}
