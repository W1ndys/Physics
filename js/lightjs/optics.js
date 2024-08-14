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
	// 渲染矩形
	render() {
		fill(this.color);
		rectMode(CENTER);
		rect(this.pos.x, this.pos.y, this.w * 2, this.h * 2); // 在中心点绘制矩形
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
//tool
// 尺子类，继承自Line类
class Ruler extends Line {
	constructor(x1, y1, dx, dy, minDiv = 50) {
		super(x1, y1, dx, dy);
		this.angle = this.dir.heading(); // 尺子的角度
		this.strokeWeight = 25 / 2; // 尺子的线条宽度
		this.resizer = 20; // 调整器大小
		this.minDiv = minDiv; // 最小刻度

		this.properties = [
			{
				onchange: v => { this.minDiv = parseInt(v); updateFlag = true; },
				name: '分度',
				type: 'range',
				tags: (el) => { el.min = 30; el.max = 100; el.step = 5; },
				default: () => this.minDiv,
			}
		];
	}

	render() {
		fill(255, 100);
		push();
		noStroke();
		translate(this.pos.x, this.pos.y);
		rotate(this.dir.heading());
		rectMode(CORNER);
		rect(0, -25, this.length, 50); // 绘制尺子主体

		textSize(this.minDiv / 4);

		stroke(255);
		strokeWeight(1);
		fill(255);
		for (let i = 0; i < this.length; i += this.minDiv / 5) {
			if (i % this.minDiv == 0) {
				line(i, -25 + 1, i, -5); // 绘制主要刻度线
				noStroke();
				text(i, i + 2, 0); // 显示刻度值
				stroke(255);
			} else {
				line(i, -25 + 2, i, -15); // 绘制次要刻度线
			}
		}
		pop();
	}

	// 构建新尺子
	static build(holder) {
		let n = new Ruler(holder.pos.x, holder.pos.y, 500, 0);
		tools.push(n);
		return n;
	}

	// 复制尺子
	duplicate() {
		let n = new Ruler(this.pos.x, this.pos.y, this.displacement.x, this.displacement.y, this.minDiv);
		tools.push(n);
		return n;
	}
}

// 量角器类，继承自Circle类
class Protractor extends Circle {

	constructor(x, y, r, minDiv = 30) {
		super(x, y, r);
		this.minDiv = minDiv; // 最小刻度
		this.resizer = new p5.Vector(this.r, 0); // 调整器向量

		this.properties = [
			{
				onchange: v => { this.minDiv = parseFloat(v); updateFlag = true; },
				name: '分度',
				type: 'range',
				tags: (el) => { el.min = 5; el.max = 60; el.step = 5; },
				default: () => this.minDiv,
			}
		];
	}

	// 显示鼠标角度数据
	mouseData() {
		fill(255); noStroke();
		text(floor(degrees(fixAngles(p5.Vector.sub(mouse.pos, this.pos).heading())[0]) * 10) / 10, 140, 40);
	}

	setPos(x, y) {
		this.pos.set(x, y); // 设置量角器位置
	}

	render() {
		strokeWeight(1);
		noStroke();
		fill(255, 100);
		ellipse(this.pos.x, this.pos.y, this.r * 2); // 绘制量角器
		fill(255, 0, 0);
		rectMode(CENTER);
		if (mouse.isHolding(this))
			rect(this.pos.x + this.resizer.x, this.pos.y + this.resizer.y, 5, 5); // 绘制调整器
		rect(this.pos.x, this.pos.y, 5, 5);

		push();
		translate(this.pos.x, this.pos.y);
		stroke(255);
		let size = max(min(this.minDiv / 2, this.r / 4), this.r / 12);
		textSize(size);
		fill(255);

		// 绘制量角器的刻度线和数值
		for (let i = 0; i < 360; i += this.minDiv / 5) {
			if (i % this.minDiv == 0) {
				line(this.r - 1, 0, this.r * 0.85, 0);
				noStroke();
				text(i, this.r * 0.85 - size * 1.5, 5);
				stroke(255);
			} else {
				line(this.r - 1, 0, this.r * 0.9, 0);
			}
			rotate(radians(this.minDiv / 5));
		}

		pop();
	}

	// 判断点是否在量角器内或在调整器上
	contains(pt, isMouse) {
		let p = pt.pos || pt;
		if (isMouse !== false && Circle.contains(this.pos.x + this.resizer.x, this.pos.y + this.resizer.y, 5, p.x, p.y)) {
			return 'resize'; // 检查是否在调整器上
		} else {
			return Circle.contains(this.pos.x, this.pos.y, this.r, p.x, p.y); // 检查是否在量角器内
		}
	}

	// 处理量角器的变形
	morph(target, tag) {
		switch (tag) {
			case 'resize':
				let OP = p5.Vector.sub(target.pos, this.pos);
				this.resizer = OP;
				this.r = OP.mag(); // 调整量角器半径
				this.minDiv = max(floor(1000 / this.r) * 5, 5); // 更新最小刻度
				break;

			default:
				this.pos.set(target.pos.x - target.dis.x, target.pos.y - target.dis.y); // 移动量角器
		}
	}

	// 构建新量角器
	static build(holder) {
		let n = new Protractor(holder.pos.x, holder.pos.y, 150, 30);
		tools.push(n);
		return n;
	}

	// 复制量角器
	duplicate() {
		let n = new Protractor(this.pos.x, this.pos.y, this.r, this.minDiv);
		tools.push(n);
		return n;
	}
}
//ray
// 射线类，用于表示光线及其在场景中的行为
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

	

	
	

