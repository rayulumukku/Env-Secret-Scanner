/**
 * @file lib/repository/diff/changed-lines.js
 * @description Extracts and indexes added & modified lines from Git diffs.
 */

import { parseUnifiedDiff } from './parser.js';

/**
 * @typedef {Object} ChangedLineEntry
 * @property {number} line - 1-based line number in the target file
 * @property {string} content - Raw line text
 * @property {'ADD'|'MODIFY'} type
 * @property {string} filePath
 */

/**
 * Extracts all added and modified lines per file with accurate 1-indexed target line numbers.
 * 
 * @param {string|Array} diffInput - Raw diff string or parsed DiffFile array
 * @returns {Map<string, ChangedLineEntry[]>} Map of filePath -> ChangedLineEntry[]
 */
export function getChangedLinesByFile(diffInput) {
  const parsedFiles = Array.isArray(diffInput) ? diffInput : parseUnifiedDiff(diffInput);
  const result = new Map();

  for (const file of parsedFiles) {
    if (file.status === 'DELETED') continue;

    const filePath = file.newPath || file.oldPath;
    const entries = [];

    for (const hunk of file.hunks || []) {
      for (const diffLine of hunk.lines || []) {
        if (diffLine.type === 'ADD') {
          entries.push({
            line: diffLine.newLine,
            content: diffLine.content,
            type: 'ADD',
            filePath
          });
        }
      }
    }

    if (entries.length > 0) {
      result.set(filePath, entries);
    }
  }

  return result;
}

/**
 * Reconstructs the added content of a file as a contiguous or mapped string suitable for scanning.
 * Returns an array of `{ content, lineMap }` objects where `lineMap` maps virtual line numbers back to actual file line numbers.
 * 
 * @param {ChangedLineEntry[]} entries 
 * @returns {{ text: string, lineMap: Map<number, number> }}
 */
export function buildVirtualFileForScan(entries) {
  const lines = [];
  const lineMap = new Map(); // virtual 1-based line -> actual file line

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const virtualLine = i + 1;
    lines.push(entry.content);
    lineMap.set(virtualLine, entry.line);
  }

  return {
    text: lines.join('\n'),
    lineMap
  };
}
