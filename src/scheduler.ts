import cron from "node-cron";
import type { FetchConfig, HousingData } from "./types.js";
import { fetchHtml, extractNextData, parseNextData } from "./fetcher.js";
import * as fs from "fs";
import * as path from "path";

interface CronConfig {
  urls: FetchConfig[];
  dataDir: string;
  baseGapMinutes: number;
  varianceMinutes: number;
  timezone: string;
  cronExpression: string;
}

export function createScheduler(config: CronConfig) {
  const { urls, dataDir, baseGapMinutes, varianceMinutes, timezone, cronExpression } = config;
  let isTaskRunning = false;

  function getDateFolder(): string {
    return new Date().toISOString().split("T")[0];
  }

  function ensureFolder(): string {
    const folderPath = path.join(dataDir, getDateFolder());
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    return folderPath;
  }

  function logError(message: string, stack?: string): void {
    const folderPath = ensureFolder();
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ERROR: ${message}${stack ? `\n${stack}` : ""}\n\n`;
    fs.appendFileSync(path.join(folderPath, "error.log"), logEntry);
    console.log(`Error saved to ${folderPath}/error.log`);
  }

  function randomDelay(): number {
    const varianceMs = varianceMinutes * 60 * 1000;
    const delayMs = baseGapMinutes * 60 * 1000;
    return delayMs + Math.floor(Math.random() * varianceMs) - varianceMs / 2;
  }

  async function processUrl(fetchConfig: FetchConfig): Promise<HousingData | null> {
    console.log(`[${new Date().toISOString()}] Fetching ${fetchConfig.city}...`);
    const html = await fetchHtml(fetchConfig.url);
    const nextData = extractNextData(html);
    if (!nextData) {
      const errMsg = `__NEXT_DATA__ not found for ${fetchConfig.city}`;
      console.error(errMsg);
      logError(errMsg);
      return null;
    }

    const parsed = parseNextData(nextData);
    const pageMeta = nextData.props.pageProps.pageMeta as Record<string, unknown>;

    const title = typeof pageMeta?.title === "string" ? pageMeta.title : "";

    return {
      country: fetchConfig.country,
      city: fetchConfig.city,
      url: fetchConfig.url,
      scrapedAt: new Date().toISOString(),
      pageTitle: title,
      ...parsed,
    };
  }

  async function performTask() {
    if (isTaskRunning) {
      console.log("Task already running. Skipping.");
      return;
    }

    isTaskRunning = true;
    console.log(`\n[${new Date().toISOString()}] Task started.`);

    try {
      const results: HousingData[] = [];
      for (let i = 0; i < urls.length; i++) {
        const fetchConfig = urls[i];
        const result = await processUrl(fetchConfig);
        if (result) results.push(result);

        if (i < urls.length - 1) {
          const waitMs = randomDelay();
          console.log(`Waiting ${Math.round(waitMs / 60000)} mins before next URL...`);
          await new Promise(resolve => setTimeout(resolve, Math.max(0, waitMs)));
        }
      }

      if (results.length > 0) {
        const folderPath = ensureFolder();

        results.forEach((r) => {
          const fileName = `${r.city.toLowerCase().replace(/\s+/g, "-")}.json`;
          fs.writeFileSync(path.join(folderPath, fileName), JSON.stringify(r, null, 2));
        });

        const indexData = {
          scrapedAt: new Date().toISOString(),
          cities: results.map((r) => ({
            city: r.city,
            country: r.country,
            file: `${r.city.toLowerCase().replace(/\s+/g, "-")}.json`,
            totalListings: r.totalListings,
          })),
        };
        fs.writeFileSync(path.join(folderPath, "index.json"), JSON.stringify(indexData, null, 2));

        console.log(`\nSaved to ${folderPath}/`);
        console.log("\n=== SUMMARY ===");
        results.forEach((r) => console.log(`${r.city}: ${r.totalListings} listings, ${r.areas.length} areas`));
      } else {
        logError("All URLs failed - no data scraped");
      }

} catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const stack = error instanceof Error ? error.stack : undefined;
      console.error(`Fatal Error:`, message);
      logError(message, stack);
    } finally {
      isTaskRunning = false;
      console.log(`[${new Date().toISOString()}] Task finished.`);
    }
  }

  cron.schedule(cronExpression, performTask, { timezone });

  return { performTask };
}