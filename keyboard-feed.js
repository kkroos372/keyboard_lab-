/**
 * キーボード情報フィード機能
 * PWA上で動作するキーボード関連情報収集モジュール
 * バージョン: 3.0.0 - ウェブからのデータ取得対応
 */

// 情報フィードの名前空間
const KeyboardFeed = (() => {
  // プライベート変数
  let _feedItems = [];
  let _lastUpdated = null;
  let _isLoading = false;
  
  // プレースホルダー画像パス
  const DEFAULT_IMAGE = './assets/placeholder.jpg';
  
  // カテゴリー別デフォルト画像
  const CATEGORY_IMAGES = {
    'keyboard': './assets/keyboard.jpg',
    'switch': './assets/switch.jpg',
    'keycap': './assets/keycap.jpg',
    'deskmat': './assets/deskmat.jpg',
    'general': DEFAULT_IMAGE
  };
  
  // フィードソース
  const FEED_SOURCES = [
    {
      id: 'geekhack',
      name: 'Geekhack',
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fgeekhack.org%2Findex.php%3Ftype%3Drss%3Baction%3D.xml',
      category: 'keyboard',
      enabled: true
    },
    {
      id: 'kbdfans',
      name: 'KBDfans Blog',
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fkbdfans.com%2Fblogs%2Fnews.atom',
      category: 'keyboard',
      enabled: true
    },
    {
      id: 'reddit_mk',
      name: 'Reddit r/MechanicalKeyboards',
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.reddit.com%2Fr%2FMechanicalKeyboards%2F.rss',
      category: 'general',
      enabled: true
    },
    {
      id: 'drop_mech',
      name: 'Drop Mechanical Keyboards',
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fdrop.com%2Fbuy%2Fmechanical-keyboards%2Ffeed',
      category: 'keyboard',
      enabled: true
    }
  ];
  
  // フォールバック用モックデータ（接続エラー時などに使用）
  const MOCK_ITEMS = [
    {
      id: 'nk_1',
      title: 'NK Cream スイッチ再入荷',
      date: '2025-04-12',
      content: 'NovelKeysの人気スイッチ「NK Cream」が再入荷しました。オリジナルのPOMスイッチで、独特のサウンドと感触が特徴です。通常版に加えて、今回は工場で潤滑済みのバージョンも発売。キー音とスムーズな打鍵感のバランスを追求した人気モデルです。',
      url: 'https://novelkeys.com/products/cream-switches',
      image: DEFAULT_IMAGE,
      category: 'switch',
      source: 'NovelKeys',
      saved: false
    },
    {
      id: 'yushakobo_1',
      title: 'Corne Cherry v4 発表',
      date: '2025-04-22',
      content: '人気の分割キーボード「Corne」の最新バージョンが発表されました。ワイヤレス接続対応が最大の特徴です。nice!nano v2コントローラーを使用することで、Bluetooth接続が可能になりました。',
      url: 'https://yushakobo.jp/products/corne-cherry-v4',
      image: CATEGORY_IMAGES['keyboard'],
      category: 'keyboard',
      source: '遊舎工房',
      saved: false
    }
  ];
  
  // ローカルストレージのキー
  const STORAGE_KEYS = {
    FEED_ITEMS: 'kblab_feed_items',
    SAVED_ITEMS: 'kblab_saved_items',
    LAST_UPDATED: 'kblab_last_updated'
  };
  
  /**
   * ローカルストレージからフィードアイテムを読み込む
   * @private
   */
  function _loadFeedItems() {
    try {
      const storedItems = localStorage.getItem(STORAGE_KEYS.FEED_ITEMS);
      if (storedItems) {
        _feedItems = JSON.parse(storedItems);
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
   * フィードアイテムをローカルストレージに保存
   * @private
   */
  function _saveFeedItems() {
    try {
      localStorage.setItem(STORAGE_KEYS.FEED_ITEMS, JSON.stringify(_feedItems));
      localStorage.setItem(STORAGE_KEYS.LAST_UPDATED, new Date().toISOString());
    } catch (error) {
      console.error('KeyboardFeed: フィードアイテム保存エラー', error);
    }
  }
  
  /**
   * 保存済みアイテムをローカルストレージから読み込む
   * @private
   */
  function _loadSavedItems() {
    try {
      const savedIds = localStorage.getItem(STORAGE_KEYS.SAVED_ITEMS);
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
      const savedIds = _feedItems.filter(item => item && item.saved).map(item => item.id);
      localStorage.setItem(STORAGE_KEYS.SAVED_ITEMS, JSON.stringify(savedIds));
    } catch (error) {
      console.error('KeyboardFeed: 保存済みアイテム保存エラー', error);
    }
  }
  
  /**
   * フィードソースから記事を取得
   * @private
   * @param {Object} source フィードソース情報
   * @returns {Promise<Array>} 取得したアイテムの配列
   */
  function _fetchSourceFeed(source) {
    return new Promise((resolve, reject) => {
      console.log(`KeyboardFeed: ${source.name} からフィードを取得中...`);
      
      fetch(source.url)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP エラー: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          // RSS to JSONサービスのレスポンス形式に合わせてパース
          if (data && data.items && Array.isArray(data.items)) {
            const items = data.items.map(item => _transformFeedItem(item, source));
            console.log(`KeyboardFeed: ${source.name} から ${items.length}個のアイテムを取得`);
            resolve(items);
          } else {
            console.warn(`KeyboardFeed: ${source.name} からアイテムが取得できませんでした`);
            resolve([]);
          }
        })
        .catch(error => {
          console.error(`KeyboardFeed: ${source.name} の取得中にエラー:`, error);
          resolve([]); // エラー時は空配列を返す
        });
    });
  }
  
  /**
   * RSSアイテムを内部形式に変換
   * @private
   * @param {Object} rssItem RSSフィードのアイテム
   * @param {Object} source フィードソース情報
   * @returns {Object} 変換されたアイテム
   */
  function _transformFeedItem(rssItem, source) {
    // ユニークなIDを生成
    const id = `${source.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 画像URLの抽出
    let imageUrl = null;
    
    // RSSアイテムから画像を抽出（様々なフォーマットに対応）
    if (rssItem.thumbnail) {
      imageUrl = rssItem.thumbnail;
    } else if (rssItem.enclosure && rssItem.enclosure.link) {
      imageUrl = rssItem.enclosure.link;
    } else if (rssItem.media && rssItem.media.content) {
      imageUrl = rssItem.media.content;
    } else {
      // 本文から画像URLを抽出する試み
      const imgMatch = rssItem.description && rssItem.description.match(/<img[^>]+src="([^">]+)"/i);
      if (imgMatch && imgMatch[1]) {
        imageUrl = imgMatch[1];
      }
    }
    
    // カテゴリの決定（キーワードに基づく自動分類）
    let category = source.category || 'general';
    
    const title = rssItem.title || '';
    const content = rssItem.description || rssItem.content || '';
    
    // キーワードベースのカテゴリ判定
    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();
    
    if (titleLower.includes('keyboard') || titleLower.includes('キーボード') || 
        contentLower.includes('keyboard') || contentLower.includes('キーボード')) {
      category = 'keyboard';
    } else if (titleLower.includes('switch') || titleLower.includes('スイッチ') || 
               contentLower.includes('switch') || contentLower.includes('スイッチ')) {
      category = 'switch';
    } else if (titleLower.includes('keycap') || titleLower.includes('キーキャップ') || 
               contentLower.includes('keycap') || contentLower.includes('キーキャップ')) {
      category = 'keycap';
    } else if (titleLower.includes('deskmat') || titleLower.includes('デスクマット') || 
               contentLower.includes('deskmat') || contentLower.includes('デスクマット')) {
      category = 'deskmat';
    }
    
    // デフォルト画像の設定
    if (!imageUrl) {
      imageUrl = CATEGORY_IMAGES[category] || DEFAULT_IMAGE;
    }
    
    // 日付の処理
    let pubDate = new Date();
    if (rssItem.pubDate) {
      try {
        pubDate = new Date(rssItem.pubDate);
      } catch (e) {
        console.warn('KeyboardFeed: 日付の解析エラー:', e);
      }
    }
    
    // HTMLタグの除去
    const cleanContent = content.replace(/<\/?[^>]+(>|$)/g, " ").trim();
    
    return {
      id: id,
      title: title,
      content: cleanContent,
      date: pubDate.toISOString().split('T')[0],
      url: rssItem.link || '',
      image: imageUrl,
      category: category,
      source: source.name,
      saved: false
    };
  }
  
  /**
   * URLの検証とフォールバックリンクの設定
   * @private
   * @param {string} url 検証するURL
   * @param {string} category カテゴリ
   * @returns {string} 検証済みURL
   */
  function _validateUrl(url, category) {
    if (!url || typeof url !== 'string' || url === '#') {
      // カテゴリに基づくフォールバックURL
      switch (category) {
        case 'keyboard':
          return 'https://www.mechanical-keyboard.org/';
        case 'switch':
          return 'https://switches.mx/';
        case 'keycap':
          return 'https://keycapsets.com/';
        case 'deskmat':
          return 'https://mechsupply.co.uk/collections/deskmats';
        default:
          return 'https://www.reddit.com/r/MechanicalKeyboards/';
      }
    }
    return url;
  }
  
  /**
   * 画像URLの検証とフォールバック画像の設定
   * @private
   * @param {string} imageUrl 検証する画像URL
   * @param {string} category カテゴリ
   * @returns {string} 検証済み画像URL
   */
  function _validateImageUrl(imageUrl, category) {
    if (!imageUrl || typeof imageUrl !== 'string' || imageUrl === '#') {
      // カテゴリに基づくフォールバック画像
      return CATEGORY_IMAGES[category] || DEFAULT_IMAGE;
    }
    return imageUrl;
  }
  
  /**
   * アイテムデータの検証と修正
   * @private
   * @param {Object} item 検証するアイテム
   * @returns {Object} 検証済みアイテム
   */
  function _validateItem(item) {
    if (!item) return null;
    
    const validItem = {...item};
    
    // 必須フィールドの検証
    validItem.id = item.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    validItem.title = item.title || '無題';
    validItem.date = item.date || new Date().toISOString().split('T')[0];
    validItem.content = item.content || '詳細情報なし';
    validItem.category = item.category || 'general';
    validItem.source = item.source || 'KeyboardLab';
    
    // URL検証
    validItem.url = _validateUrl(item.url, validItem.category);
    
    // 画像URL検証
    validItem.image = _validateImageUrl(item.image, validItem.category);
    
    // 保存状態
    validItem.saved = Boolean(item.saved);
    
    return validItem;
  }
  
  /**
   * 古いフィードアイテムを削除
   * @private
   */
  function _cleanupOldItems() {
    // 30日以上前のアイテムを削除（保存済みは除く）
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const oldCount = _feedItems.length;
    
    _feedItems = _feedItems.filter(item => {
      if (!item) return false;
      if (item.saved) return true;
      
      try {
        const itemDate = new Date(item.date);
        return itemDate >= thirtyDaysAgo;
      } catch (e) {
        return true; // 日付解析エラーの場合は残す
      }
    });
    
    if (oldCount !== _feedItems.length) {
      console.log(`KeyboardFeed: ${oldCount - _feedItems.length}個の古いアイテムを削除しました`);
    }
  }
  
  // イニシャライザ（すぐに実行される）
  function _init() {
    console.log('KeyboardFeed: 初期化中...');
    
    try {
      // ローカルストレージからフィードアイテムを読み込む
      _loadFeedItems();
      
      // 保存済みアイテムの状態を復元
      _loadSavedItems();
      
      // 古いアイテムをクリーンアップ
      _cleanupOldItems();
      
      // アイテムがなければモックデータを使用
      if (_feedItems.length === 0) {
        console.log('KeyboardFeed: 保存されたアイテムがないためモックデータを使用します');
        _feedItems = MOCK_ITEMS.map(item => _validateItem(item)).filter(Boolean);
        _saveFeedItems();
      }
      
      // 最終更新日時の初期化
      if (!_lastUpdated) {
        _lastUpdated = new Date();
      }
      
      console.log(`KeyboardFeed: ${_feedItems.length}個のアイテムで初期化完了`);
    } catch (error) {
      console.error('KeyboardFeed: 初期化エラー', error);
      // 最低限の初期化を実行
      _feedItems = MOCK_ITEMS.map(item => _validateItem(item)).filter(Boolean);
      _lastUpdated = new Date();
    }
  }
  
  /**
   * フィードアイテムを取得
   * @public
   * @param {string} category カテゴリ（'all'または特定のカテゴリ名）
   * @param {boolean} savedOnly 保存済みアイテムのみを取得する場合はtrue
   * @returns {Array} フィルタリングされたアイテムの配列
   */
  function getItems(category = 'all', savedOnly = false) {
    // 引数の型をチェック
    if (typeof category !== 'string') {
      category = 'all';
    }
    if (typeof savedOnly !== 'boolean') {
      savedOnly = false;
    }
    
    return _feedItems.filter(item => {
      if (!item) return false;
      
      const categoryMatch = category === 'all' || item.category === category;
      const savedMatch = !savedOnly || item.saved;
      return categoryMatch && savedMatch;
    });
  }
  
  /**
   * アイテムを検索
   * @public
   * @param {string} query 検索クエリ
   * @param {string} category カテゴリ（'all'または特定のカテゴリ名）
   * @param {boolean} savedOnly 保存済みアイテムのみを検索する場合はtrue
   * @returns {Array} 検索結果のアイテム配列
   */
  function searchItems(query, category = 'all', savedOnly = false) {
    // 引数の型をチェック
    if (typeof query !== 'string') {
      query = '';
    }
    
    if (!query) {
      return getItems(category, savedOnly);
    }
    
    const lowercaseQuery = query.toLowerCase();
    
    return getItems(category, savedOnly).filter(item => {
      if (!item) return false;
      
      return (
        (item.title && item.title.toLowerCase().includes(lowercaseQuery)) ||
        (item.content && item.content.toLowerCase().includes(lowercaseQuery)) ||
        (item.source && item.source.toLowerCase().includes(lowercaseQuery)) ||
        (item.category && item.category.toLowerCase().includes(lowercaseQuery))
      );
    });
  }
  
  /**
   * アイテムの保存状態を切り替え
   * @public
   * @param {string} itemId アイテムID
   * @returns {boolean} 新しい保存状態
   */
  function toggleSaveItem(itemId) {
    if (!itemId) {
      throw new Error('itemIdが指定されていません');
    }
    
    const item = _feedItems.find(item => item && item.id === itemId);
    if (item) {
      item.saved = !item.saved;
      _saveSavedItems();
      return item.saved;
    }
    
    throw new Error(`ID: ${itemId} のアイテムが見つかりません`);
  }
  
  /**
   * フィードを更新（実際のウェブからデータを取得）
   * @public
   * @returns {Promise} 更新結果のPromise
   */
  function fetchFeeds() {
    // すでに読み込み中の場合は何もしない
    if (_isLoading) {
      console.log('KeyboardFeed: 既に読み込み中です');
      return Promise.resolve(false);
    }
    
    _isLoading = true;
    console.log('KeyboardFeed: フィード更新開始');
    
    // オンライン状態をチェック
    if (!navigator.onLine) {
      console.warn('KeyboardFeed: オフラインのため、更新をスキップします');
      _isLoading = false;
      return Promise.resolve(false);
    }
    
    // 有効なソースのみをフェッチ
    const fetchPromises = FEED_SOURCES
      .filter(source => source.enabled)
      .map(source => _fetchSourceFeed(source));
    
    return Promise.all(fetchPromises)
      .then(resultsArray => {
        try {
          // 全ソースの結果を統合
          const newItems = resultsArray.flat();
          
          if (newItems.length > 0) {
            console.log(`KeyboardFeed: ${newItems.length}個の新しいアイテムを取得しました`);
            
            // 既存のアイテムと統合（重複を避ける）
            const existingIds = new Set(_feedItems.map(item => item.id));
            const uniqueNewItems = newItems
              .map(item => _validateItem(item))
              .filter(Boolean)
              .filter(item => !existingIds.has(item.id));
            
            if (uniqueNewItems.length > 0) {
              // 新しいアイテムを先頭に追加
              _feedItems = [...uniqueNewItems, ..._feedItems];
              
              // 古いアイテムをクリーンアップ
              _cleanupOldItems();
              
              // 保存
              _saveFeedItems();
              
              console.log(`KeyboardFeed: ${uniqueNewItems.length}個のユニークな新しいアイテムを追加しました`);
            } else {
              console.log('KeyboardFeed: 新規アイテムはありませんでした');
            }
          } else {
            console.log('KeyboardFeed: 取得したアイテムはありませんでした');
          }
          
          // 最終更新日時を更新
          _lastUpdated = new Date();
          
          _isLoading = false;
          return newItems.length > 0;
        } catch (error) {
          console.error('KeyboardFeed: データ処理中にエラー', error);
          _isLoading = false;
          return false;
        }
      })
      .catch(error => {
        console.error('KeyboardFeed: フィード取得中にエラー', error);
        _isLoading = false;
        return false;
      });
  }
  
  /**
   * 最終更新日時を取得
   * @public
   * @returns {Date} 最終更新日時
   */
  function getLastUpdated() {
    return _lastUpdated;
  }
  
  /**
   * 特定のアイテムを取得
   * @public
   * @param {string} itemId アイテムID
   * @returns {Object|null} アイテムまたはnull
   */
  function getItemById(itemId) {
    if (!itemId) return null;
    return _feedItems.find(item => item && item.id === itemId) || null;
  }
  
  /**
   * フィードソース一覧を取得
   * @public
   * @returns {Array} フィードソースの配列
   */
  function getSources() {
    return [...FEED_SOURCES];
  }
  
  /**
   * フィードソースの有効/無効を切り替え
   * @public
   * @param {string} sourceId ソースID
   * @param {boolean} enabled 有効にする場合true
   * @returns {boolean} 成功した場合true
   */
  function setSourceEnabled(sourceId, enabled) {
    const source = FEED_SOURCES.find(s => s.id === sourceId);
    if (source) {
      source.enabled = !!enabled;
      return true;
    }
    return false;
  }
  
  // 自動初期化を行う
  _init();
  
  // パブリックAPI
  return {
    getItems,
    searchItems,
    toggleSaveItem,
    fetchFeeds,
    getLastUpdated,
    getItemById,
    getSources,
    setSourceEnabled
  };
})();

// モジュールの存在確認用（デバッグ用）
console.log('KeyboardFeed: モジュールが読み込まれました');