# WeChat Mini Lunar Expedition QA Report

Generated: 2026-06-13T03:05:10.357Z

## Deliverables

- Release project: `/Users/chenyulin/Documents/Codex/2026-06-11/hi-2/outputs/wechat-mini-lunar-expedition-release`
- Release zip: `/Users/chenyulin/Documents/Codex/2026-06-11/hi-2/outputs/wechat-mini-lunar-expedition-release.zip` (20.1 KB)
- Full project zip: `/Users/chenyulin/Documents/Codex/2026-06-11/hi-2/outputs/wechat-mini-lunar-expedition.zip` (34.8 KB)

## Checksums

- `wechat-mini-lunar-expedition-release.zip`: `2a0ed5c99f87c282404f3fb72683561782cb7682006aa99f5976c90867a2469c`
- `wechat-mini-lunar-expedition.zip`: `179e9c26d9e207f964bfae8e3b39130b4f8ac573a690057dae3db731d0dd0a48`

## Release File List

- `app.json`
- `cloudfunctions/playerState/index.js`
- `cloudfunctions/playerState/package.json`
- `game.js`
- `game.json`
- `js/cloud-config.js`
- `js/cloud-state.js`
- `js/logic.js`
- `js/session-ui.js`
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
