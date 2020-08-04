import { decode, encode } from './encoding';
import { CancelledError, getLinesLengthRanges, waitTimeout } from './utils';

export const searchIndexes = async (rawKeywords, rawLog, cancellable) => {
  const PROCESS_ITEMS_SYNC_MIN = 10000;
  const PROCESS_ITEMS_SYNC_MAX = 1000000;
  let processItemsSync = PROCESS_ITEMS_SYNC_MAX;
  const keywords = Array.from(encode(rawKeywords));
  const table = [-1, 0];
  const keywordsLength = keywords.length;
  const fileLength = rawLog.length;
  const maxKeywordsIndex = keywordsLength - 1;
  let keywordsIndex = 0;
  let fileIndex = 0;
  let index = 0;
  let position = 2;
  // Build a table for the search algorithm.
  // This takes O(needleLength) steps.
  let processed = 0;

  while (position < keywordsLength) {
    processed += 1;

    if (processed % processItemsSync === 0) {
      if (cancellable.isCancelled()) {
        throw new CancelledError();
      }

      // eslint-disable-next-line
      await waitTimeout();
    }

    if (keywords[position - 1] === keywords[keywordsIndex]) {
      keywordsIndex += 1;
      table[position] = keywordsIndex;
      position += 1;
    } else if (keywordsIndex > 0) {
      keywordsIndex = table[keywordsIndex];
    } else {
      table[position] = 0;
      position += 1;
    }
  }

  const results = [];

  processItemsSync = Math.max(PROCESS_ITEMS_SYNC_MIN, fileLength / 100);
  processItemsSync = Math.min(PROCESS_ITEMS_SYNC_MAX, processItemsSync);
  processItemsSync = Math.ceil(processItemsSync);

  // Scan the haystack.
  // This takes O(haystackLength) steps.
  while (fileIndex + index < fileLength) {
    processed += 1;

    if (processed % processItemsSync === 0) {
      if (cancellable.isCancelled()) {
        throw new CancelledError();
      }
      // eslint-disable-next-line
      await waitTimeout();
    }

    if (keywords[index] === rawLog[fileIndex + index]) {
      if (index === maxKeywordsIndex) {
        results.push(fileIndex);
      }

      index += 1;
    } else if (table[index] > -1) {
      fileIndex = fileIndex + index - table[index];
      index = table[index];
    } else {
      index = 0;
      fileIndex += 1;
    }
  }

  return results;
};

export const searchLines = async (
  rawKeywords,
  rawLog,
  isCaseInsensitive,
  cancellable
) => {
  let keywords = rawKeywords;
  let log = rawLog;

  if (isCaseInsensitive) {
    keywords = keywords.toLowerCase();
    log = encode(decode(log).toLowerCase());
  }

  const results = await searchIndexes(keywords, log, cancellable);
  const linesRanges = getLinesLengthRanges(log);
  const maxLineRangeIndex = linesRanges.length;
  const maxResultIndex = results.length;
  const resultLines = [];
  let lineRangeIndex = 0;
  let resultIndex = 0;
  let lineRange;
  let result;

  while (lineRangeIndex < maxLineRangeIndex) {
    lineRange = linesRanges[lineRangeIndex];

    while (resultIndex < maxResultIndex) {
      result = results[resultIndex];

      if (result <= lineRange) {
        resultLines.push(lineRangeIndex + 1);
        resultIndex += 1;
      } else {
        break;
      }
    }

    lineRangeIndex += 1;
  }

  return resultLines;
};
