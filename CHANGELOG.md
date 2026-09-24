# Changelog

<!--
  Release process: before tagging v<x.y.z>, rename the "Unreleased" heading
  below to "## [<x.y.z>] - <YYYY-MM-DD>". The release workflow extracts the
  section whose heading matches the pushed tag and uses it as the GitHub
  release body. If no matching section exists, the release fails.
-->

## [Unreleased]

### Changed
- **Enable Token Light Tooltip** is saved per user instead of per browser, so it follows a player to any device. A choice saved under the old per-browser setting is not carried over and starts from the default (on).
- All user-facing text is now localizable via `game.i18n` (English `lang/en.json` included).

## [1.0.0] - 2026-02-27

### Added
- Initial release.
