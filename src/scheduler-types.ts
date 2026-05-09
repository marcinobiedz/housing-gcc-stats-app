import type { FetchConfig } from "./types.js";

export interface CronConfig {
  urls: FetchConfig[];
  dataDir: string;
  baseGapMinutes: number;
  varianceMinutes: number;
  timezone: string;
  cronExpression: string;
}

export interface CityIndexData {
  city: string;
  country: string;
  file: string;
  totalListings: number;
  fetchedAt?: string;
}

export interface IndexData {
  scrapedAt: string;
  cities: CityIndexData[];
}