"use strict";

var assert = require("assert");
var Logic = require("../js/logic");
var Game = require("../game");

function makeContext() {
  return {
    calls: [],
    fillStyle: "",
    strokeStyle: "",
    font: "",
    lineWidth: 1,
    textAlign: "left",
    textBaseline: "alphabetic",
    beginPath: function () { this.calls.push("beginPath"); },
    closePath: function () { this.calls.push("closePath"); },
    fill: function () { this.calls.push("fill"); },
    stroke: function () { this.calls.push("stroke"); },
    fillRect: function () { this.calls.push("fillRect"); },
    strokeRect: function () { this.calls.push("strokeRect"); },
    rect: function () { this.calls.push("rect"); },
    moveTo: function () { this.calls.push("moveTo"); },
    lineTo: function () { this.calls.push("lineTo"); },
    quadraticCurveTo: function () { this.calls.push("quadraticCurveTo"); },
    arc: function () { this.calls.push("arc"); },
    fillText: function () { this.calls.push("fillText"); },
    measureText: function (text) { return { width: String(text).length * 8 }; },
    createLinearGradient: function () { return { addColorStop: function () {} }; },
    setTransform: function () { this.calls.push("setTransform"); },
    scale: function () { this.calls.push("scale"); }
  };
}

var ctx = makeContext();
var layout = Game.computeLayout(390, 720);
var state = Logic.startGame(2026);
Game.render(ctx, state, layout, "move");
assert.ok(ctx.calls.indexOf("fillRect") !== -1, "render should paint background/grid");
assert.ok(ctx.calls.indexOf("fillText") !== -1, "render should draw labels");
assert.ok(ctx.calls.indexOf("strokeRect") !== -1, "render should draw grid lines");

var cell = Game.gridCellFromPoint(layout, layout.gridX + layout.cell * 1.5, layout.gridY + layout.cell * 8.5);
assert.deepStrictEqual(cell, { x: 1, y: 8 }, "grid hit testing should map to cells");
assert.strictEqual(Game.gridCellFromPoint(layout, layout.gridX - 3, layout.gridY), null, "outside grid should miss");

var firstControl = layout.controls[0];
var control = Game.controlFromPoint(layout, firstControl.x + firstControl.w / 2, firstControl.y + firstControl.h / 2);
assert.strictEqual(control.id, "move", "control hit testing should work");

var mockCtx = makeContext();
var mockCanvas = {
  width: 0,
  height: 0,
  style: {},
  getContext: function () { return mockCtx; }
};
var stored = null;
var mockWx = {
  createCanvas: function () { return mockCanvas; },
  getSystemInfoSync: function () { return { windowWidth: 360, windowHeight: 720, pixelRatio: 2 }; },
  getStorageSync: function () { return stored; },
  setStorageSync: function (key, value) { stored = value; },
  onTouchEnd: function () {},
  onHide: function () {},
  onShow: function () {},
  onWindowResize: function () {}
};

var runtime = Game.createRuntime({ wx: mockWx, canvas: mockCanvas, state: Logic.startGame(1) });
assert.strictEqual(mockCanvas.width, 720, "runtime should scale canvas width");
assert.strictEqual(mockCanvas.height, 1440, "runtime should scale canvas height");
runtime.tap({ x: runtime.layout.gridX + runtime.layout.cell * 1.5, y: runtime.layout.gridY + runtime.layout.cell * 7.5 });
assert.strictEqual(runtime.state.rover.y, 7, "tap adjacent cell should move rover");
runtime.tap({ x: runtime.layout.controls[1].x + 3, y: runtime.layout.controls[1].y + 3 });
assert.strictEqual(runtime.mode, "scan", "scan control should switch mode");

console.log("render contract tests passed");
