let intensityChart;

// 启动实验的主函数
function startExperiment() {
    const slitWidth = document.getElementById('slitWidth').value; // 获取狭缝宽度
    const screenDistance = document.getElementById('screenDistance').value; // 获取屏幕距离
    const wavelength = document.getElementById('wavelength').value; // 获取光波波长

    const data = calculateIntensity(slitWidth, screenDistance, wavelength); // 计算光强分布数据
    drawInterferencePattern(data); // 绘制干涉图样
    drawIntensityChart(data); // 绘制光强分布图
}

// 计算光强分布函数
function calculateIntensity(slitWidth, screenDistance, wavelength) {
    const scale = 10; // 缩放因子
    const lambda = wavelength * 1e-9; // 波长转换为米
    const d = slitWidth * 1e-3; // 狭缝宽度转换为米
    const D = screenDistance; // 屏幕距离
    const k = 2 * Math.PI / lambda; // 波数

    const data = [];
    const labels = [];
    let maxIntensity = 0; // 记录最大光强

    // 计算每个位置的光强
    for (let x = 0; x < 800; x++) {
        const X = (x - 800 / 2) * 1e-6 * scale; // 转换坐标系
        const delta = (d * X) / D; // 相位差
        const intensity = Math.cos(k * delta) ** 2; // 光强计算公式
        data.push({ intensity, x }); // 保存光强和位置数据
        labels.push((X * 1e6).toFixed(2)); // 保存位置标签（微米）
        if (intensity > maxIntensity) {
            maxIntensity = intensity; // 更新最大光强
        }
    }

    return { data, labels, maxIntensity }; // 返回计算结果
}

// 绘制干涉图样
function drawInterferencePattern({ data }) {
    const canvas = document.getElementById('interferenceCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height); // 清除画布

    // 绘制每个点的光强对应的颜色
    data.forEach(point => {
        const brightness = Math.floor(point.intensity * 255); // 计算亮度
        ctx.fillStyle = `rgb(${brightness}, 0, 0)`; // 设置颜色
        ctx.fillRect(point.x, 0, 1, canvas.height); // 绘制竖直线
    });
}

// 绘制光强分布图
function drawIntensityChart({ data, labels, maxIntensity }) {
    const ctx = document.getElementById('intensityChartCanvas').getContext('2d');

    const chartData = data.map(point => point.intensity); // 提取光强数据

    const chartConfig = {
        type: 'line',
        data: {
            labels: labels, // X轴标签
            datasets: [{
                label: '强度分布',
                data: chartData,
                borderColor: 'rgba(255, 0, 0, 1)', // 红色线条
                backgroundColor: 'rgba(255, 0, 0, 0.1)', // 红色背景
                fill: true,
                tension: 0.1, // 曲线张力
            }]
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '位置 (μm)' // X轴标题
                    },
                    grid: {
                        display: false // 不显示网格
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: '强度' // Y轴标题
                    },
                    beginAtZero: true,
                    suggestedMax: maxIntensity, // 最大值
                    grid: {
                        display: false // 不显示网格
                    }
                }
            },
            plugins: {
                legend: {
                    display: false // 不显示图例
                }
            },
            animation: {
                duration: 0 // 无动画
            },
            responsive: true,
            maintainAspectRatio: false // 不保持宽高比
        }
    };

    // 如果已有图表，销毁它
    if (intensityChart) {
        intensityChart.destroy();
    }

    // 创建新的图表
    intensityChart = new Chart(ctx, chartConfig);
}

// 初始实验启动
startExperiment();
