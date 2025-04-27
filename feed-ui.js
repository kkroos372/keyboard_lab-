/**
 * キーボード情報フィードUI
 * KeyboardLabアプリのフィード表示UI実装
 * バージョン: 1.1.0 - 検索機能追加
 */

const FeedUI = (() => {
  // プライベート変数
  let _currentCategory = 'all';
  let _currentView = 'list'; // 'list' または 'detail'
  let _selectedItem = null;
  let _isLoading = false;
  let _savedOnly = false;
  let _searchQuery = ''; // 検索クエリを保持する変数を追加
  
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
    searchInput: null, // 検索入力欄の参照を追加
    searchClearBtn: null // 検索クリアボタンの参照を追加
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
    
    // キーボードフィードモジュールの更新通知を設定
    if (typeof KeyboardFeed !== 'undefined') {
      KeyboardFeed.onUpdate(function(items) {
        _renderItems();
      });
    } else {
      console.error('FeedUI: KeyboardFeedモジュールが見つかりません');
      DOM.container.innerHTML = '<p>情報フィード機能を読み込めませんでした。</p>';
      return;
    }
    
    // 初期データの表示
    _renderItems();
    
    // 自動更新処理
    _setupAutoRefresh();
    
    console.log('FeedUI: 初期化完了');
  }
  
  /**
   * UI構造を構築
   * @private
   */
  function _buildUI() {
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
        </div>
      </div>
      
      <!-- 検索ボックスを追加 -->
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
        <button class="feed-tab" data-category="keyboard">キーボード</button>
        <button class="feed-tab" data-category="switch">スイッチ</button>
        <button class="feed-tab" data-category="keycap">キーキャップ</button>
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
      
      <button id="feed-load-more" class="feed-load-more">もっと見る</button>
    `;
    
    // DOM要素への参照を設定
    DOM.itemsList = document.getElementById('feed-items-list');
    DOM.itemDetail = document.getElementById('feed-item-detail');
    DOM.categoryTabs = document.getElementById('feed-category-tabs');
    DOM.loadMoreBtn = document.getElementById('feed-load-more');
    DOM.refreshBtn = document.getElementById('feed-refresh-btn');
    DOM.savedToggle = document.getElementById('feed-saved-only');
    DOM.loadingIndicator = document.getElementById('feed-loading');
    DOM.emptyMessage = document.getElementById('feed-empty');
    DOM.searchInput = document.getElementById('feed-search-input'); // 検索入力欄の参照を設定
    DOM.searchClearBtn = document.getElementById('feed-search-clear'); // 検索クリアボタンの参照を設定
    
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
    
    // もっと見るボタンのクリックイベント
    DOM.loadMoreBtn.addEventListener('click', function() {
      // このデモでは実装しない（ページネーション機能）
      this.disabled = true;
      this.textContent = 'すべて表示済み';
    });
    
    // 検索入力イベントの設定
    DOM.searchInput.addEventListener('input', function() {
      _searchQuery = this.value.trim().toLowerCase();
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
    
    // 初期表示状態の設定
    DOM.itemDetail.style.display = 'none';
    DOM.loadingIndicator.style.display = 'none';
    DOM.emptyMessage.style.display = 'none';
    DOM.loadMoreBtn.style.display = 'none'; // 初期状態では非表示
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
    
    // アイテムを取得
    const items = KeyboardFeed.getItems(_currentCategory, _savedOnly);
    
    // 検索クエリに基づいてフィルタリング
    const filteredItems = _searchQuery ? 
      items.filter(item => _itemMatchesSearch(item, _searchQuery)) : 
      items;
    
    // ローディング非表示
    DOM.loadingIndicator.style.display = 'none';
    
    if (filteredItems.length === 0) {
      // アイテムがない場合の表示
      DOM.emptyMessage.style.display = 'flex';
      if (_searchQuery) {
        // 検索結果がない場合のメッセージを変更
        DOM.emptyMessage.innerHTML = `<p>"${_searchQuery}" に一致する情報がありません</p>`;
      } else {
        DOM.emptyMessage.innerHTML = '<p>情報がありません</p>';
      }
      DOM.loadMoreBtn.style.display = 'none';
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
    
    // もっと見るボタンの表示（アイテム数が10個以上なら表示）
    DOM.loadMoreBtn.style.display = filteredItems.length >= 10 ? 'block' : 'none';
  }
  
  /**
   * アイテムが検索クエリに一致するかチェック
   * @private
   * @param {Object} item チェック対象のアイテム
   * @param {string} query 検索クエリ
   * @returns {boolean} 一致すればtrue
   */
  function _itemMatchesSearch(item, query) {
    if (!query) return true;
    
    // 検索対象のフィールド
    const fieldsToSearch = [
      item.title,
      item.content,
      item.source,
      item.category
    ];
    
    // いずれかのフィールドにクエリが含まれていればtrue
    return fieldsToSearch.some(field => {
      if (!field) return false;
      return field.toString().toLowerCase().includes(query);
    });
  }
  
  /**
   * アイテムのHTMLを生成
   * @private
   * @param {Object} item アイテム情報
   * @returns {string} 生成されたHTML
   */
  function _generateItemHtml(item) {
    const formattedDate = _formatDate(item.date);
    const imageUrl = item.image || './assets/placeholder.jpg';
    const savedClass = item.saved ? 'saved' : '';
    
    let categoryLabel = '';
    switch (item.category) {
      case 'keyboard':
        categoryLabel = 'キーボード';
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
      default:
        categoryLabel = item.category;
    }
    
    // 検索クエリがある場合、一致部分をハイライト
    let title = item.title;
    let excerpt = _truncateText(item.content, 100);
    
    if (_searchQuery) {
      title = _highlightText(title, _searchQuery);
      excerpt = _highlightText(excerpt, _searchQuery);
    }
    
    return `
      <div class="feed-item ${savedClass}" data-id="${item.id}">
        <div class="feed-item-image">
          <img src="${imageUrl}" alt="${item.title}" onerror="this.src='./assets/placeholder.jpg'">
        </div>
        <div class="feed-item-content">
          <div class="feed-item-header">
            <span class="feed-item-source">${item.source}</span>
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
    
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    return text.replace(regex, match => `<span class="feed-search-highlight">${match}</span>`);
  }
  
  /**
   * アイテムの詳細表示
   * @private
   * @param {Object} item 表示するアイテム
   */
  function _showItemDetail(item) {
    _selectedItem = item;
    _setViewMode('detail');
    
    const formattedDate = _formatDate(item.date);
    const imageUrl = item.image || './assets/placeholder.jpg';
    
    let categoryLabel = '';
    switch (item.category) {
      case 'keyboard':
        categoryLabel = 'キーボード';
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
      default:
        categoryLabel = item.category;
    }
    
    // 検索クエリがある場合、詳細コンテンツでもハイライト
    let title = item.title;
    let content = item.content;
    
    if (_searchQuery) {
      title = _highlightText(title, _searchQuery);
      content = _highlightText(content, _searchQuery);
    }
    
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
        <img src="${imageUrl}" alt="${item.title}" onerror="this.src='./assets/placeholder.jpg'">
      </div>
      
      <div class="feed-detail-meta">
        <span class="feed-detail-source">${item.source}</span>
        <span class="feed-detail-date">${formattedDate}</span>
        <span class="feed-detail-category">${categoryLabel}</span>
      </div>
      
      <h2 class="feed-detail-title">${title}</h2>
      
      <div class="feed-detail-content">
        <p>${content}</p>
      </div>
      
      <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="feed-detail-link">
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
        const items = KeyboardFeed.getItems(_currentCategory, _savedOnly);
        let selectedItem = items.find(item => item.id === itemId);
        
        // 検索クエリがある場合は、フィルタリングされたアイテムから検索
        if (_searchQuery && !selectedItem) {
          const allItems = KeyboardFeed.getItems('all', _savedOnly);
          selectedItem = allItems.find(item => item.id === itemId && _itemMatchesSearch(item, _searchQuery));
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
      if (DOM.loadMoreBtn && filteredItems && filteredItems.length >= 10) {
        DOM.loadMoreBtn.style.display = 'block';
      }
    } else { // detail
      DOM.itemsList.style.display = 'none';
      DOM.itemDetail.style.display = 'block';
      DOM.loadMoreBtn.style.display = 'none';
    }
  }
  
  /**
   * フィードを更新
   * @private
   */
  function _refreshFeed() {
    if (_isLoading) return;
    
    _isLoading = true;
    DOM.refreshBtn.disabled = true;
    DOM.refreshBtn.classList.add('loading');
    
    // ローディング表示
    if (_currentView === 'list') {
      DOM.loadingIndicator.style.display = 'flex';
    }
    
    // フィードの更新
    KeyboardFeed.fetchFeeds()
      .then(hasNewItems => {
        console.log(`FeedUI: フィード更新完了. 新しいアイテム: ${hasNewItems}`);
        
        // 表示を更新
        if (_currentView === 'list') {
          _renderItems();
        }
        
        // ボタン状態を戻す
        DOM.refreshBtn.disabled = false;
        DOM.refreshBtn.classList.remove('loading');
        _isLoading = false;
      })
      .catch(error => {
        console.error('FeedUI: フィード更新エラー', error);
        
        // ボタン状態を戻す
        DOM.refreshBtn.disabled = false;
        DOM.refreshBtn.classList.remove('loading');
        _isLoading = false;
        
        // エラーメッセージを表示
        alert('情報の更新中にエラーが発生しました。');
      });
  }
  
  /**
   * 自動更新処理のセットアップ
   * @private
   */
  function _setupAutoRefresh() {
    // 30分ごとに更新
    setInterval(function() {
      if (!_isLoading && document.visibilityState === 'visible') {
        console.log('FeedUI: 自動更新を実行します');
        _refreshFeed();
      }
    }, 30 * 60 * 1000); // 30分
    
    // ページが表示状態になったときにも更新
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'visible') {
        // 最終更新から30分以上経過していれば更新
        const lastUpdated = KeyboardFeed.getLastUpdated();
        if (lastUpdated) {
          const thirtyMinutesAgo = new Date();
          thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);
          
          if (lastUpdated < thirtyMinutesAgo) {
            console.log('FeedUI: ページ表示時の自動更新を実行します');
            _refreshFeed();
          }
        } else {
          // 最終更新がなければ更新を実行
          _refreshFeed();
        }
      }
    });
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
  // ページ内に'info'タブコンテンツがあれば初期化
  const infoTab = document.getElementById('info');
  if (infoTab) {
    // UIを包含するコンテナを作成
    if (!document.getElementById('feed-container')) {
      const feedContainer = document.createElement('div');
      feedContainer.id = 'feed-container';
      feedContainer.className = 'feed-container';
      infoTab.appendChild(feedContainer);
    }
    
    // フィードUIを初期化
    FeedUI.init('feed-container');
  }
});