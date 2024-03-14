import * as fs from 'fs';
import * as path from 'path';

import csvParser from 'csv-parser';
import { parse } from 'yaml';

export interface CsvRow {
  [key: string]: string;
}

/**
 * @returns trimmed key within object.
 *
 * @example
 * Ensures that keys within object are trimmed such as: '  Account:' -> 'Account:'
 *
 * ```
 * const rows = {'  Account': ''};
 * const result = trimObjectKeysValues(rows);
 * console.log(rows) -> {'Account': ''};
 * ```
 *
 * @param { [key: string]: string; } row
 */
export const trimObjectKeysValues = (row: {
  [key: string]: string;
}): {
  [key: string]: string;
} =>
  Object.entries(row).reduce(
    (
      acc: {
        [key: string]: string;
      },
      curr: Readonly<[string, string]>,
    ) => {
      const [key, value] = curr;

      acc[key.trim()] = value.trim();

      return acc;
    },
    {},
  );

/**
 * @returns formatted each row as object within array.
 *
 * @param string filePath
 */
export const readCsv = async (
  filePath: string,
): Promise<{ [key: string]: string }[]> => {
  let results: { [key: string]: string }[] = [];

  const stream = fs
    .createReadStream(path.join(path.resolve(), filePath))
    .pipe(csvParser());

  for await (const chunk of stream) {
    results = [...results, trimObjectKeysValues(chunk)];
  }

  return results;
};

/**
 * @returns parsed CSV using csv-parse.
 *
 * @param string filePath
 */
export const readYaml = async <T>(filePath: string): Promise<T> =>
  parse(await fs.readFileSync(filePath, { encoding: 'utf-8' }));
