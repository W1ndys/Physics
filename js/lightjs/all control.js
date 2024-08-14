// 初始化全局变量
let objects = [], sources = [], tools = [];
let updateFlag = true, fr = 0, gScale = 1;
let screen, calcWarning = false;
const gridSize = 20, menuHeight = 40;

// p5.js的setup函数，初始化画布和界面
function setup() {
  createCanvas(window.innerWidth, window.innerHeight - menuHeight);
  buildInterface();
  screen = new Rectangle(0, 0, width / 2, height / 2);
  screen.a = createVector(0, 0);
  strokeCap(PROJECT);
}

// p5.js的draw函数，主要绘制和更新内容
function draw() {
  if (frameCount % 10 === 0) fr = int(frameRate());
  updateMousePosition();

  if (updateFlag || mouse.deleteFlag) {
    renderScene();
    if (mouse.buildHistory.length === 0) updateFlag = false;
  }

  handleMouseMovement();
}

// 更新鼠标在屏幕坐标系中的位置
function updateMousePosition() {
  const x = map(mouseX, 0, width, 0, screen.w * 2) - screen.w + screen.pos.x;
  const y = map(mouseY, 0, height, 0, screen.h * 2) - screen.h + screen.pos.y;
  mouse.pos.set(x, y);
}

// 渲染场景
function renderScene() {
  background(0);
  if (grid) drawGrid();
  displayFrameRateAndScale();
  if (calcWarning) showWarning();
  
  push();
  applyTransforms();
  drawBuildHistory();
  renderAllObjects();
  renderAllSources();
  renderAllTools();
  pop();
}

// 应用变换
function applyTransforms() {
  translate(width / 2, height / 2);
  scale(gScale);
  translate(screen.pos.x, screen.pos.y);
}

// 显示帧率和缩放比例
function displayFrameRateAndScale() {
  noStroke();
  fill(255);
  text(fr, 50, 40);
  text(int(gScale * 100) + '%', 100, 40);
}

// 处理所有对象、光源和工具的渲染
function renderAllObjects() {
  renderItems(objects, item => item.render());
}

function renderAllSources() {
  renderItems(sources, item => {
    if (!calcWarning) item.handle(objects);
    item.render();
  });
}

function renderAllTools() {
  renderItems(tools, item => item.render());
}

// 渲染项目并处理删除标志
function renderItems(items, renderCallback) {
  for (let i = items.length - 1; i >= 0; i--) {
    if (mouse.deleteFlag && mouse.isHolding(items[i])) {
      items.splice(i, 1);
      mouse.deleteFlag = false;
      mouse.drop();
      updateFlag = true;
    } else {
      renderCallback(items[i]);
    }
  }
}

// 绘制网格
function drawGrid() {
  stroke(30);
  strokeWeight(1);
  for (let i = 0; i < width; i += gridSize) line(i, 0, i, height);
  for (let i = 0; i < height; i += gridSize) line(0, i, width, i);
}

// 显示计算警告信息
function showWarning() {
  rectMode(CENTER);
  fill(255, 0, 0, 50);
  rect(width / 2, 10, width, 20);
  fill(255);
  text('Warning! Processing...', 20, 14);
  calcWarning = false; // 重置警告标志
}

// 绘制构建历史
function drawBuildHistory() {
  if (mouse.buildHistory.length === 0) return;

  fill(255, 0, 0);
  rectMode(CENTER);
  mouse.buildHistory.forEach(p => rect(p.x, p.y, 5, 5)); // 绘制历史点

  const lastPoint = mouse.buildHistory[mouse.buildHistory.length - 1];
  stroke(100);
  strokeWeight(2);
  line(mouse.pos.x, mouse.pos.y, lastPoint.x, lastPoint.y); // 绘制当前鼠标与最后一个历史点之间的线

  if (mouse.buildHistory.length > 1) {
    noFill();
    beginShape();
    mouse.buildHistory.forEach(p => vertex(p.x, p.y)); // 绘制历史路径
    endShape();
  }
}

// 通用渲染处理函数
function renderItems(items, callback) {
  for (let i = items.length - 1; i >= 0; i--) {
    if (mouse.deleteFlag && mouse.isHolding(items[i])) {
      items.splice(i, 1); // 删除当前抓取的对象
      mouse.deleteFlag = false;
      mouse.drop(); // 取消抓取
      updateFlag = true;
    } else {
      callback(items[i]); // 渲染或处理对象
    }
  }
}

// 渲染所有对象
function renderObjects() {
  renderItems(objects, item => item.render());
}

// 处理所有光源
function handleSources() {
  renderItems(sources, item => {
    if (!calcWarning) item.handle(objects); // 处理光源与对象的交互
    item.render();
  });
}

// 渲染所有工具
function renderTools() {
  renderItems(tools, item => item.render());
}

// 处理鼠标移动
function handleMouseMovement() {
  if (mouse.holding && frameCount % 2 === 0) {
    const directions = [
      { key: UP_ARROW, x: 0, y: -1 },
      { key: DOWN_ARROW, x: 0, y: 1 },
      { key: LEFT_ARROW, x: -1, y: 0 },
      { key: RIGHT_ARROW, x: 1, y: 0 }
    ];

    let moved = directions.some(dir => {
      if (keyIsDown(dir.key)) {
        mouse.holding.setPos(mouse.holding.pos.x + dir.x, mouse.holding.pos.y + dir.y);
        return true;
      }
      return false;
    });

    if (moved) updateFlag = true;
  }
}

// 处理键盘按键事件
function keyPressed(e) {
  if (!mouse.holding) return;

  if (e.key === "Delete") {
    mouse.delete(); // 删除当前抓取的对象
  } else if (e.key === "D") {
    let n = mouse.holding.duplicate(); // 复制当前抓取的对象
    const offsetX = mouse.holding.dir ? mouse.holding.dir.x * gridSize / gScale : gridSize / gScale;
    const offsetY = mouse.holding.dir ? mouse.holding.dir.y * gridSize / gScale : gridSize / gScale;
    
    n.setPos(n.pos.x + offsetX, n.pos.y + offsetY);
    n.name = mouse.holding.name.includes("Duplicate") ? `${mouse.holding.name}*` : `${mouse.holding.name} Duplicate`;
    mouse.hold(n); // 抓取复制的对象
  }
}

// 初始化鼠标对象及其属性
let mouse;

function buildInterface() {
  mouse = {
    pos: createVector(mouseX, mouseY),
    a: createVector(mouseX, mouseY),
    dis: createVector(0, 0),
    mode: 'hand',
    handMode: 'single',
    c: createVector(width / 2, height / 2),
    buildHistory: [],
  };

  // 绑定鼠标方法
  Object.assign(mouse, {
    hold: holdObject,
    drop: dropObject,
    delete: deleteObject,
    isHolding: obj => obj === mouse.holding,
  });

  // 监听颜色选择事件
  document.getElementById('color').addEventListener("change", updateMouseColor);

  // 监听主选择框的更改事件
  const mainSelect = document.getElementById('main-select');
  mainSelect.addEventListener("change", handleMainSelectChange);
  mainSelect.dispatchEvent(new Event('change')); // 触发选择事件
  document.getElementById('color').dispatchEvent(new Event('change')); // 触发颜色更改事件
}

// 处理对象的抓取
function holdObject(obj, prop) {
  document.getElementById('delete').disabled = false;
  this.holding = obj;
  document.getElementById('output').value = obj.name || 'Untitled';
  this.dis.set(this.pos.x - obj.pos.x, this.pos.y - obj.pos.y);
  this.currProperty = prop;
  updatePropertiesMenu(obj.properties);
  updateFlag = true;
}

// 清空对象抓取状态
function dropObject() {
  clearPropertiesMenu();
  document.getElementById('delete').disabled = true;
  document.getElementById('output').value = '';
  this.holding = false;
  updateFlag = true;
}

// 标记删除操作
function deleteObject() {
  this.deleteFlag = true;
}

// 更新属性菜单
function updatePropertiesMenu(properties) {
  const propHolder = document.getElementById('menu-sub');
  propHolder.innerHTML = '';
  if (!properties) return;

  properties.forEach((property, i) => {
    const label = document.createTextNode(`${property.name} `);
    propHolder.appendChild(label);
    const input = document.createElement('input');
    property.tags(input);
    input.type = property.type;
    input.value = property.default();
    input.id = i;
    input.addEventListener("input", e => property.onchange(e.target.value));
    propHolder.appendChild(input);
  });
}

// 清空属性菜单
function clearPropertiesMenu() {
  document.getElementById('menu-sub').innerHTML = '';
}

// 更新鼠标颜色
function updateMouseColor(e) {
  mouse.color = color(e.target.value);
  if (mouse.mode === 'hand' && mouse.holding?.color) {
    updateFlag = true;
    mouse.holding.color.levels = mouse.color.levels;
  }
}

// 处理主选择框更改事件
function handleMainSelectChange(e) {
  const selectedValue = e.target.value;

  if (selectedValue !== 'hand') {
    setMouseMode('build', selectedValue);
  } else {
    setMouseMode('hand');
  }
  mouse.buildHistory = [];
}

// 设置鼠标模式
function setMouseMode(mode, buildingName = '') {
  document.body.style.cursor = mode === 'hand' ? "move" : "crosshair";
  mouse.mode = mode;
  if (mode === 'build') {
    mouse.building = options[buildingName][0];
    mouse.buildingName = buildingName;
  }
  mouse.drop();
}

// 处理鼠标按下事件
function mousePressed() {
  mouse.a.set(mouseX, mouseY);
  screen.a.set(screen.pos.x, screen.pos.y);

  if (!screen.contains(mouse)) return;

  if (mouse.mode === 'build') {
    handleBuildMode();
  } else if (mouse.mode === 'hand') {
    handleHandMode();
  }
}

// 处理构建模式
function handleBuildMode() {
  const newObj = mouse.building.build(mouse);
  updateFlag = true;
  mouse.drop();

  if (!newObj) {
    mouse.buildHistory.push(mouse.pos.copy());
    return;
  }

  mouse.buildHistory = [];
  options[mouse.buildingName][2] += 1;
  newObj.name = `${options[mouse.buildingName][1]} ${options[mouse.buildingName][2]}`;

  if (newObj.morph) {
    mouse.hold(newObj, newObj.buildMorph === false ? 'none' : 'resize');
    mouse.isBuilding = true;
  }
}

// 处理手动模式
function handleHandMode() {
  mouse.drop();

  const closest = findClosestObject();
  if (closest) {
    mouse.hold(closest.obj, closest.prop);
  }
}

// 找到最近的对象
function findClosestObject() {
  let closestObj = null, closestDistSq = Infinity, closestProp = null;

  [...sources, ...tools, ...objects].forEach(item => {
    const distSq = p5.Vector.sub(mouse.pos, item.pos).magSq();
    const prop = item.contains(mouse);
    if (distSq < closestDistSq && prop) {
      closestDistSq = distSq;
      closestObj = item;
      closestProp = prop;
    }
  });

  return closestObj ? { obj: closestObj, prop: closestProp } : null;
}

// 处理鼠标拖动事件
function mouseDragged() {
  if (mouse.holding && screen.contains(mouse) && mouse.handMode === 'single') {
    mouse.holding.morph(mouse, mouse.currProperty);
    updateFlag = true;
  }
}

// 处理鼠标释放事件
function mouseReleased() {
  if (mouse.mode === 'build' && mouse.isBuilding) {
    mouse.hold(mouse.holding);
    mouse.isBuilding = false;
  }
}

// 对象构建选项
const options = {
  'hand': 'hand',
  'ray': [RaySource, '激光', 0],
  'mirror': [Mirror, '镜子', 0],
  'void': [Void, '虚空', 0],
  'lens': [Lens, '透镜', 0],
  'circle': [CircularBlock, '圆形块', 0],
  'ruler': [Ruler, '尺子', 0],
  'd': [Protractor, '量角器', 0],
}
// 网格状态开关
let grid = false;

// 修正角度到 0 到 TWO_PI 之间
const fixAngles = (...angles) => angles.map(a => (a + TWO_PI) % TWO_PI);

// 递归复制对象的属性，包括数组、p5.Vector 和 p5.Color 对象
const dupProp = obj => {
  if (Array.isArray(obj)) return obj.map(dupProp);
  if (obj instanceof p5.Vector) return obj.copy();
  if (obj instanceof p5.Color) return color(obj.levels);
  return obj;
};

// 计算两点之间的中点
const mid = (a, b) => createVector((a.x + b.x) / 2, (a.y + b.y) / 2);

// 返回数字的符号
const sign = Math.sign;

// 设置全局缩放比例
function setScale(n) {
  updateFlag = true;
  gScale = n ? gScale * n : parseFloat(document.getElementById('scale').value);
  if (n) document.getElementById('scale').value = gScale;
  screen.w = width / (2 * gScale);
  screen.h = height / (2 * gScale);
}

// 切换网格显示状态
function toggleGrid() {
  updateFlag = true;
  grid = !grid;
  document.getElementById('grid').className = grid ? 'green clicked' : 'green';
}

// 禁止文本选择
document.onselectstart = () => false;

// 绘制箭头
function drawArrow(base, vec, color) {
  push();
  stroke(color);
  strokeWeight(3);
  fill(color);
  translate(base.x, base.y);
  line(0, 0, vec.x, vec.y);
  rotate(vec.heading());
  const arrowSize = 7;
  translate(vec.mag() - arrowSize, 0);
  triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
  pop();
}
