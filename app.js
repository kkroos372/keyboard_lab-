/**
 * KeyboardLab アプリケーションメインスクリプト
 * バージョン: 2.1.0 (FeedUI連携強化版)
 */

// アプリ初期化ログ
console.log('app.js: スクリプト読み込み開始');

// グローバル変数
let isInitialized = false;
let initRetryCount = 0;
const MAX_INIT_RETRY = 3;

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
        
        // 情報タブが選択された場合、フィードUIの初期化をトリガー
        if (tabId === 'info') {
          initFeedUI();
        }
      } else {
        console.error(`app.js: 対応するタブコンテンツが見つかりません: ${tabId}`);
      }
    });
  });
  
  console.log('app.js: タブ初期化完了');
}

// フィードUIの初期化
function initFeedUI() {
  // フィードUIが既に定義されているか確認
  if (typeof FeedUI === 'undefined') {
    console.warn('app.js: FeedUIモジュールが見つかりません。遅延ロードを試みます。');
    
    // 遅延ロードを試みる（最大800ms待機）
    setTimeout(() => {
      if (typeof FeedUI !== 'undefined') {
        console.log('app.js: FeedUIモジュールを遅延ロードしました');
        initFeedUIContent();
      } else {
        console.error('app.js: FeedUIモジュールのロードに失敗しました');
      }
    }, 800);
    return;
  }
  
  // FeedUIが既に読み込まれている場合
  initFeedUIContent();
}

// フィードUIコンテンツの初期化
function initFeedUIContent() {
  if (typeof FeedUI === 'undefined') {
    console.error('app.js: FeedUIモジュールが使用できません');
    return;
  }
  
  // FeedUIが既に初期化されているか確認
  if (typeof FeedUI.isInitialized === 'function' && FeedUI.isInitialized()) {
    console.log('app.js: FeedUIは既に初期化済みです');
    return;
  }
  
  console.log('app.js: FeedUI初期化を開始します');
  const feedContainer = document.getElementById('feed-container');
  
  if (feedContainer) {
    // フィードUIを初期化
    try {
      const result = FeedUI.init('feed-container');
      console.log(`app.js: FeedUI初期化${result ? '成功' : '失敗'}`);
      
      // ロード中プレースホルダーがあれば削除
      const placeholder = document.getElementById('feed-loading-placeholder');
      if (placeholder) {
        placeholder.style.display = 'none';
      }
    } catch (error) {
      console.error('app.js: FeedUI初期化エラー:', error);
    }
  } else {
    console.error('app.js: feed-containerが見つかりません');
  }
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

// 初期化を試みる（リトライ機能付き）
function tryInitApp() {
  try {
    initApp();
  } catch (error) {
    console.error(`app.js: 初期化試行 ${initRetryCount + 1}/${MAX_INIT_RETRY} 失敗:`, error);
    
    if (initRetryCount < MAX_INIT_RETRY) {
      initRetryCount++;
      console.log(`app.js: ${initRetryCount*500}ms後に再試行します`);
      
      // 指数バックオフで再試行
      setTimeout(tryInitApp, initRetryCount * 500);
    } else {
      console.error('app.js: 初期化の最大試行回数に達しました');
      alert('アプリの初期化に失敗しました。ページを再読み込みしてください。');
    }
  }
}

// DOMContentLoadedイベントリスナー - 早めに初期化を行う
document.addEventListener('DOMContentLoaded', function() {
  console.log('app.js: DOMContentLoaded イベント発火');
  // 少し遅延させて初期化（他のスクリプトが読み込まれるのを待つ）
  setTimeout(tryInitApp, 100);
});

// ページロード完了時のバックアップリスナー
window.addEventListener('load', function() {
  console.log('app.js: window.load イベント発火');
  if (!isInitialized) {
    console.warn('app.js: DOMContentLoadedで初期化されていませんでした。再試行します。');
    tryInitApp();
    
    // 情報タブが最初から表示されていれば初期化
    const infoTab = document.getElementById('info');
    if (infoTab && infoTab.classList.contains('active')) {
      console.log('app.js: 情報タブがアクティブなので、FeedUIを初期化します');
      setTimeout(initFeedUI, 300);
    }
  }
});

// エラーハンドリング
window.addEventListener('error', function(event) {
  console.error('app.js: グローバルエラー:', event.error);
});

console.log('app.js: スクリプト読み込み完了');