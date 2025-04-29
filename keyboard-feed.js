/**
 * キーボード情報フィード機能
 * PWA上で動作するキーボード関連情報収集モジュール
 * バージョン: 4.1.0 - キーボードショップ情報対応版
 * 
 * 変更履歴:
 * - 4.1.0: キーボードショップ情報ソース追加
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
    // 既存のソース（分割キーボード関連）
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
      id: 'corne_reddit',
      name: 'r/crkbd',
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.reddit.com%2Fr%2Fcrkbd%2F.rss',
      category: 'split',
      parser: 'rss2json'
    },
    {
      id: 'keyboardio',
      name: 'Keyboardio',
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fblog.keyboard.io%2Ffeed',
      category: 'ergonomic',
      parser: 'rss2json'
    },
    
    // 日本のキーボードショップ
    {
      id: 'yushakobo',
      name: '遊舎工房',
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fyushakobo.jp%2Fblogs%2Fnews%2Frss',
      category: 'shop_jp',
      parser: 'rss2json'
    },
    {
      id: 'talp',
      name: 'TALP KEYBOARD',
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Ftalpkeyboard.stores.jp%2Fnews.atom',
      category: 'shop_jp',
      parser: 'rss2json'
    },
    {
      id: 'yukarikeyboard',
      name: 'ゆかりキーボードファクトリー',
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fyukari-kb.com%2Fblogs%2Fnews%2Fatom.xml',
      category: 'shop_jp',
      parser: 'rss2json'
    },
    {
      id: 'switchscience',
      name: 'スイッチサイエンス',
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.switch-science.com%2Fblog%2Ffeed',
      category: 'shop_jp',
      parser: 'rss2json'
    },
    {
      id: 'salicylic',
      name: 'サリチル酸',
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fsalicylic-acid3.hatenablog.com%2Frss',
      category: 'shop_jp',
      parser: 'rss2json'
    },
    
    // 海外のキーボードショップ
    {
      id: 'kbdfans',
      name: 'KBDfans',
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fkbdfans.com%2Fblogs%2Fnews.atom',
      category: 'shop_global',
      parser: 'rss2json'
    },
    {
      id: 'novelkeys',
      name: 'NovelKeys',
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fnovelkeys.com%2Fblogs%2Fnews%2Fatom.xml',
      category: 'shop_global',
      parser: 'rss2json'
    },
    {
      id: 'cannonkeys',
      name: 'CannonKeys',
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fcannonkeys.com%2Fblogs%2Fnews%2Fatom.xml',
      category: 'shop_global',
      parser: 'rss2json'
    },
    {
      id: 'drop',
      name: 'Drop',
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fdrop.com%2Fblog%2Frss.xml',
      category: 'shop_global',
      parser: 'rss2json'
    },
    {
      id: 'omnitype',
      name: 'Omnitype',
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fomnitype.com%2Fblogs%2Fnews%2Fatom.xml',
      category: 'shop_global',
      parser: 'rss2json'
    },
    {
      id: 'mekanisk',
      name: 'Mekanisk',
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fmekanisk.com%2Fblogs%2Fupdates%2Fatom.xml',
      category: 'shop_global',
      parser: 'rss2json'
    },
    {
      id: '1upkeyboards',
      name: '1upkeyboards',
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2F1upkeyboards.com%2Fblog%2Ffeed%2F',
      category: 'shop_global',
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
        // 記事の本文からカテゴリを推測（ソースのカテゴリを基本とする）
        let category = source.category;
        const title = (item.title || '').toLowerCase();
        const content = (item.content || item.description || '').toLowerCase();
        
        // ショップカテゴリの場合は、内容に基づいてサブカテゴリを判定
        if (category === 'shop_jp' || category === 'shop_global') {
          // 分割キーボード関連か判定
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
            title.includes('iris') || content.includes('iris') ||
            title.includes('sweep') || content.includes('sweep') ||
            title.includes('cradio') || content.includes('cradio') ||
            title.includes('ferris') || content.includes('ferris') ||
            title.includes('atreus') || content.includes('atreus')
          ) {
            category = category === 'shop_jp' ? 'shop_jp_split' : 'shop_global_split';
          }
          // エルゴノミクス関連か判定
          else if (
            title.includes('ergonomic') || content.includes('ergonomic') ||
            title.includes('エルゴノミクス') || content.includes('エルゴノミクス') ||
            title.includes('エルゴ') || content.includes('エルゴ') ||
            title.includes('人間工学') || content.includes('人間工学')
          ) {
            category = category === 'shop_jp' ? 'shop_jp_ergo' : 'shop_global_ergo';
          }
          // キースイッチ関連か判定
          else if (
            title.includes('switch') || content.includes('switch') ||
            title.includes('スイッチ') || content.includes('スイッチ') ||
            title.includes('gateron') || content.includes('gateron') ||
            title.includes('cherry') || content.includes('cherry') ||
            title.includes('kailh') || content.includes('kailh') ||
            title.includes('holy panda') || content.includes('holy panda') ||
            title.includes('zealio') || content.includes('zealio') ||
            title.includes('boba') || content.includes('boba')
          ) {
            category = category === 'shop_jp' ? 'shop_jp_switch' : 'shop_global_switch';
          }
          // キーキャップ関連か判定
          else if (
            title.includes('keycap') || content.includes('keycap') ||
            title.includes('キーキャップ') || content.includes('キーキャップ') ||
            title.includes('blank keycap') || content.includes('blank keycap') ||
            title.includes('無刻印') || content.includes('無刻印') ||
            title.includes('ブランク') || content.includes('ブランク')
          ) {
            // 無刻印キーキャップの判定
            if (
              title.includes('blank keycap') || content.includes('blank keycap') ||
              title.includes('無刻印') || content.includes('無刻印') ||
              title.includes('ブランク') || content.includes('ブランク')
            ) {
              category = category === 'shop_jp' ? 'shop_jp_blank_keycap' : 'shop_global_blank_keycap';
            } else {
              category = category === 'shop_jp' ? 'shop_jp_keycap' : 'shop_global_keycap';
            }
          }
        } else {
          // 通常のフィードソースのカテゴリ判定（既存ロジック）
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
        }
        
        // 商品タイプの判定（ショップフィード用）
        let productType = '';
        if (category.includes('shop_')) {
          // 商品タイプの判定（在庫状況、新製品、セールなど）
          if (
            title.includes('new') || content.includes('new') ||
            title.includes('新製品') || content.includes('新製品') ||
            title.includes('新発売') || content.includes('新発売') ||
            title.includes('新登場') || content.includes('新登場')
          ) {
            productType = 'new';
          } else if (
            title.includes('restock') || content.includes('restock') ||
            title.includes('restocked') || content.includes('restocked') ||
            title.includes('back in stock') || content.includes('back in stock') ||
            title.includes('再入荷') || content.includes('再入荷')
          ) {
            productType = 'restock';
          } else if (
            title.includes('sale') || content.includes('sale') ||
            title.includes('discount') || content.includes('discount') ||
            title.includes('セール') || content.includes('セール') ||
            title.includes('値下げ') || content.includes('値下げ') ||
            title.includes('割引') || content.includes('割引')
          ) {
            productType = 'sale';
          } else if (
            title.includes('group buy') || content.includes('group buy') ||
            title.includes('gb') || content.includes('gb') ||
            title.includes('グループバイ') || content.includes('グループバイ')
          ) {
            productType = 'groupbuy';
          }
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
          // ショップカテゴリの場合のプレースホルダー画像
          if (category.includes('shop_jp_') || category.includes('shop_global_')) {
            if (category.includes('_split')) {
              imageUrl = './assets/split.jpg';
            } else if (category.includes('_ergo')) {
              imageUrl = './assets/ergonomic.jpg';
            } else if (category.includes('_switch')) {
              imageUrl = './assets/switch.jpg';
            } else if (category.includes('_blank_keycap')) {
              imageUrl = './assets/blank_keycap.jpg';
            } else if (category.includes('_keycap')) {
              imageUrl = './assets/keycap.jpg';
            } else {
              imageUrl = `./assets/shop.jpg`;
            }
          } else {
            // 通常カテゴリのプレースホルダー画像
            imageUrl = `./assets/${category}.jpg`;
          }
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
          productType: productType, // 商品タイプ（new, restock, sale, groupbuy）
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
  
  /**
   * ソースデータをパースしてフィードアイテム形式に変換
   * @private
   * @param {Object} data ソースから取得したデータ
   * @param {Object} source ソース情報
   * @returns {Array} フィードアイテムの配列
   */
  function _parseSourceData(data, source) {
    try {
      switch (source.parser) {
        case 'rss2json':
          return _parseRss2Json(data, source);
          
        default:
          console.warn(`KeyboardFeed: 不明なパーサー: ${source.parser}`);
          return [];
      }
    } catch (error) {
      console.error(`KeyboardFeed: ${source.name}のパース中にエラー`, error);
      return [];
    }
  }
  
  /**
   * HTMLタグを除去してプレーンテキストを取得
   * @private
   * @param {string} html HTMLテキスト
   * @returns {string} プレーンテキスト
   */
  function _stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }
  
  /**
   * アイテムデータの検証と修正
   * @private
   * @param {Object} item 検証するアイテム
   * @returns {Object} 検証済みアイテム
   */
  function _validateItem(item) {
    if (!item) return null;
    
    // 必須フィールドの検証と修正
    let validItem = {...item};
    
    // IDの確認
    if (!validItem.id) {
      validItem.id = `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    
    // タイトルの確認
    if (!validItem.title) {
      validItem.title = '無題';
    }
    
    // 日付の確認
    if (!validItem.date) {
      validItem.date = new Date().toISOString();
    }
    
    // 本文の確認
    if (!validItem.content) {
      validItem.content = '詳細情報なし';
    }
    
    // カテゴリの確認
    if (!validItem.category) {
      validItem.category = 'keyboard';
    }
    
    // ソースの確認
    if (!validItem.source) {
      validItem.source = 'キーボード情報';
    }
    
    // URLの確認
    if (!validItem.url) {
      validItem.url = 'https://www.mechanical-keyboard.org/';
    }
    
    // 画像URLの確認
    if (!validItem.image) {
      if (validItem.category.includes('shop_')) {
        validItem.image = './assets/shop.jpg';
      } else {
        validItem.image = `./assets/${validItem.category}.jpg`;
      }
    }
    
    // 保存状態の確認
    validItem.saved = Boolean(validItem.saved);
    
    return validItem;
  }
  
  /**
   * バックグラウンド更新プロセスを開始
   * @private
   */
  function _startBackgroundUpdate() {
    if (_backgroundUpdateTimer) {
      clearInterval(_backgroundUpdateTimer);
    }
    
    if (!_backgroundUpdateEnabled) {
      console.log('KeyboardFeed: バックグラウンド更新は無効になっています');
      return;
    }
    
    console.log(`KeyboardFeed: バックグラウンド更新を開始します (${_updateInterval / (60 * 1000)}分間隔)`);
    
    // 更新間隔ごとにバックグラウンド更新を実行
    _backgroundUpdateTimer = setInterval(() => {
      // 最後の更新から一定時間が経過しているか確認
      if (_lastUpdated) {
        const elapsed = Date.now() - _lastUpdated.getTime();
        if (elapsed < _updateInterval * 0.9) {
          console.log(`KeyboardFeed: 前回の更新から十分な時間が経過していません (${Math.round(elapsed / 1000 / 60)}分)`);
          return;
        }
      }
      
      console.log('KeyboardFeed: バックグラウンド更新を実行します');
      _backgroundFetch();
    }, _updateInterval);
    
    // visibilitychangeイベントのリスナーを追加（タブがバックグラウンドになったときに対応）
    document.addEventListener('visibilitychange', _handleVisibilityChange);
  }
  
  /**
   * バックグラウンド更新プロセスを停止
   * @private
   */
  function _stopBackgroundUpdate() {
    if (_backgroundUpdateTimer) {
      clearInterval(_backgroundUpdateTimer);
      _backgroundUpdateTimer = null;
      console.log('KeyboardFeed: バックグラウンド更新を停止しました');
    }
    
    // visibilitychangeイベントのリスナーを削除
    document.removeEventListener('visibilitychange', _handleVisibilityChange);
  }
  
  /**
   * visibilitychangeイベントのハンドラ
   * @private
   */
  function _handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      // ページが表示されたとき
      if (_lastUpdated) {
        const elapsed = Date.now() - _lastUpdated.getTime();
        
        // 最後の更新から更新間隔の半分以上経過している場合は更新
        if (elapsed > _updateInterval / 2) {
          console.log(`KeyboardFeed: ページ復帰時に更新を実行 (前回の更新から${Math.round(elapsed / 1000 / 60)}分経過)`);
          _backgroundFetch();
        }
      }
    }
  }
  
  /**
   * バックグラウンドでのフェッチ処理
   * @private
   */
  function _backgroundFetch() {
    // すでに更新中の場合は実行しない
    if (_isLoading) {
      console.log('KeyboardFeed: 既に更新中です');
      return Promise.resolve(false);
    }
    
    _isLoading = true;
    console.log('KeyboardFeed: バックグラウンド更新開始');
    
    // 各ソースからのフェッチをPromiseで実行
    const fetchPromises = FEED_SOURCES.map(source => _fetchSource(source));
    
    return Promise.all(fetchPromises)
      .then(resultsArray => {
        try {
          // すべての結果を一つの配列に結合
          const newItems = resultsArray.flat();
          
          // 新しいアイテムを検証
          const validatedItems = newItems
            .map(item => _validateItem(item))
            .filter(Boolean);
          
          if (validatedItems.length === 0) {
            console.log('KeyboardFeed: 新しいアイテムはありませんでした');
            _isLoading = false;
            return false;
          }
          
          // 既存IDのセットを作成（重複チェック用）
          const existingIds = new Set(_feedItems.map(item => item.id));
          
          // 重複を除いた新しいアイテムのみを追加
          const uniqueNewItems = validatedItems.filter(item => !existingIds.has(item.id));
          
          if (uniqueNewItems.length > 0) {
            // 新しいアイテムを先頭に追加
            _feedItems = [...uniqueNewItems, ..._feedItems];
            
            // 保存済みアイテムの情報を復元
            _loadSavedItems();
            
            // データをローカルストレージに保存
            _saveFeedItems();
            
            // 最終更新日時を更新
            _lastUpdated = new Date();
            
            console.log(`KeyboardFeed: ${uniqueNewItems.length}個の新しいアイテムを追加しました`);
            
            // 新アイテム通知コールバックを実行
            _notifyNewItems(uniqueNewItems);
            
            _isLoading = false;
            return true;
          }
          
          console.log('KeyboardFeed: 新しいアイテムはありませんでした');
          _isLoading = false;
          return false;
        } catch (error) {
          console.error('KeyboardFeed: データ処理中にエラー', error);
          _isLoading = false;
          return false;
        }
      })
      .catch(error => {
        console.error('KeyboardFeed: フェッチエラー', error);
        _isLoading = false;
        return false;
      });
  }
  
  /**
   * 新しいアイテム取得時の通知
   * @private
   * @param {Array} newItems 新しいアイテムの配列
   */
  function _notifyNewItems(newItems) {
    _onNewItemsCallbacks.forEach(callback => {
      try {
        callback(newItems);
      } catch (error) {
        console.error('KeyboardFeed: 新アイテム通知コールバックエラー', error);
      }
    });
  }
  
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
      
      // ショップカテゴリの処理
      if (category === 'shop_all') {
        // 全てのショップ情報
        const isCategoryMatch = item.category.startsWith('shop_');
        const savedMatch = !savedOnly || item.saved;
        return isCategoryMatch && savedMatch;
      } else if (category === 'shop_jp_all') {
        // 日本のショップ情報
        const isCategoryMatch = item.category.startsWith('shop_jp');
        const savedMatch = !savedOnly || item.saved;
        return isCategoryMatch && savedMatch;
      } else if (category === 'shop_global_all') {
        // 海外のショップ情報
        const isCategoryMatch = item.category.startsWith('shop_global');
        const savedMatch = !savedOnly || item.saved;
        return isCategoryMatch && savedMatch;
      } else if (category.startsWith('product_type_')) {
        // 商品タイプによるフィルタリング
        const productType = category.replace('product_type_', '');
        const typeMatch = item.productType === productType;
        const savedMatch = !savedOnly || item.saved;
        return typeMatch && savedMatch;
      } else {
        // 通常のカテゴリフィルタリング
        const categoryMatch = category === 'all' || item.category === category;
        const savedMatch = !savedOnly || item.saved;
        return categoryMatch && savedMatch;
      }
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
   * フィードを更新（実際のAPIからデータを取得）
   * @public
   * @returns {Promise} 更新結果のPromise
   */
  function fetchFeeds() {
    return _backgroundFetch();
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
   * デバッグモードの設定
   * @public
   * @param {boolean} useMockData モックデータを使用するかどうか
   */
  function setDebugMode(useMockData) {
    _useMockData = Boolean(useMockData);
    console.log(`KeyboardFeed: デバッグモード${_useMockData ? '有効' : '無効'}`);
  }
  
  /**
   * バックグラウンド更新の有効/無効を設定
   * @public
   * @param {boolean} enabled 有効にする場合はtrue
   */
  function setBackgroundUpdate(enabled) {
    _backgroundUpdateEnabled = Boolean(enabled);
    
    if (_backgroundUpdateEnabled) {
      _startBackgroundUpdate();
    } else {
      _stopBackgroundUpdate();
    }
    
    // 設定を保存
    _saveSettings();
    
    return _backgroundUpdateEnabled;
  }
  
  /**
   * 更新間隔を設定（分単位）
   * @public
   * @param {number} minutes 更新間隔（分）
   */
  function setUpdateInterval(minutes) {
    // 入力値の検証（10分～24時間の範囲で設定可能）
    const validMinutes = Math.max(10, Math.min(60 * 24, Number(minutes) || 30));
    
    // ミリ秒に変換
    _updateInterval = validMinutes * 60 * 1000;
    
    // 設定を保存
    _saveSettings();
    
    // バックグラウンド更新が有効なら再起動
    if (_backgroundUpdateEnabled) {
      _startBackgroundUpdate();
    }
    
    return validMinutes;
  }
  
  /**
   * 現在の更新間隔を取得（分単位）
   * @public
   * @returns {number} 更新間隔（分）
   */
  function getUpdateInterval() {
    return _updateInterval / (60 * 1000);
  }
  
  /**
   * バックグラウンド更新の状態を取得
   * @public
   * @returns {boolean} 有効な場合はtrue
   */
  function isBackgroundUpdateEnabled() {
    return _backgroundUpdateEnabled;
  }
  
  /**
   * 新しいアイテムが取得されたときのコールバックを登録
   * @public
   * @param {Function} callback コールバック関数
   */
  function onNewItems(callback) {
    if (typeof callback === 'function') {
      _onNewItemsCallbacks.push(callback);
    }
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
    setDebugMode,
    setBackgroundUpdate,
    setUpdateInterval,
    getUpdateInterval,
    isBackgroundUpdateEnabled,
    onNewItems
  };
})();

// モジュールの存在確認用（デバッグ用）
console.log('KeyboardFeed: モジュールが読み込まれました - キーボードショップ情報対応版');