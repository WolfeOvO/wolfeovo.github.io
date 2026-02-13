// docs/.vitepress/blog.data.js
// VitePress data loader：构建时自动扫描 docs/blog/ 下的所有文章
import { createContentLoader } from 'vitepress'

export default createContentLoader('blog/**/*.md', {
  includeSrc: true,  // 需要源码来计算字数
  render: true,      // 需要渲染后的 HTML 作为 excerpt
  transform(rawData) {
    return rawData
      .filter(page => {
        // 排除 index.md
        const url = page.url
        return !url.endsWith('/blog/') && !url.endsWith('/blog/index') && !url.endsWith('/blog/index.html')
      })
      .map(page => {
        const fm = page.frontmatter || {}
        const src = page.src || ''

        // 计算中文字数（中文字符 + 英文单词）
        const stripped = src
          .replace(/---[\s\S]*?---/, '')   // 去掉 frontmatter
          .replace(/<[^>]+>/g, '')          // 去掉 HTML 标签
          .replace(/```[\s\S]*?```/g, '')   // 去掉代码块
          .replace(/[#*`~\[\]()>|_-]/g, '') // 去掉 Markdown 符号
          .trim()
        const chineseChars = (stripped.match(/[\u4e00-\u9fff]/g) || []).length
        const englishWords = stripped.replace(/[\u4e00-\u9fff]/g, ' ').split(/\s+/).filter(w => w.length > 0).length
        const wordCount = chineseChars + englishWords
        const readingTime = Math.max(1, Math.ceil(wordCount / 300))

        // 提取 <!-- more --> 之前的内容作为摘要，或使用 frontmatter description
        let excerpt = fm.description || ''
        if (!excerpt && page.html) {
          // 从渲染后的 HTML 中取第一段
          const match = page.html.match(/<p>([\s\S]*?)<\/p>/)
          if (match) {
            excerpt = match[1].replace(/<[^>]+>/g, '').trim()
          }
        }
        // 截断过长摘要
        if (excerpt.length > 200) {
          excerpt = excerpt.slice(0, 200) + '...'
        }

        // 从路径推断分类
        const urlParts = page.url.replace(/^\/blog\//, '').split('/')
        const category = urlParts.length > 1 ? urlParts.slice(0, -1).join('/') : ''

        return {
          title: fm.title || page.url.split('/').pop()?.replace('.html', '') || '无标题',
          url: page.url,
          date: fm.date || fm.createTime || '',
          tags: fm.tags || [],
          description: excerpt,
          category: fm.category || category,
          sticky: fm.sticky || fm.pinned || false,
          wordCount,
          readingTime,
        }
      })
      .sort((a, b) => {
        // 置顶优先（数字越大越靠前）
        const stickyA = typeof a.sticky === 'number' ? a.sticky : (a.sticky ? 1 : 0)
        const stickyB = typeof b.sticky === 'number' ? b.sticky : (b.sticky ? 1 : 0)
        if (stickyA !== stickyB) return stickyB - stickyA
        // 日期降序
        if (!a.date && !b.date) return 0
        if (!a.date) return 1
        if (!b.date) return -1
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      })
  }
})