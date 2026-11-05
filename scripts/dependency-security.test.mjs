import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));

// Check every locked copy, including nested dependencies, against patched floors.
// Keep these floors aligned with the dependency-security remediation.
const patchedVersions = {
  swiper: '12.1.2',
  'fast-xml-parser': '5.7.0',
  minimatch: '11.0.1',
  axios: '1.21.0',
  multer: '2.5.0',
  rollup: '4.67.5',
  esbuild: '0.25.12',
  '@tootallnate/once': '2.0.1',
  qs: '6.17.1',
  'body-parser': '1.20.9',
  'brace-expansion': '5.0.12',
  lodash: '4.18.1',
  uuid: '11.1.1',
  glob: '14.0.2',
};

// These may disappear when a parent switches to a different glob implementation.
const removablePackages = new Set(['glob', 'minimatch', 'brace-expansion']);

for (const [name, minimum] of Object.entries(patchedVersions)) {
  test(`${name}: every locked copy meets the patched version floor`, () => {
    const copies = Object.entries(lock.packages)
      .filter(([path]) => path.endsWith(`/node_modules/${name}`) || path === `node_modules/${name}`);
    if (!removablePackages.has(name)) {
      assert.ok(copies.length > 0, `No locked copies of ${name} found`);
    }
    for (const [path, { version }] of copies) {
      assert.match(version, /^\d+\.\d+\.\d+$/, `${path}: expected a stable version`);
      const actual = version.split('.').map(Number);
      const required = minimum.split('.').map(Number);
      const difference = actual.map((part, index) => part - required[index]).find(part => part !== 0) ?? 0;
      assert.ok(difference >= 0, `${path}: ${version} is older than patched floor ${minimum}`);
    }
  });
}

test('form-data: every locked major uses its patched release', () => {
  const copies = Object.entries(lock.packages)
    .filter(([path]) => path.endsWith('/node_modules/form-data') || path === 'node_modules/form-data');
  assert.ok(copies.length > 0, 'No locked copies of form-data found');
  const minimumByMajor = { 2: 6, 3: 5, 4: 6 };
  for (const [path, { version }] of copies) {
    assert.match(version, /^\d+\.\d+\.\d+$/);
    const [major, minor, patch] = version.split('.').map(Number);
    assert.ok(Object.hasOwn(minimumByMajor, major), `${path}: unverified form-data major ${major}`);
    const requiredMinor = major === 2 ? 5 : 0;
    assert.ok(minor > requiredMinor || (minor === requiredMinor && patch >= minimumByMajor[major]),
      `${path}: vulnerable form-data ${version}`);
  }
});

test('all form-data copies escape untrusted multipart names and filenames', () => {
  const require = createRequire(import.meta.url);
  for (const path of Object.keys(lock.packages).filter(path => path.endsWith('node_modules/form-data'))) {
    const FormData = require(new URL(`../${path}`, import.meta.url).pathname);
    const form = new FormData();
    const untrusted = 'value"\r\nX-Injected: true';
    form.append(untrusted, Buffer.from('content'), { filename: untrusted });
    const body = form.getBuffer().toString();
    assert.ok(body.includes('name="value%22%0D%0AX-Injected: true"'), path);
    assert.ok(body.includes('filename="value%22%0D%0AX-Injected: true"'), path);
    assert.ok(!body.includes('\r\nX-Injected: true'), path);
  }
});

test('UUID consumers retain CommonJS v4 support and reject short v5 buffers', () => {
  const require = createRequire(import.meta.url);
  for (const consumer of ['gaxios', 'teeny-request']) {
    const consumerRequire = createRequire(require.resolve(consumer));
    const uuid = consumerRequire('uuid');
    assert.ok(uuid.validate(uuid.v4()), consumer);
    assert.throws(() => uuid.v5('test', uuid.v5.DNS, new Uint8Array(8), 4), RangeError);
  }
});

test('lodash rejects template import injection', () => {
  const require = createRequire(import.meta.url);
  const lodash = require('lodash');
  assert.throws(() => lodash.template('test', { imports: { 'a = (() => {})()': 1 } }));
});
