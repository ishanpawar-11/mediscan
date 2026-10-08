import { describe, it } from 'node:test';
import assert from 'node:assert';

// Test expiry calculation logic independently to ensure exact clinical safety
function computeExpiryStatus(expiryStr) {
  if (!expiryStr || expiryStr === 'N/A' || expiryStr.toLowerCase().includes('unknown') || expiryStr.toLowerCase().includes('not visible')) {
    return { status: 'VALID', message: 'Expiry date not clearly legible on packaging. Inspect visually.', normalizedDate: 'N/A' };
  }

  let cleanStr = expiryStr
    .replace(/^(exp|expiry|exp\.?date|use\s*by|best\s*before|valid\s*till|valid\s*upto|bb)[:\s.\-]*/i, '')
    .trim();

  const now = new Date();
  let expDate = null;
  let normalizedDisplay = cleanStr;

  const monthNames = {
    jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
    apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
    aug: 7, august: 7, sep: 8, sept: 8, september: 8,
    oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
  };

  const monYearMatch = cleanStr.match(/([a-zA-Z]{3,9})[\s\/\-\.]+(\d{2,4})/i);
  if (monYearMatch) {
    const mStr = monYearMatch[1].toLowerCase();
    let yStr = monYearMatch[2];
    if (monthNames[mStr] !== undefined) {
      const month = monthNames[mStr];
      if (yStr.length === 2) yStr = '20' + yStr;
      const year = parseInt(yStr, 10);
      if (!isNaN(year) && year > 1990 && year < 2100) {
        expDate = new Date(year, month + 1, 0, 23, 59, 59);
        normalizedDisplay = `${String(month + 1).padStart(2, '0')}/${year}`;
      }
    }
  }

  if (!expDate) {
    const mmYyyyMatch = cleanStr.match(/^(\d{1,2})[\/\-\.](\d{4})$/);
    if (mmYyyyMatch) {
      const month = parseInt(mmYyyyMatch[1], 10);
      const year = parseInt(mmYyyyMatch[2], 10);
      if (month >= 1 && month <= 12 && year > 1990 && year < 2100) {
        expDate = new Date(year, month, 0, 23, 59, 59);
        normalizedDisplay = `${String(month).padStart(2, '0')}/${year}`;
      }
    }
  }

  if (!expDate) {
    const mmYyMatch = cleanStr.match(/^(\d{1,2})[\/\-\.](\d{2})$/);
    if (mmYyMatch) {
      const month = parseInt(mmYyMatch[1], 10);
      const year = parseInt('20' + mmYyMatch[2], 10);
      if (month >= 1 && month <= 12) {
        expDate = new Date(year, month, 0, 23, 59, 59);
        normalizedDisplay = `${String(month).padStart(2, '0')}/${year}`;
      }
    }
  }

  if (!expDate) {
    return { status: 'VALID', message: 'Date format requires clinical inspection.', normalizedDate: cleanStr };
  }

  const diffTime = expDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const monthsAgo = Math.max(1, Math.round(Math.abs(diffDays) / 30));
    return {
      status: 'EXPIRED',
      message: `Expired ${monthsAgo} month${monthsAgo > 1 ? 's' : ''} ago (${normalizedDisplay}). DO NOT CONSUME.`,
      normalizedDate: normalizedDisplay
    };
  }

  if (diffDays <= 60) {
    const monthsLeft = Math.max(1, Math.round(diffDays / 30));
    return {
      status: 'EXPIRING_SOON',
      message: `Expires in ${monthsLeft} month (${normalizedDisplay}). Use soon.`,
      normalizedDate: normalizedDisplay
    };
  }

  const monthsValid = Math.round(diffDays / 30);
  return {
    status: 'VALID',
    message: `Valid for ${monthsValid} months (Expires ${normalizedDisplay})`,
    normalizedDate: normalizedDisplay
  };
}

describe('Pharmaceutical Expiry Calculation Tests', () => {
  it('correctly flags past expired dates as EXPIRED', () => {
    const res = computeExpiryStatus('05/2021');
    assert.strictEqual(res.status, 'EXPIRED');
    assert.match(res.message, /DO NOT CONSUME/);
    assert.strictEqual(res.normalizedDate, '05/2021');
  });

  it('correctly handles prefix stripped dates like EXP 01/2020', () => {
    const res = computeExpiryStatus('EXP 01/2020');
    assert.strictEqual(res.status, 'EXPIRED');
    assert.strictEqual(res.normalizedDate, '01/2020');
  });

  it('correctly handles future dates as VALID', () => {
    const res = computeExpiryStatus('12/2030');
    assert.strictEqual(res.status, 'VALID');
    assert.match(res.message, /Valid for/);
    assert.strictEqual(res.normalizedDate, '12/2030');
  });

  it('correctly parses month-name formats like JUL 2030', () => {
    const res = computeExpiryStatus('JUL 2030');
    assert.strictEqual(res.status, 'VALID');
    assert.strictEqual(res.normalizedDate, '07/2030');
  });

  it('gracefully handles missing or unreadable dates', () => {
    const res = computeExpiryStatus('N/A');
    assert.strictEqual(res.status, 'VALID');
    assert.strictEqual(res.normalizedDate, 'N/A');
  });
});
