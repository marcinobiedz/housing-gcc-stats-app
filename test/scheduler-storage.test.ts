import * as fs from 'fs';
import * as path from 'path';
import { getDateFolder } from '../src/scheduler-storage';

describe('getDateFolder', () => {
  it('should return current date in YYYY-MM-DD format', () => {
    const result = getDateFolder();
    const today = new Date().toISOString().split('T')[0];
    expect(result).toBe(today);
  });
});

describe('scheduler-storage (integration)', () => {
  const testDataDir = path.join(__dirname, '../test-data-temp');

  afterAll(() => {
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  it('should create folder structure', () => {
    const { ensureFolder } = require('../src/scheduler-storage');
    const folder = ensureFolder(testDataDir);
    expect(fs.existsSync(folder)).toBe(true);
  });
});