import type { CronConfig, IndexData, CityIndexData } from '../src/scheduler-types';

describe('scheduler-types', () => {
  it('should validate CronConfig interface', () => {
    const config: CronConfig = {
      urls: [{ url: 'http://test.com', country: 'UAE', city: 'Dubai' }],
      dataDir: 'data',
      baseGapMinutes: 10,
      varianceMinutes: 5,
      timezone: 'Europe/Warsaw',
      cronExpression: '0 */4 * * *'
    };

    expect(config.urls).toHaveLength(1);
    expect(config.baseGapMinutes).toBe(10);
  });

  it('should validate CityIndexData interface', () => {
    const city: CityIndexData = {
      city: 'Dubai',
      country: 'UAE',
      file: 'dubai.json',
      totalListings: 1234,
      fetchedAt: '2026-05-09T00:00:00Z'
    };

    expect(city.city).toBe('Dubai');
    expect(city.fetchedAt).toBeDefined();
  });

  it('should validate IndexData interface', () => {
    const indexData: IndexData = {
      scrapedAt: '2026-05-09T00:00:00Z',
      cities: [
        { city: 'Dubai', country: 'UAE', file: 'dubai.json', totalListings: 100, fetchedAt: '2026-05-09T00:00:00Z' }
      ]
    };

    expect(indexData.cities).toHaveLength(1);
    expect(indexData.scrapedAt).toBeDefined();
  });
});