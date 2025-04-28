/**
 * KeyboardLab Service Worker
 * バージョン: 3.0.0 - 分割キーボード対応版
 * 
 * 変更履歴:
 * - 3.0.0: 分割キーボード・エルゴノミクスキーボード・無刻印キーキャップ対応
 * - 1.2.0: バックグラウンド更新サポート強化、定期的な更新チェック機能
 * - 1.1.0: 情報フィード機能対応
 * - 1.0.0: 初期バージョン
 */

const CACHE_NAME = 'keyboardlab-v3.0.0';
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
  './assets/placeholder.jpg',
  './assets/keyboard.jpg',
  './assets/switch.jpg',
  './assets/keycap.jpg',
  './assets/deskmat.jpg',
  // 新しいカテゴリのプレースホルダー画像
  './assets/split.jpg',
  './assets/ergonomic.jpg',
  './assets/blank_keycap.jpg'
];

// バックグラウンド更新の設定
let bgUpdateTimer = null;
let lastUpdateAttempt = null;
const CHECK_INTERVAL = 15 * 60 * 1000; // 15分ごとにチェック
const UPDATE_KEY = 'kblab_sw_lastupdate';

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
      
      // 定期的な更新チェックを開始
      _startBackgroundUpdateCheck();
      
      return self.clients.claim();
    })
  );
});

// バックグラウンド更新チェックを開始
function _startBackgroundUpdateCheck() {
  // 既存のタイマーがあればクリア
  if (bgUpdateTimer) {
    clearInterval(bgUpdateTimer);
  }
  
  // 最後の更新チェック時刻を取得
  _getLastUpdateTime().then(lastUpdate => {
    lastUpdateAttempt = lastUpdate || new Date();
    
    logDebug(`バックグラウンド更新チェックを開始します (${CHECK_INTERVAL / (60 * 1000)}分間隔)`);
    logDebug(`前回の更新チェック: ${lastUpdateAttempt}`);
    
    // 定期的なチェックを設定
    bgUpdateTimer = setInterval(_checkForUpdates, CHECK_INTERVAL);
    
    // 初回のチェックを実行（少し遅延）
    setTimeout(_checkForUpdates, 30000);
  });
}

// 最後の更新チェック時刻を取得
function _getLastUpdateTime() {
  return new Promise(resolve => {
    // クライアント側のIndexedDBやCacheStorageに保存された値を読み込む
    caches.open(CACHE_NAME).then(cache => {
      cache.match(new Request(`sw-update-timestamp`)).then(response => {
        if (response) {
          response.text().then(timeStr => {
            try {
              resolve(new Date(timeStr));
            } catch {
              resolve(null);
            }
          }).catch(() => resolve(null));
        } else {
          resolve(null);
        }
      }).catch(() => resolve(null));
    }).catch(() => resolve(null));
  });
}

// 最後の更新チェック時刻を保存
function _saveLastUpdateTime(date) {
  const timeStr = date.toISOString();
  
  // キャッシュに保存
  caches.open(CACHE_NAME).then(cache => {
    cache.put(
      new Request(`sw-update-timestamp`),
      new Response(timeStr, {
        headers: { 'Content-Type': 'text/plain' }
      })
    );
  });
  
  return timeStr;
}

// 更新をチェック
async function _checkForUpdates() {
  // 現在時刻を記録
  lastUpdateAttempt = new Date();
  _saveLastUpdateTime(lastUpdateAttempt);
  
  logDebug('フィード更新をチェックしています...');
  
  // クライアントがあるか確認
  const clients = await self.clients.matchAll();
  
  // アクティブなクライアントがなければ、SW自体でチェックを実行
  if (clients.length === 0) {
    logDebug('アクティブなクライアントがありません。サービスワーカーから更新を実行');
    
    // スクリプトファイルに変更がないか確認
    try {
      // keyboard-feed.jsが更新されているか確認
      const feedResponse = await fetch('./keyboard-feed.js', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (feedResponse.ok) {
        // キャッシュを更新
        const cache = await caches.open(CACHE_NAME);
        await cache.put('./keyboard-feed.js', feedResponse);
        logDebug('keyboard-feed.jsのキャッシュを更新しました');
      }
    } catch (error) {
      logDebug('スクリプトファイルの更新チェックに失敗しました: ' + error);
    }
    
    // フィードの更新確認用のURLをフェッチ（実際の実装ではAPIエンドポイントなど）
    // 注: この実装はデモ用で、実際にはサーバーサイドAPIと通信する必要があります
    try {
      const response = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fkbdfans.com%2Fblogs%2Fnews.atom', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (response.ok) {
        logDebug('フィードチェック成功。クライアント再接続時に更新されます');
      } else {
        logDebug('フィードチェック失敗: ' + response.status);
      }
    } catch (error) {
      logDebug('フィードの更新チェックに失敗しました: ' + error);
    }
    
    // 分割キーボード関連のフィードも確認
    try {
      const splitResponse = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.reddit.com%2Fr%2Fergomechkeyboards%2F.rss', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (splitResponse.ok) {
        logDebug('分割キーボードフィードチェック成功');
      } else {
        logDebug('分割キーボードフィードチェック失敗: ' + splitResponse.status);
      }
    } catch (error) {
      logDebug('分割キーボードフィードの更新チェックに失敗しました: ' + error);
    }
  } else {
    // アクティブなクライアントがある場合は、クライアントに更新チェックをメッセージ送信
    logDebug('アクティブなクライアントに更新チェックを依頼します');
    
    clients.forEach(client => {
      client.postMessage({
        action: 'checkUpdate',
        timestamp: lastUpdateAttempt.toISOString()
      });
    });
  }
}

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
      event.request.url.includes('rss2json.com') ||
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
    
    // 最後の更新時刻を更新
    lastUpdateAttempt = new Date();
    _saveLastUpdateTime(lastUpdateAttempt);
    
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ 
        result: 'received',
        timestamp: lastUpdateAttempt.toISOString()
      });
    }
  }
  
  // バックグラウンド更新設定のメッセージ
  if (event.data && event.data.action === 'configBackgroundUpdate') {
    const enabled = !!event.data.enabled;
    logDebug(`バックグラウンド更新設定: ${enabled ? '有効' : '無効'}`);
    
    if (enabled) {
      if (!bgUpdateTimer) {
        _startBackgroundUpdateCheck();
      }
    } else {
      if (bgUpdateTimer) {
        clearInterval(bgUpdateTimer);
        bgUpdateTimer = null;
      }
    }
    
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ 
        result: 'success',
        enabled: enabled
      });
    }
  }
});

// 定期的な同期イベント（Periodic Sync API対応ブラウザ向け）
self.addEventListener('periodicsync', event => {
  if (event.tag === 'feed-update') {
    logDebug('定期的な同期イベント: feed-update');
    event.waitUntil(_checkForUpdates());
  }
});

// プッシュ通知イベント（Push API対応ブラウザ向け）
self.addEventListener('push', event => {
  logDebug('プッシュ通知受信');
  
  let notificationData = {};
  
  try {
    if (event.data) {
      notificationData = event.data.json();
    }
  } catch (e) {
    logDebug('プッシュデータの解析に失敗: ' + e);
  }
  
  // デフォルトの通知内容
  const title = notificationData.title || 'KeyboardLab 更新';
  const options = {
    body: notificationData.body || 'キーボード情報が更新されました',
    icon: './icon-192.png',
    badge: './icon-192.png',
    data: {
      url: notificationData.url || './'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 通知クリック時
self.addEventListener('notificationclick', event => {
  logDebug('通知クリック');
  
  event.notification.close();
  
  const urlToOpen = event.notification.data && event.notification.data.url ?
    event.notification.data.url : './';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // 既存のウィンドウを探す
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // 新しいウィンドウを開く
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

logDebug('Service Worker 初期化完了 - 分割キーボード対応版 v3.0.0');