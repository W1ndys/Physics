// 射线类，用于表示光线及其在场景中的行为
class Ray {
	constructor(pos, dir, fill) {
		this.pos = pos; // 射线的起始位置
		this.dir = typeof dir === 'number' ? p5.Vector.fromAngle(dir) : dir; // 射线的方向
		this.children = []; // 存储反射或折射后的子射线
		this.color = fill || color(255, 255, 255); // 射线的颜色
	}

	// 渲染射线及其子射线
	render() {
		stroke(...this.color.levels); // 设置线条颜色
		strokeWeight(1); // 设置线条宽度

		// 计算射线的终点
		const endPos = this.end || this.pos.copy().add(this.dir.copy().mult(2 * screen.w));
		line(this.pos.x, this.pos.y, endPos.x, endPos.y); // 绘制射线

		// 渲染子射线
		this.children.forEach(child => child.render());
	}

	// 处理射线与场景中物体的交互
	handle(objects) {
		this.children = []; // 清空子射线
		this.end = null; // 清空射线终点

		let closest = null; // 最近的交点
		let recordDistSq = Infinity; // 最近交点的距离平方
		let closestObj = null; // 与射线最近的物体

		// 遍历所有物体，检查射线与物体的碰撞
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

		// 如果找到最近的交点，处理反射或折射
		if (closest) {
			const rays = closestObj.returnRay(this, closest);
			if (rays) {
				(Array.isArray(rays) ? rays : [rays]).forEach(ray => {
					this.children.push(ray);
					try {
						if (!calcWarning) ray.handle(objects); // 递归处理子射线
					} catch (err) {
						calcWarning = true; // 捕捉计算错误
					}
				});
			}
		}
	}

	// 检查射线是否与物体碰撞
	doesCollide(obj) {
		if (obj instanceof PolygonalBlock) {
			return obj.segments.map(l => this.collWithLine(l)).filter(p => p);
		} else if (obj instanceof CircularBlock || obj instanceof Arc) {
			const normal = getNormal(obj.pos, this.pos, this.dir.copy());
			const dSq = p5.Vector.sub(normal, obj.pos).magSq();

			if (dSq <= obj.r ** 2) {
				let pts = this.getCircleIntersectPts(obj, dSq, normal);
				if (obj instanceof Arc) {
					pts = pts.filter(pt => obj.withinArc(p5.Vector.sub(pt, obj.pos).heading()));
				}
				return pts.filter(pt => this.withinSegment(pt));
			}
		} else if (obj instanceof Line) {
			return this.collWithLine(obj);
		}
	}

	// 计算射线与圆形物体的交点
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

	// 计算射线与线段的交点
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

	// 检查点是否在线段内
	withinSegment(pt) {
		return ((this.dir.x === 0 || (this.dir.x > 0 ? pt.x >= this.pos.x : pt.x <= this.pos.x)) &&
			(this.dir.y === 0 || (this.dir.y > 0 ? pt.y >= this.pos.y : pt.y <= this.pos.y)));
	}

	// 反射光线
	static reflect(ray, surface) {
		const dd = 2 * (ray.dir.x * surface.x + ray.dir.y * surface.y);
		const ref = createVector(surface.x * dd - ray.dir.x, surface.y * dd - ray.dir.y);
		return new Ray(ray.end, ref, color(...ray.color.levels));
	}

	// 折射光线
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

	// 设置射线的强度（透明度）
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
