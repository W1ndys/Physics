let grid = false; // 网格状态开关

// 修正角度，将角度规范化到0到TWO_PI之间
function fixAngles(...angles) {
	return angles.map(a => (a + TWO_PI) % TWO_PI);
}

// 复制对象的属性，包括数组、p5.Vector 和 p5.Color 对象
function dupProp(obj) {
	if (Array.isArray(obj)) return obj.map(x => dupProp(x) || x); // 递归复制数组
	if (obj instanceof p5.Vector) return obj.copy(); // 复制p5.Vector对象
	if (obj instanceof p5.Color) return color(obj.levels); // 复制p5.Color对象
	return obj; // 返回对象本身
}

// 计算两点之间的中点
function mid(a, b) {
	return createVector((a.x + b.x) / 2, (a.y + b.y) / 2);
}

// 返回数字的符号
function sign(n) {
	return Math.sign(n);
}

// 设置缩放比例
function setScale(n) {
	updateFlag = true; // 标记需要更新
	gScale = n ? gScale * n : parseFloat(document.getElementById('scale').value); // 更新全局缩放比例
	if (n) document.getElementById('scale').value = gScale; // 更新输入框中的缩放值
	screen.w = (width / 2) / gScale; // 更新屏幕宽度
	screen.h = (height / 2) / gScale; // 更新屏幕高度
}

// 切换网格显示
function toggleGrid() {
	updateFlag = true; // 标记需要更新
	grid = !grid; // 切换网格状态
	document.getElementById('grid').className = grid ? 'green clicked' : 'green'; // 更新网格按钮的样式
}

// 禁止文本选择（防止拖动时选择页面内容）
document.onselectstart = () => false;

// 绘制箭头
function drawArrow(base, vec, color) {
	push(); // 保存当前绘制状态
	stroke(color); // 设置描边颜色
	strokeWeight(3); // 设置描边宽度
	fill(color); // 设置填充颜色
	translate(base.x, base.y); // 将原点移动到箭头的起点
	line(0, 0, vec.x, vec.y); // 绘制箭头的主干
	rotate(vec.heading()); // 旋转到箭头方向
	const arrowSize = 7; // 箭头大小
	translate(vec.mag() - arrowSize, 0); // 移动到箭头头部位置
	triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0); // 绘制箭头头部
	pop(); // 恢复绘制状态
}
