export const bridgeConfig = {
  "84532": {
    GOTCHI: {
      isAppChain: false,
      NonMintableToken: "0x87C969d083189927049f8fF3747703FB9f7a8AEd",
      Vault: "0xEccF8B72c6A354532F27053e54A5b4b912D1e6D6",
      connectors: {
        "631571": {
          FAST: "0x3C43820A77d3Ff7Df81f212851857c46684f8b2F",
        },
      },
    },
    GOTCHI_ITEM: {
      isAppChain: false,
      NonMintableToken: "0x87C969d083189927049f8fF3747703FB9f7a8AEd",
      Vault: "0x2709f098E8C641796B495bED28A34F9FEA858ac8",
      connectors: {
        "631571": {
          FAST: "0xB2B948d421Ce7c0eC075a073682236269614D32d",
        },
      },
    },
  },
  "631571": {
    GOTCHI: {
      isAppChain: true,
      MintableToken: "0xD66C6C61D5a535eD69E3769582895daec28a4651",
      Controller: "0x143B8D0e2b6d7791F571A68bf07da2253C0d52CB",
      connectors: {
        "84532": {
          FAST: "0x3A643fc25C721971314119a50a7fdF18385b7eD9",
        },
      },
    },
    GOTCHI_ITEM: {
      isAppChain: true,
      MintableToken: "0x954B9F6DaB28F92c88192E2F52FDa5A6Df4A0334",
      Controller: "0x60d629c876E455eFdca83e2b4c85DfB9d4C3C58C",
      connectors: {
        "84532": {
          FAST: "0xc14Bc9857A27b428b3eB84cB561412a42C9B9798",
        },
      },
    },
  },

  "137": {
    GOTCHI: {
      isAppChain: false,
      NonMintableToken: "0x86935F11C86623deC8a25696E1C19a8659CbF95d",
      Vault: "0xF1D1d61EEDDa7a10b494aF7af87D932AC910f3C5",
      connectors: {
        "63157": {
          FAST: "0x8992e26290073183DA46aF2589ff3025be3CdF29",
        },
      },
    },
  },
  "63157": {
    GOTCHI: {
      isAppChain: true,
      MintableToken: "0x6Acc828BbbC6874de40Ca20bfeA7Cd2a2DA8DA8c",
      Controller: "0x5964823256B9C8aC7Ba7Dd94807FDF4DFf728215",
      connectors: {
        "137": {
          FAST: "0x870cCEc2CB64270cEd3A4BE581Ddc87673882758",
        },
      },
    },
  },
};
