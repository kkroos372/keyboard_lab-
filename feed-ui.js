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