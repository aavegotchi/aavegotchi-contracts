const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main(){
  const diamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'

  let owner = await (await ethers.getContractAt('OwnershipFacet', diamondAddress)).owner()

  console.log('impersonating')
     await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [owner]
    })

    const addresses= ["0xeda29227543b2bc0d8e4a5220ef0a34868033a2d",
    "0xad6fb854a71dc0d0fbbf3c9952cf086014c5bc04",
    "0xeda29227543b2bc0d8e4a5220ef0a34868033a2d",
    "0x9528db1eb04d3ffa04fecbf68b8b20163bb24f56",
    "0x7a97484f57d98a62b0195d79b9600624744de59c",
    "0x7a97484f57d98a62b0195d79b9600624744de59c",
    "0x9528db1eb04d3ffa04fecbf68b8b20163bb24f56",
    "0x3742f0fd8fce40411c450e74d270d4d5faaf92fd",
    "0x3b486d3b5dedd0f87c6a58a2217cdc305cd43a1b",
    "0x3b486d3b5dedd0f87c6a58a2217cdc305cd43a1b",
    "0x6d38939de57c10b880f1eb2227da45ff9174a095",
    "0x9fb3847872b3694139d4c19ffffb914520e926aa",
    "0x9fb3847872b3694139d4c19ffffb914520e926aa",
    "0xc117e7247be4830d169da13427311f59bd25d669",
    "0xc117e7247be4830d169da13427311f59bd25d669",
    "0x67c47b1af7d8b7352fde8d9b07b7e2ce0a22508c",
    "0x6d38939de57c10b880f1eb2227da45ff9174a095",
    "0x280ded1b7e430bed0cbb0aace452fd2adef2b581",
    "0x2e4041504e373d1e7be79e856a3dd2343088381b",
    "0x2e4041504e373d1e7be79e856a3dd2343088381b",
    "0x3742f0fd8fce40411c450e74d270d4d5faaf92fd",
    "0x67c47b1af7d8b7352fde8d9b07b7e2ce0a22508c",
    "0x427222582af199752e22c973d1d194c82e02084f",
    "0x427222582af199752e22c973d1d194c82e02084f",
    "0xb2c980a75f76c664b00b18647bbad08e3df0460d",
    "0xbe67d6800fab847f99f81a8e25b0f8d3391785a2",
    "0xbe67d6800fab847f99f81a8e25b0f8d3391785a2",
    "0x956f1ce3ff2ea59a8b41df83ce9f85ed59d73f92",
    "0x956f1ce3ff2ea59a8b41df83ce9f85ed59d73f92",
    "0x280ded1b7e430bed0cbb0aace452fd2adef2b581",
    "0xb2c980a75f76c664b00b18647bbad08e3df0460d",
    "0x0b81747f504dfc906a215e301d8b8ad82e44cbd2",
    "0x0b81747f504dfc906a215e301d8b8ad82e44cbd2",
    "0xddf86597aff5c826643bced8ef0b84b10a2847ab",
    "0x20ee31efb8e96d346ceb065b993494d136368e96",
    "0x35f64560c51c8772f75186a8931929589b7c8d80",
    "0x35f64560c51c8772f75186a8931929589b7c8d80",
    "0xad6fb854a71dc0d0fbbf3c9952cf086014c5bc04",
    "0x027ffd3c119567e85998f4e6b9c3d83d5702660c",
    "0x027ffd3c119567e85998f4e6b9c3d83d5702660c",
    "0x6186290b28d511bff971631c916244a9fc539cfe",
    "0x6186290b28d511bff971631c916244a9fc539cfe",
    "0x2f16c5ae6f07aa2b85c6b71e9179ffcb47045677",
    "0x2629de54a2b7ed0164b896c273bec77a78819a9b",
    "0xa2cb00f0075ef6ca318cdfc6062e8b776b431576",
    "0x2f16c5ae6f07aa2b85c6b71e9179ffcb47045677",
    "0xa2cb00f0075ef6ca318cdfc6062e8b776b431576",
    "0x5f1f32fc64c1fd7c01d7b2d585638525e5c71bcc",
    "0x6fec474030a273a673dff02f83bb1ceb9de7b82c",
    "0x610aec3851d7688c4c8aef3a6173f667e8beef73",
    "0xddf86597aff5c826643bced8ef0b84b10a2847ab",
    "0x80039dc3d5bb48ec4bd822c4e8828574fdcc51a6",
    "0x6fec474030a273a673dff02f83bb1ceb9de7b82c"]

    console.log('creating ap array')
  

    const signer = ethers.provider.getSigner(owner)
 
    /*DATA FROM SUBGRAPH*/
 
   var data= [
    {
      "gotchisOwned": [
        {
          "experience": "0",
          "id": "2575"
        }
      ],
      "id": "0x027ffd3c119567e85998f4e6b9c3d83d5702660c"
    },
    {
      "gotchisOwned": [
        {
          "experience": "0",
          "id": "100"
        },
        {
          "experience": "0",
          "id": "4211"
        },
        {
          "experience": "0",
          "id": "4212"
        },
        {
          "experience": "0",
          "id": "4214"
        },
        {
          "experience": "0",
          "id": "8479"
        },
        {
          "experience": "0",
          "id": "8480"
        },
        {
          "experience": "0",
          "id": "8481"
        },
        {
          "experience": "0",
          "id": "8483"
        },
        {
          "experience": "0",
          "id": "900"
        },
        {
          "experience": "0",
          "id": "9040"
        }
      ],
      "id": "0x0b81747f504dfc906a215e301d8b8ad82e44cbd2"
    },
    {
      "gotchisOwned": [
        {
          "experience": "0",
          "id": "5137"
        },
        {
          "experience": "0",
          "id": "5138"
        },
        {
          "experience": "0",
          "id": "5139"
        },
        {
          "experience": "0",
          "id": "5140"
        },
        {
          "experience": "0",
          "id": "5141"
        },
        {
          "experience": "0",
          "id": "7252"
        },
        {
          "experience": "0",
          "id": "7253"
        },
        {
          "experience": "0",
          "id": "7254"
        },
        {
          "experience": "0",
          "id": "7499"
        }
      ],
      "id": "0x20ee31efb8e96d346ceb065b993494d136368e96"
    },
    {
      "gotchisOwned": [
        {
          "experience": "0",
          "id": "3446"
        },
        {
          "experience": "0",
          "id": "8248"
        },
        {
          "experience": "0",
          "id": "8249"
        },
        {
          "experience": "0",
          "id": "8250"
        },
        {
          "experience": "0",
          "id": "8251"
        },
        {
          "experience": "0",
          "id": "8252"
        }
      ],
      "id": "0x2629de54a2b7ed0164b896c273bec77a78819a9b"
    },
    {
      "gotchisOwned": [
        {
          "experience": "0",
          "id": "1453"
        },
        {
          "experience": "0",
          "id": "1579"
        }
      ],
      "id": "0x2e4041504e373d1e7be79e856a3dd2343088381b"
    },
    {
      "gotchisOwned": [
        {
          "experience": "0",
          "id": "795"
        },
        {
          "experience": "0",
          "id": "9171"
        },
        {
          "experience": "50",
          "id": "9173"
        },
        {
          "experience": "0",
          "id": "9174"
        },
        {
          "experience": "70",
          "id": "9175"
        }
      ],
      "id": "0x3742f0fd8fce40411c450e74d270d4d5faaf92fd"
    },
    {
      "gotchisOwned": [
        {
          "experience": "0",
          "id": "2171"
        }
      ],
      "id": "0x3b486d3b5dedd0f87c6a58a2217cdc305cd43a1b"
    },
    {
      "gotchisOwned": [
        {
          "experience": "0",
          "id": "1486"
        }
      ],
      "id": "0x427222582af199752e22c973d1d194c82e02084f"
    },
    {
      "gotchisOwned": [
        {
          "experience": "0",
          "id": "1470"
        },
        {
          "experience": "0",
          "id": "2673"
        },
        {
          "experience": "0",
          "id": "3237"
        },
        {
          "experience": "0",
          "id": "3989"
        },
        {
          "experience": "0",
          "id": "5391"
        },
        {
          "experience": "0",
          "id": "6147"
        },
        {
          "experience": "0",
          "id": "6443"
        },
        {
          "experience": "0",
          "id": "7025"
        },
        {
          "experience": "0",
          "id": "7067"
        },
        {
          "experience": "0",
          "id": "7362"
        },
        {
          "experience": "0",
          "id": "7364"
        },
        {
          "experience": "0",
          "id": "7369"
        },
        {
          "experience": "0",
          "id": "7832"
        },
        {
          "experience": "0",
          "id": "9084"
        }
      ],
      "id": "0x5f1f32fc64c1fd7c01d7b2d585638525e5c71bcc"
    },
    {
      "gotchisOwned": [],
      "id": "0x610aec3851d7688c4c8aef3a6173f667e8beef73"
    },
    {
      "gotchisOwned": [
        {
          "experience": "0",
          "id": "3013"
        },
        {
          "experience": "0",
          "id": "3016"
        },
        {
          "experience": "0",
          "id": "3017"
        },
        {
          "experience": "0",
          "id": "3020"
        },
        {
          "experience": "0",
          "id": "3021"
        },
        {
          "experience": "0",
          "id": "3024"
        },
        {
          "experience": "0",
          "id": "3028"
        },
        {
          "experience": "0",
          "id": "3034"
        },
        {
          "experience": "0",
          "id": "9407"
        },
        {
          "experience": "0",
          "id": "9409"
        },
        {
          "experience": "0",
          "id": "9411"
        },
        {
          "experience": "0",
          "id": "9412"
        }
      ],
      "id": "0x6186290b28d511bff971631c916244a9fc539cfe"
    },
    {
      "gotchisOwned": [
        {
          "experience": "0",
          "id": "5912"
        },
        {
          "experience": "0",
          "id": "5977"
        }
      ],
      "id": "0x6d38939de57c10b880f1eb2227da45ff9174a095"
    },
    {
      "gotchisOwned": [
        {
          "experience": "0",
          "id": "1366"
        },
        {
          "experience": "0",
          "id": "1849"
        },
        {
          "experience": "0",
          "id": "5134"
        },
        {
          "experience": "0",
          "id": "5136"
        },
        {
          "experience": "0",
          "id": "7521"
        },
        {
          "experience": "0",
          "id": "8355"
        },
        {
          "experience": "0",
          "id": "8356"
        },
        {
          "experience": "0",
          "id": "8857"
        }
      ],
      "id": "0x7a97484f57d98a62b0195d79b9600624744de59c"
    },
    {
      "gotchisOwned": [
        {
          "experience": "0",
          "id": "3514"
        }
      ],
      "id": "0x80039dc3d5bb48ec4bd822c4e8828574fdcc51a6"
    },
    {
      "gotchisOwned": [
        {
          "experience": "0",
          "id": "4811"
        }
      ],
      "id": "0x9528db1eb04d3ffa04fecbf68b8b20163bb24f56"
    },
    {
      "gotchisOwned": [
        {
          "experience": "0",
          "id": "5374"
        },
        {
          "experience": "210",
          "id": "5375"
        },
        {
          "experience": "0",
          "id": "5376"
        },
        {
          "experience": "0",
          "id": "5377"
        },
        {
          "experience": "0",
          "id": "5378"
        }
      ],
      "id": "0x956f1ce3ff2ea59a8b41df83ce9f85ed59d73f92"
    },
    {
      "gotchisOwned": [
        {
          "experience": "0",
          "id": "819"
        }
      ],
      "id": "0x9fb3847872b3694139d4c19ffffb914520e926aa"
    },
    {
      "gotchisOwned": [
        {
          "experience": "0",
          "id": "9495"
        }
      ],
      "id": "0xad6fb854a71dc0d0fbbf3c9952cf086014c5bc04"
    },
    {
      "gotchisOwned": [
        {
          "experience": "0",
          "id": "7101"
        }
      ],
      "id": "0xb2c980a75f76c664b00b18647bbad08e3df0460d"
    },
    {
      "gotchisOwned": [
        {
          "experience": "0",
          "id": "3596"
        },
        {
          "experience": "0",
          "id": "5092"
        },
        {
          "experience": "0",
          "id": "8821"
        }
      ],
      "id": "0xbe67d6800fab847f99f81a8e25b0f8d3391785a2"
    },
    {
      "gotchisOwned": [
        {
          "experience": "0",
          "id": "9977"
        },
        {
          "experience": "0",
          "id": "9978"
        },
        {
          "experience": "0",
          "id": "9979"
        },
        {
          "experience": "0",
          "id": "9980"
        }
      ],
      "id": "0xc117e7247be4830d169da13427311f59bd25d669"
    },
    {
      "gotchisOwned": [
        {
          "experience": "0",
          "id": "6042"
        }
      ],
      "id": "0xddf86597aff5c826643bced8ef0b84b10a2847ab"
    },
    {
      "gotchisOwned": [
        {
          "experience": "0",
          "id": "2792"
        },
        {
          "experience": "0",
          "id": "2793"
        },
        {
          "experience": "0",
          "id": "2794"
        },
        {
          "experience": "0",
          "id": "2795"
        },
        {
          "experience": "0",
          "id": "2796"
        },
        {
          "experience": "0",
          "id": "5992"
        },
        {
          "experience": "0",
          "id": "5993"
        },
        {
          "experience": "0",
          "id": "5994"
        },
        {
          "experience": "0",
          "id": "5995"
        },
        {
          "experience": "0",
          "id": "5996"
        },
        {
          "experience": "0",
          "id": "5997"
        },
        {
          "experience": "0",
          "id": "5998"
        },
        {
          "experience": "0",
          "id": "5999"
        },
        {
          "experience": "0",
          "id": "6000"
        },
        {
          "experience": "0",
          "id": "6001"
        },
        {
          "experience": "0",
          "id": "8621"
        },
        {
          "experience": "0",
          "id": "8622"
        },
        {
          "experience": "0",
          "id": "8623"
        },
        {
          "experience": "0",
          "id": "8624"
        },
        {
          "experience": "9",
          "id": "8625"
        }
      ],
      "id": "0xeda29227543b2bc0d8e4a5220ef0a34868033a2d"
    }
  ]


  /*PARAMS*/

  const xpPerGotchi = 250

  const dao = (await ethers.getContractAt('DAOFacet', diamondAddress)).connect(signer)

  for (let index = 0; index < data.length; index++) {
    const item = data[index];

    let gotchisOwned = item.gotchisOwned

      let tokenIDs = []
      let xp = []
  
      gotchisOwned.forEach((gotchi) => {
          tokenIDs.push(gotchi.id)
          xp.push(xpPerGotchi)
      });
  
      await dao.grantExperience(tokenIDs,xp)
  
      console.log(`${xpPerGotchi} Experience granted to ${tokenIDs.length} Aavegotchis owned by ${addresses[index]}`)
    
    
  }
}
   
  //  });
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })
  