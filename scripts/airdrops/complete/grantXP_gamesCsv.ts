import fs from "fs";
import csv from "csv-parser";
import { run } from "hardhat";

async function parseCsv(path: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const ids = new Set<string>();
    fs.createReadStream(path)
      .pipe(csv())
      .on("data", (row) => {
        const id = row["aavegotchi_equiped_id"];
        if (id) {
          ids.add(String(id).trim());
        }
      })
      .on("end", () => resolve(Array.from(ids)))
      .on("error", reject);
  });
}

async function main() {
  const csvPath = "data/games_xp.csv";
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found: ${csvPath}`);
  }
  const tokenIds = await parseCsv(csvPath);
  const outDir = "data/airdrops/custom";
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const outPath = `${outDir}/gamesXp.ts`;
  fs.writeFileSync(
    outPath,
    `export const tokenIds: string[] = ${JSON.stringify(tokenIds, null, 2)};\n`
  );

  await run("grantXP_aavegotchis", {
    filename: "custom/gamesXp",
    amount: "30",
    batchSize: "500",
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

export {}; // TypeScript module
