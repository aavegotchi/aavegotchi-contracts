import {
  constructRewardArray,
  dropXPStrategotchi1,
  getFilePaths,
  getStrategotchiAddresses,
} from "../../parseStrategotchiAddresses";

async function grantXPStrategotchi1() {
  const tournament: number = 2;
  const typeform = "responses";
  const strategotchicsv = "strategotchi";

  const [typeformPath, strategotchiPath] = getFilePaths(
    typeform,
    strategotchicsv,
    tournament
  );

  //get all eligible gotchis
  const { addresses, aavegotchiIds } = await getStrategotchiAddresses(
    typeformPath,
    strategotchiPath
  );

  console.log(
    "Gotchis:",
    aavegotchiIds.length,
    "gotchis without ocurrence filters"
  );

  //limitduplicate to 3 occurences
  const aavegotchiIdsLimited = limitDuplicates(aavegotchiIds, 3);
  console.log(aavegotchiIdsLimited);
  console.log(`final gotchis length: ${aavegotchiIdsLimited.length}`);

  const rewards = constructRewardArray(aavegotchiIds.length, tournament);
  console.log("Rewards", rewards);

  await dropXPStrategotchi1(
    aavegotchiIds,
    rewards.map((x) => x.toString())
  );
}

function limitDuplicates(arr: string[], maxOccurrences: number): string[] {
  const counts = new Map<string, number>();
  return arr.reduce((result: string[], item: string) => {
    const count = (counts.get(item) || 0) + 1;
    if (count <= maxOccurrences) {
      result.push(item);
    }
    counts.set(item, count);
    return result;
  }, []);
}

grantXPStrategotchi1()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
