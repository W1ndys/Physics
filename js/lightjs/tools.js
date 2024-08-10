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
