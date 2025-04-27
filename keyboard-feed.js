/**
   * 特定のソースからフィードをフェッチ
   * @private
   * @param {Object} source ソース情報
   * @returns {Promise} フェッチ結果のPromise
   */
  function _fetchSource(source) {
    console.log(`KeyboardFeed: ${source.name} からフェッチ中...`);
    
    // モックデータを直接使用
    return new Promise((resolve, reject) => {
      try {
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
      } catch (error) {
        console.error(`KeyboardFeed: ${source.name} からのフェッチ中にエラーが発生`, error);
        // エラーが発生しても処理を継続するため、空の配列を返す
        resolve([]);
      }
    });