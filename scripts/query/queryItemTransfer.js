/* global ethers hre */

//@ts-ignore
//import hardhat, { run, ethers } from "hardhat";

async function main() {
  //transfer block
  const diamondCreationBlock = 18522462;
  const aavegotchiDiamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  const gbmAddress = "0xa44c8e0eCAEFe668947154eE2b803Bd4e6310EFe";

  let diamond = await ethers.getContractAt(
    "LibERC1155",
    aavegotchiDiamondAddress
  );

  //event TransferSingle(address indexed _operator, address indexed _from, address indexed _to, uint256 _id, uint256 _value);

  let filter = diamond.filters.TransferBatch(
    undefined,
    "0xed3BBbe2e3eacE311a94b059508Bbdda9149AB23",
    undefined
  );

  let results;

  let range = 18616907 - diamondCreationBlock;
  let batchSize = 999;
  let runs = range / batchSize;

  const final = [];

  for (let index = 0; index < runs; index++) {
    console.log("index:", index);
    // const element = array[index];

    results = await diamond.queryFilter(
      filter,
      diamondCreationBlock + batchSize * index,
      diamondCreationBlock + batchSize * (index + 1)
    );

    //  console.log("results:", results);

    for (let index = 0; index < results.length; index++) {
      const result = results[index];
      //@ts-ignore

      console.log("args:", result.args);

      result.args._ids.forEach((id, index) => {
        const quantity = result.args._values[index].toString();
        console.log(
          `Transferred quantity ${quantity} of ${id.toString()} to ${
            result.args._to
          } in tx hash: ${result.transactionHash}`
        );
      });

      /* console.log(
        `Transferring ${result.args._value.toString()} ${result.args._id.toString()} from ${
          result.args._from
        } to ${result.args._to} in TX: ${result.transactionHash}`
      );
      */
    }

    final.push(results);
  }

  //console.log("final:", final);

  /*
    for (const result of results) {
      const args = result.args;
  
      console.log("args:", args);
  
      /* console.log(
        `${args.experience.toString()} Experience transferred from ${args._fromTokenId.toString()} to ${args._toTokenId.toString()} in block number ${
          result.blockNumber
        }`
      );
      *
    }
    */
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
