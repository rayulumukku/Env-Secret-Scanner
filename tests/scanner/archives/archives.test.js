import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { zipSync, strToU8 } from '../../../app-src/node_modules/fflate/esm/index.mjs';
import { extractZip, normalizePath, isValidZipBuffer } from '../../../app-src/lib/repository/archive.js';

describe('Scanner Regression Suite: Secure Archive Processing', () => {
  it('safely extracts standard ZIP archive in memory', () => {
    const files = {
      'src/index.js': strToU8('const port = 3000;'),
      'src/.env': strToU8('API_KEY=AKIAIOSFODNN7EXAMPLE'),
    };
    const zipBuffer = zipSync(files);

    assert.equal(isValidZipBuffer(zipBuffer), true);

    const extracted = extractZip(zipBuffer);
    assert.equal(extracted.files.length, 2);
    assert.ok(extracted.files.some(f => f.name === 'src/.env'));
    assert.equal(extracted.errors.length, 0);
  });

  it('prevents Zip Slip path traversal attempts', () => {
    assert.equal(normalizePath('../../../etc/passwd'), null);
    assert.equal(normalizePath('src/../../sensitive.txt'), null);
    assert.equal(normalizePath('/absolute/path.js'), null);
  });
});
