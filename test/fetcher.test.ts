import { extractNextData, parseNextData } from '../src/fetcher';
import type { NextData } from '../src/types';

const sampleNextData: NextData = {
  props: {
    pageProps: {
      searchResult: {
        meta: {
          total_count: 1234,
          new_properties_count: 56
        }
      },
      pageMeta: {
        title: 'Apartments for sale in Dubai',
        aggregationLinks: [
          { name: 'Downtown Dubai', link: '/dubai/downtown', count: 150 },
          { name: 'Marina', link: '/dubai/marina', count: 200 }
        ]
      },
      serpEnrichmentData: {
        data: {
          averagePrices: [
            { location: { n: 'Downtown', en_s: 'downtown-dubai' }, averagePrice: 1500000 },
            { location: { n: 'Marina', en_s: 'marina-dubai' }, averagePrice: 1800000 }
          ]
        }
      }
    }
  }
};

describe('extractNextData', () => {
  it('should extract __NEXT_DATA__ from HTML', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head></head>
        <body>
          <script id="__NEXT_DATA__">${JSON.stringify(sampleNextData)}</script>
        </body>
      </html>
    `;

    const result = extractNextData(html);
    expect(result).not.toBeNull();
    const meta = (result?.props.pageProps.searchResult as { meta: { total_count: number } } | undefined)?.meta;
    expect(meta?.total_count).toBe(1234);
  });

  it('should return null when __NEXT_DATA__ not found', () => {
    const html = '<html><body>No script here</body></html>';
    const result = extractNextData(html);
    expect(result).toBeNull();
  });

  it('should return null for empty HTML', () => {
    const result = extractNextData('');
    expect(result).toBeNull();
  });
});

describe('parseNextData', () => {
  it('should parse all data correctly', () => {
    const result = parseNextData(sampleNextData);

    expect(result.totalListings).toBe(1234);
    expect(result.newPropertiesCount).toBe(56);
    expect(result.areas).toHaveLength(2);
    expect(result.areas[0].name).toBe('Downtown Dubai');
    expect(result.averagePrices).toHaveLength(2);
    expect(result.averagePrices[0].name).toBe('Downtown');
  });

  it('should handle missing searchResult', () => {
    const data: NextData = {
      props: {
        pageProps: {}
      }
    };

    const result = parseNextData(data);
    expect(result.totalListings).toBe(0);
    expect(result.newPropertiesCount).toBe(0);
    expect(result.areas).toHaveLength(0);
    expect(result.averagePrices).toHaveLength(0);
  });

  it('should handle missing aggregationLinks', () => {
    const data: NextData = {
      props: {
        pageProps: {
          searchResult: { meta: { total_count: 100 } },
          pageMeta: {}
        }
      }
    };

    const result = parseNextData(data);
    expect(result.areas).toHaveLength(0);
  });

  it('should handle missing averagePrices', () => {
    const data: NextData = {
      props: {
        pageProps: {
          searchResult: { meta: { total_count: 100 } },
          pageMeta: {},
          serpEnrichmentData: { data: {} }
        }
      }
    };

    const result = parseNextData(data);
    expect(result.averagePrices).toHaveLength(0);
  });
});