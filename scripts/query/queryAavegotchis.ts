import { request } from "graphql-request";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  GotchisOwned,
  LendedGotchis,
  UserGotchisOwned,
  VaultGotchisOwned,
} from "../../types";

export const maticGraphUrl: string =
  "https://api.thegraph.com/subgraphs/name/aavegotchi/aavegotchi-core-matic";

export const maticLendingUrl: string =
  "https://api.thegraph.com/subgraphs/name/froid1911/aavegotchi-lending";
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
  return await querySubgraph(addresses, maticGraphUrl);
}

export async function getBorrowedGotchis(addresses: string[]) {
  addresses = addresses.map((val) => val.toLowerCase());

  const batchSize = 50;

  const batches = Math.ceil(addresses.length / batchSize);

  let queryData = `{`;

  for (let index = 0; index < batches; index++) {
    const batchId = index;
    const offset = batchId * batchSize;
    queryData = queryData.concat(`
      batch${batchId}: gotchiLendings(first:1000 where:{completed:false, timeAgreed_gt:0, lender_in:[${addresses
      .slice(offset, offset + batchSize)
      .map((add: string) => '"' + add + '"')}]},first:1000) {
        gotchiTokenId
        lender
        }
  `);
  }

  // console.log("querydata:", queryData);

  queryData = queryData.concat(`}`);

  if (queryData == "{}") return [];

  const res = await request(maticLendingUrl, queryData);

  let finalResponse: LendedGotchis[] = [];
  for (let index = 0; index < batches; index++) {
    const batch: LendedGotchis[] = res[`batch${index}`];

    if (batch.length >= 1000) {
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

    // console.log(`Gotchis borrowed by ${val}: ${gotchisOwned.toString()}`);

    const alreadyAirdropped = [
      "21044",
      "5296",
      "20849",
      "16227",
      "10879",
      "8835",
      "17623",
      "24413",
      "24790",
      "14524",
      "10952",
      "22345",
      "13461",
      "12327",
      "16449",
      "4978",
      "21018",
      "12966",
      "5705",
      "4348",
      "2364",
      "23351",
      "19381",
      "19401",
      "19356",
      "13222",
      "20691",
      "16488",
      "15661",
      "6538",
      "6030",
      "19327",
      "10273",
      "24401",
      "3717",
      "9778",
      "13117",
      "16641",
      "9937",
      "15008",
      "17739",
      "17234",
      "16405",
      "17921",
      "14377",
      "11818",
      "14202",
      "12990",
      "17967",
      "14996",
      "14342",
      "23246",
      "870",
      "3044",
      "5562",
      "6390",
      "21624",
      "11243",
      "19886",
      "6352",
      "6355",
      "20236",
      "21739",
      "11523",
      "13424",
      "17296",
      "21302",
      "21243",
      "13369",
      "20782",
      "1703",
      "17926",
      "12042",
      "11916",
      "13831",
      "9819",
      "3659",
      "14702",
      "5084",
      "20852",
      "9818",
      "9815",
      "16695",
      "21255",
      "5152",
      "12096",
      "22412",
      "18752",
      "20934",
      "17267",
      "12549",
      "17113",
      "17433",
      "16160",
      "16388",
      "18415",
      "19345",
      "22585",
      "19663",
      "14825",
      "13261",
      "20970",
      "14964",
      "12758",
      "1802",
      "18338",
      "21524",
      "12560",
      "17425",
      "19294",
      "24471",
      "20196",
      "17208",
      "16594",
      "15635",
      "10090",
      "17447",
      "753",
      "15918",
      "4640",
      "19892",
      "12770",
      "10095",
      "15117",
      "19055",
      "21362",
      "16290",
      "18051",
      "17482",
      "5446",
      "15163",
      "18487",
      "18734",
      "13839",
      "24473",
      "5980",
      "2261",
      "5079",
      "44",
      "3665",
      "573",
      "3160",
      "5488",
      "5798",
      "4489",
      "567",
      "5551",
      "9850",
      "3852",
      "3431",
      "6274",
      "575",
      "7082",
      "7425",
      "24913",
      "6475",
      "169",
      "7569",
      "9795",
      "6047",
      "14568",
      "23449",
      "7608",
      "8502",
      "24838",
      "12879",
      "1543",
      "1191",
      "8485",
      "16822",
      "18984",
      "22444",
      "21309",
      "8930",
      "21154",
      "15293",
      "23975",
      "15262",
      "15694",
      "22958",
      "21337",
      "17239",
      "20489",
      "14858",
      "18247",
      "8442",
      "16887",
      "15930",
      "22017",
      "24640",
      "7936",
      "7424",
      "4685",
      "3727",
      "3783",
      "14088",
      "1989",
      "9443",
      "1388",
      "18163",
      "18319",
      "3784",
      "24035",
      "4807",
      "22415",
      "21747",
      "15146",
      "13126",
      "7965",
      "14984",
      "3752",
      "2667",
      "1336",
      "21232",
      "1063",
      "8567",
      "607",
      "1345",
      "9554",
      "14482",
      "9622",
      "24109",
      "1055",
      "17509",
      "19920",
      "5704",
      "21371",
      "16379",
      "3452",
      "6633",
      "5524",
      "8158",
      "17352",
      "2976",
      "24115",
      "1954",
      "24545",
      "511",
      "4064",
      "18742",
      "4444",
      "7232",
      "7545",
      "7958",
      "1952",
      "17035",
      "8633",
      "7113",
      "19922",
      "9958",
      "5328",
      "10880",
      "21789",
      "20951",
      "1586",
      "1256",
      "8655",
      "19984",
      "19795",
      "106",
      "3835",
      "7864",
      "660",
      "2558",
      "23957",
      "8059",
      "5783",
      "5280",
      "18134",
      "17625",
      "24767",
      "3128",
      "15510",
      "973",
      "19174",
      "6752",
      "22470",
      "10963",
      "8453",
      "17231",
      "23830",
      "24508",
      "21129",
      "19754",
      "24985",
      "12031",
      "18670",
      "16035",
      "16681",
      "14066",
      "12343",
      "21701",
      "17201",
      "24613",
      "21944",
      "19029",
      "16309",
      "11731",
      "24055",
      "20627",
      "15241",
      "10212",
      "16659",
      "14028",
      "24067",
      "23930",
      "10060",
      "22819",
      "10388",
      "24964",
      "23899",
      "19247",
      "22931",
      "10043",
      "24566",
      "1249",
      "23313",
      "23666",
      "9360",
      "10629",
      "13807",
      "21199",
      "19410",
      "1050",
      "6222",
      "21505",
      "7708",
      "14993",
      "21631",
      "21933",
      "9289",
      "21584",
      "13464",
      "4607",
      "13534",
      "4858",
      "21075",
      "1808",
      "21402",
      "15320",
      "18701",
      "8885",
      "4797",
      "5796",
      "11884",
      "17895",
      "9673",
      "17466",
      "15840",
      "15995",
      "13235",
      "15034",
      "16421",
      "21721",
      "18419",
      "10763",
      "20678",
      "23753",
      "13260",
      "15778",
      "20737",
      "12397",
      "15403",
      "19405",
      "21872",
      "19802",
      "21407",
      "1241",
      "18116",
      "13046",
      "632",
      "24832",
      "24063",
      "18217",
      "17911",
      "15581",
      "14559",
      "22197",
      "15691",
      "12930",
      "15260",
      "17325",
      "17831",
      "20014",
      "4536",
      "20305",
      "21599",
      "15593",
      "19536",
      "3149",
      "17427",
      "23812",
      "12237",
      "17018",
      "19383",
      "11041",
      "18363",
      "1065",
      "12891",
      "7716",
      "15863",
      "22660",
      "14690",
      "13054",
      "24774",
      "15875",
      "19858",
      "17822",
      "19186",
      "17576",
      "16805",
      "23842",
      "18691",
      "19372",
      "14290",
      "8581",
      "13674",
      "17490",
      "18610",
      "24831",
      "18107",
      "14554",
      "16424",
      "18296",
      "10549",
      "20060",
      "17037",
      "11566",
      "23535",
      "16898",
      "15697",
      "10979",
      "16770",
      "4302",
      "18853",
      "11289",
      "22122",
      "4301",
      "19163",
      "17979",
      "5423",
      "19589",
      "9337",
      "4616",
      "18545",
      "5155",
      "17045",
      "1633",
      "1779",
      "9996",
      "2260",
      "16749",
      "7571",
      "10281",
      "8927",
      "15830",
      "8631",
      "1752",
      "4820",
      "11894",
      "1668",
      "16728",
      "14110",
      "18836",
      "12559",
      "10319",
      "1838",
      "11428",
      "22673",
      "12231",
      "2393",
      "8823",
      "21400",
      "10292",
      "13212",
      "16280",
      "22323",
      "15219",
      "10708",
      "18109",
      "21690",
      "14024",
      "19143",
      "22320",
      "208",
      "5293",
      "6131",
      "6132",
      "1195",
      "19156",
      "9936",
      "2750",
      "15197",
      "19956",
      "13551",
      "10861",
      "14387",
      "10690",
      "2613",
      "2798",
      "7601",
      "3026",
      "15147",
      "12882",
      "15331",
      "4263",
      "11527",
      "12494",
      "22082",
      "22361",
      "13238",
      "22495",
      "16349",
      "6665",
    ];

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
    console.log(
      `Fetching batch of ${batch.length} gotchis from MATIC SUBGRAPH`
    );

    //Get Polygon
    const users: UserGotchisOwned[] = await getSubgraphGotchis(batch);

    console.log(
      `-Found ${users.length} users with ${users
        .map((val) => val.gotchisOwned.length)
        .reduce((prev, current) => prev + current)} Gotchis in Matic subgraph`
    );
    polygonUsers = polygonUsers.concat(users);
  }

  //Borrowed Gotchis

  for (let index = 0; index < batches; index++) {
    const batch = addresses.slice(index * batchSize, batchSize * (index + 1));

    console.log(
      `Fetching batch of ${batch.length} gotchis from LENDING SUBGRAPH`
    );
    const borrowedGotchis: UserGotchisOwned[] = await getBorrowedGotchis(batch);

    if (borrowedGotchis.length > 0) {
      console.log(
        `-Found ${borrowedGotchis.length} users with ${borrowedGotchis
          .map((val) => val.gotchisOwned.length)
          .reduce(
            (prev, current) => prev + current
          )} Gotchis in Borrowed subgraph`
      );
      polygonUsers = polygonUsers.concat(borrowedGotchis);
    }
  }

  // //Polygon (Vault)
  for (let index = 0; index < batches; index++) {
    const batch = addresses.slice(index * batchSize, batchSize * (index + 1));
    const vaultUsers: UserGotchisOwned[] = await getVaultGotchis(batch);

    if (vaultUsers.length > 0) {
      console.log(
        `-Found ${vaultUsers.length} users with ${vaultUsers
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
