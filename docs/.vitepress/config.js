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
  base: '/depot/',
  description: "Wolfe 的小破站，始于 2026/1/11",
  ignoreDeadLinks: true,
  lastUpdated: true,
  head: [
    ['link', { rel: 'icon', href: '/media/icon/logo.svg' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;600;700&family=Noto+Seirf+SC:wght@400;500;600;700&family=Noto+Serif+TC:wght@400;500;600;700&display=swap', rel: 'stylesheet' }]
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

    nav: [
      { text: '首页', link: '/' },
      { text: '储物间', link: '/储物间/储物间目录' },
      { text: '墙外指南', link: '/墙外指南/墙外指南目录' }
    ],

    sidebar: sidebar,

    // 博客模式各页面的自定义图标
    // 支持：文字/emoji（如 '📝'）、SVG 字符串（如 '<svg ...>...</svg>'）、
    // 图片路径（如 '/media/icon/blog.svg' 或 '/media/icon/blog.ico'）
    blogIcons: {
      posts: '📝',       // 博客文章页标题图标
      tags: '🏷️',       // 标签云页标题图标
      series: '📚',      // 合辑页标题图标
      archives: '📅',    // 归档页标题图标
    },

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
            buttonText: '搜索文档', // 对应左上角 "Search"
            buttonAriaLabel: '搜索文档'
          },
          modal: {
            displayDetails: '显示详细列表',
            resetButtonTitle: '清除查询条件',
            backButtonTitle: '关闭搜索',
            noResultsText: '无法在标题或正文中找到：',
            footer: {
              selectText: '选中',   // 对应 "to select"
              navigateText: '选择', // 对应 "to navigate"
              closeText: '关闭',    // 对应 "to close"
            }
          }
        }
      }
    }
  }
})