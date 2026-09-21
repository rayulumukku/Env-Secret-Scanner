# SecretShield Community Rule Pack

Verified community-contributed rule pack for developer platforms, communication tools, and specialized SaaS services.

- **Pack ID**: `community-rules`
- **Version**: `1.0.0`
- **License**: `MIT`
- **Precedence Tier**: Tier 2 (Community / Ecosystem)

## Contributing Rules

To contribute a new community rule:
1. Create or update a rule JSON entry in `pack.json`.
2. Provide positive and negative synthetic test fixtures (strictly fake samples).
3. Validate with `secretshield rules validate ./pack.json`.
4. Run fixture tests with `secretshield rules test <rule-id>`.
5. Submit a pull request or submit through `/rules/community`.
