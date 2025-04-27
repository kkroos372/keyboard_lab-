// フィードソース定義（実際のRSSフィードとAPI）
  const FEED_SOURCES = [
    {
      id: 'kbdfans',
      name: 'KBDfans Blog',
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fkbdfans.com%2Fblogs%2Fnews.atom',
      category: 'keyboard',
      parser: 'rss2json'
    },
    {
      id: 'mechanical_keyboard',
      name: 'Mechanical Keyboard',
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.mechanical-keyboard.org%2Ffeed%2F',
      category: 'keyboard',
      parser: 'rss2json'
    },
    {
      id: 'mechkeys_reddit',
      name: 'r/MechanicalKeyboards',
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.reddit.com%2Fr%2FMechanicalKeyboards%2F.rss',
      category: 'keyboard',
      parser: 'rss2json'
    },
    {
      id: 'mechgroupbuys',
      name: 'Mech Group Buys',
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.mechgroupbuys.com%2Frss',
      category: 'keyboard',
      parser: 'rss2json'
    },
    {
      id: 'keebsnews',
      name: 'Keebs News',
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.keebsnews.com%2Frss',
      category: 'keyboard',
      parser: 'rss2json'
    }
  ];