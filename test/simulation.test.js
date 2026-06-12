"use strict";

var assert = require("assert");
var Logic = require("../js/logic");

var state = Logic.startGame(2026);
state.resources = { oxygen: 180, power: 180, minerals: 180, data: 120, hull: 100 };
state.rover = { x: 1, y: 7 };
state = Logic.build(state, "solar");
state.ap = state.maxAp;
state.rover = { x: 2, y: 7 };
state.grid[7][2].terrain = "regolith";
state.grid[7][2].building = null;
state = Logic.build(state, "extractor");
state.ap = state.maxAp;
state.rover = { x: 2, y: 8 };
state.grid[8][2].terrain = "regolith";
state.grid[8][2].building = null;
state = Logic.build(state, "relay");
state.ap = state.maxAp;
state.rover = { x: 0, y: 8 };
state.grid[8][0].terrain = "regolith";
state.grid[8][0].building = null;
state = Logic.build(state, "relay");
["drive", "scanner", "drill", "recycler", "shield", "uplink"].forEach(function (tech) {
  state.ap = state.maxAp;
  state = Logic.research(state, tech);
});
assert.strictEqual(state.phase, "won", "built relays plus uplink tech and data should win");

var survey = Logic.startGame(303);
var sawEvent = false;
var sawAnomaly = false;
for (var turn = 0; turn < 12 && survey.phase === "playing"; turn += 1) {
  survey = Logic.scan(survey, survey.rover);
  survey = Logic.endTurn(survey);
  sawEvent = sawEvent || survey.eventLog.some(function (entry) {
    return entry.indexOf("微陨石") >= 0 || entry.indexOf("冷阱") >= 0 || entry.indexOf("深空") >= 0;
  });
  sawAnomaly = sawAnomaly || Logic.getVisibleAnomalies(survey).length > 0 || survey.eventLog.some(function (entry) {
    return entry.indexOf("异常体") >= 0;
  });
}
assert.ok(sawEvent, "long simulation should trigger random events");
assert.ok(survey.sol > 1, "turns should advance");

var doomed = Logic.startGame(404);
doomed.resources.oxygen = 2;
doomed.resources.power = 0;
doomed.resources.hull = 100;
for (var i = 0; i < 5 && doomed.phase === "playing"; i += 1) doomed = Logic.endTurn(doomed);
assert.strictEqual(doomed.phase, "lost", "unmanaged expedition should lose when oxygen runs out");

console.log("simulation tests passed");
