<script setup>
import { computed } from 'vue'
import { useRouter, useData } from 'vitepress'
import { data as blogPosts } from '../blog.data.js'
import IconRenderer from './IconRenderer.vue'

const router = useRouter()
const { theme } = useData()
const posts = computed(() => blogPosts || [])

// 博客图标配置
const blogIcons = computed(() => theme.value.blogIcons || {})
const archivesIcon = computed(() => blogIcons.value.archives || '📅')

// 按年份分组逻辑
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
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${month}-${day}`
}
</script>

<template>
  <div class="archives-container">
    <div class="archives-header">
      <h1 class="title">
        <IconRenderer :icon="archivesIcon" size="32px" fallback="📅" />
        文章归档
      </h1>
      <p class="subtitle">目前共计 {{ posts.length }} 篇文章</p>
    </div>

    <div class="timeline">
      <div v-for="group in yearGroups" :key="group.year" class="timeline-year-section">
        <!-- 年份节点 -->
        <div class="year-marker">
          <span class="year-text">{{ group.year }}</span>
          <span class="year-count">{{ group.count }} 篇</span>
        </div>

        <!-- 该年份下的文章列表 -->
        <div class="post-list">
          <div 
            v-for="post in group.posts" 
            :key="post.url" 
            class="timeline-item"
            @click="navigateTo(post.url)"
          >
            <!-- 轴上的小圆点 -->
            <div class="item-dot"></div>
            
            <div class="item-content">
              <span class="item-date">{{ formatDate(post.date) }}</span>
              <IconRenderer v-if="post.icon" :icon="post.icon" size="18px" class="item-icon" />
              <h3 class="item-title">{{ post.title }}</h3>
              <div v-if="post.tags && post.tags.length" class="item-tags">
                <span v-for="tag in post.tags.slice(0, 2)" :key="tag" class="mini-tag">
                  #{{ tag }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.archives-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 24px;
}

.archives-header {
  margin-bottom: 48px;
  text-align: center;
}

.title {
  font-size: 32px;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.subtitle {
  font-size: 16px;
  color: var(--vp-c-text-3);
}

/* ========== 时间轴核心结构 ========== */
.timeline {
  position: relative;
  padding-left: 20px;
}

/* 垂直的主干线 */
.timeline::before {
  content: "";
  position: absolute;
  left: 0;
  top: 10px;
  bottom: 0;
  width: 2px;
  background: var(--vp-c-divider);
  opacity: 0.5;
}

.timeline-year-section {
  position: relative;
  margin-bottom: 40px;
}

/* 年份标记 */
.year-marker {
  position: relative;
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 24px;
  margin-left: -20px; /* 抵消 timeline 的 padding */
  z-index: 1;
}

.year-text {
  font-size: 24px;
  font-weight: 700;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-bg);
  padding-right: 12px;
}

.year-count {
  font-size: 14px;
  color: var(--vp-c-text-3);
}

/* 文章条目 */
.post-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.timeline-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: transparent;
}

.timeline-item:hover {
  background: var(--vp-c-brand-soft);
  transform: translateX(8px);
}

/* 轴上的动态圆点 */
.item-dot {
  position: absolute;
  left: -24px; /* 对齐父级 timeline 的线 */
  top: 20px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--vp-c-bg);
  border: 2px solid var(--vp-c-divider);
  z-index: 2;
  transition: all 0.3s ease;
}

.timeline-item:hover .item-dot {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-1);
  box-shadow: 0 0 0 4px var(--vp-c-brand-soft);
}

.item-content {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.item-date {
  font-size: 14px;
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-3);
  min-width: 50px;
}

.item-icon {
  flex-shrink: 0;
}

.item-title {
  flex: 1;
  font-size: 16px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  margin: 0;
  transition: color 0.2s;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timeline-item:hover .item-title {
  color: var(--vp-c-brand-1);
}

.item-tags {
  display: flex;
  gap: 6px;
}

.mini-tag {
  font-size: 12px;
  color: var(--vp-c-text-3);
  opacity: 0.7;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .item-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .item-date {
    font-size: 12px;
  }
  
  .item-tags {
    display: none;
  }
}
</style>