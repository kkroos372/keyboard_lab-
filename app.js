/**
 * KeyboardLab アプリケーションメインスクリプト
 * バージョン: 1.0.1 (デバッグ強化版)
 */

// アプリ初期化ログ
console.log('app.js: スクリプト読み込み開始');

// グローバル変数
let isInitialized = false;

// アプリケーション初期化
function initApp() {
  if (isInitialized) {
    console.log('app.js: 既に初期化済みです');
    return;
  }
  
  console.log('app.js: アプリケーション初期化中...');
  
  try {
    // タブ切り替え機能
    initTabs();
    
    // 追加ボタン
    initAddButtons();
    
    // ローカルストレージからデータの読み込み
    loadData();
    
    // デバッグ情報の更新
    updateDebugInfo();
    
    isInitialized = true;
    console.log('app.js: アプリケーション初期化完了');
  } catch (error) {
    console.error('app.js: 初期化エラー:', error);
    alert('アプリの初期化中にエラーが発生しました。詳細はコンソールを確認してください。');
  }
}

// タブ切り替え機能の初期化
function initTabs() {
  console.log('app.js: タブ初期化中...');
  
  const tabs = document.querySelectorAll('.tab');
  console.log(`app.js: タブ要素数: ${tabs.length}`);
  
  if (tabs.length === 0) {
    throw new Error('タブ要素が見つかりません');
  }
  
  tabs.forEach(tab => {
    const tabId = tab.getAttribute('data-tab');
    console.log(`app.js: タブ登録: ${tabId}`);
    
    tab.addEventListener('click', () => {
      console.log(`app.js: タブクリック: ${tabId}`);
      
      // アクティブなタブとコンテンツのクラスを削除
      tabs.forEach(t => t.classList.remove('active'));
      const tabContents = document.querySelectorAll('.tab-content');
      tabContents.forEach(content => content.classList.remove('active'));
      
      // クリックされたタブをアクティブにする
      tab.classList.add('active');
      
      // 対応するコンテンツをアクティブにする
      const targetContent = document.getElementById(tabId);
      if (targetContent) {
        targetContent.classList.add('active');
        console.log(`app.js: タブコンテンツ表示: ${tabId}`);
      } else {
        console.error(`app.js: 対応するタブコンテンツが見つかりません: ${tabId}`);
      }
    });
  });
  
  console.log('app.js: タブ初期化完了');
}

// 追加ボタンの初期化
function initAddButtons() {
  console.log('app.js: 追加ボタン初期化中...');
  
  const addButtons = document.querySelectorAll('.add-button');
  console.log(`app.js: 追加ボタン数: ${addButtons.length}`);
  
  addButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
      console.log(`app.js: 追加ボタンクリック: ${index}`);
      alert('この機能は開発中です。今後のアップデートをお待ちください。');
    });
  });
  
  console.log('app.js: 追加ボタン初期化完了');
}

// データ読み込み（将来的な実装）
function loadData() {
  console.log('app.js: データ読み込み試行中...');
  
  // IndexedDBやLocalStorageからのデータ読み込み（今後実装予定）
  try {
    // ローカルストレージからの読み込みテスト
    const testData = localStorage.getItem('keyboardlab-test');
    console.log(`app.js: テストデータ読み込み: ${testData || 'データなし'}`);
    
    if (!testData) {
      // テスト用データの保存
      localStorage.setItem('keyboardlab-test', 'テストデータ保存成功 ' + new Date().toISOString());
      console.log('app.js: テストデータを保存しました');
    }
  } catch (error) {
    console.error('app.js: ストレージアクセスエラー:', error);
  }
}

// デバッグ情報の更新
function updateDebugInfo() {
  const debugStatus = document.getElementById('debug-status');
  if (debugStatus) {
    debugStatus.textContent = 'JavaScript初期化完了';
  }
  
  // PWAの状態チェック
  if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('app.js: このアプリはPWAとして実行されています');
    document.body.classList.add('pwa-mode');
  } else {
    console.log('app.js: このアプリはブラウザで実行されています');
  }
  
  // Service Workerの状態確認
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      console.log(`app.js: 登録済みService Worker数: ${registrations.length}`);
    });
  }
}

// DOMContentLoadedイベントリスナー
document.addEventListener('DOMContentLoaded', function() {
  console.log('app.js: DOMContentLoaded イベント発火');
  initApp();
});

// ページロード完了時のバックアップリスナー
window.addEventListener('load', function() {
  console.log('app.js: window.load イベント発火');
  if (!isInitialized) {
    console.warn('app.js: DOMContentLoadedで初期化されていませんでした。再試行します。');
    initApp();
  }
});

// エラーハンドリング
window.addEventListener('error', function(event) {
  console.error('app.js: グローバルエラー:', event.error);
});

console.log('app.js: スクリプト読み込み完了');