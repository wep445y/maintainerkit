# MaintainerKit

MaintainerKit is a small, read-only GitHub Action for open-source maintainers. It turns recent repository activity into a weekly triage digest and drafts release notes from pull requests merged during the selected window.

It does not create, close, label, or edit issues or pull requests. It does not publish a release. A maintainer reviews every generated draft and decides what to do next.

## What it does

- Collects issues and pull requests updated during a configurable look-back window.
- Writes a grouped Markdown digest to the GitHub Actions job summary.
- Produces a draft release-notes section from recently merged pull requests, grouped by their first label.
- Exposes both Markdown documents as workflow outputs for reuse in later steps.
- Uses GitHub's API only; no model, external service, or API key is required.

## Quick start

Add a workflow such as `.github/workflows/maintainer-digest.yml`:

```yaml
name: Maintainer digest

on:
  workflow_dispatch:
  schedule:
    - cron: "0 9 * * 1"

permissions:
  issues: read
  pull-requests: read

jobs:
  digest:
    runs-on: ubuntu-latest
    steps:
      - name: Generate digest
        uses: wep445y/maintainerkit@v0.1.0
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          days: "7"
          max-items: "50"
```

Pin the action to a reviewed release tag or, for stricter supply-chain control, to a full commit SHA. The scheduled workflow runs with the repository's permissions and settings; review them before enabling it.

## Inputs

| Input | Required | Default | Description |
| --- | --- | --- | --- |
| `github-token` | Yes | `${{ github.token }}` | Token with read access to Issues and Pull Requests. |
| `repository` | No | `${{ github.repository }}` | Target repository in `owner/repository` form. |
| `days` | No | `7` | Look-back window, from 1 to 365 days. |
| `max-items` | No | `50` | Maximum activity entries shown, from 1 to 200. Counts still report all matching items. |
| `title` | No | `MaintainerKit weekly digest` | Activity digest heading. |

## Outputs

- `digest-markdown`: the activity digest Markdown.
- `release-notes-markdown`: draft notes from pull requests merged during the look-back window.

Both are also written to the GitHub Actions job summary. Release notes are a starting point, not a complete changelog: the action does not infer breaking changes, verify semantic-versioning policy, or publish a release.

## Permissions and privacy

The example workflow grants only read access to issues and pull requests. MaintainerKit does not request repository contents write permission and does not mutate repository data. The token is used by the GitHub Actions runner to read the target repository through GitHub's API. Avoid printing tokens in workflow logs.

## Development

Requirements: Node.js 20 or later and npm.

```sh
npm ci
npm test
npm run build
```

`npm run build` bundles the action entry point into `dist/index.mjs` and writes third-party license notices alongside it. The bundle and notice file are committed so GitHub Actions can run the action without installing dependencies in the consuming repository.

## Current status

This is an early, community-built project. Its current feature set is intentionally narrow. Please report problems with a minimal reproduction and do not include credentials, private issue content, or other sensitive data in public reports.

## License

MIT. See [LICENSE](LICENSE).
