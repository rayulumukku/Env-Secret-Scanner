/**
 * lib/providers/local.js
 *
 * Local provider — handles ZIP archive uploads.
 * Implements the common provider interface.
 */

import { extractZip, isValidZipBuffer, LIMITS } from '../repository/archive.js';

export const LOCAL_PROVIDER = {
  id: 'local',
  name: 'Local Upload',
  description: 'Upload a ZIP archive of your repository',
};

/**
 * Create a local provider instance from a ZIP buffer.
 * @param {Buffer|Uint8Array} zipBuffer
 * @param {string} filename
 * @returns {object} provider instance
 */
export function createLocalProvider(zipBuffer, filename = 'upload.zip') {
  if (!isValidZipBuffer(zipBuffer)) {
    throw new Error('Not a valid ZIP archive.');
  }

  return {
    provider: 'local',
    filename,

    /** Get repository metadata. */
    getRepository() {
      return {
        id: `local_${Date.now()}`,
        name: filename.replace(/\.zip$/i, ''),
        fullName: filename,
        provider: 'local',
        defaultBranch: 'main',
        archiveSize: zipBuffer.length,
      };
    },

    /** Get branches — local archives have no branches. */
    getBranches() {
      return [{ name: 'main', default: true }];
    },

    /** Get the ZIP buffer for scanning. */
    getArchive() {
      return zipBuffer;
    },
  };
}
