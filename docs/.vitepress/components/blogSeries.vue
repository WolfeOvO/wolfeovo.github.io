<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vitepress'
import { data as blogPosts } from '../blog.data.js'

const router = useRouter()
const posts = computed(() => blogPosts || [])
const expandedSeries = ref({})

// 柔和的主题色调色板（亮/暗模式通用）
const colorPalette = [
  { accent: '#3b82f6', soft: 'rgba(59,130,246,0.1)',  softHover: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.25)'  },  // 蓝
  { accent: '#8b5cf6', soft: 'rgba(139,92,246,0.1)',   softHover: 'rgba(139,92,246,0.15)',  border: 'rgba(139,92,246,0.25)'  },  // 紫
  { accent: '#ec4899', soft: 'rgba(236,72,153,0.1)',   softHover: 'rgba(236,72,153,0.15)',  border: 'rgba(236,72,153,0.25)'  },  // 粉
  { accent: '#f59e0b', soft: 'rgba(245,158,11,0.1)',   softHover: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.25)'  },  // 琥珀
  { accent: '#10b981', soft: 'rgba(16,185,129,0.1)',   softHover: 'rgba(16,185,129,0.15)',  border: 'rgba(16,185,129,0.25)'  },  // 翠绿
  { accent: '#ef4444', soft: 'rgba(239,68,68,0.1)',    softHover: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.25)'   },  // 红
  { accent: '#06b6d4', soft: 'rgba(6,182,212,0.1)',    softHover: 'rgba(6,182,212,0.15)',   border: 'rgba(6,182,212,0.25)'   },  // 青
  { accent: '#f97316', soft: 'rgba(249,115,22,0.1)',   softHover: 'rgba(249,115,22,0.15)',  border: 'rgba(249,115,22,0.25)'  },  // 橙
]

// 图标列表（每个合辑分配不同图标）
const iconList = ['📚', '📖', '🗂️', '📝', '🎯', '🔬', '💡', '🧩']

function getColor(index) {
  return colorPalette[index % colorPalette.length]
}

function getIcon(index) {
  return iconList[index % iconList.length]
}

// 按合辑分组，每个合辑内按 series_order 排序
const seriesGroups = computed(() => {
  const groups = {}
  posts.value.forEach(post => {
    if (post.series) {
      if (!groups[post.series]) groups[post.series] = { posts: [], icon: '' }
      groups[post.series].posts.push(post)
      // 取第一个带 series_icon 的文章作为合辑图标
      if (post.series_icon && !groups[post.series].icon) {
        groups[post.series].icon = post.series_icon
      }
    }
  })

  return Object.entries(groups)
    .map(([name, data], _idx) => ({
      name,
      count: data.posts.length,
      customIcon: data.icon,
      posts: data.posts.sort((a, b) => (a.series_order || 0) - (b.series_order || 0)),
      lastUpdated: data.posts.reduce((latest, p) => {
        if (!p.date) return latest
        return (!latest || new Date(p.date) > new Date(latest)) ? p.date : latest
      }, '')
    }))
    .sort((a, b) => {
      if (a.lastUpdated && b.lastUpdated) {
        return new Date(b.lastUpdated) - new Date(a.lastUpdated)
      }
      return a.name.localeCompare(b.name)
    })
})

function toggleSeries(name) {
  expandedSeries.value[name] = !expandedSeries.value[name]
}

function isExpanded(name) {
  return expandedSeries.value[name] !== false
}

function navigateTo(url) {
  router.go(url)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// 为每个合辑卡片生成 CSS 变量
function cardStyle(index) {
  const c = getColor(index)
  return {
    '--s-accent': c.accent,
    '--s-soft': c.soft,
    '--s-soft-hover': c.softHover,
    '--s-border': c.border,
  }
}
</script>

<template>
  <div class="series-page">
    <div class="series-header">
      <h1 class="title">合辑</h1>
      <p class="subtitle">共 {{ seriesGroups.length }} 个合辑，{{ posts.filter(p => p.series).length }} 篇文章</p>
    </div>

    <!-- 无合辑 -->
    <div v-if="seriesGroups.length === 0" class="empty-state">
      <div class="empty-icon">📚</div>
      <p>暂无合辑</p>
      <p class="empty-hint">在文章 frontmatter 中添加 <code>series</code> 和 <code>series_order</code> 字段即可创建合辑</p>
    </div>

    <!-- 合辑列表 -->
    <div class="series-list">
      <div
        v-for="(group, index) in seriesGroups"
        :key="group.name"
        class="series-card"
        :style="cardStyle(index)"
      >
        <!-- 左侧色条 -->
        <div class="series-color-bar"></div>

        <div class="series-card-body">
          <!-- 合辑标题栏 -->
          <div class="series-card-header" @click="toggleSeries(group.name)">
            <div class="series-info">
              <span class="series-icon">{{ group.customIcon || getIcon(index) }}</span>
              <h2 class="series-name">{{ group.name }}</h2>
              <span class="series-count">{{ group.count }} 篇</span>
            </div>
            <div class="series-meta">
              <span v-if="group.lastUpdated" class="series-date">
                更新于 {{ formatDate(group.lastUpdated) }}
              </span>
              <span class="expand-icon" :class="{ collapsed: !isExpanded(group.name) }">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </span>
            </div>
          </div>

          <!-- 合辑文章列表 -->
          <div v-show="isExpanded(group.name)" class="series-posts">
            <div
              v-for="(post, pIndex) in group.posts"
              :key="post.url"
              class="series-post-item"
              @click="navigateTo(post.url)"
            >
              <span class="post-order">
                <template v-if="post.icon">{{ post.icon }}</template>
                <template v-else>{{ pIndex + 1 }}</template>
              </span>
              <div class="post-info">
                <h3 class="post-title">{{ post.title }}</h3>
                <p v-if="post.description" class="post-desc">{{ post.description }}</p>
              </div>
              <span v-if="post.date" class="post-date">{{ formatDate(post.date) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.series-page {
  max-width: 860px;
  margin: 0 auto;
  padding: 32px 24px 80px;
  min-height: calc(100vh - var(--vp-nav-height, 64px) - 100px);
}

.series-header {
  margin-bottom: 40px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--vp-c-brand-soft);
}

.title {
  font-size: 28px;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 15px;
  color: var(--vp-c-text-3);
  margin: 0;
}

/* ========== 合辑卡片 ========== */
.series-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.series-card {
  display: flex;
  border: 1px solid var(--s-border, var(--vp-c-divider));
  border-radius: 16px;
  overflow: hidden;
  background: var(--vp-c-bg);
  transition: all 0.25s ease;
}

.series-card:hover {
  border-color: var(--s-accent, var(--vp-c-brand-1));
  box-shadow: 0 4px 20px var(--s-soft, rgba(0,0,0,0.05));
}

/* 左侧色条 */
.series-color-bar {
  width: 4px;
  flex-shrink: 0;
  background: var(--s-accent, var(--vp-c-brand-1));
  border-radius: 16px 0 0 16px;
}

.series-card-body {
  flex: 1;
  min-width: 0;
}

.series-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  cursor: pointer;
  transition: background 0.2s;
  user-select: none;
}

.series-card-header:hover {
  background: var(--s-soft, var(--vp-c-bg-soft));
}

.series-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.series-icon {
  font-size: 22px;
  flex-shrink: 0;
}

.series-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.series-count {
  font-size: 13px;
  color: var(--s-accent, var(--vp-c-text-3));
  background: var(--s-soft, var(--vp-c-default-soft));
  padding: 2px 10px;
  border-radius: 12px;
  flex-shrink: 0;
  white-space: nowrap;
  font-weight: 500;
}

.series-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.series-date {
  font-size: 13px;
  color: var(--vp-c-text-3);
}

.expand-icon {
  display: inline-flex;
  color: var(--vp-c-text-3);
  transition: transform 0.3s ease;
}

.expand-icon.collapsed {
  transform: rotate(-90deg);
}

/* ========== 合辑内文章列表 ========== */
.series-posts {
  border-top: 1px solid var(--s-border, var(--vp-c-divider));
}

.series-post-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 24px;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid color-mix(in srgb, var(--s-border, var(--vp-c-divider)) 50%, transparent);
}

.series-post-item:last-child {
  border-bottom: none;
}

.series-post-item:hover {
  background: var(--s-soft-hover, var(--vp-c-brand-soft));
}

.post-order {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--s-soft, var(--vp-c-default-soft));
  color: var(--s-accent, var(--vp-c-text-2));
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
  transition: all 0.2s;
}

.series-post-item:hover .post-order {
  background: var(--s-accent, var(--vp-c-brand-1));
  color: #fff;
}

.post-info {
  flex: 1;
  min-width: 0;
}

.post-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s;
}

.series-post-item:hover .post-title {
  color: var(--s-accent, var(--vp-c-brand-1));
}

.post-desc {
  font-size: 13px;
  color: var(--vp-c-text-3);
  margin: 4px 0 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-date {
  font-size: 13px;
  color: var(--vp-c-text-3);
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}

/* ========== Empty State ========== */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: var(--vp-c-text-3);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-state p {
  font-size: 15px;
  margin: 4px 0;
}

.empty-hint {
  margin-top: 12px !important;
  font-size: 13px !important;
  opacity: 0.7;
}

.empty-hint code {
  font-size: 12px;
  background: var(--vp-c-default-soft);
  padding: 2px 6px;
  border-radius: 4px;
}

/* ========== Responsive ========== */
@media (max-width: 768px) {
  .series-page {
    padding: 20px 16px 64px;
  }

  .series-card-header {
    padding: 16px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .series-meta {
    width: 100%;
    justify-content: space-between;
  }

  .series-post-item {
    padding: 12px 16px;
  }

  .post-date {
    display: none;
  }

  .post-title {
    white-space: normal;
  }
}
</style>