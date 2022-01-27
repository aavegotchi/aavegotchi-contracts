//update IDs: 212(1337 Laptop)

import { run } from "hardhat";
import { convertSideDimensionsToTaskFormat } from "../../tasks/updateItemSideDimensions";
import { SideDimensions } from "../itemTypeHelpers";

async function main() {
  const newDimensions: SideDimensions[] = [
    {
      itemId: 212,
      name: "1339 Laptop",
      side: "left",
      dimensions: { x: 15, y: 30, width: 14, height: 14 },
    },
  ];

  await run(
    "updateItemSideDimensions",
    convertSideDimensionsToTaskFormat(newDimensions)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.laptopDimensionsFix = main;
