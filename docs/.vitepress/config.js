import { defineConfig } from 'vitepress'
import footnote from 'markdown-it-footnote'
import { sidebar } from './sidebar'
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs'
import { tabbed } from './plugins/vitepress-tabbed'
import { customContainerColorPlugin } from './plugins/customContainerColor'
import { licenseDeclarationPlugin } from './plugins/licenseDeclaration'
import { spoiler } from './plugins/spoiler'
import encryptedBlockPlugin from './plugins/encryptedBlockPlugin'
import multimdTable from 'markdown-it-multimd-table'

export default defineConfig({
  title: "Wolfeの储物间",
  base: '/',
  description: "Wolfe 的小破站，始于 2026/1/11",
  ignoreDeadLinks: true,
  lastUpdated: true,
  
  head:[
    ['link', { rel: 'icon', href: '/media/icon/logo.svg' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],['link', { href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;600;700&family=Noto+Serif+SC:wght@400;500;600;700&family=Noto+Serif+TC:wght@400;500;600;700&display=swap', rel: 'stylesheet' }],['script', { src: 'https://code.iconify.design/iconify-icon/2.1.0/iconify-icon.min.js' }],
    ['link', { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/@fancyapps/ui@5.0/dist/fancybox/fancybox.css' }],['script', { src: 'https://cdn.jsdelivr.net/npm/@fancyapps/ui@5.0/dist/fancybox/fancybox.umd.js' }],['script', {}, `
      const initFancybox = setInterval(() => {
        if (window.Fancybox) {
          window.Fancybox.bind('.vp-doc img', {
            groupAll: true,
          });
          clearInterval(initFancybox);
        }
      }, 100);
    `]
  ],

  markdown: {
    config(md) {
      md.use(tabsMarkdownPlugin)
      md.use(tabbed)
      md.use(footnote)
      md.use(spoiler)
      md.use(licenseDeclarationPlugin)
      md.use(encryptedBlockPlugin)
      customContainerColorPlugin(md)
      md.use(multimdTable, {
        headerless: true,
      })

      // 图片 alt 文本显示为 caption
      const defaultImageRender = md.renderer.rules.image
      md.renderer.rules.image = (tokens, idx, options, env, self) => {
        const token = tokens[idx]
        const alt = token.content || (token.children ? token.children.reduce((acc, t) => acc + t.content, '') : '')
        const src = token.attrGet('src') || ''
        const title = token.attrGet('title') || ''

        if (!alt) {
          return defaultImageRender
            ? defaultImageRender(tokens, idx, options, env, self)
            : self.renderToken(tokens, idx, options)
        }

        return `<figure class="img-caption">\n` +
          `<img src="${md.utils.escapeHtml(src)}" alt="${md.utils.escapeHtml(alt)}"` +
          `${title ? ` title="${md.utils.escapeHtml(title)}"` : ''} loading="lazy">\n` +
          `<figcaption>${md.utils.escapeHtml(alt)}</figcaption>\n` +
          `</figure>`
      }

      // 自定义脚注渲染
      md.renderer.rules.footnote_ref = (tokens, idx, options, env, slf) => {
        const id = slf.rules.footnote_anchor_name(tokens, idx, options, env, slf)
        const refid = id
        const n = Number(tokens[idx].meta.id + 1).toString()
        
        return `<sup class="footnote-ref">
          <a href="#fn${id}" id="fnref${refid}" class="footnote-link" data-footnote="${n}">
            ${n}
          </a>
        </sup>`
      }
    }
  },

  themeConfig: {
    logo: '/media/icon/logo.svg',
    externalLinkIcon: true,
    darkModeSwitchLabel: '切换主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    sidebarMenuLabel: '侧边栏',
    returnToTopLabel: '返回顶部',
    
    footer: {
      message: '2010.9.15 wzy❤️ | 使用 VitePress 搭建，遵循 MIT 协议开源',
      copyright: 'Copyright © 2026 Wolfe Group'
    },

    outline: {
      level: 'deep', 
      label: '大纲' 
    },

    nav:[
      { text: '<iconify-icon icon="material-symbols:home-rounded"></iconify-icon> 首页', link: '/' },
      { text: '<iconify-icon icon="material-symbols:archive-rounded"></iconify-icon> 储物间', link: '/collection/collection-content' },
      { text: '<iconify-icon icon="ic:baseline-rocket-launch"></iconify-icon> 墙外指南', link: '/gfw-guide/gfw-guide-content' },
      {
        text: '<iconify-icon icon="icon-park-outline:more-three"></iconify-icon> 更多',
        items:[
          { text: '<iconify-icon icon="material-symbols:archive-rounded"></iconify-icon> 博客', link: 'https://wolfeovo.github.io/blog' },
          { text: '<iconify-icon icon="material-symbols:backup"></iconify-icon> 备份', link: '/more/backup' }
        ],
      },
    ],

    sidebar: sidebar,

    lastUpdated: {
      text: '最后更新',
      formatOptions: {
        dateStyle: 'full',
        timeStyle: 'medium'
      }
    },

    docFooter: {
      prev: '上一页',
      next: '下一页'
    },

    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档'
          },
          modal: {
            displayDetails: '显示详细列表',
            resetButtonTitle: '清除查询条件',
            backButtonTitle: '关闭搜索',
            noResultsText: '无法在标题或正文中找到：',
            footer: {
              selectText: '选中',
              navigateText: '选择',
              closeText: '关闭',
            }
          }
        }
      }
    }
  }
})