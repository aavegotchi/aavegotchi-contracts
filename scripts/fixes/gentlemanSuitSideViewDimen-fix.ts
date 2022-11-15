import { run } from "hardhat";

import { convertSideDimensionsToTaskFormat } from "../../tasks/updateItemSideDimensions";
import { SideDimensions } from "../itemTypeHelpers";

async function main() {
  const newDimensions: SideDimensions[] = [
    {
      itemId: 85,
      name: "Gentleman Suit",
      side: "right",
      dimensions: { x: 20, y: 32, width: 4, height: 9 },
    },
    {
      itemId: 85,
      name: "Gentleman Suit",
      side: "left",
      dimensions: { x: 20, y: 32, width: 4, height: 9 },
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

exports.gentlemanSuitSideViewDimenFix = main;
