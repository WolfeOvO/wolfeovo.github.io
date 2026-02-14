<script setup>
import { ref, computed } from 'vue'
import { useRouter, useData } from 'vitepress'
import { data as blogPosts } from '../blog.data.js'
import IconRenderer from './iconRenderer.vue'

const router = useRouter()
const { theme } = useData()
const activeTag = ref('')

// 博客图标配置
const blogIcons = computed(() => theme.value.blogIcons || {})
const tagsIcon = computed(() => blogIcons.value.tags || '🏷️')

// 从 URL 读取初始标签
if (typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search)
  activeTag.value = params.get('tag') || ''
}

const posts = computed(() => blogPosts || [])

// 统计每个标签的文章数
const tagStats = computed(() => {
  const map = {}
  posts.value.forEach(p => {
    if (p.tags) {
      p.tags.forEach(t => {
        map[t] = (map[t] || 0) + 1
      })
    }
  })
  return Object.entries(map)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
})

// 标签大小计算
function tagSize(count) {
  const max = Math.max(...tagStats.value.map(t => t.count), 1)
  const min = Math.min(...tagStats.value.map(t => t.count), 1)
  if (max === min) return 14
  const ratio = (count - min) / (max - min)
  return Math.round(13 + ratio * 11)
}

// 选中标签后过滤的文章
const filteredPosts = computed(() => {
  if (!activeTag.value) return []
  return posts.value.filter(p => p.tags && p.tags.includes(activeTag.value))
})

function selectTag(tag) {
  activeTag.value = activeTag.value === tag ? '' : tag
  if (typeof window !== 'undefined') {
    const url = new URL(window.location)
    if (activeTag.value) {
      url.searchParams.set('tag', activeTag.value)
    } else {
      url.searchParams.delete('tag')
    }
    window.history.replaceState({}, '', url)
  }
}

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
  <div class="blog-tags-page">
    <div class="tags-container">
      <!-- 标题 -->
      <div class="page-header">
        <h2 class="page-title">
          <IconRenderer :icon="tagsIcon" size="28px" fallback="🏷️" />
          标签
        </h2>
      </div>

      <!-- 标签云（有标签时才显示） -->
      <div class="tag-cloud-section" v-if="tagStats.length > 0">
        <div class="tag-cloud">
          <button
            v-for="tag in tagStats"
            :key="tag.name"
            class="cloud-tag"
            :class="{ active: activeTag === tag.name }"
            :style="{ fontSize: tagSize(tag.count) + 'px' }"
            @click="selectTag(tag.name)"
          >
            {{ tag.name }}<sup class="tag-count">{{ tag.count }}</sup>
          </button>
        </div>
      </div>

      <!-- 选中标签后显示文章列表 -->
      <div v-if="activeTag" class="tagged-posts">
        <div class="tagged-header">
          <span class="tagged-label">
            <span class="tag-icon">🏷️</span>
            {{ activeTag }}
          </span>
          <span class="tagged-count">{{ filteredPosts.length }} 篇文章</span>
        </div>

        <div class="tagged-list">
          <article
            v-for="post in filteredPosts"
            :key="post.url"
            class="tagged-item"
            @click="navigateTo(post.url)"
          >
            <div class="item-dot"></div>
            <div class="item-content">
              <h3 class="item-title">{{ post.title }}</h3>
              <span class="item-date" v-if="post.date">{{ formatDate(post.date) }}</span>
            </div>
          </article>
        </div>
      </div>

      <!-- 无标签提示 -->
      <div v-if="tagStats.length === 0" class="empty-state">
        <div class="empty-icon">🏷️</div>
        <p>暂无标签</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.blog-tags-page {
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
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ========== 标签云 ========== */
.tag-cloud-section {
  margin-bottom: 40px;
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  padding: 24px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
}

.cloud-tag {
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
  padding: 4px 14px;
  border: 1px solid transparent;
  border-radius: 20px;
  background: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  line-height: 1.6;
  white-space: nowrap;
}

.cloud-tag:hover {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.cloud-tag.active {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
  font-weight: 600;
}

.tag-count {
  font-size: 0.7em;
  color: var(--vp-c-text-3);
  margin-left: 1px;
  font-weight: 400;
}

.cloud-tag.active .tag-count,
.cloud-tag:hover .tag-count {
  color: var(--vp-c-brand-2);
}

/* ========== 选中标签后的文章列表 ========== */
.tagged-posts {
  animation: fadeSlideIn 0.3s ease;
}

@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.tagged-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 12px 20px;
  background: var(--vp-c-brand-soft);
  border-radius: 12px;
}

.tagged-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--vp-c-brand-1);
}

.tag-icon { font-size: 18px; }

.tagged-count {
  font-size: 14px;
  color: var(--vp-c-text-2);
}

.tagged-list {
  padding-left: 12px;
  border-left: 2px solid var(--vp-c-divider);
}

.tagged-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 12px 16px;
  margin-left: -1px;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 0 12px 12px 0;
}

.tagged-item:hover {
  background: var(--vp-c-bg-soft);
}

.item-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--vp-c-divider);
  margin-top: 8px;
  flex-shrink: 0;
  transition: background 0.2s;
}

.tagged-item:hover .item-dot {
  background: var(--vp-c-brand-1);
}

.item-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.item-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  margin: 0;
  line-height: 1.5;
  transition: color 0.2s;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tagged-item:hover .item-title {
  color: var(--vp-c-brand-1);
}

.item-date {
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
  margin: 0;
}

/* ========== Responsive ========== */
@media (max-width: 768px) {
  .blog-tags-page {
    padding: 20px 16px 64px;
  }

  .tag-cloud {
    padding: 16px;
    gap: 6px 8px;
  }

  .item-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .item-title {
    white-space: normal;
  }
}
</style>