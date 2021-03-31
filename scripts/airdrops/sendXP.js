const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main(){
  const diamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d'

  let owner = await (await ethers.getContractAt('OwnershipFacet', diamondAddress)).owner()

     await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: ["0x02491D37984764d39b99e4077649dcD349221a62"]
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

    const xpValue= [...Array(250).fill(addresses.length)]


    const signer = ethers.provider.getSigner(owner)

    const Aaveg = await ethers.getContractAt('contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet', diamondAddress)
    const dao = await ethers.getContractAt('DAOFacet', diamondAddress)

    

  for(let i=0;i<addresses.length;i++){
  const ownerGotchis= await Aaveg.allAavegotchisOfOwner(addresses[i])
  if (ownerGotchis[0].status.toString()>=3){
    const gotchiIds = [...Array(ownerGotchis[0].status.toString()).fill(addresses.length)];
    const xpValue= [...Array(250).fill(addresses.length)];
  }
}
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })