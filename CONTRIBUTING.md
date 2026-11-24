# Contributing to MaintainerKit

Thank you for helping improve MaintainerKit. Contributions should keep the action small, safe, and useful to maintainers.

## Before opening a pull request

- Open an issue for a substantial change so its scope can be discussed.
- Keep the default behavior read-only. Any proposal to write to GitHub must be opt-in, narrowly permissioned, and reviewed as a security-sensitive change.
- Do not add an external AI service, telemetry, or credential collection without a separate, explicit design and documentation review.
- Include tests for new behavior and update the README when user-facing behavior changes.

## Local checks

```sh
npm ci
npm test
npm run build
```

Commit the generated `dist/index.mjs` and `dist/index.mjs.LEGAL.txt` whenever source files or runtime dependencies change. Review the diff to ensure the bundle contains only expected compiled code and dependency notices.

## Pull requests

Describe the problem, explain the change, list tests run, and call out permission or security implications. Keep pull requests focused and avoid including unrelated formatting changes.
