import { expect, test } from 'vitest';
import { readFileSync } from 'fs';
import { md5 } from 'js-md5';

test('MD5', async () => {
  const data = readFileSync('tests/fixtures/rice1.osu');
  const hash = md5(data.toString());
  expect(hash).toBe('e5231c7b472963bfe96be71e443994ce');
});