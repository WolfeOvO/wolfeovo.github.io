// Blog posts data loader for VitePress
// This runs at build time to collect blog post metadata
import { createContentLoader } from 'vitepress'

export default createContentLoader('blog/**/*.md', {
  includeSrc: false,
  transform(rawData) {
    return rawData
      // 排除特殊页面（标签页、归档页等）
      .filter(page => {
        const url = page.url.toLowerCase()
        return !url.includes('/tags') && !url.includes('/archives')
      })
      .map(page => ({
        title: page.frontmatter.title || extractTitle(page.url),
        url: page.url,
        date: page.frontmatter.date || extractDateFromUrl(page.url),
        tags: page.frontmatter.tags || [],
        description: page.frontmatter.description || page.excerpt || '',
      }))
      .sort((a, b) => {
        // 按日期降序
        if (a.date && b.date) {
          return new Date(b.date) - new Date(a.date)
        }
        return b.url.localeCompare(a.url)
      })
  }
})

function extractTitle(url) {
  const parts = url.split('/')
  const last = parts[parts.length - 1] || parts[parts.length - 2]
  return last.replace(/\.html$/, '').replace(/-/g, ' ')
}

function extractDateFromUrl(url) {
  const match = url.match(/\/(\d{4})\/(\d{4})-(\d+)\//)
  if (match) {
    return `${match[1]}-${match[3].padStart(2, '0')}-01`
  }
  return ''
}