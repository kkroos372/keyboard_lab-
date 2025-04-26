/**
 * KeyboardLab Service Worker
 * バージョン: 1.1.0 - 情報フィード機能対応
 */

const CACHE_NAME = 'keyboardlab-v1.1.0';
const DEBUG = true;

// キャッシュするアセット
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './feed-style.css',
  './app.js',
  './keyboard-feed.js',
  './feed-ui.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './assets/placeholder.jpg'
];

// デバッグログ
function logDebug(message) {
  if (DEBUG) {
    console.log(`[ServiceWorker] ${message}`);
  }
}

// インストール時
self.addEventListener('install', event => {
  logDebug('インストール開始');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        logDebug(`キャッシュ '${CACHE_NAME}' を開きました`);
        logDebug(`${ASSETS.length}個のファイルをキャッシュします`);
        return cache.addAll(ASSETS);
      })
      .then(() => {
        logDebug('すべてのアセットをキャッシュしました');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[ServiceWorker] キャッシュエラー:', error);
      })
  );
});

// アクティベート時（古いキャッシュの削除）
self.addEventListener('activate', event => {
  logDebug('アクティベート開始');
  
  event.waitUntil(
    caches.keys().then(keyList => {
      logDebug(`既存のキャッシュ: ${keyList.join(', ')}`);
      return Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME) {
            logDebug(`古いキャッシュを削除: ${key}`);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      logDebug('アクティベート完了、コントロール開始');
      return self.clients.claim();
    })
  );
});

// フェッチリクエスト時
self.addEventListener('fetch', event => {
  // ナビゲーションリクエストの処理
  if (event.request.mode === 'navigate') {
    logDebug(`ナビゲーションリクエスト: ${event.request.url}`);
    event.respondWith(
      fetch(event.request).catch(() => {
        logDebug('ナビゲーションリクエストオフライン - キャッシュされたindex.htmlを返します');
        return caches.match('./index.html');
      })
    );
    return;
  }

  // APIリクエストやJSONファイルのリクエストは常にネットワークを優先（情報フィード用）
  if (event.request.url.includes('_feed.json') || 
      event.request.url.includes('/api/') || 
      event.request.url.endsWith('.json')) {
    logDebug(`API/JSONリクエスト: ${event.request.url}`);
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // レスポンスのクローンを作成してキャッシュに保存
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // オフラインの場合はキャッシュを試す
          logDebug(`API/JSONリクエストオフライン - キャッシュを試行: ${event.request.url}`);
          return caches.match(event.request);
        })
    );
    return;
  }

  // 通常のリクエスト - キャッシュファーストの戦略
  logDebug(`通常リクエスト: ${event.request.url}`);
  event.respondWith(
    caches.match(event.request).then(response => {
      // キャッシュにヒットした場合
      if (response) {
        logDebug(`キャッシュからの応答: ${event.request.url}`);
        return response;
      }
      
      // キャッシュにない場合はネットワークから取得
      logDebug(`キャッシュにない - ネットワークから取得: ${event.request.url}`);
      return fetch(event.request)
        .then(networkResponse => {
          // キャッシュできないレスポンスの場合はそのまま返す
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          
          // 取得したレスポンスをキャッシュに追加
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            logDebug(`ネットワークレスポンスをキャッシュに追加: ${event.request.url}`);
            cache.put(event.request, responseToCache);
          });
          
          return networkResponse;
        })
        .catch(error => {
          console.error(`[ServiceWorker] フェッチエラー: ${error}`);
          // 画像リクエストの場合はプレースホルダー画像を返す
          if (event.request.url.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
            logDebug(`画像フェッチ失敗 - プレースホルダーを返します: ${event.request.url}`);
            return caches.match('./assets/placeholder.jpg');
          }
          // その他のリクエストはエラーを表示
          return new Response('ネットワークエラー', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' }
          });
        });
    })
  );
});

// メッセージ受信時
self.addEventListener('message', event => {
  logDebug(`メッセージ受信: ${JSON.stringify(event.data)}`);
  
  // キャッシュクリアのメッセージ
  if (event.data && event.data.action === 'clearCache') {
    logDebug('キャッシュクリアリクエスト受信');
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        logDebug('キャッシュをクリアしました');
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ result: 'success' });
        }
      })
    );
  }
  
  // フィード更新のメッセージ
  if (event.data && event.data.action === 'updateFeed') {
    logDebug('フィード更新リクエスト受信');
    // ここではバックグラウンド更新は実装しない（クライアントサイドで処理）
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ result: 'received' });
    }
  }
});

logDebug('Service Worker 初期化完了 - 情報フィード対応版');
