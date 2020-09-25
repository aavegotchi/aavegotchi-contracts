# Aavegotchi Diamonds

## Contract Addresses

Kovan:

- Aavegotchi diamond: 0x22E4D249962d74ca91f915Bed1F928DfC0902018
- GHST diamond: 0xBa05924532cf50Dc9598d2A708Daf69316fBA47F

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
