// 声明全局变量
let engine, render, ball, wall1, wall2, appliedForce;

function project() {
    // 清除之前的渲染
    if (render) {
        Matter.Render.stop(render);
        Matter.World.clear(engine.world);
        Matter.Engine.clear(engine);
        render.canvas.remove();
        render.canvas = null;
        render.context = null;
        render.textures = {};
    }

    // 初始化Matter.js模块
    const Engine = Matter.Engine,
          Render = Matter.Render,
          Runner = Matter.Runner,
          Body = Matter.Body,
          Composite = Matter.Composite,
          World = Matter.World,
          Bodies = Matter.Bodies,
          Vector = Matter.Vector;

    // 创建物理引擎和渲染器
    engine = Engine.create();
    render = Render.create({
        element: document.getElementById('renderport'),
        engine: engine,
        options: {
            width: 800,
            height: 600,
            wireframes: false,
            background: '#0f0f13'
        }
    });

    // 获取用户输入
    const mass = parseFloat(document.getElementById('mass').value);
    const electricField = parseFloat(document.getElementById('efld').value);
    const charge = parseFloat(document.getElementById('chrg').value);
    const direction = document.getElementById('direction').value;
    const velocity = parseFloat(document.getElementById('vel').value);

    // 计算施加的力
    appliedForce = charge * electricField * (direction === 'up' ? -1 : 1);

    // 创建小球和墙壁
    ball = Bodies.circle(20, 300, 5, {
        friction: 0,
        frictionAir: 0.05,
        inverseInertia: 0,
        render: { fillStyle: 'red' }
    });

    wall1 = Bodies.rectangle(400, 0, 800, 20, {
        isStatic: true,
        render: { fillStyle: 'white', strokeStyle: 'white', lineWidth: 3 }
    });

    wall2 = Bodies.rectangle(400, 600, 800, 20, {
        isStatic: true,
        render: { fillStyle: 'white', strokeStyle: 'white', lineWidth: 3 }
    });

    // 禁用重力，设置小球质量和速度
    engine.world.gravity.y = 0;
    Body.setMass(ball, mass);
    Body.setVelocity(ball, { x: velocity, y: 0 });

    // 添加物体到世界
    World.add(engine.world, [ball, wall1, wall2]);

    // 在每次更新前施加力
    Matter.Events.on(engine, 'beforeUpdate', function () {
        Body.applyForce(ball, ball.position, { x: 0, y: appliedForce / mass });
    });

    // 记录并渲染小球的轨迹
    let trail = [];

    Matter.Events.on(render, 'afterRender', function () {
        trail.unshift({
            position: Vector.clone(ball.position),
            speed: ball.speed
        });

        Render.startViewTransform(render);
        render.context.globalAlpha = 0.7;

        for (let i = 0; i < trail.length; i++) {
            const point = trail[i].position;
            const speed = trail[i].speed;
            const hue = 250 + Math.round((1 - Math.min(1, speed / 10)) * 170);
            render.context.fillStyle = `hsl(${hue}, 100%, 55%)`;
            render.context.fillRect(point.x, point.y, 2, 2);
        }

        render.context.globalAlpha = 1;
        Render.endViewTransform(render);

        if (trail.length > 2000) {
            trail.pop();
        }
    });

    // 启动引擎和渲染器
    Engine.run(engine);
    Render.run(render);
}
