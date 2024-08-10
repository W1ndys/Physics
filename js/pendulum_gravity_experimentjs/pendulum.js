// 当文档内容加载完成时执行
document.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('pendulumCanvas');
    const ctx = canvas.getContext('2d');

    let length, angle, gravity = 9.81; // 定义摆长、初始角度和重力加速度
    let angleRad, angularVelocity = 0, angularAcceleration = 0; // 角度（弧度）、角速度和角加速度
    let originX = canvas.width / 2, originY = 50; // 摆的固定点位置
    let pendulumX, pendulumY; // 摆球的位置
    let animationId;
    let timeStep = 0.02; // 时间步长
    let damping = 0.999; // 阻尼系数
    const displayAmplification = 5; // 显示的放大系数

    // 为开始按钮绑定点击事件
    document.getElementById('startButton').addEventListener('click', startSimulation);

    // 启动仿真
    function startSimulation() {
        length = parseFloat(document.getElementById('length').value); // 获取摆长
        angle = parseFloat(document.getElementById('angle').value); // 获取初始角度
        if (angle > 5) {
            alert("初始角度不能超过5°");
            return;
        }
        angleRad = angle * Math.PI / 180; // 将角度转换为弧度
        angularVelocity = 0; // 初始化角速度

        // 如果已有动画帧，则取消它
        if (animationId) {
            cancelAnimationFrame(animationId);
        }

        calculatePeriod(); // 计算摆的周期
        animate(); // 开始动画
    }

    // 计算周期并显示
    function calculatePeriod() {
        const period = 2 * Math.PI * Math.sqrt(length / gravity);
        document.getElementById('periodValue').innerText = period.toFixed(2) + ' s'; // 显示周期
    }

    // 动画函数
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // 清除画布

        // 计算角加速度、角速度和角度
        angularAcceleration = (-gravity / length) * Math.sin(angleRad);
        angularVelocity += angularAcceleration * timeStep;
        angularVelocity *= damping; // 应用阻尼
        angleRad += angularVelocity * timeStep;

        // 计算放大后的角度
        const displayAngleRad = angleRad * displayAmplification;

        // 计算摆球的位置
        pendulumX = originX + length * 100 * Math.sin(displayAngleRad);
        pendulumY = originY + length * 100 * Math.cos(displayAngleRad);

        // 绘制摆杆
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(pendulumX, pendulumY);
        ctx.stroke();

        // 绘制摆球
        ctx.beginPath();
        ctx.arc(pendulumX, pendulumY, 10, 0, Math.PI * 2);
        ctx.fill();

        // 请求下一帧动画
        animationId = requestAnimationFrame(animate);
    }
});
