export const bridgeConfig = {
  "84532": {
    GOTCHI: {
      isAppChain: false,
      NonMintableToken: "0xf81FFb9E2a72574d3C4Cf4E293D4Fec4A708F2B1",
      Vault: "0x92641fDD13A1B2099675fd1F3798fa0d9e6CDAfa",
      connectors: {
        "631571": {
          FAST: "0x8Ca0b8D5a04F902171113A4Ac76a8f1F52FCDF6f",
        },
      },
    },
  },
  "631571": {
    GOTCHI: {
      isAppChain: true,
      MintableToken: "0x226625C1B1174e7BaaE8cDC0432Db0e2ED83b7Ba",
      Controller: "0xde3c698E15806384C667b0478C1072867571f6cd",
      connectors: {
        "84532": {
          FAST: "0x8Dc7AED7a2A2729D762e63BaDecCd7D50474020B",
        },
      },
    },
  },
};

// {
//   "84532": {
//     GOTCHI: {
//       isAppChain: false,
//       NonMintableToken: "0x87C969d083189927049f8fF3747703FB9f7a8AEd",
//       Vault: "0xEccF8B72c6A354532F27053e54A5b4b912D1e6D6",
//       connectors: {
//         "631571": {
//           FAST: "0x3C43820A77d3Ff7Df81f212851857c46684f8b2F",
//         },
//       },
//     },
//     GOTCHI_ITEM: {
//       isAppChain: false,
//       NonMintableToken: "0x87C969d083189927049f8fF3747703FB9f7a8AEd",
//       Vault: "0x2709f098E8C641796B495bED28A34F9FEA858ac8",
//       connectors: {
//         "631571": {
//           FAST: "0xB2B948d421Ce7c0eC075a073682236269614D32d",
//         },
//       },
//     },
//   },
//   "631571": {
//     GOTCHI: {
//       isAppChain: true,
//       MintableToken: "0xD66C6C61D5a535eD69E3769582895daec28a4651",
//       Controller: "0x143B8D0e2b6d7791F571A68bf07da2253C0d52CB",
//       connectors: {
//         "84532": {
//           FAST: "0x3A643fc25C721971314119a50a7fdF18385b7eD9",
//         },
//       },
//     },
//     GOTCHI_ITEM: {
//       isAppChain: true,
//       MintableToken: "0x954B9F6DaB28F92c88192E2F52FDa5A6Df4A0334",
//       Controller: "0x60d629c876E455eFdca83e2b4c85DfB9d4C3C58C",
//       connectors: {
//         "84532": {
//           FAST: "0xc14Bc9857A27b428b3eB84cB561412a42C9B9798",
//         },
//       },
//     },
//   },
// };
