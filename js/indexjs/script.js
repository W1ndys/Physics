// 监听菜单按钮的点击事件，切换主菜单的显示状态
document
  .querySelector(".menu-btn")
  .addEventListener("click", () =>
    document.querySelector(".main-menu").classList.toggle("show")
  );

document.addEventListener("DOMContentLoaded", () => {
  // 为所有的“了解更多”按钮添加点击事件监听器
  document.querySelectorAll('.learn-more-btn').forEach(button => {
    button.addEventListener('click', (event) => {
      event.preventDefault(); // 阻止默认行为（如页面跳转）
      const targetId = event.currentTarget.getAttribute('data-target'); // 获取目标弹窗的ID
      const popup = document.getElementById(targetId); // 查找目标弹窗
      if (popup) {
        popup.classList.add('active'); // 显示弹窗
      }
    });
  });

  // 当点击弹窗外部或按下ESC键时关闭弹窗
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.learn-more-popup') && !event.target.closest('.learn-more-btn')) {
      document.querySelectorAll('.learn-more-popup').forEach(popup => {
        popup.classList.remove('active'); // 隐藏弹窗
      });
    }
  });

  // 可选功能：按下ESC键时关闭弹窗
  document.addEventListener('keydown', (event) => {
    if (event.key === "Escape") {
      document.querySelectorAll('.learn-more-popup').forEach(popup => {
        popup.classList.remove('active'); // 隐藏弹窗
      });
    }
  });
});

  