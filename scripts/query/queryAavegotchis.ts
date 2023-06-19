import { request } from "graphql-request";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  GotchisOwned,
  LendedGotchis,
  UserGotchisOwned,
  VaultGotchisOwned,
} from "../../types";

export const maticGraphUrl: string = process.env.SUBGRAPH_CORE_MATIC as string;

export const ethGraphUrl: string =
  "https://api.thegraph.com/subgraphs/name/aavegotchi/aavegotchi-ethereum";

export const vaultGraphUrl: string =
  "https://api.thegraph.com/subgraphs/name/aavegotchi/gotchi-vault";

export const blockllamaUrl: string = "https://coins.llama.fi/block/polygon";

interface Gotchi {
  id: string;
}

interface UsersWithGotchisRes {
  users: {
    id: string;
    batch1: Gotchi[];
    batch2: Gotchi[];
    batch3: Gotchi[];
    batch4: Gotchi[];
    batch5: Gotchi[];
    batch1owned: Gotchi[];
    batch2owned: Gotchi[];
    batch3owned: Gotchi[];
    batch4owned: Gotchi[];
    batch5owned: Gotchi[];
  }[];
}

export function getUsersWithGotchisOfAddresses(
  addresses: string[],
  blockNumber: number,
  index: Number = 0
): Promise<UsersWithGotchisRes> {
  let addressesString = addresses.map((e) => `"${e}"`).join(",");
  let query = `
    {users(skip: ${index} first: 1000 block:{number:${blockNumber}} where: {id_in: [${addressesString}]}) {
      id
      
      batch1: gotchisOriginalOwned(first: 1000 block:{number:${blockNumber}} ) {
        id
      }
      batch2: gotchisOriginalOwned(first: 1000 block:{number:${blockNumber}} skip: 1000) {
        id
      }
      batch3: gotchisOriginalOwned(first: 1000 block:{number:${blockNumber}} skip: 2000) {
        id
      }
      batch4: gotchisOriginalOwned(first: 1000 block:{number:${blockNumber}} skip: 3000) {
        id
      }
      batch5: gotchisOriginalOwned(first: 1000 block:{number:${blockNumber}} skip: 4000) {
        id
      }
      batch1owned: gotchisOwned(first: 1000 block:{number:${blockNumber}}) {
        id
      }
      batch2owned: gotchisOwned(first: 1000 block:{number:${blockNumber}} skip: 1000) {
        id
      }
      batch3owned: gotchisOwned(first: 1000 block:{number:${blockNumber}} skip: 2000) {
        id
      }
      batch4owned: gotchisOwned(first: 1000 block:{number:${blockNumber}} skip: 3000) {
        id
      }
      batch5owned: gotchisOwned(first: 1000 block:{number:${blockNumber}} skip: 4000) {
        id
      }
    }}
    `;
  return request(maticGraphUrl, query);
}

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
  batch5: UserGotchisOwned[];
  id: string;
}

interface UserWithGotchisAndLentOut extends QuerySubgraphResponse {
  gotchisLentOut: string[];
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
  return await querySubgraph(addresses, maticGraphUrl);
}

export async function getBorrowedGotchis(addresses: string[]) {
  addresses = addresses.map((val) => val.toLowerCase());

  const batchSize = 50;
  const rounds = 5;

  const batches = Math.ceil(addresses.length / batchSize);

  let queryData = `{`;

  for (let index = 0; index < batches; index++) {
    const batchId = index;
    const offset = batchId * batchSize;

    for (let r = 0; r < rounds; r++) {
      const skip = r * 1000;

      queryData = queryData.concat(`
      batch${batchId}_${r}: gotchiLendings(skip:${skip} first:1000 where:{completed:false, timeAgreed_gt:0, lender_in:[${addresses
        .slice(offset, offset + batchSize)
        .map((add: string) => '"' + add + '"')}]},first:1000) {
        gotchiTokenId
        lender
        }
  `);
    }
  }

  // console.log("querydata:", queryData);

  queryData = queryData.concat(`}`);

  if (queryData == "{}") return [];

  const res = await request(maticGraphUrl, queryData);

  let finalResponse: LendedGotchis[] = [];
  for (let index = 0; index < batches; index++) {
    const batch: LendedGotchis[] = res[`batch${index}`];

    if (batch.length >= 1000) {
      console.log(`batch ${index} length: ${batch.length}`);
      throw new Error("Slow down bub, you're probably missing some gotchis!");
    }

    console.log(`batch ${index} length: ${batch.length}`);
    finalResponse = finalResponse.concat(batch);
  }

  const userGotchisOwned: UserGotchisOwned[] = [];

  interface OwnerToGotchi {
    [id: string]: string[];
  }

  const ownerToGotchi: OwnerToGotchi = {};

  finalResponse.map((val) => {
    if (!addresses.includes(val.lender)) {
      throw new Error(
        `${val.gotchiTokenId} not owned by voting lender ${val.lender}`
      );
    }

    if (!ownerToGotchi[val.lender]) {
      ownerToGotchi[val.lender] = [val.gotchiTokenId];
    } else {
      ownerToGotchi[val.lender] = [
        ...ownerToGotchi[val.lender],
        val.gotchiTokenId,
      ];
    }
  });

  // console.log("owner to gotchi:", ownerToGotchi);

  Object.keys(ownerToGotchi).forEach((val: string) => {
    const gotchisOwned = ownerToGotchi[val].map((gotchi) => {
      // console.log(gotchi);
      return {
        id: gotchi,
        status: "3",
      };
    });

    gotchisOwned.forEach((gotchi) => {
      userGotchisOwned.push({
        id: val,
        gotchisOwned: gotchisOwned,
      });
    });
  });

  // console.log("user gotchis owned:", userGotchisOwned);

  return removeEmpty(userGotchisOwned);
}

export async function getVaultGotchis(
  addresses: string[],
  blockTag: number
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
      )}]},first:${batchSize},block:{number:${blockTag}}) {
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

interface GotchiLending {
  lender: string;
  borrower: string;
  gotchiTokenId: string;
}

export interface GotchiId {
  id: string;
}

interface LendingRes {
  gotchiLendings: GotchiLending[];
}

export async function fetchGotchiLending(total: GotchiLending[], skip: number) {
  console.log("Batch:", skip);

  let skipCount = skip * 1000;
  //First get all open Gotchi Lendings

  const query = `{
  gotchiLendings(first:1000 where:{timeAgreed_gt:0, gotchiTokenId_gt:${skipCount}, gotchiTokenId_lt:${
    (skip + 1) * 1000
  } completed:false}) {
    lender
    borrower
    gotchiTokenId
  }
}`;

  const result: LendingRes = await request(maticGraphUrl, query);

  total = total.concat(result.gotchiLendings);

  if (skip < 25) total = await fetchGotchiLending(total, skip + 1);

  return total;
}

export async function getPolygonAndMainnetGotchis(
  addresses: string[],
  blockTag: number,
  hre: HardhatRuntimeEnvironment
) {
  //Queries
  //Aavegotchis in ATTENDEE's wallet
  //Aavegotchis owned by ATTENDEE but are borrowed out
  //Aavegotchis in the VAULT that are owned by ATTENDEE
  //Aavegotchis in the VAULT that are owned by ATTENDEE but borrowed out
  //Aavegotchis owned by ATTENDEE on Ethereum

  let finalAddresses: string[] = await resolveAddresses(addresses, hre);
  //Remove duplicate addresses
  addresses = [...new Set(finalAddresses)].map((val) => val.toLowerCase());
  console.log("Addresses: ", addresses.length);

  // get gotchis and lentout
  let gotchiIds: string[] = [];
  let fetchedAddresses: string[] = [];
  let prevLength = 0;
  let index = 0;
  do {
    const result = await getUsersWithGotchisOfAddresses(
      addresses,
      blockTag,
      index
    );

    index += 1000;
    prevLength = gotchiIds.length;
    result.users.forEach((e) => {
      let gotchisOwned = e.batch1.map((f: GotchiId) => f.id);
      gotchisOwned = gotchisOwned.concat(e.batch2.map((f: GotchiId) => f.id));
      gotchisOwned = gotchisOwned.concat(e.batch3.map((f: GotchiId) => f.id));
      gotchisOwned = gotchisOwned.concat(e.batch4.map((f: GotchiId) => f.id));
      gotchisOwned = gotchisOwned.concat(e.batch5.map((f: GotchiId) => f.id));
      gotchiIds = gotchiIds.concat(gotchisOwned);
      fetchedAddresses.push(e.id);
    });
  } while (gotchiIds.length != prevLength);

  const batchSize = 1000;
  const batches = Math.ceil(addresses.length / batchSize);
  let mainnetUsers: UserGotchisOwned[] = [];

  // Fetch Gotchis in Vault
  for (let index = 0; index < batches; index++) {
    const batch = addresses.slice(index * batchSize, batchSize * (index + 1));
    const vaultUsers: UserGotchisOwned[] = await getVaultGotchis(
      batch,
      blockTag
    );
    vaultUsers.forEach((e) => {
      gotchiIds = gotchiIds.concat(e.gotchisOwned.map((f) => f.id));
      fetchedAddresses.push(e.id);
    });
  }

  //Ethereum
  for (let index = 0; index < batches; index++) {
    const batch = addresses.slice(index * batchSize, batchSize * (index + 1));
    const users: UserGotchisOwned[] = await getEthSubgraphGotchis(batch);

    if (users.length > 0) {
      mainnetUsers = mainnetUsers.concat(users);
    }
  }

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
    if (gotchi.status === "3") gotchiIds.push(gotchi.id);
  });

  //Remove duplicates
  let tokenIds = [...new Set(gotchiIds)];
  console.log("Final token Ids: " + tokenIds.length);
  fetchedAddresses = fetchedAddresses.concat(mainnetUsers.map((e) => e.id));
  let finalUsers = [...new Set(fetchedAddresses)];
  console.log("Final users: " + finalUsers.length);

  console.log(
    "not found: " + addresses.filter((e) => !finalUsers.includes(e)).length
  );

  return { finalUsers: finalUsers, tokenIds: tokenIds };
}
