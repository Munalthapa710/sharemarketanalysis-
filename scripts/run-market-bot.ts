import { marketDataBot } from "@/lib/data/market-bot";

async function main() {
  const snapshot = await marketDataBot.snapshot(true);
  console.log(JSON.stringify(snapshot, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
