import { deployAndUpgradeForgeDiamond } from "./upgrade-deployAndUpgradeForgeDiamond";
import {upgradeAavegotchiForForge} from "./upgrade-aavegotchiForForge";
import {setForgeProperties} from "./upgrade-forgeSetters";


export async function releaseForge(){
    console.log("Starting forge release...")

    let forgeDiamondAddress = await deployAndUpgradeForgeDiamond();
    await upgradeAavegotchiForForge(forgeDiamondAddress);
    await setForgeProperties(forgeDiamondAddress)

    console.log("Finished forge release.")

    return forgeDiamondAddress
}