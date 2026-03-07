export const sidebar = {
  '/collection/': [
    {
      text: '储物间',
      base: '/collection/', 
      items: [
        { text: '目录', link: 'collection-content' },
        { text: '同类推荐', link: 'VitePress' },
        { text: '1 - 搜索引擎', link: '1-搜索引擎' },
        { text: '2 - 问答导航', link: '2-问答导航' },
        { text: '3 - 百科全书', link: '3-百科全书' },
        { text: '4 - BT 导航', link: '4-BT导航' },
        { text: '5 - 网盘服务', link: '5-网盘服务' },
        { text: '6 - 音乐导航', link: '6-音乐导航' },
        { text: '7 - 社交平台', link: '7-社交平台' },
        { text: '8 - 图书馆', link: '8-图书馆' },
        { text: '9 - 图片资源', link: '9-图片资源' },
        { text: '10 - 网页浏览器', link: '10-网页浏览器' },
        { text: '11 - 维基媒体', link: '11-维基媒体' },
        { text: '12 - 工具箱', link: '12-工具箱' },
        { text: '13 - Telegram 频道推荐', link: '13-TG频道推荐' },
        { text: '14 - 云图导航', link: '14-云图导航' }
      ]
    }
  ],
  '/gfw-guide/': [
    {
      text: '墙外指南',
      base: '/gfw-guide/',
      items: [
        { text: '目录', link: 'gfw-guide-content' },
        { text: '名词解释', link: 'noun-explain' }
      ]
    },
    {
      text: '镜像',
      base: '/gfw-guide/mirror/',
      items: [
        { text: 'GitHub 代理', link: 'GitHub' },
        { text: 'Wikipedia 维基百科', link: 'Wikipedia' }
      ]
    },
    {
      text: '科学上网',
      base: '/gfw-guide/vpn/',
      collapsed: false,
      items: [
        { text: '网站推荐', link: 'website-recommend' },
        { text: '订阅转换', link: 'subconverter' },
        { text: '一线顶流机场推荐', link: 'top-tier' },
        { text: 'Telegram 墙外频道推荐', link: 'tg-channel' },
        {
          text: '2026 年',
          collapsed: true,
          items: [
            { text: '1 月', link: '2026/2026-1' },
            { text: '2 月', link: '2026/2026-2' },
            { text: '3 月', link: '2026/2026-3' }
          ]
        }
      ]
    },
    {
      text: '软件下载',
      base: '/gfw-guide/software/', 
      items: [
        { 
          text: '客户端',
          base: '/gfw-guide/software/proxy-client/',
          collapsed: true,
          items: [
            { text: '合集（一定要先读完我再下载！）', link: 'client' },
            { text: 'Clash', link: 'Clash' },
            { text: 'Hiddify', link: 'Hiddify' },
            { text: 'Karing', link: 'Karing' },
            { text: 'FlClash', link: 'FlClash' },
            { text: 'Clash Mi', link: 'ClashMi' },
            { text: 'Sing-box', link: 'Sing-box' },
            { text: 'V2Ray 系列', link: 'V2Ray' },
            { text: 'Clash Verge Rev', link: 'ClashVergeRev' },
            { text: 'NekoBox for Android', link: 'NekoBoxforAndroid' },
            { text: 'Clash Meta for Android', link: 'ClashMetaforAndroid' }
          ]
        },
        {
          text: '社交平台',
          base: '/gfw-guide/software/social-platform/',
          collapsed: true,
          items: [
            { text: 'Telegram', link: 'Telegram' }
          ]
        }
      ]
    }
  ]
}