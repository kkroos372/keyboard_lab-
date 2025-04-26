/**
 * KeyboardLab Service Worker
 * バージョン: 1.0.1
 */

const CACHE_NAME = 'keyboardlab-v1.0.1';
const DEBUG = true;

// キャッシュするアセット
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
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
  logDebug(`フェッチリクエスト: ${event.request.url}`);
  
  // ナビゲーションリクエストの処理
  if (event.request.mode === 'navigate') {
    logDebug('ナビゲーションリクエスト');
    event.respondWith(
      fetch(event.request).catch(() => {
        logDebug('ナビゲーションリクエストオフライン - キャッシュされたindex.htmlを返します');
        return caches.match('./index.html');
      })
    );
    return;
  }

  // 通常のリクエスト - キャッシュファーストの戦略
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
          // ネットワークエラーの場合は適切なフォールバックを返す
          if (event.request.url.endsWith('.png') || 
              event.request.url.endsWith('.jpg') || 
              event.request.url.endsWith('.jpeg')) {
            // 画像リクエストの場合はプレースホルダーや何もしないことも可能
            return new Response('', { status: 400, statusText: 'Image Not Found' });
          }
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
        event.ports[0].postMessage({ result: 'success' });
      })
    );
  }
});

logDebug('Service Worker 初期化完了');