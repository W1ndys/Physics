let mouse;

function buildInterface() {
  // 初始化鼠标对象及其属性
  mouse = {
    pos: createVector(mouseX, mouseY), // 当前鼠标位置
    a: createVector(mouseX, mouseY), // 鼠标按下时的位置
    dis: createVector(0, 0), // 鼠标与选中对象的距离
    mode: 'hand', // 当前模式，默认为手动模式
    handMode: 'single', // 手动模式类型，默认为单选模式
    c: createVector(width / 2, height / 2), // 中心点位置
    buildHistory: [], // 构建历史记录
  };

  // 鼠标抓取对象
  mouse.hold = function(obj, prop) {
    document.getElementById('delete').disabled = false; // 启用删除按钮
    this.holding = obj; // 当前抓取的对象
    document.getElementById('output').value = obj.name || 'Untitled'; // 显示对象名称
    mouse.dis.set(this.pos.x - obj.pos.x, this.pos.y - obj.pos.y); // 计算鼠标与对象的偏移量
    mouse.currProperty = prop; // 当前属性

    if (mouse.holding.properties) {
      const propHolder = document.getElementById('menu-sub');
      propHolder.innerHTML = ''; // 清空属性菜单

      // 创建属性控件
      mouse.holding.properties.forEach((property, i) => {
        const label = document.createTextNode(`${property.name} `);
        propHolder.appendChild(label);
        const input = document.createElement('input');
        property.tags(input);
        input.type = property.type;
        input.value = property.default();
        input.id = i;
        input.addEventListener("input", function(e) {
          property.onchange(e.target.value); // 更新属性值
        });
        propHolder.appendChild(input);
      });
    }
    updateFlag = true; // 标记需要更新
  }

  // 鼠标释放对象
  mouse.drop = function() {
    document.getElementById('menu-sub').innerHTML = ''; // 清空属性菜单
    document.getElementById('delete').disabled = true; // 禁用删除按钮
    document.getElementById('output').value = ''; // 清空输出
    this.holding = false; // 清空当前抓取的对象
    updateFlag = true; // 标记需要更新
  }

  // 删除当前选中的对象
  mouse.delete = function() {
    this.deleteFlag = true; // 标记删除操作
  }

  // 判断是否正在抓取对象
  mouse.isHolding = function(obj) {
    return obj === mouse.holding;
  }

  // 监听颜色选择事件
  document.getElementById('color').addEventListener("change", function(e) {
    mouse.color = color(e.target.value); // 更新鼠标颜色
    if (mouse.mode === 'hand' && mouse.holding && mouse.holding.color) {
      updateFlag = true; // 标记需要更新
      mouse.holding.color.levels = mouse.color.levels; // 更新抓取对象的颜色
    }
  });

  // 监听主选择框的更改事件
  const mainSelect = document.getElementById('main-select');
  mainSelect.addEventListener("change", function(e) {
    const selectedValue = e.target.value;

    if (selectedValue !== 'hand') {
      document.body.style.cursor = "crosshair"; // 更改光标为十字形
      mouse.mode = 'build'; // 切换为构建模式
      mouse.building = options[selectedValue][0]; // 设置当前构建对象
      mouse.buildingName = selectedValue; // 设置构建对象名称
      mouse.drop(); // 清空当前抓取对象
    } else {
      document.body.style.cursor = "move"; // 更改光标为移动形
      mouse.currProperty = ''; // 清空当前属性
      mouse.mode = 'hand'; // 切换为手动模式
    }
    mouse.buildHistory = []; // 重置构建历史
  });

  mainSelect.dispatchEvent(new Event('change')); // 触发选择事件
  document.getElementById('color').dispatchEvent(new Event('change')); // 触发颜色更改事件
}

// 处理鼠标按下事件
function mousePressed() {
  mouse.a.set(mouseX, mouseY); // 更新按下时的鼠标位置
  screen.a.set(screen.pos.x, screen.pos.y); // 更新屏幕位置

  if (screen.contains(mouse)) {
    if (mouse.mode === 'build') {
      const newObj = mouse.building.build(mouse); // 构建新对象
      updateFlag = true;
      mouse.drop();

      if (!newObj) {
        mouse.buildHistory.push(mouse.pos.copy()); // 记录构建历史
        return;
      } else {
        mouse.buildHistory = []; // 重置构建历史
      }

      options[mouse.buildingName][2] += 1; // 更新对象计数
      newObj.name = `${options[mouse.buildingName][1]} ${options[mouse.buildingName][2]}`; // 设置新对象名称

      if (newObj.morph) {
        mouse.holding = newObj; // 设置当前抓取对象
        mouse.currProperty = newObj.buildMorph === false ? 'none' : 'resize'; // 设置属性
        mouse.isBuilding = true; // 标记为正在构建
      }
    } else if (mouse.mode === 'hand') {
      mouse.drop(); // 清空当前抓取对象

      let closestObj = null;
      let closestDistSq = Infinity;
      let closestProp = null;

      // 找到最近的对象
      [...sources, ...tools, ...objects].forEach((item) => {
        const distSq = p5.Vector.sub(mouse.pos, item.pos).magSq();
        const prop = item.contains(mouse);
        if (distSq < closestDistSq && prop) {
          closestDistSq = distSq;
          closestObj = item;
          closestProp = prop;
        }
      });

      if (closestObj) {
        mouse.hold(closestObj, closestProp); // 抓取最近的对象
      }
    }
  }
}

// 处理鼠标拖动事件
function mouseDragged() {
  if (mouse.holding && screen.contains(mouse) && mouse.handMode === 'single') {
    mouse.holding.morph(mouse, mouse.currProperty); // 变形当前抓取的对象
    updateFlag = true;
  }
}

// 处理鼠标释放事件
function mouseReleased() {
  if (mouse.mode === 'build' && mouse.isBuilding) {
    mouse.hold(mouse.holding); // 抓取构建的对象
    mouse.isBuilding = false; // 取消正在构建标志
  }
}

// 对象构建选项
const options = {
  'hand': 'hand', // 手动模式

  'ray': [RaySource, '激光', 0],
  'pointLight': [PointLight, '点光源', 0],
  'beam': [Beam, '光束', 0],

  'mirror': [Mirror, '镜子', 0],
  'void': [Void, '虚空', 0],
  'filter': [Filter, '滤镜', 0],
  'arc': [Arc, '圆弧', 0],
  'lens': [Lens, '透镜', 0],

  'circle': [CircularBlock, '圆形块', 0],
  'polygon': [PolygonalBlock, '多边形', 0],
  'rectblock': [RectBlock, '矩形块', 0],

  'ruler': [Ruler, '尺子', 0],
  'd': [Protractor, '量角器', 0],
};
