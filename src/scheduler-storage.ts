import * as fs from "fs";
import * as path from "path";
import type { IndexData, CityIndexData } from "./scheduler-types.js";
import type { HousingData } from "./types.js";

export function getDateFolder(): string {
  return new Date().toISOString().split("T")[0];
}

export function ensureFolder(dataDir: string): string {
  const folderPath = path.join(dataDir, getDateFolder());
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  return folderPath;
}

export function readIndexFile(dataDir: string): IndexData | null {
  const folderPath = ensureFolder(dataDir);
  const indexPath = path.join(folderPath, "index.json");
  if (!fs.existsSync(indexPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(indexPath, "utf-8")) as IndexData;
  } catch {
    return null;
  }
}

export function saveIndexFile(dataDir: string, indexData: IndexData): void {
  const folderPath = ensureFolder(dataDir);
  fs.writeFileSync(path.join(folderPath, "index.json"), JSON.stringify(indexData, null, 2));
}

export function saveCityData(dataDir: string, data: HousingData): void {
  const folderPath = ensureFolder(dataDir);
  const fileName = `${data.city.toLowerCase().replace(/\s+/g, "-")}.json`;
  fs.writeFileSync(path.join(folderPath, fileName), JSON.stringify(data, null, 2));
}

export function logError(dataDir: string, message: string, stack?: string): void {
  const folderPath = ensureFolder(dataDir);
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ERROR: ${message}${stack ? `\n${stack}` : ""}\n\n`;
  fs.appendFileSync(path.join(folderPath, "error.log"), logEntry);
  console.log(`Error saved to ${folderPath}/error.log`);
}