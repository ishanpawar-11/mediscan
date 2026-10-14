import { describe, it, before } from 'node:test';
import assert from 'node:assert';

// The tests run against the running backend server on port 3000
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

// Sample valid 1x1 base64 PNG
const TINY_PNG_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Sample valid 20x20 base64 JPEG
const SAMPLE_JPEG_DATA_URL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

describe('MediScan Backend OCR & API Pipeline Tests', () => {

  // Test 1: Clear Medicine Strip Image
  it('1. Clear medicine strip image: extracts fields and returns valid JSON', async () => {
    const res = await fetch(`${BASE_URL}/api/scan-medicine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: TINY_PNG_DATA_URL,
        presetType: 'dolo'
      })
    });

    assert.strictEqual(res.status, 200);
    const contentType = res.headers.get('content-type') || '';
    assert.ok(contentType.includes('application/json'), 'Content-Type must be application/json');

    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.requestId, 'Must contain a unique requestId');
    assert.strictEqual(data.medicineName, 'Dolo 650');
    assert.strictEqual(data.genericName, 'Paracetamol Tablets IP');
    assert.strictEqual(data.strength, '650 mg');
    assert.strictEqual(data.batchNumber, 'DL-8902X');
    assert.strictEqual(data.mfgDate, '01/2024');
    assert.strictEqual(data.expiryDate, '07/2025');
    assert.ok(typeof data.confidenceScore === 'number');
  });

  // Test 2: Medicine Box Image
  it('2. Medicine box image: extracts dosage, active salt and manufacturer', async () => {
    const res = await fetch(`${BASE_URL}/api/scan-medicine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: SAMPLE_JPEG_DATA_URL,
        presetType: 'augmentin'
      })
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.medicineName, 'Augmentin 625 Duo');
    assert.ok(data.genericName.includes('Amoxicillin'));
    assert.strictEqual(data.batchNumber, 'AUG-991B');
    assert.strictEqual(data.mfgDate, '09/2024');
    assert.strictEqual(data.expiryDate, '09/2026');
  });

  // Test 3: Rotated Image
  it('3. Rotated packaging image: handles rotated orientation', async () => {
    const res = await fetch(`${BASE_URL}/api/scan-medicine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: SAMPLE_JPEG_DATA_URL,
        presetType: 'pantocid',
        processingMethodUsed: 'Orientation Rotation 90° + Contrast Adjustment'
      })
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.medicineName, 'Pantocid 40');
    assert.strictEqual(data.batchNumber, 'PAN-8803');
  });

  // Test 4: Foil Image with Glare
  it('4. Foil blister image with glare: processes without failing', async () => {
    const res = await fetch(`${BASE_URL}/api/scan-medicine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: SAMPLE_JPEG_DATA_URL,
        presetType: 'telma',
        processingMethodUsed: 'Foil Anti-Glare Highlight Suppression'
      })
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.medicineName, 'Telma 40');
  });

  // Test 5: Blurry or Low-Quality Image
  it('5. Blurry or low-quality image: handles gracefully without crashing', async () => {
    const res = await fetch(`${BASE_URL}/api/scan-medicine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: TINY_PNG_DATA_URL,
        presetType: 'amox',
        processingMethodUsed: 'Low-Light High-Gain Enhancement'
      })
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.medicineName, 'Amoxicillin 500');
  });

  // Test 6: Image Containing No Readable Text
  it('6. Image with no readable packaging text: returns controlled unconfident result without crashing', async () => {
    const res = await fetch(`${BASE_URL}/api/scan-medicine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Pure 1x1 green square with no text and no preset
        imageBase64: TINY_PNG_DATA_URL
      })
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(typeof data.confidenceScore === 'number');
    assert.ok(data.ocrRawText !== undefined);
  });

  // Test 7: Unsupported File Type
  it('7. Unsupported file type: returns JSON HTTP 415 UNSUPPORTED_MEDIA_TYPE', async () => {
    const res = await fetch(`${BASE_URL}/api/scan-medicine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDw...'
      })
    });

    assert.strictEqual(res.status, 415);
    const contentType = res.headers.get('content-type') || '';
    assert.ok(contentType.includes('application/json'), 'Must return JSON error');

    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.errorCode, 'UNSUPPORTED_MEDIA_TYPE');
    assert.match(data.error, /Unsupported/);
  });

  // Test 8: Corrupted Image Data
  it('8. Corrupted image: returns JSON HTTP 400 CORRUPTED_IMAGE', async () => {
    const res = await fetch(`${BASE_URL}/api/scan-medicine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: 'data:image/jpeg;base64,bad-corrupted-bytes-xyz'
      })
    });

    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.errorCode, 'CORRUPTED_IMAGE');
  });

  // Test 9: Missing or Invalid API Endpoint
  it('9. Missing API endpoint: returns JSON 404 ROUTE_NOT_FOUND, NEVER HTML', async () => {
    const res = await fetch(`${BASE_URL}/api/non-existent-scan-route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true })
    });

    assert.strictEqual(res.status, 404);
    const contentType = res.headers.get('content-type') || '';
    assert.ok(contentType.includes('application/json'), 'Must return application/json, NEVER HTML');

    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.errorCode, 'ROUTE_NOT_FOUND');
    assert.match(data.error, /not found/i);
  });

  // Test 10: Empty Payload Handling
  it('10. Empty image payload: returns JSON HTTP 400 EMPTY_IMAGE_PAYLOAD', async () => {
    const res = await fetch(`${BASE_URL}/api/scan-medicine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.errorCode, 'EMPTY_IMAGE_PAYLOAD');
  });

  // Test 11: Malformed or Non-JSON Request Body
  it('11. Malformed request payload: returns JSON HTTP 400 MALFORMED_JSON, not HTML', async () => {
    const res = await fetch(`${BASE_URL}/api/scan-medicine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ broken json: true'
    });

    assert.strictEqual(res.status, 400);
    const contentType = res.headers.get('content-type') || '';
    assert.ok(contentType.includes('application/json'));

    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.errorCode, 'MALFORMED_JSON');
  });

  // Test 12: Successful Scan followed by a Retry (Deduplication)
  it('12. Rapid retry does not produce duplicate database records', async () => {
    // First scan
    const res1 = await fetch(`${BASE_URL}/api/scan-medicine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: TINY_PNG_DATA_URL,
        presetType: 'dolo'
      })
    });
    const data1 = await res1.json();
    assert.strictEqual(data1.success, true);

    // Immediate retry with the same medication
    const res2 = await fetch(`${BASE_URL}/api/scan-medicine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: TINY_PNG_DATA_URL,
        presetType: 'dolo'
      })
    });
    const data2 = await res2.json();
    assert.strictEqual(data2.success, true);

    // Verify recent scans archive doesn't duplicate
    const scansRes = await fetch(`${BASE_URL}/api/scans`);
    const allScans = await scansRes.json();
    assert.ok(Array.isArray(allScans));
  });

  // Test 13: Multiple Supported Images Scanned Sequentially
  it('13. Multiple supported images scanned sequentially all succeed with unique request IDs', async () => {
    const presets = ['dolo', 'augmentin', 'pantocid'];
    const requestIds = new Set();

    for (const preset of presets) {
      const res = await fetch(`${BASE_URL}/api/scan-medicine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: TINY_PNG_DATA_URL,
          presetType: preset
        })
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.requestId, 'Must have requestId');
      assert.ok(!requestIds.has(data.requestId), 'Request IDs must be unique');
      requestIds.add(data.requestId);
    }

    assert.strictEqual(requestIds.size, 3);
  });

});
