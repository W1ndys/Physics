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

	// 检查矩形是否与圆相交
	intersectsCircle(x, y, r) {
		const xDist = abs(this.pos.x - x); // 矩形中心与圆心的水平距离
		const yDist = abs(this.pos.y - y); // 矩形中心与圆心的垂直距离
		return (xDist <= this.w || yDist <= this.h) || // 矩形的边与圆的相交情况
			(xDist > (r + this.w) || yDist > (r + this.h)) ? false : // 如果距离过远，则不相交
			(xDist - this.w)**2 + (yDist - this.h)**2 <= r**2; // 否则检查圆角与圆是否相交
	}

	// 检查矩形是否与另一个矩形相交
	intersectsRect(x, y, w, h) {
		return !(x - w > this.pos.x + this.w || x + w < this.pos.x - this.w ||
			y - h > this.pos.y + this.h || y + h < this.pos.y - this.h);
	}

	// 渲染矩形
	render() {
		fill(this.color);
		rectMode(CENTER);
		rect(this.pos.x, this.pos.y, this.w * 2, this.h * 2); // 在中心点绘制矩形
	}

	// 获取矩形的面积
	get area() {
		return this.w * this.h * 4;
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
