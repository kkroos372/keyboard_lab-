/**
 * キーボード情報フィード機能
 * PWA上で動作するキーボード関連情報収集モジュール
 * バージョン: 2.0.0 - シンプル化、エラー修正、検索対応版
 */

// 情報フィードの名前空間
const KeyboardFeed = (() => {
  // プライベート変数
  let _feedItems = [];
  let _lastUpdated = null;
  let _isLoading = false;
  
  // モックデータ（組み込み型の静的データ）
  const MOCK_ITEMS = [
    {
      id: 'nk_1',
      title: 'NK Cream スイッチ再入荷',
      date: '2025-04-12',
      content: 'NovelKeysの人気スイッチ「NK Cream」が再入荷しました。オリジナルのPOMスイッチで、独特のサウンドと感触が特徴です。通常版に加えて、今回は工場で潤滑済みのバージョンも発売。キー音とスムーズな打鍵感のバランスを追求した人気モデルです。',
      url: 'https://novelkeys.com/products/cream-switches',
      image: './placeholder.png',
      category: 'switch',
      source: 'NovelKeys',
      saved: false
    },
    {
      id: 'nk_2',
      title: 'GMK Olivia++ グループバイ開始',
      date: '2025-04-10',
      content: '人気のGMK Oliviaキーキャップセットの新バージョン「Olivia++」のグループバイが開始されました。淡いピンクとダークグレーの組み合わせが特徴の人気カラーウェイで、今回はISO配列とErgodox用キーも追加されています。納期は2025年第4四半期の予定です。',
      url: 'https://novelkeys.com/products/gmk-olivia',
      image: './placeholder.png',
      category: 'keycap',
      source: 'NovelKeys',
      saved: false
    },
    {
      id: 'nk_3',
      title: 'NK65 Superユーザー購入レビュー',
      date: '2025-04-08',
      content: '先日発売されたNK65 Superのユーザーレビューが多数投稿されています。ガスケットマウント、PCBマウントスタビライザー、QMK/VIA対応など機能面での評価が高く、特にPOM製プレートによる打鍵感が好評です。価格以上の価値があるという声が多数。',
      url: 'https://novelkeys.com/collections/keyboards/products/nk65-super',
      image: './placeholder.png',
      category: 'keyboard',
      source: 'NovelKeys',
      saved: false
    },
    {
      id: 'kbdfans_1',
      title: 'Tofu84 V2 発売開始',
      date: '2025-04-15',
      content: '人気のTofu84キーボードの新バージョンが登場。ガスケットマウント方式を採用し、打鍵感が大幅に向上しています。アルミニウムとポリカーボネートの2種類のケースから選択可能で、ホットスワップPCBを標準装備。VIA対応で簡単にキーマップのカスタマイズが可能です。',
      url: 'https://kbdfans.com/products/tofu84-v2',
      image: './placeholder.png',
      category: 'keyboard',
      source: 'KBDfans',
      saved: false
    },
    {
      id: 'kbdfans_2',
      title: 'OSA Marrs Green キーキャップセット',
      date: '2025-04-12',
      content: 'KBDfansから新しいOSAプロファイルのキーキャップセット「Marrs Green」が発売されました。OSAプロファイルはSAの高さとOEMのような形状を組み合わせた独特のプロファイルで、PBT素材の心地よい質感が特徴です。落ち着いたグリーンのカラーリングがデスク環境に上品なアクセントを加えます。',
      url: 'https://kbdfans.com/products/osa-marrs-green',
      image: './placeholder.png',
      category: 'keycap',
      source: 'KBDfans',
      saved: false
    },
    {
      id: 'sjp_1',
      title: 'Boba U4T スイッチレビュー',
      date: '2025-04-20',
      content: 'タクタイルスイッチの新定番「Boba U4T」の詳細レビュー。強いタクタイル感と特徴的なサウンドが魅力です。デュロク・シアースタイルのトップハウジングとガトロンスタイルのボトムハウジングを組み合わせた独自構造により、深みのあるサウンドを実現しています。最近のメカニカルキーボードでもっとも人気のタクタイルスイッチの一つといえるでしょう。',
      url: 'https://keyswitch.jp/review/bobau4t',
      image: './placeholder.png',
      category: 'switch',
      source: 'キースイッチ.jp',
      saved: false
    },
    {
      id: 'sjp_2',
      title: 'リニア vs タクタイル vs クリッキー - スイッチタイプ徹底比較',
      date: '2025-04-15',
      content: 'メカニカルスイッチの3大タイプであるリニア、タクタイル、クリッキーの特徴と違いを徹底解説。タイピング、ゲーミング、プログラミングなど用途別のおすすめも紹介しています。初めてのメカニカルキーボードを検討している方は必見の内容です。',
      url: 'https://keyswitch.jp/guide/switchtypes',
      image: './placeholder.png',
      category: 'switch',
      source: 'キースイッチ.jp',
      saved: false
    },
    {
      id: 'yushakobo_1',
      title: 'Corne Cherry v4 発表',
      date: '2025-04-22',
      content: '人気の分割キーボード「Corne」の最新バージョンが発表されました。ワイヤレス接続対応が最大の特徴です。nice!nano v2コントローラーを使用することで、Bluetooth接続が可能になりました。また、バッテリーホルダーも基板に内蔵されており、110mAhのリチウムイオンバッテリーを左右それぞれに搭載できます。Cherry MXスイッチとChoc V1スイッチの両方に対応したオールラウンダーモデルになっています。',
      url: 'https://yushakobo.jp/products/corne-cherry-v4',
      image: './placeholder.png',
      category: 'keyboard',
      source: '遊舎工房',
      saved: false
    },
    {
      id: 'yushakobo_2',
      title: 'Choc Pro スイッチ入荷',
      date: '2025-04-18',
      content: '薄型キーボード向けの新しいKailh Choc Proスイッチが入荷しました。従来のChocより改良されたデザインで、よりスムーズな打鍵感が特徴です。従来のChocと同じ高さを維持しながらも、MXスタイルのステムを採用しており、一般的なMXキーキャップが使用可能になりました。赤軸（リニア）、茶軸（タクタイル）、白軸（クリッキー）の3種類が揃っています。',
      url: 'https://yushakobo.jp/products/kailh-choc-pro',
      image: './placeholder.png',
      category: 'switch',
      source: '遊舎工房',
      saved: false
    },
    {
      id: 'yushakobo_4',
      title: 'オリジナルデスクマット「和紙」シリーズ発売',
      date: '2025-04-10',
      content: '日本の伝統的な和紙をモチーフにしたデスクマットシリーズが発売開始。「雲竜」「あさぎ」「墨流し」の3種類のデザインで、900x400mmのサイズ。表面はスムーズな操作感、裏面は滑り止め加工が施されており、キーボードにぴったりのアクセントになります。',
      url: 'https://yushakobo.jp/products/deskmats-washi',
      image: './placeholder.png',
      category: 'deskmat',
      source: '遊舎工房',
      saved: false
    }
  ];
  
  // ローカルストレージのキー
  const STORAGE_KEY = 'kblab_saved_items';
  
  /**
   * 保存済みアイテムをローカルストレージから読み込む
   * @private
   */
  function _loadSavedItems() {
    try {
      const savedIds = localStorage.getItem(STORAGE_KEY);
      if (savedIds) {
        const ids = JSON.parse(savedIds);
        
        // 保存済みフラグをセット
        _feedItems.forEach(item => {
          item.saved = ids.includes(item.id);
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
      const savedIds = _feedItems.filter(item => item.saved).map(item => item.id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedIds));
    } catch (error) {
      console.error('KeyboardFeed: 保存済みアイテム保存エラー', error);
    }
  }
  
  // イニシャライザ（すぐに実行される）
  function _init() {
    console.log('KeyboardFeed: 初期化中...');
    
    // モックデータをコピー
    _feedItems = [...MOCK_ITEMS];
    
    // 保存済みアイテムの読み込み
    _loadSavedItems();
    
    // 最終更新日時の初期化
    _lastUpdated = new Date();
    
    console.log(`KeyboardFeed: ${_feedItems.length}個のアイテムで初期化完了`);
  }
  
  /**
   * フィードアイテムを取得
   * @public
   * @param {string} category カテゴリ（'all'または特定のカテゴリ名）
   * @param {boolean} savedOnly 保存済みアイテムのみを取得する場合はtrue
   * @returns {Array} フィルタリングされたアイテムの配列
   */
  function getItems(category = 'all', savedOnly = false) {
    return _feedItems.filter(item => {
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
    if (!query) {
      return getItems(category, savedOnly);
    }
    
    const lowercaseQuery = query.toLowerCase();
    
    return getItems(category, savedOnly).filter(item => {
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
    const item = _feedItems.find(item => item.id === itemId);
    if (item) {
      item.saved = !item.saved;
      _saveSavedItems();
      return item.saved;
    }
    return false;
  }
  
  /**
   * フィードを更新（デモではモックデータを使用）
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
    
    // シミュレートされた非同期処理（1秒の遅延）
    return new Promise((resolve) => {
      setTimeout(() => {
        _lastUpdated = new Date();
        _isLoading = false;
        console.log('KeyboardFeed: フィード更新完了');
        
        // 更新の成功を返す
        resolve(true);
      }, 1000);
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
  
  // 自動初期化を行う
  _init();
  
  // パブリックAPI
  return {
    getItems,
    searchItems,
    toggleSaveItem,
    fetchFeeds,
    getLastUpdated
  };
})();

// モジュールの存在確認用（デバッグ用）
console.log('KeyboardFeed: モジュールが読み込まれました');