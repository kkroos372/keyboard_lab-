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
    
    try {
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
          console.log('FeedUI: エラーメッセージを表示します');
          alert('情報の更新中にエラーが発生しました。詳細はコンソールを確認してください。');
        });
    } catch (error) {
      console.error('FeedUI: 予期せぬエラー', error);
      
      // ボタン状態を戻す
      DOM.refreshBtn.disabled = false;
      DOM.refreshBtn.classList.remove('loading');
      _isLoading = false;
      
      // エラーメッセージを表示
      alert('予期せぬエラーが発生しました。アプリを再読み込みしてください。');
    }
  }