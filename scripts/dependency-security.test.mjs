import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));

// Check every locked copy, including nested dependencies, against patched floors.
// Keep these floors aligned with the dependency-security remediation.
const patchedVersions = {
  swiper: '12.1.2',
  'fast-xml-parser': '5.7.0',
  minimatch: '9.0.9',
  axios: '1.21.0',
  multer: '2.5.0',
  rollup: '4.67.5',
  esbuild: '0.25.12',
  '@tootallnate/once': '2.0.1',
  qs: '6.17.1',
};

for (const [name, minimum] of Object.entries(patchedVersions)) {
  test(`${name}: every locked copy meets the patched version floor`, () => {
    const copies = Object.entries(lock.packages)
      .filter(([path]) => path.endsWith(`/node_modules/${name}`) || path === `node_modules/${name}`);
    assert.ok(copies.length > 0, `No locked copies of ${name} found`);
    for (const [path, { version }] of copies) {
      assert.match(version, /^\d+\.\d+\.\d+$/, `${path}: expected a stable version`);
      const actual = version.split('.').map(Number);
      const required = minimum.split('.').map(Number);
      const difference = actual.map((part, index) => part - required[index]).find(part => part !== 0) ?? 0;
      assert.ok(difference >= 0, `${path}: ${version} is older than patched floor ${minimum}`);
    }
  });
}
