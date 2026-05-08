import * as cheerio from "cheerio";
import type { NextData } from "./types.js";

export async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
  return response.text();
}

export function extractNextData(html: string): NextData | null {
  const $ = cheerio.load(html);
  const scriptContent = $("#__NEXT_DATA__").html();
  if (!scriptContent) return null;
  return JSON.parse(scriptContent) as NextData;
}

export function parseNextData(config: NextData) {
  const pageProps = config.props.pageProps as Record<string, unknown>;
  const searchResult = pageProps.searchResult as Record<string, unknown> | undefined;
  const meta = searchResult?.meta as Record<string, unknown> | undefined;
  const pageMeta = pageProps.pageMeta as Record<string, unknown>;
  const serpData = pageProps.serpEnrichmentData as Record<string, unknown> | undefined;
  const serpData2 = serpData?.data as Record<string, unknown> | undefined;
  const aggLinks = (pageMeta?.aggregationLinks as Array<{ name: string; link: string; count: number }>) || [];
  const avgPrices = (serpData2?.averagePrices as Array<{ location: { n: string; en_s: string }; averagePrice: number }>) || [];

  const totalListings = typeof meta?.total_count === "number" ? meta.total_count : 0;
  const newPropertiesCount = typeof meta?.new_properties_count === "number" ? meta.new_properties_count : 0;

  return {
    totalListings,
    newPropertiesCount,
    areas: aggLinks.map((a) => ({
      name: a.name,
      link: a.link,
      count: a.count,
    })),
    averagePrices: avgPrices.map((p) => ({
      name: p.location.n,
      slug: p.location.en_s,
      averagePrice: p.averagePrice,
    })),
  };
}