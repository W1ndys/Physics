document.addEventListener("DOMContentLoaded", () => {
    let chart;
    let simulationStopped = false;
    let engine, render, runner;

    // 启动仿真函数
    function startSimulation() {
        // 如果已有引擎，先清理之前的引擎、渲染器和运行器
        if (engine) {
            Matter.Engine.clear(engine);
            Matter.Render.stop(render);
            Matter.Runner.stop(runner);
        }

        const initialVelocity = parseFloat(document.getElementById('initialVelocity').value); // 获取初始速度
        const angle = parseFloat(document.getElementById('angle').value) * Math.PI / 180; // 将角度转换为弧度
        const canvas = document.getElementById('simulationCanvas');
        const ctx = canvas.getContext('2d');

        const { Engine, Render, Runner, Bodies, World, Body, Events } = Matter;

        // 创建物理引擎
        engine = Engine.create();
        const world = engine.world;

        // 设置渲染器
        render = Render.create({
            canvas: canvas,
            engine: engine,
            options: {
                width: 800,
                height: 400,
                wireframes: false, // 关闭线框模式
                background: 'white', // 设置背景为白色
            }
        });

        Render.run(render);
        runner = Runner.create();
        Runner.run(runner, engine);

        // 创建地面
        const ground = Bodies.rectangle(100000, 410, 200000, 20, { isStatic: true });
        World.add(world, ground);

        // 创建抛射物
        const projectile = Bodies.circle(0, 380, 20, { frictionAir: 0, restitution: 0 });
        World.add(world, projectile);

        // 计算初始速度的x和y分量
        const velocityX = initialVelocity * Math.cos(angle);
        const velocityY = -initialVelocity * Math.sin(angle);

        // 设置抛射物的速度
        Body.setVelocity(projectile, { x: velocityX, y: velocityY });

        const dataPoints = [{ x: 0, y: 0 }]; // 初始化数据点
        simulationStopped = false;

        const chartCtx = document.getElementById('trajectoryChart').getContext('2d');
        if (chart) {
            chart.destroy();
        }
        // 创建弹道轨迹的图表
        chart = new Chart(chartCtx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: '弹道轨迹',
                    data: dataPoints,
                    borderColor: 'rgba(0, 0, 0, 1)',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    showLine: true,
                }],
            },
            options: {
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `(${context.raw.x.toFixed(2)}, ${context.raw.y.toFixed(2)})`;
                            },
                            labelTextColor: function() {
                                return '#000000';
                            }
                        },
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        borderColor: '#000000',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: '水平距离 (m)',
                        },
                        min: 0,
                        max: 1500,
                    },
                    y: {
                        title: {
                            display: true,
                            text: '垂直距离 (m)',
                        },
                        min: 0,
                        max: 500,
                    },
                },
            },
        });

        // 事件监听器，在每次物理更新后执行
        Events.on(engine, 'afterUpdate', function() {
            if (simulationStopped) return;

            const xPos = projectile.position.x;
            const yPos = 400 - projectile.position.y;

            // 记录抛射物的轨迹点
            if (projectile.position.y < 380 || projectile.velocity.y < 0) {
                dataPoints.push({ x: xPos, y: yPos });
            }

            // 动态调整图表的缩放范围
            chart.options.scales.x.max = Math.max(chart.options.scales.x.max, xPos + 100);
            chart.options.scales.y.max = Math.max(chart.options.scales.y.max, yPos + 100);

            chart.update();

            // 调整视图以跟随抛射物
            const viewWidth = 800;
            const viewHeight = 400;
            const centerX = xPos + viewWidth / 4;
            const centerY = 400 - yPos - viewHeight / 4;

            Render.lookAt(render, {
                min: { x: centerX - viewWidth / 2, y: centerY - viewHeight / 2 },
                max: { x: centerX + viewWidth / 2, y: centerY + viewHeight / 2 }
            });

            // 检查抛射物是否触地
            if (projectile.position.y >= 380 && projectile.velocity.y >= 0 && !simulationStopped) {
                simulationStopped = true;
                updateResults(projectile.position.x);
            }
        });
    }

    // 更新结果显示函数
    function updateResults(x) {
        const landingPoint = {
            x: x.toFixed(2),
            y: 0
        };

        // 显示抛射物的第一次落地点
        document.getElementById('landingPoint').innerText = `第一次落地点：(${landingPoint.x}, ${landingPoint.y})`;

        // 在图表上标记落地点
        chart.data.datasets[0].data.push({
            x: parseFloat(landingPoint.x),
            y: 0,
            radius: 5,
            backgroundColor: 'red'
        });
        chart.update();
    }

    // 为开始按钮添加事件监听器
    document.querySelector('.control-group button').addEventListener('click', startSimulation);
});

// 检查是否为移动设备
function isMobile() {
    return window.matchMedia("(max-width: 767px)").matches;
}

// 检查屏幕方向
function checkOrientation() {
    const warningElement = document.getElementById('orientation-warning');
    if (isMobile() && window.innerHeight > window.innerWidth) {
        // 在移动设备上且为竖屏状态时，显示警告
        warningElement.style.display = 'flex';
    } else {
        // 其他情况，隐藏提示
        warningElement.style.display = 'none';
    }
}

// 在页面加载时和窗口大小变化时检查屏幕方向
window.addEventListener('load', checkOrientation);
window.addEventListener('resize', checkOrientation);
