# Aavegotchi Diamonds

## Contract Addresses

Kovan:
- Aavegothic diamond: 0x16a2BA2F8d91f0D5e3B9dBAd7E716DaA428fBA85
- Old Aavegothic diamond: 0x243D0E444BCaE6BD0645b6Bf4960cc6a925167E0
- Old Aavegotchi diamond: 0x10225cc1ea2435E53E7661E84D36Fb4E9e20a9DB
- GHST diamond: 0xeDaA788Ee96a0749a2De48738f5dF0AA88E99ab5

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

## Local Deployment

```console
npx hardhat run scripts/deploy.js
```
