# Aavegotchi Contracts (Legacy Polygon/Ethereum)

This repository contains legacy Polygon and historical Ethereum contracts, scripts, and deployment artifacts.

As of July 25, 2025, Aavegotchi's canonical chain is Base. Active deployments and upgrades are maintained in [`aavegotchi/aavegotchi-geist`](https://github.com/aavegotchi/aavegotchi-geist).

## Canonical Base Deployment

- Canonical contracts repo: [https://github.com/aavegotchi/aavegotchi-geist](https://github.com/aavegotchi/aavegotchi-geist)
- Base migration reference: [https://wiki.aavegotchi.com/base-migration](https://wiki.aavegotchi.com/base-migration)
- GHST on Base: [`0xcd2f22236dd9dfe2356d7c543161d4d260fd9bcb`](https://basescan.org/address/0xcd2f22236dd9dfe2356d7c543161d4d260fd9bcb)

## Legacy Deployments In This Repo

As of 11/24/2022, ERC-1155 NFTs previously located in AavegotchiDiamond (`0x869...`) were migrated to a separate WearableDiamond.

- Polygon AavegotchiDiamond (ERC-721 + storage): [`0x86935F11C86623deC8a25696E1C19a8659CbF95d`](https://polygonscan.com/address/0x86935F11C86623deC8a25696E1C19a8659CbF95d)
- Polygon WearableDiamond (ERC-1155 items): [`0x58de9AaBCaeEC0f69883C94318810ad79Cc6a44f`](https://polygonscan.com/address/0x58de9AaBCaeEC0f69883C94318810ad79Cc6a44f)
- Ethereum Diamond: [`0x1906fd9c4AC440561F7197Da0A4BD2E88DF5fA70`](https://etherscan.io/address/0x1906fd9c4AC440561F7197Da0A4BD2E88DF5fA70)

## About Aavegotchi

Aavegotchis are fully onchain NFTs powered by ERC-721, ERC-1155, and ERC-998 standards, and use EIP-2535 Diamonds for modular upgrades.

- Aavegotchi Discord: [https://discord.gg/aavegotchi](https://discord.gg/aavegotchi)
- Aarchitects (Developers) Discord: [https://discord.gg/dS3VnhzMbB](https://discord.gg/dS3VnhzMbB)

## Resources

- Official docs: [https://docs.aavegotchi.com](https://docs.aavegotchi.com)
- Louper (legacy Polygon diamond): [https://louper.dev/?address=0x86935F11C86623deC8a25696E1C19a8659CbF95d&network=polygon](https://louper.dev/?address=0x86935F11C86623deC8a25696E1C19a8659CbF95d&network=polygon)
- Legacy Polygon subgraph: [https://thegraph.com/legacy-explorer/subgraph/aavegotchi/aavegotchi-core-matic?version=current](https://thegraph.com/legacy-explorer/subgraph/aavegotchi/aavegotchi-core-matic?version=current)
- EIP-2535 primer: [https://eips.ethereum.org/EIPS/eip-2535](https://eips.ethereum.org/EIPS/eip-2535)
