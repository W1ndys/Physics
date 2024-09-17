// 线段类，用于表示线段及其基本操作
class Line {
	constructor(x1, y1, dx, dy) {
		this.pos = createVector(x1, y1);
		this.displacement = createVector(dx, dy);
		this.dir = this.displacement.copy().normalize();
		this.length = this.displacement.mag();
		this.strokeWeight = 2;
		this.color = color(255, 150);
	}

	// 渲染线段
	render() {
		stroke(...this.color.levels);
		strokeWeight(this.strokeWeight);
		line(this.pos.x, this.pos.y, this.pos.x + this.displacement.x, this.pos.y + this.displacement.y);

		if (mouse.isHolding(this)) this.drawHandles();
	}

	// 绘制线段的控制点
	drawHandles() {
		this._drawHandle(this.pos);
		this._drawHandle(p5.Vector.add(this.pos, this.displacement));
	}

	_drawHandle(position) {
		fill(0, 255, 0);
		noStroke();
		rectMode(CENTER);
		rect(position.x, position.y, this.strokeWeight * 2, this.strokeWeight * 2);
	}

	// 设置线段的起始点位置
	setPos(x, y) {
		this.pos.set(x, y);
	}

	// 检查点是否在线段上
	contains(pt) {
		const d1 = dist(pt.pos.x, pt.pos.y, this.pos.x, this.pos.y);
		const d2 = dist(pt.pos.x, pt.pos.y, this.pos.x + this.displacement.x, this.pos.y + this.displacement.y);
		const tolerance = this.resizer || 6;

		if (d1 <= tolerance) return 'resizeB';
		if (d2 <= tolerance) return 'resize';
		return (d1 + d2 >= this.length - this.strokeWeight / 2 && d1 + d2 <= this.length + this.strokeWeight / 2);
	}

	// 设置线段的方向
	setDir(target, morph = false, snapAngle = false) {
		const dir = p5.Vector.sub(target, this.pos).normalize();
		if (dir.mag() === 0) return;

		this.dir.set(dir);
		this.displacement.set(morph ? p5.Vector.sub(target, this.pos) : this.dir.copy().mult(this.length));
		if (morph) this.length = this.displacement.mag();
	}

	// 变形线段的形状
	morph(target, tag) {
		switch (tag) {
			case 'rotate':
				this.setDir(target.pos, false, keyIsDown(16));
				break;
			case 'resizeB':
				this.pos.set(target.pos.x - target.dis.x, target.pos.y - target.dis.y);
				this.setDir(p5.Vector.add(this.pos, this.displacement), true, keyIsDown(16));
				break;
			case 'resize':
				this.setDir(target.pos, true, keyIsDown(16));
				break;
			default:
				this.pos.set(target.pos.x - target.dis.x, target.pos.y - target.dis.y);
		}
	}
}

// 透镜类，继承自线段类
class Lens extends Line {
	constructor(x1, y1, dx, dy, fLength = 200) {
		super(x1, y1, dx, dy);
		this.color = color(255, 255, 255, 50);
		this.fLength = fLength;
		this.className = Lens;
		this.properties = [{
			onchange: v => { this.fLength = parseInt(v); updateFlag = true; },
			name: '焦距',
			type: 'number',
			tags: el => { el.step = 2; },
			default: () => this.fLength,
		}];
	}

	// 处理射线与透镜的交互
	returnRay(ray, pt) {
		const O = p5.Vector.add(this.pos, p5.Vector.mult(this.displacement, 0.5));
		const angleOfIncidence = this.dir.angleBetween(ray.dir) - HALF_PI;
		const OP = ray.dir.copy().mult(this.fLength / cos(angleOfIncidence));

		ray.end = pt;
		const newDir = OP.sub(p5.Vector.sub(pt, O)).normalize().mult(sign(this.fLength));
		return new Ray(ray.end, newDir, ray.color);
	}

	// 构建透镜对象
	static build(holder) {
		return Lens._build(holder, Lens);
	}

	// 复制当前透镜
	duplicate() {
		return Lens._duplicate(this, Lens);
	}

	static _build(holder, Constructor) {
		const obj = new Constructor(holder.pos.x, holder.pos.y, 5, 5);
		objects.push(obj);
		return obj;
	}

	static _duplicate(instance, Constructor) {
		const duplicate = new Constructor(instance.pos.x, instance.pos.y, instance.displacement.x, instance.displacement.y, instance.fLength);
		objects.push(duplicate);
		return duplicate;
	}
}

// 镜子类，继承自线段类
class Mirror extends Line {
	constructor(x1, y1, dx, dy) {
		super(x1, y1, dx, dy);
		this.color = color(255, 255, 255, 100);
		this.className = Mirror;
	}

	// 处理射线与镜子的反射
	returnRay(ray, pt) {
		ray.end = pt;
		return Ray.reflect(ray, this.dir);
	}

	// 构建镜子对象
	static build(holder) {
		return Lens._build(holder, Mirror);
	}
}

// 虚空类，继承自线段类
class Void extends Line {
	constructor(x1, y1, dx, dy) {
		super(x1, y1, dx, dy);
		this.color = color(255, 0, 0, 100);
		this.className = Void;
	}

	// 处理射线进入虚空
	returnRay(ray, pt) {
		ray.end = pt;
	}

	// 构建虚空对象
	static build(holder) {
		return Lens._build(holder, Void);
	}
}

class Filter extends Line {}

//shape
var Vector = p5.Vector;

// 基础形状类，包含形状的基本属性和方法
class Shape {
	constructor(x, y) {
		this.pos = new Vector(x, y); // 形状的位置
	}

	// 检查当前形状是否与另一个形状相交
	intersects(shape) {
		return Shape.doIntersect(this, shape);
	}

	// 静态方法，根据形状类型判断相交情况
	static doIntersect(shapeA, shapeB) {
		if (shapeB instanceof Rectangle) return shapeA.intersectsRect(shapeB.pos.x, shapeB.pos.y, shapeB.w, shapeB.h);
		if (shapeB instanceof Circle) return shapeA.intersectsCircle(shapeB.pos.x, shapeB.pos.y, shapeB.r);
	}
}

// 矩形类，继承自形状类
class Rectangle extends Shape {
	constructor(x, y, w, h = w, color) {
		super(x, y); // 调用父类构造函数
		this.w = w; // 矩形的宽度
		this.h = h; // 矩形的高度
		this.color = color; // 矩形的颜色
	}

	// 检查点是否在矩形内
	contains(point) {
		return Rectangle.contains(this.pos.x, this.pos.y, this.w, this.h, point.pos.x, point.pos.y);
	}

	// 静态方法，检查点是否在给定的矩形区域内
	static contains(x, y, w, h, px, py) {
		return px >= x - w && px <= x + w && py >= y - h && py <= y + h;
	}
	
}

// 圆形类，继承自形状类
class Circle extends Shape {
	constructor(x, y, r, color) {
		super(x, y); // 调用父类构造函数
		this.r = r; // 圆的半径
		this.color = color; // 圆的颜色
	}

	// 检查点是否在圆内
	contains(point) {
		return Circle.contains(this.pos.x, this.pos.y, this.r, point.pos.x, point.pos.y);
	}

	// 静态方法，检查点是否在给定的圆形区域内
	static contains(x, y, r, px, py) {
		return distSq(x, y, px, py) <= r**2;
	}

	// 检查圆是否与另一个圆相交
	intersectsCircle(x, y, r) {
		return distSq(this.pos.x, this.pos.y, x, y) <= (this.r + r)**2;
	}

	// 检查圆是否与矩形相交
	intersectsRect(x, y, w, h) {
		const xDist = abs(this.pos.x - x); // 圆心与矩形中心的水平距离
		const yDist = abs(this.pos.y - y); // 圆心与矩形中心的垂直距离
		return (xDist <= w || yDist <= h) || // 矩形的边与圆的相交情况
			(xDist > (this.r + w) || yDist > (this.r + h)) ? false : // 如果距离过远，则不相交
			(xDist - w)**2 + (yDist - h)**2 <= this.r**2; // 否则检查圆角与圆是否相交
	}

	// 渲染圆形
	render() {
		noStroke();
		fill(this.color || 150);
		ellipse(this.pos.x, this.pos.y, this.r * 2); // 绘制圆形
	}

	// 绘制圆的轮廓
	stroke() {
		stroke(255);
		noFill();
		ellipse(this.pos.x, this.pos.y, this.r * 2);
	}

	// 获取圆的面积
	get area() {
		return PI * this.r**2;
	}
}

// 计算两点间距离的平方
function distSq(x, y, x2, y2) {
	return (x2 - x)**2 + (y2 - y)**2;
}
class PolygonalBlock {
}

class RectBlock extends PolygonalBlock {
}

class CircularBlock extends Circle {
  constructor(x, y, r, n = 1.5) {
	super(x, y, r); // 调用父类构造函数
	this.n = n; // 折射率
	this.resizer = new p5.Vector(this.r, 0); // 初始化调整器位置
	this.className = CircularBlock;

	this.properties = [ // 属性设置
	  {
		onchange: v => { this.n = parseFloat(v); updateFlag = true; },
		name: '折射率',
		type: 'range',
		tags: el => { el.min = 1; el.max = 3.5; el.step = 0.1; },
		default: () => this.n,
	  }
	];
  }

  render() {
	noStroke();
	fill(255, map(this.n ** 2, 1, 20, 50, 255)); // 设置填充颜色
	ellipse(this.pos.x, this.pos.y, this.r * 2); // 绘制圆
	if (mouse.isHolding(this)) {
	  fill(255, 0, 0);
	  rectMode(CENTER);
	  rect(this.pos.x + this.resizer.x, this.pos.y + this.resizer.y, 5, 5); // 绘制调整点
	  rect(this.pos.x, this.pos.y, 5, 5); // 绘制中心点
	}
  }

  contains(pt, isMouse) {
	let p = pt.pos || pt;
	if (isMouse !== false && Circle.contains(this.pos.x + this.resizer.x, this.pos.y + this.resizer.y, 5, p.x, p.y)) {
	  return 'resize'; // 检查是否在调整点上
	}
	return Circle.contains(this.pos.x, this.pos.y, this.r, p.x, p.y); // 检查是否在圆内
  }

  morph(target, tag) {
	if (tag === 'resize') {
	  let OP = p5.Vector.sub(target.pos, this.pos); // 计算新半径
	  this.resizer = OP; // 更新调整器位置
	  this.r = OP.mag(); // 更新半径
	} else {
	  this.pos.set(target.pos.x - target.dis.x, target.pos.y - target.dis.y); // 更新位置
	}
  }

  returnRay(ray, pt) {
	let dir = p5.Vector.sub(pt, this.pos);
	dir.set(-dir.y, dir.x).div(this.r); // 计算法线方向
	ray.end = pt;
	let i = HALF_PI - ray.dir.angleBetween(dir); // 计算入射角
	return Ray.refract(this.contains(mid(ray.pos, pt), false) ? 'outof' : 'into', ray, dir, i, this); // 计算折射光线
  }

  static build(holder) {
	let block = new CircularBlock(holder.pos.x, holder.pos.y, 10, 1.5); // 创建默认圆形块
	objects.push(block); // 添加到对象数组中
	return block;
  }

  duplicate() {
	let block = new CircularBlock(this.pos.x, this.pos.y, this.r, this.n); // 复制当前圆形块
	objects.push(block); // 添加到对象数组中
	return block;
  }
  
}
class Arc {
}
class Ruler extends Line {
}
class Protractor extends Circle {
}

class Ray {
	constructor(pos, dir, fill) {
		this.pos = pos;
		this.dir = typeof dir === 'number' ? p5.Vector.fromAngle(dir) : dir;
		this.children = [];
		this.color = fill || color(255, 255, 255);
	}

	render() {
		stroke(...this.color.levels);
		strokeWeight(1);
		const endPos = this.end || this.pos.copy().add(this.dir.copy().mult(2 * screen.w));
		line(this.pos.x, this.pos.y, endPos.x, endPos.y);
		this.children.forEach(child => child.render());
	}

	handle(objects) {
		this.children = [];
		this.end = null;

		let closest = null, recordDistSq = Infinity, closestObj = null;

		objects.forEach(object => {
			const points = this.doesCollide(object);
			if (points) {
				(points instanceof Array ? points : [points]).forEach(pt => {
					const distSq = p5.Vector.sub(this.pos, pt).magSq();
					if (distSq < recordDistSq && distSq > 1e-6) {
						recordDistSq = distSq;
						closest = pt;
						closestObj = object;
					}
				});
			}
		});

		if (closest) {
			const rays = closestObj.returnRay(this, closest);
			if (rays) {
				(Array.isArray(rays) ? rays : [rays]).forEach(ray => {
					this.children.push(ray);
					try {
						if (!calcWarning) ray.handle(objects);
					} catch (err) {
						calcWarning = true;
					}
				});
			}
		}
	}

	doesCollide(obj) {
		if (obj instanceof PolygonalBlock) {
			return obj.segments.map(l => this.collWithLine(l)).filter(p => p);
		} else if (obj instanceof CircularBlock || obj instanceof Arc) {
			return this._collideWithCircle(obj);
		} else if (obj instanceof Line) {
			return this.collWithLine(obj);
		}
	}

	_collideWithCircle(obj) {
		const normal = getNormal(obj.pos, this.pos, this.dir.copy());
		const dSq = p5.Vector.sub(normal, obj.pos).magSq();

		if (dSq <= obj.r ** 2) {
			let pts = this.getCircleIntersectPts(obj, dSq, normal);
			if (obj instanceof Arc) {
				pts = pts.filter(pt => obj.withinArc(p5.Vector.sub(pt, obj.pos).heading()));
			}
			return pts.filter(pt => this.withinSegment(pt));
		}
	}

	getCircleIntersectPts(obj, dSq, normal) {
		if (dSq <= 1e-5) {
			const v = this.dir.copy().mult(obj.r);
			return [v.add(obj.pos), v.mult(-1).add(obj.pos)];
		} else {
			const d = sqrt(dSq);
			const a = acos(d / obj.r);
			const baseDir = p5.Vector.sub(normal, obj.pos).normalize().mult(obj.r);
			return [baseDir.copy().rotate(a).add(obj.pos), baseDir.copy().rotate(-a).add(obj.pos)];
		}
	}

	collWithLine(obj) {
		const { x: x1, y: y1 } = obj.pos;
		const { x: x2, y: y2 } = obj.pos.copy().add(obj.displacement);
		const { x: x3, y: y3 } = this.pos;
		const { x: x4, y: y4 } = this.pos.copy().add(this.dir);

		const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
		if (den === 0) return;

		const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
		const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;

		if (t > 0 && t < 1 && u > 0) {
			return createVector(x1 + t * (x2 - x1), y1 + t * (y2 - y1));
		}
	}

	withinSegment(pt) {
		return ((this.dir.x === 0 || (this.dir.x > 0 ? pt.x >= this.pos.x : pt.x <= this.pos.x)) &&
			(this.dir.y === 0 || (this.dir.y > 0 ? pt.y >= this.pos.y : pt.y <= this.pos.y)));
	}

	static reflect(ray, surface) {
		const dd = 2 * (ray.dir.x * surface.x + ray.dir.y * surface.y);
		const ref = createVector(surface.x * dd - ray.dir.x, surface.y * dd - ray.dir.y);
		return new Ray(ray.end, ref, color(...ray.color.levels));
	}

	static refract(func, ray, surface, i, object) {
		let r, refractDir;
		if (func === "into") {
			r = HALF_PI - asin(sin(i) / object.n);
			refractDir = surface.copy().rotate(r);
		} else {
			r = HALF_PI - asin(sin(i) * object.n);
			if (isNaN(r)) return Ray.reflect(ray, surface);
			refractDir = surface.copy().rotate(-r);
		}

		const R0 = ((1 - object.n) / (1 + object.n)) ** 2;
		const reflection = R0 + (1 - R0) * (1 - cos(i)) ** 5;

		const refractedRay = new Ray(ray.end, refractDir, color(...ray.color.levels));
		const reflectedRay = Ray.reflect(ray, surface);

		const rays = [];
		if (refractedRay.setIntensity((1 - reflection) * ray.color.levels[3])) rays.push(refractedRay);
		if (reflectedRay.setIntensity(reflection * ray.color.levels[3])) rays.push(reflectedRay);

		return rays;
	}

	setIntensity(intensity) {
		this.color.levels[3] = intensity;
		return intensity >= 1;
	}
}

// 获取垂直于射线的法线向量
function getNormal(p, a, ab) {
	const ap = p5.Vector.sub(p, a);
	return ab.mult(ap.dot(ab)).add(a);
}

class PointSource extends Circle {
	constructor(x, y) {
		super(x, y, 5);
		this.rays = [];
		this.updateFlag = true;
	}

	setPos(x, y) {
		this.pos.set(x, y);
	}

	render() {
		this.rays.forEach(ray => ray.render());

		fill(255, 0, 0);
		noStroke();
		rectMode(CENTER);
		rect(this.pos.x, this.pos.y, this.r * 1.5, this.r * 1.5);

		if (mouse.isHolding(this) && this.dir) {
			rect(this.pos.x + this.dir.x * 20, this.pos.y + this.dir.y * 20, this.r, this.r);
		}
	}

	handle(objects) {
		this.rays.forEach(ray => ray.handle(objects));
	}
}

class RaySource extends PointSource {
	constructor(x, y, angle, fill) {
		super(x, y);
		this.color = fill;
		this.dir = p5.Vector.fromAngle(angle);
		this.rays.push(new Ray(this.pos, this.dir, this.color));

		this.properties = [
			{
				onchange: v => { this.color.levels[3] = parseInt(v); updateFlag = true; },
				name: '强度',
				type: 'range',
				tags: el => { el.min = 30; el.max = 255; },
				default: () => this.color.levels[3],
			}
		];
		this.className = RaySource;
	}

	static build(holder) {
		const colorLevels = holder.color.levels || [255, 255, 255, 255];
		const n = new RaySource(holder.pos.x, holder.pos.y, 0, color(...colorLevels));
		sources.push(n);
		return n;
	}

	contains(pt) {
		if (Circle.contains(this.pos.x + this.dir.x * 20, this.pos.y + this.dir.y * 20, this.r, pt.pos.x, pt.pos.y)) {
			return "rotate";
		}
		return Circle.contains(this.pos.x, this.pos.y, this.r, pt.pos.x, pt.pos.y);
	}

	setDir(target) {
		const dir = p5.Vector.sub(target.pos, this.pos).normalize();
		if (dir.mag() > 0) this.dir.set(dir);
	}

	morph(target, tag) {
		if (tag === 'rotate' || tag === 'resize') {
			this.setDir(target);
		} else {
			this.pos.set(target.pos.x - target.dis.x, target.pos.y - target.dis.y);
		}
	}
}

class PointLight extends PointSource {}

class Beam {}

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
  background(100,100, 100); // Set background to yellow
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
  'circle': [CircularBlock, '圆形', 0],
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