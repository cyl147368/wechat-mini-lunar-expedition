"use strict";

var Logic = require("./js/logic");

var STORAGE_KEY = "wechat-mini-lunar-expedition-state-v1";
var PI2 = Math.PI * 2;

var CONTROL_DEFS = [
  { id: "move", label: "移动" },
  { id: "scan", label: "扫描" },
  { id: "harvest", label: "采集" },
  { id: "build", label: "建造" },
  { id: "buildNext", label: "设施" },
  { id: "research", label: "研究" },
  { id: "techNext", label: "科技" },
  { id: "repair", label: "维修" },
  { id: "stabilize", label: "稳定" },
  { id: "end", label: "结束" }
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getWx() {
  return typeof wx !== "undefined" ? wx : null;
}

function safe(fn, fallback) {
  try {
    return fn();
  } catch (err) {
    return fallback;
  }
}

function getSystemInfo(wxApi) {
  var info = wxApi && wxApi.getSystemInfoSync ? safe(function () {
    return wxApi.getSystemInfoSync();
  }, null) : null;
  info = info || {};
  return {
    width: clamp(Number(info.windowWidth) || 390, 280, 1200),
    height: clamp(Number(info.windowHeight) || 720, 420, 1600),
    dpr: clamp(Number(info.pixelRatio) || 1, 1, 4)
  };
}

function createCanvas(wxApi) {
  if (wxApi && wxApi.createCanvas) return wxApi.createCanvas();
  if (typeof document !== "undefined" && document.createElement) {
    var canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
    return canvas;
  }
  return { width: 390, height: 720, getContext: function () { return null; } };
}

function call(ctx, name, args) {
  if (ctx && typeof ctx[name] === "function") return ctx[name].apply(ctx, args || []);
  return undefined;
}

function roundedRect(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  call(ctx, "beginPath");
  if (ctx && typeof ctx.moveTo === "function" && typeof ctx.lineTo === "function" && typeof ctx.quadraticCurveTo === "function") {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
  } else {
    call(ctx, "rect", [x, y, w, h]);
  }
  call(ctx, "closePath");
}

function fillRound(ctx, x, y, w, h, r, color) {
  ctx.fillStyle = color;
  roundedRect(ctx, x, y, w, h, r);
  call(ctx, "fill");
}

function strokeRound(ctx, x, y, w, h, r, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width || 1;
  roundedRect(ctx, x, y, w, h, r);
  call(ctx, "stroke");
}

function circle(ctx, x, y, radius, color) {
  ctx.fillStyle = color;
  call(ctx, "beginPath");
  if (ctx && typeof ctx.arc === "function") ctx.arc(x, y, radius, 0, PI2);
  else call(ctx, "rect", [x - radius, y - radius, radius * 2, radius * 2]);
  call(ctx, "fill");
}

function strokeCircle(ctx, x, y, radius, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width || 1;
  call(ctx, "beginPath");
  if (ctx && typeof ctx.arc === "function") ctx.arc(x, y, radius, 0, PI2);
  else call(ctx, "rect", [x - radius, y - radius, radius * 2, radius * 2]);
  call(ctx, "stroke");
}

function setFont(ctx, size, weight) {
  ctx.font = (weight ? weight + " " : "") + Math.round(size) + "px sans-serif";
}

function measure(ctx, text) {
  if (ctx && typeof ctx.measureText === "function") return ctx.measureText(String(text)).width;
  return String(text).length * 8;
}

function drawText(ctx, text, x, y, options) {
  options = options || {};
  var size = options.size || 14;
  var minSize = options.minSize || 9;
  setFont(ctx, size, options.weight || "600");
  while (size > minSize && measure(ctx, text) > (options.maxWidth || 9999)) {
    size -= 1;
    setFont(ctx, size, options.weight || "600");
  }
  ctx.fillStyle = options.color || "#EDF2F2";
  ctx.textAlign = options.align || "left";
  ctx.textBaseline = options.baseline || "middle";
  call(ctx, "fillText", [String(text), x, y]);
}

function makeBackground(ctx, width, height) {
  var gradient = ctx && typeof ctx.createLinearGradient === "function" ? ctx.createLinearGradient(0, 0, width, height) : null;
  if (gradient && gradient.addColorStop) {
    gradient.addColorStop(0, "#111827");
    gradient.addColorStop(0.5, "#263442");
    gradient.addColorStop(1, "#5C5648");
    return gradient;
  }
  return "#1B2430";
}

function computeLayout(width, height) {
  var pad = clamp(width * 0.04, 12, 22);
  var headerH = clamp(height * 0.14, 84, 112);
  var footerH = clamp(height * 0.25, 156, 202);
  var availableH = height - headerH - footerH - pad;
  var gridSize = Math.min(width - pad * 2, availableH);
  gridSize = clamp(gridSize, 250, 520);
  var gridX = (width - gridSize) / 2;
  var gridY = headerH + Math.max(4, (availableH - gridSize) / 2);
  var cell = gridSize / Logic.GRID_SIZE;
  var footerY = gridY + gridSize + clamp(height * 0.018, 8, 15);
  var gap = 7;
  var controlW = (width - pad * 2 - gap * 4) / 5;
  var controlH = clamp(footerH * 0.25, 36, 48);
  var controls = CONTROL_DEFS.map(function (control, i) {
    var row = Math.floor(i / 5);
    var col = i % 5;
    return {
      id: control.id,
      label: control.label,
      x: pad + col * (controlW + gap),
      y: footerY + row * (controlH + 9),
      w: controlW,
      h: controlH
    };
  });
  return { width: width, height: height, pad: pad, headerH: headerH, gridX: gridX, gridY: gridY, gridSize: gridSize, cell: cell, footerY: footerY, controls: controls };
}

function pointInRect(point, rect) {
  return point.x >= rect.x && point.y >= rect.y && point.x <= rect.x + rect.w && point.y <= rect.y + rect.h;
}

function gridCellFromPoint(layout, x, y) {
  if (x < layout.gridX || y < layout.gridY || x >= layout.gridX + layout.gridSize || y >= layout.gridY + layout.gridSize) return null;
  return {
    x: Math.floor((x - layout.gridX) / layout.cell),
    y: Math.floor((y - layout.gridY) / layout.cell)
  };
}

function controlFromPoint(layout, x, y) {
  var point = { x: x, y: y };
  for (var i = 0; i < layout.controls.length; i += 1) {
    if (pointInRect(point, layout.controls[i])) return layout.controls[i];
  }
  return null;
}

function screenCell(layout, cell) {
  return {
    x: layout.gridX + cell.x * layout.cell,
    y: layout.gridY + cell.y * layout.cell
  };
}

function drawHeader(ctx, state, layout) {
  drawText(ctx, "月面远征", layout.pad, 26, { size: 25, weight: "800", color: "#F4E6B2", maxWidth: layout.width * 0.42 });
  drawText(ctx, "第 " + state.sol + " 日 · AP " + state.ap + "/" + state.maxAp, layout.pad, 55, {
    size: 13,
    weight: "500",
    color: "#B7C5CA",
    maxWidth: layout.width * 0.42
  });

  var chipW = (layout.width - layout.pad * 2 - 12) / 3;
  var top = 12;
  var left = layout.width - layout.pad - chipW * 1.65;
  var chips = [
    "氧 " + state.resources.oxygen,
    "电 " + state.resources.power,
    "矿 " + state.resources.minerals,
    "数 " + state.resources.data,
    "甲 " + state.resources.hull,
    "中继 " + state.objective.relays + "/2"
  ];
  chips.forEach(function (text, i) {
    var col = i % 3;
    var row = Math.floor(i / 3);
    var x = layout.pad + col * (chipW + 6);
    var y = top + row * 28;
    fillRound(ctx, x, y, chipW, 22, 7, i === 4 && state.resources.hull < 35 ? "rgba(255,105,105,0.26)" : "rgba(255,255,255,0.10)");
    drawText(ctx, text, x + chipW / 2, y + 11, {
      size: 11,
      minSize: 8,
      align: "center",
      color: i === 4 && state.resources.hull < 35 ? "#FFD0C7" : "#EDF2F2",
      maxWidth: chipW - 8
    });
  });

  drawText(ctx, state.message || "", layout.pad, layout.headerH - 15, {
    size: 12,
    weight: "500",
    color: "#F4E6B2",
    maxWidth: layout.width - layout.pad * 2
  });
}

function drawGrid(ctx, state, layout) {
  fillRound(ctx, layout.gridX - 8, layout.gridY - 8, layout.gridSize + 16, layout.gridSize + 16, 8, "rgba(8,14,20,0.74)");
  strokeRound(ctx, layout.gridX - 8, layout.gridY - 8, layout.gridSize + 16, layout.gridSize + 16, 8, "rgba(186,212,218,0.35)", 1.5);
  for (var y = 0; y < Logic.GRID_SIZE; y += 1) {
    for (var x = 0; x < Logic.GRID_SIZE; x += 1) {
      var cell = state.grid[y][x];
      var p = screenCell(layout, cell);
      var terrain = Logic.TERRAIN[cell.terrain] || Logic.TERRAIN.regolith;
      var color = cell.explored ? terrain.color : "#111820";
      ctx.fillStyle = cell.visible ? color : "rgba(23,29,38,0.92)";
      call(ctx, "fillRect", [p.x + 1, p.y + 1, layout.cell - 2, layout.cell - 2]);
      ctx.strokeStyle = "rgba(255,255,255,0.10)";
      ctx.lineWidth = 1;
      call(ctx, "strokeRect", [p.x + 0.5, p.y + 0.5, layout.cell - 1, layout.cell - 1]);

      if (cell.explored && cell.deposits) {
        var dots = [];
        if (cell.deposits.oxygen) dots.push("#BDEFFF");
        if (cell.deposits.power) dots.push("#FFD87A");
        if (cell.deposits.minerals) dots.push("#D9D1C2");
        if (cell.deposits.data) dots.push("#D5B8FF");
        dots.slice(0, 4).forEach(function (dot, i) {
          circle(ctx, p.x + 7 + i * 5, p.y + layout.cell - 7, 2, dot);
        });
      }

      if (cell.building) {
        fillRound(ctx, p.x + layout.cell * 0.2, p.y + layout.cell * 0.2, layout.cell * 0.6, layout.cell * 0.6, 5, cell.building === "base" ? "#F4E6B2" : "#8EE6D1");
        drawText(ctx, cell.building === "base" ? "B" : cell.building.charAt(0).toUpperCase(), p.x + layout.cell / 2, p.y + layout.cell / 2 + 1, {
          size: layout.cell * 0.28,
          minSize: 8,
          align: "center",
          color: "#15202A",
          maxWidth: layout.cell
        });
      }
    }
  }
}

function drawRover(ctx, state, layout) {
  var p = screenCell(layout, state.rover);
  var cx = p.x + layout.cell / 2;
  var cy = p.y + layout.cell / 2;
  circle(ctx, cx, cy, layout.cell * 0.27, "#F4E6B2");
  strokeCircle(ctx, cx, cy, layout.cell * 0.31, "#FFFFFF", 2);
  drawText(ctx, "R", cx, cy + 1, { size: layout.cell * 0.32, align: "center", color: "#15202A", maxWidth: layout.cell });
}

function drawAnomalies(ctx, state, layout) {
  Logic.getVisibleAnomalies(state).forEach(function (anomaly) {
    var p = screenCell(layout, anomaly);
    var cx = p.x + layout.cell / 2;
    var cy = p.y + layout.cell / 2;
    circle(ctx, cx, cy, layout.cell * 0.22, anomaly.kind === "crawler" ? "#FF8C7C" : "#C7A6FF");
    strokeCircle(ctx, cx, cy, layout.cell * 0.28, "rgba(255,255,255,0.62)", 1.5);
    drawText(ctx, "!", cx, cy + 1, { size: layout.cell * 0.28, align: "center", color: "#1A1720", maxWidth: layout.cell });
  });
}

function drawControls(ctx, state, layout, mode) {
  layout.controls.forEach(function (button) {
    var label = button.label;
    if (button.id === "build") label = (Logic.BUILDINGS[state.selectedBuild] || {}).label || "建造";
    if (button.id === "research") label = (Logic.TECHS[state.selectedTech] || {}).label || "研究";
    var active = button.id === mode || (button.id === "scan" && mode === "scan");
    fillRound(ctx, button.x, button.y, button.w, button.h, 7, active ? "rgba(244,230,178,0.24)" : "rgba(255,255,255,0.10)");
    strokeRound(ctx, button.x, button.y, button.w, button.h, 7, active ? "#F4E6B2" : "rgba(186,212,218,0.34)", 1.3);
    drawText(ctx, label, button.x + button.w / 2, button.y + button.h / 2, {
      size: 11,
      minSize: 8,
      align: "center",
      color: "#EDF2F2",
      maxWidth: button.w - 8
    });
  });

  var goal = state.objective.launchReady ? "上行链路完成" : "目标：2 中继 + 24 数据 + 上行链路科技";
  drawText(ctx, goal, layout.pad, layout.footerY + 2 * (layout.controls[0].h + 9) + 15, {
    size: 11,
    minSize: 8,
    color: "#B7C5CA",
    maxWidth: layout.width - layout.pad * 2
  });
}

function drawOverlay(ctx, state, layout) {
  if (state.phase !== "won" && state.phase !== "lost") return;
  var w = layout.width - layout.pad * 2;
  var h = 116;
  var x = layout.pad;
  var y = layout.gridY + layout.gridSize / 2 - h / 2;
  fillRound(ctx, x, y, w, h, 8, "rgba(12,18,24,0.94)");
  strokeRound(ctx, x, y, w, h, 8, state.phase === "won" ? "#A4F0C4" : "#FF8C7C", 2);
  drawText(ctx, state.phase === "won" ? "远征成功" : "远征失败", layout.width / 2, y + 38, {
    size: 25,
    weight: "800",
    align: "center",
    color: "#F4E6B2",
    maxWidth: w - 24
  });
  drawText(ctx, "点“结束”按钮可重新开始", layout.width / 2, y + 76, {
    size: 13,
    align: "center",
    color: "#B7C5CA",
    maxWidth: w - 24
  });
}

function render(ctx, state, layout, mode) {
  ctx.fillStyle = makeBackground(ctx, layout.width, layout.height);
  call(ctx, "fillRect", [0, 0, layout.width, layout.height]);
  drawHeader(ctx, state, layout);
  drawGrid(ctx, state, layout);
  drawAnomalies(ctx, state, layout);
  drawRover(ctx, state, layout);
  drawControls(ctx, state, layout, mode || "move");
  drawOverlay(ctx, state, layout);
}

function extractTouch(event) {
  var touch = event && event.changedTouches && event.changedTouches[0] || event && event.touches && event.touches[0] || event;
  if (!touch) return null;
  var x = Number(touch.clientX);
  var y = Number(touch.clientY);
  if (!isFinite(x) || !isFinite(y)) return null;
  return { x: x, y: y };
}

function saveState(wxApi, state) {
  if (!wxApi || !wxApi.setStorageSync) return;
  safe(function () { wxApi.setStorageSync(STORAGE_KEY, state); }, null);
}

function loadState(wxApi) {
  if (!wxApi || !wxApi.getStorageSync) return Logic.startGame(Date.now());
  var stored = safe(function () { return wxApi.getStorageSync(STORAGE_KEY); }, null);
  return stored ? Logic.sanitizeState(stored) : Logic.startGame(Date.now());
}

function createRuntime(options) {
  options = options || {};
  var wxApi = options.wx || getWx();
  var canvas = options.canvas || createCanvas(wxApi);
  var ctx = canvas.getContext && canvas.getContext("2d");
  var system = getSystemInfo(wxApi);
  var runtime = {
    wx: wxApi,
    canvas: canvas,
    ctx: ctx,
    state: options.state ? Logic.sanitizeState(options.state) : loadState(wxApi),
    layout: computeLayout(system.width, system.height),
    mode: "move"
  };

  function resize() {
    system = getSystemInfo(wxApi);
    canvas.width = Math.floor(system.width * system.dpr);
    canvas.height = Math.floor(system.height * system.dpr);
    if (canvas.style) {
      canvas.style.width = system.width + "px";
      canvas.style.height = system.height + "px";
    }
    ctx = canvas.getContext && canvas.getContext("2d");
    runtime.ctx = ctx;
    if (ctx && typeof ctx.setTransform === "function") ctx.setTransform(system.dpr, 0, 0, system.dpr, 0, 0);
    else if (ctx && typeof ctx.scale === "function") ctx.scale(system.dpr, system.dpr);
    runtime.layout = computeLayout(system.width, system.height);
  }

  function redraw() {
    if (runtime.ctx) render(runtime.ctx, runtime.state, runtime.layout, runtime.mode);
  }

  function commit(nextState) {
    runtime.state = Logic.sanitizeState(nextState);
    saveState(wxApi, runtime.state);
    redraw();
  }

  function control(control) {
    if (control.id === "move") runtime.mode = "move";
    else if (control.id === "scan") runtime.mode = "scan";
    else if (control.id === "harvest") commit(Logic.harvest(runtime.state));
    else if (control.id === "build") commit(Logic.build(runtime.state, runtime.state.selectedBuild));
    else if (control.id === "buildNext") commit(Logic.cycleBuild(runtime.state));
    else if (control.id === "research") commit(Logic.research(runtime.state, runtime.state.selectedTech));
    else if (control.id === "techNext") {
      var idx = Logic.TECH_ORDER.indexOf(runtime.state.selectedTech);
      var tech = Logic.TECH_ORDER[(idx + 1 + Logic.TECH_ORDER.length) % Logic.TECH_ORDER.length];
      commit(Logic.selectTech(runtime.state, tech));
    } else if (control.id === "repair") commit(Logic.repair(runtime.state));
    else if (control.id === "stabilize") commit(Logic.stabilize(runtime.state));
    else if (control.id === "end") {
      if (runtime.state.phase === "won" || runtime.state.phase === "lost") commit(Logic.startGame(Date.now()));
      else commit(Logic.endTurn(runtime.state));
    }
    redraw();
  }

  function tap(point) {
    var hitControl = controlFromPoint(runtime.layout, point.x, point.y);
    if (hitControl) {
      control(hitControl);
      return;
    }
    var cell = gridCellFromPoint(runtime.layout, point.x, point.y);
    if (!cell) return;
    if (runtime.mode === "scan") commit(Logic.scan(runtime.state, cell));
    else commit(Logic.moveRover(runtime.state, cell));
  }

  function onTouchEnd(event) {
    var point = extractTouch(event);
    if (point) tap(point);
  }

  function bind() {
    if (wxApi && wxApi.onTouchEnd) wxApi.onTouchEnd(onTouchEnd);
    else if (canvas && canvas.addEventListener) canvas.addEventListener("pointerup", onTouchEnd);
    if (wxApi && wxApi.onHide) wxApi.onHide(function () { saveState(wxApi, runtime.state); });
    if (wxApi && wxApi.onShow) wxApi.onShow(function () { runtime.state = loadState(wxApi); redraw(); });
    if (wxApi && wxApi.onWindowResize) wxApi.onWindowResize(function () { resize(); redraw(); });
  }

  resize();
  bind();
  redraw();
  runtime.tap = tap;
  runtime.redraw = redraw;
  return runtime;
}

if (getWx() && getWx().createCanvas) {
  createRuntime();
}

if (typeof module !== "undefined") {
  module.exports = {
    STORAGE_KEY: STORAGE_KEY,
    computeLayout: computeLayout,
    gridCellFromPoint: gridCellFromPoint,
    controlFromPoint: controlFromPoint,
    render: render,
    createRuntime: createRuntime
  };
}
