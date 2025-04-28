/**
 * キーボード情報フィード機能
 * PWA上で動作するキーボード関連情報収集モジュール
 * バージョン: 4.0.0 - 分割キーボード・エルゴノミクス対応版
 * 
 * 変更履歴:
 * - 4.0.0: 分割キーボード、エルゴノミクス、ブランクキーキャップのフィード追加
 * - 3.1.0: バックグラウンド更新機能追加
 */

// 情報フィードの名前空間
const KeyboardFeed = (() => {
  // プライベート変数
  let _feedItems = [];
  let _lastUpdated = null;
  let _isLoading = false;
  let _useMockData = false; // デバッグモード時にtrueに設定
  let _backgroundUpdateTimer = null; // バックグラウンド更新用タイマー
  let _updateInterval = 30 * 60 * 1000; // 更新間隔（デフォルトは30分）
  let _backgroundUpdateEnabled = false; // バックグラウンド更新の有効/無効
  let _onNewItemsCallbacks = []; // 新しいアイテムを取得したときのコールバック
  
  // プレースホルダー画像パス
  const DEFAULT_IMAGE = './assets/placeholder.jpg';
  
  // フィードソース定義（実際のRSSフィードとAPI）
  const FEED_SOURCES = [
    // 既存のソース
    {
      id: 'kbdfans',
      name: 'KBDfans Blog',
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fkbdfans.com%2Fblogs%2Fnews.atom',
      category: 'keyboard',
      parser: 'rss2json'
    },
    {
      id: 'mechanical_keyboard',
      name: 'Mechanical Keyboard',
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.mechanical-keyboard.org%2Ffeed%2F',
      category: 'keyboard',
      parser: 'rss2json'
    },
    {
      id: 'mechkeys_reddit',
      name: 'r/MechanicalKeyboards',
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.reddit.com%2Fr%2FMechanicalKeyboards%2F.rss',
      category: 'keyboard',
      parser: 'rss2json'
    },
    {
      id: 'mechgroupbuys',
      name: 'Mech Group Buys',
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.mechgroupbuys.com%2Frss',
      category: 'keyboard',
      parser: 'rss2json'
    },
    {
      id: 'keebsnews',
      name: 'Keebs News',
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.keebsnews.com%2Frss',
      category: 'keyboard',
      parser: 'rss2json'
    },
    
    // 分割キーボード関連ソース追加
    {
      id: 'splitkb',
      name: 'SplitKB',
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fsplitkb.com%2Fblogs%2Fnews%2Ffeed.atom',
      category: 'split',
      parser: 'rss2json'
    },
    {
      id: 'ergomech_reddit',
      name: 'r/ErgoMechKeyboards',
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.reddit.com%2Fr%2Fergomechkeyboards%2F.rss',
      category: 'ergonomic',
      parser: 'rss2json'
    },
    {
      id: 'olkb',
      name: 'OLKB',
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Folkb.com%2Fblogs%2Fnews%2Ffeed.atom',
      category: 'split',
      parser: 'rss2json'
    },
    {
      id: 'keeb_io',
      name: 'Keebio',
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fkeeb.io%2Fblogs%2Fnews%2Ffeed.atom',
      category: 'split',
      parser: 'rss2json'
    },
    {
      id: 'littlekeyboards',
      name: 'Little Keyboards',
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Flittlekeyboards.com%2Fblogs%2Fbuild-guides%2Ffeed.atom',
      category: 'split',
      parser: 'rss2json'
    },
    {
      id: 'ergodox',
      name: 'Ergodox EZ',
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fblog.ergodox-ez.com%2Ffeed',
      category: 'ergonomic',
      parser: 'rss2json'
    },
    {
      id: 'corne_reddit',
      name: 'r/crkbd',
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.reddit.com%2Fr%2Fcrkbd%2F.rss',
      category: 'split',
      parser: 'rss2json'
    },
    {
      id: 'blank_keycaps',
      name: 'Blank Keycaps',
      // カスタム検索フィード（実際のURLに置き換える必要あり）
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fnews.google.com%2Frss%2Fsearch%3Fq%3Dblank%2Bkeycaps',
      category: 'blank_keycap',
      parser: 'rss2json'
    },
    {
      id: 'keyboardio',
      name: 'Keyboardio',
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fblog.keyboard.io%2Ffeed',
      category: 'ergonomic',
      parser: 'rss2json'
    }
  ];
  
  // ローカルストレージのキー
  const STORAGE_KEYS = {
    ITEMS: 'kblab_feed_items',
    SAVED: 'kblab_saved_items',
    LAST_UPDATED: 'kblab_feed_lastupdate',
    SETTINGS: 'kblab_feed_settings'
  };
  
  // モックデータ（最小限のプレースホルダー）
  const MOCK_ITEMS = []; // サンプル記事を削除
  
  /**
   * 保存済みアイテムをローカルストレージから読み込む
   * @private
   */
  function _loadSavedItems() {
    try {
      const savedIds = localStorage.getItem(STORAGE_KEYS.SAVED);
      if (savedIds) {
        const ids = JSON.parse(savedIds);
        
        // 保存済みフラグをセット
        _feedItems.forEach(item => {
          if (item) {
            item.saved = ids.includes(item.id);
          }
        });
        
        console.log(`KeyboardFeed: ${ids.length}個の保存済みアイテムを読み込みました`);
      }
    } catch (error) {
      console.error('KeyboardFeed: 保存済みアイテム読み込みエラー', error);
    }
  }
  
  /**
   * 保存済みアイテムをローカルストレージに保存
   * @private
   */
  function _saveSavedItems() {
    try {
      const savedIds = _feedItems
        .filter(item => item && item.saved)
        .map(item => item.id);
        
      localStorage.setItem(STORAGE_KEYS.SAVED, JSON.stringify(savedIds));
      console.log(`KeyboardFeed: ${savedIds.length}個の保存済みアイテムを保存しました`);
    } catch (error) {
      console.error('KeyboardFeed: 保存済みアイテム保存エラー', error);
    }
  }
  
  /**
   * フィードアイテムをローカルストレージに保存
   * @private
   */
  function _saveFeedItems() {
    try {
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(_feedItems));
      localStorage.setItem(STORAGE_KEYS.LAST_UPDATED, new Date().toISOString());
      console.log('KeyboardFeed: フィードアイテムを保存しました');
    } catch (error) {
      console.error('KeyboardFeed: フィードアイテム保存エラー', error);
    }
  }
  
  /**
   * フィードアイテムをローカルストレージから読み込む
   * @private
   */
  function _loadFeedItems() {
    try {
      const storedItems = localStorage.getItem(STORAGE_KEYS.ITEMS);
      if (storedItems) {
        _feedItems = JSON.parse(storedItems);
        
        const lastUpdateStr = localStorage.getItem(STORAGE_KEYS.LAST_UPDATED);
        if (lastUpdateStr) {
          _lastUpdated = new Date(lastUpdateStr);
        }
        
        console.log(`KeyboardFeed: ${_feedItems.length}個のアイテムを読み込みました`);
        return true;
      }
    } catch (error) {
      console.error('KeyboardFeed: フィードアイテム読み込みエラー', error);
    }
    return false;
  }
  
  /**
   * 設定をローカルストレージから読み込む
   * @private
   */
  function _loadSettings() {
    try {
      const settingsData = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (settingsData) {
        const settings = JSON.parse(settingsData);
        
        // 更新間隔を設定（分単位で保存、ミリ秒に変換）
        if (typeof settings.updateInterval === 'number') {
          _updateInterval = settings.updateInterval * 60 * 1000;
        }
        
        // バックグラウンド更新の有効/無効を設定
        if (typeof settings.backgroundUpdateEnabled === 'boolean') {
          _backgroundUpdateEnabled = settings.backgroundUpdateEnabled;
        }
        
        console.log('KeyboardFeed: 設定を読み込みました', {
          updateInterval: _updateInterval / (60 * 1000),
          backgroundUpdateEnabled: _backgroundUpdateEnabled
        });
      }
    } catch (error) {
      console.error('KeyboardFeed: 設定読み込みエラー', error);
    }
  }
  
  /**
   * 設定をローカルストレージに保存
   * @private
   */
  function _saveSettings() {
    try {
      const settings = {
        updateInterval: _updateInterval / (60 * 1000), // ミリ秒から分に変換して保存
        backgroundUpdateEnabled: _backgroundUpdateEnabled
      };
      
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      console.log('KeyboardFeed: 設定を保存しました', settings);
    } catch (error) {
      console.error('KeyboardFeed: 設定保存エラー', error);
    }
  }
  
  /**
   * RSS2JSONのデータをパース
   * @private
   * @param {Object} data RSS2JSONのレスポンス
   * @param {Object} source ソース情報
   * @returns {Array} フィードアイテムの配列
   */
  function _parseRss2Json(data, source) {
    if (!data || !data.items || !Array.isArray(data.items)) {
      console.log(`KeyboardFeed: ${source.name}の有効なアイテムがありません`);
      return [];
    }
    
    // 項目をフィルタリング・マッピング
    return data.items
      .filter(item => {
        // 無効なアイテムをフィルタリング
        return item && item.title && (item.content || item.description);
      })
      .map(item => {
        // 記事の本文からカテゴリを推測
        let category = source.category;
        const title = (item.title || '').toLowerCase();
        const content = (item.content || item.description || '').toLowerCase();
        
        // カテゴリ推測ロジック - 既存のものを拡張
        if (
          title.includes('split') || content.includes('split') ||
          title.includes('分割') || content.includes('分割') ||
          title.includes('corne') || content.includes('corne') ||
          title.includes('crkbd') || content.includes('crkbd') ||
          title.includes('lily58') || content.includes('lily58') ||
          title.includes('sofle') || content.includes('sofle') ||
          title.includes('ergodash') || content.includes('ergodash') ||
          title.includes('ergodox') || content.includes('ergodox') ||
          title.includes('dactyl') || content.includes('dactyl') ||
          title.includes('kyria') || content.includes('kyria') ||
          title.includes('nyquist') || content.includes('nyquist') ||
          title.includes('iris') || content.includes('iris')
        ) {
          category = 'split';
        } else if (
          title.includes('ergonomic') || content.includes('ergonomic') ||
          title.includes('エルゴノミクス') || content.includes('エルゴノミクス') ||
          title.includes('エルゴ') || content.includes('エルゴ') ||
          title.includes('人間工学') || content.includes('人間工学')
        ) {
          category = 'ergonomic';
        } else if (
          title.includes('blank keycap') || content.includes('blank keycap') ||
          title.includes('無刻印') || content.includes('無刻印') ||
          title.includes('ブランク') || content.includes('ブランク')
        ) {
          category = 'blank_keycap';
        } else if (
          title.includes('switch') || content.includes('switch') ||
          title.includes('スイッチ') || content.includes('スイッチ')
        ) {
          category = 'switch';
        } else if (
          title.includes('keycap') || content.includes('keycap') ||
          title.includes('キーキャップ') || content.includes('キーキャップ')
        ) {
          category = 'keycap';
        } else if (
          title.includes('deskmat') || content.includes('deskmat') ||
          title.includes('desk mat') || content.includes('desk mat') ||
          title.includes('デスクマット') || content.includes('デスクマット')
        ) {
          category = 'deskmat';
        } else if (
          title.includes('keyboard') || content.includes('keyboard') ||
          title.includes('キーボード') || content.includes('キーボード')
        ) {
          category = 'keyboard';
        }
        
        // 画像URLの抽出（複数の方法を試行）
        let imageUrl = null;
        
        // 1. サムネイルがあればそれを使用
        if (item.thumbnail && item.thumbnail !== 'self' && item.thumbnail !== 'default') {
          imageUrl = item.thumbnail;
        }
        // 2. コンテンツ内の最初の画像を探す
        else if (item.content) {
          const imgMatches = item.content.match(/<img[^>]+src="([^">]+)"/ig);
          if (imgMatches && imgMatches.length > 0) {
            const firstImgMatch = imgMatches[0].match(/src="([^">]+)"/i);
            if (firstImgMatch && firstImgMatch[1]) {
              imageUrl = firstImgMatch[1];
            }
          }
        }
        // 3. enclosureがあればそれを使用
        else if (item.enclosure && item.enclosure.link) {
          imageUrl = item.enclosure.link;
        }
        
        // カテゴリに応じたプレースホルダー画像
        if (!imageUrl) {
          imageUrl = `./assets/${category}.jpg`;
        }
        
        // HTMLタグを除去してプレーンテキストにする
        const plainContent = _stripHtml(item.content || item.description || '');
        
        // 日付の正規化
        let pubDate = item.pubDate || item.published || item.date || new Date().toISOString();
        try {
          if (!(pubDate instanceof Date) && typeof pubDate === 'string') {
            pubDate = new Date(pubDate).toISOString();
          }
        } catch {
          pubDate = new Date().toISOString();
        }
        
        // リンクの正規化（相対URLを修正）
        let link = item.link;
        if (link && !link.startsWith('http')) {
          // 相対URLをソースドメインに基づいて修正
          const urlObj = new URL(source.url);
          link = `${urlObj.protocol}//${urlObj.hostname}${link.startsWith('/') ? '' : '/'}${link}`;
        }
        
        return {
          id: item.guid || `${source.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          title: item.title,
          date: pubDate,
          content: plainContent,
          url: link,
          image: imageUrl,
          category: category,
          source: source.name,
          saved: false,
          raw: item // 生データを保持（デバッグ用）
        };
      });
  }
  
  /**
   * フィードを特定のソースからフェッチする
   * @private
   * @param {Object} source ソース情報
   * @returns {Promise<Array>} 取得したアイテムの配列を含むPromise
   */
  function _fetchSource(source) {
    return new Promise((resolve, reject) => {
      console.log(`KeyboardFeed: ${source.name}からフィードを取得中...`);
      
      // モックデータモードの場合
      if (_useMockData) {
        setTimeout(() => {
          const mockItems = MOCK_ITEMS.filter(item => 
            source.category === 'all' || item.category === source.category
          );
          console.log(`KeyboardFeed: ${source.name}のモックデータ${mockItems.length}件を返却`);
          resolve(mockItems);
        }, 500);
        return;
      }
      
      // 実際のAPIからデータを取得
      fetch(source.url)
        .then(response => {
          if (!response.ok) {
            throw new Error(`${response.status}: ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          // ソースに応じたパーサーでアイテムを抽出
          const items = _parseSourceData(data, source);
          console.log(`KeyboardFeed: ${source.name}から${items.length}件のアイテムを取得`);
          resolve(items);
        })
        .catch(error => {
          console.error(`KeyboardFeed: ${source.name}からのフェッチに失敗`, error);
          // エラー時は空配列を返す
          resolve([]);
        });
    });
  }

  // ここから先のコードは変更なし（省略）...

  // イニシャライザ（すぐに実行される）
  function _init() {
    console.log('KeyboardFeed: 初期化中...');
    
    try {
      // 設定を読み込む
      _loadSettings();
      
      // ローカルストレージから保存済みアイテムを読み込む
      const loaded = _loadFeedItems();
      
      // アイテムがなければサーバーから取得を試みる
      if (!loaded || _feedItems.length === 0) {
        console.log('KeyboardFeed: 保存データがないためサーバーから取得を開始します');
        // ここでは何もせず、ユーザーが更新ボタンを押したときに取得する
        _feedItems = [];
      }
      
      // 保存済みアイテムの情報を復元
      _loadSavedItems();
      
      // 最終更新日時の設定
      if (!_lastUpdated) {
        _lastUpdated = new Date();
      }
      
      // バックグラウンド更新が有効なら開始
      if (_backgroundUpdateEnabled) {
        _startBackgroundUpdate();
      }
      
      console.log(`KeyboardFeed: ${_feedItems.length}個のアイテムで初期化完了`);
    } catch (error) {
      console.error('KeyboardFeed: 初期化エラー', error);
      // エラー時は最低限の初期化
      _feedItems = [];
      _lastUpdated = new Date();
    }
  }
  
  // 残りのコード（パブリックAPI）...
})();

// モジュールの存在確認用（デバッグ用）
console.log('KeyboardFeed: モジュールが読み込まれました - 分割キーボード対応版');