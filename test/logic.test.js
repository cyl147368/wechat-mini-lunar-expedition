"use strict";

var assert = require("assert");
var Logic = require("../js/logic");

var a = Logic.startGame(42);
var b = Logic.startGame(42);
assert.deepStrictEqual(a.grid.map(function (row) { return row.map(function (cell) { return cell.terrain; }); }), b.grid.map(function (row) { return row.map(function (cell) { return cell.terrain; }); }), "map generation should be deterministic");
assert.strictEqual(a.phase, "playing");
assert.strictEqual(a.grid.length, Logic.GRID_SIZE);
assert.ok(a.resources.oxygen > 0 && a.resources.power > 0 && a.resources.hull === 100, "starting resources");
assert.ok(Logic.getCell(a, Logic.BASE).visible, "base starts visible");
assert.ok(a.anomalies.length >= 4, "anomaly system should exist");

var moved = Logic.moveRover(a, { x: 1, y: 7 });
assert.strictEqual(moved.rover.x, 1);
assert.strictEqual(moved.rover.y, 7);
assert.ok(moved.ap < a.ap, "movement spends AP");
assert.ok(Logic.getCell(moved, moved.rover).explored, "movement explores target");

var far = Logic.moveRover(a, { x: 4, y: 4 });
assert.deepStrictEqual(far.rover, a.rover, "cannot move to non-adjacent cell");

var scanned = Logic.scan(a, { x: 4, y: 4 });
assert.ok(scanned.resources.power < a.resources.power, "scan spends power");
assert.ok(scanned.ap < a.ap, "scan spends AP");

var rich = Logic.startGame(7);
rich.rover = { x: 1, y: 7 };
rich.grid[7][1].deposits = { oxygen: 3, power: 2, minerals: 5, data: 4 };
var harvested = Logic.harvest(rich);
assert.ok(harvested.resources.oxygen > rich.resources.oxygen, "harvest gains oxygen");
assert.ok(harvested.resources.minerals > rich.resources.minerals, "harvest gains minerals");
assert.ok(harvested.resources.data > rich.resources.data, "harvest gains data");

var buildState = Logic.startGame(8);
buildState.rover = { x: 1, y: 7 };
buildState.resources = { oxygen: 99, power: 99, minerals: 99, data: 99, hull: 100 };
var built = Logic.build(buildState, "solar");
assert.strictEqual(Logic.getCell(built, { x: 1, y: 7 }).building, "solar", "build should place selected building");
assert.ok(built.resources.minerals < buildState.resources.minerals, "build spends minerals");
var afterIncome = Logic.endTurn(built);
assert.ok(afterIncome.resources.power >= built.resources.power, "solar should produce power");

var techState = Logic.startGame(9);
techState.resources = { oxygen: 99, power: 99, minerals: 99, data: 99, hull: 100 };
var researched = Logic.research(techState, "drive");
assert.strictEqual(researched.tech.drive, true, "research unlocks tech");
assert.ok(researched.maxAp > techState.maxAp, "drive tech increases max AP");

var anomalyState = Logic.startGame(10);
anomalyState.anomalies = [{ id: "test", x: 1, y: 7, hp: 20, maxHp: 20, alert: 0, kind: "echo" }];
var attacked = Logic.endTurn(anomalyState);
assert.ok(attacked.resources.hull < anomalyState.resources.hull, "adjacent anomaly damages hull");
var stable = Logic.stabilize(attacked);
assert.ok(stable.anomalies.length === 0 || stable.anomalies[0].hp < attacked.anomalies[0].hp, "stabilize damages anomaly");

var win = Logic.forceWinReady(Logic.startGame(11));
assert.strictEqual(win.phase, "won", "forceWinReady should satisfy victory");

var lost = Logic.startGame(12);
lost.resources.oxygen = 1;
lost.resources.power = 0;
lost = Logic.endTurn(lost);
assert.strictEqual(lost.phase, "lost", "oxygen exhaustion should lose");

var sanitized = Logic.sanitizeState({ grid: "bad" });
assert.strictEqual(sanitized.grid.length, Logic.GRID_SIZE, "bad state regenerates");

console.log("logic tests passed");
