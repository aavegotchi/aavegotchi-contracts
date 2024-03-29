import {
  constructRewardArray,
  dropXPStrategotchi1,
  getFIlePaths,
  getStrategotchiAddresses,
} from "../../parseStrategotchiAddresses";

async function grantXPStrategotchi1() {
  const tournament: number = 1;
  const typeform = "responses";
  const strategotchicsv = "strategotchi";

  const [typeformPath, strategotchiPath] = getFIlePaths(
    typeform,
    strategotchicsv,
    tournament
  );

  //get all eligible gotchis
  const { addresses, aavegotchiIds } = await getStrategotchiAddresses(
    typeformPath,
    strategotchiPath
  );

  console.log("Gotchis:", aavegotchiIds);

  const rewards = constructRewardArray(aavegotchiIds.length, tournament);
  console.log("Rewards", rewards);

  await dropXPStrategotchi1(
    aavegotchiIds,
    rewards.map((x) => x.toString())
  );
}

grantXPStrategotchi1()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
