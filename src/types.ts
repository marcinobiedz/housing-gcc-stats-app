export interface NextData {
  props: {
    pageProps: Record<string, unknown>;
  };
}

export interface FetchConfig {
  url: string;
  country: string;
  city: string;
}

export interface ParsedArea {
  name: string;
  link: string;
  count: number;
}

export interface ParsedPrice {
  name: string;
  slug: string;
  averagePrice: number;
}

export interface HousingData {
  country: string;
  city: string;
  url: string;
  scrapedAt: string;
  pageTitle: string;
  totalListings: number;
  newPropertiesCount: number;
  areas: ParsedArea[];
  averagePrices: ParsedPrice[];
}