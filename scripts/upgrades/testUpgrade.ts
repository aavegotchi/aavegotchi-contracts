import { run } from "hardhat";
import { getSelector } from "../helperFunctions";

async function deploy() {
  const facet = "AavegotchiGameFacet"; // name of facet

  const newDaoFuncs = [
    getSelector(
      "function addItemManagers(address[] calldata _newItemManagers) external"
    ),
    getSelector(
      "function removeItemManagers(address[] calldata _itemManagers) external "
    ),
  ];

  await run("deployUpgrade", {
    diamondAddress: "0x86935F11C86623deC8a25696E1C19a8659CbF95d",
    facets: [facet],
    addSelectors: newDaoFuncs,
  });
}

deploy()
  .then(() => console.log("upgrade completed") /* process.exit(0) */)
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
