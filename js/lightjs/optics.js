// 线段类，用于表示线段及其基本操作
class Line {
	constructor(x1, y1, dx, dy) {
		this.pos = createVector(x1, y1); // 线段的起始点位置
		this.displacement = createVector(dx, dy); // 线段的位移向量
		this.dir = this.displacement.copy().normalize(); // 线段的方向向量
		this.length = this.displacement.mag(); // 线段的长度
		this.strokeWeight = 2; // 线条的宽度
		this.color = color(255, 150); // 线段的颜色
	}

	// 渲染线段
	render() {
		stroke(...this.color.levels); // 设置线条颜色
		strokeWeight(this.strokeWeight); // 设置线条宽度
		line(this.pos.x, this.pos.y, this.pos.x + this.displacement.x, this.pos.y + this.displacement.y); // 绘制线段

		if (mouse.isHolding(this)) {
			this.drawHandles(); // 绘制控制点
		}
	}

	// 绘制线段的控制点
	drawHandles() {
		fill(0, 255, 0);
		noStroke();
		rectMode(CENTER);
		rect(this.pos.x, this.pos.y, this.strokeWeight * 2, this.strokeWeight * 2); // 绘制起始点控制点
		rect(this.pos.x + this.displacement.x, this.pos.y + this.displacement.y, this.strokeWeight * 2, this.strokeWeight * 2); // 绘制终点控制点
	}

	// 设置线段的起始点位置
	setPos(x, y) {
		this.pos.set(x, y);
	}

	// 检查点是否在线段上
	contains(pt) {
		const d1 = dist(pt.pos.x, pt.pos.y, this.pos.x, this.pos.y);
		const d2 = dist(pt.pos.x, pt.pos.y, this.pos.x + this.displacement.x, this.pos.y + this.displacement.y);
		if (d1 <= (this.resizer || 6)) return 'resizeB'; // 起点附近
		if (d2 <= (this.resizer || 6)) return 'resize'; // 终点附近
		return (d1 + d2 >= this.length - this.strokeWeight / 2 && d1 + d2 <= this.length + this.strokeWeight / 2); // 线段上
	}

	// 设置线段的方向
	setDir(target, morph = false, snapAngle = false) {
		const dir = p5.Vector.sub(target, this.pos).normalize();
		if (dir.mag() === 0) return;
		this.dir.set(dir);
		const displacement = morph ? p5.Vector.sub(target, this.pos) : this.dir.copy().mult(this.length);
		this.displacement.set(displacement);
		if (morph) this.length = this.displacement.mag();
	}

	// 变形线段的形状
	morph(target, tag) {
		switch (tag) {
			case 'rotate':
				this.setDir(target.pos, false, keyIsDown(16));
				break;
			case 'resizeB':
				const end = p5.Vector.add(this.pos, this.displacement);
				this.pos.set(target.pos.x - target.dis.x, target.pos.y - target.dis.y);
				this.setDir(end, true, keyIsDown(16));
				break;
			case 'resize':
				this.setDir(target.pos, true, keyIsDown(16));
				break;
			default:
				this.pos.set(target.pos.x - target.dis.x, target.pos.y - target.dis.y);
		}
	}

	// 复制当前线段
	duplicate() {
		const duplicate = new this.constructor(this.pos.x, this.pos.y, this.displacement.x, this.displacement.y);
		objects.push(duplicate);
		return duplicate;
	}
}

// 透镜类，继承自线段类
class Lens extends Line {
	constructor(x1, y1, dx, dy, fLength = 200) {
		super(x1, y1, dx, dy);
		this.color = color(255, 255, 255, 50); // 透镜的颜色
		this.fLength = fLength; // 焦距
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
		const O = p5.Vector.add(this.pos, p5.Vector.mult(this.displacement, 0.5)); // 透镜的中心
		const angleOfIncidence = this.dir.angleBetween(ray.dir) - HALF_PI; // 入射角
		const OP = ray.dir.copy().mult(this.fLength / cos(angleOfIncidence)); // 透镜焦点向量

		ray.end = pt;
		const newDir = OP.sub(p5.Vector.sub(pt, O)).normalize().mult(sign(this.fLength)); // 计算折射方向
		return new Ray(ray.end, newDir, ray.color); // 返回折射后的射线
	}

	// 构建透镜对象
	static build(holder) {
		const lens = new Lens(holder.pos.x, holder.pos.y, 5, 5);
		objects.push(lens);
		return lens;
	}

	// 复制当前透镜
	duplicate() {
		const duplicate = new Lens(this.pos.x, this.pos.y, this.displacement.x, this.displacement.y, this.fLength);
		objects.push(duplicate);
		return duplicate;
	}
}

// 镜子类，继承自线段类
class Mirror extends Line {
	constructor(x1, y1, dx, dy) {
		super(x1, y1, dx, dy);
		this.color = color(255, 255, 255, 100); // 镜子的颜色
		this.className = Mirror;
	}

	// 处理射线与镜子的反射
	returnRay(ray, pt) {
		ray.end = pt;
		return Ray.reflect(ray, this.dir); // 返回反射后的射线
	}

	// 构建镜子对象
	static build(holder) {
		const mirror = new Mirror(holder.pos.x, holder.pos.y, 5, 5);
		objects.push(mirror);
		return mirror;
	}
}

// 虚空类，继承自线段类
class Void extends Line {
	constructor(x1, y1, dx, dy) {
		super(x1, y1, dx, dy);
		this.color = color(255, 0, 0, 100); // 虚空的颜色
		this.className = Void;
	}

	// 处理射线进入虚空
	returnRay(ray, pt) {
		ray.end = pt; // 射线在虚空中消失
	}

	// 构建虚空对象
	static build(holder) {
		const voidObj = new Void(holder.pos.x, holder.pos.y, 5, 5);
		objects.push(voidObj);
		return voidObj;
	}
}

// 滤镜类，继承自线段类
class Filter extends Line {
	constructor(x1, y1, dx, dy, fill) {
		super(x1, y1, dx, dy);
		fill.levels[3] = 100; // 设置滤镜的透明度
		this.color = fill;
		this.className = Filter;
	}

	// 处理射线与滤镜的交互
	returnRay(ray, pt) {
		ray.end = pt;

		// 计算反射光的颜色和强度
		const reflectedColor = ray.color.levels.map((level, i) => level - this.color.levels[i]);
		const transmittedColor = this.color.levels.map((level, i) => Math.max(level + reflectedColor[i], 0));
		const reflectedIntensity = reflectedColor.reduce((sum, l) => sum + Math.max(l, 0), 0);
		const transmittedIntensity = transmittedColor.reduce((sum, l) => sum + Math.max(l, 0), 0);

		const rays = [];
		if (reflectedIntensity > 0) {
			const reflectedRay = Ray.reflect(ray, this.dir); // 生成反射光线
			reflectedRay.color = color(...reflectedColor, ray.color.levels[3]);
			rays.push(reflectedRay);
		}
		if (transmittedIntensity > 0) {
			const transmittedRay = new Ray(ray.end, ray.dir.copy(), color(...transmittedColor, ray.color.levels[3])); // 生成透射光线
			rays.push(transmittedRay);
		}

		return rays; // 返回处理后的光线数组
	}

	// 构建滤镜对象
	static build(holder) {
		const filter = new Filter(holder.pos.x, holder.pos.y, 5, 5, holder.color);
		objects.push(filter);
		return filter;
	}

	// 复制当前滤镜
	duplicate() {
		const duplicate = new Filter(this.pos.x, this.pos.y, this.displacement.x, this.displacement.y, color(...this.color.levels));
		objects.push(duplicate);
		return duplicate;
	}
}
