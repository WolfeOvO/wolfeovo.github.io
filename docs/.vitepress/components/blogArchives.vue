<script setup>
import { computed } from 'vue'
import { useRouter } from 'vitepress'
import { data as blogPosts } from '../blog.data.js'

const router = useRouter()

const posts = computed(() => blogPosts || [])

// 按年份分组
const yearGroups = computed(() => {
  const groups = {}
  posts.value.forEach(post => {
    let year = '未知'
    if (post.date) {
      const d = new Date(post.date)
      if (!isNaN(d.getTime())) {
        year = d.getFullYear().toString()
      }
    }
    if (!groups[year]) groups[year] = []
    groups[year].push(post)
  })

  // 按年份降序，每年内按日期降序
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([year, items]) => ({
      year,
      count: items.length,
      posts: items.sort((a, b) => {
        if (a.date && b.date) return new Date(b.date) - new Date(a.date)
        return 0
      })
    }))
})

function navigateTo(url) {
  router.go(url)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${month}-${day}`
}
</script>

<template>
  <div class="blog-archives-page">
    <div class="archives-container">
      <!-- 标题 -->
      <div class="page-header">
        <h2 class="page-title">归档</h2>
      </div>

      <!-- 时间轴 -->
      <div class="timeline" v-if="yearGroups.length > 0">
        <div
          v-for="group in yearGroups"
          :key="group.year"
          class="year-group"
        >
          <!-- 年份标题 -->
          <div class="year-header">
            <span class="year-label">{{ group.year }}</span>
            <span class="year-count">{{ group.count }} 篇</span>
          </div>

          <!-- 该年的文章列表 -->
          <div class="year-posts">
            <article
              v-for="post in group.posts"
              :key="post.url"
              class="archive-item"
              @click="navigateTo(post.url)"
            >
              <div class="timeline-node">
                <div class="node-dot"></div>
              </div>
              <div class="item-body">
                <h3 class="item-title">{{ post.title }}</h3>
                <div class="item-meta">
                  <span class="item-date" v-if="post.date">{{ formatDate(post.date) }}</span>
                  <div class="item-tags" v-if="post.tags && post.tags.length">
                    <span
                      v-for="tag in post.tags.slice(0, 3)"
                      :key="tag"
                      class="mini-tag"
                    >{{ tag }}</span>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div class="empty-icon">📦</div>
        <p>暂无归档文章</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.blog-archives-page {
  max-width: 860px;
  margin: 0 auto;
  padding: 32px 24px 80px;
  min-height: calc(100vh - var(--vp-nav-height, 64px) - 100px);
}

.page-header {
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--vp-c-brand-soft);
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin: 0;
}

/* ========== 时间轴 ========== */
.timeline {
  position: relative;
}

/* ========== 年份组 ========== */
.year-group {
  margin-bottom: 8px;
}

.year-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  position: sticky;
  top: var(--vp-nav-height, 64px);
  z-index: 10;
  background: var(--vp-c-bg-alt, var(--plume-bg, #f5f7fa));
}

:root.dark .year-header {
  background: var(--vp-c-bg-alt, var(--plume-bg, #161820));
}

.year-label {
  font-size: 22px;
  font-weight: 700;
  color: var(--vp-c-text-1);
  letter-spacing: -0.02em;
}

.year-count {
  font-size: 14px;
  color: var(--vp-c-text-3);
  padding: 2px 10px;
  background: var(--vp-c-bg-soft);
  border-radius: 10px;
}

/* ========== 文章列表 ========== */
.year-posts {
  position: relative;
  padding-left: 24px;
  margin-left: 11px;
  border-left: 2px solid var(--vp-c-divider);
}

.archive-item {
  display: flex;
  align-items: flex-start;
  gap: 0;
  padding: 10px 0;
  cursor: pointer;
  position: relative;
}

.archive-item:hover .item-title {
  color: var(--vp-c-brand-1);
}

.archive-item:hover .node-dot {
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-soft);
  transform: scale(1.3);
}

/* ========== 时间轴节点 ========== */
.timeline-node {
  position: absolute;
  left: -32px;
  top: 16px;
  width: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.node-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--vp-c-bg);
  border: 2px solid var(--vp-c-divider);
  transition: all 0.25s ease;
}

/* ========== 文章内容 ========== */
.item-body {
  flex: 1;
  padding: 4px 16px;
  border-radius: 10px;
  transition: background 0.2s;
}

.archive-item:hover .item-body {
  background: var(--vp-c-bg-soft);
}

.item-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  margin: 0 0 6px;
  line-height: 1.5;
  transition: color 0.2s;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.item-date {
  font-size: 13px;
  color: var(--vp-c-text-3);
  font-variant-numeric: tabular-nums;
}

.item-tags {
  display: flex;
  gap: 4px;
}

.mini-tag {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 8px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-weight: 500;
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
  margin: 0;
}

/* ========== Responsive ========== */
@media (max-width: 768px) {
  .blog-archives-page {
    padding: 20px 16px 64px;
  }

  .year-posts {
    padding-left: 20px;
    margin-left: 8px;
  }

  .timeline-node {
    left: -28px;
  }

  .item-body {
    padding: 4px 12px;
  }
}
</style>