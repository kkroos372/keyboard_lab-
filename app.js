// タブ切り替え機能
document.addEventListener('DOMContentLoaded', function() {
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // アクティブなタブのクラスを削除
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // クリックされたタブをアクティブにする
      tab.classList.add('active');
      const tabId = tab.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });
  
  // 追加ボタンのイベントリスナー
  const addButtons = document.querySelectorAll('.add-button');
  addButtons.forEach(button => {
    button.addEventListener('click', () => {
      alert('この機能は開発中です。今後のアップデートをお待ちください。');
    });
  });
});