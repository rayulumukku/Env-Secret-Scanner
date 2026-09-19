/**
 * @file lib/repository/diff/parser.js
 * @description Robust Git unified diff parser.
 * 
 * Parses standard unified diff outputs (from `git diff`, `git show`, GitHub PR diffs)
 * into structured file chunks with change types, file paths, line ranges, and line deltas.
 * 
 * SECURITY:
 *   - Diff parser never persists raw secrets.
 *   - All extracted line contents are passed safely to the scanner engine.
 */

/**
 * @typedef {Object} DiffLine
 * @property {'ADD'|'DELETE'|'CONTEXT'} type
 * @property {string} content - Line text (stripped of the leading +/-/space)
 * @property {number} [oldLine] - Line number in the original file
 * @property {number} [newLine] - Line number in the new file
 */

/**
 * @typedef {Object} DiffHunk
 * @property {number} oldStart
 * @property {number} oldLines
 * @property {number} newStart
 * @property {number} newLines
 * @property {string} header
 * @property {DiffLine[]} lines
 */

/**
 * @typedef {Object} DiffFile
 * @property {string} oldPath - Source file path
 * @property {string} newPath - Target file path
 * @property {'ADDED'|'MODIFIED'|'DELETED'|'RENAMED'} status - Change classification
 * @property {DiffHunk[]} hunks - List of parsed diff hunks
 * @property {string[]} addedLines - List of raw added line contents
 * @property {Array<{ line: number, content: string }>} addedLinesWithPositions - Added lines with 1-based target line numbers
 */

/**
 * Parses a raw Git unified diff string into an array of structured DiffFile objects.
 * 
 * @param {string} rawDiff - Unified diff text
 * @returns {DiffFile[]} Array of parsed diff files
 */
export function parseUnifiedDiff(rawDiff) {
  if (!rawDiff || typeof rawDiff !== 'string') {
    return [];
  }

  const files = [];
  const lines = rawDiff.split(/\r?\n/);
  let currentFile = null;
  let currentHunk = null;
  let currentOldLine = 0;
  let currentNewLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // File header start: diff --git a/... b/...
    if (line.startsWith('diff --git ')) {
      if (currentFile) {
        finalizeFile(currentFile);
        files.push(currentFile);
      }

      const match = line.match(/^diff --git a\/(.*) b\/(.*)$/);
      const oldPath = match ? match[1] : '';
      const newPath = match ? match[2] : '';

      currentFile = {
        oldPath,
        newPath,
        status: 'MODIFIED',
        hunks: [],
        addedLines: [],
        addedLinesWithPositions: []
      };
      currentHunk = null;
      continue;
    }

    if (!currentFile) {
      // Look for standalone --- a/ and +++ b/ if diff --git wasn't present
      if (line.startsWith('--- a/') || line.startsWith('--- /dev/null')) {
        currentFile = {
          oldPath: line.startsWith('--- /dev/null') ? '/dev/null' : line.slice(6),
          newPath: '',
          status: line.startsWith('--- /dev/null') ? 'ADDED' : 'MODIFIED',
          hunks: [],
          addedLines: [],
          addedLinesWithPositions: []
        };
        currentHunk = null;
        continue;
      }
      continue;
    }

    // Check status indicators
    if (line.startsWith('new file mode ')) {
      currentFile.status = 'ADDED';
      continue;
    }
    if (line.startsWith('deleted file mode ')) {
      currentFile.status = 'DELETED';
      continue;
    }
    if (line.startsWith('rename from ')) {
      currentFile.oldPath = line.slice(12).trim();
      currentFile.status = 'RENAMED';
      continue;
    }
    if (line.startsWith('rename to ')) {
      currentFile.newPath = line.slice(10).trim();
      currentFile.status = 'RENAMED';
      continue;
    }

    // File header paths: --- a/... and +++ b/...
    if (line.startsWith('--- ')) {
      const p = line.slice(4).trim();
      currentFile.oldPath = p.startsWith('a/') ? p.slice(2) : p;
      if (currentFile.oldPath === '/dev/null') {
        currentFile.status = 'ADDED';
      }
      continue;
    }
    if (line.startsWith('+++ ')) {
      const p = line.slice(4).trim();
      currentFile.newPath = p.startsWith('b/') ? p.slice(2) : p;
      if (currentFile.newPath === '/dev/null') {
        currentFile.status = 'DELETED';
      }
      continue;
    }

    // Hunk header: @@ -oldStart,oldLines +newStart,newLines @@
    if (line.startsWith('@@ ')) {
      const hunkMatch = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)$/);
      if (hunkMatch) {
        const oldStart = parseInt(hunkMatch[1], 10);
        const oldLines = hunkMatch[2] ? parseInt(hunkMatch[2], 10) : 1;
        const newStart = parseInt(hunkMatch[3], 10);
        const newLines = hunkMatch[4] ? parseInt(hunkMatch[4], 10) : 1;

        currentOldLine = oldStart;
        currentNewLine = newStart;

        currentHunk = {
          oldStart,
          oldLines,
          newStart,
          newLines,
          header: line,
          lines: []
        };
        currentFile.hunks.push(currentHunk);
      }
      continue;
    }

    // Hunk body lines
    if (currentHunk) {
      if (line.startsWith('+')) {
        const content = line.slice(1);
        const diffLine = {
          type: 'ADD',
          content,
          newLine: currentNewLine
        };
        currentHunk.lines.push(diffLine);
        currentFile.addedLines.push(content);
        currentFile.addedLinesWithPositions.push({
          line: currentNewLine,
          content
        });
        currentNewLine++;
      } else if (line.startsWith('-')) {
        const content = line.slice(1);
        const diffLine = {
          type: 'DELETE',
          content,
          oldLine: currentOldLine
        };
        currentHunk.lines.push(diffLine);
        currentOldLine++;
      } else if (line.startsWith(' ') || line === '') {
        const content = line.startsWith(' ') ? line.slice(1) : '';
        const diffLine = {
          type: 'CONTEXT',
          content,
          oldLine: currentOldLine,
          newLine: currentNewLine
        };
        currentHunk.lines.push(diffLine);
        currentOldLine++;
        currentNewLine++;
      } else if (line.startsWith('\\ No newline at end of file')) {
        // Ignore git informational line
        continue;
      }
    }
  }

  if (currentFile) {
    finalizeFile(currentFile);
    files.push(currentFile);
  }

  return files;
}

/**
 * Finalizes file metadata before returning.
 * @param {DiffFile} file 
 */
function finalizeFile(file) {
  if (!file.newPath && file.oldPath && file.oldPath !== '/dev/null') {
    file.newPath = file.oldPath;
  }
  if (!file.oldPath && file.newPath && file.newPath !== '/dev/null') {
    file.oldPath = file.newPath;
  }
}
