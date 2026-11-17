import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Windows retry wrapper for transient filesystem errors (EPERM, EEXIST, EBUSY, ENOTEMPTY)
if (process.platform === 'win32') {
  const isRetryable = (code) =>
    code === 'EPERM' || code === 'EEXIST' || code === 'ENOTEMPTY' || code === 'EBUSY' || code === 'ENOENT';

  const origMkdir = fs.mkdir;
  fs.mkdir = function (path, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    const opts = typeof options === 'object' && options !== null ? { recursive: true, ...options } : { recursive: true };
    let attempt = 0;
    const maxRetries = 30;
    function tryMkdir() {
      origMkdir.call(fs, path, opts, (err) => {
        if (err && isRetryable(err.code) && attempt < maxRetries) {
          attempt++;
          setTimeout(tryMkdir, 25 * attempt);
        } else if (callback) {
          callback(err);
        }
      });
    }
    tryMkdir();
  };

  const origMkdirSync = fs.mkdirSync;
  fs.mkdirSync = function (path, options) {
    const opts = typeof options === 'object' && options !== null ? { recursive: true, ...options } : { recursive: true };
    const maxRetries = 30;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return origMkdirSync.call(fs, path, opts);
      } catch (err) {
        if (isRetryable(err.code) && attempt < maxRetries - 1) {
          const start = Date.now();
          while (Date.now() - start < 25 * (attempt + 1)) {}
        } else {
          throw err;
        }
      }
    }
  };

  const origPromisesMkdir = fs.promises.mkdir;
  fs.promises.mkdir = async function (path, options) {
    const opts = typeof options === 'object' && options !== null ? { recursive: true, ...options } : { recursive: true };
    const maxRetries = 30;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await origPromisesMkdir.call(fs.promises, path, opts);
      } catch (err) {
        if (isRetryable(err.code) && attempt < maxRetries - 1) {
          await new Promise((r) => setTimeout(r, 25 * (attempt + 1)));
        } else {
          throw err;
        }
      }
    }
  };

  const origRmdir = fs.rmdir;
  fs.rmdir = function (path, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    let attempt = 0;
    const maxRetries = 30;
    function tryRmdir() {
      origRmdir.call(fs, path, options, (err) => {
        if (err && isRetryable(err.code) && attempt < maxRetries) {
          attempt++;
          setTimeout(tryRmdir, 25 * attempt);
        } else if (callback) {
          callback(err);
        }
      });
    }
    tryRmdir();
  };

  const origRmdirSync = fs.rmdirSync;
  fs.rmdirSync = function (path, options) {
    const maxRetries = 30;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return origRmdirSync.call(fs, path, options);
      } catch (err) {
        if (isRetryable(err.code) && attempt < maxRetries - 1) {
          const start = Date.now();
          while (Date.now() - start < 25 * (attempt + 1)) {}
        } else {
          throw err;
        }
      }
    }
  };

  const origPromisesRmdir = fs.promises.rmdir;
  fs.promises.rmdir = async function (path, options) {
    const maxRetries = 30;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await origPromisesRmdir.call(fs.promises, path, options);
      } catch (err) {
        if (isRetryable(err.code) && attempt < maxRetries - 1) {
          await new Promise((r) => setTimeout(r, 25 * (attempt + 1)));
        } else {
          throw err;
        }
      }
    }
  };

}

/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data: https:",
      "connect-src 'self' https: data: blob:",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
  ...(isProd
    ? [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
      ]
    : []),
];

const nextConfig = {
  experimental: {
    cpus: 1,
    webpackBuildWorker: false,
    lockDistDir: false,
  },
  webpack(config) {
    return config;
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
