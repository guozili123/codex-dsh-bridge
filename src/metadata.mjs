import { readFile } from 'node:fs/promises';

export async function readJsonOnce(pathname) {
  return JSON.parse(await readFile(pathname, 'utf8'));
}

export async function readJsonWithRetry(pathname) {
  try {
    return await readJsonOnce(pathname);
  } catch (firstError) {
    try {
      return await readJsonOnce(pathname);
    } catch {
      throw new Error('DSH is updating; retry shortly', { cause: firstError });
    }
  }
}
