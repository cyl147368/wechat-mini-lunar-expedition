# 月面远征

一个原生微信小游戏 Canvas 项目。玩法是回合制月面探索和生存管理：玩家驾驶月面车探索程序地图，管理氧气、电力、矿物、数据和车体耐久，建造设施、研究科技、处理异常体，并完成通信中继和上行链路目标。

## 复杂系统

- 10 x 10 程序月面地图，包含月壤、玄武岩、山脊、陨坑、冰脉、残骸、遗迹、热泉、裂谷等地形。
- 雾区探索、扫描、行动点、移动消耗、资源采集、回合维护。
- 5 类设施：太阳阵列、采掘站、分析舱、生命舱、通信中继。
- 6 项科技：低重力履带、广域光谱仪、深层钻头、闭环制氧、磁盾穹顶、量子上行链路。
- 异常体追踪与冲击、稳定异常体、随机事件、建筑产出、维修和胜负条件。

## 玩法

- 点相邻格移动月面车。
- 点“扫描”后再点地图格进行区域扫描。
- 点“采集”获取当前格资源。
- 点“设施”切换建筑类型，点“建造”在当前位置建造。
- 点“科技”切换研究方向，点“研究”消耗数据/矿物解锁科技。
- 点“稳定”处理相邻异常体，点“结束”进入下一日。

## 打开

在仓库根目录运行：

```bash
npm run build:release
npm run open:devtools
```

也可以手动导入构建后的 sibling release 目录：

```text
../wechat-mini-lunar-expedition-release
```

## 微信登录与云存档

- 将 `project.config.json` 里的 `appid` 从 `touristappid` 改成你的真实小游戏 AppID；游客号只能离线体验，不能使用云开发。
- 在微信开发者工具开通云开发并创建环境，把环境 ID 填入 `js/cloud-config.js` 的 `envId`。
- 上传部署 `cloudfunctions/playerState` 云函数，并在云端安装 `wx-server-sdk`。
- 创建 `game_player_state` 数据库集合，权限建议设为“仅创建者可读写”。
- 画面右上角的“微信登录/离线存档”入口由用户点击触发 `wx.getUserProfile`，云函数使用 `getWXContext().OPENID` 隔离用户存档；`wx.login` code 会随云请求上送，云端只保存摘要。
- 如果 AppID、env 或云函数未配置，画面会显示“离线存档”，进度只保存在本机，不再静默伪装成联网。

## 验证

```bash
npm test
npm run doctor
npm run verify:release
npm run qa:report
unzip -t ../wechat-mini-lunar-expedition-release.zip
unzip -t ../wechat-mini-lunar-expedition.zip
```

验证记录见 `QA.md`。
