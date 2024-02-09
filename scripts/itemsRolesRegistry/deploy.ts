import { deployItemsRolesRegistryFacet } from "./deployItemsRolesRegistry"
import { upgradeItemsFacet } from "./upgradeItemsFacet"

async function main() {
  await deployItemsRolesRegistryFacet()
  await upgradeItemsFacet()
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

exports.deployProject = main