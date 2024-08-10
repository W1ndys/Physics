class Arc {
	constructor(x, y, r, angleS, angleD) {
		this.pos = createVector(x, y); // 初始化圆弧的中心位置
		this.r = r; // 初始化圆弧的半径
		this.angleS = angleS; // 初始化圆弧的起始角度
		this.angleD = angleD; // 初始化圆弧的角度增量
		this.rStart = p5.Vector.fromAngle(angleS).mult(r); // 计算圆弧起点的向量
		this.rEnd = p5.Vector.fromAngle(angleS + angleD).mult(r); // 计算圆弧终点的向量
		this.strokeWeight = 2; // 设置圆弧的线条宽度
		this.color = color(255, 255, 255, 150); // 设置圆弧的颜色
		this.className = Arc; // 保存类的引用
	}

	// 设置圆弧的位置
	setPos(x, y) {
		this.pos.set(x, y); // 更新圆弧的中心位置
	}

	// 渲染圆弧
	render() {
		noFill(); // 不填充内部颜色
		stroke(this.color); // 设置线条颜色
		strokeWeight(this.strokeWeight); // 设置线条宽度
		arc(this.pos.x, this.pos.y, this.r * 2, this.r * 2, this.angleS, this.angleD + this.angleS); // 绘制圆弧

		// 如果鼠标正在拖动圆弧，显示起点和终点的控制点
		if (mouse.isHolding(this)) {
			rectMode(CENTER);
			noStroke(); // 不绘制线条
			fill(255, 0, 0); // 设置起点的颜色为红色
			rect(this.pos.x + this.rStart.x, this.pos.y + this.rStart.y, 5, 5); // 绘制起点控制点
			fill(0, 255, 0); // 设置终点的颜色为绿色
			rect(this.pos.x + this.rEnd.x, this.pos.y + this.rEnd.y, 5, 5); // 绘制终点控制点
		}
	}

	// 判断点是否在圆弧上
	contains(pt) {
		const p = pt.pos || pt; // 获取要检查的点的坐标
		// 判断是否在起点或终点的控制点内
		if (Circle.contains(this.rStart.x + this.pos.x, this.rStart.y + this.pos.y, 5, p.x, p.y)) return 'rotate';
		if (Circle.contains(this.rEnd.x + this.pos.x, this.rEnd.y + this.pos.y, 5, p.x, p.y)) return 'resize';

		// 计算从圆心到点的向量
		const OP = p5.Vector.sub(p, this.pos);
		const d = OP.magSq(); // 计算距离的平方
		// 判断点是否在圆弧的宽度范围内
		const withinRadius = d >= (this.r - this.strokeWeight) ** 2 && d <= (this.r + this.strokeWeight) ** 2;

		// 返回点是否在圆弧的角度范围内
		return withinRadius && this.withinArc(OP.heading());
	}

	// 判断角度是否在圆弧的角度范围内
	withinArc(angle) {
		angle = (angle + TWO_PI) % TWO_PI; // 确保角度为正数
		const start = this.angleS; // 起始角度
		const end = this.angleS + this.angleD; // 终止角度
		// 判断角度是否在圆弧范围内
		return end > TWO_PI ? angle >= start || angle <= end - TWO_PI : angle >= start && angle <= end;
	}

	// 修改圆弧的形状
	morph(target, tag) {
		const OP = p5.Vector.sub(target.pos, this.pos); // 计算目标点到圆心的向量
		switch (tag) {
			case 'rotate':
				this.angleS = fixAngles(OP.heading())[0]; // 更新起始角度
				this.rStart = OP.setMag(this.r); // 更新起点向量
				this.rEnd = this.rStart.copy().rotate(this.angleD); // 更新终点向量
				break;

			case 'resize':
				this.angleD = fixAngles(OP.heading() - this.angleS)[0]; // 更新角度增量
				this.r = OP.mag(); // 更新半径
				this.rStart.setMag(this.r); // 更新起点向量的大小
				this.rEnd = p5.Vector.fromAngle(this.angleS + this.angleD).mult(this.r); // 更新终点向量
				break;

			default:
				this.pos.set(target.pos.x - target.dis.x, target.pos.y - target.dis.y); // 更新位置
		}
	}

	// 计算光线的反射
	returnRay(ray, pt) {
		const dir = p5.Vector.sub(pt, this.pos).rotate(HALF_PI).normalize(); // 计算反射的方向
		ray.end = pt; // 设置光线的终点
		return Ray.reflect(ray, dir); // 返回反射后的光线
	}

	// 静态方法，用于构建新的圆弧
	static build(holder) {
		if (holder.buildHistory.length < 1) return false; // 如果构建历史为空，返回false
		const startPos = holder.buildHistory[0]; // 获取起始位置
		const radius = p5.Vector.sub(startPos, holder.pos).mag(); // 计算半径
		const startAngle = fixAngles(p5.Vector.sub(startPos, holder.pos).heading() - PI)[0]; // 计算起始角度
		const arc = new Arc(startPos.x, startPos.y, radius, startAngle, 0.1); // 创建新的圆弧对象
		objects.push(arc); // 将新建的圆弧对象添加到objects数组中
		return arc; // 返回新建的圆弧对象
	}

	// 复制当前的圆弧
	duplicate() {
		const copy = new Arc(this.pos.x, this.pos.y, this.r, this.angleS, this.angleD); // 创建圆弧的副本
		objects.push(copy); // 将副本添加到objects数组中
		return copy; // 返回副本
	}
}
