import cron from "node-cron";
import type { CronConfig, IndexData, CityIndexData } from "./scheduler-types.js";
import type { FetchConfig, HousingData } from "./types.js";
import { fetchHtml, extractNextData, parseNextData } from "./fetcher.js";
import {
  ensureFolder,
  readIndexFile,
  saveIndexFile,
  saveCityData,
  logError,
} from "./scheduler-storage.js";

export function createScheduler(config: CronConfig) {
  const { urls, dataDir, baseGapMinutes, varianceMinutes, timezone, cronExpression } = config;
  let isTaskRunning = false;

  function getTodayDateString(): string {
    return new Date().toISOString().split("T")[0];
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
      logError(dataDir, errMsg);
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

  function isFetchedToday(fetchedAt: string | undefined): boolean {
    if (!fetchedAt) return false;
    const today = getTodayDateString();
    return fetchedAt.startsWith(today);
  }

  async function performTask() {
    if (isTaskRunning) {
      console.log("Task already running. Skipping.");
      return;
    }

    isTaskRunning = true;
    const now = new Date().toISOString();
    console.log(`\n[${now}] Task started.`);

    try {
      const existingIndex = readIndexFile(dataDir);
      const fetchedCities = new Set(
        existingIndex?.cities
          .filter((c) => isFetchedToday(c.fetchedAt))
          .map((c) => c.city) || []
      );

      const urlsToFetch = urls.filter((u) => !fetchedCities.has(u.city));

      if (urlsToFetch.length === 0) {
        console.log("All cities already fetched today. Skipping.");
        isTaskRunning = false;
        console.log(`[${new Date().toISOString()}] Task finished.`);
        return;
      }

      console.log(`Need to fetch: ${urlsToFetch.map((u) => u.city).join(", ")}`);
      console.log(`Already fetched today: ${[...fetchedCities].join(", ") || "none"}`);

      const results: HousingData[] = [];
      for (let i = 0; i < urlsToFetch.length; i++) {
        const fetchConfig = urlsToFetch[i];
        const result = await processUrl(fetchConfig);
        if (result) results.push(result);

        if (i < urlsToFetch.length - 1) {
          const waitMs = randomDelay();
          console.log(`Waiting ${Math.round(waitMs / 60000)} mins before next URL...`);
          await new Promise(resolve => setTimeout(resolve, Math.max(0, waitMs)));
        }
      }

      if (results.length > 0) {
        results.forEach((r) => saveCityData(dataDir, r));

        const newCities: CityIndexData[] = results.map((r) => ({
          city: r.city,
          country: r.country,
          file: `${r.city.toLowerCase().replace(/\s+/g, "-")}.json`,
          totalListings: r.totalListings,
          fetchedAt: now,
        }));

        const existingCitiesMap = new Map(
          existingIndex?.cities.map((c) => [c.city, c]) || []
        );

        const allCities: CityIndexData[] = urls.map((u) => {
          const fromNew = newCities.find((nc) => nc.city === u.city);
          if (fromNew) return fromNew;
          return existingCitiesMap.get(u.city) || {
            city: u.city,
            country: u.country,
            file: `${u.city.toLowerCase().replace(/\s+/g, "-")}.json`,
            totalListings: 0,
          };
        });

        const indexData: IndexData = {
          scrapedAt: now,
          cities: allCities,
        };
        saveIndexFile(dataDir, indexData);

        const folderPath = ensureFolder(dataDir);
        console.log(`\nSaved to ${folderPath}/`);
        console.log("\n=== SUMMARY ===");
        results.forEach((r) => console.log(`${r.city}: ${r.totalListings} listings, ${r.areas.length} areas`));

        const skippedCount = urls.length - results.length;
        if (skippedCount > 0) {
          console.log(`\nSkipped (already fetched today): ${skippedCount} cities`);
        }
      } else {
        logError(dataDir, "All URLs failed - no data scraped");
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const stack = error instanceof Error ? error.stack : undefined;
      console.error(`Fatal Error:`, message);
      logError(dataDir, message, stack);
    } finally {
      isTaskRunning = false;
      console.log(`[${new Date().toISOString()}] Task finished.`);
    }
  }

  cron.schedule(cronExpression, performTask, { timezone });
}