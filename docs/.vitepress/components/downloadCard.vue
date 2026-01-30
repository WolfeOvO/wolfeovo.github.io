<template>
  <section
    class="dl-card"
    :style="cssVars"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- shine 扫光层（整卡 hover） -->
    <div class="dl-shine" :style="{ opacity: isHovered ? 1 : 0 }"></div>

    <!-- ✅ wave 波浪动态背景层（不影响交互） -->
    <div class="dl-wave" aria-hidden="true">
      <span class="dl-wave-1"></span>
      <span class="dl-wave-2"></span>
      <span class="dl-wave-3"></span>
    </div>

    <!-- header -->
    <header class="dl-header">
      <!-- 文件 icon：只负责文件 -->
      <div class="dl-file-icon">
        <span v-if="fileIconSvg" v-html="fileIconSvg"></span>
        <span v-else v-html="icons.file"></span>
      </div>

      <div class="dl-title">
        <div class="dl-name">{{ name }}</div>
        <div class="dl-sub">
          <span class="dl-sub-item">
            <span class="dl-sub-ico"><span v-html="icons.tag"></span></span>
            <span class="dl-sub-text">{{ computedType }}</span>
          </span>
          <span class="dl-sub-item">
            <span class="dl-sub-ico"><span v-html="icons.database"></span></span>
            <span class="dl-sub-text">{{ computedSize }}</span>
          </span>
          <span v-if="version" class="dl-sub-item">
            <span class="dl-sub-ico"><span v-html="icons.version"></span></span>
            <span class="dl-sub-text">{{ version }}</span>
          </span>
          <span v-if="date" class="dl-sub-item">
            <span class="dl-sub-ico"><span v-html="icons.calendar"></span></span>
            <span class="dl-sub-text">{{ date }}</span>
          </span>
        </div>
      </div>

      <!-- 右侧徽章区域 -->
      <div v-if="badges && badges.length" class="dl-badges">
        <span
          v-for="(badge, idx) in badges"
          :key="idx"
          class="dl-badge"
          :class="badge.type ? `dl-badge-${badge.type}` : ''"
        >
          {{ badge.text || badge }}
        </span>
      </div>
    </header>

    <!-- ✅ 描述区域 -->
    <div v-if="description" class="dl-description">
      <p>{{ description }}</p>
    </div>

    <!-- ✅ 元信息网格 -->
    <div v-if="hasMetaInfo" class="dl-meta-grid">
      <div v-if="author" class="dl-meta-item">
        <span class="dl-meta-ico" v-html="icons.user"></span>
        <span class="dl-meta-label">作者</span>
        <span class="dl-meta-value">{{ author }}</span>
      </div>
      <div v-if="license" class="dl-meta-item">
        <span class="dl-meta-ico" v-html="icons.license"></span>
        <span class="dl-meta-label">许可证</span>
        <span class="dl-meta-value">{{ license }}</span>
      </div>
      <div v-if="platform" class="dl-meta-item">
        <span class="dl-meta-ico" v-html="icons.platform"></span>
        <span class="dl-meta-label">平台</span>
        <span class="dl-meta-value">{{ platform }}</span>
      </div>
      <div v-if="downloads" class="dl-meta-item">
        <span class="dl-meta-ico" v-html="icons.download"></span>
        <span class="dl-meta-label">下载量</span>
        <span class="dl-meta-value">{{ downloads }}</span>
      </div>
      <div v-if="hash" class="dl-meta-item dl-meta-hash">
        <span class="dl-meta-ico" v-html="icons.hash"></span>
        <span class="dl-meta-label">{{ hashType || 'Hash' }}</span>
        <span class="dl-meta-value dl-hash-value">
          <code>{{ hash }}</code>
          <button class="dl-hash-copy" @click.stop="copy(hash)" title="复制">
            <span v-html="icons.copy"></span>
          </button>
        </span>
      </div>
    </div>

    <!-- ✅ 标签区域 -->
    <div v-if="tags && tags.length" class="dl-tags">
      <span v-for="(tag, idx) in tags" :key="idx" class="dl-tag">
        <span v-html="icons.tagSmall"></span>
        {{ tag }}
      </span>
    </div>

    <!-- ✅ 系统要求 -->
    <div v-if="requirements && requirements.length" class="dl-requirements">
      <div class="dl-req-label">
        <span class="dl-req-ico" v-html="icons.check"></span>
        <span>系统要求</span>
      </div>
      <ul class="dl-req-list">
        <li v-for="(req, idx) in requirements" :key="idx">{{ req }}</li>
      </ul>
    </div>

    <!-- body -->
    <div class="dl-stack">
      <!-- ✅ 下载渠道：网格卡片式延迟检测 -->
      <div class="dl-row dl-latency-section">
        <div class="dl-label">
          <span class="dl-label-ico" v-html="icons.channel"></span>
          <span>下载渠道</span>
          <span class="dl-label-hint">实时延迟检测</span>
        </div>

        <div class="dl-latency-grid">
          <div
            v-for="(ch, idx) in normalizedChannels"
            :key="idx"
            class="dl-latency-card"
            :title="latencyTitle(ch)"
          >
            <!-- ECG 波形背景 -->
            <div class="dl-ecg-container">
              <div class="dl-ecg-grid"></div>
              <svg class="dl-ecg-svg" viewBox="0 0 200 40" preserveAspectRatio="none">
                <path class="dl-ecg-path-bg" d="M0,20 L200,20"></path>
                <path 
                  class="dl-ecg-path" 
                  :id="`ecg-path-${idx}`"
                  :d="getEcgPath(ch)"
                  :style="{ stroke: getLatencyColor(ch) }"
                ></path>
                <circle 
                  class="dl-ecg-cursor"
                  :style="{ fill: getLatencyColor(ch) }"
                  r="3"
                  :cx="getEcgCursorX(ch)"
                  :cy="getEcgCursorY(ch)"
                ></circle>
              </svg>
            </div>

            <!-- 卡片内容 -->
            <div class="dl-latency-card-content">
              <div class="dl-latency-card-info">
                <span class="dl-latency-card-icon" v-html="ch.iconSvg"></span>
                <div class="dl-latency-card-text">
                  <span class="dl-latency-card-name">{{ ch.name }}</span>
                  <span 
                    class="dl-latency-card-region"
                    :class="ch.region === '国内' ? 'is-domestic' : 'is-international'"
                  >{{ ch.region || '国际' }}</span>
                </div>
              </div>

              <div class="dl-latency-value" :style="{ color: getLatencyColor(ch) }">
                <template v-if="latencyState[keyOf(ch)]?.status === 'ok'">
                  <span class="dl-latency-num">{{ latencyState[keyOf(ch)]?.value }}</span>
                  <span class="dl-latency-unit">ms</span>
                </template>
                <template v-else-if="latencyState[keyOf(ch)]?.status === 'error'">
                  <span class="dl-latency-num dl-latency-timeout">TIMEOUT</span>
                </template>
                <template v-else>
                  <span class="dl-latency-num dl-latency-loading">···</span>
                  <span class="dl-latency-unit">ms</span>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ✅ 下载链接 -->
      <div class="dl-row">
        <div class="dl-label">
          <span class="dl-label-ico" v-html="icons.link"></span>
          <span>下载链接</span>
        </div>

        <div class="dl-links">
          <div v-for="(ch, idx) in normalizedChannels" :key="idx" class="dl-link-item">
            <span class="dl-link-ico" v-html="ch.iconSvg"></span>

            <div class="dl-link-main">
              <div class="dl-link-top">
                <span class="dl-link-name">{{ ch.name }}</span>

                <div class="dl-link-actions">
                  <a
                    class="dl-link-openbtn"
                    :href="ch.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="在新标签页打开"
                  >
                    <span v-html="icons.external"></span>
                    打开
                  </a>

                  <button class="dl-link-copybtn" type="button" @click.stop="copy(ch.url)">
                    <span v-html="icons.copy"></span>
                    复制
                  </button>
                </div>
              </div>

              <div class="dl-link-url">
                <span class="dl-url-domain">{{ splitUrl(ch.url).domain }}</span
                ><span class="dl-url-path">{{ splitUrl(ch.url).path }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ✅ 更新日志 -->
      <div v-if="changelog && changelog.length" class="dl-row dl-changelog-row">
        <div class="dl-label">
          <span class="dl-label-ico" v-html="icons.changelog"></span>
          <span>更新日志</span>
          <span v-if="version" class="dl-label-hint">{{ version }}</span>
        </div>

        <ul class="dl-changelog">
          <li v-for="(item, idx) in changelog" :key="idx">
            <span class="dl-changelog-bullet"></span>
            <span class="dl-changelog-text">{{ item }}</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- ✅ 底部备注 -->
    <footer v-if="note" class="dl-footer">
      <span class="dl-footer-ico" v-html="icons.info"></span>
      <span class="dl-footer-text">{{ note }}</span>
    </footer>

    <!-- Toast -->
    <Teleport to="body">
      <Transition name="dl-toast">
        <div v-if="toast.visible" class="dl-toast">
          <span class="dl-toast-icon" v-html="icons.check"></span>
          <span class="dl-toast-text">已复制到剪贴板</span>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";

const props = defineProps({
  name: { type: String, required: true },
  url: { type: String, default: "" },
  icon: { type: String, default: "" },
  ext: { type: String, default: "" },
  typeName: { type: String, default: "" },
  size: { type: String, default: "" },
  version: { type: String, default: "" },
  date: { type: String, default: "" },
  author: { type: String, default: "" },
  license: { type: String, default: "" },
  platform: { type: String, default: "" },
  downloads: { type: String, default: "" },
  description: { type: String, default: "" },
  hash: { type: String, default: "" },
  hashType: { type: String, default: "SHA256" },
  note: { type: String, default: "" },
  tags: { type: Array, default: null },
  badges: { type: Array, default: null },
  requirements: { type: Array, default: null },
  changelog: { type: Array, default: null },
  // [{ name: 'GitHub', icon: 'github', url: '...', region: '国际' }, ...]
  channels: { type: Array, default: null },
  color: { type: String, default: "blue" },
  theme: { type: Object, default: null },
});

const isHovered = ref(false);
const hasMetaInfo = computed(() => props.author || props.license || props.platform || props.downloads || props.hash);

/* ========= 暗黑模式检测 ========= */
const isDark = ref(false);
let observer;

const checkDarkMode = () => {
  if (typeof document === "undefined") return;
  isDark.value =
    document.documentElement.classList.contains("dark") ||
    document.body.classList.contains("dark") ||
    window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
};

onMounted(() => {
  checkDarkMode();
  if (typeof document !== "undefined") {
    observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    window.matchMedia?.("(prefers-color-scheme: dark)")?.addEventListener?.("change", checkDarkMode);
  }
  startLatencyLoop();
});

onBeforeUnmount(() => {
  observer?.disconnect?.();
  window.matchMedia?.("(prefers-color-scheme: dark)")?.removeEventListener?.("change", checkDarkMode);
  stopLatencyLoop();
});

/* ========= 颜色预设 ========= */
const PRESETS = {
  blue: {
    light: {
      bg: "linear-gradient(135deg, #f8fbff 0%, #eef5ff 100%)",
      bgSolid: "#f5f9ff",
      border: "#c2d9f7",
      borderHover: "#93bbed",
      accent: "#2563eb",
      accentLight: "#3b82f6",
      text: "#1e3a5f",
      textSecondary: "#475569",
      muted: "#64748b",
      iconBg: "linear-gradient(135deg, #e8f2ff 0%, #dbeafe 100%)",
      shadow: "rgba(37,99,235,.12)",
      shadowHover: "rgba(37,99,235,.22)",
      cardBg: "rgba(255,255,255,0.7)",
      rowBg: "rgba(248,251,255,0.8)",
    },
    dark: {
      bg: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      bgSolid: "#141c2e",
      border: "#334155",
      borderHover: "#475569",
      accent: "#60a5fa",
      accentLight: "#93c5fd",
      text: "#e2e8f0",
      textSecondary: "#cbd5e1",
      muted: "#94a3b8",
      iconBg: "linear-gradient(135deg, #1e3a5f 0%, #1e40af20 100%)",
      shadow: "rgba(0,0,0,.3)",
      shadowHover: "rgba(59,130,246,.25)",
      cardBg: "rgba(30,41,59,0.6)",
      rowBg: "rgba(15,23,42,0.5)",
    },
  },
  green: {
    light: {
      bg: "linear-gradient(135deg, #f5fff8 0%, #ecfdf5 100%)",
      bgSolid: "#f0fdf4",
      border: "#a7f3d0",
      borderHover: "#6ee7b7",
      accent: "#059669",
      accentLight: "#10b981",
      text: "#064e3b",
      textSecondary: "#065f46",
      muted: "#64748b",
      iconBg: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
      shadow: "rgba(5,150,105,.12)",
      shadowHover: "rgba(5,150,105,.22)",
      cardBg: "rgba(255,255,255,0.7)",
      rowBg: "rgba(240,253,244,0.8)",
    },
    dark: {
      bg: "linear-gradient(135deg, #052e16 0%, #14532d 100%)",
      bgSolid: "#0a3419",
      border: "#166534",
      borderHover: "#22863a",
      accent: "#4ade80",
      accentLight: "#86efac",
      text: "#dcfce7",
      textSecondary: "#bbf7d0",
      muted: "#94a3b8",
      iconBg: "linear-gradient(135deg, #14532d 0%, #166534 100%)",
      shadow: "rgba(0,0,0,.3)",
      shadowHover: "rgba(74,222,128,.2)",
      cardBg: "rgba(20,83,45,0.5)",
      rowBg: "rgba(5,46,22,0.5)",
    },
  },
  orange: {
    light: {
      bg: "linear-gradient(135deg, #fffaf5 0%, #fff7ed 100%)",
      bgSolid: "#fff7ed",
      border: "#fed7aa",
      borderHover: "#fdba74",
      accent: "#ea580c",
      accentLight: "#f97316",
      text: "#7c2d12",
      textSecondary: "#9a3412",
      muted: "#64748b",
      iconBg: "linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)",
      shadow: "rgba(234,88,12,.12)",
      shadowHover: "rgba(234,88,12,.22)",
      cardBg: "rgba(255,255,255,0.7)",
      rowBg: "rgba(255,247,237,0.8)",
    },
    dark: {
      bg: "linear-gradient(135deg, #1a0f05 0%, #431407 100%)",
      bgSolid: "#27170a",
      border: "#9a3412",
      borderHover: "#c2410c",
      accent: "#fb923c",
      accentLight: "#fdba74",
      text: "#ffedd5",
      textSecondary: "#fed7aa",
      muted: "#94a3b8",
      iconBg: "linear-gradient(135deg, #431407 0%, #7c2d12 100%)",
      shadow: "rgba(0,0,0,.3)",
      shadowHover: "rgba(251,146,60,.2)",
      cardBg: "rgba(67,20,7,0.5)",
      rowBg: "rgba(26,15,5,0.5)",
    },
  },
  purple: {
    light: {
      bg: "linear-gradient(135deg, #faf5ff 0%, #f5f3ff 100%)",
      bgSolid: "#f5f3ff",
      border: "#ddd6fe",
      borderHover: "#c4b5fd",
      accent: "#7c3aed",
      accentLight: "#8b5cf6",
      text: "#4c1d95",
      textSecondary: "#5b21b6",
      muted: "#64748b",
      iconBg: "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)",
      shadow: "rgba(124,58,237,.12)",
      shadowHover: "rgba(124,58,237,.22)",
      cardBg: "rgba(255,255,255,0.7)",
      rowBg: "rgba(245,243,255,0.8)",
    },
    dark: {
      bg: "linear-gradient(135deg, #1a0a2e 0%, #2e1065 100%)",
      bgSolid: "#1f0d38",
      border: "#6d28d9",
      borderHover: "#7c3aed",
      accent: "#a78bfa",
      accentLight: "#c4b5fd",
      text: "#ede9fe",
      textSecondary: "#ddd6fe",
      muted: "#94a3b8",
      iconBg: "linear-gradient(135deg, #2e1065 0%, #4c1d95 100%)",
      shadow: "rgba(0,0,0,.3)",
      shadowHover: "rgba(167,139,250,.2)",
      cardBg: "rgba(46,16,101,0.5)",
      rowBg: "rgba(26,10,46,0.5)",
    },
  },
  pink: {
    light: {
      bg: "linear-gradient(135deg, #fff5f8 0%, #fdf2f8 100%)",
      bgSolid: "#fdf2f8",
      border: "#fbcfe8",
      borderHover: "#f9a8d4",
      accent: "#db2777",
      accentLight: "#ec4899",
      text: "#831843",
      textSecondary: "#9d174d",
      muted: "#64748b",
      iconBg: "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)",
      shadow: "rgba(219,39,119,.12)",
      shadowHover: "rgba(219,39,119,.22)",
      cardBg: "rgba(255,255,255,0.7)",
      rowBg: "rgba(253,242,248,0.8)",
    },
    dark: {
      bg: "linear-gradient(135deg, #2a0a18 0%, #500724 100%)",
      bgSolid: "#350c1e",
      border: "#9d174d",
      borderHover: "#be185d",
      accent: "#f472b6",
      accentLight: "#fbcfe8",
      text: "#fce7f3",
      textSecondary: "#fbcfe8",
      muted: "#94a3b8",
      iconBg: "linear-gradient(135deg, #500724 0%, #831843 100%)",
      shadow: "rgba(0,0,0,.3)",
      shadowHover: "rgba(244,114,182,.2)",
      cardBg: "rgba(80,7,36,0.5)",
      rowBg: "rgba(42,10,24,0.5)",
    },
  },
  yellow: {
    light: {
      bg: "linear-gradient(135deg, #fffef5 0%, #fefce8 100%)",
      bgSolid: "#fefce8",
      border: "#fde68a",
      borderHover: "#fcd34d",
      accent: "#ca8a04",
      accentLight: "#eab308",
      text: "#713f12",
      textSecondary: "#854d0e",
      muted: "#64748b",
      iconBg: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
      shadow: "rgba(202,138,4,.12)",
      shadowHover: "rgba(202,138,4,.22)",
      cardBg: "rgba(255,255,255,0.7)",
      rowBg: "rgba(254,252,232,0.8)",
    },
    dark: {
      bg: "linear-gradient(135deg, #1c1305 0%, #422006 100%)",
      bgSolid: "#27190a",
      border: "#854d0e",
      borderHover: "#a16207",
      accent: "#facc15",
      accentLight: "#fde047",
      text: "#fef9c3",
      textSecondary: "#fef08a",
      muted: "#94a3b8",
      iconBg: "linear-gradient(135deg, #422006 0%, #713f12 100%)",
      shadow: "rgba(0,0,0,.3)",
      shadowHover: "rgba(250,204,21,.2)",
      cardBg: "rgba(66,32,6,0.5)",
      rowBg: "rgba(28,19,5,0.5)",
    },
  },
};

const palette = computed(() => {
  const base = PRESETS[props.color] || PRESETS.blue;
  const picked = isDark.value ? base.dark : base.light;
  return { ...picked, ...(props.theme || {}) };
});

const cssVars = computed(() => ({
  "--dl-bg": palette.value.bg,
  "--dl-bg-solid": palette.value.bgSolid,
  "--dl-border": palette.value.border,
  "--dl-border-hover": palette.value.borderHover,
  "--dl-accent": palette.value.accent,
  "--dl-accent-light": palette.value.accentLight,
  "--dl-text": palette.value.text,
  "--dl-text-secondary": palette.value.textSecondary,
  "--dl-muted": palette.value.muted,
  "--dl-icon-bg": palette.value.iconBg,
  "--dl-shadow": palette.value.shadow,
  "--dl-shadow-hover": palette.value.shadowHover,
  "--dl-card-bg": palette.value.cardBg,
  "--dl-row-bg": palette.value.rowBg,
}));

/* ========= icons ========= */
const icons = {
  file: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  tag: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41 12 22l-8-8V2h12l4.59 4.59z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
  tagSmall: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41 12 22l-8-8V2h12l4.59 4.59z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
  database: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/></svg>`,
  link: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
  channel: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/></svg>`,
  copy: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
  external: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M21 14v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6"/></svg>`,
  check: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
  version: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m8 11 4 4 4-4"/><path d="M8 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4"/></svg>`,
  calendar: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`,
  user: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  license: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>`,
  platform: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>`,
  download: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>`,
  hash: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/></svg>`,
  changelog: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>`,
  info: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
};

/* ========= 平台 icons ========= */
const CHANNEL_ICONS = {
  github: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.4-4-1.4-.6-1.4-1.4-1.8-1.4-1.8-1.1-.8.1-.8.1-.8 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.9 1.3 3.6 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.9 0-1.3.5-2.4 1.2-3.3-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.2 11.2 0 0 1 6 0C17.4 4.9 18.4 5.2 18.4 5.2c.6 1.6.2 2.8.1 3.1.8.9 1.2 2 1.2 3.3 0 4.6-2.7 5.6-5.3 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5z"/></svg>`,
  gitee: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10h6a4 4 0 0 0 4-4v-6c0-5.52-4.48-10-10-10zm5.5 10.5H12a1.5 1.5 0 0 1 0-3h5.5a1.5 1.5 0 0 1 0 3z"/></svg>`,
  onedrive: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10.5 7.5a4.5 4.5 0 0 1 8.5 2A3.5 3.5 0 0 1 19.5 16H7a4 4 0 1 1 1.2-7.8A4.5 4.5 0 0 1 10.5 7.5z"/></svg>`,
  website: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  jsdelivr: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm-.97 19.72l-4.47-2.58v-5.17l4.47 2.58v5.17zm.47-6.15L7.03 11l4.47-2.58L16 11l-4.5 2.57zm5.47 3.57l-4.47 2.58v-5.17l4.47-2.58v5.17z"/></svg>`,
  cloudflare: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 15.5l.9-3c.1-.3 0-.5-.2-.7-.2-.1-.4-.2-.6-.1l-2.5.7c-.1 0-.2.1-.3.2l-.3.7h-1.8l.5-1.5c.1-.3 0-.5-.2-.7-.2-.1-.4-.2-.6-.1L8 12.3l-.3.7H6l.5-1.5c.1-.3 0-.5-.2-.7-.2-.1-.4-.2-.6-.1l-3 1c-.2.1-.4.3-.4.6l-.3 1c-.1.3 0 .5.2.7.1.1.3.2.5.2h.1l1.9-.5.2.3-.2.5h3l.2-.5.2-.3 1.7-.5.2.3-.2.5h3.5l.2-.5.2-.3 1.7-.5.2.3-.2.5h1.7c.3 0 .5-.2.6-.5z"/></svg>`,
  bilibili: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373z"/></svg>`,
  wechat: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/></svg>`,
  taobao: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.645 16.182c-.08.188-.19.354-.327.486a1.54 1.54 0 0 1-.52.335c-.23.09-.5.135-.8.135h-.002c-.16 0-.33-.014-.51-.042a3.9 3.9 0 0 1-.591-.136 5.3 5.3 0 0 1-.653-.254 7.1 7.1 0 0 1-.693-.378 10.4 10.4 0 0 1-1.548-1.117c-.156-.133-.322-.28-.496-.44a14 14 0 0 0-.384.186l-.015.007a9.8 9.8 0 0 1-1.014.41c-.327.109-.645.19-.946.24-.3.05-.584.075-.845.075-.261 0-.501-.025-.715-.075a1.97 1.97 0 0 1-.569-.218 1.56 1.56 0 0 1-.42-.352 1.63 1.63 0 0 1-.27-.467 1.7 1.7 0 0 1-.118-.557v-.012c0-.173.02-.35.062-.527.06-.254.152-.484.278-.697.157-.263.356-.491.6-.689.198-.16.426-.296.682-.408-.048-.101-.089-.199-.124-.293a2.2 2.2 0 0 1-.11-.404 2.2 2.2 0 0 1-.034-.363c0-.177.022-.347.064-.508.082-.313.233-.586.442-.82.166-.186.36-.341.578-.464.217-.123.456-.214.712-.273.256-.059.527-.088.808-.088.222 0 .443.019.662.058.328.058.648.158.96.3.194.089.384.192.567.309a6 6 0 0 1 .54.384c.088.073.175.149.26.228a.3.3 0 0 0 .005-.073c.015-.224.066-.418.152-.582.096-.183.227-.332.39-.447a1.58 1.58 0 0 1 .545-.242 2.4 2.4 0 0 1 .608-.073h.72v.01l.064-.01h.808c.016.025.031.051.044.077.012.024.023.048.032.073l.01.033.079.314.1.412c.033.146.068.295.104.448.024.102.049.205.074.31a27.98 27.98 0 0 0 .227.89c.076.28.154.556.233.826.05.168.099.333.149.495.055.179.11.354.166.523h.019c.185 0 .363.021.532.063.191.047.368.124.528.229.176.116.328.264.452.44.137.195.236.417.294.66.038.158.057.32.057.48 0 .261-.05.508-.147.736z"/></svg>`,
  youtube: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
  bytedance: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-.846 5.523h2.39v6.27h2.885v1.925h-2.886v4.759h-2.39v-4.76H8.269v-1.924h2.886V5.523zm-5.077 6.27h2.39v1.925h-2.39v-1.925zm10.154 0h2.39v1.925h-2.39v-1.925z"/></svg>`,
};

/* ========= data normalize ========= */
const fileIconSvg = computed(() => (props.icon ? props.icon : null));

const normalizedChannels = computed(() => {
  const raw = Array.isArray(props.channels) && props.channels.length
    ? props.channels
    : props.url ? [{ name: "下载", icon: "website", url: props.url }] : [];

  return raw.map((ch) => {
    const name = ch?.name ?? "渠道";
    const url = ch?.url ?? props.url ?? "";
    const icon = ch?.icon ?? "website";
    const region = ch?.region ?? "国际";
    const iconSvg = typeof icon === "string" && icon.trim().startsWith("<svg")
      ? icon
      : CHANNEL_ICONS[String(icon).toLowerCase()] || CHANNEL_ICONS.website;
    return { name, url, iconSvg, region };
  });
});

/* ========= type / size ========= */
const computedType = computed(() => {
  const ext = (props.ext || "").trim();
  const cleanExt = ext ? (ext.startsWith(".") ? ext : `.${ext}`) : "";
  const tn = (props.typeName || "").trim();
  if (cleanExt && tn) return `${cleanExt}/${tn}`;
  if (cleanExt) return cleanExt;
  if (tn) return tn;
  const guess = guessExtFromUrl((normalizedChannels.value[0]?.url || props.url) ?? "");
  return guess ? `.${guess}/文件` : "文件";
});

const computedSize = computed(() => {
  const raw = (props.size || "").trim();
  const bytes = parseToBytes(raw);
  if (!raw && bytes == null) return "—";
  if (bytes == null) return raw || "—";
  const nf = new Intl.NumberFormat("en-US");
  return raw ? `${raw} / ${nf.format(bytes)} B` : `${nf.format(bytes)} B`;
});

const splitUrl = (u) => {
  try {
    const urlObj = new URL(u);
    return { domain: `${urlObj.protocol}//${urlObj.host}`, path: `${urlObj.pathname}${urlObj.search}${urlObj.hash}` };
  } catch { return { domain: u, path: "" }; }
};

/* ========= toast / copy ========= */
const toast = reactive({ visible: false, timer: null });
const showToast = () => {
  toast.visible = true;
  if (toast.timer) clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (toast.visible = false), 1600);
};

const copy = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    showToast();
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "true");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showToast();
    } catch {}
  }
};

/* ========= 延迟实时测试 ========= */
const latencyState = reactive({});
const latencyHistory = reactive({});
let latencyTimer = null;
const ECG_HISTORY_COUNT = 10;

const keyOf = (ch) => {
  try { return new URL(ch.url).host || ch.url; }
  catch { return ch.url || ch.name; }
};

const probeUrlOf = (rawUrl) => {
  try { const u = new URL(rawUrl); return `${u.origin}/favicon.ico`; }
  catch { return rawUrl; }
};

const testLatencyOnce = async (ch) => {
  const key = keyOf(ch);
  const probe = probeUrlOf(ch.url);
  latencyState[key] = latencyState[key] || { status: "loading", value: null, probe };
  latencyHistory[key] = latencyHistory[key] || [];
  latencyState[key].status = "loading";
  latencyState[key].probe = probe;

  const start = Date.now();
  try {
    await fetch(`${probe}?t=${Date.now()}`, { method: "HEAD", cache: "no-cache", mode: "no-cors", referrerPolicy: "no-referrer" });
    const ms = Math.max(0, Date.now() - start);
    latencyState[key].status = "ok";
    latencyState[key].value = ms;
    latencyHistory[key].push(ms);
    if (latencyHistory[key].length > ECG_HISTORY_COUNT) latencyHistory[key].shift();
    return;
  } catch {}

  try {
    const start2 = Date.now();
    await fetch(`${probe}?t=${Date.now()}`, { method: "GET", cache: "no-cache", mode: "no-cors", referrerPolicy: "no-referrer" });
    const ms = Math.max(0, Date.now() - start2);
    latencyState[key].status = "ok";
    latencyState[key].value = ms;
    latencyHistory[key].push(ms);
    if (latencyHistory[key].length > ECG_HISTORY_COUNT) latencyHistory[key].shift();
  } catch {
    latencyState[key].status = "error";
    latencyState[key].value = null;
    latencyHistory[key].push(-1);
    if (latencyHistory[key].length > ECG_HISTORY_COUNT) latencyHistory[key].shift();
  }
};

const startLatencyLoop = () => {
  if (typeof window === "undefined" || !normalizedChannels.value.length) return;
  normalizedChannels.value.forEach((ch) => testLatencyOnce(ch));
  latencyTimer = window.setInterval(() => {
    normalizedChannels.value.forEach((ch) => testLatencyOnce(ch));
  }, 6000);
};

const stopLatencyLoop = () => {
  if (latencyTimer) { clearInterval(latencyTimer); latencyTimer = null; }
};

watch(() => normalizedChannels.value.map((c) => c.url).join("|"), () => { stopLatencyLoop(); startLatencyLoop(); });

const getLatencyColor = (ch) => {
  const st = latencyState[keyOf(ch)];
  if (!st || st.status === "loading") return "var(--dl-muted)";
  if (st.status === "error") return "#ef4444";
  const v = st.value ?? 9999;
  if (v <= 49) return "#008236";
  if (v <= 149) return "#7ccf00";
  if (v <= 299) return "#f59e0b";
  if (v <= 999) return "#fb2c36";
  return "#82181a";
};

const getEcgPath = (ch) => {
  const key = keyOf(ch);
  const history = latencyHistory[key] || [];
  if (history.length === 0) return "M0,20 L200,20";
  const width = 200, height = 40, padding = 5;
  const step = width / (ECG_HISTORY_COUNT - 1);
  let points = history.map((l, i) => ({
    x: i * step,
    y: l === -1 ? height - padding : height - padding - (Math.min(l, 500) / 500 * (height - 2 * padding))
  }));
  if (points.length === 1) return `M0,${points[0].y} L200,${points[0].y}`;
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const x_mid = (points[i].x + points[i + 1].x) / 2;
    const y_mid = (points[i].y + points[i + 1].y) / 2;
    d += ` Q${points[i].x},${points[i].y} ${x_mid},${y_mid}`;
  }
  d += ` L${points[points.length - 1].x},${points[points.length - 1].y}`;
  return d;
};

const getEcgCursorX = (ch) => {
  const history = latencyHistory[keyOf(ch)] || [];
  return history.length === 0 ? 0 : (history.length - 1) * (200 / (ECG_HISTORY_COUNT - 1));
};

const getEcgCursorY = (ch) => {
  const history = latencyHistory[keyOf(ch)] || [];
  if (history.length === 0) return 20;
  const lastValue = history[history.length - 1];
  return lastValue === -1 ? 35 : 35 - (Math.min(lastValue, 500) / 500 * 30);
};

const latencyTitle = (ch) => {
  const st = latencyState[keyOf(ch)];
  const probe = st?.probe || probeUrlOf(ch.url);
  return st?.status === "ok" ? `${st.value}ms（探测：${probe}）` : st?.status === "error" ? `探测失败（探测：${probe}）` : `探测中…（探测：${probe}）`;
};

/* ========= utils ========= */
function guessExtFromUrl(url) {
  try { const m = new URL(url).pathname.split("/").pop()?.match(/\.([a-z0-9]+)$/i); return m ? m[1].toLowerCase() : ""; }
  catch { return ""; }
}

function parseToBytes(input) {
  if (!input) return null;
  const m = input.replace(/,/g, "").trim().match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]{0,3})$/);
  if (!m) return null;
  const val = Number(m[1]);
  if (!Number.isFinite(val)) return null;
  const unit = (m[2] || "B").toUpperCase();
  const table = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4, PB: 1024 ** 5, KIB: 1024, MIB: 1024 ** 2, GIB: 1024 ** 3, TIB: 1024 ** 4, PIB: 1024 ** 5 };
  return table[unit] ? Math.round(val * table[unit]) : null;
}
</script>

<style scoped>
.dl-card{position:relative;overflow:hidden;background:var(--dl-bg);border:1.5px solid var(--dl-border);border-radius:16px;padding:20px;margin:20px 0;transition:all .35s cubic-bezier(.4,0,.2,1);box-shadow:0 2px 8px var(--dl-shadow)}
.dl-card:hover{border-color:var(--dl-border-hover);transform:translateY(-3px);box-shadow:0 12px 32px var(--dl-shadow-hover)}
.dl-shine{position:absolute;inset:0;background:linear-gradient(120deg,transparent 0%,rgba(255,255,255,.15) 45%,transparent 100%);transform:translateX(-100%);transition:opacity .3s;pointer-events:none;animation:dl-shine 4s ease-in-out infinite;z-index:0}
:global(.dark) .dl-shine{background:linear-gradient(120deg,transparent 0%,rgba(255,255,255,.08) 45%,transparent 100%)}
@keyframes dl-shine{0%{transform:translateX(-100%) skewX(-15deg)}100%{transform:translateX(200%) skewX(-15deg)}}
.dl-wave{position:absolute;left:0;right:0;bottom:-1px;height:80px;pointer-events:none;z-index:0;opacity:.75;transition:opacity .3s}
.dl-card:hover .dl-wave{opacity:.95}
.dl-header,.dl-description,.dl-meta-grid,.dl-tags,.dl-requirements,.dl-stack,.dl-footer{position:relative;z-index:1}
.dl-wave-1,.dl-wave-2,.dl-wave-3{position:absolute;inset:0;height:100%;background:linear-gradient(90deg,color-mix(in srgb,var(--dl-accent) 20%,transparent) 0%,color-mix(in srgb,var(--dl-accent) 8%,transparent) 35%,color-mix(in srgb,var(--dl-accent) 18%,transparent) 70%,color-mix(in srgb,var(--dl-accent) 12%,transparent) 100%);-webkit-mask-image:radial-gradient(22px 14px at 18px 62px,#000 98%,transparent 100%),radial-gradient(22px 14px at 62px 62px,#000 98%,transparent 100%);-webkit-mask-size:80px 78px;-webkit-mask-repeat:repeat-x;mask-image:radial-gradient(22px 14px at 18px 62px,#000 98%,transparent 100%),radial-gradient(22px 14px at 62px 62px,#000 98%,transparent 100%);mask-size:80px 78px;mask-repeat:repeat-x;filter:blur(.3px)}
.dl-wave-1{opacity:.8;transform:translateY(6px);animation:dl-wave-move-1 9s linear infinite}
.dl-wave-2{opacity:.5;animation:dl-wave-move-2 13s linear infinite}
.dl-wave-3{opacity:.3;transform:translateY(10px);animation:dl-wave-move-3 17s linear infinite}
@keyframes dl-wave-move-1{0%{mask-position:0 0;-webkit-mask-position:0 0}100%{mask-position:320px 0;-webkit-mask-position:320px 0}}
@keyframes dl-wave-move-2{0%{mask-position:0 0;-webkit-mask-position:0 0}100%{mask-position:240px 0;-webkit-mask-position:240px 0}}
@keyframes dl-wave-move-3{0%{mask-position:0 0;-webkit-mask-position:0 0}100%{mask-position:-280px 0;-webkit-mask-position:-280px 0}}
:global(.dark) .dl-wave{opacity:.5}
:global(.dark) .dl-card:hover .dl-wave{opacity:.7}
@media(prefers-reduced-motion:reduce){.dl-wave-1,.dl-wave-2,.dl-wave-3,.dl-shine{animation:none!important}}
.dl-header{display:flex;align-items:flex-start;gap:16px}
.dl-file-icon{width:52px;height:52px;border-radius:14px;display:inline-flex;align-items:center;justify-content:center;border:1.5px solid var(--dl-border);background:var(--dl-icon-bg);color:var(--dl-accent);flex:0 0 auto;box-shadow:0 2px 8px var(--dl-shadow)}
.dl-file-icon :deep(svg){width:26px;height:26px}
.dl-title{flex:1;min-width:0}
.dl-name{font-size:18px;font-weight:700;color:var(--dl-text);margin-bottom:8px;word-break:break-word;line-height:1.3;letter-spacing:-.01em}
.dl-sub{display:flex;flex-wrap:wrap;gap:6px 12px}
.dl-sub-item{display:inline-flex;align-items:center;gap:6px;min-width:0}
.dl-sub-ico{width:20px;height:20px;border-radius:6px;border:1px solid var(--dl-border);background:var(--dl-icon-bg);color:var(--dl-accent);display:inline-flex;align-items:center;justify-content:center}
.dl-sub-ico :deep(svg){width:12px;height:12px}
.dl-sub-text{font-size:12px;font-weight:500;color:var(--dl-text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:35vw}
.dl-badges{display:flex;flex-wrap:wrap;gap:6px;flex:0 0 auto}
.dl-badge{display:inline-flex;align-items:center;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.3px;background:var(--dl-accent);color:#fff}
.dl-badge-success{background:#10b981}.dl-badge-warning{background:#f59e0b}.dl-badge-danger{background:#ef4444}.dl-badge-info{background:#3b82f6}
.dl-description{margin-top:14px;padding:12px 14px;background:var(--dl-row-bg);border:1px solid var(--dl-border);border-radius:10px}
.dl-description p{margin:0;font-size:13px;line-height:1.6;color:var(--dl-text-secondary)}
.dl-meta-grid{margin-top:14px;display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px}
.dl-meta-item{display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--dl-row-bg);border:1px solid var(--dl-border);border-radius:10px}
.dl-meta-item.dl-meta-hash{grid-column:1/-1}
.dl-meta-ico{width:22px;height:22px;border-radius:6px;border:1px solid var(--dl-border);background:var(--dl-icon-bg);color:var(--dl-accent);display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto}
.dl-meta-ico :deep(svg){width:12px;height:12px}
.dl-meta-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.3px;color:var(--dl-muted);flex:0 0 auto}
.dl-meta-value{font-size:13px;font-weight:600;color:var(--dl-text);margin-left:auto;text-align:right}
.dl-hash-value{display:flex;align-items:center;gap:8px}
.dl-hash-value code{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:11px;color:var(--dl-accent);background:transparent;max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dl-hash-copy{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:6px;border:1px solid var(--dl-border);background:var(--dl-card-bg);color:var(--dl-muted);cursor:pointer;transition:all .2s}
.dl-hash-copy:hover{color:var(--dl-accent);border-color:var(--dl-accent)}
.dl-hash-copy :deep(svg){width:12px;height:12px}
.dl-tags{margin-top:14px;display:flex;flex-wrap:wrap;gap:8px}
.dl-tag{display:inline-flex;align-items:center;gap:4px;padding:5px 10px;border-radius:8px;font-size:12px;font-weight:500;color:var(--dl-accent);background:color-mix(in srgb,var(--dl-accent) 10%,transparent);border:1px solid color-mix(in srgb,var(--dl-accent) 25%,transparent)}
.dl-tag :deep(svg){width:10px;height:10px;opacity:.7}
.dl-requirements{margin-top:14px;padding:12px 14px;background:var(--dl-row-bg);border:1px solid var(--dl-border);border-radius:10px}
.dl-req-label{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.3px;color:var(--dl-muted);margin-bottom:8px}
.dl-req-ico{width:18px;height:18px;border-radius:6px;border:1px solid var(--dl-border);background:var(--dl-icon-bg);color:var(--dl-accent);display:inline-flex;align-items:center;justify-content:center}
.dl-req-ico :deep(svg){width:10px;height:10px}
.dl-req-list{margin:0;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:6px 16px}
.dl-req-list li{font-size:12px;color:var(--dl-text-secondary);display:flex;align-items:center;gap:6px}
.dl-req-list li::before{content:"";width:5px;height:5px;border-radius:50%;background:var(--dl-accent);flex:0 0 auto}
.dl-stack{margin-top:16px;display:flex;flex-direction:column;gap:12px}
.dl-row{background:var(--dl-row-bg);border:1px solid var(--dl-border);border-radius:12px;padding:12px 14px;backdrop-filter:blur(8px)}
.dl-label{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;letter-spacing:.3px;text-transform:uppercase;color:var(--dl-muted);margin-bottom:10px}
.dl-label-ico{width:20px;height:20px;border-radius:6px;border:1px solid var(--dl-border);background:var(--dl-icon-bg);color:var(--dl-accent);display:inline-flex;align-items:center;justify-content:center}
.dl-label-ico :deep(svg){width:11px;height:11px}
.dl-label-hint{margin-left:6px;font-size:10px;opacity:.7;letter-spacing:.2px;font-weight:500}
.dl-latency-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
@media(max-width:1200px){.dl-latency-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:600px){.dl-latency-grid{grid-template-columns:1fr}}
.dl-latency-card{position:relative;background:var(--dl-bg-solid);border:1px solid var(--dl-border);border-radius:12px;padding:12px 14px;min-height:70px;display:flex;align-items:center;overflow:hidden;transition:all .3s;box-shadow:0 1px 3px var(--dl-shadow)}
.dl-latency-card:hover{transform:translateY(-3px);border-color:var(--dl-accent);box-shadow:0 8px 20px var(--dl-shadow-hover)}
.dl-ecg-container{position:absolute;inset:0;pointer-events:none;z-index:0;opacity:.25}
.dl-latency-card:hover .dl-ecg-container{opacity:.4}
.dl-ecg-grid{position:absolute;inset:0;background-image:linear-gradient(var(--dl-border) .5px,transparent .5px),linear-gradient(90deg,var(--dl-border) .5px,transparent .5px);background-size:16px 16px;opacity:.3}
.dl-ecg-svg{position:absolute;inset:0;width:100%;height:100%}
.dl-ecg-path-bg{fill:none;stroke:var(--dl-border);stroke-width:1;opacity:.5}
.dl-ecg-path{fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;transition:d .3s,stroke .3s}
.dl-ecg-cursor{opacity:.9;transition:cx .3s,cy .3s,fill .3s}
.dl-latency-card-content{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;width:100%}
.dl-latency-card-info{display:flex;align-items:center;gap:10px}
.dl-latency-card-icon{width:32px;height:32px;border-radius:8px;border:1px solid var(--dl-border);background:var(--dl-card-bg);color:var(--dl-accent);display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;transition:all .3s}
.dl-latency-card:hover .dl-latency-card-icon{border-color:var(--dl-accent);background:var(--dl-icon-bg)}
.dl-latency-card-icon :deep(svg){width:18px;height:18px}
.dl-latency-card-text{display:flex;flex-direction:row;align-items:center;gap:8px}
.dl-latency-card-name{font-size:14px;font-weight:700;color:var(--dl-text);text-shadow:0 0 8px var(--dl-bg-solid),0 0 12px var(--dl-bg-solid)}
.dl-latency-card-region{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;padding:2px 6px;border-radius:4px;text-shadow:0 0 5px var(--dl-bg-solid),0 0 8px var(--dl-bg-solid)}
.dl-latency-card-region.is-domestic{color:#10b981;background:rgba(16,185,129,.1)}
.dl-latency-card-region.is-international{color:#3b82f6;background:rgba(59,130,246,.1)}
.dl-latency-value{display:flex;align-items:baseline;gap:2px;text-shadow:0 0 10px var(--dl-bg-solid),0 0 15px var(--dl-bg-solid);transition:color .3s}
.dl-latency-num{font-family:'Orbitron','SF Pro Display',-apple-system,sans-serif;font-size:1.5rem;font-weight:800;font-style:italic;letter-spacing:-.5px;line-height:1}
.dl-latency-num.dl-latency-loading{font-style:normal;font-size:1.2rem}
.dl-latency-num.dl-latency-timeout{font-size:.75rem;font-style:normal;letter-spacing:.5px}
.dl-latency-unit{font-size:11px;font-weight:600;opacity:.7;text-transform:lowercase}
.dl-links{display:flex;flex-direction:column;gap:10px}
.dl-link-item{display:flex;gap:12px;padding:12px;border-radius:12px;border:1px solid var(--dl-border);background:var(--dl-card-bg);transition:all .2s;align-items:flex-start}
.dl-link-item:hover{border-color:var(--dl-border-hover);transform:translateY(-1px);box-shadow:0 8px 20px var(--dl-shadow)}
.dl-link-ico{width:30px;height:30px;border-radius:10px;border:1px solid var(--dl-border);background:var(--dl-icon-bg);color:var(--dl-accent);display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;margin-top:2px}
.dl-link-ico :deep(svg){width:16px;height:16px}
.dl-link-main{min-width:0;flex:1}
.dl-link-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px}
.dl-link-name{font-weight:700;color:var(--dl-text);font-size:14px;line-height:1.2}
.dl-link-actions{display:inline-flex;align-items:center;gap:8px;flex:0 0 auto}
.dl-link-openbtn,.dl-link-copybtn{display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border-radius:8px;border:1px solid var(--dl-border);background:var(--dl-row-bg);color:var(--dl-text);font-size:12px;font-weight:600;cursor:pointer;text-decoration:none;transition:all .2s}
.dl-link-openbtn:hover,.dl-link-copybtn:hover{border-color:var(--dl-accent);color:var(--dl-accent)}
.dl-link-openbtn :deep(svg),.dl-link-copybtn :deep(svg){width:14px;height:14px}
.dl-link-url{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:12px;word-break:break-all;line-height:1.5}
.dl-url-domain{color:var(--dl-accent);font-weight:700}
.dl-url-path{color:var(--dl-muted)}
.dl-changelog{margin:0;padding:0;list-style:none}
.dl-changelog li{display:flex;align-items:flex-start;gap:10px;padding:6px 0}
.dl-changelog li:not(:last-child){border-bottom:1px dashed var(--dl-border)}
.dl-changelog-bullet{width:8px;height:8px;border-radius:50%;background:var(--dl-accent);flex:0 0 auto;margin-top:5px}
.dl-changelog-text{font-size:13px;color:var(--dl-text-secondary);line-height:1.5}
.dl-footer{margin-top:16px;padding-top:14px;border-top:1px dashed var(--dl-border);display:flex;align-items:flex-start;gap:8px}
.dl-footer-ico{width:18px;height:18px;color:var(--dl-muted);flex:0 0 auto;margin-top:1px}
.dl-footer-ico :deep(svg){width:18px;height:18px}
.dl-footer-text{font-size:12px;color:var(--dl-muted);line-height:1.5}
.dl-toast{position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:9999;display:inline-flex;align-items:center;gap:10px;padding:12px 18px;border-radius:12px;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#fff;box-shadow:0 12px 28px rgba(16,185,129,.35);border:1px solid rgba(255,255,255,.2);backdrop-filter:blur(12px)}
.dl-toast-icon{width:20px;height:20px;display:inline-flex}
.dl-toast-icon :deep(svg){width:20px;height:20px}
.dl-toast-text{font-weight:700;font-size:13px}
.dl-toast-enter-active,.dl-toast-leave-active{transition:opacity .2s,transform .2s}
.dl-toast-enter-from,.dl-toast-leave-to{opacity:0;transform:translateX(-50%) translateY(-10px)}
</style>