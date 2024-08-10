let objects = []; // 存储所有对象的数组
let sources = []; // 存储光源的数组
let tools = []; // 存储工具的数组
let updateFlag = true; // 标记是否需要更新画面
let fr = 0; // 帧率显示
let screen; // 屏幕对象
let gScale = 1; // 全局缩放比例
const gridSize = 20; // 网格大小
const menuHeight = 40; // 菜单栏高度

let calcWarning = false; // 计算警告标志

// p5.js的setup函数，初始化画布和界面
function setup() {
  createCanvas(window.innerWidth, window.innerHeight - menuHeight); // 创建画布
  buildInterface(); // 构建界面
  screen = new Rectangle(0, 0, width / 2, height / 2); // 初始化屏幕对象
  screen.a = createVector(0, 0); // 初始化屏幕的向量位置
  strokeCap(PROJECT); // 设置线条末端为平直
}

// p5.js的draw函数，主要绘制和更新内容
function draw() {
  if (frameCount % 10 === 0) fr = int(frameRate()); // 每10帧更新一次帧率

  // 计算鼠标在屏幕坐标系中的位置
  const x = map(mouseX, 0, width, 0, screen.w * 2) - screen.w + screen.pos.x;
  const y = map(mouseY, 0, height, 0, screen.h * 2) - screen.h + screen.pos.y;
  mouse.pos.set(x, y);

  if (updateFlag || mouse.deleteFlag) {
    background(0); // 清空背景

    if (grid) {
      drawGrid(); // 如果开启网格，绘制网格
    }

    noStroke();
    fill(255);
    text(fr, 50, 40); // 显示帧率
    text(int(gScale * 100) + '%', 100, 40); // 显示缩放比例

    if (calcWarning) {
      showWarning(); // 如果有计算警告，显示警告信息
    }

    push();
    translate(width / 2, height / 2); // 将原点移动到画布中心
    scale(gScale); // 应用全局缩放
    translate(screen.pos.x, screen.pos.y); // 将原点移动到屏幕的实际位置

    drawBuildHistory(); // 绘制构建历史

    renderObjects(); // 渲染所有对象
    handleSources(); // 处理所有光源
    renderTools(); // 渲染所有工具

    pop();

    if (mouse.buildHistory.length === 0) updateFlag = false; // 如果没有构建历史，取消更新标志
  }

  handleMouseMovement(); // 处理鼠标移动
}

// 绘制网格
function drawGrid() {
  stroke(30);
  strokeWeight(1);
  for (let i = 0; i < width; i += gridSize) {
    line(i, 0, i, height);
  }
  for (let i = 0; i < height; i += gridSize) {
    line(0, i, width, i);
  }
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
  if (mouse.buildHistory.length > 0) {
    fill(255, 0, 0);
    rectMode(CENTER);
    mouse.buildHistory.forEach(p => rect(p.x, p.y, 5, 5)); // 绘制历史点

    let lastPoint = mouse.buildHistory[mouse.buildHistory.length - 1];
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
}

// 渲染所有对象
function renderObjects() {
  for (let i = objects.length - 1; i >= 0; i--) {
    if (mouse.deleteFlag && mouse.isHolding(objects[i])) {
      objects.splice(i, 1); // 删除当前抓取的对象
      mouse.deleteFlag = false;
      mouse.drop(); // 取消抓取
      updateFlag = true;
    } else {
      objects[i].render(); // 渲染对象
    }
  }
}

// 处理所有光源
function handleSources() {
  for (let i = sources.length - 1; i >= 0; i--) {
    if (!calcWarning) {
      sources[i].handle(objects); // 处理光源与对象的交互
    }
    if (mouse.deleteFlag && mouse.isHolding(sources[i])) {
      sources.splice(i, 1); // 删除当前抓取的光源
      mouse.deleteFlag = false;
      mouse.drop();
    } else {
      sources[i].render(); // 渲染光源
    }
  }
}

// 渲染所有工具
function renderTools() {
  for (let i = tools.length - 1; i >= 0; i--) {
    if (mouse.deleteFlag && mouse.isHolding(tools[i])) {
      tools.splice(i, 1); // 删除当前抓取的工具
      mouse.deleteFlag = false;
      mouse.drop();
      updateFlag = true;
    } else {
      tools[i].render(); // 渲染工具
    }
  }
}

// 处理鼠标移动
function handleMouseMovement() {
  if (mouse.holding && frameCount % 2 === 0) {
    let moved = false;
    if (keyIsDown(UP_ARROW)) {
      mouse.holding.setPos(mouse.holding.pos.x, mouse.holding.pos.y - 1);
      moved = true;
    }
    if (keyIsDown(DOWN_ARROW)) {
      mouse.holding.setPos(mouse.holding.pos.x, mouse.holding.pos.y + 1);
      moved = true;
    }
    if (keyIsDown(LEFT_ARROW)) {
      mouse.holding.setPos(mouse.holding.pos.x - 1, mouse.holding.pos.y);
      moved = true;
    }
    if (keyIsDown(RIGHT_ARROW)) {
      mouse.holding.setPos(mouse.holding.pos.x + 1, mouse.holding.pos.y);
      moved = true;
    }
    if (moved) updateFlag = true;
  }
}

// 处理键盘按键事件
function keyPressed(e) {
  if (mouse.holding) {
    if (e.key === "Delete") {
      mouse.delete(); // 删除当前抓取的对象
    } else if (e.key === "D") {
      let n = mouse.holding.duplicate(); // 复制当前抓取的对象
      if (mouse.holding.dir) {
        n.setPos(n.pos.x + mouse.holding.dir.x * gridSize / gScale, n.pos.y + mouse.holding.dir.y * gridSize / gScale);
      } else {
        n.setPos(n.pos.x + gridSize / gScale, n.pos.y + gridSize / gScale);
      }

      n.name = mouse.holding.name.includes("Duplicate") ? `${mouse.holding.name}*` : `${mouse.holding.name} Duplicate`;
      mouse.hold(n); // 抓取复制的对象
    }
  }
}
