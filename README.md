# Aavegotchi Contracts

## Contract Addresses

Kovan:

- Aavegotchi diamond: 0xAb1D4a5042DC08bd3A9C9BF24cB6F6A680D82780
- GHST diamond: 0x659Fa2A5688cd0ACf96f79667881E26aBe97398f

The ABI files for the diamonds are in the artifacts directory:

1. IAavegotchiDiamond.json
1. IGHSTDiamond.json

To easily see what functions these ABI files provide check the corresponding files in the contracts/interfaces directory:

1. IAavegotchiDiamond.sol
1. IGHSTDiamond.sol

Using a diamond ABI should look something like this:

```javascript
let aavegotchiDiamond = new web3.eth.Contract(
  JSON.parse(jsonfromfile).abi,
  aavegotchiDiamondAddress
);
```

## Deployment

```console
npx buidler run scripts/deploy.js
```
