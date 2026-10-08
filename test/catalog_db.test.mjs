import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Database Storage & Schema Tests', () => {
  it('ensures medicine_db.json exists and adheres to schema', () => {
    const dbPath = path.join(process.cwd(), 'database', 'medicine_db.json');
    assert.strictEqual(fs.existsSync(dbPath), true, 'database file should exist');

    const content = fs.readFileSync(dbPath, 'utf-8');
    const db = JSON.parse(content);

    assert.ok(Array.isArray(db.scans), 'scans should be an array');
    assert.ok(db.scans.length > 0, 'sample scans should be populated');

    // Verify first scan record structure
    const firstScan = db.scans[0];
    assert.ok(firstScan.id, 'scan must have an id');
    assert.ok(firstScan.medicineName, 'scan must have a medicineName');
    assert.ok(firstScan.status, 'scan must have an expiry status');
    assert.ok(['EXPIRED', 'EXPIRING_SOON', 'VALID'].includes(firstScan.status), 'status must be valid enum');
  });

  it('ensures catalog reference data is valid and non-empty', () => {
    const catalogPath = path.join(process.cwd(), 'src', 'data', 'medicineCatalog.ts');
    assert.strictEqual(fs.existsSync(catalogPath), true, 'catalog file should exist');
    const content = fs.readFileSync(catalogPath, 'utf-8');
    assert.match(content, /Dolo 650/);
    assert.match(content, /Paracetamol/);
    assert.match(content, /Augmentin 625 Duo/);
  });
});
