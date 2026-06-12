# WeChat Mini Lunar Expedition QA Report

Generated: 2026-06-12T15:17:11.056Z

## Deliverables

- Release project: `/Users/chenyulin/Documents/Codex/2026-06-11/hi-2/outputs/wechat-mini-lunar-expedition-release`
- Release zip: `/Users/chenyulin/Documents/Codex/2026-06-11/hi-2/outputs/wechat-mini-lunar-expedition-release.zip` (13.9 KB)
- Full project zip: `/Users/chenyulin/Documents/Codex/2026-06-11/hi-2/outputs/wechat-mini-lunar-expedition.zip` (26.2 KB)

## Checksums

- `wechat-mini-lunar-expedition-release.zip`: `8c044ec72836daf08791c090a8faef1b6c038d2fb9f3f6c74e66bb453262f482`
- `wechat-mini-lunar-expedition.zip`: `bdd4db04fba42cfa47e5b25a351f26c9349fab037b24b9e814a4ed301e41642e`

## Release File List

- `app.json`
- `game.js`
- `game.json`
- `js/logic.js`
- `pages/index/index.js`
- `pages/index/index.json`
- `pages/index/index.wxml`
- `pages/index/index.wxss`
- `project.config.json`

## Verification Commands

```bash
npm test
npm run doctor
npm run verify:release
npm run qa:report
unzip -t ../wechat-mini-lunar-expedition-release.zip
unzip -t ../wechat-mini-lunar-expedition.zip
```

## Scope

- Native WeChat Mini Game Canvas runtime.
- Complete turn-based exploration and survival management game: 月面远征.
- Different from the previous arcade collection, garden match-3, and tower defense in theme, loop, controls, progression, and systems.
- More complex than the previous three: procedural terrain, fog of war, action points, resource economy, deposits, buildings, tech tree, random events, anomaly AI, repairs, stabilization, and multi-condition victory.
- No npm runtime dependency, no CDN, no remote assets.
- Minimal release package contains only WeChat Mini Game runtime files.

## WeChat DevTools

- WeChat DevTools CLI launched the IDE HTTP service at `http://127.0.0.1:9420`.
- The release project was opened by CLI successfully and returned `✔ open`.

Open command:

```bash
/Applications/wechatwebdevtools.app/Contents/MacOS/cli open --project /Users/chenyulin/Documents/Codex/2026-06-11/hi-2/outputs/wechat-mini-lunar-expedition-release --port 9420 --lang zh
```
