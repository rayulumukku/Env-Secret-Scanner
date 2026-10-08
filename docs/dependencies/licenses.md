# License Intelligence & Compliance

SecretShield detects, normalizes, and classifies open-source licenses to assist legal and compliance audits without asserting unauthorized legal conclusions.

## License Classifications

1. **Permissive**:
   - Licenses with minimal redistribution restrictions (MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, 0BSD, Unlicense).
2. **Copyleft (Strong)**:
   - Licenses requiring reciprocal disclosure of complete modified source code under the same terms (GPL-2.0, GPL-3.0, AGPL-3.0, EUPL-1.2, OSL-3.0).
3. **Weak Copyleft**:
   - Licenses applying reciprocally only to direct modifications of the library itself (LGPL-2.1, LGPL-3.0, MPL-2.0, EPL-2.0, CDDL-1.0).
4. **Proprietary / Unknown**:
   - Custom, commercial, or unrecognized license declarations.
5. **Missing**:
   - Dependencies lacking declared license metadata.

## Factual Compliance Guidance

SecretShield uses non-legal phrasing:
- `"License requires review."` rather than `"This dependency is illegal."`
- Lists specific obligations (source disclosure, copyright notices, attribution) factually.
