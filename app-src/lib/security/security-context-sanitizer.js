export class SecurityContextSanitizer {
  sanitize(input) {
    return this._sanitizeValue(input);
  }

  _sanitizeValue(value) {
    if (value === null || value === undefined) return value;
    if (Array.isArray(value)) return value.map((item) => this._sanitizeValue(item));
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'object') {
      const sanitized = {};
      for (const [key, nestedValue] of Object.entries(value)) {
        if (this._isSensitiveKey(key)) {
          sanitized[key] = this._tokenValueForKey(key);
          continue;
        }
        sanitized[key] = this._sanitizeValue(nestedValue);
      }
      return sanitized;
    }
    if (typeof value === 'string') {
      return this._sanitizeString(value);
    }
    return value;
  }

  _sanitizeString(value) {
    let result = value;
    result = result.replace(/gh[pousr]_[A-Za-z0-9_]{6,}/g, '[REDACTED_SECRET]');
    result = result.replace(/sk_(?:live|test)_[A-Za-z0-9]+/gi, '[REDACTED_SECRET]');
    result = result.replace(/Bearer\s+[A-Za-z0-9._~+\/-]+/gi, '[REDACTED_TOKEN]');
    result = result.replace(/session=\S+/gi, 'session=[REDACTED_TOKEN]');
    result = result.replace(/authorization\s*:\s*['\"]?[^'\"\s]+/gi, 'authorization: [REDACTED_TOKEN]');
    result = result.replace(/(API_KEY|PASSWORD|SECRET|TOKEN|PRIVATE_KEY)\s*[:=]\s*[^\s,;\)\]]+/gi, '$1=[REDACTED_SECRET]');
    result = result.replace(/(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{6,}/g, '[REDACTED_SECRET]');
    return result;
  }

  _isSensitiveKey(key) {
    const lowered = String(key).toLowerCase();
    return /(secret|token|password|passwd|api[_-]?key|authorization|cookie|session|private[_-]?key|jwt|credentials)/i.test(lowered);
  }

  _tokenValueForKey(key) {
    const lowered = String(key).toLowerCase();
    if (/(authorization|token|jwt|session|cookie)/i.test(lowered)) return '[REDACTED_TOKEN]';
    if (/(password|passwd)/i.test(lowered)) return '[REDACTED_PASSWORD]';
    return '[REDACTED_SECRET]';
  }
}

export const securityContextSanitizer = new SecurityContextSanitizer();
