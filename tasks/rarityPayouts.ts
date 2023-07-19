import { task } from "hardhat/config";
import { ContractReceipt } from "@ethersproject/contracts";
import { Signer } from "@ethersproject/abstract-signer";
import { BigNumber } from "@ethersproject/bignumber";
import { parseEther, formatEther } from "@ethersproject/units";
import { ERC20, EscrowFacet } from "../typechain";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  maticDiamondAddress,
  getRelayerSigner,
} from "../scripts/helperFunctions";
import { LeaderboardDataName, LeaderboardType } from "../types";
import {
  stripGotchis,
  confirmCorrectness,
  fetchAndSortLeaderboard,
} from "../scripts/raritySortHelpers";

const sacrificedList = {
  data: {
    aavegotchis: [
      {
        id: "1008",
      },
      {
        id: "10247",
      },
      {
        id: "10320",
      },
      {
        id: "10399",
      },
      {
        id: "10426",
      },
      {
        id: "1048",
      },
      {
        id: "10490",
      },
      {
        id: "10514",
      },
      {
        id: "10531",
      },
      {
        id: "10617",
      },
      {
        id: "10651",
      },
      {
        id: "10691",
      },
      {
        id: "10695",
      },
      {
        id: "107",
      },
      {
        id: "10716",
      },
      {
        id: "1080",
      },
      {
        id: "10816",
      },
      {
        id: "10836",
      },
      {
        id: "1106",
      },
      {
        id: "11180",
      },
      {
        id: "11228",
      },
      {
        id: "1127",
      },
      {
        id: "11314",
      },
      {
        id: "11328",
      },
      {
        id: "11343",
      },
      {
        id: "11348",
      },
      {
        id: "11396",
      },
      {
        id: "11408",
      },
      {
        id: "11426",
      },
      {
        id: "1148",
      },
      {
        id: "1149",
      },
      {
        id: "1152",
      },
      {
        id: "1158",
      },
      {
        id: "11665",
      },
      {
        id: "1172",
      },
      {
        id: "1174",
      },
      {
        id: "1181",
      },
      {
        id: "11880",
      },
      {
        id: "11890",
      },
      {
        id: "11923",
      },
      {
        id: "11951",
      },
      {
        id: "11965",
      },
      {
        id: "12005",
      },
      {
        id: "1201",
      },
      {
        id: "1204",
      },
      {
        id: "12074",
      },
      {
        id: "1209",
      },
      {
        id: "12152",
      },
      {
        id: "12181",
      },
      {
        id: "12206",
      },
      {
        id: "1225",
      },
      {
        id: "12279",
      },
      {
        id: "1237",
      },
      {
        id: "1238",
      },
      {
        id: "1239",
      },
      {
        id: "1242",
      },
      {
        id: "12462",
      },
      {
        id: "1252",
      },
      {
        id: "12701",
      },
      {
        id: "12780",
      },
      {
        id: "12797",
      },
      {
        id: "1281",
      },
      {
        id: "12957",
      },
      {
        id: "12983",
      },
      {
        id: "13018",
      },
      {
        id: "13039",
      },
      {
        id: "13045",
      },
      {
        id: "13056",
      },
      {
        id: "13113",
      },
      {
        id: "13174",
      },
      {
        id: "13269",
      },
      {
        id: "1332",
      },
      {
        id: "13373",
      },
      {
        id: "13392",
      },
      {
        id: "13434",
      },
      {
        id: "13447",
      },
      {
        id: "13500",
      },
      {
        id: "13534",
      },
      {
        id: "1363",
      },
      {
        id: "1364",
      },
      {
        id: "1366",
      },
      {
        id: "1374",
      },
      {
        id: "13757",
      },
      {
        id: "1376",
      },
      {
        id: "1378",
      },
      {
        id: "1380",
      },
      {
        id: "13948",
      },
      {
        id: "13971",
      },
      {
        id: "14005",
      },
      {
        id: "14051",
      },
      {
        id: "14058",
      },
      {
        id: "14066",
      },
      {
        id: "14173",
      },
      {
        id: "1428",
      },
      {
        id: "1434",
      },
      {
        id: "14342",
      },
      {
        id: "1446",
      },
      {
        id: "14537",
      },
      {
        id: "1462",
      },
      {
        id: "14652",
      },
      {
        id: "14669",
      },
      {
        id: "1467",
      },
      {
        id: "14721",
      },
      {
        id: "1476",
      },
      {
        id: "14773",
      },
      {
        id: "14805",
      },
      {
        id: "1488",
      },
      {
        id: "14903",
      },
      {
        id: "14915",
      },
      {
        id: "14996",
      },
      {
        id: "15170",
      },
      {
        id: "15185",
      },
      {
        id: "15201",
      },
      {
        id: "15247",
      },
      {
        id: "15283",
      },
      {
        id: "15315",
      },
      {
        id: "15384",
      },
      {
        id: "1541",
      },
      {
        id: "1544",
      },
      {
        id: "1546",
      },
      {
        id: "15542",
      },
      {
        id: "15677",
      },
      {
        id: "15727",
      },
      {
        id: "1573",
      },
      {
        id: "15816",
      },
      {
        id: "15851",
      },
      {
        id: "16026",
      },
      {
        id: "16098",
      },
      {
        id: "16198",
      },
      {
        id: "16256",
      },
      {
        id: "16266",
      },
      {
        id: "16324",
      },
      {
        id: "16391",
      },
      {
        id: "16612",
      },
      {
        id: "16681",
      },
      {
        id: "1676",
      },
      {
        id: "16941",
      },
      {
        id: "16954",
      },
      {
        id: "1700",
      },
      {
        id: "17025",
      },
      {
        id: "17053",
      },
      {
        id: "17106",
      },
      {
        id: "17125",
      },
      {
        id: "17150",
      },
      {
        id: "17231",
      },
      {
        id: "1726",
      },
      {
        id: "1727",
      },
      {
        id: "1730",
      },
      {
        id: "1731",
      },
      {
        id: "1733",
      },
      {
        id: "17337",
      },
      {
        id: "1736",
      },
      {
        id: "17364",
      },
      {
        id: "1737",
      },
      {
        id: "1738",
      },
      {
        id: "1739",
      },
      {
        id: "174",
      },
      {
        id: "1741",
      },
      {
        id: "1742",
      },
      {
        id: "1744",
      },
      {
        id: "17443",
      },
      {
        id: "1747",
      },
      {
        id: "1748",
      },
      {
        id: "1749",
      },
      {
        id: "1750",
      },
      {
        id: "1754",
      },
      {
        id: "1758",
      },
      {
        id: "1761",
      },
      {
        id: "1773",
      },
      {
        id: "17830",
      },
      {
        id: "17896",
      },
      {
        id: "17953",
      },
      {
        id: "18043",
      },
      {
        id: "1807",
      },
      {
        id: "18133",
      },
      {
        id: "18209",
      },
      {
        id: "18394",
      },
      {
        id: "18509",
      },
      {
        id: "1860",
      },
      {
        id: "1864",
      },
      {
        id: "1865",
      },
      {
        id: "18659",
      },
      {
        id: "1867",
      },
      {
        id: "18707",
      },
      {
        id: "1877",
      },
      {
        id: "18789",
      },
      {
        id: "18812",
      },
      {
        id: "1889",
      },
      {
        id: "1891",
      },
      {
        id: "19069",
      },
      {
        id: "19166",
      },
      {
        id: "194",
      },
      {
        id: "19411",
      },
      {
        id: "19528",
      },
      {
        id: "1958",
      },
      {
        id: "19624",
      },
      {
        id: "19650",
      },
      {
        id: "19754",
      },
      {
        id: "19759",
      },
      {
        id: "19890",
      },
      {
        id: "1991",
      },
      {
        id: "19961",
      },
      {
        id: "20012",
      },
      {
        id: "2015",
      },
      {
        id: "20249",
      },
      {
        id: "20295",
      },
      {
        id: "203",
      },
      {
        id: "20516",
      },
      {
        id: "20553",
      },
      {
        id: "20588",
      },
      {
        id: "2064",
      },
      {
        id: "20641",
      },
      {
        id: "20648",
      },
      {
        id: "20693",
      },
      {
        id: "20759",
      },
      {
        id: "20904",
      },
      {
        id: "21036",
      },
      {
        id: "21039",
      },
      {
        id: "21045",
      },
      {
        id: "2106",
      },
      {
        id: "21129",
      },
      {
        id: "2121",
      },
      {
        id: "2135",
      },
      {
        id: "21360",
      },
      {
        id: "21391",
      },
      {
        id: "2141",
      },
      {
        id: "21437",
      },
      {
        id: "2146",
      },
      {
        id: "21561",
      },
      {
        id: "21701",
      },
      {
        id: "21728",
      },
      {
        id: "21743",
      },
      {
        id: "21790",
      },
      {
        id: "2187",
      },
      {
        id: "2188",
      },
      {
        id: "21944",
      },
      {
        id: "220",
      },
      {
        id: "22014",
      },
      {
        id: "22036",
      },
      {
        id: "22096",
      },
      {
        id: "2214",
      },
      {
        id: "2216",
      },
      {
        id: "22170",
      },
      {
        id: "22188",
      },
      {
        id: "22321",
      },
      {
        id: "22328",
      },
      {
        id: "2233",
      },
      {
        id: "22377",
      },
      {
        id: "22490",
      },
      {
        id: "22540",
      },
      {
        id: "22552",
      },
      {
        id: "2268",
      },
      {
        id: "2280",
      },
      {
        id: "22827",
      },
      {
        id: "22829",
      },
      {
        id: "22910",
      },
      {
        id: "22929",
      },
      {
        id: "230",
      },
      {
        id: "2317",
      },
      {
        id: "232",
      },
      {
        id: "2320",
      },
      {
        id: "2323",
      },
      {
        id: "2327",
      },
      {
        id: "2329",
      },
      {
        id: "2331",
      },
      {
        id: "2332",
      },
      {
        id: "23322",
      },
      {
        id: "2334",
      },
      {
        id: "23341",
      },
      {
        id: "23342",
      },
      {
        id: "2335",
      },
      {
        id: "2338",
      },
      {
        id: "2340",
      },
      {
        id: "23456",
      },
      {
        id: "23457",
      },
      {
        id: "2356",
      },
      {
        id: "2357",
      },
      {
        id: "23630",
      },
      {
        id: "2366",
      },
      {
        id: "23685",
      },
      {
        id: "23750",
      },
      {
        id: "23830",
      },
      {
        id: "23870",
      },
      {
        id: "23877",
      },
      {
        id: "2392",
      },
      {
        id: "23956",
      },
      {
        id: "24036",
      },
      {
        id: "24073",
      },
      {
        id: "24138",
      },
      {
        id: "24150",
      },
      {
        id: "2420",
      },
      {
        id: "24305",
      },
      {
        id: "24407",
      },
      {
        id: "24428",
      },
      {
        id: "2447",
      },
      {
        id: "24481",
      },
      {
        id: "24559",
      },
      {
        id: "24575",
      },
      {
        id: "2458",
      },
      {
        id: "24587",
      },
      {
        id: "24613",
      },
      {
        id: "24621",
      },
      {
        id: "24822",
      },
      {
        id: "24977",
      },
      {
        id: "2513",
      },
      {
        id: "2514",
      },
      {
        id: "2525",
      },
      {
        id: "2539",
      },
      {
        id: "2540",
      },
      {
        id: "2541",
      },
      {
        id: "2543",
      },
      {
        id: "2548",
      },
      {
        id: "2565",
      },
      {
        id: "2576",
      },
      {
        id: "2577",
      },
      {
        id: "2579",
      },
      {
        id: "2610",
      },
      {
        id: "2633",
      },
      {
        id: "2646",
      },
      {
        id: "2673",
      },
      {
        id: "2730",
      },
      {
        id: "2776",
      },
      {
        id: "2802",
      },
      {
        id: "2804",
      },
      {
        id: "2814",
      },
      {
        id: "2835",
      },
      {
        id: "2838",
      },
      {
        id: "2846",
      },
      {
        id: "2859",
      },
      {
        id: "2892",
      },
      {
        id: "2897",
      },
      {
        id: "2899",
      },
      {
        id: "2900",
      },
      {
        id: "2904",
      },
      {
        id: "2921",
      },
      {
        id: "2947",
      },
      {
        id: "2952",
      },
      {
        id: "2988",
      },
      {
        id: "3014",
      },
      {
        id: "3020",
      },
      {
        id: "305",
      },
      {
        id: "3079",
      },
      {
        id: "3105",
      },
      {
        id: "311",
      },
      {
        id: "3125",
      },
      {
        id: "3133",
      },
      {
        id: "3145",
      },
      {
        id: "3151",
      },
      {
        id: "3172",
      },
      {
        id: "3174",
      },
      {
        id: "3175",
      },
      {
        id: "3182",
      },
      {
        id: "3183",
      },
      {
        id: "3214",
      },
      {
        id: "3215",
      },
      {
        id: "3216",
      },
      {
        id: "3217",
      },
      {
        id: "3219",
      },
      {
        id: "3221",
      },
      {
        id: "3224",
      },
      {
        id: "3239",
      },
      {
        id: "3258",
      },
      {
        id: "3263",
      },
      {
        id: "3284",
      },
      {
        id: "3300",
      },
      {
        id: "3303",
      },
      {
        id: "3304",
      },
      {
        id: "3307",
      },
      {
        id: "3313",
      },
      {
        id: "3398",
      },
      {
        id: "3417",
      },
      {
        id: "3426",
      },
      {
        id: "3428",
      },
      {
        id: "3442",
      },
      {
        id: "345",
      },
      {
        id: "3499",
      },
      {
        id: "3511",
      },
      {
        id: "3514",
      },
      {
        id: "3536",
      },
      {
        id: "3586",
      },
      {
        id: "3587",
      },
      {
        id: "3589",
      },
      {
        id: "3591",
      },
      {
        id: "3597",
      },
      {
        id: "3618",
      },
      {
        id: "3624",
      },
      {
        id: "3638",
      },
      {
        id: "364",
      },
      {
        id: "3641",
      },
      {
        id: "3646",
      },
      {
        id: "3685",
      },
      {
        id: "3686",
      },
      {
        id: "3689",
      },
      {
        id: "3694",
      },
      {
        id: "3721",
      },
      {
        id: "3768",
      },
      {
        id: "3811",
      },
      {
        id: "3812",
      },
      {
        id: "3817",
      },
      {
        id: "3851",
      },
      {
        id: "3897",
      },
      {
        id: "3901",
      },
      {
        id: "3902",
      },
      {
        id: "3903",
      },
      {
        id: "3920",
      },
      {
        id: "3927",
      },
      {
        id: "3960",
      },
      {
        id: "3994",
      },
      {
        id: "4043",
      },
      {
        id: "4045",
      },
      {
        id: "4054",
      },
      {
        id: "4066",
      },
      {
        id: "4094",
      },
      {
        id: "4105",
      },
      {
        id: "4110",
      },
      {
        id: "4114",
      },
      {
        id: "412",
      },
      {
        id: "4126",
      },
      {
        id: "4140",
      },
      {
        id: "4149",
      },
      {
        id: "4152",
      },
      {
        id: "4153",
      },
      {
        id: "416",
      },
      {
        id: "4173",
      },
      {
        id: "4184",
      },
      {
        id: "4219",
      },
      {
        id: "4269",
      },
      {
        id: "4270",
      },
      {
        id: "4276",
      },
      {
        id: "4279",
      },
      {
        id: "4284",
      },
      {
        id: "4287",
      },
      {
        id: "4289",
      },
      {
        id: "4290",
      },
      {
        id: "4318",
      },
      {
        id: "432",
      },
      {
        id: "4328",
      },
      {
        id: "4329",
      },
      {
        id: "4330",
      },
      {
        id: "4331",
      },
      {
        id: "4332",
      },
      {
        id: "4357",
      },
      {
        id: "4361",
      },
      {
        id: "4403",
      },
      {
        id: "4423",
      },
      {
        id: "4425",
      },
      {
        id: "4432",
      },
      {
        id: "4440",
      },
      {
        id: "445",
      },
      {
        id: "4502",
      },
      {
        id: "4520",
      },
      {
        id: "4522",
      },
      {
        id: "4529",
      },
      {
        id: "4530",
      },
      {
        id: "4538",
      },
      {
        id: "4548",
      },
      {
        id: "4565",
      },
      {
        id: "4593",
      },
      {
        id: "4596",
      },
      {
        id: "4602",
      },
      {
        id: "4603",
      },
      {
        id: "4609",
      },
      {
        id: "4631",
      },
      {
        id: "4632",
      },
      {
        id: "4635",
      },
      {
        id: "4658",
      },
      {
        id: "4671",
      },
      {
        id: "4697",
      },
      {
        id: "4699",
      },
      {
        id: "4704",
      },
      {
        id: "4705",
      },
      {
        id: "4712",
      },
      {
        id: "4719",
      },
      {
        id: "4725",
      },
      {
        id: "4726",
      },
      {
        id: "4737",
      },
      {
        id: "4741",
      },
      {
        id: "4752",
      },
      {
        id: "4766",
      },
      {
        id: "4811",
      },
      {
        id: "4822",
      },
      {
        id: "4833",
      },
      {
        id: "4846",
      },
      {
        id: "4852",
      },
      {
        id: "4855",
      },
      {
        id: "4893",
      },
      {
        id: "4991",
      },
      {
        id: "4995",
      },
      {
        id: "5018",
      },
      {
        id: "5019",
      },
      {
        id: "5020",
      },
      {
        id: "5021",
      },
      {
        id: "5022",
      },
      {
        id: "5023",
      },
      {
        id: "5024",
      },
      {
        id: "5026",
      },
      {
        id: "503",
      },
      {
        id: "5038",
      },
      {
        id: "5046",
      },
      {
        id: "5067",
      },
      {
        id: "5068",
      },
      {
        id: "5070",
      },
      {
        id: "5071",
      },
      {
        id: "5078",
      },
      {
        id: "5086",
      },
      {
        id: "5092",
      },
      {
        id: "5107",
      },
      {
        id: "5149",
      },
      {
        id: "517",
      },
      {
        id: "518",
      },
      {
        id: "5197",
      },
      {
        id: "5225",
      },
      {
        id: "5231",
      },
      {
        id: "5239",
      },
      {
        id: "5282",
      },
      {
        id: "5284",
      },
      {
        id: "5314",
      },
      {
        id: "5329",
      },
      {
        id: "5333",
      },
      {
        id: "5355",
      },
      {
        id: "5382",
      },
      {
        id: "5385",
      },
      {
        id: "5391",
      },
      {
        id: "5403",
      },
      {
        id: "5417",
      },
      {
        id: "5424",
      },
      {
        id: "5444",
      },
      {
        id: "5447",
      },
      {
        id: "5509",
      },
      {
        id: "5510",
      },
      {
        id: "5532",
      },
      {
        id: "5548",
      },
      {
        id: "5567",
      },
      {
        id: "5568",
      },
      {
        id: "5571",
      },
      {
        id: "5584",
      },
      {
        id: "5589",
      },
      {
        id: "559",
      },
      {
        id: "5615",
      },
      {
        id: "5617",
      },
      {
        id: "5620",
      },
      {
        id: "5627",
      },
      {
        id: "5628",
      },
      {
        id: "5657",
      },
      {
        id: "5661",
      },
      {
        id: "5678",
      },
      {
        id: "5680",
      },
      {
        id: "5685",
      },
      {
        id: "5687",
      },
      {
        id: "570",
      },
      {
        id: "5721",
      },
      {
        id: "5732",
      },
      {
        id: "5741",
      },
      {
        id: "5745",
      },
      {
        id: "5766",
      },
      {
        id: "5780",
      },
      {
        id: "5801",
      },
      {
        id: "5808",
      },
      {
        id: "5812",
      },
      {
        id: "5813",
      },
      {
        id: "582",
      },
      {
        id: "583",
      },
      {
        id: "586",
      },
      {
        id: "5860",
      },
      {
        id: "5875",
      },
      {
        id: "5914",
      },
      {
        id: "592",
      },
      {
        id: "593",
      },
      {
        id: "5937",
      },
      {
        id: "5943",
      },
      {
        id: "5948",
      },
      {
        id: "5978",
      },
      {
        id: "5979",
      },
      {
        id: "599",
      },
      {
        id: "602",
      },
      {
        id: "6027",
      },
      {
        id: "6028",
      },
      {
        id: "603",
      },
      {
        id: "604",
      },
      {
        id: "6042",
      },
      {
        id: "6043",
      },
      {
        id: "605",
      },
      {
        id: "6059",
      },
      {
        id: "6091",
      },
      {
        id: "6092",
      },
      {
        id: "6100",
      },
      {
        id: "6125",
      },
      {
        id: "6185",
      },
      {
        id: "6186",
      },
      {
        id: "6200",
      },
      {
        id: "625",
      },
      {
        id: "6253",
      },
      {
        id: "6261",
      },
      {
        id: "6262",
      },
      {
        id: "6270",
      },
      {
        id: "6277",
      },
      {
        id: "6284",
      },
      {
        id: "6286",
      },
      {
        id: "6294",
      },
      {
        id: "6410",
      },
      {
        id: "6429",
      },
      {
        id: "6430",
      },
      {
        id: "6449",
      },
      {
        id: "6461",
      },
      {
        id: "6466",
      },
      {
        id: "6481",
      },
      {
        id: "6484",
      },
      {
        id: "6520",
      },
      {
        id: "6521",
      },
      {
        id: "6522",
      },
      {
        id: "6523",
      },
      {
        id: "6530",
      },
      {
        id: "6537",
      },
      {
        id: "654",
      },
      {
        id: "658",
      },
      {
        id: "6586",
      },
      {
        id: "6606",
      },
      {
        id: "6607",
      },
      {
        id: "6646",
      },
      {
        id: "6651",
      },
      {
        id: "6672",
      },
      {
        id: "6708",
      },
      {
        id: "6714",
      },
      {
        id: "6733",
      },
      {
        id: "6749",
      },
      {
        id: "6770",
      },
      {
        id: "6784",
      },
      {
        id: "680",
      },
      {
        id: "6838",
      },
      {
        id: "6844",
      },
      {
        id: "6848",
      },
      {
        id: "6905",
      },
      {
        id: "693",
      },
      {
        id: "6934",
      },
      {
        id: "6945",
      },
      {
        id: "6954",
      },
      {
        id: "701",
      },
      {
        id: "7039",
      },
      {
        id: "7040",
      },
      {
        id: "7045",
      },
      {
        id: "7079",
      },
      {
        id: "7086",
      },
      {
        id: "7089",
      },
      {
        id: "7107",
      },
      {
        id: "7109",
      },
      {
        id: "7114",
      },
      {
        id: "7146",
      },
      {
        id: "7149",
      },
      {
        id: "715",
      },
      {
        id: "7238",
      },
      {
        id: "7242",
      },
      {
        id: "7243",
      },
      {
        id: "7279",
      },
      {
        id: "7351",
      },
      {
        id: "7356",
      },
      {
        id: "7358",
      },
      {
        id: "7360",
      },
      {
        id: "7364",
      },
      {
        id: "737",
      },
      {
        id: "7386",
      },
      {
        id: "7392",
      },
      {
        id: "7395",
      },
      {
        id: "7469",
      },
      {
        id: "7482",
      },
      {
        id: "7501",
      },
      {
        id: "7503",
      },
      {
        id: "7507",
      },
      {
        id: "7521",
      },
      {
        id: "7556",
      },
      {
        id: "7568",
      },
      {
        id: "7580",
      },
      {
        id: "7592",
      },
      {
        id: "7593",
      },
      {
        id: "7606",
      },
      {
        id: "7634",
      },
      {
        id: "7650",
      },
      {
        id: "7666",
      },
      {
        id: "7671",
      },
      {
        id: "7696",
      },
      {
        id: "7702",
      },
      {
        id: "7704",
      },
      {
        id: "7720",
      },
      {
        id: "7742",
      },
      {
        id: "7756",
      },
      {
        id: "7827",
      },
      {
        id: "7849",
      },
      {
        id: "7871",
      },
      {
        id: "7894",
      },
      {
        id: "7896",
      },
      {
        id: "7905",
      },
      {
        id: "7906",
      },
      {
        id: "791",
      },
      {
        id: "792",
      },
      {
        id: "793",
      },
      {
        id: "7939",
      },
      {
        id: "7940",
      },
      {
        id: "797",
      },
      {
        id: "800",
      },
      {
        id: "8009",
      },
      {
        id: "802",
      },
      {
        id: "8024",
      },
      {
        id: "8044",
      },
      {
        id: "8045",
      },
      {
        id: "8053",
      },
      {
        id: "8063",
      },
      {
        id: "8065",
      },
      {
        id: "8066",
      },
      {
        id: "8083",
      },
      {
        id: "8087",
      },
      {
        id: "8098",
      },
      {
        id: "8101",
      },
      {
        id: "813",
      },
      {
        id: "8141",
      },
      {
        id: "8146",
      },
      {
        id: "8151",
      },
      {
        id: "8153",
      },
      {
        id: "8157",
      },
      {
        id: "816",
      },
      {
        id: "8177",
      },
      {
        id: "8214",
      },
      {
        id: "8238",
      },
      {
        id: "8240",
      },
      {
        id: "8244",
      },
      {
        id: "8248",
      },
      {
        id: "825",
      },
      {
        id: "8251",
      },
      {
        id: "8252",
      },
      {
        id: "8261",
      },
      {
        id: "8268",
      },
      {
        id: "827",
      },
      {
        id: "8273",
      },
      {
        id: "8276",
      },
      {
        id: "8356",
      },
      {
        id: "8362",
      },
      {
        id: "8363",
      },
      {
        id: "8393",
      },
      {
        id: "8441",
      },
      {
        id: "8538",
      },
      {
        id: "8540",
      },
      {
        id: "8558",
      },
      {
        id: "8560",
      },
      {
        id: "8599",
      },
      {
        id: "8606",
      },
      {
        id: "8610",
      },
      {
        id: "8620",
      },
      {
        id: "8647",
      },
      {
        id: "8649",
      },
      {
        id: "8650",
      },
      {
        id: "8654",
      },
      {
        id: "8660",
      },
      {
        id: "8708",
      },
      {
        id: "8709",
      },
      {
        id: "8711",
      },
      {
        id: "8727",
      },
      {
        id: "8728",
      },
      {
        id: "8761",
      },
      {
        id: "8762",
      },
      {
        id: "8765",
      },
      {
        id: "8767",
      },
      {
        id: "8776",
      },
      {
        id: "8808",
      },
      {
        id: "8824",
      },
      {
        id: "8830",
      },
      {
        id: "8859",
      },
      {
        id: "8906",
      },
      {
        id: "8919",
      },
      {
        id: "8937",
      },
      {
        id: "8958",
      },
      {
        id: "8991",
      },
      {
        id: "8992",
      },
      {
        id: "8993",
      },
      {
        id: "8994",
      },
      {
        id: "8996",
      },
      {
        id: "8997",
      },
      {
        id: "8998",
      },
      {
        id: "9000",
      },
      {
        id: "9002",
      },
      {
        id: "9004",
      },
      {
        id: "9039",
      },
      {
        id: "9041",
      },
      {
        id: "9057",
      },
      {
        id: "9067",
      },
      {
        id: "9077",
      },
      {
        id: "9084",
      },
      {
        id: "9094",
      },
      {
        id: "910",
      },
      {
        id: "9102",
      },
      {
        id: "9131",
      },
      {
        id: "9140",
      },
      {
        id: "9167",
      },
      {
        id: "9241",
      },
      {
        id: "9249",
      },
      {
        id: "9300",
      },
      {
        id: "9308",
      },
      {
        id: "9317",
      },
      {
        id: "9363",
      },
      {
        id: "9397",
      },
      {
        id: "9407",
      },
      {
        id: "9446",
      },
      {
        id: "9478",
      },
      {
        id: "9527",
      },
      {
        id: "9534",
      },
      {
        id: "9562",
      },
      {
        id: "9563",
      },
      {
        id: "9567",
      },
      {
        id: "9592",
      },
      {
        id: "9601",
      },
      {
        id: "9609",
      },
      {
        id: "9611",
      },
      {
        id: "9619",
      },
      {
        id: "9623",
      },
      {
        id: "9627",
      },
      {
        id: "9648",
      },
      {
        id: "9653",
      },
      {
        id: "9686",
      },
      {
        id: "969",
      },
      {
        id: "9706",
      },
      {
        id: "9714",
      },
      {
        id: "9715",
      },
      {
        id: "9726",
      },
      {
        id: "9736",
      },
      {
        id: "9755",
      },
      {
        id: "9765",
      },
      {
        id: "977",
      },
      {
        id: "9773",
      },
      {
        id: "9791",
      },
      {
        id: "9859",
      },
      {
        id: "986",
      },
      {
        id: "9861",
      },
      {
        id: "9863",
      },
      {
        id: "9864",
      },
      {
        id: "9868",
      },
      {
        id: "9870",
      },
      {
        id: "9888",
      },
      {
        id: "9890",
      },
      {
        id: "9894",
      },
      {
        id: "9938",
      },
      {
        id: "9945",
      },
      {
        id: "9989",
      },
      {
        id: "999",
      },
      {
        id: "9992",
      },
      {
        id: "9993",
      },
      {
        id: "9995",
      },
    ],
  },
};

export let tiebreakerIndex: string;
// const rookieFilter: string = "hauntId:2";

import {
  RarityFarmingData,
  RarityFarmingRewardArgs,
  rarityRewards,
} from "../types";
import {
  aavegotchiDiamondAddressMatic,
  ghstAddress,
} from "../helpers/constants";

function addCommas(nStr: string) {
  nStr += "";
  const x = nStr.split(".");
  let x1 = x[0];
  const x2 = x.length > 1 ? "." + x[1] : "";
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, "$1" + "," + "$2");
  }
  return x1 + x2;
}

function strDisplay(str: string) {
  return addCommas(str.toString());
}

export interface RarityPayoutTaskArgs {
  rarityDataFile: string;
  season: string;
  rounds: string;
  totalAmount: string;
  blockNumber: string;
  tieBreakerIndex: string;
  deployerAddress: string;
}

interface TxArgs {
  tokenID: string;
  amount: Number;
  parsedAmount: string;
}
task("rarityPayout")
  .addParam("season")
  .addParam(
    "rarityDataFile",
    "File that contains all the data related to the particular rarity round"
  )
  .addParam("deployerAddress")
  .addParam("tieBreakerIndex", "The Tiebreaker index")
  .setAction(
    async (taskArgs: RarityPayoutTaskArgs, hre: HardhatRuntimeEnvironment) => {
      const filename: string = taskArgs.rarityDataFile;
      const diamondAddress = maticDiamondAddress;
      const deployerAddress = taskArgs.deployerAddress;

      console.log("deployer:", deployerAddress);
      // const accounts = await hre.ethers.getSigners();
      tiebreakerIndex = taskArgs.tieBreakerIndex;

      const testing = ["hardhat", "localhost"].includes(hre.network.name);
      let signer: Signer;
      if (testing) {
        await hre.network.provider.request({
          method: "hardhat_impersonateAccount",
          params: [deployerAddress],
        });
        signer = await hre.ethers.provider.getSigner(deployerAddress);
      } else if (hre.network.name === "matic") {
        signer = await getRelayerSigner(hre);
      } else {
        throw Error("Incorrect network selected");
      }

      const rounds = Number(taskArgs.rounds);

      const signerAddress = await signer.getAddress();
      if (signerAddress.toLowerCase() !== deployerAddress.toLowerCase()) {
        throw new Error(
          `Deployer ${deployerAddress} does not match signer ${signerAddress}`
        );
      }

      //Get rewards for this season
      const {
        rewardArgs,
      } = require(`../data/airdrops/rarityfarming/szn${taskArgs.season}/rewards`);
      const rewards: RarityFarmingRewardArgs = rewardArgs;

      const maxProcess = 500;
      const finalRewards: rarityRewards = {};

      //Get data for this round from file
      const {
        dataArgs,
      } = require(`../data/airdrops/rarityfarming/szn${taskArgs.season}/${filename}.ts`);
      const data: RarityFarmingData = dataArgs;

      const leaderboards = [
        "withSetsRarityScore",
        "kinship",
        "experience",
        // "kinship",
        // "experience",
      ];
      const dataNames: LeaderboardDataName[] = [
        "rarityGotchis",
        "kinshipGotchis",
        "xpGotchis",
        // "rookieKinshipGotchis",
        // "rookieXpGotchis",
      ];

      //handle rookie now

      const leaderboardResults: RarityFarmingData = {
        rarityGotchis: [],
        xpGotchis: [],
        kinshipGotchis: [],
      };

      for (let index = 0; index < leaderboards.length; index++) {
        let element: LeaderboardType = leaderboards[index] as LeaderboardType;

        const result = stripGotchis(
          await fetchAndSortLeaderboard(
            element,
            taskArgs.blockNumber,
            Number(taskArgs.tieBreakerIndex)
          )
        );

        const dataName: LeaderboardDataName = dataNames[
          index
        ] as LeaderboardDataName;

        const correct = confirmCorrectness(result, data[dataName]);

        console.log("correct:", correct);

        if (correct !== 7500) {
          throw new Error("Results do not line up with subgraph");
        }

        leaderboardResults[dataName] = result;
      }

      //get rewards
      const rarityRoundRewards: string[] = rewards.rarity;
      const kinshipRoundRewards: string[] = rewards.kinship;
      const xpRoundRewards: string[] = rewards.xp;
      // const rookieKinshipRoundRewards: string[] = rewards.rookieKinship;
      // const rookieXpRoundRewards: string[] = rewards.rookieXp;

      //Iterate through all 5000 spots
      for (let index = 0; index < 7500; index++) {
        const gotchis: string[] = [
          leaderboardResults.rarityGotchis[index],
          leaderboardResults.kinshipGotchis[index],
          leaderboardResults.xpGotchis[index],
          // leaderboardResults.rookieKinshipGotchis[index],
          // leaderboardResults.rookieXpGotchis[index],
        ];

        const rewards: string[][] = [
          rarityRoundRewards,
          kinshipRoundRewards,
          xpRoundRewards,
          // rookieKinshipRoundRewards,
          // rookieXpRoundRewards,
        ];

        rewards.forEach((leaderboard, i) => {
          const gotchi = gotchis[i];
          const reward = leaderboard[index];

          if (finalRewards[gotchi])
            finalRewards[gotchi] += Number(reward) / rounds;
          else {
            finalRewards[gotchi] = Number(reward) / rounds;
          }
        });
      }

      //Check that sent amount matches total amount per round
      const roundAmount = Number(taskArgs.totalAmount) / rounds;
      let talliedAmount = 0;

      Object.keys(finalRewards).map((gotchiId) => {
        const amount = finalRewards[gotchiId];

        if (!isNaN(amount)) {
          talliedAmount = talliedAmount + amount;
        }
      });

      const sorted: string[] = [];
      const sortedKeys = Object.keys(finalRewards).sort((a, b) => {
        return finalRewards[b] - finalRewards[a];
      });

      sortedKeys.forEach((key) => {
        sorted.push(`${key}: ${finalRewards[key]}`);
      });

      console.log("Total GHST to send:", talliedAmount);
      console.log("Round amount:", roundAmount);

      let totalGhstSent = BigNumber.from(0);
      let txData = [];
      let txGroup: TxArgs[] = [];
      let tokenIdsNum = 0;

      for (const gotchiID of Object.keys(finalRewards)) {
        let amount = finalRewards[gotchiID];
        let parsedAmount = BigNumber.from(parseEther(amount.toString()));
        let finalParsed = parsedAmount.toString();

        if (maxProcess < tokenIdsNum + 1) {
          txData.push(txGroup);
          txGroup = [];
          tokenIdsNum = 0;
        }

        txGroup.push({
          tokenID: gotchiID,
          amount: amount,
          parsedAmount: finalParsed,
        });
        tokenIdsNum += 1;
      }

      if (tokenIdsNum > 0) {
        txData.push(txGroup);
        txGroup = [];
        tokenIdsNum = 0;
      }

      const ghstToken = (await hre.ethers.getContractAt(
        "@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20",
        ghstAddress,
        signer
      )) as ERC20;
      const allowance = await ghstToken.allowance(
        deployerAddress,
        aavegotchiDiamondAddressMatic
      );

      if (allowance.lt(hre.ethers.utils.parseEther("375000"))) {
        console.log("Setting allowance");

        const tx = await ghstToken.approve(
          aavegotchiDiamondAddressMatic,
          hre.ethers.constants.MaxUint256
        );
        await tx.wait();
        console.log("Allowance set!");
      }

      for (const [i, txGroup] of txData.entries()) {
        console.log("current index:", i);

        // if (i < 0) continue; //use this line to skip indexes where the tx failed.

        let tokenIds: string[] = [];
        let amounts: string[] = [];

        txGroup.forEach((sendData) => {
          if (
            sacrificedList.data.aavegotchis
              .map((val) => val.id)
              .includes(sendData.tokenID)
          ) {
            console.log(
              `Removing ${sendData.tokenID} because it's on the bad list`
            );
          } else {
            tokenIds.push(sendData.tokenID);
            amounts.push(sendData.parsedAmount);
          }
        });

        let totalAmount = amounts.reduce((prev, curr) => {
          return BigNumber.from(prev).add(BigNumber.from(curr)).toString();
        });

        totalGhstSent = totalGhstSent.add(totalAmount);

        console.log(
          `Sending ${formatEther(totalAmount)} GHST to ${
            tokenIds.length
          } Gotchis (from ${tokenIds[0]} to ${tokenIds[tokenIds.length - 1]})`
        );

        const escrowFacet = (
          await hre.ethers.getContractAt("EscrowFacet", diamondAddress)
        ).connect(signer) as EscrowFacet;
        const tx = await escrowFacet.batchDepositGHST(tokenIds, amounts);
        console.log("tx hash:", tx.hash);

        let receipt: ContractReceipt = await tx.wait();
        console.log("receipt:", receipt.transactionHash);
        console.log("Gas used:", strDisplay(receipt.gasUsed.toString()));
        if (!receipt.status) {
          throw Error(`Error:: ${tx.hash}`);
        }
        console.log("Total GHST Sent:", formatEther(totalGhstSent));
      }
    }
  );
