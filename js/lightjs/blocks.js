class PolygonalBlock {
	constructor(vertices, n = 1.5) {
	  this.vertices = vertices; // 初始化顶点
	  this.segments = this.createSegments(vertices); // 创建边
	  this.pos = this.calculateCentroid(vertices); // 计算中心点
	  this.color = color(255, n / 10 * 255); // 设置颜色
	  this.n = n; // 折射率
	  this.buildMorph = false; // 构建形态标志
	  this.className = PolygonalBlock; // 类名
  
	  this.properties = [ // 属性设置
		{
		  onchange: v => { this.n = parseFloat(v); updateFlag = true; },
		  name: '折射率',
		  type: 'range',
		  tags: el => { el.min = 1; el.max = 3.5; el.step = 0.05; },
		  default: () => this.n,
		}
	  ];
	}
  
	createSegments(vertices) {
	  return vertices.map((v, i) => {
		let nextV = vertices[(i + 1) % vertices.length];
		return new Mirror(v[0], v[1], nextV[0] - v[0], nextV[1] - v[1]); // 创建边段
	  });
	}
  
	calculateCentroid(vertices) {
	  let sumX = vertices.reduce((sum, v) => sum + v[0], 0);
	  let sumY = vertices.reduce((sum, v) => sum + v[1], 0);
	  return createVector(sumX / vertices.length, sumY / vertices.length); // 计算多边形中心
	}
  
	render() {
	  fill(255, map(this.n ** 2, 1, 9, 50, 255)); // 设置填充颜色
	  stroke(255, 0, 0); // 设置描边颜色
	  strokeWeight(3); // 设置描边宽度
	  beginShape();
	  for (let v of this.vertices) {
		vertex(...v); // 绘制顶点
		if (mouse.isHolding(this)) point(...v); // 如果被选中，绘制控制点
	  }
	  endShape();
	}
  
	updateLines() {
	  this.segments.forEach((seg, i) => {
		let v1 = this.vertices[i];
		let v2 = this.vertices[(i + 1) % this.vertices.length];
		seg.pos.set(v1[0], v1[1]); // 更新边的位置
		seg.displacement.set(v2[0] - v1[0], v2[1] - v1[1]); // 更新边的向量
		seg.dir = seg.displacement.copy().normalize(); // 更新边的方向
	  });
	}
  
	contains(pt, isMouse) {
	  let p = pt.pos || pt;
	  if (isMouse !== false) {
		return this.vertices.findIndex(v => Circle.contains(v[0], v[1], 8, p.x, p.y)); // 检查点是否在顶点附近
	  }
	  const ray = new Ray(p, createVector(1, 0)); // 创建射线
	  return ray.doesCollide(this).length % 2 !== 0; // 检查点是否在多边形内
	}
  
	returnRay(ray, pt) {
	  ray.end = pt; // 设置射线终点
	  let i = HALF_PI - ray.dir.angleBetween(pt.line.dir); // 计算入射角
	  return Ray.refract(this.contains(mid(ray.pos, pt), false) ? 'outof' : 'into', ray, pt.line.dir, i, this); // 计算折射光线
	}
  
	setPos(x, y) {
	  let diff = createVector(x, y).sub(this.pos); // 计算位置偏移
	  this.pos.set(x, y); // 设置新位置
	  this.vertices.forEach(v => {
		v[0] += diff.x;
		v[1] += diff.y; // 更新顶点位置
	  });
	  this.updateLines(); // 更新边的位置
	}
  
	morph(target, prop) {
	  if (prop == 'none') return;
	  if (!isNaN(prop)) {
		this.vertices[prop] = [target.pos.x, target.pos.y]; // 更新顶点位置
		this.updateLines(); // 更新边的位置
	  } else {
		this.setPos(target.pos.x - target.dis.x, target.pos.y - target.dis.y); // 更新整体位置
	  }
	}
  
	static build(holder) {
	  if (holder.buildHistory.length > 2) {
		let first = holder.buildHistory[0];
		if (!Circle.contains(first.x, first.y, 10, holder.pos.x, holder.pos.y)) return false; // 如果不在范围内，则返回false
	  } else {
		return false;
	  }
	  let vertices = mouse.buildHistory.map(v => [v.x, v.y]); // 获取构建历史中的顶点
	  let block = new PolygonalBlock(vertices); // 创建多边形块
	  objects.push(block); // 添加到对象数组中
	  return block;
	}
  
	duplicate() {
	  let newVertices = this.vertices.map(v => [...v]); // 复制顶点
	  let block = new PolygonalBlock(newVertices, this.n); // 创建新的多边形块
	  objects.push(block); // 添加到对象数组中
	  return block;
	}
  }
  
  class RectBlock extends PolygonalBlock {
	constructor(x, y, w, h, n) {
	  let vertices = Array.isArray(x) ? x : [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; // 初始化矩形顶点
	  super(vertices, n); // 调用父类构造函数
	  this.buildMorph = true;
	  this.className = RectBlock;
	}
  
	morph(target, prop) {
	  if (prop === 'resize') {
		let [mM, m, mP] = [1, 2, 3];
		this.vertices[mM] = [target.pos.x, this.vertices[mM][1]]; // 更新宽度
		this.vertices[m] = [target.pos.x, target.pos.y]; // 更新对角点位置
		this.vertices[mP] = [this.vertices[mP][0], target.pos.y]; // 更新高度
		this.updateLines(); // 更新边的位置
	  } else {
		super.morph(target, prop); // 调用父类方法
	  }
	}
  
	static build(holder) {
	  let block = new RectBlock(holder.pos.x, holder.pos.y, 5, 5, 1.5); // 创建默认矩形块
	  objects.push(block); // 添加到对象数组中
	  return block;
	}
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
