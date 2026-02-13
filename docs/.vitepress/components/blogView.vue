<template>
  <div class="blog-layout">
    <!-- ============ 主内容区 ============ -->
    <main class="blog-main">

      <!-- 分类导航条 -->
      <nav class="blog-cats-nav" v-if="allCategories.length > 0">
        <button
          class="cat-btn"
          :class="{ active: selectedCategory === '' }"
          @click="selectedCategory = ''"
        >
          <span class="cat-icon">📋</span>
          <span class="cat-text">全部</span>
        </button>
        <button
          v-for="cat in allCategories"
          :key="cat"
          class="cat-btn"
          :class="{ active: selectedCategory === cat }"
          @click="selectedCategory = selectedCategory === cat ? '' : cat"
        >
          <span class="cat-icon">📁</span>
          <span class="cat-text">{{ cat }}</span>
        </button>
      </nav>

      <!-- 文章列表 -->
      <div class="blog-post-list">
        <div
          v-for="post in paginatedPosts"
          :key="post.url"
          class="post-item"
        >
          <div class="post-item-content">
            <!-- 标题 -->
            <h3>
              <span v-if="post.sticky" class="sticky-badge">TOP</span>
              <a :href="post.url">{{ post.title }}</a>
            </h3>

            <!-- 元信息 -->
            <div class="post-meta">
              <!-- 分类 -->
              <div v-if="post.category" class="meta-category">
                <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                <a
                  href="javascript:;"
                  @click.prevent="selectedCategory = post.category"
                >{{ post.category }}</a>
              </div>

              <!-- 字数 / 阅读时间 -->
              <div class="meta-reading" v-if="post.wordCount">
                <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                <span>约 {{ post.wordCount }} 字</span>
                <span>{{ post.readingTime }} 分钟</span>
              </div>

              <!-- 标签 -->
              <div v-if="post.tags.length" class="meta-tags">
                <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                <a
                  v-for="tag in post.tags.slice(0, 4)"
                  :key="tag"
                  class="tag-item"
                  href="javascript:;"
                  @click.prevent="selectedTag = selectedTag === tag ? '' : tag"
                  :class="{ 'tag-active': selectedTag === tag }"
                >{{ tag }}</a>
              </div>

              <!-- 日期 -->
              <div v-if="post.date" class="meta-date">
                <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span>{{ formatDate(post.date) }}</span>
              </div>
            </div>

            <!-- 摘要 -->
            <div v-if="post.description" class="post-excerpt">
              <p>{{ post.description }}</p>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="filteredPosts.length === 0" class="blog-empty">
          <p>🫥 暂无文章</p>
          <p class="blog-empty-sub">在 <code>docs/blog/</code> 下创建 Markdown 文件并添加 frontmatter 即可</p>
        </div>
      </div>

      <!-- 分页 -->
      <nav v-if="totalPages > 1" class="blog-pagination">
        <button
          class="page-btn"
          :disabled="currentPage <= 1"
          @click="currentPage--"
        >上一页</button>
        <button
          v-for="p in displayPages"
          :key="p"
          class="page-btn page-num"
          :class="{ active: currentPage === p, dots: p === '...' }"
          :disabled="p === '...'"
          @click="typeof p === 'number' && (currentPage = p)"
        >{{ p }}</button>
        <button
          class="page-btn"
          :disabled="currentPage >= totalPages"
          @click="currentPage++"
        >下一页</button>
      </nav>
    </main>

    <!-- ============ 右侧侧边栏 ============ -->
    <aside class="blog-sidebar">
      <!-- 作者卡片 -->
      <div class="sidebar-card author-card">
        <img
          class="author-avatar"
          src="/media/icon/logo.svg"
          alt="avatar"
        />
        <h3 class="author-name">Wolfe</h3>
        <p class="author-desc">Wolfe の储物间</p>
        <div class="author-stats">
          <a href="javascript:;" class="stat-item" @click.prevent="selectedTag = ''; selectedCategory = ''">
            <span class="stat-label">标签</span>
            <span class="stat-num">{{ allTags.length }}</span>
          </a>
          <a href="javascript:;" class="stat-item" @click.prevent>
            <span class="stat-label">分类</span>
            <span class="stat-num">{{ allCategories.length }}</span>
          </a>
          <a href="javascript:;" class="stat-item" @click.prevent>
            <span class="stat-label">归档</span>
            <span class="stat-num">{{ posts.length }}</span>
          </a>
        </div>
      </div>

      <!-- 标签云 -->
      <div v-if="allTags.length > 0" class="sidebar-card tags-card">
        <h4 class="sidebar-card-title">标签</h4>
        <div class="tags-cloud">
          <a
            v-for="tag in allTags"
            :key="tag"
            class="cloud-tag"
            :class="{ active: selectedTag === tag }"
            href="javascript:;"
            @click.prevent="selectedTag = selectedTag === tag ? '' : tag"
          >{{ tag }}</a>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { data as posts } from '../blog.data.js'

const POSTS_PER_PAGE = 15
const currentPage = ref(1)
const selectedTag = ref('')
const selectedCategory = ref('')

// 所有标签
const allTags = computed(() => {
  const tagSet = new Set()
  posts.forEach(p => p.tags.forEach(t => tagSet.add(t)))
  return [...tagSet].sort()
})

// 所有分类
const allCategories = computed(() => {
  const catSet = new Set()
  posts.forEach(p => {
    if (p.category) catSet.add(p.category)
  })
  return [...catSet].sort()
})

// 过滤
const filteredPosts = computed(() => {
  return posts.filter(p => {
    if (selectedTag.value && !p.tags.includes(selectedTag.value)) return false
    if (selectedCategory.value && p.category !== selectedCategory.value) return false
    return true
  })
})

// 分页
const totalPages = computed(() => Math.ceil(filteredPosts.value.length / POSTS_PER_PAGE))
const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * POSTS_PER_PAGE
  return filteredPosts.value.slice(start, start + POSTS_PER_PAGE)
})

// 显示的页码
const displayPages = computed(() => {
  const total = totalPages.value
  const cur = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = [1]
  if (cur > 3) pages.push('...')
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) {
    pages.push(i)
  }
  if (cur < total - 2) pages.push('...')
  pages.push(total)
  return pages
})

// 筛选变化时回到第一页
watch([selectedTag, selectedCategory], () => {
  currentPage.value = 1
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}
</script>

<style scoped>
/* ================================================================
   两栏布局
   ================================================================ */
.blog-layout {
  display: flex;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
  align-items: flex-start;
}

.blog-main {
  flex: 1;
  min-width: 0;
}

.blog-sidebar {
  width: 260px;
  flex-shrink: 0;
  position: sticky;
  top: calc(var(--vp-nav-height) + 24px);
}

@media (max-width: 960px) {
  .blog-layout {
    flex-direction: column;
  }
  .blog-sidebar {
    width: 100%;
    position: static;
    order: -1;
  }
}

/* ================================================================
   分类导航条
   ================================================================ */
.blog-cats-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.cat-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  cursor: pointer;
  transition: all 0.25s ease;
  min-width: 70px;
}

.cat-btn:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.cat-btn.active {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.cat-icon {
  font-size: 18px;
}

.cat-text {
  font-size: 12px;
  color: var(--vp-c-text-2);
  white-space: nowrap;
}

.cat-btn.active .cat-text {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

/* ================================================================
   文章卡片
   ================================================================ */
.blog-post-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-item {
  padding: 24px 20px;
  background: var(--vp-c-bg);
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.04);
  transition: background-color 0.3s, box-shadow 0.3s;
}

.post-item:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.06);
}

.post-item-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 标题 */
.post-item-content h3 {
  display: flex;
  align-items: center;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--vp-c-text-1);
  transition: color 0.3s;
}

.post-item-content h3 a {
  color: inherit;
  text-decoration: none;
}

.post-item:hover h3 {
  color: var(--vp-c-brand-1);
}

/* TOP 徽章 */
.sticky-badge {
  display: inline-block;
  padding: 3px 6px;
  margin-right: 0.5rem;
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  color: var(--vp-c-text-2);
  background-color: var(--vp-c-brand-soft);
  border-radius: 4px;
  flex-shrink: 0;
}

/* ================================================================
   元信息行
   ================================================================ */
.post-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  align-items: center;
  font-size: 14px;
  color: var(--vp-c-text-2);
}

.post-meta > div {
  display: flex;
  gap: 6px;
  align-items: center;
}

.meta-icon {
  width: 14px;
  height: 14px;
  color: var(--vp-c-text-3);
  flex-shrink: 0;
}

/* 分类链接 */
.meta-category a {
  color: var(--vp-c-text-2);
  text-decoration: none;
  transition: color 0.2s;
}
.meta-category a:hover {
  color: var(--vp-c-brand-1);
}

/* 标签 */
.tag-item {
  display: inline-block;
  padding: 3px 5px;
  font-size: 12px;
  line-height: 1;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  border-radius: 3px;
  text-decoration: none;
  transition: all 0.2s;
}
.tag-item:hover,
.tag-item.tag-active {
  background: var(--vp-c-brand-1);
  color: #fff;
}

/* 日期 */
.meta-date span {
  font-variant-numeric: tabular-nums;
}

/* ================================================================
   摘要
   ================================================================ */
.post-excerpt {
  margin-top: 4px;
}

.post-excerpt p {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--vp-c-text-2);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ================================================================
   分页
   ================================================================ */
.blog-pagination {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 32px;
  flex-wrap: wrap;
}

.page-btn {
  min-width: 36px;
  height: 36px;
  padding: 0 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled):not(.dots) {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.page-btn.active {
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  color: #fff;
  font-weight: 600;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-btn.dots {
  border: none;
  background: none;
  cursor: default;
}

/* ================================================================
   侧边栏 - 作者卡片
   ================================================================ */
.sidebar-card {
  background: var(--vp-c-bg);
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.04);
  padding: 24px 20px;
  margin-bottom: 16px;
  transition: background-color 0.3s, box-shadow 0.3s;
}

.author-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.author-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 12px;
  border: 3px solid var(--vp-c-bg-soft);
}

.author-name {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.author-desc {
  margin: 0 0 16px;
  font-size: 14px;
  color: var(--vp-c-text-3);
}

.author-stats {
  display: flex;
  width: 100%;
  border-top: 1px solid var(--vp-c-divider);
  padding-top: 16px;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-decoration: none;
  color: inherit;
  transition: color 0.2s;
}

.stat-item:hover {
  color: var(--vp-c-brand-1);
}

.stat-label {
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.stat-num {
  font-size: 18px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  font-variant-numeric: tabular-nums;
}

.stat-item:hover .stat-num {
  color: var(--vp-c-brand-1);
}

/* ================================================================
   侧边栏 - 标签云
   ================================================================ */
.sidebar-card-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.tags-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.cloud-tag {
  display: inline-block;
  padding: 3px 8px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
  border-radius: 4px;
  text-decoration: none;
  transition: all 0.2s;
}

.cloud-tag:hover {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.cloud-tag.active {
  color: #fff;
  background: var(--vp-c-brand-1);
}

/* ================================================================
   空状态
   ================================================================ */
.blog-empty {
  text-align: center;
  padding: 60px 20px;
  color: var(--vp-c-text-3);
}
.blog-empty p { margin: 8px 0; }
.blog-empty-sub { font-size: 13px; }
.blog-empty code {
  background: var(--vp-c-bg-soft);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

/* ================================================================
   暗色模式
   ================================================================ */
.dark .post-item {
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.dark .post-item:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.25);
}
.dark .sidebar-card {
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.dark .sticky-badge {
  color: var(--vp-c-brand-1);
}

/* ================================================================
   响应式
   ================================================================ */
@media (max-width: 768px) {
  .post-item {
    padding: 16px;
  }
  .post-item-content h3 {
    font-size: 16px;
  }
  .post-meta {
    gap: 4px 10px;
    font-size: 13px;
  }
  .blog-cats-nav {
    gap: 6px;
  }
  .cat-btn {
    padding: 8px 10px;
    min-width: 56px;
  }
  .blog-pagination {
    gap: 4px;
  }
  .page-btn {
    min-width: 32px;
    height: 32px;
    padding: 0 8px;
    font-size: 13px;
  }

  /* 移动端作者卡片横排 */
  .author-card {
    flex-direction: row;
    flex-wrap: wrap;
    text-align: left;
    gap: 0 16px;
  }
  .author-avatar {
    width: 56px;
    height: 56px;
    margin-bottom: 0;
  }
  .author-name { font-size: 16px; }
  .author-desc { margin-bottom: 0; }
  .author-stats {
    margin-top: 12px;
    width: 100%;
  }
}
</style>