// 点光源类，继承自圆形类
class PointSource extends Circle {
	constructor(x, y) {
		super(x, y, 5); // 初始化点光源位置和半径
		this.rays = []; // 存储射线的数组
		this.updateFlag = true; // 更新标志
	}

	setPos(x, y) {
		this.pos.set(x, y); // 设置点光源的位置
	}

	render() {
		this.rays.forEach(ray => ray.render()); // 渲染所有射线

		fill(255, 0, 0);
		noStroke();
		rectMode(CENTER);
		rect(this.pos.x, this.pos.y, this.r * 1.5, this.r * 1.5); // 绘制点光源的矩形表示

		if (mouse.isHolding(this) && this.dir) {
			rect(this.pos.x + this.dir.x * 20, this.pos.y + this.dir.y * 20, this.r, this.r); // 绘制方向指示
		}
	}

	handle(objects) {
		this.rays.forEach(ray => ray.handle(objects)); // 处理射线与场景中物体的交互
	}
}

// 射线光源类，继承自点光源类
class RaySource extends PointSource {
	constructor(x, y, angle, fill) {
		super(x, y); // 初始化位置
		this.color = fill; // 设置颜色
		this.dir = p5.Vector.fromAngle(angle); // 设置方向
		this.rays.push(new Ray(this.pos, this.dir, this.color)); // 创建一条射线

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
		const n = new RaySource(holder.pos.x, holder.pos.y, 0, color(...colorLevels)); // 创建射线光源
		sources.push(n); // 将其添加到光源数组中
		return n;
	}

	duplicate() {
		const n = new RaySource(this.pos.x, this.pos.y, this.dir.heading(), color(...this.color.levels)); // 复制光源
		sources.push(n); // 将其添加到光源数组中
		return n;
	}

	contains(pt) {
		if (Circle.contains(this.pos.x + this.dir.x * 20, this.pos.y + this.dir.y * 20, this.r, pt.pos.x, pt.pos.y)) {
			return "rotate"; // 检查是否在旋转控制点内
		}
		return Circle.contains(this.pos.x, this.pos.y, this.r, pt.pos.x, pt.pos.y); // 检查是否在光源内
	}

	setDir(target) {
		const dir = p5.Vector.sub(target.pos, this.pos).normalize();
		if (dir.mag() > 0) this.dir.set(dir); // 设置射线方向
	}

	morph(target, tag) {
		if (tag === 'rotate' || tag === 'resize') {
			this.setDir(target); // 根据鼠标位置设置方向
		} else {
			this.pos.set(target.pos.x - target.dis.x, target.pos.y - target.dis.y); // 移动光源
		}
	}
}

// 点光源类，扩展自PointSource，用于生成多个射线
class PointLight extends PointSource {
	constructor(x, y, freq = 10, fill) {
		super(x, y);
		this.r = 4; // 设置光源半径
		this.color = fill; // 设置光源颜色
		this.freq = freq; // 设置射线频率
		this.resetRays(); // 重置射线

		this.properties = [
			{
				onchange: v => { this.freq = parseInt(v); updateFlag = true; this.resetRays(); },
				name: '强度',
				type: 'number',
				tags: el => { el.min = 1; },
				default: () => this.freq,
			},
			{
				onchange: v => { this.color.levels[3] = parseInt(v); updateFlag = true; },
				name: '强度',
				type: 'range',
				tags: el => { el.min = 30; el.max = 255; },
				default: () => this.color.levels[3],
			}
		];
		this.className = PointLight;
	}

	resetRays() {
		this.rays = [];
		const inc = TWO_PI / this.freq; // 计算每条射线之间的角度增量
		for (let i = 0; i <= TWO_PI; i += inc) {
			this.rays.push(new Ray(this.pos, p5.Vector.fromAngle(i), this.color)); // 生成多个射线
		}
	}

	morph(target, tag) {
		if (tag === 'rotate' || tag === 'resize') {
			this.freq = int(p5.Vector.sub(this.pos, target.pos).magSq() / 100); // 计算射线频率
			this.resetRays(); // 重置射线
		} else {
			this.pos.set(target.pos.x - target.dis.x, target.pos.y - target.dis.y); // 移动光源
		}
	}

	static build(holder) {
		const colorLevels = holder.color.levels || [255, 255, 255, 255];
		const n = new PointLight(holder.pos.x, holder.pos.y, 50, color(...colorLevels)); // 创建点光源
		sources.push(n); // 添加到光源数组中
		return n;
	}

	duplicate() {
		const n = new PointLight(this.pos.x, this.pos.y, this.freq, color(...this.color.levels)); // 复制光源
		sources.push(n); // 添加到光源数组中
		return n;
	}
}

// 光束类，用于生成一条射线的束
class Beam {
	constructor(x1, y1, angle, length, freq = 10, fill) {
		this.pos = createVector(x1, y1); // 光束起点
		this.strokeWeight = 4; // 光束线条宽度
		this.length = length; // 光束长度
		this.freq = freq; // 射线频率
		this.color = fill; // 光束颜色

		this.dir = p5.Vector.fromAngle(angle); // 光束方向
		this.displacement = p5.Vector.fromAngle(angle + HALF_PI).mult(length); // 光束的位移向量

		this.rays = []; // 存储射线的数组
		this.className = Beam;

		this.properties = [
			{
				onchange: v => { this.freq = parseInt(v); updateFlag = true; this.resetRays(); },
				name: '强度',
				type: 'number',
				tags: el => { el.min = 1; },
				default: () => this.freq,
			},
			{
				onchange: v => { this.color.levels[3] = parseInt(v); updateFlag = true; },
				name: '强度',
				type: 'range',
				tags: el => { el.min = 30; el.max = 255; },
				default: () => this.color.levels[3],
			}
		];
	}

	render() {
		this.rays.forEach(ray => ray.render()); // 渲染所有射线

		stroke(255);
		strokeWeight(this.strokeWeight);
		line(this.pos.x, this.pos.y, this.pos.x + this.displacement.x, this.pos.y + this.displacement.y); // 绘制光束

		if (mouse.isHolding(this)) {
			fill(255, 0, 0);
			rectMode(CENTER);
			noStroke();
			rect(this.pos.x, this.pos.y, 5, 5); // 绘制光束起点
			fill(0, 0, 255);
			rect(this.pos.x + this.displacement.x, this.pos.y + this.displacement.y, 5, 5); // 绘制光束终点
		}
	}

	setPos(x, y) {
		this.pos.set(x, y); // 设置光束起点位置
	}

	handle(objects) {
		this.rays.forEach(ray => ray.handle(objects)); // 处理射线与场景中物体的交互
	}

	contains(pt) {
		const d1 = dist(pt.pos.x, pt.pos.y, this.pos.x, this.pos.y);
		const d2 = dist(pt.pos.x, pt.pos.y, this.pos.x + this.displacement.x, this.pos.y + this.displacement.y);
		const lineLen = this.displacement.mag();

		if (d1 <= 6) return 'rotate'; // 判断是否在光束起点附近
		if (d2 <= 6) return 'resize'; // 判断是否在光束终点附近

		// 判断点是否在线段上
		return (d1 + d2 >= lineLen - this.strokeWeight / 2 && d1 + d2 <= lineLen + this.strokeWeight / 2);
	}

	setPos(target, off) {
		this.pos.set(target.x - off.x, target.y - off.y); // 设置光束位置
		this.reposRays(); // 重置射线位置
	}

	setDir(target, morph, snapAngle) {
		let displacement = p5.Vector.sub(target, this.pos);
		if (snapAngle) {
			displacement = displacement.heading() % QUARTER_PI === 0 ? displacement : p5.Vector.fromAngle(0);
		}
		if (displacement.mag() > 0) {
			if (!morph) {
				displacement.setMag(this.length); // 设置光束方向
			} else {
				this.length = displacement.mag(); // 调整光束长度
				const adjustedLength = this.length - this.length % this.freq;
				if (adjustedLength > 0) this.length = adjustedLength;
			}
			this.displacement.set(displacement);

			const dir = this.displacement.copy().rotate(-HALF_PI).normalize();
			this.dir.set(dir);

			morph ? this.resetRays() : this.reposRays(); // 重置或更新射线位置
		}
	}

	reposRays() {
		const inc = 100 / this.freq;
		this.rays.forEach((ray, i) => {
			const v = p5.Vector.add(this.pos, p5.Vector.mult(this.displacement, (i * inc) / this.length));
			ray.pos.set(v.x, v.y); // 更新射线位置
		});
	}

	resetRays() {
		this.rays = [];
		const inc = 100 / this.freq;
		for (let i = 0; i <= this.length; i += inc) {
			const r = new Ray(p5.Vector.add(this.pos, p5.Vector.mult(this.displacement, i / this.length)), this.dir, this.color);
			this.rays.push(r); // 生成新的射线
		}
	}

	static build(holder) {
		const colorLevels = holder.color.levels || [255, 255, 255, 255];
		const n = new Beam(holder.pos.x, holder.pos.y, 0, 10, 10, color(...colorLevels)); // 创建光束
		sources.push(n); // 添加到光源数组中
		return n;
	}

	duplicate() {
		const n = new Beam(this.pos.x, this.pos.y, this.dir.heading(), this.length, this.freq, color(...this.color.levels)); // 复制光束
		n.resetRays(); // 重置射线
		sources.push(n); // 添加到光源数组中
		return n;
	}

	morph(target, tag) {
		switch (tag) {
			case 'rotate':
				this.setDir(target.pos, false, keyIsDown(16)); // 设置光束方向
				break;
			case 'resize':
				this.setDir(target.pos, true, keyIsDown(16)); // 调整光束大小
				break;
			default:
				this.setPos(target.pos, target.dis); // 移动光束
		}
	}
}
