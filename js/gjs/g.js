// 常量定义
const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');
const temperatureInput = document.getElementById('temperatureInput');
const particleCountInput = document.getElementById('particleCountInput');

// 初始化粒子数量
let NUM_PARTICLES = parseInt(particleCountInput.value);

// 粒子类定义
class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.velocity = { x: 0, y: 0 };
    this.radius = 5;
    this.mass = 1;
  }

  // 更新粒子的状态
  update(temperature) {
    let minVelocity = 0.1;
    let maxVelocity = 1 + temperature / 100;

    if (this.velocity.x === 0 && this.velocity.y === 0) {
      this.velocity.x = getRandomVelocity(minVelocity, maxVelocity);
      this.velocity.y = getRandomVelocity(minVelocity, maxVelocity);
    }

    this.x += this.velocity.x;
    this.y += this.velocity.y;

    // 检测边界碰撞
    if (this.x - this.radius < 0 || this.x + this.radius > canvas.width) {
      this.velocity.x = -this.velocity.x;
    }
    if (this.y - this.radius < 0 || this.y + this.radius > canvas.height) {
      this.velocity.y = -this.velocity.y;
    }

    // 绘制粒子
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'blue';
    ctx.fill();
    ctx.closePath();
  }

  // 获取粒子的速度
  speed() {
    return Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
  }
}

let particles = [];
let animationId;

// 获取随机速度
function getRandomVelocity(min, max) {
  let sign = Math.random() < 0.5 ? -1 : 1;
  return sign * (min + Math.random() * (max - min));
}

// 初始化粒子
function initializeParticles(temperature) {
  particles = [];
  NUM_PARTICLES = parseInt(particleCountInput.value); // 获取输入的粒子数量
  for (let i = 0; i < NUM_PARTICLES; i++) {
    let particle = new Particle(canvas.width * Math.random(), canvas.height * Math.random());
    particles.push(particle);
  }
}

// 检查粒子之间的碰撞
function checkCollisions() {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      let p1 = particles[i];
      let p2 = particles[j];
      let dx = p2.x - p1.x;
      let dy = p2.y - p1.y;
      let distance = Math.sqrt(dx * dx + dy * dy);
      let minDist = p1.radius + p2.radius;

      if (distance < minDist) {
        // 交换速度
        let angle = Math.atan2(dy, dx);
        let sin = Math.sin(angle);
        let cos = Math.cos(angle);

        let v1 = rotate(p1.velocity, sin, cos, true);
        let v2 = rotate(p2.velocity, sin, cos, true);

        let temp = v1.x;
        v1.x = v2.x;
        v2.x = temp;

        let v1F = rotate(v1, sin, cos, false);
        let v2F = rotate(v2, sin, cos, false);

        p1.velocity.x = v1F.x;
        p1.velocity.y = v1F.y;
        p2.velocity.x = v2F.x;
        p2.velocity.y = v2F.y;

        // 确保粒子不重叠
        let overlap = minDist - distance;
        let smallMove = overlap / 2;
        let offsetX = smallMove * cos;
        let offsetY = smallMove * sin;

        p1.x -= offsetX;
        p1.y -= offsetY;
        p2.x += offsetX;
        p2.y += offsetY;
      }
    }
  }
}

// 旋转速度向量
function rotate(velocity, sin, cos, reverse) {
  return {
    x: reverse ? velocity.x * cos + velocity.y * sin : velocity.x * cos - velocity.y * sin,
    y: reverse ? velocity.y * cos - velocity.x * sin : velocity.y * cos + velocity.x * sin
  };
}

// 初始化Chart.js图表，用于粒子速度分布
let particleChart;

function initChart() {
  const ctx = document.getElementById('particleChart').getContext('2d');
  particleChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Array.from({ length: 50 }, (_, i) => i),
      datasets: [{
        data: Array(50).fill(0),
        backgroundColor: 'rgba(0, 0, 255, 0.5)'
      }]
    },
    options: {
      scales: {
        xAxes: [{
          scaleLabel: {
            display: true,
            labelString: '速度 (log)'
          }
        }],
        yAxes: [{
          scaleLabel: {
            display: true,
            labelString: '数目'
          },
          ticks: {
            beginAtZero: true
          }
        }]
      }
    }
  });
}

// 更新Chart.js图表，显示当前粒子速度分布
function updateParticleChart() {
  const speeds = particles.map(p => p.speed());
  const maxSpeed = Math.max(...speeds);
  const bins = Array(50).fill(0);

  speeds.forEach(speed => {
    const index = Math.floor(50 * Math.log(speed + 1) / Math.log(maxSpeed + 1));
    bins[index]++;
  });

  particleChart.data.datasets[0].data = bins;
  particleChart.update();
}

// 初始化ECharts图表，用于速度分布
let speedDistributionChart;

function initECharts() {
  speedDistributionChart = echarts.init(document.getElementById('chartContainer'));
}

// 更新ECharts图表，显示速度分布
function updateECharts(temperature) {
  let data = generateMaxwellBoltzmannDistribution(temperature);
  
  let option = {
    title: {
      text: '粒子速度分布',
      subtext: `温度: ${temperature} K`,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    xAxis: {
      name: '速度 (m/s)',
      type: 'value',
      nameGap: 30
    },
    yAxis: {
      name: '概率密度',
      type: 'value',
      nameGap: 30
    },
    series: [{
      type: 'line',
      data: data,
      smooth: true
    }]
  };
  
  speedDistributionChart.setOption(option);
}

// 生成Maxwell-Boltzmann分布数据
function generateMaxwellBoltzmannDistribution(temperature, numBins = 20) {
  const k = 1.38e-23;  // 玻尔兹曼常数
  const m = 4.65e-26;  // 例子粒子质量
  const factor = Math.sqrt(m / (2 * Math.PI * k * temperature));

  let maxVelocity = 3 * Math.sqrt(k * temperature / m);
  let binWidth = maxVelocity / numBins;

  let velocities = Array.from({ length: numBins }, (_, i) => i * binWidth + binWidth / 2);
  let distribution = velocities.map(v => factor * 4 * Math.PI * v ** 2 * Math.exp(-m * v ** 2 / (2 * k * temperature)));

  let sum = distribution.reduce((a, b) => a + b, 0);
  distribution = distribution.map(d => d / sum);

  return velocities.map((v, i) => [v, distribution[i]]);
}

// 动画函数，更新粒子状态和图表
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => p.update(parseFloat(temperatureInput.value)));
  checkCollisions();
  updateParticleChart(); // 更新Chart.js图表
  updateECharts(parseFloat(temperatureInput.value)); // 更新ECharts图表
  animationId = requestAnimationFrame(animate);
}

// 控制按钮的事件监听器
document.getElementById('startButton').addEventListener('click', () => {
  cancelAnimationFrame(animationId);
  initializeParticles(parseFloat(temperatureInput.value));
  animate();
});

document.getElementById('stopButton').addEventListener('click', () => {
  cancelAnimationFrame(animationId);
});

document.getElementById('resetButton').addEventListener('click', () => {
  cancelAnimationFrame(animationId);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles = [];
  initializeParticles(parseFloat(temperatureInput.value));
  updateParticleChart();
  updateECharts(parseFloat(temperatureInput.value));
});

// 监听粒子数量输入的变化
particleCountInput.addEventListener('change', () => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  initializeParticles(parseFloat(temperatureInput.value));
  updateParticleChart();
  updateECharts(parseFloat(temperatureInput.value));
});

// 页面加载时初始化系统
window.onload = function() {
  initChart(); // 初始化Chart.js图表
  initECharts(); // 初始化ECharts图表
  let initialTemperature = parseFloat(temperatureInput.value);
  initializeParticles(initialTemperature);
  updateParticleChart(); // 更新Chart.js图表
  updateECharts(initialTemperature); // 更新ECharts图表
};
