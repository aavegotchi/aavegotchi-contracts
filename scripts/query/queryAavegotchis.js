const axios = require("axios");
const LiquidityManagerSigProp = require("../../data/airdrops/sigprop/LiquidityManagerSigProp.tsx");
const main = async () => {
  console.log(LiquidityManagerSigProp);
  try {
    const result = await axios.post(
      "https://api.thegraph.com/subgraphs/name/aavegotchi/aavegotchi-core-matic",
      {
        query: `{users(first:1000,where:{id_in:${LiquidityManagerSigProp}) {
          id
          gotchisOwned(first:1000) {
            id
          }
        }}`,
      }
    );
    console.log(result.data);
  } catch (error) {
    console.error(error);
  }
};

main();
