import { request } from "graphql-request";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { GotchisOwned, UserGotchisOwned, VaultGotchisOwned } from "../../types";

export const maticGraphUrl: string =
  "https://api.thegraph.com/subgraphs/name/aavegotchi/aavegotchi-core-matic";
export const ethGraphUrl: string =
  "https://api.thegraph.com/subgraphs/name/aavegotchi/aavegotchi-ethereum";

export const vaultGraphUrl: string =
  "https://api.thegraph.com/subgraphs/name/aavegotchi/gotchi-vault";

function removeEmpty(userGotchisOwned: UserGotchisOwned[]): UserGotchisOwned[] {
  let removeEmpty: UserGotchisOwned[] = [];
  userGotchisOwned.forEach((element) => {
    if (element.gotchisOwned.length > 0) {
      removeEmpty.push(element);
    }
  });
  return removeEmpty;
}

function addGotchisOwned(includeStatus = false): string {
  let string = "";
  for (let index = 0; index < 5; index++) {
    string = string.concat(`batch${index}: gotchisOwned(first:1000, skip:${
      1000 * index
    }) {
    id
    ${includeStatus ? "status" : ""}
  }`);
  }
  return string;
}

interface QuerySubgraphResponse {
  batch0: UserGotchisOwned[];
  batch1: UserGotchisOwned[];
  batch2: UserGotchisOwned[];
  batch3: UserGotchisOwned[];
  batch4: UserGotchisOwned[];
  id: string;
}

async function querySubgraph(
  addresses: string[],
  url: string,
  includeStatus = true
) {
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
        ${addGotchisOwned(includeStatus)}
      }
  `);
  }

  queryData = queryData.concat(`}`);

  if (queryData == "{}") return [];

  const res = await request(url, queryData);

  let finalResponse: UserGotchisOwned[] = [];
  for (let index = 0; index < batches; index++) {
    const userBatches: QuerySubgraphResponse[] = res[`batch${index}`];

    let batchGotchis: UserGotchisOwned[] = [];

    userBatches.forEach((userResponse) => {
      let userGotchisOwned: GotchisOwned[] = [];

      for (let index = 0; index < 5; index++) {
        //@ts-ignore
        const gotchis: GotchisOwned[] = userResponse[`batch${index}`];
        userGotchisOwned = userGotchisOwned.concat(gotchis);
      }

      batchGotchis.push({
        gotchisOwned: userGotchisOwned,
        id: userResponse.id,
      });
    });

    finalResponse = finalResponse.concat(batchGotchis);
  }

  return removeEmpty(finalResponse);
}

export async function getSubgraphGotchis(
  addresses: string[]
): Promise<UserGotchisOwned[]> {
  console.log("Fetching Matic subgraph gotchis");
  return await querySubgraph(addresses, maticGraphUrl);
}

export async function getVaultGotchis(
  addresses: string[]
): Promise<UserGotchisOwned[]> {
  console.log("Fetching Vault subgraph gotchis");

  const batchSize = 150;

  const batches = Math.ceil(addresses.length / batchSize);

  let queryData = `{`;

  for (let index = 0; index < batches; index++) {
    const batchId = index;
    const offset = batchId * batchSize;
    queryData = queryData.concat(`
      batch${batchId}: owners(where:{id_in:[${addresses
      .slice(offset, offset + batchSize)
      .map(
        (add: string) => '"' + add.toLowerCase() + '"'
      )}]},first:${batchSize}) {
        id
        gotchis(first:1000) {
          id
        }}
  `);
  }

  queryData = queryData.concat(`}`);

  if (queryData == "{}") return [];

  const res = await request(vaultGraphUrl, queryData);

  let finalResponse: VaultGotchisOwned[] = [];
  for (let index = 0; index < batches; index++) {
    const batch: VaultGotchisOwned[] = res[`batch${index}`];
    finalResponse = finalResponse.concat(batch);
  }

  const userGotchisOwned: UserGotchisOwned[] = finalResponse.map((val) => {
    return {
      gotchisOwned: val.gotchis.map((gotchi) => {
        return { id: gotchi.id, status: "3" };
      }),
      id: val.id,
    };
  });

  return removeEmpty(userGotchisOwned);
}

export async function getEthSubgraphGotchis(
  addresses: string[]
): Promise<UserGotchisOwned[]> {
  console.log("Fetching ETH subgraph gotchis");

  return await querySubgraph(addresses, ethGraphUrl, false);
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

async function resolveAddresses(
  addresses: string[],
  hre: HardhatRuntimeEnvironment
) {
  //first batch into 1000 addresses each
  let finalAddresses: string[] = [];

  let ethSigner = new hre.ethers.providers.JsonRpcProvider(
    process.env.MAINNET_URL
  );

  for (let index = 0; index < addresses.length; index++) {
    let address = addresses[index];
    if (address.includes(".eth")) {
      const resolved = await ethSigner.resolveName(address);
      address = resolved ? resolved : address;
    }

    if (await hre.ethers.utils.isAddress(address)) {
      finalAddresses.push(address);
    }
  }
  return finalAddresses;
}

export async function getPolygonAndMainnetGotchis(
  addresses: string[],
  hre: HardhatRuntimeEnvironment
) {
  //resolve ENS names
  let finalAddresses: string[] = await resolveAddresses(addresses, hre);
  //Remove duplicate addresses
  addresses = [...new Set(finalAddresses)];

  const batchSize = 1000;
  const batches = Math.ceil(addresses.length / batchSize);
  let polygonUsers: UserGotchisOwned[] = [];
  let mainnetUsers: UserGotchisOwned[] = [];

  //Polygon
  for (let index = 0; index < batches; index++) {
    const batch = addresses.slice(index * batchSize, batchSize * (index + 1));
    //Get Polygon
    const users: UserGotchisOwned[] = await getSubgraphGotchis(batch);

    console.log(
      `Found ${users.length} users with ${users
        .map((val) => val.gotchisOwned.length)
        .reduce((prev, current) => prev + current)} Gotchis in Matic subgraph`
    );

    users.forEach((user) => {
      console.log(`${user.id} has ${user.gotchisOwned.length} gotchis`);
    });

    polygonUsers = polygonUsers.concat(users);
  }

  //Polygon (Vault)
  for (let index = 0; index < batches; index++) {
    const batch = addresses.slice(index * batchSize, batchSize * (index + 1));
    const vaultUsers: UserGotchisOwned[] = await getVaultGotchis(batch);

    if (vaultUsers.length > 0) {
      console.log(
        `Found ${vaultUsers.length} users with ${vaultUsers
          .map((val) => val.gotchisOwned.length)
          .reduce((prev, current) => prev + current)} Gotchis in Vault subgraph`
      );
      polygonUsers = polygonUsers.concat(vaultUsers);
    }
  }

  //Ethereum
  for (let index = 0; index < batches; index++) {
    const batch = addresses.slice(index * batchSize, batchSize * (index + 1));
    const users: UserGotchisOwned[] = await getEthSubgraphGotchis(batch);

    if (users.length > 0) {
      mainnetUsers = mainnetUsers.concat(users);
    }
  }

  let tokenIds: string[] = [];
  let notGotchis = 0;

  //Handle Polygon gotchis
  polygonUsers.forEach((user) => {
    user.gotchisOwned.forEach((gotchi) => {
      if (gotchi.status === "3") tokenIds.push(gotchi.id);
      else notGotchis++;
    });
  });

  //Handle mainnet Gotchis
  const mainnetTokenIds: string[] = [];
  mainnetUsers.forEach((user) => {
    user.gotchisOwned.forEach((gotchi) => {
      mainnetTokenIds.push(gotchi.id);
    });
  });
  //then get gotchi object on polygon for those gotchi ids to ensure they are gotchis (not portals)
  const finalMainnetIds = await queryAavegotchis(mainnetTokenIds);
  finalMainnetIds.aavegotchis.forEach((gotchi: GotchisOwned) => {
    if (gotchi.status === "3") tokenIds.push(gotchi.id);
    else notGotchis++;
  });

  //Remove duplicates
  tokenIds = [...new Set(tokenIds)];
  //Double check
  let checked: string[] = [];
  tokenIds.forEach((id) => {
    if (checked.includes(id)) throw new Error(`Duplicate ${id}`);
    checked.push(id);
  });

  const finalUsers = polygonUsers.concat(mainnetUsers);

  //Console logs
  const polygonGotchis = polygonUsers
    .map((item) => item.gotchisOwned.length)
    .reduce((agg, cur) => agg + cur);
  console.log(
    `Found ${polygonUsers.length} Polygon Users with ${polygonGotchis} Gotchis`
  );

  if (mainnetUsers.length > 0) {
    const mainnetGotchis = mainnetUsers
      .map((item) => item.gotchisOwned.length)
      .reduce((agg, cur) => agg + cur);
    console.log(
      `Found ${mainnetUsers.length} Ethereum Users with ${mainnetGotchis} Gotchis`
    );
  }

  return { finalUsers: finalUsers, tokenIds: tokenIds };
}
