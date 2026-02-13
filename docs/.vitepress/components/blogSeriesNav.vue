<script setup>
import { computed } from 'vue'
import { useData, useRouter } from 'vitepress'
import { data as blogPosts } from '../blog.data.js'

const { frontmatter } = useData()
const router = useRouter()

const currentSeries = computed(() => frontmatter.value.series || '')
const currentOrder = computed(() => frontmatter.value.series_order || 0)

// 色板（与 blogSeries.vue 一致）
const colorPalette = [
  { accent: '#3b82f6', soft: 'rgba(59,130,246,0.1)',  softHover: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.25)'  },
  { accent: '#8b5cf6', soft: 'rgba(139,92,246,0.1)',   softHover: 'rgba(139,92,246,0.15)',  border: 'rgba(139,92,246,0.25)'  },
  { accent: '#ec4899', soft: 'rgba(236,72,153,0.1)',   softHover: 'rgba(236,72,153,0.15)',  border: 'rgba(236,72,153,0.25)'  },
  { accent: '#f59e0b', soft: 'rgba(245,158,11,0.1)',   softHover: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.25)'  },
  { accent: '#10b981', soft: 'rgba(16,185,129,0.1)',   softHover: 'rgba(16,185,129,0.15)',  border: 'rgba(16,185,129,0.25)'  },
  { accent: '#ef4444', soft: 'rgba(239,68,68,0.1)',    softHover: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.25)'   },
  { accent: '#06b6d4', soft: 'rgba(6,182,212,0.1)',    softHover: 'rgba(6,182,212,0.15)',   border: 'rgba(6,182,212,0.25)'   },
  { accent: '#f97316', soft: 'rgba(249,115,22,0.1)',   softHover: 'rgba(249,115,22,0.15)',  border: 'rgba(249,115,22,0.25)'  },
]

// 用合辑名的 hash 决定颜色（保证同名合辑始终同色）
function hashStr(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

const seriesColor = computed(() => {
  if (!currentSeries.value) return colorPalette[0]
  return colorPalette[hashStr(currentSeries.value) % colorPalette.length]
})

const navStyle = computed(() => {
  const c = seriesColor.value
  return {
    '--s-accent': c.accent,
    '--s-soft': c.soft,
    '--s-soft-hover': c.softHover,
    '--s-border': c.border,
  }
})

// 获取同合辑的所有文章，按 series_order 排序
const seriesPosts = computed(() => {
  if (!currentSeries.value) return []
  return (blogPosts || [])
    .filter(p => p.series === currentSeries.value)
    .sort((a, b) => (a.series_order || 0) - (b.series_order || 0))
})

const currentIndex = computed(() => {
  return seriesPosts.value.findIndex(p => p.series_order === currentOrder.value)
})

const prevPost = computed(() => {
  const idx = currentIndex.value
  return idx > 0 ? seriesPosts.value[idx - 1] : null
})

const nextPost = computed(() => {
  const idx = currentIndex.value
  return idx >= 0 && idx < seriesPosts.value.length - 1 ? seriesPosts.value[idx + 1] : null
})

const hasSeries = computed(() => {
  return currentSeries.value && seriesPosts.value.length > 1
})

function navigateTo(url) {
  router.go(url)
}
</script>

<template>
  <div v-if="hasSeries" class="series-nav-container" :style="navStyle">
    <div class="series-nav-inner">
      <!-- 左侧色条 -->
      <div class="series-nav-bar"></div>

      <div class="series-nav-content">
        <!-- 合辑标题 -->
        <div class="series-nav-header">
          <span class="series-badge">📚 合辑</span>
          <h3 class="series-title">{{ currentSeries }}</h3>
          <span class="series-progress">{{ currentIndex + 1 }} / {{ seriesPosts.length }}</span>
        </div>

        <!-- 进度条 -->
        <div class="series-progress-bar">
          <div
            class="series-progress-fill"
            :style="{ width: ((currentIndex + 1) / seriesPosts.length * 100) + '%' }"
          ></div>
        </div>

        <!-- 文章目录 -->
        <div class="series-toc">
          <div
            v-for="(post, index) in seriesPosts"
            :key="post.url"
            class="series-toc-item"
            :class="{
              current: index === currentIndex,
              completed: index < currentIndex
            }"
            @click="index !== currentIndex && navigateTo(post.url)"
          >
            <span class="toc-order" :class="{ current: index === currentIndex }">
              <svg v-if="index < currentIndex" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span v-else>{{ index + 1 }}</span>
            </span>
            <span class="toc-title">{{ post.title }}</span>
          </div>
        </div>

        <!-- 上一篇 / 下一篇 -->
        <div class="series-nav-buttons">
          <button
            v-if="prevPost"
            class="nav-btn prev"
            @click="navigateTo(prevPost.url)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            <div class="nav-btn-text">
              <span class="nav-label">上一篇</span>
              <span class="nav-title">{{ prevPost.title }}</span>
            </div>
          </button>
          <div v-else class="nav-btn-placeholder"></div>

          <button
            v-if="nextPost"
            class="nav-btn next"
            @click="navigateTo(nextPost.url)"
          >
            <div class="nav-btn-text">
              <span class="nav-label">下一篇</span>
              <span class="nav-title">{{ nextPost.title }}</span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
          <div v-else class="nav-btn-placeholder"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.series-nav-container {
  margin: 48px 0 24px;
  padding-top: 32px;
  border-top: 1px solid var(--vp-c-divider);
}

.series-nav-inner {
  display: flex;
  background: var(--vp-c-bg);
  border: 1px solid var(--s-border, var(--vp-c-divider));
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.25s ease;
}

.series-nav-inner:hover {
  border-color: var(--s-accent, var(--vp-c-brand-1));
  box-shadow: 0 4px 20px var(--s-soft, rgba(0,0,0,0.05));
}

/* 左侧色条 */
.series-nav-bar {
  width: 4px;
  flex-shrink: 0;
  background: var(--s-accent, var(--vp-c-brand-1));
}

.series-nav-content {
  flex: 1;
  padding: 24px;
  min-width: 0;
}

/* ========== 头部 ========== */
.series-nav-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.series-badge {
  font-size: 13px;
  color: var(--s-accent, var(--vp-c-brand-1));
  background: var(--s-soft, var(--vp-c-brand-soft));
  padding: 3px 10px;
  border-radius: 12px;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
}

.series-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.series-progress {
  font-size: 13px;
  color: var(--vp-c-text-3);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

/* ========== 进度条 ========== */
.series-progress-bar {
  height: 3px;
  background: var(--s-soft, var(--vp-c-default-soft));
  border-radius: 2px;
  margin-bottom: 16px;
  overflow: hidden;
}

.series-progress-fill {
  height: 100%;
  background: var(--s-accent, var(--vp-c-brand-1));
  border-radius: 2px;
  transition: width 0.4s ease;
}

/* ========== 文章目录 ========== */
.series-toc {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 20px;
}

.series-toc-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.series-toc-item:hover:not(.current) {
  background: var(--s-soft, var(--vp-c-bg-soft));
}

.series-toc-item.current {
  background: var(--s-soft-hover, var(--vp-c-brand-soft));
  cursor: default;
}

.toc-order {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
  background: var(--s-soft, var(--vp-c-default-soft));
  color: var(--vp-c-text-3);
  transition: all 0.2s;
}

.toc-order.current {
  background: var(--s-accent, var(--vp-c-brand-1));
  color: #fff;
}

.series-toc-item.completed .toc-order {
  background: var(--s-soft, var(--vp-c-brand-soft));
  color: var(--s-accent, var(--vp-c-brand-1));
}

.toc-title {
  font-size: 14px;
  color: var(--vp-c-text-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s;
}

.series-toc-item.current .toc-title {
  color: var(--s-accent, var(--vp-c-brand-1));
  font-weight: 600;
}

.series-toc-item:hover:not(.current) .toc-title {
  color: var(--vp-c-text-1);
}

/* ========== 上下篇按钮 ========== */
.series-nav-buttons {
  display: flex;
  gap: 12px;
}

.nav-btn {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--s-border, var(--vp-c-divider));
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  color: var(--vp-c-text-2);
}

.nav-btn:hover {
  border-color: var(--s-accent, var(--vp-c-brand-1));
  background: var(--s-soft, var(--vp-c-brand-soft));
  color: var(--s-accent, var(--vp-c-brand-1));
}

.nav-btn.next {
  text-align: right;
  justify-content: flex-end;
}

.nav-btn-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.nav-label {
  font-size: 12px;
  color: var(--vp-c-text-3);
  font-weight: 500;
}

.nav-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s;
}

.nav-btn:hover .nav-title {
  color: var(--s-accent, var(--vp-c-brand-1));
}

.nav-btn-placeholder {
  flex: 1;
}

/* ========== Responsive ========== */
@media (max-width: 640px) {
  .series-nav-content {
    padding: 16px;
  }

  .series-nav-header {
    flex-wrap: wrap;
  }

  .series-nav-buttons {
    flex-direction: column;
  }

  .nav-btn.next {
    text-align: left;
    justify-content: flex-start;
    flex-direction: row-reverse;
  }
}
</style>