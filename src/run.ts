import "dotenv/config";
import { createScheduler } from "./scheduler.js";
import type { FetchConfig } from "./types.js";

const BASE_URLS: FetchConfig[] = [
  { url: "https://www.propertyfinder.ae/en/buy/dubai/apartments-for-sale.html", country: "UAE", city: "Dubai" },
  { url: "https://www.propertyfinder.ae/en/buy/abu-dhabi/apartments-for-sale.html", country: "UAE", city: "Abu Dhabi" },
  { url: "https://www.propertyfinder.ae/en/buy/ajman/apartments-for-sale.html", country: "UAE", city: "Ajman" },
  { url: "https://www.propertyfinder.ae/en/buy/sharjah/apartments-for-sale.html", country: "UAE", city: "Sharjah" },
  { url: "https://www.propertyfinder.qa/en/buy/doha/apartments-for-sale.html", country: "Qatar", city: "Doha" },
  { url: "https://www.propertyfinder.qa/en/buy/lusail/apartments-for-sale.html", country: "Qatar", city: "Lusail" },
  { url: "https://www.propertyfinder.bh/en/buy/apartments-for-sale.html", country: "Bahrain", city: "Bahrain" },
];

createScheduler({
  urls: BASE_URLS,
  dataDir: "data",
  baseGapMinutes: 10,
  varianceMinutes: 5,
  timezone: "Europe/Warsaw",
  cronExpression: "0 */4 * * *",
});

console.log(`Service started. Runs every 4 hours.`);
console.log(`URLs will be fetched with 10 min gap (+- 5 min random).`);