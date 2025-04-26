/**
 * キーボード情報フィード機能
 * PWA上で動作するキーボード関連情報収集モジュール
 * バージョン: 1.0.0
 */

// 情報フィードの名前空間
const KeyboardFeed = (() => {
  // プライベート変数
  let _sources = [];
  let _feedItems = [];
  let _lastUpdated = null;
  let _isLoading = false;
  let _categories = ['keyboard', 'switch', 'keycap', 'deskmat'];
  let _onUpdateCallbacks = [];
  
  // ローカルストレージのキー
  const STORAGE_KEYS = {
    SOURCES: 'kblab_feed_sources',
    ITEMS: 'kblab_feed_items',
    LAST_UPDATED: 'kblab_feed_lastupdate',
    SAVED_ITEMS: 'kblab_feed_saved'
  };
  
  // 初期状態の情報ソース
  const DEFAULT_SOURCES = [
    {
      id: 'novelkeys',
      name: 'NovelKeys',
      url: 'novelkeys_feed.json',
      enabled: true,
      category: 'all'
    },
    {
      id: 'kbdfans',
      name: 'KBDfans Blog',
      url: 'kbdfans_feed.json',
      enabled: true,
      category: 'all'
    },
    {
      id: 'switchjp',
      name: 'キースイッチ.jp',
      url: 'switchjp_feed.json',
      enabled: true,
      category: 'switch'
    },
    {
      id: 'yushakobo',
      name: '遊舎工房',
      url: 'yushakobo_feed.json',
      enabled: true,
      category: 'keyboard'
    }
  ];
  
  // モックデータフィード（実際のAPIや更新可能な静的JSONを使用する予定の代わり）
  const MOCK_FEEDS = {
    'novelkeys_feed.json': [
      {
        id: 'nk_1',
        title: 'NK Cream スイッチ再入荷',
        date: '2025-04-12',
        content: 'NovelKeysの人気スイッチ「NK Cream」が再入荷しました。オリジナルのPOMスイッチで、独特のサウンドと感触が特徴です。',
        url: 'https://novelkeys.com/products/cream-switches',
        image: './assets/nk_cream.jpg',
        category: 'switch',
        source: 'NovelKeys'
      },
      {
        id: 'nk_2',
        title: 'GMK Olivia++ グループバイ開始',
        date: '2025-04-10',
        content: '人気のGMK Oliviaキーキャップセットの新バージョン「Olivia++」のグループバイが開始されました。',
        url: 'https://novelkeys.com/products/gmk-olivia',
        image: './assets/gmk_olivia.jpg',
        category: 'keycap',
        source: 'NovelKeys'
      }
    ],
    'kbdfans_feed.json': [
      {
        id: 'kbdfans_1',
        title: 'Tofu84 V2 発売開始',
        date: '2025-04-15',
        content: '人気のTofu84キーボードの新バージョンが登場。ガスケットマウント方式を採用し、打鍵感が大幅に向上しています。',
        url: 'https://kbdfans.com/products/tofu84-v2',
        image: './assets/tofu84v2.jpg',
        category: 'keyboard',
        source: 'KBDfans'
      }
    ],
    'switchjp_feed.json': [
      {
        id: 'sjp_1',
        title: 'Boba U4T スイッチレビュー',
        date: '2025-04-20',
        content: 'タクタイルスイッチの新定番「Boba U4T」の詳細レビュー。強いタクタイル感と特徴的なサウンドが魅力です。',
        url: 'https://keyswitch.jp/review/bobau4t',
        image: './assets/boba_u4t.jpg',
        category: 'switch',
        source: 'キースイッチ.jp'
      }
    ],
    'yushakobo_feed.json': [
      {
        id: 'yushakobo_1',
        title: 'Corne Cherry v4 発表',
        date: '2025-04-22',
        content: '人気の分割キーボード「Corne」の最新バージョンが発表されました。ワイヤレス接続対応が最大の特徴です。',
        url: 'https://yushakobo.jp/products/corne-cherry-v4',
        image: './assets/corne_v4.jpg',
        category: 'keyboard',
        source: '遊舎工房'
      },
      {
        id: 'yushakobo_2',
        title: 'Choc Pro スイッチ入荷',
        date: '2025-04-18',
        content: '薄型キーボード向けの新しいKailh Choc Proスイッチが入荷しました。従来のChocより改良されたデザインです。',
        url: 'https://yushakobo.jp/products/kailh-choc-pro',
        image: './assets/choc_pro.jpg',
        category: 'switch',
        source: '遊舎工房'
      }
    ]
  };
  
  // プレースホルダー画像パス
  const DEFAULT_IMAGE = './assets/placeholder.jpg';
  
  /**
   * 初期化処理
   * @public
   */
  function init() {
    console.log('KeyboardFeed: 初期化中...');
    
    // ソース情報の読み込み
    _loadSources();
    
    // 保存済みアイテムの読み込み
    _loadSavedItems();
    
    // クリーンアップ：古いフィードアイテムの削除（2週間以上経過）
    _cleanupOldItems();
    
    console.log('KeyboardFeed: 初期化完了');
  }
  
  /**
   * 情報ソースをロード
   * @private
   */
  function _loadSources() {
    try {
      const savedSources = localStorage.getItem(STORAGE_KEYS.SOURCES);
      if (savedSources) {
        _sources = JSON.parse(savedSources);
        console.log(`KeyboardFeed: ${_sources.length}個のソースを読み込みました`);
      } else {
        // 初期ソースの設定
        _sources = DEFAULT_SOURCES;
        _saveSources();
        console.log('KeyboardFeed: デフォルトソースを設定しました');
      }
    } catch (error) {
      console.error('KeyboardFeed: ソース読み込みエラー', error);
      _sources = DEFAULT_SOURCES;
    }
  }
  
  /**
   * 情報ソースを保存
   * @private
   */
  function _saveSources() {
    try {
      localStorage.setItem(STORAGE_KEYS.SOURCES, JSON.stringify(_sources));
    } catch (error) {
      console.error('KeyboardFeed: ソース保存エラー', error);
    }
  }
  
  /**
   * フィードアイテムをロード
   * @private
   */
  function _loadFeedItems() {
    try {
      const savedItems = localStorage.getItem(STORAGE_KEYS.ITEMS);
      if (savedItems) {
        _feedItems = JSON.parse(savedItems);
        console.log(`KeyboardFeed: ${_feedItems.length}個のアイテムを読み込みました`);
      }
      
      const lastUpdateStr = localStorage.getItem(STORAGE_KEYS.LAST_UPDATED);
      if (lastUpdateStr) {
        _lastUpdated = new Date(lastUpdateStr);
      }
    } catch (error) {
      console.error('KeyboardFeed: フィードアイテム読み込みエラー', error);
      _feedItems = [];
    }
  }
  
  /**
   * フィードアイテムを保存
   * @private
   */
  function _saveFeedItems() {
    try {
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(_feedItems));
      localStorage.setItem(STORAGE_KEYS.LAST_UPDATED, new Date().toISOString());
    } catch (error) {
      console.error('KeyboardFeed: フィードアイテム保存エラー', error);
    }
  }
  
  /**
   * 保存済みアイテムをロード
   * @private
   */
  function _loadSavedItems() {
    try {
      const savedItemIds = localStorage.getItem(STORAGE_KEYS.SAVED_ITEMS);
      if (savedItemIds) {
        const savedIds = JSON.parse(savedItemIds);
        // 既存のフィードアイテムのsavedフラグを更新
        _feedItems.forEach(item => {
          item.saved = savedIds.includes(item.id);
        });
      }
    } catch (error) {
      console.error('KeyboardFeed: 保存済みアイテム読み込みエラー', error);
    }
  }
  
  /**
   * 保存済みアイテムIDを保存
   * @private
   */
  function _saveSavedItems() {
    try {
      const savedIds = _feedItems.filter(item => item.saved).map(item => item.id);
      localStorage.setItem(STORAGE_KEYS.SAVED_ITEMS, JSON.stringify(savedIds));
    } catch (error) {
      console.error('KeyboardFeed: 保存済みアイテム保存エラー', error);
    }
  }
  
  /**
   * フィードをフェッチして更新
   * @public
   * @returns {Promise} 更新結果のPromise
   */
  function fetchFeeds() {
    if (_isLoading) {
      console.log('KeyboardFeed: 既に読み込み中です');
      return Promise.resolve(false);
    }
    
    _isLoading = true;
    console.log('KeyboardFeed: フィード更新開始');
    
    // 既存のフィードアイテムをロード
    _loadFeedItems();
    
    // ソース毎のフェッチ処理
    const fetchPromises = _sources
      .filter(source => source.enabled)
      .map(source => _fetchSource(source));
    
    return Promise.all(fetchPromises)
      .then(results => {
        // 全てのソースからのアイテムをマージ
        const newItems = results.flat();
        
        // 既存アイテムとの重複を除去
        const existingIds = new Set(_feedItems.map(item => item.id));
        const uniqueNewItems = newItems.filter(item => !existingIds.has(item.id));
        
        if (uniqueNewItems.length > 0) {
          // 新しいアイテムを配列の先頭に追加
          _feedItems = [...uniqueNewItems, ..._feedItems];
          
          // フィードアイテムの保存
          _saveFeedItems();
          
          console.log(`KeyboardFeed: ${uniqueNewItems.length}個の新しいアイテムを追加しました`);
        } else {
          console.log('KeyboardFeed: 新しいアイテムはありませんでした');
        }
        
        _lastUpdated = new Date();
        _isLoading = false;
        
        // 更新通知
        _notifyUpdate();
        
        return uniqueNewItems.length > 0;
      })
      .catch(error => {
        console.error('KeyboardFeed: フェッチエラー', error);
        _isLoading = false;
        return false;
      });
  }
  
  /**
   * 特定のソースからフィードをフェッチ
   * @private
   * @param {Object} source ソース情報
   * @returns {Promise} フェッチ結果のPromise
   */
  function _fetchSource(source) {
    console.log(`KeyboardFeed: ${source.name} からフェッチ中...`);
    
    // 注意: 実際の実装では、ここでソースURLからデータを取得します
    // 今回はモックデータを使用
    return new Promise((resolve) => {
      // モックデータの使用（実際のアプリでは実際のフェッチリクエストになります）
      setTimeout(() => {
        if (MOCK_FEEDS[source.url]) {
          const items = MOCK_FEEDS[source.url];
          console.log(`KeyboardFeed: ${source.name} から ${items.length}個のアイテムを取得`);
          resolve(items);
        } else {
          console.log(`KeyboardFeed: ${source.name} のデータが見つかりません`);
          resolve([]);
        }
      }, 500);
    });
  }
  
  /**
   * フィードアイテムの古いデータをクリーンアップ
   * @private
   */
  function _cleanupOldItems() {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const oldLength = _feedItems.length;
    
    // 保存済みでないかつ2週間以上前のアイテムを削除
    _feedItems = _feedItems.filter(item => {
      const itemDate = new Date(item.date);
      return item.saved || itemDate > twoWeeksAgo;
    });
    
    if (oldLength !== _feedItems.length) {
      console.log(`KeyboardFeed: ${oldLength - _feedItems.length}個の古いアイテムを削除しました`);
      _saveFeedItems();
    }
  }
  
  /**
   * 更新通知を登録されたコールバックに送信
   * @private
   */
  function _notifyUpdate() {
    _onUpdateCallbacks.forEach(callback => {
      try {
        callback(_feedItems);
      } catch (error) {
        console.error('KeyboardFeed: 更新通知コールバックエラー', error);
      }
    });
  }
  
  /**
   * カテゴリーでフィルタリングしたアイテムを取得
   * @public
   * @param {string} category カテゴリー名（'all'ですべて）
   * @param {boolean} savedOnly 保存済みのみ取得する場合true
   * @returns {Array} フィルタリングされたアイテム配列
   */
  function getItems(category = 'all', savedOnly = false) {
    // フィードアイテムが読み込まれていなければロード
    if (_feedItems.length === 0) {
      _loadFeedItems();
    }
    
    return _feedItems.filter(item => {
      const categoryMatch = category === 'all' || item.category === category;
      const savedMatch = !savedOnly || item.saved;
      return categoryMatch && savedMatch;
    });
  }
  
  /**
   * アイテムの保存状態を切り替え
   * @public
   * @param {string} itemId アイテムID
   * @returns {boolean} 新しい保存状態
   */
  function toggleSaveItem(itemId) {
    const item = _feedItems.find(item => item.id === itemId);
    if (item) {
      item.saved = !item.saved;
      _saveSavedItems();
      return item.saved;
    }
    return false;
  }
  
  /**
   * 更新時のコールバックを登録
   * @public
   * @param {Function} callback 更新時に呼び出す関数
   */
  function onUpdate(callback) {
    if (typeof callback === 'function') {
      _onUpdateCallbacks.push(callback);
    }
  }
  
  /**
   * フィードソースの有効/無効を切り替え
   * @public
   * @param {string} sourceId ソースID
   * @param {boolean} enabled 有効にする場合true
   */
  function setSourceEnabled(sourceId, enabled) {
    const source = _sources.find(src => src.id === sourceId);
    if (source) {
      source.enabled = enabled;
      _saveSources();
      return true;
    }
    return false;
  }
  
  /**
   * 新しいフィードソースを追加
   * @public
   * @param {Object} source ソース情報
   * @returns {boolean} 追加成功したらtrue
   */
  function addSource(source) {
    if (!source || !source.id || !source.name || !source.url) {
      return false;
    }
    
    // 重複チェック
    if (_sources.some(src => src.id === source.id)) {
      return false;
    }
    
    _sources.push({
      id: source.id,
      name: source.name,
      url: source.url,
      enabled: true,
      category: source.category || 'all'
    });
    
    _saveSources();
    return true;
  }
  
  /**
   * フィードソースを削除
   * @public
   * @param {string} sourceId ソースID
   * @returns {boolean} 削除成功したらtrue
   */
  function removeSource(sourceId) {
    const initialLength = _sources.length;
    _sources = _sources.filter(source => source.id !== sourceId);
    
    if (_sources.length !== initialLength) {
      _saveSources();
      return true;
    }
    
    return false;
  }
  
  /**
   * 利用可能なすべてのソースを取得
   * @public
   * @returns {Array} ソース情報の配列
   */
  function getSources() {
    return [..._sources];
  }
  
  /**
   * フィードデータをクリア
   * @public
   */
  function clearFeedData() {
    _feedItems = [];
    _saveFeedItems();
    console.log('KeyboardFeed: フィードデータをクリアしました');
  }
  
  /**
   * 最終更新日時を取得
   * @public
   * @returns {Date|null} 最終更新日時またはnull
   */
  function getLastUpdated() {
    return _lastUpdated;
  }
  
  // パブリックAPI
  return {
    init,
    fetchFeeds,
    getItems,
    toggleSaveItem,
    onUpdate,
    getSources,
    setSourceEnabled,
    addSource,
    removeSource,
    clearFeedData,
    getLastUpdated
  };
})();

// 自動初期化
document.addEventListener('DOMContentLoaded', function() {
  KeyboardFeed.init();
});
