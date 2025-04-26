/**
 * キーボード情報フィード機能
 * PWA上で動作するキーボード関連情報収集モジュール
 * バージョン: 1.0.1 - モックデータ内蔵版
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
      url: 'novelkeys_feed',
      enabled: true,
      category: 'all'
    },
    {
      id: 'kbdfans',
      name: 'KBDfans Blog',
      url: 'kbdfans_feed',
      enabled: true,
      category: 'all'
    },
    {
      id: 'switchjp',
      name: 'キースイッチ.jp',
      url: 'switchjp_feed',
      enabled: true,
      category: 'switch'
    },
    {
      id: 'yushakobo',
      name: '遊舎工房',
      url: 'yushakobo_feed',
      enabled: true,
      category: 'keyboard'
    }
  ];
  
  // モックデータ（JSONファイルを参照せず直接定義）
  const MOCK_FEEDS_DATA = {
    'novelkeys': [
      {
        id: 'nk_1',
        title: 'NK Cream スイッチ再入荷',
        date: '2025-04-12',
        content: 'NovelKeysの人気スイッチ「NK Cream」が再入荷しました。オリジナルのPOMスイッチで、独特のサウンドと感触が特徴です。通常版に加えて、今回は工場で潤滑済みのバージョンも発売。キー音とスムーズな打鍵感のバランスを追求した人気モデルです。',
        url: 'https://novelkeys.com/products/cream-switches',
        image: './placeholder.png',
        category: 'switch',
        source: 'NovelKeys'
      },
      {
        id: 'nk_2',
        title: 'GMK Olivia++ グループバイ開始',
        date: '2025-04-10',
        content: '人気のGMK Oliviaキーキャップセットの新バージョン「Olivia++」のグループバイが開始されました。淡いピンクとダークグレーの組み合わせが特徴の人気カラーウェイで、今回はISO配列とErgodox用キーも追加されています。納期は2025年第4四半期の予定です。',
        url: 'https://novelkeys.com/products/gmk-olivia',
        image: './placeholder.png',
        category: 'keycap',
        source: 'NovelKeys'
      },
      {
        id: 'nk_3',
        title: 'NK65 Superユーザー購入レビュー',
        date: '2025-04-08',
        content: '先日発売されたNK65 Superのユーザーレビューが多数投稿されています。ガスケットマウント、PCBマウントスタビライザー、QMK/VIA対応など機能面での評価が高く、特にPOM製プレートによる打鍵感が好評です。価格以上の価値があるという声が多数。',
        url: 'https://novelkeys.com/collections/keyboards/products/nk65-super',
        image: './placeholder.png',
        category: 'keyboard',
        source: 'NovelKeys'
      }
    ],
    'kbdfans': [
      {
        id: 'kbdfans_1',
        title: 'Tofu84 V2 発売開始',
        date: '2025-04-15',
        content: '人気のTofu84キーボードの新バージョンが登場。ガスケットマウント方式を採用し、打鍵感が大幅に向上しています。アルミニウムとポリカーボネートの2種類のケースから選択可能で、ホットスワップPCBを標準装備。VIA対応で簡単にキーマップのカスタマイズが可能です。',
        url: 'https://kbdfans.com/products/tofu84-v2',
        image: './placeholder.png',
        category: 'keyboard',
        source: 'KBDfans'
      },
      {
        id: 'kbdfans_2',
        title: 'OSA Marrs Green キーキャップセット',
        date: '2025-04-12',
        content: 'KBDfansから新しいOSAプロファイルのキーキャップセット「Marrs Green」が発売されました。OSAプロファイルはSAの高さとOEMのような形状を組み合わせた独特のプロファイルで、PBT素材の心地よい質感が特徴です。落ち着いたグリーンのカラーリングがデスク環境に上品なアクセントを加えます。',
        url: 'https://kbdfans.com/products/osa-marrs-green',
        image: './placeholder.png',
        category: 'keycap',
        source: 'KBDfans'
      },
      {
        id: 'kbdfans_3',
        title: 'D60 Lite 新色追加',
        date: '2025-04-05',
        content: 'コストパフォーマンスに優れたD60 Liteキーボードキットに新色「Matcha」と「Lavender」が追加されました。半透明のPC素材ケースに淡い色味を加えたデザインで、LEDとの相性も抜群です。お求めやすい価格はそのままに、カラーバリエーションが充実しました。',
        url: 'https://kbdfans.com/products/d60-lite',
        image: './placeholder.png',
        category: 'keyboard',
        source: 'KBDfans'
      }
    ],
    'switchjp': [
      {
        id: 'sjp_1',
        title: 'Boba U4T スイッチレビュー',
        date: '2025-04-20',
        content: 'タクタイルスイッチの新定番「Boba U4T」の詳細レビュー。強いタクタイル感と特徴的なサウンドが魅力です。デュロク・シアースタイルのトップハウジングとガトロンスタイルのボトムハウジングを組み合わせた独自構造により、深みのあるサウンドを実現しています。最近のメカニカルキーボードでもっとも人気のタクタイルスイッチの一つといえるでしょう。',
        url: 'https://keyswitch.jp/review/bobau4t',
        image: './placeholder.png',
        category: 'switch',
        source: 'キースイッチ.jp'
      },
      {
        id: 'sjp_2',
        title: 'リニア vs タクタイル vs クリッキー - スイッチタイプ徹底比較',
        date: '2025-04-15',
        content: 'メカニカルスイッチの3大タイプであるリニア、タクタイル、クリッキーの特徴と違いを徹底解説。タイピング、ゲーミング、プログラミングなど用途別のおすすめも紹介しています。初めてのメカニカルキーボードを検討している方は必見の内容です。',
        url: 'https://keyswitch.jp/guide/switchtypes',
        image: './placeholder.png',
        category: 'switch',
        source: 'キースイッチ.jp'
      },
      {
        id: 'sjp_3',
        title: '静音スイッチおすすめランキング2025',
        date: '2025-04-08',
        content: 'オフィスや共有スペースでも使いやすい静音スイッチのおすすめランキングを発表。Boba U4、Healio、Silent Alpacaなど人気の静音スイッチを実際の使用感、静音性、打鍵感などの観点から比較評価しました。動画による打鍵音の比較も掲載しています。',
        url: 'https://keyswitch.jp/ranking/silent2025',
        image: './placeholder.png',
        category: 'switch',
        source: 'キースイッチ.jp'
      }
    ],
    'yushakobo': [
      {
        id: 'yushakobo_1',
        title: 'Corne Cherry v4 発表',
        date: '2025-04-22',
        content: '人気の分割キーボード「Corne」の最新バージョンが発表されました。ワイヤレス接続対応が最大の特徴です。nice!nano v2コントローラーを使用することで、Bluetooth接続が可能になりました。また、バッテリーホルダーも基板に内蔵されており、110mAhのリチウムイオンバッテリーを左右それぞれに搭載できます。Cherry MXスイッチとChoc V1スイッチの両方に対応したオールラウンダーモデルになっています。',
        url: 'https://yushakobo.jp/products/corne-cherry-v4',
        image: './placeholder.png',
        category: 'keyboard',
        source: '遊舎工房'
      },
      {
        id: 'yushakobo_2',
        title: 'Choc Pro スイッチ入荷',
        date: '2025-04-18',
        content: '薄型キーボード向けの新しいKailh Choc Proスイッチが入荷しました。従来のChocより改良されたデザインで、よりスムーズな打鍵感が特徴です。従来のChocと同じ高さを維持しながらも、MXスタイルのステムを採用しており、一般的なMXキーキャップが使用可能になりました。赤軸（リニア）、茶軸（タクタイル）、白軸（クリッキー）の3種類が揃っています。',
        url: 'https://yushakobo.jp/products/kailh-choc-pro',
        image: './placeholder.png',
        category: 'switch',
        source: '遊舎工房'
      },
      {
        id: 'yushakobo_3',
        title: '自作キーボード入門ワークショップ 5月開催決定',
        date: '2025-04-16',
        content: '初心者向けの自作キーボードワークショップが2025年5月15日に開催されます。Crkbd（Corne）キーボードのビルドを一から学べるハンズオン形式で、はんだ付け初心者でも安心して参加できます。工具はすべて貸し出し、キットと必要な部品は参加費に含まれています。オンライン参加も可能です。',
        url: 'https://yushakobo.jp/workshop/202505',
        image: './placeholder.png',
        category: 'keyboard',
        source: '遊舎工房'
      },
      {
        id: 'yushakobo_4',
        title: 'オリジナルデスクマット「和紙」シリーズ発売',
        date: '2025-04-10',
        content: '日本の伝統的な和紙をモチーフにしたデスクマットシリーズが発売開始。「雲竜」「あさぎ」「墨流し」の3種類のデザインで、900x400mmのサイズ。表面はスムーズな操作感、裏面は滑り止め加工が施されており、キーボードにぴったりのアクセントになります。',
        url: 'https://yushakobo.jp/products/deskmats-washi',
        image: './placeholder.png',
        category: 'deskmat',
        source: '遊舎工房'
      }
    ]
  };
  
  // プレースホルダー画像パス（rootディレクトリに置く）
  const DEFAULT_IMAGE = './placeholder.png';
  
  /**
   * 初期化処理
   * @public
   */
  function init() {
    console.log('KeyboardFeed: 初期化中...');
    
    // ソース情報の読み込み
    _loadSources();
    
    // フィードアイテムの読み込み
    _loadFeedItems();
    
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
    
    // モックデータを直接使用
    return new Promise((resolve) => {
      setTimeout(() => {
        const sourceId = source.id;
        if (MOCK_FEEDS_DATA[sourceId]) {
          const items = MOCK_FEEDS_DATA[sourceId];
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