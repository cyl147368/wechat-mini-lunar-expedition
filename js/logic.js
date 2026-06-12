"use strict";

var VERSION = 1;
var GRID_SIZE = 10;
var BASE = { x: 1, y: 8 };

var RESOURCE_KEYS = ["oxygen", "power", "minerals", "data", "hull"];

var TERRAIN = {
  base: { label: "基地", moveCost: 1, oxygenCost: 0, powerCost: 0, color: "#EEDB8F" },
  regolith: { label: "月壤", moveCost: 1, oxygenCost: 1, powerCost: 1, color: "#8A8790" },
  basalt: { label: "玄武岩", moveCost: 1, oxygenCost: 1, powerCost: 1, color: "#5C6472" },
  ridge: { label: "山脊", moveCost: 2, oxygenCost: 2, powerCost: 1, color: "#A18468" },
  crater: { label: "陨坑", moveCost: 2, oxygenCost: 2, powerCost: 2, color: "#3D4657" },
  ice: { label: "冰脉", moveCost: 1, oxygenCost: 1, powerCost: 1, color: "#8FD7E8" },
  wreck: { label: "残骸", moveCost: 1, oxygenCost: 1, powerCost: 1, color: "#D68D62" },
  ruin: { label: "遗迹", moveCost: 1, oxygenCost: 1, powerCost: 1, color: "#B9A1E8" },
  vent: { label: "热泉", moveCost: 1, oxygenCost: 1, powerCost: 0, color: "#E5B15F" },
  chasm: { label: "裂谷", moveCost: 99, oxygenCost: 99, powerCost: 99, blocked: true, color: "#141820" }
};

var BUILDINGS = {
  solar: { label: "太阳阵列", cost: { minerals: 8 }, effect: "每回合 +3 电力" },
  extractor: { label: "采掘站", cost: { minerals: 10, power: 2 }, effect: "每回合 +2 矿物" },
  lab: { label: "分析舱", cost: { minerals: 12, data: 4 }, effect: "每回合 +1 数据" },
  habitat: { label: "生命舱", cost: { minerals: 14, data: 3 }, effect: "每回合 +2 氧气" },
  relay: { label: "通信中继", cost: { minerals: 16, data: 6, power: 4 }, effect: "目标建筑，扩大视野" }
};

var TECHS = {
  drive: { label: "低重力履带", cost: { data: 4, minerals: 4 }, effect: "山脊和陨坑移动少耗 1 行动点" },
  scanner: { label: "广域光谱仪", cost: { data: 8, minerals: 5 }, effect: "扫描半径 +1" },
  drill: { label: "深层钻头", cost: { data: 10, minerals: 8 }, effect: "采集矿物和数据 +1" },
  recycler: { label: "闭环制氧", cost: { data: 12, minerals: 10 }, effect: "回合氧气维护 -1" },
  shield: { label: "磁盾穹顶", cost: { data: 16, minerals: 12 }, effect: "异常体伤害降低" },
  uplink: { label: "量子上行链路", cost: { data: 20, minerals: 16 }, effect: "满足中继目标后完成远征" }
};

var BUILD_ORDER = ["solar", "extractor", "lab", "habitat", "relay"];
var TECH_ORDER = ["drive", "scanner", "drill", "recycler", "shield", "uplink"];

function normalizeSeed(seed) {
  var n = Number(seed);
  if (!isFinite(n)) n = 20260612;
  n = Math.floor(Math.abs(n)) >>> 0;
  return n || 1;
}

function makeRng(seed) {
  return { seed: normalizeSeed(seed) };
}

function random(rng) {
  rng.seed = (rng.seed * 1664525 + 1013904223) >>> 0;
  return rng.seed / 4294967296;
}

function randomInt(rng, max) {
  return Math.floor(random(rng) * max);
}

function cloneCell(cell) {
  return {
    x: cell.x,
    y: cell.y,
    terrain: cell.terrain,
    visible: !!cell.visible,
    explored: !!cell.explored,
    deposits: {
      oxygen: Math.max(0, Math.floor(Number(cell.deposits && cell.deposits.oxygen) || 0)),
      power: Math.max(0, Math.floor(Number(cell.deposits && cell.deposits.power) || 0)),
      minerals: Math.max(0, Math.floor(Number(cell.deposits && cell.deposits.minerals) || 0)),
      data: Math.max(0, Math.floor(Number(cell.deposits && cell.deposits.data) || 0))
    },
    building: cell.building || null,
    scanned: !!cell.scanned
  };
}

function cloneGrid(grid) {
  return grid.map(function (row) {
    return row.map(cloneCell);
  });
}

function cloneResources(resources) {
  var out = {};
  RESOURCE_KEYS.forEach(function (key) {
    out[key] = Math.max(0, Math.floor(Number(resources && resources[key]) || 0));
  });
  return out;
}

function cloneAnomaly(anomaly) {
  return {
    id: anomaly.id,
    x: anomaly.x,
    y: anomaly.y,
    hp: anomaly.hp,
    maxHp: anomaly.maxHp,
    alert: anomaly.alert,
    kind: anomaly.kind || "echo"
  };
}

function cloneState(state) {
  return {
    version: VERSION,
    phase: state.phase,
    sol: state.sol,
    ap: state.ap,
    maxAp: state.maxAp,
    rngSeed: normalizeSeed(state.rngSeed),
    nextId: state.nextId,
    rover: { x: state.rover.x, y: state.rover.y },
    resources: cloneResources(state.resources),
    grid: cloneGrid(state.grid),
    tech: Object.assign({}, state.tech || {}),
    anomalies: (state.anomalies || []).map(cloneAnomaly),
    eventLog: (state.eventLog || []).slice(-8),
    selectedBuild: state.selectedBuild || "solar",
    selectedTech: state.selectedTech || "drive",
    message: state.message || "",
    objective: {
      relays: Math.max(0, Math.floor(Number(state.objective && state.objective.relays) || 0)),
      data: Math.max(0, Math.floor(Number(state.objective && state.objective.data) || 0)),
      launchReady: !!(state.objective && state.objective.launchReady)
    }
  };
}

function inBounds(pos) {
  return !!pos &&
    Math.floor(pos.x) === pos.x &&
    Math.floor(pos.y) === pos.y &&
    pos.x >= 0 &&
    pos.y >= 0 &&
    pos.x < GRID_SIZE &&
    pos.y < GRID_SIZE;
}

function distance(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function manhattan(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function cellKey(pos) {
  return pos.x + ":" + pos.y;
}

function getCell(state, pos) {
  if (!inBounds(pos)) return null;
  return state.grid[pos.y][pos.x];
}

function chooseTerrain(rng, x, y) {
  if (x === BASE.x && y === BASE.y) return "base";
  var nearBase = Math.abs(x - BASE.x) + Math.abs(y - BASE.y) <= 2;
  if (!nearBase && random(rng) < 0.08) return "chasm";
  var roll = random(rng);
  if (roll < 0.24) return "regolith";
  if (roll < 0.42) return "basalt";
  if (roll < 0.56) return "ridge";
  if (roll < 0.68) return "crater";
  if (roll < 0.78) return "ice";
  if (roll < 0.88) return "vent";
  if (roll < 0.95) return "wreck";
  return "ruin";
}

function makeDeposits(rng, terrain) {
  var deposits = { oxygen: 0, power: 0, minerals: 0, data: 0 };
  if (terrain === "ice") deposits.oxygen = 5 + randomInt(rng, 5);
  if (terrain === "vent") deposits.power = 4 + randomInt(rng, 5);
  if (terrain === "basalt" || terrain === "ridge" || terrain === "crater") deposits.minerals = 3 + randomInt(rng, 6);
  if (terrain === "wreck") {
    deposits.minerals = 3 + randomInt(rng, 5);
    deposits.data = 2 + randomInt(rng, 5);
    deposits.power = 1 + randomInt(rng, 4);
  }
  if (terrain === "ruin") {
    deposits.data = 5 + randomInt(rng, 7);
    deposits.minerals = 1 + randomInt(rng, 4);
  }
  return deposits;
}

function createGrid(rng) {
  var grid = [];
  for (var y = 0; y < GRID_SIZE; y += 1) {
    var row = [];
    for (var x = 0; x < GRID_SIZE; x += 1) {
      var terrain = chooseTerrain(rng, x, y);
      row.push({
        x: x,
        y: y,
        terrain: terrain,
        visible: false,
        explored: false,
        deposits: makeDeposits(rng, terrain),
        building: null,
        scanned: false
      });
    }
    grid.push(row);
  }

  [[1, 8], [1, 7], [2, 8], [0, 8], [1, 9], [2, 7], [0, 7]].forEach(function (pair) {
    var cell = grid[pair[1]][pair[0]];
    if (cell.terrain === "chasm" || cell.terrain === "crater") {
      cell.terrain = "regolith";
      cell.deposits = makeDeposits(rng, "regolith");
    }
  });
  grid[BASE.y][BASE.x].terrain = "base";
  grid[BASE.y][BASE.x].deposits = { oxygen: 0, power: 0, minerals: 0, data: 0 };
  grid[BASE.y][BASE.x].building = "base";
  return grid;
}

function createAnomalies(rng) {
  var fixed = [
    { x: 8, y: 1, kind: "echo" },
    { x: 7, y: 7, kind: "crawler" },
    { x: 4, y: 1, kind: "wisp" },
    { x: 8, y: 5, kind: "crawler" }
  ];
  return fixed.map(function (item, index) {
    var hp = item.kind === "crawler" ? 42 : item.kind === "wisp" ? 26 : 34;
    return {
      id: "anomaly-" + (index + 1 + randomInt(rng, 20)),
      x: item.x,
      y: item.y,
      hp: hp,
      maxHp: hp,
      alert: 0,
      kind: item.kind
    };
  });
}

function reveal(state, center, radius) {
  for (var y = 0; y < GRID_SIZE; y += 1) {
    for (var x = 0; x < GRID_SIZE; x += 1) {
      var cell = state.grid[y][x];
      var inRange = Math.abs(x - center.x) + Math.abs(y - center.y) <= radius;
      if (inRange) {
        cell.visible = true;
        cell.explored = true;
      }
    }
  }
}

function clearVisibility(state) {
  for (var y = 0; y < GRID_SIZE; y += 1) {
    for (var x = 0; x < GRID_SIZE; x += 1) {
      state.grid[y][x].visible = false;
    }
  }
}

function updateVisibility(state) {
  clearVisibility(state);
  var baseRadius = state.tech.scanner ? 3 : 2;
  reveal(state, state.rover, baseRadius);
  reveal(state, BASE, 2);
  state.grid.forEach(function (row) {
    row.forEach(function (cell) {
      if (cell.building === "relay") reveal(state, cell, 3);
      if (cell.building === "habitat") reveal(state, cell, 1);
    });
  });
}

function startGame(seed) {
  var rng = makeRng(seed == null ? Date.now() : seed);
  var state = {
    version: VERSION,
    phase: "playing",
    sol: 1,
    ap: 4,
    maxAp: 4,
    rngSeed: rng.seed,
    nextId: 10,
    rover: { x: BASE.x, y: BASE.y },
    resources: { oxygen: 34, power: 26, minerals: 14, data: 0, hull: 100 },
    grid: createGrid(rng),
    tech: {},
    anomalies: createAnomalies(rng),
    eventLog: ["月面远征开始"],
    selectedBuild: "solar",
    selectedTech: "drive",
    message: "探索月面，建立中继并完成上行链路",
    objective: { relays: 0, data: 0, launchReady: false }
  };
  state.rngSeed = rng.seed;
  updateVisibility(state);
  return state;
}

function sanitizeState(input) {
  if (!input || typeof input !== "object" || !Array.isArray(input.grid)) return startGame(20260612);
  var state = cloneState(Object.assign(startGame(input.rngSeed), input));
  state.phase = ["playing", "won", "lost"].indexOf(input.phase) >= 0 ? input.phase : "playing";
  state.maxAp = Math.max(1, Math.min(6, Math.floor(Number(input.maxAp) || 4)));
  state.ap = Math.max(0, Math.min(state.maxAp, Math.floor(Number(input.ap) || 0)));
  state.sol = Math.max(1, Math.floor(Number(input.sol) || 1));
  state.rover = inBounds(input.rover) ? { x: input.rover.x, y: input.rover.y } : { x: BASE.x, y: BASE.y };
  state.resources = cloneResources(input.resources);
  state.selectedBuild = BUILDINGS[input.selectedBuild] ? input.selectedBuild : "solar";
  state.selectedTech = TECHS[input.selectedTech] ? input.selectedTech : "drive";
  if (state.resources.hull <= 0 || state.resources.oxygen <= 0) state.phase = "lost";
  updateObjectives(state);
  updateVisibility(state);
  return state;
}

function canPay(resources, cost) {
  return Object.keys(cost || {}).every(function (key) {
    return (resources[key] || 0) >= cost[key];
  });
}

function pay(resources, cost) {
  Object.keys(cost || {}).forEach(function (key) {
    resources[key] = Math.max(0, (resources[key] || 0) - cost[key]);
  });
}

function spendAp(state, amount) {
  if (state.ap < amount) return false;
  state.ap -= amount;
  return true;
}

function log(state, text) {
  state.eventLog.push(text);
  state.eventLog = state.eventLog.slice(-8);
  state.message = text;
}

function terrainMoveCost(state, cell) {
  var terrain = TERRAIN[cell.terrain] || TERRAIN.regolith;
  var cost = terrain.moveCost;
  if (state.tech.drive && (cell.terrain === "ridge" || cell.terrain === "crater")) cost = Math.max(1, cost - 1);
  return cost;
}

function moveRover(state, target) {
  var next = cloneState(sanitizeState(state));
  if (next.phase !== "playing") return next;
  var cell = getCell(next, target);
  if (!cell || (TERRAIN[cell.terrain] && TERRAIN[cell.terrain].blocked)) {
    log(next, "这里无法通行");
    return next;
  }
  if (manhattan(next.rover, target) !== 1) {
    log(next, "只能移动到相邻格");
    return next;
  }
  var cost = terrainMoveCost(next, cell);
  if (!spendAp(next, cost)) {
    log(next, "行动点不足");
    return next;
  }
  var terrain = TERRAIN[cell.terrain] || TERRAIN.regolith;
  next.resources.oxygen = Math.max(0, next.resources.oxygen - terrain.oxygenCost);
  next.resources.power = Math.max(0, next.resources.power - terrain.powerCost);
  next.rover = { x: target.x, y: target.y };
  cell.explored = true;
  cell.visible = true;
  updateVisibility(next);
  checkDefeat(next);
  if (next.phase === "playing") log(next, "移动到" + terrain.label);
  return next;
}

function scan(state, center) {
  var next = cloneState(sanitizeState(state));
  if (next.phase !== "playing") return next;
  center = inBounds(center) ? center : next.rover;
  var apCost = 1;
  var powerCost = 3;
  if (!spendAp(next, apCost)) {
    log(next, "行动点不足");
    return next;
  }
  if (next.resources.power < powerCost) {
    next.ap += apCost;
    log(next, "电力不足，无法扫描");
    return next;
  }
  next.resources.power -= powerCost;
  var radius = next.tech.scanner ? 3 : 2;
  reveal(next, center, radius);
  var found = 0;
  for (var y = 0; y < GRID_SIZE; y += 1) {
    for (var x = 0; x < GRID_SIZE; x += 1) {
      var cell = next.grid[y][x];
      if (cell.visible && !cell.scanned && (cell.terrain === "ruin" || cell.terrain === "wreck" || cell.terrain === "vent")) {
        cell.scanned = true;
        found += 1;
      }
    }
  }
  next.resources.data += found;
  log(next, "扫描完成，获得 " + found + " 数据");
  updateObjectives(next);
  return next;
}

function harvest(state) {
  var next = cloneState(sanitizeState(state));
  if (next.phase !== "playing") return next;
  if (!spendAp(next, 1)) {
    log(next, "行动点不足");
    return next;
  }
  var cell = getCell(next, next.rover);
  var bonus = next.tech.drill ? 1 : 0;
  var gained = { oxygen: 0, power: 0, minerals: 0, data: 0 };
  ["oxygen", "power", "minerals", "data"].forEach(function (key) {
    var take = Math.min(cell.deposits[key], key === "minerals" || key === "data" ? 3 + bonus : 4 + bonus);
    cell.deposits[key] -= take;
    gained[key] += take;
    next.resources[key] += take;
  });
  if (!gained.oxygen && !gained.power && !gained.minerals && !gained.data) {
    next.ap += 1;
    log(next, "这里已无可采集资源");
    return next;
  }
  updateObjectives(next);
  log(next, "采集 +" + gained.oxygen + "氧 +" + gained.power + "电 +" + gained.minerals + "矿 +" + gained.data + "数");
  return next;
}

function selectBuild(state, type) {
  var next = cloneState(sanitizeState(state));
  if (BUILDINGS[type]) {
    next.selectedBuild = type;
    log(next, "选择建造：" + BUILDINGS[type].label);
  }
  return next;
}

function cycleBuild(state) {
  var next = cloneState(sanitizeState(state));
  var index = BUILD_ORDER.indexOf(next.selectedBuild);
  next.selectedBuild = BUILD_ORDER[(index + 1 + BUILD_ORDER.length) % BUILD_ORDER.length];
  log(next, "选择建造：" + BUILDINGS[next.selectedBuild].label);
  return next;
}

function build(state, type) {
  var next = cloneState(sanitizeState(state));
  if (next.phase !== "playing") return next;
  type = BUILDINGS[type] ? type : next.selectedBuild;
  var def = BUILDINGS[type];
  var cell = getCell(next, next.rover);
  if (!cell || !cell.explored || cell.terrain === "chasm") {
    log(next, "这里不能建造");
    return next;
  }
  if (cell.building && cell.building !== "base") {
    log(next, "这里已有设施");
    return next;
  }
  if (cell.terrain === "base" && type !== "lab" && type !== "habitat") {
    log(next, "基地格只适合扩展舱段");
    return next;
  }
  if (!canPay(next.resources, def.cost)) {
    log(next, "资源不足，无法建造" + def.label);
    return next;
  }
  if (!spendAp(next, 2)) {
    log(next, "行动点不足");
    return next;
  }
  pay(next.resources, def.cost);
  cell.building = type;
  updateObjectives(next);
  updateVisibility(next);
  log(next, "建成" + def.label);
  return next;
}

function selectTech(state, tech) {
  var next = cloneState(sanitizeState(state));
  if (TECHS[tech]) {
    next.selectedTech = tech;
    log(next, "选择研究：" + TECHS[tech].label);
  }
  return next;
}

function nextResearchTarget(state) {
  for (var i = 0; i < TECH_ORDER.length; i += 1) {
    var tech = TECH_ORDER[i];
    if (!state.tech[tech]) return tech;
  }
  return null;
}

function research(state, tech) {
  var next = cloneState(sanitizeState(state));
  if (next.phase !== "playing") return next;
  tech = TECHS[tech] ? tech : next.selectedTech;
  if (next.tech[tech]) {
    var fallback = nextResearchTarget(next);
    if (!fallback) {
      log(next, "全部科技已完成");
      return next;
    }
    tech = fallback;
  }
  var def = TECHS[tech];
  if (!canPay(next.resources, def.cost)) {
    log(next, "研究资源不足：" + def.label);
    return next;
  }
  if (!spendAp(next, 1)) {
    log(next, "行动点不足");
    return next;
  }
  pay(next.resources, def.cost);
  next.tech[tech] = true;
  next.selectedTech = nextResearchTarget(next) || tech;
  if (tech === "drive") next.maxAp = Math.min(6, next.maxAp + 1);
  updateObjectives(next);
  updateVisibility(next);
  checkWin(next);
  log(next, "研究完成：" + def.label);
  return next;
}

function repair(state) {
  var next = cloneState(sanitizeState(state));
  if (next.phase !== "playing") return next;
  var atBase = next.rover.x === BASE.x && next.rover.y === BASE.y;
  var cost = atBase ? { minerals: 3, power: 2 } : { minerals: 6, power: 4 };
  if (!canPay(next.resources, cost)) {
    log(next, "维修资源不足");
    return next;
  }
  if (!spendAp(next, 1)) {
    log(next, "行动点不足");
    return next;
  }
  pay(next.resources, cost);
  next.resources.hull = Math.min(100, next.resources.hull + (atBase ? 24 : 14));
  log(next, "车体维修完成");
  return next;
}

function anomalyDamage(state) {
  var shield = state.tech.shield ? 0.55 : 1;
  return Math.ceil(10 * shield);
}

function stabilize(state) {
  var next = cloneState(sanitizeState(state));
  if (next.phase !== "playing") return next;
  var nearby = null;
  for (var i = 0; i < next.anomalies.length; i += 1) {
    if (manhattan(next.rover, next.anomalies[i]) <= 1) {
      nearby = next.anomalies[i];
      break;
    }
  }
  if (!nearby) {
    log(next, "附近没有异常体");
    return next;
  }
  if (!spendAp(next, 1)) {
    log(next, "行动点不足");
    return next;
  }
  var damage = 18 + (next.tech.uplink ? 10 : 0);
  nearby.hp -= damage;
  next.resources.power = Math.max(0, next.resources.power - 2);
  if (nearby.hp <= 0) {
    next.resources.data += 4;
    next.anomalies = next.anomalies.filter(function (item) { return item.id !== nearby.id; });
    updateObjectives(next);
    log(next, "异常体已稳定，获得数据");
  } else {
    log(next, "异常体受抑制");
  }
  return next;
}

function moveAnomalyToward(anomaly, target, grid) {
  var options = [
    { x: anomaly.x + 1, y: anomaly.y },
    { x: anomaly.x - 1, y: anomaly.y },
    { x: anomaly.x, y: anomaly.y + 1 },
    { x: anomaly.x, y: anomaly.y - 1 }
  ].filter(function (pos) {
    return inBounds(pos) && !(TERRAIN[grid[pos.y][pos.x].terrain] || {}).blocked;
  });
  options.sort(function (a, b) {
    return manhattan(a, target) - manhattan(b, target);
  });
  if (options.length) {
    anomaly.x = options[0].x;
    anomaly.y = options[0].y;
  }
}

function stepAnomalies(state) {
  for (var i = 0; i < state.anomalies.length; i += 1) {
    var anomaly = state.anomalies[i];
    var dist = manhattan(anomaly, state.rover);
    if (dist <= 1) {
      state.resources.hull = Math.max(0, state.resources.hull - anomalyDamage(state));
      state.resources.oxygen = Math.max(0, state.resources.oxygen - 2);
      anomaly.alert += 1;
      log(state, "异常体冲击车体");
    } else if (dist <= 5 || anomaly.alert > 0) {
      anomaly.alert = Math.min(4, anomaly.alert + 1);
      moveAnomalyToward(anomaly, state.rover, state.grid);
    }
  }
}

function buildingIncome(state) {
  var storm = state.sol % 7 === 0;
  var income = { oxygen: 0, power: 0, minerals: 0, data: 0 };
  state.grid.forEach(function (row) {
    row.forEach(function (cell) {
      if (cell.building === "solar") income.power += storm ? 1 : 3;
      if (cell.building === "extractor") income.minerals += 2 + (state.tech.drill ? 1 : 0);
      if (cell.building === "lab") income.data += 1;
      if (cell.building === "habitat") income.oxygen += 2;
      if (cell.building === "relay") income.data += state.tech.scanner ? 1 : 0;
    });
  });
  Object.keys(income).forEach(function (key) {
    state.resources[key] += income[key];
  });
  return income;
}

function randomEvent(state) {
  if (state.sol % 4 !== 0) return;
  var rng = makeRng(state.rngSeed + state.sol * 101);
  var roll = random(rng);
  state.rngSeed = rng.seed;
  if (roll < 0.34) {
    state.resources.power = Math.max(0, state.resources.power - 4);
    log(state, "微陨石雨损耗电力");
  } else if (roll < 0.67) {
    state.resources.oxygen += 3;
    log(state, "冷阱回收额外氧气");
  } else {
    state.resources.data += 2;
    log(state, "深空回波提供新数据");
  }
}

function endTurn(state) {
  var next = cloneState(sanitizeState(state));
  if (next.phase !== "playing") return next;
  next.sol += 1;
  next.ap = next.maxAp;
  var oxygenDrain = next.tech.recycler ? 0 : 1;
  next.resources.oxygen = Math.max(0, next.resources.oxygen - oxygenDrain);
  next.resources.power = Math.max(0, next.resources.power - 1);
  var income = buildingIncome(next);
  randomEvent(next);
  stepAnomalies(next);
  updateObjectives(next);
  updateVisibility(next);
  checkDefeat(next);
  checkWin(next);
  if (next.phase === "playing") {
    log(next, "第 " + next.sol + " 日：+" + income.oxygen + "氧 +" + income.power + "电 +" + income.minerals + "矿 +" + income.data + "数");
  }
  return next;
}

function updateObjectives(state) {
  var relays = 0;
  state.grid.forEach(function (row) {
    row.forEach(function (cell) {
      if (cell.building === "relay") relays += 1;
    });
  });
  state.objective.relays = relays;
  state.objective.data = state.resources.data;
  state.objective.launchReady = !!state.tech.uplink && relays >= 2 && state.resources.data >= 24;
}

function checkDefeat(state) {
  if (state.resources.hull <= 0) {
    state.phase = "lost";
    log(state, "车体损毁，远征失败");
  } else if (state.resources.oxygen <= 0) {
    state.phase = "lost";
    log(state, "氧气耗尽，远征失败");
  }
}

function checkWin(state) {
  updateObjectives(state);
  if (state.objective.launchReady) {
    state.phase = "won";
    log(state, "上行链路完成，月面远征成功");
  }
}

function forceWinReady(state) {
  var next = cloneState(sanitizeState(state));
  next.resources.data = Math.max(next.resources.data, 24);
  next.resources.minerals = Math.max(next.resources.minerals, 20);
  next.tech.uplink = true;
  var relayCount = 0;
  for (var y = 0; y < GRID_SIZE && relayCount < 2; y += 1) {
    for (var x = 0; x < GRID_SIZE && relayCount < 2; x += 1) {
      var cell = next.grid[y][x];
      if (cell.terrain !== "chasm" && !cell.building) {
        cell.building = "relay";
        relayCount += 1;
      }
    }
  }
  checkWin(next);
  return next;
}

function getVisibleAnomalies(state) {
  return state.anomalies.filter(function (anomaly) {
    var cell = getCell(state, anomaly);
    return cell && cell.visible;
  });
}

function getSummary(state) {
  return {
    phase: state.phase,
    sol: state.sol,
    ap: state.ap,
    rover: { x: state.rover.x, y: state.rover.y },
    resources: cloneResources(state.resources),
    relays: state.objective.relays,
    dataGoal: Math.min(24, state.objective.data),
    techCount: Object.keys(state.tech).filter(function (key) { return state.tech[key]; }).length,
    visibleAnomalies: getVisibleAnomalies(state).length
  };
}

if (typeof module !== "undefined") {
  module.exports = {
    VERSION: VERSION,
    GRID_SIZE: GRID_SIZE,
    BASE: BASE,
    TERRAIN: TERRAIN,
    BUILDINGS: BUILDINGS,
    TECHS: TECHS,
    BUILD_ORDER: BUILD_ORDER,
    TECH_ORDER: TECH_ORDER,
    startGame: startGame,
    sanitizeState: sanitizeState,
    cloneState: cloneState,
    inBounds: inBounds,
    getCell: getCell,
    distance: distance,
    manhattan: manhattan,
    moveRover: moveRover,
    scan: scan,
    harvest: harvest,
    selectBuild: selectBuild,
    cycleBuild: cycleBuild,
    build: build,
    selectTech: selectTech,
    research: research,
    repair: repair,
    stabilize: stabilize,
    endTurn: endTurn,
    checkWin: checkWin,
    forceWinReady: forceWinReady,
    getVisibleAnomalies: getVisibleAnomalies,
    getSummary: getSummary,
    canPay: canPay
  };
}
