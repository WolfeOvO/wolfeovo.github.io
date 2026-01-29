<template>
  <section
    class="dl-card"
    :style="cssVars"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- 顶部 Toast 提示 (复制成功反馈) -->
    <Teleport to="body">
      <Transition name="dl-toast">
        <div v-if="toast.visible" class="dl-toast" role="status">
          <span class="dl-toast-icon" v-html="icons.check"></span>
          <span class="dl-toast-text">已复制到剪贴板</span>
        </div>
      </Transition>
    </Teleport>

    <!-- 1. 头部：文件基础信息 -->
    <header class="dl-header">
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
        </div>
      </div>
    </header>

    <div class="dl-stack">
      <!-- 2. 实时延迟测试卡片 (科技感风格) -->
      <div class="dl-group">
        <div class="dl-label">
          <span class="dl-label-ico" v-html="icons.activity"></span>
          <span>线路实时延迟</span>
        </div>

        <div class="dl-latency-grid">
          <div
            v-for="(ch, idx) in normalizedChannels"
            :key="idx"
            class="dl-latency-card"
          >
            <!-- 头部：图标 + 名称 + 延迟 -->
            <div class="dl-latency-header">
              <div class="dl-latency-left">
                <span class="dl-latency-icon" v-html="ch.iconSvg"></span>
                <span class="dl-latency-name">{{ ch.name }}</span>
              </div>
              <!-- 延迟数值显示 -->
              <div class="dl-latency-val" :style="{ color: getLatencyColor(latencyStates[idx]?.current) }">
                <template v-if="latencyStates[idx]?.current > 0">
                  {{ latencyStates[idx]?.current }}<span class="dl-latency-unit">ms</span>
                </template>
                <template v-else>
                  <span class="dl-latency-loading">...</span>
                </template>
              </div>
            </div>

            <!-- 底部：心电图曲线背景 -->
            <div class="dl-latency-chart">
              <svg viewBox="0 0 200 40" preserveAspectRatio="none">
                <defs>
                  <pattern :id="`grid-${idx}`" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" :fill="`url(#grid-${idx})`" />
                <path 
                  class="dl-ecg-path" 
                  :d="getLatencyPath(latencyStates[idx]?.history)"
                  :stroke="getLatencyColor(latencyStates[idx]?.current)" 
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. 下载链接列表 (复刻截图：两行结构，仅按钮复制) -->
      <div class="dl-group">
        <div class="dl-label">
          <span class="dl-label-ico" v-html="icons.link"></span>
          <span>下载链接</span>
        </div>

        <div class="dl-links">
          <div
            v-for="(ch, idx) in normalizedChannels"
            :key="idx"
            class="dl-link-card"
          >
            <!-- 上半部分：名称 + 复制按钮 -->
            <div class="dl-link-top">
              <div class="dl-link-info">
                <span class="dl-link-ico" v-html="ch.iconSvg"></span>
                <span class="dl-link-name">{{ ch.name }}</span>
              </div>
              <button class="dl-link-copybtn" type="button" @click="copy(ch.url)">
                <span v-html="icons.copy"></span>
                复制
              </button>
            </div>

            <!-- 下半部分：URL链接 -->
            <div class="dl-link-bottom">
              <a :href="ch.url" target="_blank" rel="noopener noreferrer" class="dl-link-url" :title="ch.url">
                {{ ch.url }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";

const props = defineProps({
  name: { type: String, required: true },
  url: { type: String, default: "" },
  icon: { type: String, default: "" },
  ext: { type: String, default: "" },
  typeName: { type: String, default: "" },
  size: { type: String, default: "" },
  channels: { type: Array, default: null }, // [{ name, url, icon? }]
  color: { type: String, default: "blue" },
  theme: { type: Object, default: null },
});

const isHovered = ref(false);
const isDark = ref(false);
let observer;

/* ========= 延迟测试核心逻辑 ========= */
const latencyStates = reactive({}); // { index: { current: ms, history: [ms, ms...] } }
let latencyTimer = null;

const initLatencyStates = () => {
  normalizedChannels.value.forEach((_, idx) => {
    // 预填充 -1 表示无数据，绘制直线
    latencyStates[idx] = { current: 0, history: new Array(15).fill(-1) };
  });
};

const ping = async (url) => {
  const start = performance.now();
  try {
    // mode: 'no-cors' 是前端测速的关键，允许跨域请求而不报错（虽然拿不到内容，但能测时间）
    await fetch(url, { method: 'HEAD', mode: 'no-cors', cache: 'no-cache' });
    const duration = performance.now() - start;
    return Math.round(duration);
  } catch {
    return 999; // 超时或错误
  }
};

const startLatencyLoop = async () => {
  const runBatch = async () => {
    for (let i = 0; i < normalizedChannels.value.length; i++) {
      const ch = normalizedChannels.value[i];
      if (!latencyStates[i]) continue;
      
      const ms = await ping(ch.url);
      
      // 更新状态
      const state = latencyStates[i];
      state.current = ms;
      state.history.push(ms);
      if (state.history.length > 20) state.history.shift();
    }
  };

  await runBatch(); // 立即执行一次
  latencyTimer = setInterval(runBatch, 6000); // 之后每6秒轮询
};

/* ========= 视觉计算 (颜色/曲线) ========= */
const getLatencyColor = (ms) => {
  if (!ms || ms <= 0) return 'var(--dl-muted)';
  if (ms < 100) return '#10b981'; // 极快 - 绿
  if (ms < 300) return '#f59e0b'; // 一般 - 黄
  return '#ef4444'; // 慢 - 红
};

const getLatencyPath = (history) => {
  if (!history || history.length < 2) return "";
  const width = 200;
  const height = 40;
  const maxLatency = 500;
  const step = width / (history.length - 1);
  
  const points = history.map((ms, i) => {
    const val = ms === -1 ? maxLatency : ms;
    // 归一化：延迟越高，y越小(波峰越高)；延迟越低，y越大(波谷)
    const normalized = Math.min(val, maxLatency) / maxLatency;
    const y = height - (normalized * (height - 10)) - 5;
    return { x: i * step, y };
  });

  // 构建平滑贝塞尔曲线
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const mx = (p0.x + p1.x) / 2;
    d += ` C${mx},${p0.y} ${mx},${p1.y} ${p1.x},${p1.y}`;
  }
  return d;
};

/* ========= 暗黑模式监听 ========= */
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
    
    initLatencyStates();
    setTimeout(startLatencyLoop, 1000);
  }
});

onBeforeUnmount(() => {
  observer?.disconnect?.();
  if (latencyTimer) clearInterval(latencyTimer);
});

/* ========= 样式预设 ========= */
const PRESETS = {
  blue: {
    light: { bg: "#ffffff", border: "#e2e8f0", accent: "#3b82f6", text: "#0f172a", muted: "#64748b", iconBg: "#eff6ff", cardBg: "#f8fafc" },
    dark: { bg: "#1e293b", border: "#334155", accent: "#60a5fa", text: "#f1f5f9", muted: "#94a3b8", iconBg: "#172554", cardBg: "#0f172a" },
  },
  green: {
    light: { bg: "#ffffff", border: "#bbf7d0", accent: "#22c55e", text: "#064e3b", muted: "#64748b", iconBg: "#f0fdf4", cardBg: "#f0fdf4" },
    dark: { bg: "#14532d", border: "#166534", accent: "#4ade80", text: "#dcfce7", muted: "#9ca3af", iconBg: "#052e16", cardBg: "#14532d" },
  },
};

const palette = computed(() => {
  const base = PRESETS[props.color] || PRESETS.blue;
  const picked = isDark.value ? base.dark : base.light;
  return { ...picked, ...(props.theme || {}) };
});

const cssVars = computed(() => ({
  "--dl-bg": palette.value.bg,
  "--dl-border": palette.value.border,
  "--dl-accent": palette.value.accent,
  "--dl-text": palette.value.text,
  "--dl-muted": palette.value.muted,
  "--dl-icon-bg": palette.value.iconBg,
  "--dl-card-bg": palette.value.cardBg,
}));

/* ========= 核心：图标定义与自动识别 ========= */
const icons = {
  file: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  tag: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41 12 22l-8-8V2h12l4.59 4.59z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
  database: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/></svg>`,
  activity: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  link: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
  copy: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
  check: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
  website: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"/></svg>`,
};

const CHANNEL_ICONS = {
  github: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.4-4-1.4-.6-1.4-1.4-1.8-1.4-1.8-1.1-.8.1-.8.1-.8 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.9 1.3 3.6 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.9 0-1.3.5-2.4 1.2-3.3-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.2 11.2 0 0 1 6 0C17.4 4.9 18.4 5.2 18.4 5.2c.6 1.6.2 2.8.1 3.1.8.9 1.2 2 1.2 3.3 0 4.6-2.7 5.6-5.3 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5z"/></svg>`,
  gitee: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10h6a4 4 0 0 0 4-4v-6c0-5.52-4.48-10-10-10zm5.5 10.5H12a1.5 1.5 0 0 1 0-3h5.5a1.5 1.5 0 0 1 0 3z"/></svg>`,
  onedrive: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10.5 7.5a4.5 4.5 0 0 1 8.5 2A3.5 3.5 0 0 1 19.5 16H7a4 4 0 1 1 1.2-7.8A4.5 4.5 0 0 1 10.5 7.5z"/></svg>`,
  dropbox: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6 3l6 4-6 4-6-4 6-4zm12 0l6 4-6 4-6-4 6-4zM0 15l6-4 6 4-6 4-6-4zm18-4l6 4-6 4-6-4 6-4zM6 19l6-4 6 4-6 4-6-4z"/></svg>`,
  google: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M7.7 3h8.6l5 8.7-4.3 7.3H6.9L2.7 11.7 7.7 3zm1.7 2.5L5.6 11h6.7l3.8-5.5H9.4zm4.9 6.5H5.6l3.8 6.5h8.7L14.3 12zm1.4-1h6.7L18.6 5.5l-3.8 5.5z"/></svg>`,
  aliyun: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 19h20L12 2zm0 4.5l6 10.5H6l6-10.5z"/></svg>`, 
  docker: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21.5 11.4c-.6-.4-1.8-.5-2.5-.4-.2-1.4-1.1-2.4-2.3-3.1l-.2-.1-.1.2c-.4.8-.5 1.8-.2 2.7H7.2V7.9h2.2V5.7H7.2V3.5H5v2.2H2.8v2.2H5v2.8H2.4c-.2 2.8 1.2 5.1 4 5.9 1.5.4 3.2.3 4.8-.1 1.7-.4 3.2-1.2 4.3-2.4.7-.8 1.3-1.7 1.6-2.7.9.1 2.2.1 2.9-.6l.1-.1-.1-.1z"/></svg>`,
};

// 智能识别图标：根据 URL 或 名称
const autoDetectIcon = (name, url) => {
  const text = (name + url).toLowerCase();
  if (text.includes("github")) return "github";
  if (text.includes("gitee")) return "gitee";
  if (text.includes("onedrive") || text.includes("1drv")) return "onedrive";
  if (text.includes("dropbox")) return "dropbox";
  if (text.includes("drive.google")) return "google";
  if (text.includes("aliyun")) return "aliyun";
  if (text.includes("docker")) return "docker";
  return "website";
};

const fileIconSvg = computed(() => (props.icon ? props.icon : null));

const normalizedChannels = computed(() => {
  const raw = Array.isArray(props.channels) && props.channels.length
    ? props.channels
    : (props.url ? [{ name: "默认地址", url: props.url }] : []);

  return raw.map((ch) => {
    const name = ch?.name ?? "下载渠道";
    const url = ch?.url ?? props.url ?? "";
    
    let iconSvg = icons.website;
    // 1. 如果传了 SVG 字符串
    if (ch.icon && ch.icon.startsWith("<svg")) {
      iconSvg = ch.icon;
    } 
    // 2. 如果传了 key (如 'github')
    else if (ch.icon && CHANNEL_ICONS[ch.icon.toLowerCase()]) {
      iconSvg = CHANNEL_ICONS[ch.icon.toLowerCase()];
    } 
    // 3. 否则自动检测
    else {
      const key = autoDetectIcon(name, url);
      iconSvg = CHANNEL_ICONS[key] || icons.website;
    }

    return { name, url, iconSvg };
  });
});

/* ========= 工具函数 ========= */
const computedType = computed(() => {
  const ext = (props.ext || "").trim();
  const cleanExt = ext ? (ext.startsWith(".") ? ext : `.${ext}`) : "";
  const tn = (props.typeName || "").trim();
  if (cleanExt && tn) return `${cleanExt}/${tn}`;
  if (cleanExt) return cleanExt;
  if (tn) return tn;
  const guess = guessExtFromUrl(normalizedChannels.value[0]?.url);
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

function guessExtFromUrl(url) {
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").pop() || "";
    const m = last.match(/\.([a-z0-9]+)$/i);
    return m ? m[1].toLowerCase() : "";
  } catch { return ""; }
}

function parseToBytes(input) {
  if (!input) return null;
  const m = input.replace(/,/g, "").trim().match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]{0,3})$/);
  if (!m) return null;
  const val = Number(m[1]);
  if (!Number.isFinite(val)) return null;
  const unit = (m[2] || "B").toUpperCase();
  const table = { K:1024, M:1024**2, G:1024**3, KB:1024, MB:1024**2, GB:1024**3 };
  const factor = table[unit] ?? 1;
  return Math.round(val * factor);
}

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
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    showToast();
  }
};
</script>

<style scoped>
/* 基础容器 */
.dl-card {
  position: relative;
  overflow: hidden;
  background: var(--dl-bg);
  border: 1px solid var(--dl-border);
  border-radius: 12px;
  padding: 16px;
  margin: 18px 0;
  transition: all 0.3s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}
.dl-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }

/* Header */
.dl-header { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
.dl-file-icon {
  width: 44px; height: 44px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--dl-border);
  background: var(--dl-icon-bg);
  color: var(--dl-accent);
  flex-shrink: 0;
}
.dl-file-icon :deep(svg) { width: 22px; height: 22px; }

.dl-title { flex: 1; min-width: 0; }
.dl-name { font-size: 16px; font-weight: 700; color: var(--dl-text); line-height: 1.4; margin-bottom: 4px; }
.dl-sub { display: flex; flex-wrap: wrap; gap: 10px; }
.dl-sub-item { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--dl-muted); }
.dl-sub-ico {
  width: 16px; height: 16px; border-radius: 50%;
  background: var(--dl-icon-bg);
  color: var(--dl-accent);
  display: flex; align-items: center; justify-content: center;
}
.dl-sub-ico :deep(svg) { width: 10px; height: 10px; }

/* Group Label */
.dl-group { margin-top: 16px; }
.dl-label {
  display: flex; align-items: center; gap: 6px; 
  font-size: 12px; font-weight: 600; color: var(--dl-text); opacity: 0.8;
  margin-bottom: 10px;
  letter-spacing: 0.5px;
}
.dl-label-ico :deep(svg) { width: 14px; height: 14px; color: var(--dl-accent); }

/* Latency Grid (科技感卡片) */
.dl-latency-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.dl-latency-card {
  position: relative;
  background: var(--dl-card-bg);
  border: 1px solid var(--dl-border);
  border-radius: 8px;
  padding: 0;
  height: 68px; /* 固定高度确保整齐 */
  overflow: hidden;
  transition: all 0.2s ease;
  display: flex; flex-direction: column; justify-content: space-between;
}
.dl-latency-card:hover {
  transform: translateY(-2px);
  border-color: var(--dl-accent);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.dl-latency-header {
  padding: 8px 10px 0;
  display: flex; justify-content: space-between; align-items: flex-start;
  z-index: 2;
}
.dl-latency-left { display: flex; align-items: center; gap: 6px; }
.dl-latency-icon { color: var(--dl-text); opacity: 0.8; display: flex; }
.dl-latency-icon :deep(svg) { width: 14px; height: 14px; }
.dl-latency-name { font-size: 12px; font-weight: 600; color: var(--dl-text); white-space: nowrap; }

.dl-latency-val {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 16px; font-weight: 800;
  line-height: 1;
}
.dl-latency-unit { font-size: 10px; margin-left: 1px; opacity: 0.7; }
.dl-latency-loading { font-size: 12px; animation: pulse 1.5s infinite; opacity: 0.5; }

.dl-latency-chart {
  position: absolute; bottom: 0; left: 0; right: 0;
  height: 30px;
  opacity: 0.2;
  pointer-events: none;
  z-index: 1;
}
.dl-latency-chart svg { width: 100%; height: 100%; display: block; }
.dl-ecg-path {
  fill: none;
  stroke-width: 2;
  vector-effect: non-scaling-stroke;
  transition: d 0.5s ease;
}

/* Download Links (红框复刻) */
.dl-links { display: grid; gap: 10px; }

.dl-link-card {
  background: var(--dl-card-bg);
  border: 1px solid var(--dl-border);
  border-radius: 8px;
  padding: 12px 14px;
  display: flex; flex-direction: column; gap: 6px;
  transition: border-color 0.2s;
}
.dl-link-card:hover { border-color: var(--dl-accent); }

/* Link Row 1 */
.dl-link-top {
  display: flex; align-items: center; justify-content: space-between;
}
.dl-link-info { display: flex; align-items: center; gap: 8px; }
.dl-link-ico {
  color: var(--dl-text);
  display: flex; align-items: center;
}
.dl-link-ico :deep(svg) { width: 18px; height: 18px; }
.dl-link-name { font-size: 14px; font-weight: 700; color: var(--dl-text); }

.dl-link-copybtn {
  padding: 4px 10px;
  background: transparent;
  border: 1px solid var(--dl-border);
  border-radius: 4px;
  color: var(--dl-muted);
  font-size: 12px;
  cursor: pointer;
  display: flex; align-items: center; gap: 4px;
  transition: all 0.2s;
}
.dl-link-copybtn:hover {
  border-color: var(--dl-accent);
  color: var(--dl-accent);
  background: var(--dl-icon-bg);
}
.dl-link-copybtn :deep(svg) { width: 12px; height: 12px; }

/* Link Row 2 */
.dl-link-bottom {
  padding-left: 26px; /* 对齐文字 */
}
.dl-link-url {
  font-size: 12px;
  color: var(--dl-accent);
  text-decoration: none;
  word-break: break-all;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  opacity: 0.9;
}
.dl-link-url:hover { text-decoration: underline; opacity: 1; }

/* Toast */
.dl-toast {
  position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
  z-index: 9999;
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  background: #10b981; color: #fff;
  box-shadow: 0 4px 12px rgba(16,185,129,0.3);
  font-size: 13px; font-weight: 600;
}
.dl-toast-enter-active, .dl-toast-leave-active { transition: all 0.2s ease; }
.dl-toast-enter-from, .dl-toast-leave-to { opacity: 0; transform: translate(-50%, -10px); }

@keyframes pulse { 0% { opacity: 0.3; } 50% { opacity: 0.7; } 100% { opacity: 0.3; } }
</style>