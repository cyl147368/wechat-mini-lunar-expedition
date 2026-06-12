"use strict";

var childProcess = require("child_process");
var fs = require("fs");
var path = require("path");

var root = path.resolve(__dirname, "..");
var outputRoot = path.resolve(root, "..");
var releaseDir = path.join(outputRoot, "wechat-mini-lunar-expedition-release");
var releaseZip = path.join(outputRoot, "wechat-mini-lunar-expedition-release.zip");
var fullZip = path.join(outputRoot, "wechat-mini-lunar-expedition.zip");

var expectedReleaseFiles = [
  "game.js",
  "game.json",
  "js/logic.js",
  "project.config.json"
];

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function walk(dir, base, files) {
  fs.readdirSync(dir).forEach(function (name) {
    var full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, base, files);
    else files.push(path.relative(base, full).replace(/\\/g, "/"));
  });
}

function assertZip(file) {
  childProcess.execFileSync("unzip", ["-t", file], { stdio: "pipe" });
}

if (!fs.existsSync(releaseDir)) fail("release directory missing");
if (!fs.existsSync(releaseZip)) fail("release zip missing");
if (!fs.existsSync(fullZip)) fail("full zip missing");

var files = [];
walk(releaseDir, releaseDir, files);
files.sort();
if (files.join("\n") !== expectedReleaseFiles.join("\n")) {
  fail("unexpected release files:\n" + files.join("\n"));
}

var project = readJson(path.join(releaseDir, "project.config.json"));
if (project.compileType !== "game") fail("compileType must be game");
if (project.appid !== "touristappid") fail("release appid must be touristappid");
if (project.setting && project.setting.packNpmManually) fail("release should not require npm packing");

var game = readJson(path.join(releaseDir, "game.json"));
if (game.deviceOrientation !== "portrait") fail("game must be portrait");

var source = fs.readFileSync(path.join(releaseDir, "game.js"), "utf8");
var logicSource = fs.readFileSync(path.join(releaseDir, "js/logic.js"), "utf8");
if (source.indexOf("月面远征") === -1) fail("new lunar identity missing");
["霓虹贪吃蛇", "合成 2048", "极速躲避", "花房订单", "星港防线", "wechat-mini-arcade", "wechat-mini-garden-match", "wechat-mini-star-defense"].forEach(function (oldText) {
  if (source.indexOf(oldText) !== -1 || logicSource.indexOf(oldText) !== -1) fail("old project content leaked: " + oldText);
});

var logic = require(path.join(releaseDir, "js/logic.js"));
if (Object.keys(logic.TERRAIN).length < 9) fail("expected at least nine terrain types");
if (Object.keys(logic.BUILDINGS).length < 5) fail("expected at least five building types");
if (Object.keys(logic.TECHS).length < 6) fail("expected at least six techs");
var state = logic.startGame(123);
if (state.grid.length !== logic.GRID_SIZE) fail("grid size mismatch");
state = logic.scan(state, state.rover);
state = logic.moveRover(state, { x: 1, y: 7 });
state = logic.harvest(state);
if (!state.eventLog.length) fail("event log missing");
if (!state.anomalies.length) fail("expected anomaly system");

assertZip(releaseZip);
assertZip(fullZip);

console.log("doctor checks passed");
console.log("release project:", releaseDir);
console.log("release zip:", releaseZip);
console.log("open command:");
console.log("/Applications/wechatwebdevtools.app/Contents/MacOS/cli open --project " + releaseDir + " --port 9420 --lang zh");
