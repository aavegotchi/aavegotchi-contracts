import path from "path";

// Shared interfaces
export interface TokenBalance {
  tokenId: string;
  balance: number;
}

export interface ContractOwnership {
  contractAddress: string;
  contractOwner: string;
  tokens?: TokenBalance[]; // used in getWearableData
  tokenIds?: string[]; // used in classifyAavegotchi
}

export interface SafeDetails {
  safeAddress: string;
  tokens?: TokenBalance[]; // used in getWearableData
  tokenIds?: string[]; // used in classifyAavegotchi
}

export interface EquippedItem {
  itemId: string;
  amount: string;
}

// Special addresses
export const ADDRESSES = {
  vault: "0xdd564df884fd4e217c9ee6f65b4ba6e5641eac63",
  gbmDiamond: "0xD5543237C656f25EEA69f1E247b8Fa59ba353306",
  raffles: "0x6c723cac1E35FE29a175b287AE242d424c52c1CE",
  aavegotchiDiamond: "0x86935F11C86623deC8a25696E1C19a8659CbF95d",
  forgeDiamond: "0x4fDfc1B53Fd1D80d969C984ba7a8CE4c7bAaD442",
};

// Excluded addresses
export const excludedAddresses = [
  "0x0000000000000000000000000000000000000000",
  "0x000000000000000000000000000000000000dEaD",
  "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF",
].map((a) => a.toLowerCase());

// Base directories
export const BASE_OUTPUT_DIR = path.join(__dirname, "data");
export const METADATA_DIR = path.join(__dirname, "metadata");
