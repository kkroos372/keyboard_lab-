/**
 * キーボード情報フィードUI
 * KeyboardLabアプリのフィード表示UI実装
 * バージョン: 4.0.0 - 分割キーボード・エルゴノミクス対応版
 * 
 * 変更履歴:
 * - 4.0.0: 分割キーボード、エルゴノミクス、ブランクキーキャップのカテゴリ追加
 * - 3.1.0: バックグラウンド更新機能UI追加
 */

const FeedUI = (() => {
  // プライベート変数
  let _currentCategory = 'all';
  let _currentView = 'list'; // 'list' または 'detail'
  let _selectedItem = null;
  let _isLoading = false;
  let _savedOnly = false;
  let _searchQuery = ''; // 検索クエリを保持する変数
  
  // デフォルトのプレースホルダー画像
  const DEFAULT_IMAGE = './assets/placeholder.jpg';
  
  // DOM要素の参照
  const DOM = {
    container: null,
    itemsList: null,
    itemDetail: null,
    categoryTabs: null,
    loadMoreBtn: null,
    refreshBtn: null,
    savedToggle: null,
    loadingIndicator: null,
    emptyMessage: null,
    backButton: null,
    searchInput: null, // 検索入力欄の参照
    searchClearBtn: null, // 検索クリアボタンの参照
    settingsBtn: null, // 設定ボタン
    settingsPanel: null // 設定パネル
  };
  
  /**
   * 初期化処理
   * @public
   * @param {string} containerId フィードUIを配置するコンテナのID
   */
  function init(containerId) {
    console.log('FeedUI: 初期化中...');
    
    // コンテナを取得
    DOM.container = document.getElementById(containerId);
    if (!DOM.container) {
      console.error(`FeedUI: コンテナ要素 "${containerId}" が見つかりません`);
      return;
    }
    
    // UIを構築
    _buildUI();
    
    // キーボードフィードモジュールの確認
    if (typeof KeyboardFeed === 'undefined') {
      console.error('FeedUI: KeyboardFeedモジュールが見つかりません');
      DOM.container.innerHTML = '<p>情報フィード機能を読み込めませんでした。</p>';
      return;
    }
    
    // 新しいアイテム通知のリスナー登録
    if (typeof KeyboardFeed.onNewItems === 'function') {
      KeyboardFeed.onNewItems((newItems) => {
        _handleNewItems(newItems);
      });
    }
    
    // 必要な画像ファイルの事前読み込み
    _preloadImages();
    
    // 初期データの表示
    _renderItems();
    
    console.log('FeedUI: 初期化完了');
  }
  
  /**
   * 画像を事前読み込み
   * @private
   */
  function _preloadImages() {
    // プレースホルダー画像を事前読み込み
    const preloadImage = new Image();
    preloadImage.src = DEFAULT_IMAGE;
    
    // カテゴリ別画像も読み込み
    const categories = ['keyboard', 'switch', 'keycap', 'deskmat', 'split', 'ergonomic', 'blank_keycap'];
    categories.forEach(category => {
      const img = new Image();
      img.src = `./assets/${category}.jpg`;
    });
  }
  
  /**
   * UI構造を構築
   * @private
   */
  function _buildUI() {
    // まず既存のコンテンツを削除
    DOM.container.innerHTML = '';
    
    // UIの基本構造を作成
    DOM.container.innerHTML = `
      <div class="feed-header">
        <h2>キーボード情報フィード</h2>
        <div class="feed-controls">
          <button id="feed-refresh-btn" class="feed-refresh-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
            <span>更新</span>
          </button>
          <label class="feed-saved-toggle">
            <input type="checkbox" id="feed-saved-only">
            <span>保存済みのみ</span>
          </label>
          <button id="feed-settings-btn" class="feed-settings-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          </button>
        </div>
      </div>
      
      <!-- 設定パネル -->
      <div id="feed-settings-panel" class="feed-settings-panel" style="display: none;">
        <div class="feed-settings-header">
          <h3>フィード設定</h3>
          <button id="feed-settings-close" class="feed-settings-close">×</button>
        </div>
        <div class="feed-settings-content">
          <div class="feed-settings-group">
            <label class="feed-setting-toggle">
              <span>バックグラウンド更新</span>
              <input type="checkbox" id="feed-background-update">
              <span class="feed-toggle-slider"></span>
            </label>
            <p class="feed-setting-description">アプリを閉じている間も定期的に最新情報を取得します</p>
          </div>
          
          <div class="feed-settings-group">
            <label>
              <span>更新間隔</span>
              <select id="feed-update-interval" class="feed-select">
                <option value="10">10分</option>
                <option value="30">30分</option>
                <option value="60">1時間</option>
                <option value="180">3時間</option>
                <option value="360">6時間</option>
              </select>
            </label>
            <p class="feed-setting-description">新着情報を確認する頻度を設定します</p>
          </div>
          
          <div class="feed-settings-footer">
            <span id="feed-last-update" class="feed-last-update">最終更新: --</span>
          </div>
        </div>
      </div>
      
      <!-- 検索ボックス -->
      <div class="feed-search">
        <div class="feed-search-input-wrapper">
          <svg class="feed-search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" id="feed-search-input" class="feed-search-input" placeholder="キーボード情報を検索...">
          <button id="feed-search-clear" class="feed-search-clear" style="display: none;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>
      
      <div class="feed-tabs" id="feed-category-tabs">
        <button class="feed-tab active" data-category="all">すべて</button>
        <button class="feed-tab" data-category="split">分割キーボード</button>
        <button class="feed-tab" data-category="ergonomic">エルゴノミクス</button>
        <button class="feed-tab" data-category="keyboard">一般キーボード</button>
        <button class="feed-tab" data-category="switch">スイッチ</button>
        <button class="feed-tab" data-category="keycap">キーキャップ</button>
        <button class="feed-tab" data-category="blank_keycap">無刻印キーキャップ</button>
        <button class="feed-tab" data-category="deskmat">デスクマット</button>
      </div>
      
      <div class="feed-content">
        <div id="feed-items-list" class="feed-items-list"></div>
        <div id="feed-item-detail" class="feed-item-detail"></div>
        <div id="feed-loading" class="feed-loading">
          <div class="feed-spinner"></div>
          <p>読み込み中...</p>
        </div>
        <div id="feed-empty" class="feed-empty">
          <p>情報がありません</p>
        </div>
      </div>
    `;
    
    // DOM要素への参照を設定
    DOM.itemsList = document.getElementById('feed-items-list');
    DOM.itemDetail = document.getElementById('feed-item-detail');
    DOM.categoryTabs = document.getElementById('feed-category-tabs');
    DOM.refreshBtn = document.querySelector('#feed-refresh-btn');
    DOM.savedToggle = document.getElementById('feed-saved-only');
    DOM.loadingIndicator = document.getElementById('feed-loading');
    DOM.emptyMessage = document.getElementById('feed-empty');
    DOM.searchInput = document.getElementById('feed-search-input');
    DOM.searchClearBtn = document.getElementById('feed-search-clear');
    DOM.settingsBtn = document.getElementById('feed-settings-btn');
    DOM.settingsPanel = document.getElementById('feed-settings-panel');
    
    // 要素の存在チェック
    if (!DOM.itemsList || !DOM.itemDetail || !DOM.categoryTabs || 
        !DOM.refreshBtn || !DOM.savedToggle || !DOM.loadingIndicator || 
        !DOM.emptyMessage || !DOM.searchInput || !DOM.searchClearBtn ||
        !DOM.settingsBtn || !DOM.settingsPanel) {
      console.error('FeedUI: 一部のDOM要素が見つかりません');
      return;
    }
    
    // カテゴリタブのクリックイベント
    const tabs = DOM.categoryTabs.querySelectorAll('.feed-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        const category = this.getAttribute('data-category');
        _setActiveCategory(category);
      });
    });
    
    // 更新ボタンのクリックイベント
    DOM.refreshBtn.addEventListener('click', function() {
      _refreshFeed();
    });
    
    // 保存済みのみのトグル
    DOM.savedToggle.addEventListener('change', function() {
      _savedOnly = this.checked;
      _renderItems();
    });
    
    // 検索入力イベントの設定
    DOM.searchInput.addEventListener('input', function() {
      _searchQuery = this.value.trim().toLowerCase();
      // 検索クリアボタンの表示/非表示
      DOM.searchClearBtn.style.display = _searchQuery ? 'block' : 'none';
      _renderItems();
    });
    
    // 検索クリアボタンのイベント
    DOM.searchClearBtn.addEventListener('click', function() {
      DOM.searchInput.value = '';
      _searchQuery = '';
      this.style.display = 'none';
      _renderItems();
    });
    
    // 設定ボタンのクリックイベント
    DOM.settingsBtn.addEventListener('click', function() {
      _toggleSettingsPanel();
    });
    
    // 設定パネルの閉じるボタン
    const settingsCloseBtn = document.getElementById('feed-settings-close');
    if (settingsCloseBtn) {
      settingsCloseBtn.addEventListener('click', function() {
        DOM.settingsPanel.style.display = 'none';
      });
    }
    
    // バックグラウンド更新の切り替え
    const backgroundUpdateToggle = document.getElementById('feed-background-update');
    if (backgroundUpdateToggle && typeof KeyboardFeed.setBackgroundUpdate === 'function') {
      // 現在の設定を反映
      backgroundUpdateToggle.checked = KeyboardFeed.isBackgroundUpdateEnabled();
      
      backgroundUpdateToggle.addEventListener('change', function() {
        const enabled = this.checked;
        KeyboardFeed.setBackgroundUpdate(enabled);
        
        // 設定変更を通知
        _showNotification(enabled ? 
          'バックグラウンド更新を有効にしました' : 
          'バックグラウンド更新を無効にしました'
        );
      });
    }
    
    // 更新間隔の設定
    const updateIntervalSelect = document.getElementById('feed-update-interval');
    if (updateIntervalSelect && typeof KeyboardFeed.setUpdateInterval === 'function') {
      // 現在の設定を反映
      const currentInterval = KeyboardFeed.getUpdateInterval();
      updateIntervalSelect.value = currentInterval.toString();
      
      // 該当するオプションがなければ追加
      if (!Array.from(updateIntervalSelect.options).some(option => Number(option.value) === currentInterval)) {
        const option = document.createElement('option');
        option.value = currentInterval.toString();
        option.textContent = `${currentInterval}分`;
        updateIntervalSelect.appendChild(option);
        updateIntervalSelect.value = currentInterval.toString();
      }
      
      updateIntervalSelect.addEventListener('change', function() {
        const minutes = Number(this.value);
        KeyboardFeed.setUpdateInterval(minutes);
        
        // 設定変更を通知
        _showNotification(`更新間隔を${minutes}分に設定しました`);
      });
    }
    
    // 最終更新時刻の表示を更新
    _updateLastUpdateTime();
    
    // 初期表示状態の設定
    DOM.itemDetail.style.display = 'none';
    DOM.loadingIndicator.style.display = 'none';
    DOM.emptyMessage.style.display = 'none';
  }
  
  /**
   * 設定パネルの表示/非表示を切り替え
   * @private
   */
  function _toggleSettingsPanel() {
    if (DOM.settingsPanel.style.display === 'none') {
      // パネル表示前に最終更新時刻を更新
      _updateLastUpdateTime();
      
      // パネルを表示
      DOM.settingsPanel.style.display = 'block';
    } else {
      DOM.settingsPanel.style.display = 'none';
    }
  }
  
  /**
   * 最終更新時刻の表示を更新
   * @private
   */
  function _updateLastUpdateTime() {
    const lastUpdateElement = document.getElementById('feed-last-update');
    if (!lastUpdateElement) return;
    
    if (typeof KeyboardFeed.getLastUpdated === 'function') {
      const lastUpdate = KeyboardFeed.getLastUpdated();
      if (lastUpdate) {
        const formattedDate = _formatDateTime(lastUpdate);
        lastUpdateElement.textContent = `最終更新: ${formattedDate}`;
      } else {
        lastUpdateElement.textContent = '最終更新: まだ更新されていません';
      }
    }
  }
  
  /**
   * 日時を整形する
   * @private
   * @param {Date} date 日時
   * @returns {string} 整形された日時
   */
  function _formatDateTime(date) {
    if (!date) return '';
    
    try {
      return date.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return date.toString();
    }
  }
  
  /**
   * 通知を表示
   * @private
   * @param {string} message 通知メッセージ
   * @param {number} duration 表示時間（ミリ秒）
   */
  function _showNotification(message, duration = 3000) {
    // 既存の通知を削除
    const existingNotifications = document.querySelectorAll('.feed-notification');
    existingNotifications.forEach(notification => {
      notification.remove();
    });
    
    // 新しい通知を作成
    const notification = document.createElement('div');
    notification.className = 'feed-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // 一定時間後に通知を自動で消す
    setTimeout(() => {
      notification.classList.add('feed-notification-hide');
      setTimeout(() => {
        notification.remove();
      }, 500);
    }, duration);
  }
  
  /**
   * 新しいアイテムを取得したときの処理
   * @private
   * @param {Array} newItems 新しいアイテムの配列
   */
  function _handleNewItems(newItems) {
    if (!newItems || newItems.length === 0) return;
    
    // 現在表示中なら表示を更新
    if (document.visibilityState === 'visible') {
      // リスト表示中なら再描画
      if (_currentView === 'list') {
        _renderItems();
      }
      
      // 通知メッセージを表示
      _showNotification(`${newItems.length}件の新しい情報が追加されました`);
    } else {
      // バックグラウンド中ならブラウザ通知を使用（ブラウザが対応していれば）
      if ('Notification' in window) {
        // 通知権限が許可されているか確認
        if (Notification.permission === 'granted') {
          // 通知を作成
          new Notification('KeyboardLab 新着情報', {
            body: `${newItems.length}件の新しいキーボード情報が追加されました`,
            icon: './icon-192.png'
          });
        } else if (Notification.permission !== 'denied') {
          // 権限が未設定なら許可を求める
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification('KeyboardLab 新着情報', {
                body: `${newItems.length}件の新しいキーボード情報が追加されました`,
                icon: './icon-192.png'
              });
            }
          });
        }
      }
    }
    
    // 最終更新時刻を更新
    _updateLastUpdateTime();
  }
  
  /**
   * アクティブなカテゴリーを設定
   * @private
   * @param {string} category カテゴリー名
   */
  function _setActiveCategory(category) {
    _currentCategory = category;
    
    // タブの見た目を更新
    const tabs = DOM.categoryTabs.querySelectorAll('.feed-tab');
    tabs.forEach(tab => {
      if (tab.getAttribute('data-category') === category) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
    
    // アイテムを再描画
    _renderItems();
  }
  
  /**
   * アイテムリストを描画
   * @private
   */
  function _renderItems() {
    // 表示状態をリストビューに設定
    _setViewMode('list');
    
    // 選択中のアイテムをクリア
    _selectedItem = null;
    
    // ローディング表示
    DOM.loadingIndicator.style.display = 'flex';
    DOM.itemsList.innerHTML = '';
    DOM.emptyMessage.style.display = 'none';
    
    // アイテムを取得（検索クエリがある場合は検索結果を表示）
    let filteredItems;
    try {
      if (_searchQuery) {
        filteredItems = KeyboardFeed.searchItems(_searchQuery, _currentCategory, _savedOnly);
      } else {
        filteredItems = KeyboardFeed.getItems(_currentCategory, _savedOnly);
      }
    } catch (error) {
      console.error('FeedUI: アイテム取得エラー', error);
      filteredItems = [];
    }
    
    // ローディング非表示
    DOM.loadingIndicator.style.display = 'none';
    
    if (!filteredItems || filteredItems.length === 0) {
      // アイテムがない場合の表示
      DOM.emptyMessage.style.display = 'flex';
      if (_searchQuery) {
        DOM.emptyMessage.innerHTML = `<p>"${_searchQuery}" に一致する情報がありません</p>`;
      } else {
        DOM.emptyMessage.innerHTML = '<p>情報がありません</p>';
      }
      return;
    }
    
    // アイテムがある場合の表示
    DOM.emptyMessage.style.display = 'none';
    
    // アイテムのHTML生成
    let html = '';
    filteredItems.forEach(item => {
      html += _generateItemHtml(item);
    });
    
    // HTMLをDOMに追加
    DOM.itemsList.innerHTML = html;
    
    // 各アイテムにイベントリスナーを設定
    _setupItemEventListeners();
  }
  
  /**
   * 画像URLを検証して有効なURLを返す
   * @private
   * @param {string} imageUrl 検証する画像URL
   * @param {string} category アイテムのカテゴリ
   * @returns {string} 有効な画像URL
   */
  function _validateImageUrl(imageUrl, category) {
    if (!imageUrl || imageUrl === 'undefined' || imageUrl === 'null') {
      // カテゴリに応じたプレースホルダー画像を返す
      switch (category) {
        case 'keyboard':
          return './assets/keyboard.jpg';
        case 'switch':
          return './assets/switch.jpg';
        case 'keycap':
          return './assets/keycap.jpg';
        case 'deskmat':
          return './assets/deskmat.jpg';
        case 'split':
          return './assets/split.jpg';
        case 'ergonomic':
          return './assets/ergonomic.jpg';
        case 'blank_keycap':
          return './assets/blank_keycap.jpg';
        default:
          return DEFAULT_IMAGE;
      }
    }
    return imageUrl;
  }
  
  /**
   * リンクURLを検証して有効なURLを返す
   * @private
   * @param {string} url 検証するURL
   * @returns {string} 有効なURL
   */
  function _validateUrl(url) {
    if (!url || url === '#' || url === 'undefined' || url === 'null') {
      return 'https://www.mechanical-keyboard.org/';
    }
    return url;
  }
  
  /**
   * アイテムのHTMLを生成
   * @private
   * @param {Object} item アイテム情報
   * @returns {string} 生成されたHTML
   */
  function _generateItemHtml(item) {
    if (!item) return '';
    
    const formattedDate = _formatDate(item.date);
    const imageUrl = _validateImageUrl(item.image, item.category);
    const savedClass = item.saved ? 'saved' : '';
    
    let categoryLabel = '';
    switch (item.category) {
      case 'keyboard':
        categoryLabel = '一般キーボード';
        break;
      case 'switch':
        categoryLabel = 'スイッチ';
        break;
      case 'keycap':
        categoryLabel = 'キーキャップ';
        break;
      case 'deskmat':
        categoryLabel = 'デスクマット';
        break;
      case 'split':
        categoryLabel = '分割キーボード';
        break;
      case 'ergonomic':
        categoryLabel = 'エルゴノミクス';
        break;
      case 'blank_keycap':
        categoryLabel = '無刻印キーキャップ';
        break;
      default:
        categoryLabel = item.category || '';
    }
    
    // 検索クエリがある場合、一致部分をハイライト
    let title = item.title || '';
    let excerpt = _truncateText(item.content || '', 100);
    
    if (_searchQuery) {
      title = _highlightText(title, _searchQuery);
      excerpt = _highlightText(excerpt, _searchQuery);
    }
    
    return `
      <div class="feed-item ${savedClass}" data-id="${item.id}">
        <div class="feed-item-image">
          <img src="${imageUrl}" alt="${title}" onerror="this.src='${DEFAULT_IMAGE}'">
        </div>
        <div class="feed-item-content">
          <div class="feed-item-header">
            <span class="feed-item-source">${item.source || ''}</span>
            <span class="feed-item-date">${formattedDate}</span>
          </div>
          <h3 class="feed-item-title">${title}</h3>
          <p class="feed-item-excerpt">${excerpt}</p>
          <div class="feed-item-footer">
            <span class="feed-item-category">${categoryLabel}</span>
            <button class="feed-item-save-btn" data-id="${item.id}">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="${item.saved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * テキスト内の検索クエリと一致する部分をハイライトする
   * @private
   * @param {string} text 元のテキスト
   * @param {string} query 検索クエリ
   * @returns {string} ハイライト処理されたHTML
   */
  function _highlightText(text, query) {
    if (!query || !text) return text;
    
    try {
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedQuery, 'gi');
      return text.replace(regex, match => `<span class="feed-search-highlight">${match}</span>`);
    } catch (error) {
      console.error('FeedUI: ハイライト処理エラー', error);
      return text;
    }
  }
  
  /**
   * アイテムの詳細表示
   * @private
   * @param {Object} item 表示するアイテム
   */
  function _showItemDetail(item) {
    if (!item) return;
    
    _selectedItem = item;
    _setViewMode('detail');
    
    const formattedDate = _formatDate(item.date);
    const imageUrl = _validateImageUrl(item.image, item.category);
    const itemUrl = _validateUrl(item.url);
    
    let categoryLabel = '';
    switch (item.category) {
      case 'keyboard':
        categoryLabel = '一般キーボード';
        break;
      case 'switch':
        categoryLabel = 'スイッチ';
        break;
      case 'keycap':
        categoryLabel = 'キーキャップ';
        break;
      case 'deskmat':
        categoryLabel = 'デスクマット';
        break;
      case 'split':
        categoryLabel = '分割キーボード';
        break;
      case 'ergonomic':
        categoryLabel = 'エルゴノミクス';
        break;
      case 'blank_keycap':
        categoryLabel = '無刻印キーキャップ';
        break;
      default:
        categoryLabel = item.category || '';
    }
    
    // 検索クエリがある場合、詳細コンテンツでもハイライト
    let title = item.title || '';
    let content = item.content || '';
    
    if (_searchQuery) {
      title = _highlightText(title, _searchQuery);
      content = _highlightText(content, _searchQuery);
    }
    
    // 記事の内容を段落に分割して表示
    const contentParagraphs = content.split(/\n\s*\n|\r\n\s*\r\n/g)
      .filter(p => p.trim().length > 0)
      .map(p => `<p>${p.trim()}</p>`)
      .join('');
    
    const html = `
      <div class="feed-detail-header">
        <button id="feed-back-btn" class="feed-back-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          戻る
        </button>
        <button class="feed-detail-save-btn" data-id="${item.id}">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="${item.saved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
        </button>
      </div>
      
      <div class="feed-detail-image">
        <img src="${imageUrl}" alt="${item.title}" onerror="this.src='${DEFAULT_IMAGE}'">
      </div>
      
      <div class="feed-detail-meta">
        <span class="feed-detail-source">${item.source || ''}</span>
        <span class="feed-detail-date">${formattedDate}</span>
        <span class="feed-detail-category">${categoryLabel}</span>
      </div>
      
      <h2 class="feed-detail-title">${title}</h2>
      
      <div class="feed-detail-content">
        ${contentParagraphs}
      </div>
      
      <a href="${itemUrl}" target="_blank" rel="noopener noreferrer" class="feed-detail-link">
        元の記事を読む
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="m10 14 11-11"/></svg>
      </a>
    `;
    
    DOM.itemDetail.innerHTML = html;
    
    // 戻るボタンのイベントリスナー
    const backBtn = document.getElementById('feed-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', function() {
        _setViewMode('list');
      });
    }
    
    // 保存ボタンのイベントリスナー
    const saveBtn = DOM.itemDetail.querySelector('.feed-detail-save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        const itemId = this.getAttribute('data-id');
        try {
          const newSaved = KeyboardFeed.toggleSaveItem(itemId);
          
          // アイコンの表示を更新
          const svg = this.querySelector('svg');
          if (svg) {
            svg.setAttribute('fill', newSaved ? 'currentColor' : 'none');
          }
          
          // 選択中のアイテムの状態も更新
          if (_selectedItem && _selectedItem.id === itemId) {
            _selectedItem.saved = newSaved;
          }
          
          // 保存済みのみ表示中で、アイテムの保存を解除した場合はリストに戻る
          if (_savedOnly && !newSaved) {
            _renderItems();
          }
        } catch (error) {
          console.error('FeedUI: 保存切り替えエラー', error);
        }
      });
    }
    
    // 外部リンクのイベントリスナー
    const externalLink = DOM.itemDetail.querySelector('.feed-detail-link');
    if (externalLink) {
      externalLink.addEventListener('click', function(e) {
        // リンククリック時の追加処理（必要に応じて）
        console.log('外部リンクがクリックされました:', this.href);
      });
    }
  }
  
  /**
   * アイテムのイベントリスナーをセットアップ
   * @private
   */
  function _setupItemEventListeners() {
    // アイテムのクリックイベント
    const items = DOM.itemsList.querySelectorAll('.feed-item');
    items.forEach(item => {
      item.addEventListener('click', function(e) {
        // 保存ボタンのクリックは除外
        if (e.target.closest('.feed-item-save-btn')) {
          return;
        }
        
        const itemId = this.getAttribute('data-id');
        
        // アイテムを探す（検索クエリがある場合は検索結果から）
        let selectedItem;
        try {
          if (_searchQuery) {
            selectedItem = KeyboardFeed.searchItems(_searchQuery, _currentCategory, _savedOnly)
              .find(item => item.id === itemId);
          } else {
            selectedItem = KeyboardFeed.getItems(_currentCategory, _savedOnly)
              .find(item => item.id === itemId);
          }
        } catch (error) {
          console.error('FeedUI: アイテム検索エラー', error);
          return;
        }
        
        if (selectedItem) {
          _showItemDetail(selectedItem);
        }
      });
    });
    
    // 保存ボタンのクリックイベント
    const saveButtons = DOM.itemsList.querySelectorAll('.feed-item-save-btn');
    saveButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.stopPropagation(); // 親要素へのイベント伝播を停止
        
        const itemId = this.getAttribute('data-id');
        
        try {
          const newSaved = KeyboardFeed.toggleSaveItem(itemId);
          
          // アイコンの表示を更新
          const svg = this.querySelector('svg');
          if (svg) {
            svg.setAttribute('fill', newSaved ? 'currentColor' : 'none');
          }
          
          // アイテム自体のクラスも更新
          const item = this.closest('.feed-item');
          if (item) {
            if (newSaved) {
              item.classList.add('saved');
            } else {
              item.classList.remove('saved');
              
              // 保存済みのみ表示中で、アイテムの保存を解除した場合はアイテムを非表示に
              if (_savedOnly) {
                item.style.display = 'none';
                
                // 表示されているアイテムがなくなった場合は空メッセージを表示
                const visibleItems = DOM.itemsList.querySelectorAll('.feed-item[style="display: block;"], .feed-item:not([style])');
                if (visibleItems.length === 0) {
                  DOM.emptyMessage.style.display = 'flex';
                }
              }
            }
          }
        } catch (error) {
          console.error('FeedUI: 保存状態の切り替えエラー', error);
        }
      });
    });
  }
  
  /**
   * 表示モードを設定（リスト/詳細）
   * @private
   * @param {string} mode 表示モード ('list' または 'detail')
   */
  function _setViewMode(mode) {
    _currentView = mode;
    
    if (mode === 'list') {
      DOM.itemsList.style.display = 'block';
      DOM.itemDetail.style.display = 'none';
      
      // 設定パネルが表示されていたら閉じる
      if (DOM.settingsPanel) {
        DOM.settingsPanel.style.display = 'none';
      }
    } else { // detail
      DOM.itemsList.style.display = 'none';
      DOM.itemDetail.style.display = 'block';
      
      // 設定パネルが表示されていたら閉じる
      if (DOM.settingsPanel) {
        DOM.settingsPanel.style.display = 'none';
      }
    }
  }
  
  /**
   * フィードを更新
   * @private
   */
  function _refreshFeed() {
    if (_isLoading) return;
    
    _isLoading = true;
    
    // 更新ボタンを無効化
    if (DOM.refreshBtn) {
      DOM.refreshBtn.disabled = true;
      DOM.refreshBtn.classList.add('loading');
    }
    
    // ローディング表示
    if (_currentView === 'list' && DOM.loadingIndicator) {
      DOM.loadingIndicator.style.display = 'flex';
      DOM.loadingIndicator.querySelector('p').textContent = 'ウェブから最新情報を取得中...';
    }
    
    // 復旧関数
    const resetUI = () => {
      if (DOM.refreshBtn) {
        DOM.refreshBtn.disabled = false;
        DOM.refreshBtn.classList.remove('loading');
      }
      
      if (DOM.loadingIndicator) {
        DOM.loadingIndicator.style.display = 'none';
      }
      
      _isLoading = false;
    };
    
    try {
      // 実際のデータ更新処理をラップ
      const updatePromise = new Promise((resolve, reject) => {
        // KeyboardFeedが存在するかチェック
        if (typeof KeyboardFeed === 'undefined' || !KeyboardFeed.fetchFeeds) {
          reject(new Error('KeyboardFeedモジュールが見つからないか、fetchFeedsが利用できません'));
          return;
        }
        
        // 更新処理前にデバッグモードをオフに設定（実際のウェブデータを取得）
        if (typeof KeyboardFeed.setDebugMode === 'function') {
          KeyboardFeed.setDebugMode(false);
        }
        
        // 更新処理
        KeyboardFeed.fetchFeeds()
          .then(result => {
            console.log('FeedUI: フィード更新完了:', result);
            resolve(result);
          })
          .catch(error => {
            console.error('FeedUI: フィード更新エラー:', error);
            reject(error);
          });
      });
      
      // 実行とエラーハンドリング
      updatePromise
        .then(hasUpdates => {
          // 表示を更新
          if (_currentView === 'list') {
            _renderItems();
          }
          
          // 最終更新時刻を更新
          _updateLastUpdateTime();
          
          // 更新があったことを通知
          if (hasUpdates) {
            _showNotification('新しい情報が追加されました');
          } else {
            _showNotification('最新の情報です');
          }
        })
        .catch((error) => {
          // エラーメッセージ表示
          console.error('FeedUI: 更新処理エラー:', error);
          _showNotification('情報の更新中にエラーが発生しました', 5000);
        })
        .finally(() => {
          // UIを復旧
          resetUI();
        });
        
      // タイムアウト処理（15秒後に強制的に復旧）
      setTimeout(() => {
        if (_isLoading) {
          console.warn('FeedUI: 更新処理がタイムアウトしました');
          resetUI();
          _showNotification('情報の更新に時間がかかっています。ネットワーク接続を確認してください。', 5000);
        }
      }, 15000);
      
    } catch (error) {
      console.error('FeedUI: 予期せぬエラー', error);
      resetUI();
      _showNotification('予期せぬエラーが発生しました', 5000);
    }
  }
  
  /**
   * テキストを指定の長さで切り詰める
   * @private
   * @param {string} text 元のテキスト
   * @param {number} maxLength 最大長
   * @returns {string} 切り詰めたテキスト
   */
  function _truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
  
  /**
   * 日付を整形する
   * @private
   * @param {string} dateStr 日付文字列
   * @returns {string} 整形された日付
   */
  function _formatDate(dateStr) {
    if (!dateStr) return '';
    
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  }
  
  // パブリックAPI
  return {
    init,
    refresh: _refreshFeed
  };
})();

// DOMロード後に初期化
document.addEventListener('DOMContentLoaded', function() {
  console.log('FeedUI: DOMContentLoaded イベント発火');
  
  // ページ内に'info'タブコンテンツがあれば初期化
  const infoTab = document.getElementById('info');
  if (infoTab) {
    console.log('FeedUI: infoタブが見つかりました');
    
    // UIを包含するコンテナを作成または取得
    let feedContainer = document.getElementById('feed-container');
    if (!feedContainer) {
      console.log('FeedUI: feed-containerを作成します');
      feedContainer = document.createElement('div');
      feedContainer.id = 'feed-container';
      feedContainer.className = 'feed-container';
      infoTab.appendChild(feedContainer);
    }
    
    // フィードUIを初期化
    setTimeout(() => {
      console.log('FeedUI: 初期化を開始します');
      FeedUI.init('feed-container');
    }, 300); // 少し遅延させてKeyboardFeedの読み込みを確実にする
  } else {
    console.log('FeedUI: infoタブが見つかりません');
  }
});