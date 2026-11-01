import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Check,
  Copy,
  Download,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BotMessageSquare,
  Brush,
  CirclePlus,
  Eraser,
  Clock,
  History,
  ImageIcon,
  Images,
  KeyRound,
  LoaderCircle,
  LogOut,
  Languages,
  Maximize2,
  MessageSquareText,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  SendHorizontal,
  Server,
  SlidersHorizontal,
  Sparkles,
  Star,
  Sun,
  Undo2,
  Redo2,
  FlipHorizontal,
  ScanLine,
  SquarePen,
  WandSparkles,
  Trash2,
  Upload,
  Video,
  X
} from 'lucide-react';
import '@fontsource-variable/inter/wght.css';
import '@fontsource-variable/space-grotesk/wght.css';
import './studio.css';
import {
  AiGatewayClient,
  StudioHistoryClient,
  clearSession,
  fetchStudioAuthMode,
  getImageUrls,
  getVideoUrls,
  getConfiguredBaseUrls,
  getLoginUrl,
  loadProviderSettings,
  loadSession,
  loginStudio,
  saveProviderSettings,
  saveSelectedKeyId
} from './aiGatewayClient';
import { buildPromptSlug, sanitizeProvider } from './studio/util/filename.js';
import { createTranslator, loadStudioLanguage, nextLanguage, saveStudioLanguage, SUPPORTED_LANGUAGES } from './studio/i18n.js';
import { IMAGE_PROVIDER_REGISTRY, getImageProvider } from './studio/providers/index.js';
import { resolveProviderAdapter } from './studio/providers/adapters.js';
import {
  clearHistoryItems,
  deleteHistoryItem,
  loadHistoryItems,
  saveHistoryItems
} from './studio/storage/index.js';

const IMAGE_MODELS = ['gpt-image-2', 'gpt-image-1', 'gpt-image-1-mini'];
const RESPONSE_MODELS = ['gpt-5.5', 'gpt-5.2', 'gpt-5.1', 'gpt-4.1'];
const PROMPT_ASSISTANT_MODEL_EXCLUDE_PATTERN = /image|video|sora|runway|kling|veo|codex|review|audit|security|embed|rerank|tts|whisper/i;
const VIDEO_MODELS = [];
const IMAGE_GENERATION_ROUTE_LABEL = 'Tự chọn';
const SIZES = ['auto', '1024x1024', '1536x1024', '1024x1536'];
const ASPECT_OPTIONS = [
  { value: '1:1', label: '1:1', size: '1024x1024' },
  { value: '16:9', label: '16:9', size: '1536x1024' },
  { value: '9:16', label: '9:16', size: '1024x1536' },
  { value: 'custom', label: 'Tùy chỉnh', size: '1024x1024' }
];
const CUSTOM_SIZE_OPTIONS = [
  { value: 'auto', label: 'Tự động' },
  { value: '1024x1024', label: '1024 x 1024' },
  { value: '1536x1024', label: '1536 x 1024' },
  { value: '1024x1536', label: '1024 x 1536' }
];
const QUALITY = ['auto', 'low', 'medium', 'high'];
const RESOLUTION_TIERS = [
  { value: '1k', label: '1K' },
  { value: '2k', label: '2K' },
  { value: '4k', label: '4K' }
];
const OUTPUT_FORMATS = ['png', 'jpeg', 'webp'];
const MODERATION = ['auto', 'low'];
const IMAGE_MODEL_PATTERN = /(?:^|[^a-z0-9])(?:gpt-)?image[-_a-z0-9]*\d|(?:^|[^a-z0-9])dall[-_a-z0-9]*\d/i;
const IMAGE_REFERENCE_LIMIT = 4;
const SUPPORTED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const CANVAS_PLANE_WIDTH = 2400;
const CANVAS_PLANE_HEIGHT = 1600;
const CANVAS_NODE_WIDTH = 340;
const CANVAS_NODE_HEIGHT = 280;
const CANVAS_NODE_MIN_WIDTH = 240;
const CANVAS_NODE_MIN_HEIGHT = 200;
const CANVAS_NODE_MAX_WIDTH = 620;
const CANVAS_NODE_MAX_HEIGHT = 520;
const CANVAS_NODE_HORIZONTAL_GAP = 170;
const CANVAS_NODE_VERTICAL_GAP = 88;
const CANVAS_DRAG_CLICK_TOLERANCE = 4;
const CANVAS_VIRTUALIZATION_MARGIN = 420;
const CANVAS_PERFORMANCE_NODE_THRESHOLD = 18;
const CANVAS_PERFORMANCE_EDGE_THRESHOLD = 24;
const CANVAS_PROTECTED_ASSET_RESOLVE_LIMIT = 24;
const GENERATION_STALL_NOTICE_MS = 90 * 1000;
const GENERATION_TIMEOUT_MS = 45 * 60 * 1000;
const GENERATION_QUEUE_LIMIT = 12;
const VISIBLE_GENERATION_QUEUE_STATUSES = ['queued', 'running', 'failed', 'canceled', 'unknown', 'done'];
const CURRENT_PROJECT_QUEUE_STATUSES = new Set(VISIBLE_GENERATION_QUEUE_STATUSES);
const VIDEO_ASPECT_OPTIONS = [
  { value: '16:9', label: '16:9', width: 1280, height: 720 },
  { value: '9:16', label: '9:16', width: 720, height: 1280 },
  { value: '1:1', label: '1:1', width: 1024, height: 1024 }
];
const VIDEO_DURATIONS = [5, 10];
const VIDEO_FPS_OPTIONS = [24, 30];
const VIDEO_MOTIONS = [
  { value: 'auto', label: 'Tự động' },
  { value: 'push_in', label: 'Tiến gần' },
  { value: 'pull_out', label: 'Lùi xa' },
  { value: 'orbit', label: 'Quay vòng' },
  { value: 'pan', label: 'Quét ngang' },
  { value: 'static', label: 'Cố định' }
];
const VIDEO_STYLES = [
  { value: 'cinematic', label: 'Điện ảnh' },
  { value: 'product_ad', label: 'Quảng cáo sản phẩm' },
  { value: 'realistic', label: 'Chân thực' },
  { value: 'animation', label: 'Hoạt hình' }
];
const VIDEO_QUALITY = ['auto', 'standard', 'high'];
const WORKSPACES = [
  { value: 'image', label: 'Tạo ảnh' },
  { value: 'inspiration', label: 'Thư viện ý tưởng' },
  { value: 'video', label: 'Tạo video' },
  { value: 'history', label: 'Lịch sử ảnh' }
];
const DESK_MODES = [
  { value: 'image', label: 'Tạo ảnh từ văn bản', icon: ImageIcon },
  { value: 'edit', label: 'Ảnh tham chiếu', icon: Images },
  { value: 'mask', label: 'Mask', icon: ScanLine }
];
const MASK_HISTORY_LIMIT = 6;
const MASK_FILL_COLOR = 'rgba(178, 39, 50, 0.34)';
const INITIAL_TEMPLATE_LIMIT = 12;
const TEMPLATE_PAGE_SIZE = 12;
const HISTORY_PAGE_SIZE = 20;
const PROTECTED_IMAGE_CONCURRENCY = 4;
const protectedImageQueue = [];
let activeProtectedImageRequests = 0;

function runQueuedProtectedImageTasks() {
  while (activeProtectedImageRequests < PROTECTED_IMAGE_CONCURRENCY && protectedImageQueue.length) {
    const task = protectedImageQueue.shift();
    activeProtectedImageRequests += 1;
    task.run()
      .then(task.resolve, task.reject)
      .finally(() => {
        activeProtectedImageRequests = Math.max(0, activeProtectedImageRequests - 1);
        runQueuedProtectedImageTasks();
      });
  }
}

function enqueueProtectedImageTask(run) {
  return new Promise((resolve, reject) => {
    protectedImageQueue.push({ run, resolve, reject });
    runQueuedProtectedImageTasks();
  });
}
const CATEGORY_LABELS = {
  'Architecture & Spaces': 'Kiến trúc và không gian',
  'Brand & Logos': 'Thương hiệu và logo',
  'Characters & People': 'Nhân vật và con người',
  'Charts & Infographics': 'Biểu đồ và đồ họa thông tin',
  'Community Prompts': 'Prompt cộng đồng',
  'Documents & Publishing': 'Tài liệu và xuất bản',
  'Fashion & Beauty': 'Thời trang và làm đẹp',
  'Games & Entertainment': 'Trò chơi và giải trí',
  'History & Classical Themes': 'Lịch sử và chủ đề cổ điển',
  'Illustration & Art': 'Minh họa và nghệ thuật',
  'Other Use Cases': 'Trường hợp sử dụng khác',
  'Photography & Realism': 'Nhiếp ảnh và phong cách chân thực',
  'Posters & Typography': 'Áp phích và kiểu chữ',
  'Products & E-commerce': 'Sản phẩm và thương mại điện tử',
  'Scenes & Storytelling': 'Bối cảnh và kể chuyện',
  'UI & Interfaces': 'Giao diện và trải nghiệm'
};
const QUALITY_LABELS = {
  auto: 'Tự động',
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao'
};
const RESOLUTION_TIER_LABELS = {
  '1k': '1K',
  '2k': '2K',
  '4k': '4K'
};
const OUTPUT_FORMAT_LABELS = {
  png: 'PNG',
  jpeg: 'JPEG',
  webp: 'WebP'
};
const MODERATION_LABELS = {
  auto: 'Tự động',
  low: 'Thấp'
};
function providerParameterList(provider, key, fallback) {
  const values = provider?.parameters?.[key];
  return Array.isArray(values) && values.length ? values : fallback;
}

function providerCountRange(provider) {
  const [minValue, maxValue] = Array.isArray(provider?.parameters?.countRange)
    ? provider.parameters.countRange
    : [1, 10];
  const min = Math.max(1, Math.round(Number(minValue) || 1));
  const max = Math.max(min, Math.round(Number(maxValue) || 10));
  return { min, max };
}

function providerAspectOptions(provider) {
  const supportedSizes = new Set(providerParameterList(provider, 'sizes', SIZES));
  const options = ASPECT_OPTIONS.filter((item) => item.value === 'custom' || supportedSizes.has(item.size));
  return options.length ? options : ASPECT_OPTIONS;
}

function providerCustomSizeOptions(provider) {
  const sizes = providerParameterList(provider, 'sizes', SIZES);
  return sizes.map((value) => (
    CUSTOM_SIZE_OPTIONS.find((item) => item.value === value) || { value, label: value === 'auto' ? 'Auto' : value.replace('x', ' x ') }
  ));
}

function clampCountForProvider(value, provider) {
  const range = providerCountRange(provider);
  const next = normalizeCount(value);
  return Math.min(range.max, Math.max(range.min, next));
}

const FALLBACK_PROMPT_PRESETS = [];
const FALLBACK_VIDEO_INSPIRATIONS = [];
const BASE_PATH = import.meta.env.BASE_URL || '/';
const STUDIO_BACK_URL = import.meta.env.VITE_STUDIO_BACK_URL || '/';
const LIBRARY_AUTH_REQUIRED = String(import.meta.env.VITE_STUDIO_LIBRARY_AUTH_REQUIRED || '').toLowerCase() === 'true';
const DRAFT_KEY = 'image-sub2api-studio:draft:v1';
const LEGACY_DRAFT_KEY = 'ohlaoo-studio:draft:v1';
const HISTORY_KEY = 'image-sub2api-studio:history:v1';
const LEGACY_HISTORY_KEY = 'ohlaoo-studio:history:v1';
const HISTORY_SCOPE_PREFIX = 'image-sub2api-studio:history:v2';
const LEGACY_HISTORY_SCOPE_PREFIX = 'ohlaoo-studio:history:v2';
const THEME_KEY = 'image-sub2api-studio:theme:v1';
const LEGACY_THEME_KEY = 'ohlaoo-studio:theme:v1';
const TEMPLATE_FAVORITES_KEY = 'image-sub2api-studio:template-favorites:v1';
const LEGACY_TEMPLATE_FAVORITES_KEY = 'ohlaoo-studio:template-favorites:v1';
const WORKBENCH_LAYOUT_KEY = 'image-sub2api-studio:workbench-layout:v6';
const CURRENT_SESSION_KEY = 'image-sub2api-studio:current-session:v1';
const LOCAL_HISTORY_LIMIT = 30;
const REFERENCE_ROLES = [
  { value: 'identity', label: 'Chủ thể' },
  { value: 'style', label: 'Phong cách' },
  { value: 'composition', label: 'Bố cục' },
  { value: 'product', label: 'Sản phẩm' }
];
const EMPTY_SITE_DATA = {
  totalCases: 0,
  categories: [],
  styles: [],
  scenes: [],
  inspirationSources: [],
  inspirationErrors: [],
  promptPresets: [],
  videoInspirations: [],
  cases: []
};
const COMMUNITY_LICENSE_NOTICE = {
  name: 'Mẫu prompt cộng đồng · CC BY 4.0',
  url: 'https://creativecommons.org/licenses/by/4.0/',
  text: 'Nội dung mẫu prompt đến từ cộng đồng công khai và tuân theo giấy phép CC BY 4.0. Khi sử dụng hoặc chỉnh sửa, vui lòng ghi nhận tác giả hoặc nguồn gốc ban đầu.'
};

const CATEGORY_COVERS = {
  'Architecture & Spaces': 'architecture',
  'Brand & Logos': 'brand',
  'Characters & People': 'character',
  'Charts & Infographics': 'infographic',
  'Community Prompts': 'latest',
  'Documents & Publishing': 'document',
  'Fashion & Beauty': 'photo',
  'Games & Entertainment': 'gallery',
  'History & Classical Themes': 'history',
  'Illustration & Art': 'illustration',
  'Other Use Cases': 'other',
  'Photography & Realism': 'photo',
  'Posters & Typography': 'poster',
  'Products & E-commerce': 'product',
  'Scenes & Storytelling': 'scene',
  'UI & Interfaces': 'ui'
};
const PROMPT_PRESETS = FALLBACK_PROMPT_PRESETS;
const CREATIVE_RECIPES = [
  {
    id: 'commerce-main',
    title: 'Ảnh sản phẩm thương mại điện tử',
    tone: 'Gọn gàng, dễ bán',
    size: '1024x1024',
    quality: 'high',
    resolutionTier: '2k',
    prompt: 'Ảnh chụp sản phẩm thương mại, đặt chủ thể ở giữa, nền sáng sạch, ánh sáng studio dịu, viền sáng rõ, nhìn thấy kết cấu chất liệu, chừa một khoảng nhỏ cho nội dung khuyến mãi, phù hợp làm ảnh sản phẩm chính trên sàn thương mại điện tử.'
  },
  {
    id: 'lifestyle-scene',
    title: 'Khung cảnh đời thường',
    tone: 'Không khí chân thực',
    size: '1024x1536',
    quality: 'high',
    resolutionTier: '2k',
    prompt: 'Ảnh phong cách sống, đặt chủ thể trong bối cảnh sử dụng thực tế, ánh sáng tự nhiên từ cửa sổ, độ sâu trường ảnh nông, màu sắc ấm áp nhưng tiết chế, khung hình giàu câu chuyện như nội dung mạng xã hội của thương hiệu cao cấp.'
  },
  {
    id: 'brand-poster',
    title: 'Áp phích thương hiệu',
    tone: 'Ấn tượng thị giác',
    size: '1024x1536',
    quality: 'high',
    resolutionTier: '4k',
    prompt: 'Áp phích nhận diện thương hiệu, bố cục có thứ bậc rõ ràng, chừa vùng trống dễ đọc cho tiêu đề chính, chủ thể và họa tiết tạo chuyển động theo đường chéo, chất lượng quảng cáo thương mại cao cấp, phù hợp quảng bá sự kiện.'
  },
  {
    id: 'ui-mockup',
    title: 'Mô hình giao diện',
    tone: 'Trình bày sản phẩm',
    size: '1536x1024',
    quality: 'medium',
    resolutionTier: '2k',
    prompt: 'Mô hình giao diện sản phẩm hiện đại trong khung thiết bị hoặc trình duyệt chân thực, thông tin trên giao diện rõ ràng và dễ đọc, nền tối giản, ánh sáng tiết chế, làm nổi bật quy trình và trạng thái thao tác quan trọng.'
  },
  {
    id: 'character-sheet',
    title: 'Thiết kế nhân vật',
    tone: 'Nhất quán tạo hình',
    size: '1024x1536',
    quality: 'high',
    resolutionTier: '2k',
    prompt: 'Bảng thiết kế nhân vật với cùng một nhân vật ở tư thế nhìn thẳng; trang phục, phụ kiện và đặc điểm biểu cảm rõ nét; nền sạch, phù hợp làm ảnh tham chiếu để giữ tạo hình nhất quán trong các ảnh tiếp theo.'
  },
  {
    id: 'editorial-cover',
    title: 'Ảnh bìa nổi bật',
    tone: 'Phong cách tạp chí',
    size: '1024x1536',
    quality: 'high',
    resolutionTier: '4k',
    prompt: 'Ảnh bìa tạp chí với hình ảnh chủ đạo nổi bật nhưng tự nhiên; nhân vật hoặc chủ thể thu hút ánh nhìn đầu tiên, nền có chiều sâu, chừa chỗ cho tiêu đề, màu sắc mang phong cách biên tập cao cấp.'
  }
];
const CREATIVE_RECIPE_PREFIX = 'Công thức nâng cao: ';


function compact(value, length = 180) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length > length ? `${text.slice(0, length)}...` : text;
}

function shortId(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 8) || Math.random().toString(36).slice(2, 10);
}

function formatDownloadStamp(value) {
  const date = new Date(value || Date.now());
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const pad = (number) => String(number).padStart(2, '0');
  return [
    safeDate.getFullYear(),
    pad(safeDate.getMonth() + 1),
    pad(safeDate.getDate())
  ].join('') + '-' + [
    pad(safeDate.getHours()),
    pad(safeDate.getMinutes()),
    pad(safeDate.getSeconds())
  ].join('');
}

function formatFileSize(value) {
  const size = Number(value || 0);
  if (!Number.isFinite(size) || size <= 0) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 102.4) / 10} KB`;
  return `${Math.round(size / (1024 * 102.4)) / 10} MB`;
}

function buildStudioDownloadFilename({
  mode = 'image',
  providerId = 'gateway-account',
  createdAt,
  prompt,
  id,
  index = 0,
  extension = 'png'
} = {}) {
  const type = mode === 'video' ? 'video' : 'image';
  const provider = sanitizeProvider(providerId);
  const stamp = formatDownloadStamp(createdAt);
  const slug = buildPromptSlug(prompt);
  const suffix = shortId(id || `${stamp}-${slug}-${index}`);
  const seq = String(Math.max(1, (Number.isFinite(index) ? (index | 0) : 0) + 1)).padStart(2, '0');
  const ext = String(extension || (type === 'video' ? 'mp4' : 'png')).toLowerCase().replace(/[^a-z0-9]+/g, '') || (type === 'video' ? 'mp4' : 'png');
  return `ai-image-workbench-${type}-${provider}-${stamp}-${slug}-${suffix}-${seq}.${ext}`;
}

function downloadMetaFromHistoryItem(item, isVideo = false) {
  return {
    mode: isVideo ? 'video' : 'image',
    providerId: item?.providerId || item?.provider || item?.route || item?.model || 'gateway-account',
    createdAt: item?.createdAt,
    prompt: item?.generationPrompt || item?.prompt || item?.case?.title || '',
    id: item?.taskId || item?.id || item?.createdAt
  };
}

function stripCreativeRecipePrompt(value) {
  let next = String(value || '').trim();
  if (!next) return '';
  for (const recipe of CREATIVE_RECIPES) {
    if (next === recipe.prompt) return '';
    const markedPrompt = `${CREATIVE_RECIPE_PREFIX}${recipe.prompt}`;
    while (next.includes(markedPrompt)) {
      next = next
        .replace(`\n\n${markedPrompt}`, '')
        .replace(`\n${markedPrompt}`, '')
        .replace(markedPrompt, '')
        .trim();
    }
  }
  return next;
}

function formatMoney(value) {
  if (!Number.isFinite(Number(value))) return '--';
  return `$${Number(value).toFixed(2)}`;
}

function orderTemplates(cases) {
  return [...cases].sort((left, right) => {
    if (Boolean(left.featured) !== Boolean(right.featured)) {
      return left.featured ? -1 : 1;
    }
    const leftId = Number(left.id);
    const rightId = Number(right.id);
    if (Number.isFinite(leftId) && Number.isFinite(rightId)) return leftId - rightId;
    if (Number.isFinite(leftId)) return -1;
    if (Number.isFinite(rightId)) return 1;
    return String(left.title || '').localeCompare(String(right.title || ''), 'vi-VN');
  });
}

function assetPath(value) {
  if (!value) return '';
  if (/^(https?:|data:|blob:)/.test(value)) return value;
  if (value.startsWith('/studio-api/')) return value;
  const base = BASE_PATH.endsWith('/') ? BASE_PATH : `${BASE_PATH}/`;
  return value.startsWith('/') ? `${base}${value.slice(1)}` : `${base}${value}`;
}

function loadDraft() {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) || localStorage.getItem(LEGACY_DRAFT_KEY) || 'null');
  } catch {
    return null;
  }
}

function saveDraft(draft) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

function loadCurrentSession() {
  try {
    const session = JSON.parse(localStorage.getItem(CURRENT_SESSION_KEY) || 'null');
    if (!session || typeof session !== 'object') return null;
    return normalizeCachedCurrentSession(session);
  } catch {
    return null;
  }
}

function saveCurrentSession(session) {
  const nextSession = {
    ...(normalizeCachedCurrentSession(session) || session),
    updatedAt: new Date().toISOString()
  };
  try {
    localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(nextSession));
  } catch {
    // The active canvas is a convenience cache; generation/history still work if storage is full.
  }
  return nextSession;
}

function clearCurrentSessionCache() {
  try {
    localStorage.removeItem(CURRENT_SESSION_KEY);
  } catch {
    // A new canvas should still open even if browser storage is unavailable.
  }
}

function sessionUrlForServer(url, persistedUrl) {
  const value = String(url || '');
  if (value.startsWith('blob:') && persistedUrl) return persistedUrl;
  return value;
}

function normalizeCachedCurrentSession(session) {
  if (!session || typeof session !== 'object') return null;
  const persistedResults = Array.isArray(session.persistedResults) ? session.persistedResults : [];
  const persistedVideoResults = Array.isArray(session.persistedVideoResults) ? session.persistedVideoResults : [];
  const restoredQueueStatus = (item) => {
    if (item?.remote || item?.serverJobId) return item?.status;
    if (item?.status === 'running') return 'failed';
    if (item?.status === 'queued') return 'failed';
    return item?.status;
  };
  const generationQueue = Array.isArray(session.generationQueue)
    ? session.generationQueue
      .filter((item) => item && typeof item === 'object')
      .slice(-GENERATION_QUEUE_LIMIT)
      .map((item) => ({
        ...item,
        status: restoredQueueStatus(item),
        restored: true,
        summary: String(item.summary || item.prompt || '').slice(0, 240)
      }))
    : [];
  return {
    ...session,
    results: Array.isArray(session.results)
      ? session.results.map((url, index) => sessionUrlForServer(url, persistedResults[index]))
      : [],
    videoResults: Array.isArray(session.videoResults)
      ? session.videoResults.map((url, index) => sessionUrlForServer(url, persistedVideoResults[index]))
      : [],
    canvasNodes: Array.isArray(session.canvasNodes)
      ? session.canvasNodes.map((node) => ({
        ...node,
        url: sessionUrlForServer(node?.url, node?.persistedUrl)
      }))
      : [],
    generationQueue
  };
}

function prepareCurrentSessionForServer(session) {
  if (!session || typeof session !== 'object') return null;
  const normalized = normalizeCachedCurrentSession(session);
  const persistedResults = Array.isArray(normalized.persistedResults) ? normalized.persistedResults : [];
  const persistedVideoResults = Array.isArray(normalized.persistedVideoResults) ? normalized.persistedVideoResults : [];
  const {
    persistedResults: _persistedResults,
    persistedVideoResults: _persistedVideoResults,
    updatedAt: _updatedAt,
    ...rest
  } = normalized;
  return {
    ...rest,
    results: Array.isArray(normalized.results)
      ? normalized.results.map((url, index) => sessionUrlForServer(url, persistedResults[index]))
      : [],
    videoResults: Array.isArray(normalized.videoResults)
      ? normalized.videoResults.map((url, index) => sessionUrlForServer(url, persistedVideoResults[index]))
      : [],
    canvasNodes: Array.isArray(normalized.canvasNodes)
      ? normalized.canvasNodes.map(({ persistedUrl, ...node }) => ({
        ...node,
        url: sessionUrlForServer(node.url, persistedUrl)
      }))
      : [],
    generationQueue: Array.isArray(normalized.generationQueue)
      ? normalized.generationQueue.map(serializeGenerationQueueItem).filter(Boolean)
      : []
  };
}

function sessionSnapshotComparePayload(session) {
  const payload = prepareCurrentSessionForServer(session);
  return payload ? JSON.stringify(payload) : '';
}

function hasRestorableServerGeneration(session) {
  return Array.isArray(session?.generationQueue)
    && session.generationQueue.some((item) => (
      item?.serverJobId
      && (item.remote || item.status === 'running' || item.status === 'queued')
      && !['failed', 'canceled', 'unknown', 'done'].includes(item.status)
    ));
}

function serializeAssistantMessage(item) {
  if (!item || typeof item !== 'object') return null;
  const role = item.role === 'assistant' ? 'assistant' : 'user';
  return {
    id: String(item.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    role,
    content: String(item.content || '').slice(0, 8000),
    finalPrompt: String(item.finalPrompt || '').slice(0, 12000),
    pending: Boolean(item.pending),
    failed: Boolean(item.failed)
  };
}

function serializePromptSuggestion(value) {
  if (!value || typeof value !== 'object') return null;
  return {
    subject: String(value.subject || '').slice(0, 2000),
    scene: String(value.scene || '').slice(0, 2000),
    composition: String(value.composition || '').slice(0, 2000),
    style: String(value.style || '').slice(0, 2000),
    lighting: String(value.lighting || '').slice(0, 2000),
    details: String(value.details || '').slice(0, 3000),
    textRules: String(value.textRules || '').slice(0, 2000),
    constraints: String(value.constraints || '').slice(0, 3000),
    finalPrompt: String(value.finalPrompt || '').slice(0, 12000),
    raw: String(value.raw || '').slice(0, 16000)
  };
}

function serializeGenerationQueueItem(item) {
  if (!item || typeof item !== 'object') return null;
  const safeStatus = ['queued', 'running', 'failed', 'canceled', 'unknown', 'done'].includes(item.status) ? item.status : item.status || 'queued';
  return {
    id: String(item.id || ''),
    status: safeStatus,
    createdAt: Number(item.createdAt || Date.now()),
    startedAt: item.startedAt ? Number(item.startedAt) : null,
    completedAt: item.completedAt ? Number(item.completedAt) : null,
    mode: item.mode || 'image',
    providerId: String(item.providerId || item.provider || ''),
    providerFamily: String(item.providerFamily || item.providerId || item.provider || ''),
    apiKeySource: String(item.apiKeySource || ''),
    providerLabel: String(item.providerLabel || ''),
    prompt: String(item.prompt || '').slice(0, 12000),
    model: String(item.model || IMAGE_MODELS[0]),
    aspect: item.aspect || item.aspectRatio || '1:1',
    aspectRatio: item.aspectRatio || item.aspect || '1:1',
    customSize: normalizeSize(item.customSize || item.size),
    size: normalizeSize(item.size),
    quality: normalizeQuality(item.quality),
    resolutionTier: normalizeResolutionTier(item.resolutionTier),
    outputFormat: normalizeOutputFormat(item.outputFormat),
    moderation: normalizeModeration(item.moderation),
    count: normalizeCount(item.count),
    videoModel: item.videoModel || VIDEO_MODELS[0],
    videoAspect: normalizeVideoAspect(item.videoAspect || item.videoAspectRatio),
    videoAspectRatio: normalizeVideoAspect(item.videoAspectRatio || item.videoAspect),
    videoDuration: normalizeVideoDuration(item.videoDuration || item.duration),
    duration: normalizeVideoDuration(item.duration || item.videoDuration),
    videoFps: normalizeVideoFps(item.videoFps || item.fps),
    fps: normalizeVideoFps(item.fps || item.videoFps),
    videoMotion: normalizeVideoMotion(item.videoMotion),
    videoStyle: normalizeVideoStyle(item.videoStyle),
    videoQuality: normalizeVideoQuality(item.videoQuality),
    negativePrompt: String(item.negativePrompt || '').slice(0, 4000),
    selectedCanvasNodeId: String(item.selectedCanvasNodeId || ''),
    selectedCanvasNodeSnapshot: item.selectedCanvasNodeSnapshot || null,
    referencesOpen: Boolean(item.referencesOpen),
    summary: String(item.summary || item.prompt || '').slice(0, 240),
    restorable: item.restorable !== false && !['edit', 'mask', 'video'].includes(item.mode),
    serverJobId: item.serverJobId || '',
    remote: Boolean(item.remote),
    restored: Boolean(item.restored),
    stage: String(item.stage || '').slice(0, 40),
    completed: Number(item.completed || 0),
    total: Number(item.total || item.count || 1),
    resultUrls: Array.isArray(item.resultUrls) ? item.resultUrls.slice(0, 4).map(String) : [],
    requestIds: Array.isArray(item.requestIds) ? item.requestIds.slice(0, 8).map(String) : [],
    error: item.error && typeof item.error === 'object'
      ? {
        code: String(item.error.code || '').slice(0, 120),
        status: item.error.status || null,
        requestId: String(item.error.requestId || '').slice(0, 160),
        message: String(item.error.message || '').slice(0, 1200)
      }
      : null
  };
}

function templateKey(item) {
  return String(item?.id ?? item?.title ?? '').trim();
}

function loadTemplateFavorites() {
  try {
    const items = JSON.parse(localStorage.getItem(TEMPLATE_FAVORITES_KEY) || localStorage.getItem(LEGACY_TEMPLATE_FAVORITES_KEY) || '[]');
    return new Set(Array.isArray(items) ? items.map(String) : []);
  } catch {
    return new Set();
  }
}

function saveTemplateFavorites(favorites) {
  try {
    localStorage.setItem(TEMPLATE_FAVORITES_KEY, JSON.stringify([...favorites]));
  } catch {
    // Favorite state is a convenience layer; Studio still works if storage is unavailable.
  }
}

function loadWorkbenchLayout() {
  try {
    const stored = JSON.parse(localStorage.getItem(WORKBENCH_LAYOUT_KEY) || 'null');
    return {
      prompt: stored?.prompt === true,
      references: stored?.references === true,
      parameters: stored?.parameters !== false,
      parametersRail: stored?.parametersRail === true,
      bottomComposer: true,
      composerParameters: stored?.composerParameters === true,
      composerFolded: false
    };
  } catch {
    return {
      prompt: false,
      references: false,
      parameters: true,
      parametersRail: false,
      bottomComposer: true,
      composerParameters: false,
      composerFolded: false
    };
  }
}

function saveWorkbenchLayout(layout) {
  try {
    localStorage.setItem(WORKBENCH_LAYOUT_KEY, JSON.stringify(layout));
  } catch {
    // Layout state is optional; keep the in-memory UI responsive even if storage fails.
  }
}

function normalizeSize(value) {
  return SIZES.includes(value) ? value : '1024x1024';
}

function normalizeAspect(value, size) {
  if (ASPECT_OPTIONS.some((item) => item.value === value)) return value;
  const matched = ASPECT_OPTIONS.find((item) => item.value !== 'custom' && item.size === size);
  return matched?.value || '1:1';
}

function sizeFromAspect(aspect, customSize) {
  if (aspect === 'custom') return normalizeSize(customSize);
  return ASPECT_OPTIONS.find((item) => item.value === aspect)?.size || '1024x1024';
}

function normalizeQuality(value) {
  return QUALITY.includes(value) && value !== 'auto' ? value : 'medium';
}

function normalizeResolutionTier(value) {
  return RESOLUTION_TIERS.some((item) => item.value === value) ? value : '1k';
}

function withResolutionHint(prompt, resolutionTier, t = (key, fallback) => fallback || key) {
  const normalizedTier = normalizeResolutionTier(resolutionTier);
  const hint = t(`params.resolutionPromptHints.${normalizedTier}`, '');
  return hint ? `${prompt}\n\n${hint}` : prompt;
}

function textSignature(value, length = 72) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .slice(0, length);
}

function wantsPromptRewrite(value) {
  return /(?:viết lại|làm lại từ đầu|không dựa trên|bỏ qua ảnh gốc|thay bằng một ý tưởng mới|thiết kế lại)/i.test(String(value || ''));
}

function normalizeOutputFormat(value) {
  return OUTPUT_FORMATS.includes(value) ? value : 'png';
}

function normalizeModeration(value) {
  return MODERATION.includes(value) ? value : 'auto';
}

function normalizeCount(value) {
  const next = Math.round(Number(value));
  if (!Number.isFinite(next)) return 1;
  return Math.min(10, Math.max(1, next));
}

function normalizeVideoAspect(value) {
  return VIDEO_ASPECT_OPTIONS.some((item) => item.value === value) ? value : '16:9';
}

function normalizeVideoDuration(value) {
  const next = Math.round(Number(value));
  return VIDEO_DURATIONS.includes(next) ? next : 5;
}

function normalizeVideoFps(value) {
  const next = Math.round(Number(value));
  return VIDEO_FPS_OPTIONS.includes(next) ? next : 24;
}

function normalizeVideoMotion(value) {
  return VIDEO_MOTIONS.some((item) => item.value === value) ? value : 'auto';
}

function normalizeVideoStyle(value) {
  return VIDEO_STYLES.some((item) => item.value === value) ? value : 'cinematic';
}

function normalizeVideoQuality(value) {
  return VIDEO_QUALITY.includes(value) ? value : 'auto';
}

function videoSizeFromAspect(aspect) {
  return VIDEO_ASPECT_OPTIONS.find((item) => item.value === aspect) || VIDEO_ASPECT_OPTIONS[0];
}

function resultVideoExtension(url) {
  const clean = String(url || '').split('?')[0];
  const match = clean.match(/\.([a-z0-9]+)$/i);
  return match?.[1] || 'mp4';
}

function loadTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY) || localStorage.getItem(LEGACY_THEME_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    // Ignore storage failures and fall back to a stable default.
  }
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

function historyScopeFromIdentity(session, profile) {
  const identity = profile?.id || profile?.email || profile?.username || session?.user?.id || session?.user?.email || session?.user?.username || 'guest';
  return String(identity).toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
}

function historyStorageKey(scope) {
  return `${HISTORY_SCOPE_PREFIX}:${scope || 'guest'}`;
}

function legacyHistoryStorageKey(scope) {
  return `${LEGACY_HISTORY_SCOPE_PREFIX}:${scope || 'guest'}`;
}

function mergeHistoryRecords(primary, secondary = []) {
  const map = new Map();
  for (const item of [...secondary, ...primary]) {
    if (!item?.id) continue;
    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
      continue;
    }
    const existingTime = Date.parse(existing.createdAt || '') || 0;
    const itemTime = Date.parse(item.createdAt || '') || 0;
    if (itemTime >= existingTime) {
      map.set(item.id, { ...existing, ...item });
    }
  }
  return [...map.values()].sort((left, right) => {
    const leftTime = Date.parse(left.createdAt || '') || 0;
    const rightTime = Date.parse(right.createdAt || '') || 0;
    return rightTime - leftTime;
  });
}

function historySessionKey(item) {
  if (item?.sessionId || item?.conversationId || item?.batchId) {
    return String(item.sessionId || item.conversationId || item.batchId);
  }
  const createdAt = Date.parse(item?.createdAt || '') || Number(String(item?.id || '').split('-')[0]) || Date.now();
  const bucket = Math.floor(createdAt / (24 * 60 * 60 * 1000));
  const mode = item?.mode || item?.kind || 'image';
  const model = item?.model || item?.providerId || '';
  const caseId = item?.case?.id || item?.caseId || '';
  return `legacy-session:${mode}:${model}:${caseId}:${bucket}`;
}

function groupHistorySessions(items = []) {
  const map = new Map();
  for (const item of items) {
    if (!item?.id) continue;
    const key = historySessionKey(item);
    const urls = historyResultUrls(item);
    const displayUrls = Array.isArray(item.displayResultUrls) && item.displayResultUrls.length ? item.displayResultUrls : urls;
    const resultItems = historyResultItems(item);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        ...item,
        id: key || item.id,
        sessionId: item.sessionId || key,
        recordIds: [item.id],
        resultUrls: urls,
        displayResultUrls: displayUrls,
        resultItems,
        sessionCount: 1
      });
      continue;
    }
    const existingTime = Date.parse(existing.createdAt || '') || 0;
    const itemTime = Date.parse(item.createdAt || '') || 0;
    const mergedResultItems = dedupeHistoryResultItems([...(existing.resultItems || []), ...resultItems]);
    map.set(key, {
      ...(itemTime >= existingTime ? { ...existing, ...item } : existing),
      id: existing.id,
      sessionId: existing.sessionId || item.sessionId || existing.id,
      recordIds: [...new Set([...(existing.recordIds || []), item.id])],
      resultUrls: [...new Set([...(existing.resultUrls || []), ...urls])],
      displayResultUrls: [...new Set([...(existing.displayResultUrls || []), ...displayUrls])],
      resultItems: mergedResultItems,
      sessionCount: existing.sessionCount + 1
    });
  }
  return [...map.values()].sort((left, right) => {
    const leftTime = Date.parse(left.createdAt || '') || 0;
    const rightTime = Date.parse(right.createdAt || '') || 0;
    return rightTime - leftTime;
  });
}

function currentSessionProject(session) {
  const queueItems = Array.isArray(session?.generationQueue)
    ? session.generationQueue.filter((item) => CURRENT_PROJECT_QUEUE_STATUSES.has(item?.status))
    : [];
  const messages = Array.isArray(session?.assistantMessages) ? session.assistantMessages : [];
  const hasConversation = Boolean(String(session?.prompt || '').trim()) || messages.length > 0;
  if (!session?.canvasNodes?.length && !queueItems.length && !hasConversation) return null;
  const nodes = session.canvasNodes || [];
  const imageNodes = nodes.filter((node) => node.kind !== 'video');
  const recordIds = [...new Set(nodes.map((node) => node?.downloadMeta?.id).filter(Boolean))];
  const firstNode = nodes[0] || {};
  const firstQueueItem = queueItems[0] || {};
  const sessionId = session.sessionId || 'current-session';
  return {
    id: sessionId,
    sessionId,
    current: true,
    titleKey: 'rail.currentSession',
    title: 'Phiên hiện tại',
    prompt: session.prompt || firstNode.prompt || firstQueueItem.prompt || '',
    createdAt: session.updatedAt || session.timing?.startedAt || Date.now(),
    model: session.model,
    resultUrls: nodes.map((node) => node.url).filter(Boolean),
    displayResultUrls: nodes.map((node) => node.url).filter(Boolean),
    resultItems: nodes.map((node, index) => ({
      id: node.id || `${sessionId}-${index}`,
      recordId: node?.downloadMeta?.id || '',
      url: node.url,
      displayUrl: node.url,
      prompt: node.prompt || '',
      generationPrompt: node.generationPrompt || node.prompt || '',
      model: node?.downloadMeta?.model || session.model || '',
      createdAt: node.createdAt || session.updatedAt || '',
      index
    })).filter((item) => item.url || item.displayUrl),
    recordIds,
    canvasCount: nodes.length,
    imageCount: imageNodes.length,
    queueCount: queueItems.length,
    messageCount: messages.length,
    mode: session.mode || 'image'
  };
}

function loadHistory(scope = 'guest') {
  try {
    const scopedKey = historyStorageKey(scope);
    const fallback = localStorage.getItem(scopedKey)
      || localStorage.getItem(legacyHistoryStorageKey(scope))
      || (scope === 'guest' ? localStorage.getItem(HISTORY_KEY) || localStorage.getItem(LEGACY_HISTORY_KEY) : null)
      || '[]';
    const parsed = JSON.parse(fallback);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function compactHistoryItem(item) {
  if (!item || typeof item !== 'object') return item;
  const resultUrls = Array.isArray(item.resultUrls)
    ? item.resultUrls.filter((url) => !String(url || '').startsWith('data:'))
    : [];
  const displayResultUrls = resultUrls.length
    ? []
    : Array.isArray(item.displayResultUrls)
      ? item.displayResultUrls.filter((url) => !String(url || '').startsWith('data:')).slice(0, 4)
      : [];
  return {
    ...item,
    displayResultUrls,
    resultUrls
  };
}

function mergeSiteData(localData, inspirationData) {
  const localCases = Array.isArray(localData?.cases) ? localData.cases : [];
  const inspirationCases = Array.isArray(inspirationData?.cases) ? inspirationData.cases : [];
  const cases = [...localCases, ...inspirationCases];
  return {
    ...(localData || {}),
    inspirationSources: inspirationData?.sources || [],
    inspirationErrors: inspirationData?.errors || [],
    totalCases: cases.length,
    categories: [...new Set([
      ...(localData?.categories || []),
      ...(inspirationData?.categories || []),
      ...cases.map((item) => item.category).filter(Boolean)
    ])].sort(),
    styles: [...new Set(cases.flatMap((item) => item.styles || []))].sort(),
    scenes: [...new Set(cases.flatMap((item) => item.scenes || []))].sort(),
    cases
  };
}

function normalizeLibraryPayload(payload) {
  const cases = Array.isArray(payload?.cases) ? payload.cases : [];
  const promptPresets = Array.isArray(payload?.promptPresets) ? payload.promptPresets : PROMPT_PRESETS;
  const videoInspirations = Array.isArray(payload?.videoInspirations) ? payload.videoInspirations : FALLBACK_VIDEO_INSPIRATIONS;
  return {
    ...EMPTY_SITE_DATA,
    ...(payload || {}),
    totalCases: Number(payload?.totalCases || cases.length),
    categories: Array.isArray(payload?.categories) ? payload.categories : [...new Set(cases.map((item) => item.category).filter(Boolean))].sort(),
    styles: Array.isArray(payload?.styles) ? payload.styles : [...new Set(cases.flatMap((item) => item.styles || []))].sort(),
    scenes: Array.isArray(payload?.scenes) ? payload.scenes : [...new Set(cases.flatMap((item) => item.scenes || []))].sort(),
    license: payload?.license || COMMUNITY_LICENSE_NOTICE,
    promptPresets,
    videoInspirations,
    cases
  };
}

function publicJsonPath(fileName) {
  const base = BASE_PATH.endsWith('/') ? BASE_PATH : `${BASE_PATH}/`;
  return `${base}${fileName}`;
}

async function fetchPublicJson(fileName, fallback = {}) {
  const candidates = [publicJsonPath(fileName), `/${fileName}`].filter((value, index, list) => value && list.indexOf(value) === index);
  for (const url of candidates) {
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) {
        throw new Error(`HTTP_${response.status}`);
      }
      return await response.json();
    } catch {
      // Try the next deployment path before falling back to an empty payload.
    }
  }
  return fallback;
}

async function loadStaticLibraryData() {
  const [localData, inspirationData] = await Promise.all([
    fetchPublicJson('cases.json', { cases: [] }),
    fetchPublicJson('inspirations.json', { cases: [] })
  ]);
  const data = normalizeLibraryPayload(mergeSiteData(localData, inspirationData));
  return {
    ...data,
    cases: data.cases.map((item) => ({ ...item, staticLibrary: true }))
  };
}

function saveHistory(items, scope = 'guest') {
  const nextItems = mergeHistoryRecords(items, []).slice(0, LOCAL_HISTORY_LIMIT).map(compactHistoryItem);
  try {
    localStorage.setItem(historyStorageKey(scope), JSON.stringify(nextItems));
    if (scope === 'guest') {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(nextItems));
    }
  } catch {
    try {
      localStorage.setItem(historyStorageKey(scope), JSON.stringify(nextItems.map((item) => ({ ...item, resultUrls: [] }))));
    } catch {
      localStorage.removeItem(historyStorageKey(scope));
    }
  }
  saveHistoryItems(scope, nextItems).catch(() => {
    // IndexedDB is an expanded local cache; localStorage remains the fallback.
  });
}

async function loadPersistedHistory(scope = 'guest') {
  try {
    const idbItems = await loadHistoryItems(scope);
    if (Array.isArray(idbItems) && idbItems.length) {
      return mergeHistoryRecords(idbItems, loadHistory(scope)).slice(0, LOCAL_HISTORY_LIMIT);
    }
  } catch {
    // Fall back to the existing localStorage cache when IndexedDB is unavailable.
  }
  return loadHistory(scope);
}

function deletePersistedHistory(recordId, scope = 'guest') {
  deleteHistoryItem(scope, recordId).catch(() => {
    // IndexedDB cleanup is best-effort; the server/localStorage paths still run.
  });
}

function clearPersistedHistory(scope = 'guest') {
  clearHistoryItems(scope).catch(() => {
    // IndexedDB cleanup is best-effort; the server/localStorage paths still run.
  });
}

function storedResultUrls(urls) {
  return urls.slice(0, 4);
}

function formatHistoryTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('vi-VN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function historyResultUrls(item) {
  return Array.isArray(item?.displayResultUrls) && item.displayResultUrls.length
    ? item.displayResultUrls
    : Array.isArray(item?.resultUrls)
      ? item.resultUrls
      : [];
}

function historyResultItems(item) {
  if (Array.isArray(item?.resultItems) && item.resultItems.length) {
    return item.resultItems.map((result, index) => ({
      id: String(result.id || `${item?.id || 'history'}-${index}`),
      recordId: String(result.recordId || item?.id || ''),
      url: result.url || result.displayUrl || '',
      displayUrl: result.displayUrl || result.url || '',
      prompt: result.prompt || result.generationPrompt || item?.prompt || item?.generationPrompt || item?.case?.promptPreview || '',
      generationPrompt: result.generationPrompt || result.prompt || item?.generationPrompt || item?.prompt || item?.case?.promptPreview || '',
      model: result.model || item?.model || '',
      providerId: result.providerId || item?.providerId || item?.provider || '',
      createdAt: result.createdAt || item?.createdAt || '',
      outputFormat: result.outputFormat || item?.outputFormat || '',
      index: Number.isFinite(result.index) ? result.index : index
    })).filter((result) => result.url || result.displayUrl);
  }

  const displayUrls = Array.isArray(item?.displayResultUrls) && item.displayResultUrls.length ? item.displayResultUrls : [];
  const resultUrls = Array.isArray(item?.resultUrls) ? item.resultUrls : [];
  const urls = displayUrls.length ? displayUrls : resultUrls;
  return urls.map((url, index) => ({
    id: `${item?.id || 'history'}-${index}`,
    recordId: item?.id || '',
    url: resultUrls[index] || url,
    displayUrl: displayUrls[index] || url,
    prompt: item?.prompt || item?.generationPrompt || item?.case?.promptPreview || '',
    generationPrompt: item?.generationPrompt || item?.prompt || item?.case?.promptPreview || '',
    model: item?.model || '',
    providerId: item?.providerId || item?.provider || '',
    createdAt: item?.createdAt || '',
    outputFormat: item?.outputFormat || '',
    index
  })).filter((result) => result.url || result.displayUrl);
}

function dedupeHistoryResultItems(items = []) {
  const map = new Map();
  for (const item of items) {
    const key = `${item.recordId || ''}:${item.url || item.displayUrl || ''}:${item.index ?? ''}`;
    if (!key.replace(/[:]/g, '')) continue;
    if (!map.has(key)) map.set(key, item);
  }
  return [...map.values()];
}

function buildCanvasNodeFromHistoryItem(item, result, index = 0) {
  const resultItem = typeof result === 'string'
    ? { url: result, displayUrl: result }
    : (result || {});
  const url = resultItem.displayUrl || resultItem.url || '';
  const isVideo = item?.mode === 'video' || item?.kind === 'video';
  const prompt = resultItem.generationPrompt || resultItem.prompt || item?.generationPrompt || item?.prompt || item?.case?.promptPreview || '';
  const downloadMeta = {
    ...downloadMetaFromHistoryItem({
      ...item,
      id: resultItem.recordId || resultItem.id || item?.id,
      taskId: resultItem.taskId || item?.taskId,
      createdAt: resultItem.createdAt || item?.createdAt,
      generationPrompt: resultItem.generationPrompt || item?.generationPrompt,
      prompt: resultItem.prompt || item?.prompt,
      providerId: resultItem.providerId || item?.providerId,
      provider: resultItem.provider || item?.provider,
      model: resultItem.model || item?.model
    }, isVideo),
    model: resultItem.model || item?.model || ''
  };
  return {
    id: `history-${item?.id || Date.now()}-${resultItem.id || index}`,
    parentId: '',
    canvasIndex: index + 1,
    kind: isVideo ? 'video' : 'image',
    url,
    sourceUrl: resultItem.url || url,
    prompt,
    generationPrompt: resultItem.generationPrompt || prompt,
    downloadMeta,
    title: isVideo ? `#${index + 1}` : `#${index + 1}`,
    x: index * (CANVAS_NODE_WIDTH + CANVAS_NODE_HORIZONTAL_GAP),
    y: index % 2 ? 48 : -36,
    width: CANVAS_NODE_WIDTH,
    height: CANVAS_NODE_HEIGHT,
    createdAt: item?.createdAt || new Date().toISOString()
  };
}

function filePreviewUrl(file) {
  return file ? URL.createObjectURL(file) : '';
}

function supportedReferenceFiles(files, limit = IMAGE_REFERENCE_LIMIT) {
  return Array.from(files || [])
    .filter((file) => SUPPORTED_IMAGE_TYPES.has(file.type))
    .slice(0, limit);
}

function createReferenceItem(file, role = 'identity') {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    role
  };
}

function createMaskState() {
  return {
    imageUrl: '',
    imageName: '',
    imageSize: { width: 0, height: 0 },
    brushSize: 48,
    hardness: 100,
    overlayAlpha: 50,
    tool: 'brush',
    zoom: 1,
    inverted: false,
    strokes: [],
    history: [],
    historyIndex: -1
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('MASK_FILE_READ_FAILED'));
    reader.readAsDataURL(file);
  });
}

function loadImageDimensions(dataUrl) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth || 0, height: image.naturalHeight || 0 });
    image.onerror = () => resolve({ width: 0, height: 0 });
    image.src = dataUrl;
  });
}

function createMaskSnapshot(base) {
  return {
    imageUrl: base.imageUrl,
    imageName: base.imageName,
    imageSize: { ...base.imageSize },
    brushSize: base.brushSize,
    hardness: base.hardness,
    overlayAlpha: base.overlayAlpha,
    tool: base.tool,
    zoom: base.zoom,
    inverted: Boolean(base.inverted),
    strokes: Array.isArray(base.strokes) ? base.strokes.map((stroke) => ({
      tool: stroke.tool,
      size: stroke.size,
      hardness: stroke.hardness,
      points: stroke.points.map((point) => ({ x: point.x, y: point.y }))
    })) : [],
    currentStroke: base.currentStroke ? {
      tool: base.currentStroke.tool,
      size: base.currentStroke.size,
      hardness: base.currentStroke.hardness,
      points: base.currentStroke.points.map((point) => ({ x: point.x, y: point.y }))
    } : null
  };
}

function restoreMaskSnapshot(snapshot) {
  const next = createMaskState();
  if (!snapshot) return next;
  next.imageUrl = snapshot.imageUrl || '';
  next.imageName = snapshot.imageName || '';
  next.imageSize = snapshot.imageSize ? { ...snapshot.imageSize } : { width: 0, height: 0 };
  next.brushSize = Number(snapshot.brushSize) || 48;
  next.hardness = Number(snapshot.hardness) || 100;
  next.overlayAlpha = Number(snapshot.overlayAlpha) || 50;
  next.tool = snapshot.tool || 'brush';
  next.zoom = Number(snapshot.zoom) || 1;
  next.inverted = Boolean(snapshot.inverted);
  next.strokes = Array.isArray(snapshot.strokes) ? snapshot.strokes.map((stroke) => ({
    tool: stroke.tool || 'brush',
    size: Number(stroke.size) || 48,
    hardness: Number(stroke.hardness) || 100,
    points: Array.isArray(stroke.points) ? stroke.points.map((point) => ({ x: Number(point.x) || 0, y: Number(point.y) || 0 })) : []
  })) : [];
  next.currentStroke = snapshot.currentStroke ? {
    tool: snapshot.currentStroke.tool || 'brush',
    size: Number(snapshot.currentStroke.size) || 48,
    hardness: Number(snapshot.currentStroke.hardness) || 100,
    points: Array.isArray(snapshot.currentStroke.points) ? snapshot.currentStroke.points.map((point) => ({ x: Number(point.x) || 0, y: Number(point.y) || 0 })) : []
  } : null;
  next.history = Array.isArray(snapshot.history) ? snapshot.history.map((item) => restoreMaskSnapshot(item)) : [];
  next.historyIndex = Number.isFinite(Number(snapshot.historyIndex)) ? Number(snapshot.historyIndex) : -1;
  return next;
}

function maskSnapshotToImageData(snapshot) {
  const width = Number(snapshot?.imageSize?.width || 0);
  const height = Number(snapshot?.imageSize?.height || 0);
  if (!width || !height) return '';
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return '';
  drawMaskSnapshot(context, snapshot, { exportMask: true });
  return canvas.toDataURL('image/png');
}

function drawMaskSnapshot(context, snapshot, { exportMask = false } = {}) {
  const width = Number(snapshot?.imageSize?.width || 0);
  const height = Number(snapshot?.imageSize?.height || 0);
  if (!width || !height) return;
  context.clearRect(0, 0, width, height);
  if (exportMask) {
    context.fillStyle = snapshot?.inverted ? 'rgba(255, 255, 255, 0)' : 'rgba(255, 255, 255, 1)';
    context.fillRect(0, 0, width, height);
  }
  for (const stroke of [...(snapshot?.strokes || []), snapshot?.currentStroke].filter(Boolean)) {
    const points = Array.isArray(stroke.points) ? stroke.points : [];
    if (!points.length) continue;
    const size = Number(stroke.size) || 48;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = size;
    if (exportMask) {
      const wantsTransparent = (stroke.tool !== 'eraser') !== Boolean(snapshot?.inverted);
      context.globalCompositeOperation = wantsTransparent ? 'destination-out' : 'source-over';
      context.strokeStyle = wantsTransparent ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 1)';
    } else {
      const showPaint = (stroke.tool !== 'eraser') !== Boolean(snapshot?.inverted);
      context.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
      context.strokeStyle = showPaint ? MASK_FILL_COLOR : 'rgba(255, 255, 255, 0.55)';
    }
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    if (points.length === 1) {
      context.lineTo(points[0].x + 0.1, points[0].y + 0.1);
    } else {
      for (let i = 1; i < points.length; i += 1) {
        context.lineTo(points[i].x, points[i].y);
      }
    }
    context.stroke();
  }
  context.globalCompositeOperation = 'source-over';
}

function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason || new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = window.setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      window.clearTimeout(timer);
      reject(signal.reason || new DOMException('Aborted', 'AbortError'));
    }, { once: true });
  });
}

function dataUrlToFile(dataUrl, filename = 'mask.png') {
  const [prefix, base64 = ''] = String(dataUrl || '').split(',');
  const mime = prefix.match(/data:(.*?);/)?.[1] || 'image/png';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new File([bytes], filename, { type: mime });
}

function imageMimeExtension(mime) {
  const value = String(mime || '').toLowerCase();
  if (value.includes('jpeg') || value.includes('jpg')) return 'jpg';
  if (value.includes('webp')) return 'webp';
  return 'png';
}

async function imageUrlToFile(url, filename = 'canvas-reference.png') {
  const source = String(url || '');
  if (!source) throw new Error('CANVAS_IMAGE_EMPTY');
  if (source.startsWith('data:')) return dataUrlToFile(source, filename);
  const response = await fetch(assetPath(source));
  if (!response.ok) throw new Error(`CANVAS_IMAGE_HTTP_${response.status}`);
  const blob = await response.blob();
  const type = blob.type || 'image/png';
  if (!SUPPORTED_IMAGE_TYPES.has(type)) throw new Error('CANVAS_IMAGE_UNSUPPORTED');
  const cleanName = filename.replace(/\.[a-z0-9]+$/i, '');
  return new File([blob], `${cleanName}.${imageMimeExtension(type)}`, { type });
}

function referenceRoleLabel(value) {
  return REFERENCE_ROLES.find((item) => item.value === value)?.label || REFERENCE_ROLES[0].label;
}

function formatDuration(ms) {
  if (!Number.isFinite(Number(ms)) || Number(ms) < 0) return '--';
  const value = Number(ms);
  if (value < 1000) return `${Math.round(value)}ms`;
  if (value < 60000) return `${(value / 1000).toFixed(value < 10000 ? 1 : 0)}s`;
  const minutes = Math.floor(value / 60000);
  const seconds = Math.round((value % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

function resolveResultUrl(url) {
  if (!url) return '';
  if (/^(https?:|data:|blob:)/.test(url)) return url;
  return url.startsWith('/') ? url : `/${url}`;
}

function displayResultUrl(url) {
  return assetPath(resolveResultUrl(url));
}

function collectStateBlobUrls({ results = [], videoResults = [], canvasNodes = [], previewImage = null, previewVideo = null } = {}) {
  const urls = new Set();
  const collect = (value) => {
    const url = String(value || '');
    if (url.startsWith('blob:')) urls.add(url);
  };
  results.forEach(collect);
  videoResults.forEach(collect);
  canvasNodes.forEach((node) => {
    collect(node?.url);
    collect(node?.fallbackUrl);
  });
  collect(previewImage?.url);
  collect(typeof previewVideo === 'string' ? previewVideo : previewVideo?.url);
  return urls;
}

function revokeBlobUrls(urls) {
  for (const url of urls || []) {
    if (String(url || '').startsWith('blob:')) URL.revokeObjectURL(url);
  }
}

function isProtectedStudioAsset(url) {
  const value = String(url || '');
  return value.startsWith('/studio-api/history/')
    || value.startsWith('/studio-api/generation-jobs/')
    || value.startsWith('/studio-api/library-assets/');
}

function safeImageCandidate(url) {
  const value = String(url || '').trim();
  if (!value) return '';
  if (isProtectedStudioAsset(value)) return value;
  if (/^(https?:|data:image\/|blob:)/i.test(value)) return value;
  if (/\.(png|jpe?g|webp|gif|avif|svg)(?:[?#].*)?$/i.test(value)) return value;
  return '';
}

function providerLabel(settings, apiKey) {
  if (settings.apiKeySource === 'server') return 'Server key';
  if (settings.apiKeySource === 'manual') return settings.manualGatewayBaseUrl ? 'API tùy chỉnh' : 'Kết nối tùy chỉnh';
  return apiKey?.name || 'Gateway Account';
}

function maskApiKey(value) {
  const key = String(value || '').trim();
  if (!key) return '';
  if (/[*•]/.test(key) || key.includes('...')) return key;
  if (key.length <= 8) return `${key.slice(0, 2)}...${key.slice(-2)}`;
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}

function apiKeyDisplay(apiKey) {
  const display = apiKey?.displayKey || apiKey?.key || apiKey?.plain || apiKey?.mask;
  return display ? maskApiKey(display) : apiKey?.name || 'Chọn khóa API';
}

function workspaceConnectionLabel(activeWorkspace, settings) {
  if (activeWorkspace === 'video') return 'API video';
  if (activeWorkspace === 'inspiration') return 'Thư viện ý tưởng';
  if (activeWorkspace === 'history') return 'Lịch sử ảnh';
  return IMAGE_GENERATION_ROUTE_LABEL;
}

function apiKeyMeta(apiKey) {
  const scope = apiKey?.scope || 'Quyền mặc định';
  const status = apiKey?.status === 1 || String(apiKey?.status || '').toLowerCase() === 'active' ? 'Có thể sử dụng' : apiKey?.status || 'Có thể sử dụng';
  return `${status} · ${scope}`;
}

function categoryLabel(value) {
  if (value === 'All') return 'Tất cả danh mục';
  return CATEGORY_LABELS[value] || value || 'Chưa phân loại';
}


function categoryCover(value, variant = 'thumb') {
  const slug = CATEGORY_COVERS[value] || CATEGORY_COVERS['Other Use Cases'];
  return variant === 'protected'
    ? `/studio-api/library-assets/category-covers/${slug}.jpg`
    : `/images/thumbs/category-covers/${slug}.webp`;
}

function templateThumbnail(item) {
  if (!item) return '';
  if (item.thumbnail) return item.thumbnail;
  const image = item.image || item.image_url || '';
  if (/^\/studio-api\/library-assets\//i.test(image)) return image;
  if (/^\/images\/[^/]+\.(jpe?g|png)$/i.test(image)) {
    return image.replace(/^\/images\/(case[^/.]+)\.(jpe?g|png)$/i, '/images/thumbs/$1.webp');
  }
  if (/^https?:/i.test(image)) return '';
  return image;
}

function imageFallback(item) {
  return item?.image || item?.image_url || '';
}

function templatePreviewImage(item) {
  return imageFallback(item) || templateThumbnail(item);
}

function handleImageFallback(event, fallback) {
  const image = event.currentTarget;
  const nextSrc = fallback ? assetPath(fallback) : '';
  if (nextSrc && image.src !== nextSrc && image.dataset.fallbackUsed !== 'true') {
    image.dataset.fallbackUsed = 'true';
    image.src = nextSrc;
    return;
  }
  image.hidden = true;
  image.closest('.categoryThumbs, .caseMedia')?.classList.add('imageMissing');
}

function libraryFallbackImage(item) {
  return templateThumbnail(item) || imageFallback(item);
}

function buildCategoryGroups(cases) {
  const groups = new Map();
  const protectedAssets = (cases || []).some((item) => String(item?.thumbnail || item?.image || item?.image_url || '').startsWith('/studio-api/'));
  for (const item of orderTemplates(cases || [])) {
    const key = item.category || 'Other Use Cases';
    if (!groups.has(key)) {
      groups.set(key, {
        id: key,
        label: categoryLabel(key),
        count: 0,
        cover: categoryCover(key, protectedAssets ? 'protected' : 'thumb'),
        coverFallback: categoryCover(key, protectedAssets ? 'protected' : 'thumb'),
        featured: null,
        samples: []
      });
    }
    const group = groups.get(key);
    group.count += 1;
    if (!group.featured && (item.thumbnail || item.image || item.image_url)) group.featured = item;
    if (group.samples.length < 3) group.samples.push(item);
  }
  return [...groups.values()].sort((left, right) => right.count - left.count || left.label.localeCompare(right.label, 'vi-VN'));
}

function parseOptimizedPrompt(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;
  const jsonText = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  try {
    const parsed = JSON.parse(jsonText);
    return {
      subject: parsed.subject || '',
      scene: parsed.scene || '',
      composition: parsed.composition || '',
      style: parsed.style || '',
      lighting: parsed.lighting || '',
      details: parsed.details || '',
      textRules: parsed.textRules || '',
      constraints: parsed.constraints || '',
      finalPrompt: parsed.finalPrompt || raw,
      raw
    };
  } catch {
    return { finalPrompt: raw, raw };
  }
}

function parseAssistantReply(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;
  const jsonText = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  try {
    const parsed = JSON.parse(jsonText);
    return {
      reply: parsed.reply || parsed.message || raw,
      finalPrompt: parsed.finalPrompt || parsed.prompt || '',
      raw
    };
  } catch {
    return {
      reply: raw,
      finalPrompt: '',
      raw
    };
  }
}

function formatUsageValue(value) {
  if (value === undefined || value === null || value === '') return 'Máy chủ không trả dữ liệu';
  if (typeof value === 'number' && Number.isFinite(value)) return value.toLocaleString('vi-VN');
  return String(value);
}

function pointValue(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '';
  return (number / 100).toLocaleString('vi-VN', { maximumFractionDigits: 2 });
}

function resultExtension(url, fallback = 'png') {
  const dataMatch = String(url || '').match(/^data:image\/([^;]+)/i);
  if (dataMatch?.[1]) return dataMatch[1] === 'jpeg' ? 'jpg' : dataMatch[1];
  return fallback === 'jpeg' ? 'jpg' : fallback;
}

function modelBillingLabel(model, count = 1) {
  const raw = model?.raw || model || {};
  const unitPoints = raw.unit_points ?? raw.unitPoints;
  const inputPoints = raw.input_unit_points ?? raw.inputUnitPoints;
  const outputPoints = raw.output_unit_points ?? raw.outputUnitPoints;
  if (unitPoints !== undefined && unitPoints !== null) {
    const unit = pointValue(unitPoints);
    const total = pointValue(Number(unitPoints) * normalizeCount(count));
    return Number(unitPoints) > 0 ? `${unit} điểm/ảnh, ước tính ${total} điểm` : 'Máy chủ tính phí theo mô hình';
  }
  if (inputPoints !== undefined || outputPoints !== undefined) {
    return `Đầu vào ${pointValue(inputPoints || 0)} điểm/1K, đầu ra ${pointValue(outputPoints || 0)} điểm/1K`;
  }
  const value = raw.price || raw.pricing || raw.unit_price || raw.input_price || raw.output_price || raw.quota || raw.cost || raw.billing || raw.billing_mode;
  if (!value) return 'Theo mức trừ thực tế trên máy chủ';
  if (typeof value === 'object') return Object.entries(value).map(([key, item]) => `${key}: ${item}`).join(' / ');
  return String(value);
}

function modelBillingUnitLabel(model, unitLabel = 'ảnh', count = 1) {
  const label = modelBillingLabel(model, count);
  return unitLabel === 'ảnh' ? label : label.replaceAll('/ảnh', `/${unitLabel}`);
}

function payloadUsageSummary(payload) {
  const usage = payload?.usage || payload?.response?.usage || payload?.billing || payload?.cost || payload?.metadata?.usage;
  if (!usage) return '';
  if (typeof usage === 'string') return usage;
  if (typeof usage === 'number') return `Lần này đã dùng ${pointValue(usage)} điểm`;
  const parts = [];
  const pointsTotal = usage.total_points ?? usage.points ?? usage.totalPoint;
  const costPoints = usage.total_cost ?? usage.cost_points ?? usage.costPoints;
  const total = pointsTotal ?? (costPoints !== undefined ? pointValue(costPoints) : undefined) ?? usage.total ?? usage.total_tokens ?? usage.amount ?? usage.cost ?? usage.credits;
  const input = usage.input_tokens || usage.prompt_tokens || usage.input;
  const output = usage.output_tokens || usage.completion_tokens || usage.output;
  if (total !== undefined) parts.push(`Tổng cộng ${formatUsageValue(total)}${(pointsTotal !== undefined || costPoints !== undefined) ? ' điểm' : ''}`);
  if (input !== undefined) parts.push(`Đầu vào ${formatUsageValue(input)}`);
  if (output !== undefined) parts.push(`Đầu ra ${formatUsageValue(output)}`);
  return parts.join('，');
}

function riskLabel(value) {
  const labels = {
    'brand-risk': 'Thương hiệu',
    celebrity: 'Người nổi tiếng',
    medical: 'Y tế',
    political: 'Chính trị',
    'adult-risk': 'Người trưởng thành',
    'copyright-style': 'Phong cách có bản quyền',
    'license-review': 'Chờ xác minh giấy phép'
  };
  return labels[value] || value;
}

function modelLooksLikeImage(item) {
  const raw = item?.raw || {};
  const source = [
    item?.id,
    item?.label,
    item?.type,
    item?.category,
    item?.mode,
    item?.modality,
    item?.endpoint,
    raw.id,
    raw.model,
    raw.name,
    raw.type,
    raw.category,
    raw.mode,
    raw.modality,
    raw.endpoint,
    raw.group,
    raw.platform,
    ...(Array.isArray(item?.capabilities) ? item.capabilities : []),
    ...(Array.isArray(raw.capabilities) ? raw.capabilities : [])
  ].filter(Boolean).join(' ');
  return IMAGE_MODEL_PATTERN.test(source) || String(source).toLowerCase().includes('images/edits');
}


function connectionReady(settings, apiKey, isAuthenticated) {
  if (settings.apiKeySource === 'server') return Boolean(isAuthenticated);
  if (settings.apiKeySource === 'manual') {
    return Boolean(settings.manualApiKey?.trim());
  }
  return Boolean(isAuthenticated && apiKey?.key);
}

function usesGatewayAccount(settings) {
  return settings?.apiKeySource === 'gateway';
}

function resolveProviderRequest(settings, apiKey) {
  if (settings.apiKeySource === 'server') {
    // The studio login token goes to the same-origin proxy, which swaps in the server-held key.
    return {
      apiKey: loadSession()?.accessToken || '',
      gatewayBaseUrl: `${window.location.origin}/v1`,
      route: settings.route || 'auto',
      responsesModel: settings.responsesModel,
      partialImages: settings.partialImages
    };
  }
  if (settings.apiKeySource === 'manual') {
    return {
      apiKey: settings.manualApiKey.trim(),
      gatewayBaseUrl: settings.manualGatewayBaseUrl.trim() || getConfiguredBaseUrls().gatewayBaseUrl,
      route: settings.route || 'auto',
      responsesModel: settings.responsesModel,
      partialImages: settings.partialImages
    };
  }
  return {
    apiKey: apiKey?.key || '',
    route: settings.route || 'auto',
    responsesModel: settings.responsesModel,
    partialImages: settings.partialImages
  };
}

function modelMatchesVideo(item) {
  const raw = item?.raw || {};
  const values = [
    item?.type,
    item?.category,
    item?.mode,
    item?.modality,
    item?.endpoint,
    raw.type,
    raw.category,
    raw.mode,
    raw.modality,
    raw.endpoint
  ].map((value) => String(value || '').toLowerCase());
  const capabilities = [
    item?.capabilities,
    item?.capability,
    raw.capabilities,
    raw.capability,
    raw.features,
    raw.supported_generation_types,
    raw.supportedGenerationTypes
  ].flatMap((value) => Array.isArray(value) ? value : value ? [value] : []).map((value) => String(value || '').toLowerCase());
  return [...values, ...capabilities].some((value) => value === 'video' || value === 'videos' || value.includes('video_generation') || value.includes('video-generation'));
}

function workspaceLabel(value) {
  return WORKSPACES.find((item) => item.value === value)?.label || WORKSPACES[0].label;
}

function Topbar({
  profile,
  apiKey,
  providerSettings,
  isAuthenticated,
  activeWorkspace,
  onWorkspaceChange,
  t,
  theme,
  onLogin,
  onLogout,
  onOpenSettings,
  onThemeToggle
}) {
  return (
    <header className="studioTopbar">
      <div className="topbarBrandGroup">
        <a className="brandLockup" href={assetPath(STUDIO_BACK_URL)} aria-label={t('app.back', 'Về thư viện')} title={t('app.back', 'Về thư viện')}>
          <ArrowLeft className="brandBackIcon" size={18} />
          <WandSparkles size={21} />
          <span>{t('app.brand', 'Không gian sáng tạo')}</span>
        </a>
        <nav className="workspaceNav" aria-label={t('topbar.navAria', 'Khu vực sáng tạo')}>
          {WORKSPACES.map((item) => (
            <button
              type="button"
              className={activeWorkspace === item.value ? 'active' : ''}
              data-workspace={item.value}
              key={item.value}
              onClick={() => onWorkspaceChange(item.value)}
            >
              {t(`workspace.${item.value}`, item.label)}
            </button>
          ))}
        </nav>
      </div>
      <div className="topbarActions">
        <button type="button" className="connectionPill" onClick={onOpenSettings}>
          <Server size={15} />
          <span>{providerLabel(providerSettings, apiKey)}</span>
          <strong>{workspaceConnectionLabel(activeWorkspace, providerSettings)}</strong>
        </button>
        {isAuthenticated ? (
          <>
            <button type="button" className="iconButton themeButton" onClick={onThemeToggle} aria-label={theme === 'dark' ? t('topbar.light', 'Chuyển sang giao diện sáng') : t('topbar.dark', 'Chuyển sang giao diện tối')}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button type="button" className="iconButton" onClick={onLogout} aria-label={t('topbar.logout', 'Đăng xuất')}>
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <>
            <button type="button" className="iconButton themeButton" onClick={onThemeToggle} aria-label={theme === 'dark' ? t('topbar.light', 'Chuyển sang giao diện sáng') : t('topbar.dark', 'Chuyển sang giao diện tối')}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button type="button" className="topbarLogin" onClick={onLogin}>
              <KeyRound size={16} />
              {t('topbar.login', 'Đăng nhập')}
            </button>
          </>
        )}
      </div>
    </header>
  );
}

function CategoryCard({ group, selected, onSelect, t }) {
  const sampleFallback = (group.samples || []).map(libraryFallbackImage).find(Boolean) || libraryFallbackImage(group.featured);
  const fallback = sampleFallback || group.coverFallback || '';
  return (
    <button className={`categoryTile ${selected ? 'selected' : ''}`} type="button" onClick={() => onSelect(group.id)}>
      <div className="categoryThumbs">
        {(group.cover || fallback) ? (
          <ProtectedStudioImage
            src={group.cover || fallback}
            fallbackSrc={fallback}
            alt={group.label}
          />
        ) : null}
        <ImageIcon size={22} />
      </div>
      <div>
        <strong>{group.label}</strong>
        <span>{t('gallery.templateCount', '{count} mẫu', { count: group.count })}</span>
        <small>{group.samples.map((item) => item.title).slice(0, 2).join(' / ')}</small>
      </div>
    </button>
  );
}

function CaseCard({ item, selected, onSelect, favorite, onToggleFavorite, onAppend, t = (key, fallback) => fallback || key }) {
  const image = templateThumbnail(item);
  const fallback = imageFallback(item);
  const risks = Array.isArray(item.riskTags) ? item.riskTags.slice(0, 3) : [];
  return (
    <div className={`caseTile ${selected ? 'selected' : ''}`}>
      <button className="caseTileMain" type="button" onClick={() => onSelect(item)}>
        <div className="caseMedia">
          {(image || fallback) ? (
            <ProtectedStudioImage
              src={image || fallback}
              fallbackSrc={image && fallback !== image ? fallback : ''}
              alt={item.imageAlt || item.title}
            />
          ) : null}
          <ImageIcon size={18} />
        </div>
        <span>{typeof item.id === 'number' ? `#${item.id}` : t('gallery.external', 'Bên ngoài')}</span>
        <strong>{item.title}</strong>
        {item.sourceName ? <em>{item.sourceName}</em> : null}
        {risks.length ? (
          <small>{risks.map(riskLabel).join(' / ')}</small>
        ) : null}
      </button>
      <div className="caseTileActions">
        {onAppend ? (
          <button
            type="button"
            className="appendMiniButton"
            onClick={(event) => {
              event.stopPropagation();
              onAppend(item);
            }}
            aria-label={t('gallery.appendPrompt', 'Thêm prompt mẫu')}
            title={t('gallery.appendToPrompt', 'Thêm vào prompt hiện tại')}
          >
            <CirclePlus size={13} />
          </button>
        ) : null}
        <button
          type="button"
          className={`favoriteMiniButton ${favorite ? 'active' : ''}`}
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite(item);
          }}
          aria-label={favorite ? t('gallery.unfavoriteTemplate', 'Bỏ lưu mẫu') : t('gallery.favoriteTemplate', 'Lưu mẫu yêu thích')}
          title={favorite ? t('gallery.unfavorite', 'Bỏ yêu thích') : t('gallery.favoriteTemplate', 'Lưu mẫu yêu thích')}
        >
          <Star size={13} />
        </button>
      </div>
    </div>
  );
}

function VideoInspirationCard({ item, selected, onSelect }) {
  const meta = [
    item.intent,
    VIDEO_ASPECT_OPTIONS.find((option) => option.value === item.videoAspect)?.label,
    item.videoDuration ? `${item.videoDuration}s` : '',
    VIDEO_MOTIONS.find((option) => option.value === item.videoMotion)?.label
  ].filter(Boolean);
  return (
    <button className={`videoInspirationTile ${selected ? 'selected' : ''}`} type="button" onClick={() => onSelect(item)}>
      <div className="videoInspirationIcon">
        <Video size={18} />
      </div>
      <div>
        <span>{meta.join(' · ')}</span>
        <strong>{item.title}</strong>
        <p>{item.summary}</p>
      </div>
    </button>
  );
}

function HistoryCard({ item, selected, onSelect, onDelete, t = (key, fallback) => fallback || key }) {
  const resultItems = historyResultItems(item);
  const resultUrl = resultItems[0]?.displayUrl || resultItems[0]?.url || item.displayResultUrls?.[0] || item.resultUrls?.[0] || '';
  const thumbnail = safeImageCandidate(resultUrl || item.case?.image || '');
  const resultCount = resultItems.length || (item.displayResultUrls?.length || item.resultUrls?.length || 0);
  const usage = item.usageSummary || item.costSummary || '';
  const isVideo = item.mode === 'video' || item.kind === 'video';
  const extension = isVideo ? resultVideoExtension(resultUrl) : resultExtension(resultUrl, item.outputFormat || 'png');
  const downloadName = buildStudioDownloadFilename({
    ...downloadMetaFromHistoryItem(item, isVideo),
    index: 0,
    extension
  });
  const meta = isVideo
    ? [item.model, item.aspectRatio || item.aspect, item.duration ? `${item.duration}s` : '', item.fps ? `${item.fps}fps` : '', usage].filter(Boolean)
    : [item.model, item.resolutionTier ? (RESOLUTION_TIER_LABELS[item.resolutionTier] || item.resolutionTier) : item.size, item.quality ? QUALITY_LABELS[item.quality] || item.quality : '', item.outputFormat ? OUTPUT_FORMAT_LABELS[item.outputFormat] || item.outputFormat : '', usage].filter(Boolean);
  return (
    <div className={`historyTile ${selected ? 'selected' : ''}`}>
      <button className="historyOpen" type="button" onClick={() => onSelect(item)}>
        <div className={`historyThumb ${isVideo ? 'videoThumb' : ''}`}>
          {thumbnail && !isVideo ? (
            <ProtectedHistoryThumb
              src={thumbnail}
              alt={item.case?.title || 'History'}
              fallback={<span className="historyThumbFallback"><History size={22} /></span>}
            />
          ) : isVideo ? <Video size={22} /> : <History size={22} />}
          <small>{isVideo ? t('rail.video', 'Video') : t('rail.imageCount', '{count} ảnh', { count: Math.max(1, resultCount) })}</small>
        </div>
        <div>
          <span>{formatHistoryTime(item.createdAt)} · {t('rail.session', 'Phiên làm việc')} · {isVideo ? t('rail.video', 'Video') : t('rail.imageCount', '{count} ảnh', { count: Math.max(1, resultCount) })}</span>
          <strong>{isVideo ? t('rail.videoGeneration', 'Tạo video') : item.case?.title || compact(item.prompt, 24)}</strong>
          <p>{compact(item.prompt, 74)}</p>
          <em>{meta.join(' · ')}</em>
        </div>
      </button>
      <div className="historyActions">
        {resultUrl ? (
          <a href={displayResultUrl(resultUrl)} download={downloadName} onClick={(event) => event.stopPropagation()}>
            <Download size={14} /> {t('canvas.download', 'Tải xuống')}
          </a>
        ) : null}
        <button type="button" onClick={() => onDelete(item)}>
          <Trash2 size={14} /> {t('canvas.delete', 'Xóa')}
        </button>
      </div>
    </div>
  );
}

function GalleryWorkspacePanel({
  type,
  cases,
  categoryGroups,
  selected,
  onSelect,
  query,
  setQuery,
  category,
  setCategory,
  totalCaseCount,
  loading,
  videoInspirations,
  historyItems,
  historyStatus,
  historyHasMore,
  historyLoadingMore,
  selectedHistoryId,
  onSelectHistory,
  onDeleteHistory,
  onClearHistory,
  onLoadMoreHistory,
  favoriteTemplates,
  showFavoritesOnly,
  onToggleFavoritesOnly,
  onToggleTemplateFavorite,
  onAppendTemplate,
  licenseNotice,
  onOpenWorkspace,
  t = (key, fallback) => fallback || key
}) {
  const [visibleLimit, setVisibleLimit] = useState(INITIAL_TEMPLATE_LIMIT);
  const [activeKind, setActiveKind] = useState('image');
  const isHistory = type === 'history';
  const isVideo = activeKind === 'video';
  const browsingCategory = !isVideo && (category !== 'All' || query.trim());
  const visibleCases = cases.slice(0, visibleLimit);
  const videoNeedle = query.trim().toLowerCase();
  const visibleVideoInspirations = (videoInspirations || []).filter((item) => {
    if (!videoNeedle) return true;
    return `${item.title} ${item.intent} ${item.summary}`.toLowerCase().includes(videoNeedle);
  });
  const visibleVideoItems = visibleVideoInspirations.slice(0, visibleLimit);
  const videoLocalHasMore = visibleLimit < visibleVideoInspirations.length;
  const historySessionItems = useMemo(() => groupHistorySessions(historyItems || []), [historyItems]);
  const visibleHistoryItems = historySessionItems.slice(0, visibleLimit);
  const historyLocalHasMore = visibleLimit < historySessionItems.length;
  const selectedHistoryItem = useMemo(() => {
    if (!isHistory || !selectedHistoryId) return null;
    return historySessionItems.find((item) => (
      selectedHistoryId === item.id
      || selectedHistoryId === item.sessionId
      || item.recordIds?.includes?.(selectedHistoryId)
    )) || null;
  }, [historySessionItems, isHistory, selectedHistoryId]);

  useEffect(() => {
    setVisibleLimit(INITIAL_TEMPLATE_LIMIT);
  }, [category, query, activeKind, type]);

  const selectLibraryItem = (item) => {
    onSelect(item);
    onOpenWorkspace?.(item?.kind === 'video-inspiration' ? 'video' : 'image');
  };

  if (isHistory) {
    return (
      <section className="galleryWorkspacePanel historyGalleryWorkspace" aria-label={t('workspace.history', 'Lịch sử ảnh')}>
        <div className="galleryWorkspaceHead">
          <div>
            <span>{t('workspace.history', 'Lịch sử ảnh')}</span>
            <h2>{t('gallery.historyTitle', 'Lưu mọi lần tạo theo phiên làm việc')}</h2>
            <p>{t('gallery.historyHint', 'Chọn một mục để đưa ảnh trở lại canvas và tiếp tục sáng tạo.')}</p>
          </div>
          <div className="galleryWorkspaceActions">
            {historyItems.length ? (
              <button type="button" className="secondaryButton" onClick={onClearHistory}>
                <Trash2 size={15} />
                {t('gallery.clear', 'Xóa')}
              </button>
            ) : null}
            <button type="button" className="primaryAction" onClick={() => onOpenWorkspace?.('image')}>
              <Sparkles size={16} />
              {t('gallery.backToCreate', 'Quay lại sáng tạo')}
            </button>
          </div>
        </div>
        {historyItems.length ? (
          <div className="historyGalleryGrid">
            {visibleHistoryItems.map((item) => (
              <HistoryCard
                item={item}
                selected={selectedHistoryId === item.id || selectedHistoryId === item.sessionId}
                onSelect={onSelectHistory}
                onDelete={onDeleteHistory}
                t={t}
                key={item.id}
              />
            ))}
            {historyLocalHasMore || historyHasMore ? (
              <button
                type="button"
                className="loadMoreButton galleryLoadMore"
                onClick={() => {
                  if (historyLocalHasMore) {
                    setVisibleLimit((value) => value + TEMPLATE_PAGE_SIZE);
                    return;
                  }
                  onLoadMoreHistory?.();
                }}
                disabled={!historyLocalHasMore && historyLoadingMore}
              >
                {historyLoadingMore ? t('gallery.loading', 'Đang tải') : t('gallery.loadMoreHistory', 'Tải thêm lịch sử')}
              </button>
            ) : null}
          </div>
        ) : (
          <div className="workspaceEmptyPanel">
            <History size={34} />
            <h2>{historyStatus === 'loading' ? t('gallery.loadingHistory', 'Đang tải lịch sử ảnh') : t('gallery.noHistory', 'Chưa có ảnh trong lịch sử')}</h2>
            <p>{t('gallery.noHistoryHint', 'Ảnh đã tạo sẽ tự xuất hiện trong phiên hiện tại và lịch sử.')}</p>
          </div>
        )}
        <HistoryDetailPanel item={selectedHistoryItem} onOpenWorkspace={onOpenWorkspace} t={t} />
      </section>
    );
  }

  return (
    <section className="galleryWorkspacePanel inspirationWorkspace" aria-label={t('workspace.inspiration', 'Thư viện ý tưởng')}>
      <div className="galleryWorkspaceHead">
        <div>
          <span>{t('workspace.inspiration', 'Thư viện ý tưởng')}</span>
          <h2>{t('gallery.inspirationTitle', 'Chọn danh mục để đưa prompt vào phiên sáng tạo')}</h2>
          <p>{t('gallery.inspirationHint', 'Ý tưởng sáng tạo ở trên, gợi ý ở dưới; chọn mẫu để chỉnh sửa trong khung hội thoại.')}</p>
        </div>
        <div className="galleryWorkspaceActions">
          <div className="galleryKindSwitch" role="group" aria-label={t('gallery.inspirationType', 'Loại ý tưởng')}>
            <button type="button" className={!isVideo ? 'active' : ''} onClick={() => setActiveKind('image')}>
              <ImageIcon size={15} />
              {t('workspace.image', 'Tạo ảnh')}
            </button>
            <button type="button" className={isVideo ? 'active' : ''} onClick={() => setActiveKind('video')}>
              <Video size={15} />
              {t('workspace.video', 'Tạo video')}
            </button>
          </div>
          <button type="button" className="primaryAction" onClick={() => onOpenWorkspace?.(isVideo ? 'video' : 'image')}>
            <MessageSquareText size={16} />
            {t('gallery.openConversation', 'Mở hội thoại')}
          </button>
        </div>
      </div>
      <div className="galleryWorkspaceToolbar">
        <label className="gallerySearch">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={isVideo ? t('gallery.searchVideo', 'Tìm ý tưởng video') : t('gallery.searchImage', 'Tìm mẫu ảnh')} />
        </label>
        {!isVideo ? (
          <>
            <button
              type="button"
              className={`galleryFilterButton ${showFavoritesOnly ? 'active' : ''}`}
              onClick={onToggleFavoritesOnly}
            >
              <Star size={15} />
              {showFavoritesOnly ? t('gallery.favorited', 'Đã yêu thích') : t('gallery.favoriteCount', '{count} mục yêu thích', { count: favoriteTemplates.size })}
            </button>
            {browsingCategory ? (
              <button type="button" className="galleryFilterButton" onClick={() => { setCategory('All'); setQuery(''); }}>
                {t('gallery.backToCategories', 'Quay lại danh mục')}
              </button>
            ) : null}
          </>
        ) : null}
      </div>
      <div className="inspirationCanvasGrid">
        {loading ? (
          <div className="workspaceEmptyPanel">
            <ImageIcon size={34} />
            <h2>{t('gallery.loadingInspiration', 'Đang tải ý tưởng')}</h2>
            <p>{t('gallery.loadingInspirationHint', 'Tư liệu và prompt đã tải xong sẽ hiện ở đây.')}</p>
          </div>
        ) : isVideo ? (
          visibleVideoInspirations.length ? (
            <>
              {visibleVideoItems.map((item) => (
            <VideoInspirationCard item={item} selected={selected?.id === item.id} onSelect={selectLibraryItem} key={item.id} />
              ))}
              {videoLocalHasMore ? (
                <button type="button" className="loadMoreButton galleryLoadMore" onClick={() => setVisibleLimit((value) => value + TEMPLATE_PAGE_SIZE)}>
                  {t('gallery.loadMoreCount', 'Tải thêm {visible}/{total}', { visible: Math.min(visibleLimit, visibleVideoInspirations.length), total: visibleVideoInspirations.length })}
                </button>
              ) : null}
            </>
          ) : (
            <div className="workspaceEmptyPanel">
              <Video size={34} />
              <h2>{t('gallery.noVideoMatch', 'Không tìm thấy ý tưởng video phù hợp')}</h2>
              <p>{t('gallery.tryAnotherKeyword', 'Hãy thử từ khóa khác.')}</p>
            </div>
          )
        ) : browsingCategory ? (
          <>
            {visibleCases.map((item) => (
              <CaseCard
                item={item}
                selected={selected?.id === item.id}
                onSelect={selectLibraryItem}
                favorite={favoriteTemplates.has(templateKey(item))}
                onToggleFavorite={onToggleTemplateFavorite}
                onAppend={onAppendTemplate}
                t={t}
                key={item.id}
              />
            ))}
            {visibleLimit < cases.length ? (
              <button type="button" className="loadMoreButton galleryLoadMore" onClick={() => setVisibleLimit((value) => value + TEMPLATE_PAGE_SIZE)}>
                {t('gallery.loadMoreCount', 'Tải thêm {visible}/{total}', { visible: Math.min(visibleLimit, cases.length), total: cases.length })}
              </button>
            ) : null}
          </>
        ) : (
          categoryGroups.map((group) => (
            <CategoryCard group={group} selected={category === group.id} onSelect={setCategory} t={t} key={group.id} />
          ))
        )}
      </div>
      {!isVideo ? (
        <div className="galleryLicenseLine">
          <span>{licenseNotice?.name || COMMUNITY_LICENSE_NOTICE.name}</span>
          <p>{licenseNotice?.notice || licenseNotice?.text || COMMUNITY_LICENSE_NOTICE.text}</p>
          <a href={licenseNotice?.url || COMMUNITY_LICENSE_NOTICE.url} target="_blank" rel="noreferrer">CC BY 4.0</a>
          <strong>{browsingCategory ? `${cases.length}/${totalCaseCount}` : t('gallery.categoryCount', '{count} danh mục', { count: categoryGroups.length })}</strong>
        </div>
      ) : null}
    </section>
  );
}

function LeftRail({
  activeWorkspace,
  onWorkspaceChange,
  onNewSession,
  profile,
  apiKey,
  isAuthenticated,
  onOpenSettings,
  selected,
  currentProject,
  historyItems,
  selectedHistoryId,
  onSelectHistory,
  onDeleteHistory,
  onFocusCurrentProject,
  collapsed,
  onToggleCollapse,
  t
}) {
  const isInspirationWorkspace = activeWorkspace === 'inspiration';
  const isHistoryWorkspace = activeWorkspace === 'history';
  const accountLabel = isAuthenticated ? (profile?.email || profile?.username || t('rail.loggedIn', 'Đã đăng nhập')) : t('rail.notLoggedIn', 'Chưa đăng nhập');
  const accountDetail = isAuthenticated ? (apiKeyDisplay(apiKey) || t('rail.hiddenKey', 'Đã ẩn key')) : t('rail.chooseKey', 'Chọn key');
  const currentProjectId = currentProject?.sessionId || currentProject?.id || '';
  const currentRecordIds = new Set(currentProject?.recordIds || []);
  const historySessionItems = groupHistorySessions(historyItems || []);
  const recentProjectItems = [
    currentProject,
    ...historySessionItems.filter((item) => {
      const itemId = item.sessionId || item.id;
      if (itemId === currentProjectId) return false;
      return !(item.recordIds || [item.id]).some((recordId) => currentRecordIds.has(recordId));
    })
  ].filter(Boolean).slice(0, 5);

  if (collapsed) {
    return (
      <aside className="templateRail collapsed" aria-label={t('rail.aria', 'Thanh công cụ sáng tạo')}>
        <button type="button" className="railIconAction" onClick={onToggleCollapse} aria-label={t('rail.expand', 'Mở rộng thanh bên')}>
          <PanelLeftOpen size={18} />
        </button>
        <button type="button" className="railIconAction active" onClick={onToggleCollapse} aria-label={t('rail.session', 'Phiên làm việc')}>
          <MessageSquareText size={18} />
        </button>
        <button
          type="button"
          className={`railIconAction ${isHistoryWorkspace ? 'active' : ''}`}
          onClick={() => { onWorkspaceChange('history'); onToggleCollapse(); }}
          aria-label={t('rail.history', 'Lịch sử ảnh')}
        >
          <History size={18} />
          <span>{historySessionItems.length}</span>
        </button>
        <button
          type="button"
          className={`railIconAction ${isInspirationWorkspace ? 'active' : ''}`}
          onClick={() => { onWorkspaceChange('inspiration'); onToggleCollapse(); }}
          aria-label={t('rail.inspiration', 'Thư viện ý tưởng')}
        >
          <Sparkles size={18} />
        </button>
        <div className="collapsedRailBottom">
          <button type="button" className="railAvatarButton" onClick={onOpenSettings} aria-label={t('rail.settings', 'Cài đặt kết nối')} title={t('rail.settings', 'Cài đặt kết nối')}>
            <span className="collapsedRailAvatar">{String(accountLabel).slice(0, 1).toUpperCase()}</span>
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="templateRail" aria-label={t('rail.aria', 'Thanh công cụ sáng tạo')}>
      <div className="sideBrand">
        <span className="sideBrandMark"><WandSparkles size={15} /></span>
        <span>
          <strong>{t('rail.brand', 'Không gian làm việc')}</strong>
          <em>{t('rail.brandMeta', 'Sáng tạo')}</em>
        </span>
        <button type="button" className="sideCollapseButton" onClick={onToggleCollapse} aria-label={t('rail.collapse', 'Thu gọn thanh bên')} title={t('rail.collapse', 'Thu gọn thanh bên')}>
          <PanelLeftClose size={15} />
        </button>
      </div>
      <button type="button" className="newChatButton" onClick={onNewSession} title={t('rail.newSession', 'Tạo phiên mới')}>
        <CirclePlus size={16} />
        {t('rail.newSession', 'Tạo phiên mới')}
      </button>
      <nav className="sidePrimaryNav" aria-label={t('rail.workspaces', 'Không gian làm việc')}>
        <button type="button" className={activeWorkspace === 'image' || activeWorkspace === 'video' ? 'active' : ''} onClick={() => onWorkspaceChange('image')} title={t('workspace.desk', 'Tạo ảnh')}>
          <MessageSquareText size={16} />
          {t('workspace.desk', 'Không gian làm việc')}
        </button>
        <button type="button" className={isHistoryWorkspace ? 'active' : ''} onClick={() => onWorkspaceChange('history')} title={t('workspace.history', 'Lịch sử ảnh')}>
          <History size={16} />
          {t('workspace.history', 'Lịch sử ảnh')}
        </button>
        <button type="button" className={isInspirationWorkspace ? 'active' : ''} onClick={() => onWorkspaceChange('inspiration')} title={t('workspace.inspiration', 'Thư viện ý tưởng')}>
          <Sparkles size={16} />
          {t('workspace.inspiration', 'Thư viện ý tưởng')}
        </button>
      </nav>
      <div className="sideChatBlock">
        <div className="sideProjectHead">
          <span className="sideSectionLabel">{t('rail.project', 'Dự án')}</span>
          <button type="button" onClick={() => onWorkspaceChange('history')}>{t('rail.all', 'Tất cả')}</button>
        </div>
        {recentProjectItems.length ? (
          <div className="sideProjectList">
            {recentProjectItems.map((item, index) => {
              const isVideo = item.mode === 'video' || item.kind === 'video';
              const resultItems = historyResultItems(item);
              const urls = resultItems.length
                ? resultItems.map((result) => result.displayUrl || result.url).filter(Boolean)
                : historyResultUrls(item);
              const title = item.titleKey
                ? t(item.titleKey, item.title || '')
                : item.title || (isVideo ? t('rail.videoGeneration', 'Tạo video') : item.case?.title || compact(item.prompt, 24) || t('rail.unnamedSession', 'Phiên chưa đặt tên'));
              const count = urls.length;
              const thumb = safeImageCandidate(urls[0] || item.case?.image || item.case?.thumbnail || '');
              const orderLabel = item.current ? t('rail.current', 'Hiện tại') : `#${index}`;
              const meta = [
                formatHistoryTime(item.createdAt),
                compact(item.model || item.providerId || '', 12)
              ].filter(Boolean).join(' · ');
              const resultLabel = item.canvasCount
                ? t('rail.nodeCount', '{count} nút', { count: item.canvasCount })
                : isVideo
                  ? t('rail.video', 'Video')
                  : count
                    ? t('rail.imageCount', '{count} ảnh', { count })
                    : item.queueCount
                      ? t('rail.taskCount', '{count} tác vụ', { count: item.queueCount })
                      : t('rail.noResultYet', 'Chưa tạo');
              const summary = compact(item.prompt || item.generationPrompt || item.case?.promptPreview || '', 34);
              const activeRecordIds = item.recordIds || [item.id];
              const isActiveProject = item.current
                || selectedHistoryId === item.id
                || selectedHistoryId === item.sessionId
                || activeRecordIds.includes(selectedHistoryId);
              return (
                <div className={`sideProjectItem ${isActiveProject ? 'active' : ''}`} key={item.id}>
                  <button
                    type="button"
                    className="sideProjectOpen"
                    onClick={() => {
                      if (item.current) {
                        onWorkspaceChange('image');
                        onFocusCurrentProject?.();
                        return;
                      }
                      onSelectHistory(item);
                    }}
                  >
                    <span className="sideProjectThumb">
                      {thumb ? (
                        <ProtectedHistoryThumb
                          src={thumb}
                          fallback={<span className="sideProjectFallback">{isVideo ? <Video size={16} /> : <Images size={16} />}</span>}
                        />
                      ) : (
                        <span className="sideProjectFallback">{isVideo ? <Video size={16} /> : <Images size={16} />}</span>
                      )}
                      <span className="sideProjectIndex">{orderLabel}</span>
                    </span>
                    <span className="sideProjectText">
                      <span className="sideProjectTopline">
                        <strong>{title}</strong>
                        <b>{resultLabel}</b>
                      </span>
                      {meta ? <em>{meta}</em> : null}
                      {summary ? <small>{summary}</small> : null}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="sideProjectDelete"
                    onClick={() => {
                      if (item.current) {
                        onNewSession();
                        return;
                      }
                      onDeleteHistory(item);
                    }}
                    aria-label={`Xóa ${title}`}
                    title={item.current ? t('rail.clearCurrent', 'Xóa phiên hiện tại') : t('rail.delete', 'Xóa')}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <button type="button" className="sideChatCard emptyProjectCard" onClick={onNewSession}>
            <span className="sideChatIcon"><BotMessageSquare size={16} /></span>
            <span>
              <strong>{t('rail.noProject', 'Chưa có dự án')}</strong>
              <em>{t('rail.noProjectHint', 'Tạo phiên mới để xem các kết quả ở đây.')}</em>
            </span>
          </button>
        )}
      </div>
      <div className="railBottomBar">
        <button type="button" className="railAccountCard" onClick={onOpenSettings} aria-label={t('rail.settings', 'Cài đặt kết nối')} title={t('rail.settings', 'Cài đặt kết nối')}>
          <span className="railAvatar">{String(accountLabel).slice(0, 1).toUpperCase()}</span>
          <span>
            <strong>{accountLabel}</strong>
            <em>{accountDetail}</em>
          </span>
          <KeyRound size={15} />
        </button>
      </div>
    </aside>
  );
}
function progressText(progress, fallbackMessage, t = (key, fallback) => fallback || key) {
  if (!progress || progress.stage === 'idle') return fallbackMessage || '';
  if (progress.stage === 'request') return t('progress.submitted', 'Đã gửi');
  if (progress.stage === 'connected') return t('progress.connected', 'Đã kết nối');
  if (progress.stage === 'queued') return t('progress.queued', 'Đang chờ');
  if (progress.stage === 'dispatching') return t('progress.dispatching', 'Đang gửi đến dịch vụ nguồn');
  if (progress.stage === 'upstream') return t('progress.generating', 'Đang tạo');
  if (progress.stage === 'video') return t('progress.videoGenerating', 'Đang tạo video');
  if (progress.stage === 'partial') return t('progress.preview', 'Xem trước {count}', { count: progress.partials || 1 });
  if (progress.stage === 'pending_review') return t('progress.review', 'Chờ xác nhận');
  if (progress.stage === 'image') return `${progress.completed || 1}/${progress.total || 1}`;
  if (progress.stage === 'saving') return t('progress.saving', 'Đang lưu');
  if (progress.stage === 'completed') return t('progress.completed', 'Hoàn tất');
  if (progress.stage === 'succeeded') return t('progress.completed', 'Hoàn tất');
  if (progress.stage === 'canceled') return t('progress.canceled', 'Đã hủy');
  if (progress.stage === 'failed') return t('progress.failed', 'Đã dừng');
  return fallbackMessage || '';
}

function ProgressBar({ progress, active, t = (key, fallback) => fallback || key }) {
  if (!active && progress.stage !== 'completed' && progress.stage !== 'failed' && progress.stage !== 'pending_review') return null;
  const percent = Math.max(0, Math.min(100, Number(progress.percent || 0)));
  const steps = [
    { key: 'request', label: t('progress.stepSubmit', 'Gửi yêu cầu') },
    { key: 'queued', label: t('progress.stepQueue', 'Xếp hàng') },
    { key: 'image', label: t('progress.stepGenerate', 'Tạo') },
    { key: 'saving', label: t('progress.stepSave', 'Lưu') },
    { key: 'completed', label: t('progress.stepDone', 'Hoàn tất') }
  ];
  const stageOrder = {
    idle: -1,
    request: 0,
    connected: 0,
    queued: 1,
    dispatching: 1,
    upstream: 2,
    video: 2,
    partial: 2,
    image: 2,
    saving: 3,
    completed: 4,
    succeeded: 4,
    canceled: 2,
    failed: 2,
    pending_review: 3
  };
  const activeIndex = stageOrder[progress.stage] ?? 0;
  return (
    <div className={`generationProgress ${progress.stage === 'failed' ? 'failed' : ''} ${progress.stage === 'pending_review' ? 'pendingReview' : ''}`} aria-label={t('progress.aria', 'Tiến trình tạo')}>
      <div>
        <span>{progressText(progress, '', t)}</span>
        <strong>{percent}%</strong>
      </div>
      <div className="progressTrack">
        <i style={{ width: `${percent}%` }} />
      </div>
      <div className="progressSteps" aria-hidden="true">
        {steps.map((step, index) => (
          <span className={index <= activeIndex ? 'active' : ''} key={step.key}>{step.label}</span>
        ))}
      </div>
    </div>
  );
}

function GenerationTimingPanel({ timing, t = (key, fallback) => fallback || key }) {
  if (!timing) return null;
  const firstMs = timing.firstByteAt ? timing.firstByteAt - timing.startedAt : null;
  const totalMs = (timing.completedAt || Date.now()) - timing.startedAt;
  const title = timing.status === 'running' ? t('timing.running', 'Đang tính thời gian tạo') : timing.status === 'failed' ? t('timing.failed', 'Đã dừng tạo') : t('timing.done', 'Đã tạo xong');
  return (
    <div className="generationTimingPanel">
      <div>
        <Clock size={15} />
        <strong>{title}</strong>
        <span>{t('timing.hint', 'Phản hồi = lần đầu nhận dữ liệu từ dịch vụ nguồn; tổng thời gian = từ lúc chọn Tạo đến trạng thái hiện tại')}</span>
      </div>
      <dl>
        <div>
          <dt>{t('timing.response', 'Phản hồi')}</dt>
          <dd>{firstMs === null ? t('timing.waiting', 'Đang chờ') : formatDuration(firstMs)}</dd>
        </div>
        <div>
          <dt>{t('timing.total', 'Tổng thời gian')}</dt>
          <dd>{formatDuration(totalMs)}</dd>
        </div>
        <div>
          <dt>{t('params.model', 'Model')}</dt>
          <dd>{timing.model || '--'}</dd>
        </div>
        <div>
          <dt>{t('timing.spec', 'Thông số')}</dt>
          <dd>{timing.spec || '--'}</dd>
        </div>
      </dl>
    </div>
  );
}

function generationQueueStatusLabel(status, t = (key, fallback) => fallback || key) {
  if (status === 'running') return t('composer.queueStatusRunning', 'Đang tạo');
  if (status === 'done') return t('composer.queueStatusDone', 'Hoàn tất');
  if (status === 'failed') return t('composer.queueStatusFailed', 'Bị gián đoạn');
  if (status === 'canceled') return t('composer.queueStatusCanceled', 'Đã hủy');
  if (status === 'unknown') return t('composer.queueStatusUnknown', 'Chưa rõ kết quả');
  return t('composer.queueStatusQueued', 'Đang chờ');
}

function generationQueueSummary(item, t = (key, fallback, values) => {
  if (!values) return fallback || key;
  return Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, value), fallback || key);
}) {
  if (item?.status === 'failed' && item?.error) {
    return generationErrorMessage({
      ...item.error,
      message: item.error.message || item.summary || 'GENERATION_JOB_FAILED',
      status: item.error.status,
      requestId: item.error.requestId || item.requestIds?.[0] || ''
    }, t);
  }
  return item?.summary || '';
}

function generationQueueHeadline(items, t = (key, fallback) => fallback || key) {
  const countStatus = (status) => items.filter((item) => item?.status === status).length;
  const running = countStatus('running');
  const queued = countStatus('queued');
  const failed = countStatus('failed');
  const unknown = countStatus('unknown');
  const canceled = countStatus('canceled');
  const done = countStatus('done');
  const parts = [];
  parts.push(running ? t('composer.queueRunning', 'Đang tạo 1 ảnh') : t('composer.queueIdle', 'Đang rảnh'));
  if (queued) parts.push(t('composer.queueWaiting', '{count} đang chờ', { count: queued }));
  if (failed + unknown) parts.push(t('composer.queueNeedsReview', '{count} cần xác nhận', { count: failed + unknown }));
  if (canceled) parts.push(t('composer.queueCanceledNotice', 'Đã hủy {count}', { count: canceled }));
  if (done) parts.push(t('composer.queueDoneNotice', '{count} thông báo hoàn tất', { count: done }));
  if (!queued && !failed && !unknown && !canceled && !done) parts.push(t('composer.queueWaiting', '{count} đang chờ', { count: 0 }));
  return parts.join(' · ');
}

function generationErrorMessage(error, t = (key, fallback, values) => {
  if (!values) return fallback || key;
  return Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, value), fallback || key);
}) {
  const message = String(
    error?.payload?.error?.message
      || error?.payload?.message
      || error?.payload?.response?.error?.message
      || error?.message
      || t('errors.generationFailed', 'Tạo ảnh không thành công')
  );

  const lowered = message.toLowerCase();
  const requestId = errorRequestId(error, message);
  const requestSuffix = requestId ? t('errors.requestIdSuffix', ' Mã yêu cầu: {requestId}', { requestId }) : '';
  if (error?.code === 'GENERATION_STOPPED' || lowered.includes('generation_stopped')) {
    return t('errors.stopped', 'Đã dừng chờ trên trang này. Nếu yêu cầu đã đến dịch vụ nguồn, quá trình vẫn có thể tiếp tục hoặc phát sinh phí. Hãy kiểm tra canvas và lịch sử ảnh trước khi thử lại.');
  }
  if (error?.code === 'GENERATION_TIMEOUT' || error?.code === 'JOB_TIMEOUT' || lowered.includes('generation_timeout') || lowered.includes('job_timeout') || lowered.includes('timed out') || lowered.includes('timeout')) {
    return `${t('errors.timeout', 'Trang đã chờ quá lâu và ngừng chờ; điều này không có nghĩa dịch vụ nguồn đã hủy yêu cầu. Yêu cầu có thể vẫn đang xử lý, xếp hàng hoặc đã phát sinh phí. Hãy kiểm tra lịch sử ảnh và canvas rồi quyết định có thử lại không.')}${requestSuffix}`;
  }
  if (lowered.includes('origin_not_allowed') || lowered.includes('origin not allowed')) {
    return t('errors.originNotAllowed', 'Dịch vụ không chấp nhận yêu cầu vì địa chỉ trang hiện tại chưa có trong danh sách STUDIO_ALLOWED_ORIGINS. Cập nhật và khởi động lại dịch vụ history/session hoặc thêm địa chỉ này vào danh sách được phép.');
  }
  if (
    lowered.includes('request was rejected by the safety system')
    || lowered.includes('rejected by the safety system')
    || lowered.includes('safety system')
    || lowered.includes('content policy')
    || lowered.includes('safety policy')
    || lowered.includes('policy_violation')
  ) {
    return `${t('errors.safety', 'Prompt hoặc ảnh tham chiếu vi phạm chính sách an toàn của dịch vụ nguồn. Hãy giảm mô tả nhạy cảm và bỏ nội dung rủi ro cao như người thật, trẻ vị thành niên, bạo lực, tình dục hoặc giả mạo người nổi tiếng rồi thử lại.')}${requestSuffix}`;
  }
  if (lowered.includes('no images') || lowered.includes('returned_no_images')) {
    return `${t('errors.noImages', 'Dịch vụ nguồn đã kết thúc yêu cầu nhưng không trả ảnh khả dụng. Model có thể đã từ chối, thông số không tương thích hoặc gateway không chuyển tiếp kết quả. Hãy sửa prompt hoặc model/kích thước rồi thử lại.')}${requestSuffix}`;
  }
  if (lowered.includes('upstream request failed') || lowered.includes('upstream response failed') || lowered.includes('upstream') || lowered.includes('context canceled')) {
    return `${t('errors.upstream', 'Yêu cầu đã đến máy chủ trung gian nhưng model nguồn không trả ảnh như mong đợi. Kiểm tra trạng thái cuối bằng mã yêu cầu. Nếu nhật ký chỉ có lần thử lại hoặc đổi model mà không có kết quả thành công, hãy đổi key, giảm số lượng hoặc thử lại sau.')}${requestSuffix}`;
  }
  if (error?.status === 400 || lowered.includes('invalid request') || lowered.includes('invalid_request') || lowered.includes('invalid parameter') || lowered.includes('invalid_value')) {
    if (lowered.includes('size') || lowered.includes('quality') || lowered.includes('model')) {
      return `${t('errors.unsupportedParams', 'Model hiện tại không hỗ trợ các thông số này. Hãy kiểm tra model, kích thước, chất lượng và số lượng.')}${requestSuffix}`;
    }
    return `${t('errors.invalidParams', 'Thông số yêu cầu không hợp lệ nên đã dừng tạo ảnh. Hãy kiểm tra prompt, model, kích thước, số lượng và ảnh tham chiếu.')}${requestSuffix}`;
  }
  if (error?.status === 401 || lowered.includes('unauthorized') || lowered.includes('invalid token') || lowered.includes('invalid api key') || lowered.includes('incorrect api key')) {
    return t('errors.unauthorized', 'Phiên đăng nhập hoặc key đã hết hạn. Hãy đăng nhập lại hoặc đổi key.');
  }
  if (error?.status === 402 || lowered.includes('insufficient') || lowered.includes('balance') || lowered.includes('quota') || lowered.includes('credit') || lowered.includes('billing')) {
    return t('errors.billing', 'Tài khoản hiện tại không đủ số dư hoặc hạn mức nên đã dừng tạo ảnh.');
  }
  if (error?.status === 403 || lowered.includes('forbidden') || lowered.includes('permission') || lowered.includes('not allowed') || lowered.includes('model_not_found')) {
    return t('errors.forbidden', 'Tài khoản hiện tại không có quyền dùng model hoặc API này nên đã dừng tạo ảnh.');
  }
  if (error?.status === 404 || lowered.includes('not found')) {
    return `${t('errors.notFound', 'Không tìm thấy API hoặc model. Hãy kiểm tra địa chỉ gateway, loại API và tên model.')}${requestSuffix}`;
  }
  if (error?.status === 408 || error?.status === 504 || lowered.includes('gateway timeout') || lowered.includes('upstream timeout')) {
    return `${t('errors.gatewayTimeout', 'Gateway phản hồi quá lâu và trang không nhận thêm kết quả. Nếu yêu cầu đã gửi đi, vẫn có thể phát sinh phí. Hãy kiểm tra lịch sử ảnh rồi quyết định có giảm số lượng/chất lượng và thử lại không.')}${requestSuffix}`;
  }
  if (error?.status === 429 || lowered.includes('rate limit') || lowered.includes('too many requests')) {
    return t('errors.rateLimit', 'Tài khoản hoặc API đang bị giới hạn số yêu cầu. Đã dừng tạo ảnh; hãy thử lại sau.');
  }
  if (error?.status >= 500 || lowered.includes('internal server error') || lowered.includes('bad gateway') || lowered.includes('service unavailable')) {
    return `${t('errors.serviceUnavailable', 'Dịch vụ nguồn tạm thời không khả dụng nên đã dừng tạo ảnh. Hãy thử lại sau; nếu lỗi lặp lại, máy chủ trung gian hoặc model có thể đang gặp sự cố.')}${requestSuffix}`;
  }
  if (lowered.includes('failed to fetch') || lowered.includes('networkerror') || lowered.includes('network error')) {
    return t('errors.network', 'Kết nối mạng bị ngắt nên trang chưa nhận đủ kết quả. Nếu yêu cầu đã gửi đi, dịch vụ nguồn có thể vẫn đang xử lý hoặc đã tính phí. Hãy kiểm tra lịch sử ảnh và canvas trước khi thử lại.');
  }
  if (error?.name === 'AbortError') {
    return t('errors.abort', 'Trang đã dừng theo dõi. Nếu yêu cầu đã đến dịch vụ nguồn, quá trình vẫn có thể tiếp tục hoặc phát sinh phí.');
  }
  if (/^[\u0000-\u007F]*$/.test(message) && /[A-Za-z]/.test(message)) {
    return t('errors.unknownEnglish', 'Tạo ảnh không thành công. Dịch vụ nguồn trả về lỗi tiếng Anh chưa nhận diện được. Hãy thử lại hoặc điều chỉnh model/kích thước/số lượng. Nội dung gốc: {message}', { message: compact(message, 180) });
  }
  return message;
}


function errorRequestId(error, message = '') {
  const direct = error?.requestId
    || error?.request_id
    || error?.payload?.request_id
    || error?.payload?.requestId
    || error?.payload?.error?.request_id
    || error?.payload?.error?.requestId
    || error?.payload?.response?.request_id
    || error?.payload?.response?.requestId
    || error?.payload?.response?.error?.request_id
    || error?.payload?.response?.error?.requestId;
  if (direct) return String(direct);

  const match = String(message).match(/request\s*id\s*[:：]?\s*([a-z0-9-]{12,})/i);
  return match?.[1] || '';
}

const PROMPT_SECTION_LABELS = [
  'chủ thể', 'con người', 'nhân vật', 'sản phẩm', 'bối cảnh', 'hậu cảnh', 'phong cách', 'bố cục', 'ống kính', 'góc nhìn', 'ánh sáng', 'màu sắc', 'chất liệu', 'chi tiết', 'chuyển động', 'chữ',
  'prompt phủ định', 'điều cần tránh', 'yêu cầu độ phân giải', 'chất lượng', 'ảnh tham chiếu', 'mạch tiếp nối', 'dựa trên khung vẽ',
  'Subject', 'Character', 'Product', 'Scene', 'Background', 'Style', 'Composition', 'Camera', 'View', 'Lighting',
  'Color', 'Material', 'Details', 'Action', 'Text', 'Negative prompt', 'Avoid', 'Resolution', 'Reference', 'Lineage'
];

const PROMPT_SECTION_PATTERN = new RegExp(`(${PROMPT_SECTION_LABELS.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\s*[:：]`, 'gi');

function trimPromptBody(value) {
  return String(value || '')
    .replace(/^[\s,，;；。:：-]+/, '')
    .replace(/[\s,，;；]+$/, '')
    .trim();
}

function splitLabeledPromptBlock(block) {
  const text = String(block || '').trim();
  if (!text) return [];
  const matches = [...text.matchAll(PROMPT_SECTION_PATTERN)];
  if (!matches.length) return [];
  return matches.map((match, index) => {
    const nextMatch = matches[index + 1];
    const body = trimPromptBody(text.slice(match.index + match[0].length, nextMatch?.index ?? text.length));
    return {
      title: match[1],
      body
    };
  }).filter((item) => item.body);
}

function promptSectionsFromText(value, t = (key, fallback) => fallback || key) {
  const text = String(value || '').replace(/\r\n/g, '\n').trim();
  if (!text) return [];
  const fallbackTitle = t('lightbox.promptDefaultTitle', 'Prompt');
  const blocks = text.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
  const sections = [];

  blocks.forEach((block) => {
    const labeled = splitLabeledPromptBlock(block);
    if (labeled.length) {
      sections.push(...labeled);
      return;
    }

    const lines = block.split('\n').map((item) => item.trim()).filter(Boolean);
    if (lines.length > 1) {
      lines.forEach((line, lineIndex) => {
        const lineLabeled = splitLabeledPromptBlock(line);
        if (lineLabeled.length) {
          sections.push(...lineLabeled);
        } else {
          sections.push({ title: `${fallbackTitle} ${sections.length + lineIndex + 1}`, body: line });
        }
      });
      return;
    }

    const sentenceParts = block.length > 140
      ? block.split(/(?:；|;\s+|。\s+|(?<=\.)\s+)/).map((item) => trimPromptBody(item)).filter(Boolean)
      : [];
    if (sentenceParts.length > 1) {
      sentenceParts.forEach((part, partIndex) => {
        sections.push({ title: `${fallbackTitle} ${sections.length + partIndex + 1}`, body: part });
      });
      return;
    }

    sections.push({ title: fallbackTitle, body: block });
  });

  return sections;
}

function PromptSectionList({ prompt, t = (key, fallback) => fallback || key }) {
  const sections = promptSectionsFromText(prompt, t);
  if (!sections.length) {
    return <p className="promptEmptyText">{t('lightbox.noPrompt', 'Không có prompt được lưu')}</p>;
  }
  return (
    <div className="promptSectionList">
      {sections.map((section, index) => (
        <section className="promptSection" key={`${section.title}-${index}`}>
          <span>{section.title}</span>
          <p>{section.body}</p>
        </section>
      ))}
    </div>
  );
}

function Lightbox({ url, index, outputFormat = 'png', downloadMeta, onClose, t = (key, fallback) => fallback || key }) {
  if (!url) return null;
  const isReferencePreview = downloadMeta?.mode === 'reference';
  const extension = resultExtension(url, outputFormat);
  const downloadName = buildStudioDownloadFilename({
    ...(downloadMeta || {}),
    mode: 'image',
    index,
    extension
  });
  const promptText = downloadMeta?.prompt || downloadMeta?.generationPrompt || '';
  const meta = [
    downloadMeta?.providerId,
    downloadMeta?.size,
    downloadMeta?.resolutionTier ? RESOLUTION_TIER_LABELS[downloadMeta.resolutionTier] || downloadMeta.resolutionTier : '',
    downloadMeta?.quality ? downloadMeta.quality : '',
    downloadMeta?.createdAt ? formatHistoryTime(downloadMeta.createdAt) : ''
  ].filter(Boolean);
  return (
    <div className="lightboxOverlay" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <figure className="lightboxPanel">
        <button type="button" className="iconButton" onClick={onClose} aria-label={t('settings.close', 'Đóng')}>
          <X size={18} />
        </button>
        <div className="lightboxImageStage">
          <img src={url} alt={`${isReferencePreview ? t('references.title', 'Ảnh tham chiếu (tùy chọn)') : t('lightbox.imageAlt', 'Kết quả tạo ảnh')} ${index + 1}`} />
        </div>
        <aside className="lightboxPromptPanel">
          <div className="lightboxPromptHead">
            <div>
              <span>{isReferencePreview ? t('references.preview', 'Xem ảnh tham chiếu') : t('lightbox.promptLabel', 'Prompt đầy đủ')}</span>
              <strong>{isReferencePreview ? t('references.referenceIndex', 'Ảnh tham chiếu {index}', { index: index + 1 }) : `#${index + 1}`}</strong>
            </div>
            {promptText ? (
              <button type="button" onClick={() => navigator.clipboard?.writeText(promptText)}>
                <Copy size={14} />
                {t('lightbox.copyPrompt', 'Sao chép')}
              </button>
            ) : null}
          </div>
          {meta.length ? (
            <div className="lightboxMetaChips">
              {meta.map((item) => <span key={item}>{item}</span>)}
            </div>
          ) : null}
          <PromptSectionList prompt={promptText} t={t} />
        </aside>
        <figcaption>
          <span>{isReferencePreview ? t('references.referenceIndex', 'Ảnh tham chiếu {index}', { index: index + 1 }) : `#${index + 1}`}</span>
          <a href={url} download={downloadName}>
            <Download size={16} />
            Tải xuống
          </a>
        </figcaption>
      </figure>
    </div>
  );
}

function VideoLightbox({ url, index = 0, downloadMeta, onClose, t = (key, fallback) => fallback || key }) {
  if (!url) return null;
  const extension = resultVideoExtension(url);
  const downloadName = buildStudioDownloadFilename({
    ...(downloadMeta || {}),
    mode: 'video',
    index,
    extension
  });
  return (
    <div className="lightboxOverlay" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <figure className="lightboxPanel videoLightboxPanel">
        <button type="button" className="iconButton" onClick={onClose} aria-label={t('settings.close', 'Đóng')}>
          <X size={18} />
        </button>
        <video src={url} controls playsInline />
        <figcaption>
          <span>{t('canvas.videoResult', 'Kết quả video')}</span>
          <a href={url} download={downloadName}>
            <Download size={16} />
            {t('canvas.download', 'Tải xuống')}
          </a>
        </figcaption>
      </figure>
    </div>
  );
}

function ResultGrid({ urls, outputFormat = 'png', downloadMeta, onPreview, t = (key, fallback) => fallback || key }) {
  if (!urls.length) {
    return (
      <div className="emptyResult">
        <ImageIcon size={32} />
        <p>{t('composer.resultTitle', 'Kết quả')}</p>
      </div>
    );
  }
  return (
    <div className="resultGrid">
      {urls.map((url, index) => (
        <figure key={`${url}-${index}`}>
          <button type="button" className="resultPreviewButton" onClick={() => onPreview(url, index)}>
            <img src={url} alt={`${t('lightbox.imageAlt', 'Kết quả tạo ảnh')} ${index + 1}`} />
          </button>
          <a href={url} download={buildStudioDownloadFilename({
            ...(downloadMeta || {}),
            mode: 'image',
            index,
            extension: resultExtension(url, outputFormat)
          })}>
            <Download size={16} />
            {t('canvas.download', 'Tải xuống')}
          </a>
        </figure>
      ))}
    </div>
  );
}

function VideoResultGrid({ urls, downloadMeta, onPreview, t = (key, fallback) => fallback || key }) {
  if (!urls.length) {
    return (
      <div className="emptyResult">
        <Video size={32} />
        <p>{t('canvas.videoResult', 'Kết quả video')}</p>
      </div>
    );
  }
  return (
    <div className="resultGrid videoResultGrid">
      {urls.map((url, index) => (
        <figure key={`${url}-${index}`}>
          <button type="button" className="resultPreviewButton" onClick={() => onPreview(url, index)}>
            <video src={url} muted playsInline preload="metadata" />
          </button>
          <a href={url} download={buildStudioDownloadFilename({
            ...(downloadMeta || {}),
            mode: 'video',
            index,
            extension: resultVideoExtension(url)
          })}>
            <Download size={16} />
            {t('canvas.download', 'Tải xuống')}
          </a>
        </figure>
      ))}
    </div>
  );
}

function WorkPreviewResultActions({ url, index = 0, outputFormat = 'png', isVideo = false, downloadMeta, onPreview }) {
  if (!url) return null;
  const extension = isVideo ? resultVideoExtension(url) : resultExtension(url, outputFormat);
  const downloadName = buildStudioDownloadFilename({
    ...(downloadMeta || {}),
    mode: isVideo ? 'video' : 'image',
    index,
    extension
  });
  return (
    <div className="workPreviewActions">
      <button type="button" onClick={onPreview}>
        {isVideo ? <Video size={15} /> : <ImageIcon size={15} />}
        Xem trước
      </button>
      <a href={url} download={downloadName}>
        <Download size={15} />
        Tải xuống
      </a>
    </div>
  );
}

function HistoryDetailPanel({ item, onOpenWorkspace, t = (key, fallback) => fallback || key }) {
  if (!item) {
    return (
      <section className="workspaceEmptyPanel">
        <History size={34} />
        <h2>{t('gallery.selectHistory', 'Chọn lịch sử ảnh')}</h2>
        <p>{t('gallery.selectHistoryHint', 'Ảnh và video đã tạo sẽ hiện ở bên trái. Chọn một mục để xem kết quả hoặc tiếp tục chỉnh sửa.')}</p>
      </section>
    );
  }

  const isVideo = item.mode === 'video' || item.kind === 'video';
  const resultItems = historyResultItems(item);
  const urls = resultItems.map((result) => result.displayUrl || result.url).filter(Boolean);
  const downloadMeta = downloadMetaFromHistoryItem(item, isVideo);
  const promptItems = resultItems.length ? resultItems : [{ id: item.id, prompt: item.prompt || item.generationPrompt || '' }];
  const meta = isVideo
    ? [item.model, item.aspectRatio || item.aspect, item.duration ? `${item.duration}s` : '', item.fps ? `${item.fps}fps` : ''].filter(Boolean)
    : [item.model, item.resolutionTier ? (RESOLUTION_TIER_LABELS[item.resolutionTier] || item.resolutionTier) : item.size, item.quality ? QUALITY_LABELS[item.quality] || item.quality : '', item.outputFormat ? OUTPUT_FORMAT_LABELS[item.outputFormat] || item.outputFormat : ''].filter(Boolean);

  return (
    <section className="historyWorkspacePanel">
      <div className="historyWorkspaceHero">
        <div>
          <span>{isVideo ? t('gallery.videoTask', 'Tác vụ video') : t('gallery.imageTask', 'Tác vụ ảnh')} · {formatHistoryTime(item.createdAt)}</span>
          <h2>{isVideo ? t('rail.videoGeneration', 'Tạo video') : item.case?.title || t('gallery.imageGeneration', 'Tạo ảnh')}</h2>
          <div className="historyPromptSection">
            {promptItems.slice(0, 6).map((result, index) => (
              <article className="historyPromptItem" key={result.id || `${result.displayUrl || result.url || 'prompt'}-${index}`}>
                <strong>#{index + 1}</strong>
                <PromptSectionList prompt={result.generationPrompt || result.prompt || item.generationPrompt || item.prompt} t={t} />
              </article>
            ))}
          </div>
          <em>{meta.join(' · ') || t('gallery.historyMetaFallback', 'Thông số lấy từ mục trong lịch sử')}</em>
        </div>
        <button type="button" className="primaryAction" onClick={() => onOpenWorkspace(isVideo ? 'video' : 'image')}>
          {isVideo ? <Video size={17} /> : <ImageIcon size={17} />}
          {isVideo ? t('gallery.openVideoCreate', 'Mở phần tạo video') : t('gallery.openImageCreate', 'Mở phần tạo ảnh')}
        </button>
      </div>
      {isVideo ? (
        <VideoResultGrid urls={urls} downloadMeta={downloadMeta} onPreview={() => {}} t={t} />
      ) : (
        <ResultGrid urls={urls} outputFormat={item.outputFormat || 'png'} downloadMeta={downloadMeta} onPreview={() => {}} t={t} />
      )}
    </section>
  );
}

function PromptSuggestion({ suggestion, onMerge, onReplace, onCopy, onUse, t = (key, fallback) => fallback || key }) {
  if (!suggestion) return null;
  const rows = [
    [t('suggestion.subject', 'Giữ chủ thể'), suggestion.subject],
    [t('suggestion.scene', 'Thay đổi bối cảnh'), suggestion.scene],
    [t('suggestion.composition', 'Bố cục'), suggestion.composition],
    [t('suggestion.style', 'Phong cách'), suggestion.style],
    [t('suggestion.lighting', 'Ánh sáng và màu sắc'), suggestion.lighting],
    [t('suggestion.details', 'Bổ sung chi tiết'), suggestion.details],
    [t('suggestion.textRules', 'Quy tắc chữ viết'), suggestion.textRules],
    [t('suggestion.constraints', 'Nội dung cần tránh'), suggestion.constraints]
  ].filter(([, value]) => String(value || '').trim());
  const finalPrompt = suggestion.finalPrompt || suggestion.raw || '';
  const finalSections = promptSectionsFromText(finalPrompt, t).slice(0, 4);
  const fallbackRows = rows.slice(0, 5);
  const suggestionSections = finalSections.length
    ? finalSections
    : fallbackRows.map(([title, body]) => ({ title, body }));

  return (
    <div className="promptSuggestion composerMessage assistant">
      <span>AI</span>
      <div className="promptSuggestionBody">
        <div className="promptSuggestionLead">
          <strong>{t('suggestion.title', 'Đề xuất prompt cho lượt này')}</strong>
          <small>{t('suggestion.hint', 'AI chỉ sắp xếp ý tưởng, không tự thay thế nội dung bạn đang nhập')}</small>
        </div>
        {finalSections.length ? (
          <span className="promptSuggestionFinalLabel">{t('suggestion.finalPrompt', 'Prompt hoàn chỉnh')}</span>
        ) : null}
        {suggestionSections.length ? (
          <div className="promptSuggestionText">
            {suggestionSections.map((section, index) => (
              <p key={`${section.title}-${index}`}>
                <em>{section.title}</em>
                <span>{section.body}</span>
              </p>
            ))}
          </div>
        ) : finalPrompt ? (
          <p className="promptSuggestionPlain">{finalPrompt}</p>
        ) : (
          <div className="promptSuggestionText">
            {fallbackRows.map(([label, value]) => (
              <p key={label}>
                <b>{label}</b>
                <span>{value}</span>
              </p>
            ))}
          </div>
        )}
        <div className="promptSuggestionActions">
          {onUse ? (
            <button type="button" onClick={onUse}>
              <Sparkles size={13} />
              {t('suggestion.useThis', 'Tạo ảnh với prompt này')}
            </button>
          ) : null}
          <button type="button" onClick={onReplace}>{t('composer.putIntoInput', 'Đưa vào ô nhập')}</button>
        </div>
      </div>
    </div>
  );
}

function ProtectedStudioImage({ src, fallbackSrc = '', alt = '', fallback = null }) {
  const holderRef = useRef(null);
  const [shouldResolve, setShouldResolve] = useState(() => {
    const value = String(src || '');
    return Boolean(value && !isProtectedStudioAsset(value));
  });
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [resolvedSrc, setResolvedSrc] = useState(() => {
    const value = String(src || '');
    return value && !isProtectedStudioAsset(value) ? displayResultUrl(value) : '';
  });
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const candidates = [src, fallbackSrc]
      .map((value) => String(value || '').trim())
      .filter(Boolean);
    if (!candidates.some(isProtectedStudioAsset)) {
      setShouldResolve(true);
      return undefined;
    }

    setShouldResolve(false);
    if (!('IntersectionObserver' in window)) {
      const timer = window.setTimeout(() => setShouldResolve(true), 150);
      return () => window.clearTimeout(timer);
    }

    const node = holderRef.current?.parentElement || holderRef.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setShouldResolve(true);
        observer.disconnect();
      }
    }, { rootMargin: '180px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [src, fallbackSrc]);

  useEffect(() => {
    let active = true;
    const objectUrls = [];
    const candidates = [src, fallbackSrc]
      .map((value) => String(value || '').trim())
      .filter((value, index, list) => value && list.indexOf(value) === index);

    async function resolveCandidate(value) {
      if (!isProtectedStudioAsset(value)) return displayResultUrl(value);
      const session = loadSession();
      const historyClient = new StudioHistoryClient({ session });
      return await enqueueProtectedImageTask(() => historyClient.resolveAssetUrl(value)) || '';
    }

    async function resolveImage() {
      for (const value of candidates) {
        try {
          const url = await resolveCandidate(value);
          if (active && url) {
            if (url.startsWith('blob:')) objectUrls.push(url);
            setCandidateIndex(candidates.indexOf(value));
            setResolvedSrc(url);
            return;
          }
          if (!active && url?.startsWith('blob:')) URL.revokeObjectURL(url);
        } catch {
          // Try the next candidate before showing the empty-state icon.
        }
      }
      if (active) {
        setResolvedSrc('');
        setFailed(true);
      }
    }

    setFailed(false);
    setCandidateIndex(0);
    setResolvedSrc(candidates[0] && !isProtectedStudioAsset(candidates[0]) ? displayResultUrl(candidates[0]) : '');
    if (!shouldResolve) return () => {
      active = false;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
    resolveImage();

    return () => {
      active = false;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [src, fallbackSrc, shouldResolve]);

  if (!src || failed || !resolvedSrc) return <span ref={holderRef}>{fallback}</span>;
  return (
    <span ref={holderRef}>
      <img
        src={resolvedSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={(event) => {
          const candidates = [src, fallbackSrc]
            .map((value) => String(value || '').trim())
            .filter((value, index, list) => value && list.indexOf(value) === index);
          const next = candidates[candidateIndex + 1];
          if (next && !isProtectedStudioAsset(next)) {
            setCandidateIndex((value) => value + 1);
            setResolvedSrc(displayResultUrl(next));
            return;
          }
          event.currentTarget.hidden = true;
          setFailed(true);
        }}
      />
    </span>
  );
}

function ProtectedHistoryThumb(props) {
  return <ProtectedStudioImage {...props} />;
}

function LazyImage({ src, alt, className = '', onError, ...props }) {
  return (
    <img
      {...props}
      className={className || undefined}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={onError}
    />
  );
}

function CreativeRecipeBar({ recipes, activeId, onApply, t = (key, fallback) => fallback || key }) {
  if (!recipes?.length) return null;
  return (
    <div className="creativeRecipeBar">
      <div className="recipeBarHead">
        <span>{t('recipe.title', 'Công thức sáng tạo')}</span>
        <em>{t('recipe.hint', 'Gợi ý thiết lập cảnh từ dự án tham khảo, có thể áp dụng nhanh vào thông số hiện tại')}</em>
      </div>
      <div className="recipeScroller">
        {recipes.map((recipe) => (
          <button
            type="button"
            className={activeId === recipe.id ? 'active' : ''}
            key={recipe.id}
            onClick={() => onApply(recipe)}
          >
            <strong>{recipe.title}</strong>
            <span>{recipe.tone}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
const MaskEditor = forwardRef(function MaskEditor({
  imageFile,
  imagePreview,
  onUpload,
  onClearImage,
  onExportReady,
  onError,
  onGenerate,
  generating = false,
  t = (key, fallback) => fallback || key
}, ref) {
  const imageCanvasRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const cursorCanvasRef = useRef(null);
  const wrapRef = useRef(null);
  const stateRef = useRef(createMaskState());
  const drawingRef = useRef(false);
  const [maskState, setMaskState] = useState(() => createMaskState());

  const syncState = (updater) => {
    const current = stateRef.current;
    const next = typeof updater === 'function' ? updater(current) : updater;
    stateRef.current = next;
    setMaskState(next);
    return next;
  };

  const pushHistory = (base = stateRef.current) => {
    const snapshot = createMaskSnapshot(base);
    const history = base.history.slice(0, base.historyIndex + 1);
    history.push(snapshot);
    const trimmed = history.slice(-MASK_HISTORY_LIMIT);
    return {
      ...base,
      history: trimmed,
      historyIndex: trimmed.length - 1
    };
  };

  const redraw = (state = stateRef.current) => {
    const imageCanvas = imageCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const cursorCanvas = cursorCanvasRef.current;
    const { width, height } = state.imageSize;
    if (!imageCanvas || !maskCanvas || !width || !height) return;
    for (const canvas of [imageCanvas, maskCanvas, cursorCanvas].filter(Boolean)) {
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${Math.round(width * state.zoom)}px`;
      canvas.style.height = `${Math.round(height * state.zoom)}px`;
    }
    const imageContext = imageCanvas.getContext('2d');
    const maskContext = maskCanvas.getContext('2d');
    if (!imageContext || !maskContext) return;
    const image = new Image();
    image.onload = () => {
      imageContext.clearRect(0, 0, width, height);
      imageContext.drawImage(image, 0, 0, width, height);
      maskContext.clearRect(0, 0, width, height);
      maskContext.globalAlpha = clamp(Number(state.overlayAlpha) || 50, 10, 100) / 100;
      if (state.inverted) {
        maskContext.fillStyle = MASK_FILL_COLOR;
        maskContext.fillRect(0, 0, width, height);
      }
      drawMaskSnapshot(maskContext, state);
      maskContext.globalAlpha = 1;
    };
    image.src = state.imageUrl;
  };

  useEffect(() => {
    if (!imageFile || !imagePreview) {
      syncState(createMaskState());
      return;
    }
    let cancelled = false;
    loadImageDimensions(imagePreview).then((imageSize) => {
      if (cancelled) return;
      const next = pushHistory({
        ...createMaskState(),
        imageUrl: imagePreview,
      imageName: imageFile.name || 'Ảnh tham chiếu',
        imageSize,
        zoom: imageSize.width > 1400 ? 0.5 : imageSize.width > 900 ? 0.7 : 1
      });
      syncState(next);
      requestAnimationFrame(() => redraw(next));
    });
    return () => {
      cancelled = true;
    };
  }, [imageFile, imagePreview]);

  useEffect(() => {
    redraw(maskState);
  }, [maskState.brushSize, maskState.hardness, maskState.overlayAlpha, maskState.zoom, maskState.tool, maskState.inverted, maskState.strokes.length]);

  useImperativeHandle(ref, () => ({
    exportMask() {
      return exportMaskFile();
    }
  }), []);

  function exportMaskFile() {
    const state = stateRef.current;
    if (!state.inverted && !state.strokes.length && !state.currentStroke) return null;
    const dataUrl = maskSnapshotToImageData(state);
    if (!dataUrl) return null;
    return dataUrlToFile(dataUrl, 'mask.png');
  }

  const canvasPoint = (event) => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    return {
      x: clamp(x, 0, canvas.width),
      y: clamp(y, 0, canvas.height)
    };
  };

  const startStroke = (event) => {
    const point = canvasPoint(event);
    if (!point || !maskState.imageUrl) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drawingRef.current = true;
    const next = {
      ...stateRef.current,
      currentStroke: {
        tool: stateRef.current.tool,
        size: stateRef.current.brushSize,
        hardness: stateRef.current.hardness,
        points: [point]
      }
    };
    syncState(next);
    redraw(next);
  };

  const moveStroke = (event) => {
    if (!drawingRef.current) return;
    const point = canvasPoint(event);
    if (!point) return;
    event.preventDefault();
    const next = {
      ...stateRef.current,
      currentStroke: {
        ...stateRef.current.currentStroke,
        points: [...(stateRef.current.currentStroke?.points || []), point]
      }
    };
    syncState(next);
    redraw(next);
  };

  const finishStroke = (event) => {
    if (!drawingRef.current) return;
    event?.preventDefault?.();
    drawingRef.current = false;
    const currentStroke = stateRef.current.currentStroke;
    if (!currentStroke?.points?.length) {
      syncState({ ...stateRef.current, currentStroke: null });
      return;
    }
    const next = pushHistory({
      ...stateRef.current,
      strokes: [...stateRef.current.strokes, currentStroke],
      currentStroke: null
    });
    syncState(next);
    redraw(next);
  };

  const updateMaskState = (patch) => {
    const next = { ...stateRef.current, ...patch };
    syncState(next);
    redraw(next);
  };

  const undo = () => {
    const current = stateRef.current;
    if (current.historyIndex <= 0) return;
    const snapshot = current.history[current.historyIndex - 1];
    const restored = restoreMaskSnapshot(snapshot);
    restored.history = current.history;
    restored.historyIndex = current.historyIndex - 1;
    syncState(restored);
    requestAnimationFrame(() => redraw(restored));
  };

  const redo = () => {
    const current = stateRef.current;
    if (current.historyIndex >= current.history.length - 1) return;
    const snapshot = current.history[current.historyIndex + 1];
    const restored = restoreMaskSnapshot(snapshot);
    restored.history = current.history;
    restored.historyIndex = current.historyIndex + 1;
    syncState(restored);
    requestAnimationFrame(() => redraw(restored));
  };

  const clearMask = () => {
    const next = pushHistory({ ...stateRef.current, strokes: [], currentStroke: null, inverted: false });
    syncState(next);
    redraw(next);
  };

  const invertMask = () => {
    const next = pushHistory({ ...stateRef.current, inverted: !stateRef.current.inverted, currentStroke: null });
    syncState(next);
    redraw(next);
  };

  const exportMask = () => {
    const file = exportMaskFile();
    if (!file) {
      onError?.(t('mask.needImage', 'Hãy tải ảnh tham chiếu lên và tô mặt nạ trước.'));
      return;
    }
    const url = URL.createObjectURL(file);
    onExportReady?.(url, file);
  };

  const canUndo = maskState.historyIndex > 0;
  const canRedo = maskState.historyIndex < maskState.history.length - 1;

  return (
    <div className="maskEditorPanel">
      <div className="maskToolbar">
        <div className="maskToolGroup">
          <label className="uploadMaskSource">
            <Upload size={15} />
            <span>{imageFile ? t('mask.replaceReference', 'Thay ảnh tham chiếu') : t('mask.uploadReference', 'Tải ảnh tham chiếu lên')}</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => {
                onUpload?.(event.target.files);
                event.target.value = '';
              }}
            />
          </label>
          {imageFile ? (
            <button type="button" onClick={onClearImage}>
              <Trash2 size={15} />
              {t('settings.clear', 'Xóa')}
            </button>
          ) : null}
        </div>
        <div className="maskToolGroup">
          <button type="button" className={maskState.tool === 'brush' ? 'active' : ''} onClick={() => updateMaskState({ tool: 'brush' })}>
            <Brush size={15} />
            {t('mask.brush', 'Cọ vẽ')}
          </button>
          <button type="button" className={maskState.tool === 'eraser' ? 'active' : ''} onClick={() => updateMaskState({ tool: 'eraser' })}>
            <Eraser size={15} />
            {t('mask.eraser', 'Tẩy')}
          </button>
        </div>
        <label className="maskRange">
          <span>{t('mask.brushSize', 'Cỡ cọ {value}px', { value: maskState.brushSize })}</span>
          <input type="range" min="6" max="220" value={maskState.brushSize} onChange={(event) => updateMaskState({ brushSize: Number(event.target.value) })} />
        </label>
        <label className="maskRange">
          <span>{t('mask.previewAlpha', 'Độ trong khi xem trước {value}%', { value: maskState.overlayAlpha })}</span>
          <input type="range" min="15" max="90" value={maskState.overlayAlpha} onChange={(event) => updateMaskState({ overlayAlpha: Number(event.target.value) })} />
        </label>
        <label className="maskRange">
          <span>{t('mask.canvasZoom', 'Thu phóng canvas {value}%', { value: Math.round(maskState.zoom * 100) })}</span>
          <input type="range" min="20" max="140" value={Math.round(maskState.zoom * 100)} onChange={(event) => updateMaskState({ zoom: clamp(Number(event.target.value) / 100, 0.2, 1.4) })} />
        </label>
        <div className="maskToolGroup">
          <button type="button" onClick={undo} disabled={!canUndo} aria-label={t('mask.undo', 'Hoàn tác mặt nạ')}>
            <Undo2 size={15} />
          </button>
          <button type="button" onClick={redo} disabled={!canRedo} aria-label={t('mask.redo', 'Làm lại mặt nạ')}>
            <Redo2 size={15} />
          </button>
          <button type="button" onClick={invertMask} disabled={!imageFile}>
            <FlipHorizontal size={15} />
            {t('mask.invert', 'Đảo ngược')}
          </button>
          <button type="button" onClick={clearMask} disabled={!imageFile}>
            {t('gallery.clear', 'Xóa')}
          </button>
        </div>
        <div className="maskToolGroup maskExportGroup">
          <button type="button" onClick={exportMask} disabled={!imageFile}>
            <Download size={15} />
            {t('mask.export', 'Xuất mặt nạ')}
          </button>
          {onGenerate ? (
            <button type="button" className="maskGenerateButton" onClick={onGenerate} disabled={!imageFile || generating}>
              {generating ? <LoaderCircle className="spin" size={15} /> : <Sparkles size={15} />}
              {t('mask.generateWithMask', 'Tạo ảnh bằng mặt nạ này')}
            </button>
          ) : null}
        </div>
      </div>
      <div className="maskCanvasWrap" ref={wrapRef}>
        {imageFile ? (
          <div className="maskCanvasStack">
            <canvas ref={imageCanvasRef} />
            <canvas
              ref={maskCanvasRef}
              className="maskPaintCanvas"
              onPointerDown={startStroke}
              onPointerMove={moveStroke}
              onPointerUp={finishStroke}
              onPointerCancel={finishStroke}
              onPointerLeave={finishStroke}
            />
            <canvas ref={cursorCanvasRef} className="maskCursorCanvas" />
          </div>
        ) : (
          <div className="maskCanvasEmpty">
            <ScanLine size={30} />
            <strong>{t('mask.emptyTitle', 'Tải ảnh tham chiếu lên để tạo mặt nạ')}</strong>
            <span>{t('mask.emptyHint', 'Vùng được tô sẽ được vẽ lại; vùng không tô sẽ được giữ nguyên.')}</span>
          </div>
        )}
      </div>
      <div className="maskMetaLine">
        <span>{imageFile ? `${maskState.imageName} · ${maskState.imageSize.width}×${maskState.imageSize.height}` : t('mask.sizeAuto', 'Kích thước mặt nạ tự khớp với ảnh tham chiếu hiện tại')}</span>
        <span>{t('mask.transparentMeansRedraw', 'Vùng trong suốt = vùng cần vẽ lại')}</span>
      </div>
    </div>
  );
});
function CreationDesk({
  sessionId,
  activeWorkspace,
  selectedCase,
  selectedHistory,
  onResolveCase,
  apiKey,
  client,
  providerSettings,
  onProviderChange,
  modelOptions,
  modelsStatus,
  usageSummary,
  isAuthenticated,
  onRequireLogin,
  onOpenSettings,
  onProfileRefresh,
  onHistoryAdd,
  remoteSession,
  remoteSessionReady,
  persistenceKey,
  onSessionSnapshot,
  promptPresets,
  appendTemplateRequest,
  onAppendTemplateConsumed,
  onOpenWorkspace,
  focusSignal = 0,
  t
}) {
  const draftRef = useRef(loadDraft());
  const currentSessionRef = useRef(loadCurrentSession());
  const restoredSession = currentSessionRef.current;
  const initialParameters = restoredSession?.parameters || draftRef.current || {};
  const restoredMode = restoredSession?.mode || (activeWorkspace === 'video' ? 'video' : 'image');
  const generationRef = useRef({ id: 0, controller: null });
  const resolvingCaseRef = useRef({ id: 0 });
  const appliedCasePromptRef = useRef({ key: '', prompt: '' });
  const maskEditorRef = useRef(null);
  const composerThreadRef = useRef(null);
  const promptInputRef = useRef(null);
  const [conversationOpen, setConversationOpen] = useState(false);
  const lastSessionSnapshotPayloadRef = useRef('');
  const [mode, setMode] = useState(restoredMode);
  const [prompt, setPrompt] = useState(() => restoredSession?.prompt || draftRef.current?.prompt || selectedCase?.prompt || '');
  useEffect(() => {
    const input = promptInputRef.current;
    if (!input) return;
    input.style.setProperty('--prompt-height', '0px');
    input.style.setProperty('--prompt-height', `${Math.min(160, Math.max(56, input.scrollHeight))}px`);
  }, [prompt]);
  const [model, setModel] = useState(() => restoredSession?.model || initialParameters.model || IMAGE_MODELS[0]);
  const initialSize = normalizeSize(initialParameters.size || initialParameters.customSize || '1024x1024');
  const [aspect, setAspect] = useState(() => normalizeAspect(initialParameters.aspect || initialParameters.aspectRatio, initialSize));
  const [customSize, setCustomSize] = useState(() => normalizeSize(initialParameters.customSize || initialSize));
  const [quality, setQuality] = useState(() => normalizeQuality(initialParameters.quality));
  const [resolutionTier, setResolutionTier] = useState(() => normalizeResolutionTier(initialParameters.resolutionTier));
  const [outputFormat, setOutputFormat] = useState(() => normalizeOutputFormat(initialParameters.outputFormat));
  const [moderation, setModeration] = useState(() => normalizeModeration(initialParameters.moderation));
  const [count, setCount] = useState(() => initialParameters.count || 1);
  const [videoModel, setVideoModel] = useState(() => initialParameters.videoModel || (restoredMode === 'video' ? restoredSession?.model : '') || VIDEO_MODELS[0]);
  const [videoAspect, setVideoAspect] = useState(() => normalizeVideoAspect(initialParameters.videoAspect || initialParameters.videoAspectRatio));
  const [videoDuration, setVideoDuration] = useState(() => normalizeVideoDuration(initialParameters.videoDuration || initialParameters.duration));
  const [videoFps, setVideoFps] = useState(() => normalizeVideoFps(initialParameters.videoFps || initialParameters.fps));
  const [videoMotion, setVideoMotion] = useState(() => normalizeVideoMotion(initialParameters.videoMotion));
  const [videoStyle, setVideoStyle] = useState(() => normalizeVideoStyle(initialParameters.videoStyle));
  const [videoQuality, setVideoQuality] = useState(() => normalizeVideoQuality(initialParameters.videoQuality));
  const [negativePrompt, setNegativePrompt] = useState(() => initialParameters.negativePrompt || '');
  const [videoReferenceFiles, setVideoReferenceFiles] = useState([]);
  const [videoReferencePreviews, setVideoReferencePreviews] = useState([]);
  const restoredWasGenerating = restoredSession?.status === 'loading';
  const restoredHasServerJob = hasRestorableServerGeneration(restoredSession);
  const restoredPendingReview = restoredWasGenerating && (
    (Array.isArray(restoredSession?.results) && restoredSession.results.length)
    || (Array.isArray(restoredSession?.videoResults) && restoredSession.videoResults.length)
    || (Array.isArray(restoredSession?.canvasNodes) && restoredSession.canvasNodes.length)
  );
  const [status, setStatus] = useState(restoredWasGenerating ? restoredHasServerJob ? 'loading' : 'error' : 'idle');
  const [message, setMessage] = useState(restoredWasGenerating
    ? restoredHasServerJob
      ? 'Phát hiện máy chủ vẫn còn tác vụ tạo ảnh; đang tiếp tục đồng bộ trạng thái. Tải lại trang sẽ không làm mất hàng đợi.'
      : restoredPendingReview
      ? 'Yêu cầu tạo ảnh đang chạy trước khi tải lại trang; bản xem trước/khung vẽ đã nhận được vẫn được giữ lại. Hệ thống upstream có thể đã tính phí, hãy kiểm tra kết quả hoặc chờ thêm, đừng gửi lại ngay.'
      : 'Yêu cầu tạo ảnh đang chạy trước khi tải lại trang nhưng trang này đã ngắt theo dõi. Hệ thống upstream có thể đã tính phí; hãy kiểm tra lịch sử ảnh hoặc máy chủ trước khi quyết định thử lại.'
    : '');
  const [results, setResults] = useState(() => Array.isArray(restoredSession?.results) ? restoredSession.results : []);
  const [videoResults, setVideoResults] = useState(() => Array.isArray(restoredSession?.videoResults) ? restoredSession.videoResults : []);
  const [resultBatchMeta, setResultBatchMeta] = useState(() => restoredSession?.resultBatchMeta || null);
  const [videoTask, setVideoTask] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [previewVideo, setPreviewVideo] = useState('');
  const [progress, setProgress] = useState(() => restoredWasGenerating
    ? {
      ...(restoredSession?.progress || {}),
      stage: restoredHasServerJob ? (restoredSession?.progress?.stage || 'upstream') : restoredPendingReview ? 'pending_review' : 'failed',
      percent: restoredSession?.progress?.percent || (restoredHasServerJob ? 52 : 0)
    }
    : { stage: 'idle', percent: 0, completed: 0, total: 1 });
  const [timing, setTiming] = useState(() => restoredSession?.timing || null);
  const [copied, setCopied] = useState(false);
  const [promptInstruction, setPromptInstruction] = useState('');
  const [promptSuggestion, setPromptSuggestion] = useState(() => serializePromptSuggestion(restoredSession?.promptSuggestion));
  const [assistantMessages, setAssistantMessages] = useState(() => (
    Array.isArray(restoredSession?.assistantMessages)
      ? restoredSession.assistantMessages.map(serializeAssistantMessage).filter(Boolean).slice(-24)
      : []
  ));
  const [activeRecipeId, setActiveRecipeId] = useState('');
  const [composerInspirationOpen, setComposerInspirationOpen] = useState(false);
  const [optimizingPrompt, setOptimizingPrompt] = useState(false);
  // Remembers the last prompt-assistant failure so the status card does not label it as an image error.
  const [assistantError, setAssistantError] = useState(null);
  const [caseResolving, setCaseResolving] = useState(false);
  const [referenceItems, setReferenceItems] = useState([]);
  const [referencePreviews, setReferencePreviews] = useState([]);
  const [referenceDropActive, setReferenceDropActive] = useState(false);
  const [videoDropActive, setVideoDropActive] = useState(false);
  const [maskExportUrl, setMaskExportUrl] = useState('');
  const [layoutSections, setLayoutSections] = useState(() => loadWorkbenchLayout());
  const [activeParamPanel, setActiveParamPanel] = useState('');
  const [canvasView, setCanvasView] = useState(() => restoredSession?.canvasView || { x: 0, y: 0, zoom: 1 });
  const [canvasViewport, setCanvasViewport] = useState({ width: 1200, height: 720 });
  const [canvasNodes, setCanvasNodes] = useState(() => Array.isArray(restoredSession?.canvasNodes) ? restoredSession.canvasNodes : []);
  const canvasNodesRef = useRef(Array.isArray(restoredSession?.canvasNodes) ? restoredSession.canvasNodes : []);
  const [canvasCustomLinks, setCanvasCustomLinks] = useState(() => Array.isArray(restoredSession?.canvasCustomLinks) ? restoredSession.canvasCustomLinks : []);
  const [selectedCanvasNodeId, setSelectedCanvasNodeId] = useState(() => restoredSession?.selectedCanvasNodeId || '');
  const [canvasLinkDraft, setCanvasLinkDraft] = useState(null);
  const [canvasEditorNodeId, setCanvasEditorNodeId] = useState('');
  const [canvasEditorPrompt, setCanvasEditorPrompt] = useState('');
  const [canvasEditorMode, setCanvasEditorMode] = useState('image');
  const [pendingCanvasGenerate, setPendingCanvasGenerate] = useState(null);
  const [pendingSuggestionGenerate, setPendingSuggestionGenerate] = useState(null);
  const [generationQueue, setGenerationQueue] = useState(() => Array.isArray(restoredSession?.generationQueue) ? restoredSession.generationQueue : []);
  const workPreviewRef = useRef(null);
  const canvasDragRef = useRef(null);
  const suppressCanvasClickRef = useRef(false);
  const appliedRemoteSessionRef = useRef('');
  const generationQueueRef = useRef(Array.isArray(restoredSession?.generationQueue) ? restoredSession.generationQueue : []);
  const generationQueueRunnerRef = useRef(false);
  const restoredQueueStartedRef = useRef(false);
  const recoveredJobIdsRef = useRef(new Set());
  const stateBlobUrlsRef = useRef(new Set());
  const updateLayoutSections = (patch) => {
    setLayoutSections((current) => {
      const next = { ...current, ...patch };
      saveWorkbenchLayout(next);
      return next;
    });
  };

  useEffect(() => {
    if (referenceItems.length || videoReferenceFiles.length || mode === 'mask') {
      updateLayoutSections({ references: true });
    }
  }, [referenceItems.length, videoReferenceFiles.length, mode]);

  useEffect(() => {
    if (status === 'error' || status === 'loading') setConversationOpen(true);
  }, [status]);

  useEffect(() => {
    canvasNodesRef.current = canvasNodes;
  }, [canvasNodes]);

  useEffect(() => {
    const nextUrls = collectStateBlobUrls({
      results,
      videoResults,
      canvasNodes,
      previewImage,
      previewVideo
    });
    for (const url of stateBlobUrlsRef.current) {
      if (!nextUrls.has(url)) URL.revokeObjectURL(url);
    }
    stateBlobUrlsRef.current = nextUrls;
  }, [results, videoResults, canvasNodes, previewImage?.url, previewVideo?.url, previewVideo]);

  useEffect(() => () => {
    for (const url of stateBlobUrlsRef.current) URL.revokeObjectURL(url);
    stateBlobUrlsRef.current.clear();
  }, []);

  const isReady = connectionReady(providerSettings, apiKey, isAuthenticated);
  const currentImageProvider = getImageProvider(providerSettings.providerId, providerSettings.apiKeySource);
  const imageAspectOptions = useMemo(() => providerAspectOptions(currentImageProvider), [currentImageProvider]);
  const customSizeOptions = useMemo(() => providerCustomSizeOptions(currentImageProvider), [currentImageProvider]);
  const imageQualityOptions = useMemo(() => (
    providerParameterList(currentImageProvider, 'qualities', QUALITY).filter((item) => item !== 'auto')
  ), [currentImageProvider]);
  const imageResolutionTierOptions = useMemo(() => (
    providerParameterList(currentImageProvider, 'resolutionTiers', RESOLUTION_TIERS.map((item) => item.value))
      .map((value) => RESOLUTION_TIERS.find((item) => item.value === value) || { value, label: String(value).toUpperCase() })
  ), [currentImageProvider]);
  const imageOutputFormatOptions = useMemo(() => providerParameterList(currentImageProvider, 'outputFormats', OUTPUT_FORMATS), [currentImageProvider]);
  const imageCountRange = useMemo(() => providerCountRange(currentImageProvider), [currentImageProvider]);
  const defaultImageModelOptions = IMAGE_MODELS.map((id) => ({ id, label: id }));
  const configuredImageModelOptions = [
    providerSettings.imageGenerationModel,
    providerSettings.imageEditModel
  ].map((id) => String(id || '').trim()).filter(Boolean).map((id) => ({ id, label: id }));
  const baseImageModelOptions = modelOptions?.image?.length ? modelOptions.image : defaultImageModelOptions;
  const imageModelOptions = [
    ...configuredImageModelOptions.filter((item) => !baseImageModelOptions.some((option) => option.id === item.id)),
    ...baseImageModelOptions
  ];
  const assistantModelOptions = modelOptions?.responses?.length
    ? modelOptions.responses.filter((item) => !modelLooksLikeImage(item) && !PROMPT_ASSISTANT_MODEL_EXCLUDE_PATTERN.test(`${item.id} ${item.label || ''}`))
    : [];
  const responseModelOptions = assistantModelOptions.length
    ? assistantModelOptions
    : [...new Set([providerSettings.responsesModel, ...RESPONSE_MODELS])].filter(Boolean).map((id) => ({ id, label: id }));
  const configuredVideoModel = String(providerSettings.videoModel || '').trim();
  const baseVideoModelOptions = modelOptions?.video?.length ? modelOptions.video : VIDEO_MODELS.map((id) => ({ id, label: id }));
  const syncedVideoModelOptions = configuredVideoModel && !baseVideoModelOptions.some((item) => item.id === configuredVideoModel)
    ? [{ id: configuredVideoModel, label: configuredVideoModel }, ...baseVideoModelOptions]
    : baseVideoModelOptions;
  const videoModelOptions = videoModel && !syncedVideoModelOptions.some((item) => item.id === videoModel)
    ? [{ id: videoModel, label: videoModel }, ...syncedVideoModelOptions]
    : syncedVideoModelOptions;
  const activeModelInfo = imageModelOptions.find((item) => item.id === model);
  const activeVideoModelInfo = videoModelOptions.find((item) => item.id === videoModel);
  const hasSyncedVideoModels = syncedVideoModelOptions.length > 0;
  const hasVideoModels = hasSyncedVideoModels || Boolean(videoModel);
  const size = sizeFromAspect(aspect, customSize);
  const countValue = clampCountForProvider(count, currentImageProvider);
  const videoSize = videoSizeFromAspect(videoAspect);
  const currentDownloadMeta = resultBatchMeta || {
    mode: mode === 'video' ? 'video' : 'image',
    providerId: mode === 'video'
      ? videoModel
      : model,
    createdAt: timing?.startedAt || Date.now(),
    prompt,
    size,
    quality,
    resolutionTier,
    outputFormat,
    id: timing?.startedAt || selectedHistory?.id || selectedCase?.id || ''
  };
  const visiblePromptPresets = (promptPresets || PROMPT_PRESETS).filter((item) => item.mode === mode);
  const referenceFiles = referenceItems.map((item) => item.file);
  const isImageEditMode = mode === 'edit' || mode === 'mask';
  const selectedCanvasNode = canvasNodes.find((node) => node.id === selectedCanvasNodeId) || null;
  const canvasNodeMap = useMemo(() => new Map(canvasNodes.map((node) => [node.id, node])), [canvasNodes]);
  const deskModeLabel = (value) => {
    if (value === 'image') return t('mode.textToImage', 'Tạo ảnh từ văn bản');
    if (value === 'edit') return t('mode.referenceEdit', 'Ảnh tham chiếu');
    if (value === 'mask') return t('mode.mask', 'Mask');
    return value;
  };
  const qualityLabel = (value) => {
    if (value === 'auto') return t('quality.auto', 'Tự động');
    if (value === 'low') return t('quality.low', 'Thấp');
    if (value === 'medium') return t('quality.medium', 'Trung bình');
    if (value === 'high') return t('quality.high', 'Cao');
    return value;
  };
  const aspectLabel = (item) => (item.value === 'custom' ? t('params.manual', 'Tùy chỉnh') : item.label);
  const customSizeLabel = (item) => (item.value === 'auto' ? t('params.auto', 'Tự động') : item.label);
  const videoMotionLabel = (item) => (item.value === 'auto' ? t('params.auto', 'Tự động') : item.label);
  const videoStyleLabel = (item) => (item.value === 'auto' ? t('params.auto', 'Tự động') : item.label);
  const resolutionTierLabel = (item) => RESOLUTION_TIER_LABELS[item.value] || item.label;
  const imageCountSuffix = countValue === 1 ? t('params.singleImage', 'ảnh') : t('params.imageCountSuffix', 'ảnh');
  useEffect(() => {
    if (mode === 'video') return;
    if (count !== countValue) setCount(countValue);
    if (imageQualityOptions.length && !imageQualityOptions.includes(quality)) {
      setQuality(imageQualityOptions.includes('medium') ? 'medium' : imageQualityOptions[0]);
    }
    if (imageOutputFormatOptions.length && !imageOutputFormatOptions.includes(outputFormat)) {
      setOutputFormat(imageOutputFormatOptions.includes('png') ? 'png' : imageOutputFormatOptions[0]);
    }
    if (imageResolutionTierOptions.length && !imageResolutionTierOptions.some((item) => item.value === resolutionTier)) {
      setResolutionTier(imageResolutionTierOptions[0].value);
    }
    if (aspect !== 'custom' && !imageAspectOptions.some((item) => item.value === aspect)) {
      const nextAspect = imageAspectOptions.find((item) => item.value !== 'custom') || imageAspectOptions[0];
      if (nextAspect) {
        setAspect(nextAspect.value);
        if (nextAspect.value !== 'custom') setCustomSize(nextAspect.size);
      }
    }
    if (aspect === 'custom' && customSizeOptions.length && !customSizeOptions.some((item) => item.value === customSize)) {
      setCustomSize(customSizeOptions[0].value);
    }
  }, [
    mode,
    count,
    countValue,
    quality,
    outputFormat,
    resolutionTier,
    aspect,
    customSize,
    imageQualityOptions,
    imageOutputFormatOptions,
    imageResolutionTierOptions,
    imageAspectOptions,
    customSizeOptions
  ]);

  const canvasEdges = useMemo(() => {
    const edges = [];
    const seen = new Set();
    const pushEdge = (fromId, toId, type = 'lineage') => {
      if (!fromId || !toId || fromId === toId) return;
      const from = canvasNodeMap.get(fromId);
      const to = canvasNodeMap.get(toId);
      if (!from || !to) return;
      const id = `${fromId}-${toId}`;
      if (seen.has(id)) return;
      seen.add(id);
      edges.push({ id, from, to, type });
    };
    canvasNodes.forEach((node) => pushEdge(node.parentId, node.id, 'lineage'));
    canvasCustomLinks.forEach((link) => pushEdge(link.fromId, link.toId, 'custom'));
    return edges;
  }, [canvasNodes, canvasCustomLinks, canvasNodeMap]);
  const canvasLinkPreview = useMemo(() => {
    if (!canvasLinkDraft?.fromId) return null;
    const from = canvasNodeMap.get(canvasLinkDraft.fromId);
    if (!from) return null;
    return { from, point: canvasLinkDraft.point || null };
  }, [canvasLinkDraft, canvasNodeMap]);
  const childNodeIds = useMemo(() => {
    if (!selectedCanvasNodeId) return new Set();
    const ids = new Set();
    let changed = true;
    while (changed) {
      changed = false;
      for (const node of canvasNodes) {
        const isCustomChild = canvasCustomLinks.some((link) => link.toId === node.id && (link.fromId === selectedCanvasNodeId || ids.has(link.fromId)));
        if (!ids.has(node.id) && (node.parentId === selectedCanvasNodeId || ids.has(node.parentId) || isCustomChild)) {
          ids.add(node.id);
          changed = true;
        }
      }
    }
    return ids;
  }, [canvasNodes, canvasCustomLinks, selectedCanvasNodeId]);
  const parentNodeIds = useMemo(() => {
    if (!selectedCanvasNodeId) return new Set();
    const ids = new Set();
    const visit = (nodeId) => {
      const current = canvasNodeMap.get(nodeId);
      const parentIds = [
        current?.parentId,
        ...canvasCustomLinks.filter((link) => link.toId === nodeId).map((link) => link.fromId)
      ].filter(Boolean);
      parentIds.forEach((parentId) => {
        if (ids.has(parentId) || !canvasNodeMap.has(parentId)) return;
        ids.add(parentId);
        visit(parentId);
      });
    };
    visit(selectedCanvasNodeId);
    return ids;
  }, [canvasNodeMap, canvasCustomLinks, selectedCanvasNodeId]);
  const linkedNodeIds = useMemo(() => {
    if (!canvasLinkDraft?.fromId) return new Set();
    return new Set([
      canvasLinkDraft.fromId,
      ...canvasEdges
        .filter((edge) => edge.from.id === canvasLinkDraft.fromId || edge.to.id === canvasLinkDraft.fromId)
        .flatMap((edge) => [edge.from.id, edge.to.id])
    ]);
  }, [canvasEdges, canvasLinkDraft?.fromId]);
  const canvasPerformanceMode = canvasNodes.length >= CANVAS_PERFORMANCE_NODE_THRESHOLD || canvasEdges.length >= CANVAS_PERFORMANCE_EDGE_THRESHOLD;
  const visibleCanvasNodeIds = useMemo(() => {
    const zoom = canvasView.zoom || 1;
    const margin = CANVAS_VIRTUALIZATION_MARGIN;
    const viewportWidth = Math.max(1, canvasViewport.width || 1);
    const viewportHeight = Math.max(1, canvasViewport.height || 1);
    const ids = new Set();
    for (const node of canvasNodes) {
      if (!node?.id) continue;
      const screenLeft = viewportWidth / 2 + canvasView.x + Number(node.x || 0) * zoom;
      const screenTop = viewportHeight / 2 + canvasView.y + Number(node.y || 0) * zoom;
      const screenRight = screenLeft + nodeWidth(node) * zoom;
      const screenBottom = screenTop + nodeHeight(node) * zoom;
      const nearViewport = screenRight >= -margin
        && screenLeft <= viewportWidth + margin
        && screenBottom >= -margin
        && screenTop <= viewportHeight + margin;
      if (
        nearViewport
        || node.id === selectedCanvasNodeId
        || node.id === canvasEditorNodeId
        || linkedNodeIds.has(node.id)
      ) {
        ids.add(node.id);
      }
    }
    return ids;
  }, [
    canvasNodes,
    canvasView.x,
    canvasView.y,
    canvasView.zoom,
    canvasViewport.width,
    canvasViewport.height,
    selectedCanvasNodeId,
    canvasEditorNodeId,
    linkedNodeIds
  ]);
  const renderedCanvasEdges = useMemo(() => {
    if (!canvasPerformanceMode) return canvasEdges;
    return canvasEdges.filter((edge) => {
      const directlySelected = Boolean(selectedCanvasNodeId)
        && (edge.from.id === selectedCanvasNodeId || edge.to.id === selectedCanvasNodeId);
      return directlySelected
        || visibleCanvasNodeIds.has(edge.from.id)
        || visibleCanvasNodeIds.has(edge.to.id);
    });
  }, [canvasEdges, canvasPerformanceMode, visibleCanvasNodeIds, selectedCanvasNodeId, childNodeIds, parentNodeIds]);
  function canvasPlanePointFromEvent(event) {
    const eventTarget = event.currentTarget || event.target;
    const rect = eventTarget?.closest?.('.infiniteCanvas')?.getBoundingClientRect();
    const zoom = canvasView.zoom || 1;
    if (!rect) {
      return {
        x: CANVAS_PLANE_WIDTH / 2,
        y: CANVAS_PLANE_HEIGHT / 2
      };
    }
    return {
      x: (event.clientX - rect.left - rect.width / 2 - canvasView.x) / zoom + CANVAS_PLANE_WIDTH / 2,
      y: (event.clientY - rect.top - rect.height / 2 - canvasView.y) / zoom + CANVAS_PLANE_HEIGHT / 2
    };
  }
  function addCanvasCustomLink(fromId, toId) {
    if (!fromId || !toId || fromId === toId) return false;
    if (!canvasNodeMap.has(fromId) || !canvasNodeMap.has(toId)) return false;
    const toNode = canvasNodeMap.get(toId);
    const alreadyLinked = toNode?.parentId === fromId || canvasCustomLinks.some((link) => link.fromId === fromId && link.toId === toId);
    if (alreadyLinked) return false;
    const visited = new Set();
    const reachesFromTarget = (nodeId) => {
      if (!nodeId || visited.has(nodeId)) return false;
      if (nodeId === fromId) return true;
      visited.add(nodeId);
      return canvasEdges.some((edge) => edge.from.id === nodeId && reachesFromTarget(edge.to.id));
    };
    if (reachesFromTarget(toId)) {
      setStatus('error');
      setMessage(t('statusMessages.linkCycle', 'Liên kết này sẽ tạo thành vòng lặp. Hãy chọn hướng kết nối khác.'));
      window.setTimeout(() => setStatus('idle'), 1600);
      return false;
    }
    setCanvasCustomLinks((current) => [
      ...current,
      {
        id: `${fromId}-${toId}-${Date.now()}`,
        fromId,
        toId,
        createdAt: new Date().toISOString()
      }
    ]);
    setSelectedCanvasNodeId(toId);
    setStatus('success');
    setMessage(t('statusMessages.linkCreated', 'Đã tạo liên kết trên canvas.'));
    window.setTimeout(() => setStatus('idle'), 1200);
    return true;
  }

  function findCanvasLinkTarget(event, fromId) {
    const targetElement = document.elementFromPoint(event.clientX, event.clientY);
    const domNodeId = targetElement?.dataset?.nodeId || targetElement?.closest?.('.graphNode')?.dataset?.nodeId;
    if (domNodeId && domNodeId !== fromId && canvasNodeMap.has(domNodeId)) return domNodeId;

    const point = canvasPlanePointFromEvent(event);
    const threshold = 56 / (canvasView.zoom || 1);
    let closest = null;
    for (const node of canvasNodes) {
      if (!node?.id || node.id === fromId) continue;
      const portX = CANVAS_PLANE_WIDTH / 2 + Number(node.x || 0);
      const portY = CANVAS_PLANE_HEIGHT / 2 + Number(node.y || 0) + nodeHeight(node) * 0.48;
      const distance = Math.hypot(point.x - portX, point.y - portY);
      if (distance <= threshold && (!closest || distance < closest.distance)) {
        closest = { nodeId: node.id, distance };
      }
    }
    return closest?.nodeId || '';
  }

  function canvasEdgeLineageClass(edge) {
    if (!selectedCanvasNodeId) return 'idle';
    const fromSelected = edge.from.id === selectedCanvasNodeId;
    const toSelected = edge.to.id === selectedCanvasNodeId;
    const fromChild = childNodeIds.has(edge.from.id);
    const toChild = childNodeIds.has(edge.to.id);
    const fromParent = parentNodeIds.has(edge.from.id);
    const toParent = parentNodeIds.has(edge.to.id);

    if (toChild && (fromSelected || fromChild)) {
      return fromSelected ? 'active branchRoot' : 'active branchDown';
    }
    if ((toSelected && fromParent) || (fromParent && toParent)) {
      return toSelected ? 'active branchIntoSelected' : 'active branchUp';
    }
    if (fromSelected || toSelected) return 'active direct';
    return 'idle';
  }
  const draftParameters = () => ({
    aspect,
    aspectRatio: aspect,
    customSize,
    size,
    quality,
    resolutionTier,
    outputFormat,
    moderation,
    count: countValue
  });
  const videoDraftParameters = () => ({
    videoModel,
    videoAspect,
    videoAspectRatio: videoAspect,
    videoDuration,
    duration: videoDuration,
    videoFps,
    fps: videoFps,
    videoMotion,
    videoStyle,
    videoQuality,
    negativePrompt
  });

  function applyGenerationTaskSnapshot(task) {
    if (!task) return;
    setMode(task.mode);
    setPrompt(task.prompt);
    setModel(task.model || IMAGE_MODELS[0]);
    setAspect(normalizeAspect(task.aspect || task.aspectRatio, task.size));
    setCustomSize(normalizeSize(task.customSize || task.size));
    setQuality(normalizeQuality(task.quality));
    setResolutionTier(normalizeResolutionTier(task.resolutionTier));
    setOutputFormat(normalizeOutputFormat(task.outputFormat));
    setModeration(normalizeModeration(task.moderation));
    setCount(normalizeCount(task.count));
    setVideoModel(task.videoModel || VIDEO_MODELS[0]);
    setVideoAspect(normalizeVideoAspect(task.videoAspect || task.videoAspectRatio));
    setVideoDuration(normalizeVideoDuration(task.videoDuration || task.duration));
    setVideoFps(normalizeVideoFps(task.videoFps || task.fps));
    setVideoMotion(normalizeVideoMotion(task.videoMotion));
    setVideoStyle(normalizeVideoStyle(task.videoStyle));
    setVideoQuality(normalizeVideoQuality(task.videoQuality));
    setNegativePrompt(task.negativePrompt || '');
    setReferenceItems(Array.isArray(task.referenceItems) ? task.referenceItems : []);
    setVideoReferenceFiles(Array.isArray(task.videoReferenceFiles) ? task.videoReferenceFiles : []);
    setSelectedCanvasNodeId(task.selectedCanvasNodeId || '');
    updateLayoutSections({ bottomComposer: true, references: Boolean(task.referencesOpen) });
  }

  function applySessionSnapshot(sessionSnapshot) {
    if (!sessionSnapshot || typeof sessionSnapshot !== 'object') return;
    const parameters = sessionSnapshot.parameters || {};
    const nextMode = sessionSnapshot.mode || 'image';
    const nextSize = normalizeSize(parameters.size || parameters.customSize || customSize);
    setMode(nextMode);
    setPrompt(sessionSnapshot.prompt || '');
    setModel(sessionSnapshot.model || IMAGE_MODELS[0]);
    setAspect(normalizeAspect(parameters.aspect || parameters.aspectRatio, nextSize));
    setCustomSize(normalizeSize(parameters.customSize || nextSize));
    setQuality(normalizeQuality(parameters.quality));
    setResolutionTier(normalizeResolutionTier(parameters.resolutionTier));
    setOutputFormat(normalizeOutputFormat(parameters.outputFormat));
    setModeration(normalizeModeration(parameters.moderation));
    setCount(normalizeCount(parameters.count));
    setVideoModel(parameters.videoModel || VIDEO_MODELS[0]);
    setVideoAspect(normalizeVideoAspect(parameters.videoAspect || parameters.videoAspectRatio));
    setVideoDuration(normalizeVideoDuration(parameters.videoDuration || parameters.duration));
    setVideoFps(normalizeVideoFps(parameters.videoFps || parameters.fps));
    setVideoMotion(normalizeVideoMotion(parameters.videoMotion));
    setVideoStyle(normalizeVideoStyle(parameters.videoStyle));
    setVideoQuality(normalizeVideoQuality(parameters.videoQuality));
    setNegativePrompt(parameters.negativePrompt || '');
    setResults(Array.isArray(sessionSnapshot.results) ? sessionSnapshot.results : []);
    setVideoResults(Array.isArray(sessionSnapshot.videoResults) ? sessionSnapshot.videoResults : []);
    setResultBatchMeta(sessionSnapshot.resultBatchMeta || null);
    setCanvasNodes(Array.isArray(sessionSnapshot.canvasNodes) ? sessionSnapshot.canvasNodes : []);
    setCanvasCustomLinks(Array.isArray(sessionSnapshot.canvasCustomLinks) ? sessionSnapshot.canvasCustomLinks : []);
    const nextGenerationQueue = Array.isArray(sessionSnapshot.generationQueue)
      ? sessionSnapshot.generationQueue.map(serializeGenerationQueueItem).filter(Boolean).slice(-GENERATION_QUEUE_LIMIT)
      : [];
    generationQueueRef.current = nextGenerationQueue;
    setGenerationQueue(nextGenerationQueue);
    setSelectedCanvasNodeId(sessionSnapshot.selectedCanvasNodeId || '');
    setCanvasEditorNodeId(sessionSnapshot.canvasEditorNodeId || '');
    setCanvasLinkDraft(null);
    setCanvasView(sessionSnapshot.canvasView || { x: 0, y: 0, zoom: 1 });
    setAssistantMessages(Array.isArray(sessionSnapshot.assistantMessages)
      ? sessionSnapshot.assistantMessages.map(serializeAssistantMessage).filter(Boolean).slice(-24)
      : []);
    setPromptSuggestion(serializePromptSuggestion(sessionSnapshot.promptSuggestion));
    const hasRestorableServerJob = hasRestorableServerGeneration(sessionSnapshot);
    setStatus(sessionSnapshot.status === 'loading'
      ? hasRestorableServerJob ? 'loading' : 'error'
      : (sessionSnapshot.status || 'idle'));
    const interruptedHasResult = sessionSnapshot.status === 'loading' && (
      (Array.isArray(sessionSnapshot.results) && sessionSnapshot.results.length)
      || (Array.isArray(sessionSnapshot.videoResults) && sessionSnapshot.videoResults.length)
      || (Array.isArray(sessionSnapshot.canvasNodes) && sessionSnapshot.canvasNodes.length)
    );
    setMessage(sessionSnapshot.status === 'loading'
      ? hasRestorableServerJob
        ? 'Phát hiện máy chủ vẫn còn tác vụ tạo ảnh; đang tiếp tục đồng bộ trạng thái. Tải lại trang sẽ không làm mất hàng đợi.'
        : interruptedHasResult
        ? 'Yêu cầu tạo ảnh đang chạy trước khi tải lại trang; bản xem trước/khung vẽ đã nhận được vẫn được giữ lại. Hệ thống upstream có thể đã tính phí, hãy kiểm tra kết quả hoặc chờ thêm, đừng gửi lại ngay.'
        : 'Yêu cầu tạo ảnh đang chạy trước khi tải lại trang nhưng trang này đã ngắt theo dõi. Hệ thống upstream có thể đã tính phí; hãy kiểm tra lịch sử ảnh hoặc máy chủ trước khi quyết định thử lại.'
      : (sessionSnapshot.message || ''));
    setProgress(sessionSnapshot.status === 'loading'
      ? {
        ...(sessionSnapshot.progress || {}),
        stage: hasRestorableServerJob ? (sessionSnapshot.progress?.stage || 'upstream') : interruptedHasResult ? 'pending_review' : 'failed',
        percent: sessionSnapshot.progress?.percent || (hasRestorableServerJob ? 52 : 0)
      }
      : (sessionSnapshot.progress || { stage: 'idle', percent: 0, completed: 0, total: 1 }));
    setTiming(sessionSnapshot.timing || null);
  }

  useEffect(() => {
    if (!remoteSession) return;
    const remoteSessionMarker = remoteSession.updatedAt || sessionSnapshotComparePayload(remoteSession);
    if (!remoteSessionMarker) return;
    if (appliedRemoteSessionRef.current === remoteSessionMarker) return;
    const remoteUpdated = Date.parse(remoteSession.updatedAt) || 0;
    const localUpdated = Date.parse(currentSessionRef.current?.updatedAt || '') || 0;
    if (localUpdated && localUpdated > remoteUpdated && canvasNodes.length) return;
    appliedRemoteSessionRef.current = remoteSessionMarker;
    currentSessionRef.current = remoteSession;
    applySessionSnapshot(remoteSession);
  }, [remoteSession]);

  useEffect(() => {
    const element = workPreviewRef.current;
    if (!element) return undefined;
    const updateViewport = () => {
      const rect = element.getBoundingClientRect();
      setCanvasViewport((current) => {
        const width = Math.round(rect.width || current.width || 1200);
        const height = Math.round(rect.height || current.height || 720);
        if (current.width === width && current.height === height) return current;
        return { width, height };
      });
    };
    updateViewport();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateViewport);
      return () => window.removeEventListener('resize', updateViewport);
    }
    const observer = new ResizeObserver(updateViewport);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const protectedAssetUrl = (node) => {
      const url = String(node?.url || '');
      const persistedUrl = String(node?.persistedUrl || '');
      if (url.startsWith('/studio-api/history/') || url.startsWith('/studio-api/generation-jobs/')) return url;
      return '';
    };
    if (canvasPerformanceMode) return;
    const protectedNodes = canvasNodes
      .map((node) => ({ node, assetUrl: protectedAssetUrl(node) }))
      .filter((item) => item.assetUrl)
      .slice(0, CANVAS_PROTECTED_ASSET_RESOLVE_LIMIT);
    if (!protectedNodes.length || !isAuthenticated) return;
    let cancelled = false;
    const historyClient = new StudioHistoryClient({ session: loadSession() });
    Promise.all(protectedNodes.map(async ({ node, assetUrl }) => ({
      id: node.id,
      persistedUrl: assetUrl,
      url: await enqueueProtectedImageTask(() => historyClient.resolveAssetUrl(assetUrl)).catch(() => assetUrl)
    }))).then((resolved) => {
      if (cancelled) {
        revokeBlobUrls(resolved.map((item) => item.url));
        return;
      }
      const resolvedMap = new Map(resolved
        .filter((item) => item.url && !String(item.url).startsWith('/studio-api/'))
        .map((item) => [item.id, item]));
      if (!resolvedMap.size) return;
      setCanvasNodes((current) => current.map((node) => (
        resolvedMap.has(node.id)
          ? { ...node, persistedUrl: node.persistedUrl || resolvedMap.get(node.id).persistedUrl, url: resolvedMap.get(node.id).url }
          : node
      )));
    });
    return () => {
      cancelled = true;
    };
  }, [canvasNodes, isAuthenticated, canvasPerformanceMode, visibleCanvasNodeIds]);

  useEffect(() => {
    const snapshot = saveCurrentSession({
      sessionId,
      mode,
      prompt,
      model,
      results,
      videoResults,
      persistedResults: currentSessionRef.current?.persistedResults || [],
      persistedVideoResults: currentSessionRef.current?.persistedVideoResults || [],
      resultBatchMeta,
      canvasNodes,
      canvasCustomLinks,
      generationQueue,
      selectedCanvasNodeId,
      canvasEditorNodeId,
      canvasView,
      status,
      message,
      progress,
      timing,
      assistantMessages: assistantMessages.map(serializeAssistantMessage).filter(Boolean).slice(-24),
      promptSuggestion: serializePromptSuggestion(promptSuggestion),
      selectedCase: selectedCase ? {
        id: selectedCase.id,
        title: selectedCase.title,
        image: selectedCase.image || selectedCase.image_url || '',
        imageAlt: selectedCase.imageAlt,
        promptPreview: selectedCase.promptPreview,
        category: selectedCase.category
      } : null,
      parameters: {
        ...draftParameters(),
        ...videoDraftParameters()
      }
    });
    currentSessionRef.current = snapshot;
    const encodedSnapshot = sessionSnapshotComparePayload(snapshot);
    if (lastSessionSnapshotPayloadRef.current !== encodedSnapshot) {
      lastSessionSnapshotPayloadRef.current = encodedSnapshot;
      onSessionSnapshot?.(snapshot);
    }
  }, [
    sessionId,
    mode,
    prompt,
    model,
    results,
    videoResults,
    resultBatchMeta,
    canvasNodes,
    canvasCustomLinks,
    generationQueue,
    selectedCanvasNodeId,
    canvasEditorNodeId,
    canvasView,
    status,
    message,
    progress,
    timing,
    assistantMessages,
    promptSuggestion?.finalPrompt,
    promptSuggestion?.raw,
    selectedCase?.id,
    aspect,
    customSize,
    quality,
    resolutionTier,
    outputFormat,
    moderation,
    countValue,
    videoModel,
    videoAspect,
    videoDuration,
    videoFps,
    videoMotion,
    videoStyle,
    videoQuality,
    negativePrompt
  ]);

  useEffect(() => {
    if (restoredQueueStartedRef.current) return;
    if (!isReady) return;
    const hasRestorableQueuedTask = generationQueueRef.current.some((item) => (
      item.status === 'queued' && item.restored && item.restorable !== false && !item.remote
    ));
    if (!hasRestorableQueuedTask) return;
    restoredQueueStartedRef.current = true;
    setMessage(t('statusMessages.localQueueRestored', 'Đã khôi phục hàng đợi trên máy trước khi tải lại trang và tiếp tục xử lý.'));
    runGenerationQueue();
  }, [isReady]);

  useEffect(() => {
    const thread = composerThreadRef.current;
    if (!layoutSections.bottomComposer || !thread) return;
    thread.scrollTo({
      top: thread.scrollHeight,
      behavior: 'smooth'
    });
  }, [
    assistantMessages,
    promptSuggestion?.finalPrompt,
    promptSuggestion?.raw,
    status,
    progress.stage,
    generationQueue.length,
    layoutSections.bottomComposer,
    message
  ]);

  function toggleLayoutSection(key) {
    updateLayoutSections({ [key]: !layoutSections[key] });
  }

  function openParamPanel(panel) {
    setActiveParamPanel(panel);
    setLayoutSections((current) => {
      if (current.parameters && current.parametersRail === false) return current;
      const next = { ...current, parameters: true, parametersRail: false };
      saveWorkbenchLayout(next);
      return next;
    });
  }

  function setCanvasZoom(nextZoom) {
    setCanvasView((current) => ({
      ...current,
      zoom: Math.max(0.55, Math.min(1.8, typeof nextZoom === 'function' ? nextZoom(current.zoom) : nextZoom))
    }));
  }

  function resetCanvasView() {
    setCanvasView({ x: 0, y: 0, zoom: 1 });
  }

  useEffect(() => {
    function handleCanvasZoomShortcut(event) {
      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.altKey) return;
      if (event.target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      if (event.key === '-' || event.key === '_') {
        event.preventDefault();
        setCanvasZoom((value) => value - 0.1);
      } else if (event.key === '=' || event.key === '+') {
        event.preventDefault();
        setCanvasZoom((value) => value + 0.1);
      } else if (event.key === '0') {
        event.preventDefault();
        resetCanvasView();
      }
    }

    window.addEventListener('keydown', handleCanvasZoomShortcut);
    return () => window.removeEventListener('keydown', handleCanvasZoomShortcut);
  }, []);

  function startCanvasPan(event) {
    if (event.button !== 0) return;
    if (event.target.closest?.('button, a, video, input, select, textarea, .graphNode, .canvasPort')) return;
    if (canvasLinkDraft) setCanvasLinkDraft(null);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    canvasDragRef.current = {
      type: 'pan',
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: canvasView.x,
      originY: canvasView.y
    };
  }

  function moveCanvasPan(event) {
    const drag = canvasDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.type === 'node-resize') {
      resizeCanvasNode(event, drag);
      return;
    }
    if (drag.type === 'node-move') {
      moveCanvasNode(event, drag);
      return;
    }
    if (drag.type === 'link-create') {
      const point = canvasPlanePointFromEvent(event);
      setCanvasLinkDraft((current) => current?.fromId === drag.fromId ? {
        ...current,
        point
      } : current);
      return;
    }
    setCanvasView((current) => ({
      ...current,
      x: drag.originX + event.clientX - drag.startX,
      y: drag.originY + event.clientY - drag.startY
    }));
  }

  function endCanvasPan(event) {
    const drag = canvasDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.type === 'node-move' && drag.moved) {
      suppressCanvasClickRef.current = true;
      window.setTimeout(() => {
        suppressCanvasClickRef.current = false;
      }, 0);
    }
    if (drag.type === 'link-create') {
      const targetNodeId = findCanvasLinkTarget(event, drag.fromId);
      const linked = addCanvasCustomLink(drag.fromId, targetNodeId);
      const moved = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) >= CANVAS_DRAG_CLICK_TOLERANCE;
      if (linked || moved) {
        setCanvasLinkDraft(null);
      } else {
        setCanvasLinkDraft((current) => current?.fromId === drag.fromId ? { fromId: drag.fromId, point: null } : { fromId: drag.fromId, point: null });
        setMessage(t('statusMessages.linkTargetHint', 'Chọn chấm tròn bên trái của ảnh khác hoặc kéo ảnh đến mục tiêu để liên kết.'));
      }
    }
    canvasDragRef.current = null;
  }

  function nodeWidth(node) {
    return clamp(Number(node?.width) || CANVAS_NODE_WIDTH, CANVAS_NODE_MIN_WIDTH, CANVAS_NODE_MAX_WIDTH);
  }

  function nodeHeight(node) {
    return clamp(Number(node?.height) || CANVAS_NODE_HEIGHT, CANVAS_NODE_MIN_HEIGHT, CANVAS_NODE_MAX_HEIGHT);
  }

  function canvasViewForNodes(nodes = [], preferredId = '') {
    const visibleNodes = Array.isArray(nodes) ? nodes.filter(Boolean) : [];
    if (!visibleNodes.length) return { x: 0, y: 0, zoom: 1 };
    const preferred = preferredId ? visibleNodes.find((node) => node.id === preferredId) : null;
    const focusNodes = preferred ? [preferred] : visibleNodes;
    const left = Math.min(...focusNodes.map((node) => node.x));
    const top = Math.min(...focusNodes.map((node) => node.y));
    const right = Math.max(...focusNodes.map((node) => node.x + nodeWidth(node)));
    const bottom = Math.max(...focusNodes.map((node) => node.y + nodeHeight(node)));
    return {
      x: -((left + right) / 2),
      y: -((top + bottom) / 2),
      zoom: 1
    };
  }

  function focusCanvasOnNodes(nodes = canvasNodes, preferredId = selectedCanvasNodeId) {
    setCanvasView(canvasViewForNodes(nodes, preferredId));
  }

  function startCanvasNodeResize(event, node) {
    if (!node?.id || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    canvasDragRef.current = {
      type: 'node-resize',
      pointerId: event.pointerId,
      nodeId: node.id,
      startX: event.clientX,
      startY: event.clientY,
      originWidth: nodeWidth(node),
      originHeight: nodeHeight(node)
    };
    setSelectedCanvasNodeId(node.id);
  }

  function startCanvasNodeDrag(event, node) {
    if (!node?.id || event.button !== 0) return;
    if (event.target.closest?.('a, input, select, textarea, .canvasPort, .canvasNodeResize, .canvasInlineEditor, .canvasNodeToolbar, .canvasNodeContinue')) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    canvasDragRef.current = {
      type: 'node-move',
      pointerId: event.pointerId,
      nodeId: node.id,
      startX: event.clientX,
      startY: event.clientY,
      originX: Number(node.x) || 0,
      originY: Number(node.y) || 0,
      moved: false
    };
    setSelectedCanvasNodeId(node.id);
  }

  function resizeCanvasNode(event, drag) {
    const zoom = canvasView.zoom || 1;
    const nextWidth = clamp(
      drag.originWidth + (event.clientX - drag.startX) / zoom,
      CANVAS_NODE_MIN_WIDTH,
      CANVAS_NODE_MAX_WIDTH
    );
    const nextHeight = clamp(
      drag.originHeight + (event.clientY - drag.startY) / zoom,
      CANVAS_NODE_MIN_HEIGHT,
      CANVAS_NODE_MAX_HEIGHT
    );
    setCanvasNodes((current) => current.map((node) => (
      node.id === drag.nodeId
        ? { ...node, width: Math.round(nextWidth), height: Math.round(nextHeight) }
        : node
    )));
  }

  function moveCanvasNode(event, drag) {
    const zoom = canvasView.zoom || 1;
    const dx = (event.clientX - drag.startX) / zoom;
    const dy = (event.clientY - drag.startY) / zoom;
    if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) >= CANVAS_DRAG_CLICK_TOLERANCE) {
      drag.moved = true;
    }
    setCanvasNodes((current) => current.map((node) => (
      node.id === drag.nodeId
        ? {
          ...node,
          x: Math.round(drag.originX + dx),
          y: Math.round(drag.originY + dy)
        }
        : node
    )));
  }

  function startCanvasLink(event, node) {
    if (!node?.id || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const point = canvasPlanePointFromEvent(event);
    canvasDragRef.current = {
      type: 'link-create',
      pointerId: event.pointerId,
      fromId: node.id,
      startX: event.clientX,
      startY: event.clientY
    };
    setSelectedCanvasNodeId(node.id);
    setCanvasLinkDraft({ fromId: node.id, point });
    setStatus('idle');
    setMessage('');
  }

  function finishCanvasLink(event, node) {
    event.preventDefault();
    event.stopPropagation();
    const draft = canvasLinkDraft;
    if (!draft?.fromId) return;
    addCanvasCustomLink(draft.fromId, node.id);
    setCanvasLinkDraft(null);
    canvasDragRef.current = null;
  }

  function handleCanvasNodeMediaClick(event, node) {
    event.stopPropagation();
    if (suppressCanvasClickRef.current) return;
    selectCanvasNode(node);
  }

  function appendCanvasNodes(urls, { kind = 'image', parentId = '', promptText = '', title = 'Kết quả tạo ảnh', downloadMeta, replaceBatchId = '', persistedUrls = [] } = {}) {
    if (!urls.length) return;
    const activeDownloadMeta = downloadMeta || resultBatchMeta;
    setCanvasNodes((current) => {
      const retained = replaceBatchId
        ? current.filter((node) => node.downloadMeta?.id !== replaceBatchId)
        : current;
      const siblings = parentId ? retained.filter((node) => node.parentId === parentId).length : retained.filter((node) => !node.parentId).length;
      const parent = parentId ? retained.find((node) => node.id === parentId) : null;
      const parentWidth = nodeWidth(parent);
      const baseX = parent ? parent.x + parentWidth + CANVAS_NODE_HORIZONTAL_GAP : 0;
      const baseY = parent ? parent.y + (siblings - 0.5) * (CANVAS_NODE_HEIGHT + CANVAS_NODE_VERTICAL_GAP) : (retained.length % 4) * (CANVAS_NODE_HEIGHT + CANVAS_NODE_VERTICAL_GAP) - 250;
      const nextCanvasIndex = retained.reduce((max, node) => Math.max(max, Number(node.canvasIndex) || 0), 0) + 1;
      const nextNodes = urls.map((url, index) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${index}`,
        parentId,
        canvasIndex: nextCanvasIndex + index,
        kind,
        url,
        persistedUrl: persistedUrls[index] || '',
        prompt: promptText,
        downloadMeta: {
          mode: kind === 'video' ? 'video' : 'image',
          providerId: activeDownloadMeta?.providerId || '',
          createdAt: activeDownloadMeta?.createdAt || new Date().toISOString(),
          prompt: promptText,
          id: activeDownloadMeta?.id || ''
        },
        title: urls.length > 1 ? `${title} ${index + 1}` : title,
        x: baseX + index * 32,
        y: baseY + index * 42,
        width: CANVAS_NODE_WIDTH,
        height: CANVAS_NODE_HEIGHT,
        createdAt: new Date().toISOString()
      }));
      setSelectedCanvasNodeId(nextNodes[0]?.id || '');
      return [...retained, ...nextNodes];
    });
  }

  async function attachServerJobResult(historyClient, job, { silent = false } = {}) {
    const persistedUrls = Array.isArray(job?.resultUrls) ? job.resultUrls.filter(Boolean) : [];
    if (!job?.id || !persistedUrls.length || recoveredJobIdsRef.current.has(job.id)) return false;
    const currentNodes = Array.isArray(canvasNodesRef.current) ? canvasNodesRef.current : [];
    if (currentNodes.some((node) => node.downloadMeta?.id === job.id || persistedUrls.includes(node.persistedUrl || node.url))) {
      recoveredJobIdsRef.current.add(job.id);
      return false;
    }
    const displayUrls = await Promise.all(persistedUrls.map((url) => historyClient.resolveAssetUrl(url).catch(() => url)));
    if (sessionId !== job.sessionId) {
      revokeBlobUrls(displayUrls);
      return false;
    }
    appendCanvasNodes(displayUrls, {
      kind: 'image',
      parentId: job.parentCanvasNodeId || '',
      promptText: job.prompt || '',
      downloadMeta: {
        mode: 'image',
        providerId: job.model || '',
        createdAt: job.createdAt || new Date().toISOString(),
        prompt: job.prompt || '',
        id: job.id
      },
      title: 'Kết quả tạo ảnh',
      replaceBatchId: job.id,
      persistedUrls
    });
    setResults(displayUrls);
    setResultBatchMeta({
      mode: 'image',
      providerId: job.model || '',
      createdAt: job.createdAt || new Date().toISOString(),
      prompt: job.prompt || '',
      sessionId,
      id: job.id
    });
    recoveredJobIdsRef.current.add(job.id);
    clearRemoteGenerationJob(job.id, 'done');
    if (!silent) {
      setStatus('success');
      setProgress({ stage: 'completed', percent: 100, completed: displayUrls.length, total: displayUrls.length || 1 });
      setMessage(t('statusMessages.serverResultRestored', 'Đã khôi phục kết quả từ máy chủ.'));
    }
    return true;
  }

  function syncRemoteGenerationJob(job) {
    if (!job?.id) return;
    const existingTask = generationQueueRef.current.find((item) => item.serverJobId === job.id || item.id === `remote-${job.id}`);
    const inheritedPrompt = job.prompt || existingTask?.prompt || existingTask?.summary || '';
    const remoteStatus = job.status === 'succeeded'
      ? 'done'
      : job.status === 'failed'
        ? 'failed'
        : job.status === 'canceled'
          ? 'canceled'
          : job.status === 'unknown'
            ? 'unknown'
            : ['queued', 'dispatching'].includes(job.status)
              ? 'queued'
              : 'running';
    const remoteTask = {
      id: `remote-${job.id}`,
      serverJobId: job.id,
      remote: true,
      status: remoteStatus,
      createdAt: Date.parse(job.createdAt || '') || Date.now(),
      startedAt: Date.parse(job.startedAt || '') || null,
      completedAt: Date.parse(job.completedAt || '') || null,
      mode: job.mode || 'image',
      providerId: job.providerId || job.providerFamily || '',
      providerFamily: job.providerFamily || job.providerId || '',
      apiKeySource: job.apiKeySource || '',
      providerLabel: job.providerLabel || '',
      prompt: inheritedPrompt,
      model: job.model || IMAGE_MODELS[0],
      size: job.size || 'auto',
      quality: job.quality || 'auto',
      count: job.count || 1,
      stage: job.stage || job.status || '',
      completed: Number(job.completed || 0),
      total: Number(job.total || job.count || 1),
      resultUrls: Array.isArray(job.resultUrls) ? job.resultUrls.filter(Boolean).slice(0, 4) : [],
      requestIds: Array.isArray(job.requestIds) ? job.requestIds.filter(Boolean).slice(0, 8) : [],
      error: job.error || null,
      selectedCanvasNodeId: job.parentCanvasNodeId || '',
      summary: inheritedPrompt || job.error?.message || `Tác vụ máy chủ ${job.id}`,
      restorable: false
    };
    generationQueueRef.current = [
      remoteTask,
      ...generationQueueRef.current.filter((item) => item.id !== remoteTask.id && item.serverJobId !== job.id)
    ].slice(0, GENERATION_QUEUE_LIMIT);
    setGenerationQueue(generationQueueRef.current);
  }

  function clearRemoteGenerationJob(jobId, status = 'done') {
    if (!jobId) return;
    generationQueueRef.current = generationQueueRef.current.map((item) => (
      item.serverJobId === jobId || item.id === `remote-${jobId}`
        ? { ...item, status, completedAt: Date.now() }
        : item
    ));
    setGenerationQueue(generationQueueRef.current);
  }

  useEffect(() => {
    if (!remoteSessionReady || !sessionId) return;
    let cancelled = false;
    let syncController = null;
    const historyClient = new StudioHistoryClient({ session: loadSession() });
    historyClient.listGenerationJobs({ sessionId, limit: 12 })
      .then(async (jobs) => {
        if (cancelled) return;
        const knownJobIds = new Set(jobs.map((job) => job?.id).filter(Boolean));
        const restoredJobIds = generationQueueRef.current
          .filter((item) => item?.serverJobId && item.remote && ['queued', 'running'].includes(item.status))
          .map((item) => item.serverJobId)
          .filter((jobId) => !knownJobIds.has(jobId));
        if (restoredJobIds.length) {
          const restoredJobs = await Promise.all(restoredJobIds.map((jobId) => (
            historyClient.getGenerationJob(jobId).catch(() => null)
          )));
          if (cancelled) return;
          jobs = [
            ...jobs,
            ...restoredJobs.filter((job) => job?.id && !knownJobIds.has(job.id))
          ];
        }
        const visibleRemoteJobs = jobs.filter((job) => (
          ['queued', 'dispatching', 'upstream', 'saving', 'failed', 'unknown', 'canceled'].includes(job.status)
        ));
        visibleRemoteJobs.forEach(syncRemoteGenerationJob);
        const succeededJobs = jobs
          .filter((job) => job.status === 'succeeded' && Array.isArray(job.resultUrls) && job.resultUrls.length)
          .reverse();
        for (const job of succeededJobs) {
          if (cancelled) return;
          await attachServerJobResult(historyClient, job, { silent: true });
        }
        if (generationRef.current.controller) return;
        const activeJob = jobs.find((job) => ['queued', 'dispatching', 'upstream', 'saving'].includes(job.status));
        if (!activeJob || recoveredJobIdsRef.current.has(activeJob.id)) {
          const interruptedJob = jobs.find((job) => ['unknown', 'failed'].includes(job.status));
          if (interruptedJob && !recoveredJobIdsRef.current.has(interruptedJob.id)) {
            setStatus('error');
            setProgress(serverJobProgress(interruptedJob, interruptedJob.count));
            setMessage(serverJobMessage(interruptedJob));
          }
          return;
        }
        syncRemoteGenerationJob(activeJob);
        setStatus('loading');
        setProgress(serverJobProgress(activeJob, activeJob.count));
            setMessage(t('statusMessages.serverJobsSyncing', 'Máy chủ vẫn còn tác vụ tạo ảnh; đang đồng bộ trạng thái.'));
        const controller = new AbortController();
        syncController = controller;
        generationRef.current = { id: generationRef.current.id + 1, controller, remoteJobId: activeJob.id };
        try {
          const finalJob = await waitForServerJob(historyClient, activeJob.id, { signal: controller.signal, total: activeJob.count });
          if (cancelled || !finalJob) return;
          if (finalJob.status === 'succeeded') {
            await attachServerJobResult(historyClient, finalJob);
            clearRemoteGenerationJob(finalJob.id, 'done');
          } else {
            clearRemoteGenerationJob(finalJob.id, finalJob.status === 'canceled' ? 'canceled' : 'failed');
            setStatus('error');
            setMessage(serverJobMessage(finalJob));
          }
        } finally {
          if (generationRef.current.remoteJobId === activeJob.id) {
            generationRef.current = { id: generationRef.current.id, controller: null };
          }
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      syncController?.abort(new DOMException('Session changed', 'AbortError'));
    };
  }, [remoteSessionReady, persistenceKey, sessionId]);

  function composeCanvasContinuationPrompt(node, instruction) {
    const currentPrompt = String(instruction || '').trim();
    const parentPrompt = String(node?.prompt || '').trim();
    if (!currentPrompt) return parentPrompt;
    if (!parentPrompt || currentPrompt.startsWith(parentPrompt)) return currentPrompt;
    return `${parentPrompt}\n\nTiếp tục chỉnh sửa dựa trên khung vẽ #${node?.canvasIndex || ''}:\n${currentPrompt}`.trim();
  }

  function composedGenerationPrompt() {
    const currentPrompt = prompt.trim();
    if (!currentPrompt) return selectedCanvasNode?.prompt?.trim() || '';
    if (!selectedCanvasNode?.prompt) return currentPrompt;
    return composeCanvasContinuationPrompt(selectedCanvasNode, currentPrompt);
    const parentPrompt = selectedCanvasNode.prompt.trim();
    if (!parentPrompt || currentPrompt.startsWith(parentPrompt)) return currentPrompt;
    return `${parentPrompt}\n\nTiếp tục chỉnh sửa dựa trên khung vẽ ${selectedCanvasNode.canvasIndex || ''}: ${currentPrompt}`.trim();
  }

  function assistantBasePrompt() {
    return selectedCanvasNode?.prompt?.trim() || '';
  }

  function assistantUserInstruction() {
    return prompt.trim();
  }

  async function selectedCanvasReferenceFiles(node = selectedCanvasNode) {
    if (!node || node.kind === 'video' || !node.url) return [];
    try {
      const file = await imageUrlToFile(node.url, `canvas-${node.canvasIndex || 1}.png`);
      return [file];
    } catch (error) {
      throw new Error('Không thể đọc ảnh trên khung vẽ đã chọn làm ảnh tham chiếu. Hãy chọn lại nút ảnh hoặc mở ảnh từ lịch sử.');
    }
  }

  async function copyCanvasNodePrompt(node) {
    const text = node?.prompt?.trim();
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setStatus('success');
    setMessage(t('statusMessages.nodePromptCopied', 'Đã sao chép prompt của #{index}.', { index: node.canvasIndex || '' }));
    window.setTimeout(() => setStatus('idle'), 1200);
  }

  async function setCanvasNodeAsReference(node) {
    if (!node || node.kind === 'video' || !node.url) return;
    try {
      const file = await imageUrlToFile(node.url, `canvas-${node.canvasIndex || 1}.png`);
      setReferenceItems([createReferenceItem(file, 'identity')]);
      setSelectedCanvasNodeId(node.id);
      setMode('edit');
      updateLayoutSections({ references: true, bottomComposer: true });
      setStatus('success');
      setMessage(t('statusMessages.nodeReferenceSet', 'Đã đặt #{index} làm ảnh tham chiếu cho lượt này.', { index: node.canvasIndex || '' }));
      window.setTimeout(() => setStatus('idle'), 1200);
    } catch (error) {
      setStatus('error');
      setMessage(error?.message || t('statusMessages.nodeReferenceFailed', 'Chưa thể dùng ảnh này làm ảnh tham chiếu.'));
    }
  }

  function previewCanvasNode(node) {
    if (!node?.url) return;
    if (node.kind === 'video') {
      setPreviewVideo({
        url: node.url,
        index: Math.max(0, (node.canvasIndex || 1) - 1),
        downloadMeta: node.downloadMeta || null
      });
      return;
    }
    setPreviewImage({
      url: node.url,
      index: Math.max(0, (node.canvasIndex || 1) - 1),
      downloadMeta: node.downloadMeta || null
    });
  }

  function deleteCanvasNode(node) {
    if (!node?.id) return;
    const deletedIds = new Set([node.id]);
      setCanvasNodes((current) => {
        let changed = true;
        while (changed) {
        changed = false;
        for (const item of current) {
          if (!deletedIds.has(item.id) && deletedIds.has(item.parentId)) {
            deletedIds.add(item.id);
            changed = true;
          }
        }
      }
      return current.filter((item) => !deletedIds.has(item.id));
    });
    setCanvasCustomLinks((current) => current.filter((link) => !deletedIds.has(link.fromId) && !deletedIds.has(link.toId)));
    setCanvasLinkDraft((current) => current && deletedIds.has(current.fromId) ? null : current);
    if (deletedIds.has(selectedCanvasNodeId)) setSelectedCanvasNodeId('');
    if (deletedIds.has(canvasEditorNodeId)) closeCanvasEditor();
    setStatus('success');
    setMessage(t('statusMessages.nodeDeleted', 'Đã xóa #{index} khỏi canvas hiện tại.', { index: node.canvasIndex || '' }));
    window.setTimeout(() => setStatus('idle'), 1200);
  }

  function openCanvasEditor(node, nextMode = 'image') {
    if (!node) return;
    setSelectedCanvasNodeId(node.id);
    setCanvasEditorNodeId(node.id);
    setCanvasEditorMode(nextMode);
    setCanvasEditorPrompt('');
    setMode(nextMode);
    updateLayoutSections({
      bottomComposer: false,
      references: nextMode === 'mask'
    });
    setStatus('idle');
    setMessage('');
  }

  function closeCanvasEditor() {
    setCanvasEditorNodeId('');
    setCanvasEditorPrompt('');
  }

  function generateFromCanvasEditor(node, modeOverride = canvasEditorMode) {
    if (!node) return;
    const nextPrompt = canvasEditorPrompt.trim();
    const normalizedMode = modeOverride === 'mask' ? 'mask' : modeOverride === 'edit' ? 'edit' : 'image';
    const generationPrompt = normalizedMode === 'image'
      ? composeCanvasContinuationPrompt(node, nextPrompt)
      : nextPrompt;
    setSelectedCanvasNodeId(node.id);
    setMode(normalizedMode);
    if (normalizedMode === 'mask') {
      updateLayoutSections({ references: true, bottomComposer: false });
      setPrompt(generationPrompt);
      if (!maskEditorRef.current?.exportMask?.()) {
        setStatus('idle');
        setMessage(t('statusMessages.maskPaintRequired', 'Tô vùng cần vẽ lại trong bảng Mask rồi chọn Tạo trên ảnh này.'));
        return;
      }
    }
    setPrompt(generationPrompt);
    setPendingCanvasGenerate({
      nodeId: node.id,
      mode: normalizedMode,
      prompt: generationPrompt,
      referenceItems: [],
      referencesOpen: normalizedMode !== 'image',
      selectedCanvasNodeSnapshot: { ...node },
      requestId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    });
  }

  function generateMaskFromPanel() {
    if (!selectedCanvasNode) {
      setStatus('error');
      setMessage(t('statusMessages.maskSelectNode', 'Chọn một ảnh trên canvas trước khi tiếp tục tạo bằng Mask.'));
      return;
    }
    setCanvasEditorMode('mask');
    setCanvasEditorNodeId(selectedCanvasNode.id);
    generateFromCanvasEditor(selectedCanvasNode, 'mask');
  }

  function changeCanvasEditorMode(nextMode) {
    setCanvasEditorMode(nextMode);
    setMode(nextMode);
    updateLayoutSections({
      references: nextMode === 'mask',
      bottomComposer: false
    });
    setStatus('idle');
    setMessage('');
  }

  function selectCanvasNode(node) {
    setSelectedCanvasNodeId(node.id);
    setCanvasEditorNodeId(node.id);
    setCanvasEditorMode('image');
    setCanvasEditorPrompt('');
    const nextPrompt = node.prompt ? `Tiếp tục chỉnh sửa #${node.canvasIndex || ''}: ` : '';
    setPrompt(nextPrompt);
    updateLayoutSections({ bottomComposer: true });
    setMode((current) => current === 'video' ? 'video' : 'image');
    setStatus('idle');
    setMessage('');
  }

  function casePromptKey(item) {
    if (!item) return '';
    return `${item.kind || 'case'}:${item.id ?? item.title ?? item.promptPreview ?? ''}`;
  }

  function applySelectedCasePrompt(item, nextPrompt) {
    const key = casePromptKey(item);
    const value = nextPrompt || '';
    setPrompt((current) => {
      const applied = appliedCasePromptRef.current;
      const sameCase = applied.key === key;
      if (sameCase && current && current !== applied.prompt) return current;
      appliedCasePromptRef.current = { key, prompt: value };
      return value;
    });
  }

  useEffect(() => {
    if (activeWorkspace === 'video') {
      setMode('video');
      return;
    }
    if (mode === 'video') setMode('image');
  }, [activeWorkspace]);

  useEffect(() => {
    if (!selectedCase) return;
    if (selectedCase.kind === 'video-inspiration') {
      setMode('video');
      setVideoAspect(normalizeVideoAspect(selectedCase.videoAspect || selectedCase.videoAspectRatio));
      setVideoDuration(normalizeVideoDuration(selectedCase.videoDuration || selectedCase.duration));
      setVideoFps(normalizeVideoFps(selectedCase.videoFps || selectedCase.fps));
      setVideoMotion(normalizeVideoMotion(selectedCase.videoMotion));
      setVideoStyle(normalizeVideoStyle(selectedCase.videoStyle));
      setVideoQuality(normalizeVideoQuality(selectedCase.videoQuality));
      setPromptSuggestion(null);
      setPreviewImage(null);
      setVideoResults([]);
      setVideoTask(null);
      if (!selectedCase.prompt && selectedCase.id && onResolveCase) {
        const requestId = resolvingCaseRef.current.id + 1;
        resolvingCaseRef.current = { id: requestId };
        setCaseResolving(true);
        applySelectedCasePrompt(selectedCase, '');
        setNegativePrompt('');
        onResolveCase(selectedCase)
          .then((resolvedCase) => {
            if (resolvingCaseRef.current.id !== requestId || !resolvedCase) return;
            applySelectedCasePrompt(selectedCase, resolvedCase.prompt || '');
            setNegativePrompt(resolvedCase.negativePrompt || '');
            updateLayoutSections({ bottomComposer: true });
          })
          .catch((error) => {
            if (resolvingCaseRef.current.id !== requestId) return;
            setStatus('error');
            setMessage(error?.message || 'Không thể tải ý tưởng video.');
          })
          .finally(() => {
            if (resolvingCaseRef.current.id === requestId) setCaseResolving(false);
          });
        return;
      }
      applySelectedCasePrompt(selectedCase, selectedCase.prompt || '');
      setNegativePrompt(selectedCase.negativePrompt || '');
      if (selectedCase.prompt) updateLayoutSections({ bottomComposer: true });
      return;
    }
    if (!selectedCase.prompt && selectedCase.id && onResolveCase) {
      const requestId = resolvingCaseRef.current.id + 1;
      resolvingCaseRef.current = { id: requestId };
      setCaseResolving(true);
      applySelectedCasePrompt(selectedCase, selectedCase.promptPreview || '');
      onResolveCase(selectedCase)
        .then((resolvedCase) => {
          if (resolvingCaseRef.current.id !== requestId || !resolvedCase) return;
          applySelectedCasePrompt(selectedCase, resolvedCase.prompt || resolvedCase.promptPreview || '');
          updateLayoutSections({ bottomComposer: true });
          setPromptSuggestion(null);
          setPreviewImage(null);
        })
        .catch((error) => {
          if (resolvingCaseRef.current.id !== requestId) return;
          setStatus('error');
          setMessage(error?.message || 'Không thể tải chi tiết mẫu.');
        })
        .finally(() => {
          if (resolvingCaseRef.current.id === requestId) setCaseResolving(false);
        });
      return;
    }
    if (draftRef.current?.prompt) {
      setMode(draftRef.current.mode || 'image');
      appliedCasePromptRef.current = { key: '', prompt: '' };
      setPrompt(draftRef.current.prompt);
      setModel(draftRef.current.model || IMAGE_MODELS[0]);
      const nextSize = normalizeSize(draftRef.current.size || '1024x1024');
      setAspect(normalizeAspect(draftRef.current.aspect || draftRef.current.aspectRatio, nextSize));
      setCustomSize(normalizeSize(draftRef.current.customSize || nextSize));
      setQuality(normalizeQuality(draftRef.current.quality));
      setResolutionTier(normalizeResolutionTier(draftRef.current.resolutionTier));
      setOutputFormat(normalizeOutputFormat(draftRef.current.outputFormat));
      setModeration(normalizeModeration(draftRef.current.moderation));
      setCount(normalizeCount(draftRef.current.count));
      setVideoModel(draftRef.current.videoModel || VIDEO_MODELS[0]);
      setVideoAspect(normalizeVideoAspect(draftRef.current.videoAspect || draftRef.current.videoAspectRatio));
      setVideoDuration(normalizeVideoDuration(draftRef.current.videoDuration || draftRef.current.duration));
      setVideoFps(normalizeVideoFps(draftRef.current.videoFps || draftRef.current.fps));
      setVideoMotion(normalizeVideoMotion(draftRef.current.videoMotion));
      setVideoStyle(normalizeVideoStyle(draftRef.current.videoStyle));
      setVideoQuality(normalizeVideoQuality(draftRef.current.videoQuality));
      setNegativePrompt(draftRef.current.negativePrompt || '');
      updateLayoutSections({ bottomComposer: true });
      draftRef.current = null;
      clearDraft();
      return;
    }
    applySelectedCasePrompt(selectedCase, selectedCase?.prompt || selectedCase?.promptPreview || '');
    if (selectedCase?.prompt || selectedCase?.promptPreview) updateLayoutSections({ bottomComposer: true });
    setPromptSuggestion(null);
    setPreviewImage(null);
  }, [selectedCase]);

  useEffect(() => {
    if (!appendTemplateRequest?.prompt) return;
    setPrompt((current) => `${current.trim()}${current.trim() ? '\n\n' : ''}${appendTemplateRequest.prompt}`.trim());
    updateLayoutSections({ bottomComposer: true });
    setStatus('success');
    setMessage(t('statusMessages.templateAppended', 'Đã thêm prompt mẫu.'));
    window.setTimeout(() => setStatus('idle'), 1200);
    onAppendTemplateConsumed?.(appendTemplateRequest.id);
  }, [appendTemplateRequest?.id]);

  useEffect(() => {
    const previews = referenceItems.map((item) => filePreviewUrl(item.file));
    setReferencePreviews(previews);
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [referenceItems]);

  useEffect(() => () => {
    if (maskExportUrl) URL.revokeObjectURL(maskExportUrl);
  }, [maskExportUrl]);

  useEffect(() => {
    const previews = videoReferenceFiles.map(filePreviewUrl);
    setVideoReferencePreviews(previews);
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [videoReferenceFiles]);

  function appendReferenceImages(files) {
    const nextFiles = supportedReferenceFiles(files, IMAGE_REFERENCE_LIMIT);
    if (!nextFiles.length) {
      setStatus('error');
      setMessage(t('statusMessages.referenceUnsupported', 'Chỉ hỗ trợ ảnh tham chiếu PNG / JPG / WebP.'));
      return;
    }
    if (mode === 'image') setMode('edit');
    updateLayoutSections({ references: true });
    setReferenceItems((current) => [
      ...current,
      ...nextFiles.map((file, index) => createReferenceItem(file, current.length + index === 0 ? 'identity' : 'style'))
    ].slice(0, IMAGE_REFERENCE_LIMIT));
    setStatus('idle');
    setMessage('');
  }

  function appendVideoReferenceImage(files) {
    const nextFiles = supportedReferenceFiles(files, 1);
    if (!nextFiles.length) {
      setStatus('error');
      setMessage(t('statusMessages.referenceUnsupported', 'Chỉ hỗ trợ ảnh tham chiếu PNG / JPG / WebP.'));
      return;
    }
    setVideoReferenceFiles(nextFiles);
    updateLayoutSections({ references: true });
    setStatus('idle');
    setMessage('');
  }

  function referencePasteFiles(event) {
    const files = supportedReferenceFiles(event.clipboardData?.files, IMAGE_REFERENCE_LIMIT);
    if (!files.length) return;
    event.preventDefault();
    appendReferenceImages(files);
  }

  function videoReferencePasteFiles(event) {
    const files = supportedReferenceFiles(event.clipboardData?.files, 1);
    if (!files.length) return;
    event.preventDefault();
    appendVideoReferenceImage(files);
  }

  function removeReferenceImage(index) {
    setReferenceItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function clearReferenceImages() {
    setReferenceItems([]);
    if (maskExportUrl) {
      URL.revokeObjectURL(maskExportUrl);
      setMaskExportUrl('');
    }
  }

  function handleMaskExportReady(url) {
    if (maskExportUrl) URL.revokeObjectURL(maskExportUrl);
    setMaskExportUrl(url);
    setStatus('success');
    setMessage(t('statusMessages.maskExported', 'Đã xuất Mask, có thể dùng để vẽ lại một phần ảnh.'));
    window.setTimeout(() => setStatus('idle'), 1400);
  }

  function moveReferenceImage(index, direction) {
    setReferenceItems((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  function updateReferenceRole(index, role) {
    setReferenceItems((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, role } : item
    )));
  }

  function removeVideoReferenceImage() {
    setVideoReferenceFiles([]);
  }

  useEffect(() => {
    function handleWindowPaste(event) {
      const target = event.target;
      if (target?.closest?.('textarea, input:not([type="file"]), [contenteditable="true"]')) return;
      if (mode === 'edit' || mode === 'mask') {
        const files = supportedReferenceFiles(event.clipboardData?.files, IMAGE_REFERENCE_LIMIT);
        if (!files.length) return;
        event.preventDefault();
        appendReferenceImages(files);
      }
      if (mode === 'video') {
        const files = supportedReferenceFiles(event.clipboardData?.files, 1);
        if (!files.length) return;
        event.preventDefault();
        appendVideoReferenceImage(files);
      }
    }
    window.addEventListener('paste', handleWindowPaste);
    return () => window.removeEventListener('paste', handleWindowPaste);
  }, [mode]);

  useEffect(() => {
    if (!selectedHistory) return;
    if (activeWorkspace !== 'history') {
      setMode(activeWorkspace === 'video' ? 'video' : selectedHistory.mode === 'mask' ? 'mask' : selectedHistory.mode === 'edit' ? 'edit' : 'image');
    }
    const selectedResultItems = historyResultItems(selectedHistory);
    const primaryPrompt = selectedResultItems[0]?.generationPrompt || selectedResultItems[0]?.prompt || selectedHistory.prompt || '';
    setPrompt(primaryPrompt);
    setModel(selectedHistory.model || IMAGE_MODELS[0]);
    const nextSize = normalizeSize(selectedHistory.size || '1024x1024');
    setAspect(normalizeAspect(selectedHistory.aspect || selectedHistory.aspectRatio, nextSize));
    setCustomSize(normalizeSize(selectedHistory.customSize || nextSize));
    setQuality(normalizeQuality(selectedHistory.quality));
    setResolutionTier(normalizeResolutionTier(selectedHistory.resolutionTier));
    setOutputFormat(normalizeOutputFormat(selectedHistory.outputFormat));
    setModeration(normalizeModeration(selectedHistory.moderation));
    setCount(normalizeCount(selectedHistory.count));
    setVideoModel(selectedHistory.mode === 'video' ? selectedHistory.model || selectedHistory.videoModel || VIDEO_MODELS[0] : videoModel);
    setVideoAspect(normalizeVideoAspect(selectedHistory.videoAspect || selectedHistory.aspect || selectedHistory.aspectRatio));
    setVideoDuration(normalizeVideoDuration(selectedHistory.videoDuration || selectedHistory.duration));
    setVideoFps(normalizeVideoFps(selectedHistory.videoFps || selectedHistory.fps));
    setVideoMotion(normalizeVideoMotion(selectedHistory.videoMotion));
    setVideoStyle(normalizeVideoStyle(selectedHistory.videoStyle));
    setVideoQuality(normalizeVideoQuality(selectedHistory.videoQuality));
    setNegativePrompt(selectedHistory.negativePrompt || '');
    const nextUrls = selectedResultItems.length
      ? selectedResultItems.map((result) => result.displayUrl || result.url).filter(Boolean)
      : Array.isArray(selectedHistory.displayResultUrls)
        ? selectedHistory.displayResultUrls
        : Array.isArray(selectedHistory.resultUrls)
          ? selectedHistory.resultUrls
          : [];
    setResults(selectedHistory.mode === 'video' ? [] : nextUrls);
    setVideoResults(selectedHistory.mode === 'video' ? nextUrls : []);
    setResultBatchMeta(downloadMetaFromHistoryItem(selectedHistory, selectedHistory.mode === 'video'));
    if (nextUrls.length) {
      const nextNodes = (selectedResultItems.length ? selectedResultItems : nextUrls)
        .map((result, index) => buildCanvasNodeFromHistoryItem(selectedHistory, result, index));
      setCanvasNodes(nextNodes);
      setSelectedCanvasNodeId(nextNodes[0]?.id || '');
      setCanvasView(canvasViewForNodes(nextNodes, nextNodes[0]?.id || ''));
    }
    setStatus('idle');
    setPromptSuggestion(null);
    setProgress({ stage: 'idle', percent: 0, completed: 0, total: normalizeCount(selectedHistory.count) });
    setMessage('');
  }, [selectedHistory?.id]);

  useEffect(() => {
    if (!focusSignal || !canvasNodes.length) return;
    focusCanvasOnNodes(canvasNodes, selectedCanvasNodeId);
  }, [focusSignal]);

  useEffect(() => {
    if (!imageModelOptions.some((item) => item.id === model)) {
      setModel(imageModelOptions[0]?.id || IMAGE_MODELS[0]);
    }
    if (assistantModelOptions.length && !responseModelOptions.some((item) => item.id === providerSettings.responsesModel)) {
      onProviderChange({ ...providerSettings, responsesModel: responseModelOptions[0]?.id || providerSettings.responsesModel });
    }
  }, [modelOptions?.image, modelOptions?.responses]);

  useEffect(() => {
    if (syncedVideoModelOptions.length && !syncedVideoModelOptions.some((item) => item.id === videoModel)) {
      setVideoModel(syncedVideoModelOptions[0].id);
    }
  }, [modelOptions?.video]);

  useEffect(() => () => {
    generationRef.current.controller?.abort();
  }, []);

  useEffect(() => {
    if (!pendingCanvasGenerate) return;
    if (selectedCanvasNodeId !== pendingCanvasGenerate.nodeId) return;
    if (mode !== pendingCanvasGenerate.mode) return;
    if (prompt !== pendingCanvasGenerate.prompt) return;
    setPendingCanvasGenerate(null);
    closeCanvasEditor();
    enqueueGeneration({
      mode: pendingCanvasGenerate.mode,
      prompt: pendingCanvasGenerate.prompt,
      referenceItems: pendingCanvasGenerate.referenceItems,
      referencesOpen: pendingCanvasGenerate.referencesOpen,
      selectedCanvasNodeId: pendingCanvasGenerate.nodeId,
      selectedCanvasNodeSnapshot: pendingCanvasGenerate.selectedCanvasNodeSnapshot
    });
  }, [pendingCanvasGenerate?.requestId, selectedCanvasNodeId, mode, prompt]);

  useEffect(() => {
    if (!pendingSuggestionGenerate) return;
    if (prompt !== pendingSuggestionGenerate.prompt) return;
    setPendingSuggestionGenerate(null);
    enqueueGeneration();
  }, [pendingSuggestionGenerate?.requestId, prompt]);

  function applyCreativeRecipe(recipe) {
    if (!recipe) return;
    setMode((current) => current === 'video' ? current : current);
    const nextSize = normalizeSize(recipe.size);
    setAspect(normalizeAspect(recipe.aspect, nextSize));
    setCustomSize(nextSize);
    setQuality(normalizeQuality(recipe.quality));
    setResolutionTier(normalizeResolutionTier(recipe.resolutionTier));
    setActiveRecipeId(recipe.id);
    setPrompt((current) => {
      const base = stripCreativeRecipePrompt(current);
      if (!base) return recipe.prompt;
      if (base.includes(recipe.prompt)) return base;
      return `${base}\n\n${CREATIVE_RECIPE_PREFIX}${recipe.prompt}`;
    });
    setStatus('idle');
    setMessage('');
  }

  async function applyPromptPreset(item) {
    if (!item?.id) return;
    if (!isAuthenticated) {
      onRequireLogin();
      return;
    }
    setCaseResolving(true);
    try {
      const historyClient = new StudioHistoryClient({ session: loadSession() });
      const preset = await historyClient.getPromptPreset(item.id);
      if (preset?.prompt) {
        setPrompt(preset.prompt);
        updateLayoutSections({ bottomComposer: true });
      }
    } catch (error) {
      setStatus('error');
      setMessage(error?.message || 'Không thể tải prompt nhanh.');
    } finally {
      setCaseResolving(false);
    }
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  async function optimizeCurrentPrompt() {
    const currentPrompt = prompt.trim();
    if (!currentPrompt) {
      setStatus('error');
      setMessage(caseResolving
        ? t('statusMessages.templateLoading', 'Đang tải prompt mẫu, vui lòng đợi.')
        : t('statusMessages.promptRequired', 'Hãy nhập prompt hoặc chọn một nút trên canvas để tiếp tục.'));
      return;
    }
    if (caseResolving) {
      setStatus('error');
      setMessage(t('statusMessages.templateLoading', 'Đang tải prompt mẫu, vui lòng đợi.'));
      return;
    }
    if (optimizingPrompt) return;
    if (usesGatewayAccount(providerSettings) && !isAuthenticated) {
      saveDraft({
        caseId: selectedCase?.id || null,
        mode,
        prompt: currentPrompt,
        model,
        ...draftParameters(),
        ...videoDraftParameters()
      });
      onRequireLogin();
      return;
    }
    const providerRequest = resolveProviderRequest(providerSettings, apiKey);
    if (!providerRequest.apiKey) {
      setStatus('error');
      setMessage(providerSettings.apiKeySource === 'manual'
        ? t('statusMessages.keyRequired', 'Hãy nhập key.')
        : t('statusMessages.accountPreparing', 'Đang chuẩn bị kết nối tài khoản.'));
      onOpenSettings();
      return;
    }
    setOptimizingPrompt(true);
    setStatus('loading');
    setMessage(t('statusMessages.optimizingPrompt', 'Đang tối ưu prompt'));
    try {
      const result = await client.optimizePrompt({
        ...providerRequest,
        prompt: currentPrompt,
        instruction: promptInstruction.trim(),
        size,
        aspectRatio: aspect,
        quality,
        resolutionTier: RESOLUTION_TIER_LABELS[resolutionTier] || resolutionTier,
        onPartial: (text) => {
          const parsed = parseOptimizedPrompt(text);
          if (parsed) setPromptSuggestion(parsed);
          setMessage(t('statusMessages.receivingSuggestion', 'Đang nhận đề xuất chỉnh sửa'));
        }
      });
      setPromptSuggestion(parseOptimizedPrompt(result.prompt));
      setStatus('success');
      setMessage(t('statusMessages.suggestionReady', 'Đã có đề xuất tối ưu; bạn có thể ghép vào hoặc thay thế prompt.'));
      window.setTimeout(() => setStatus('idle'), 1200);
    } catch (error) {
      const errorMessage = error?.message || t('statusMessages.optimizeFailed', 'Tối ưu không thành công');
      setAssistantError({ message: errorMessage, model: error?.model || '' });
      setStatus('error');
      setMessage(errorMessage);
    } finally {
      setOptimizingPrompt(false);
    }
  }

  async function sendAssistantMessage() {
    const userText = assistantUserInstruction();
    setConversationOpen(true);
    if (!userText) {
      setStatus('error');
      setMessage(t('statusMessages.assistantInputRequired', 'Nhập ý tưởng bạn muốn AI giúp biên tập.'));
      return;
    }
    if (caseResolving) {
      setStatus('error');
      setMessage(t('statusMessages.templateLoading', 'Đang tải prompt mẫu, vui lòng đợi.'));
      return;
    }
    if (optimizingPrompt) return;
    if (usesGatewayAccount(providerSettings) && !isAuthenticated) {
      saveDraft({
        caseId: selectedCase?.id || null,
        mode,
        prompt: userText,
        model,
        ...draftParameters(),
        ...videoDraftParameters()
      });
      onRequireLogin();
      return;
    }
    const providerRequest = resolveProviderRequest(providerSettings, apiKey);
    if (!providerRequest.apiKey) {
      setStatus('error');
      setMessage(providerSettings.apiKeySource === 'manual'
        ? t('statusMessages.keyRequired', 'Hãy nhập key.')
        : t('statusMessages.accountPreparing', 'Đang chuẩn bị kết nối tài khoản.'));
      onOpenSettings();
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userText
    };
    const pendingMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: t('statusMessages.assistantPending', 'Đang biên tập prompt...'),
      pending: true
    };
    const nextMessages = [...assistantMessages, userMessage];
    setAssistantMessages([...nextMessages, pendingMessage]);
    setOptimizingPrompt(true);
    setStatus('loading');
    setMessage(t('statusMessages.assistantCalling', 'Đang gọi model hội thoại'));
    try {
      const result = await client.chatPromptAssistant({
        ...providerRequest,
        prompt: selectedCanvasNode ? userText : composedGenerationPrompt(),
        basePrompt: wantsPromptRewrite(userText) ? '' : assistantBasePrompt(),
        userInstruction: userText,
        selectedCanvasLabel: selectedCanvasNode ? `#${selectedCanvasNode.canvasIndex || ''}` : '',
        messages: nextMessages.map((item) => ({ role: item.role, content: item.content })),
        size,
        aspectRatio: aspect,
        quality,
        resolutionTier: RESOLUTION_TIER_LABELS[resolutionTier] || resolutionTier,
        onPartial: (text) => {
          const parsed = parseAssistantReply(text);
          setAssistantMessages((current) => current.map((item) => item.id === pendingMessage.id ? {
            ...item,
            content: parsed?.reply || text || t('statusMessages.assistantPending', 'Đang biên tập prompt...'),
            pending: true
          } : item));
        }
      });
      const parsed = parseAssistantReply(result.text);
      if (parsed?.finalPrompt) {
        setPromptSuggestion({
          finalPrompt: parsed.finalPrompt,
          raw: result.text
        });
      }
      setAssistantMessages((current) => current.map((item) => item.id === pendingMessage.id ? {
        ...item,
        content: parsed?.reply || result.text,
        finalPrompt: parsed?.finalPrompt || '',
        pending: false
      } : item));
      setStatus('success');
      setMessage(parsed?.finalPrompt
        ? t('statusMessages.assistantReady', 'Đã biên tập prompt có thể dùng để tạo ảnh.')
        : t('statusMessages.assistantReplied', 'Trợ lý đã trả lời.'));
      window.setTimeout(() => setStatus('idle'), 1200);
    } catch (error) {
      const errorMessage = error?.message || t('statusMessages.assistantFailed', 'Không gọi được model hội thoại');
      setAssistantMessages((current) => current.map((item) => item.id === pendingMessage.id ? {
        ...item,
        content: errorMessage,
        pending: false,
        failed: true
      } : item));
      setAssistantError({ message: errorMessage, model: error?.model || '' });
      setStatus('error');
      setMessage(errorMessage);
    } finally {
      setOptimizingPrompt(false);
    }
  }

  function mergeSuggestion() {
    const nextPrompt = promptSuggestion?.finalPrompt || promptSuggestion?.raw || '';
    if (!nextPrompt) return;
    setPrompt(`${prompt.trim()}\n\n${t('statusMessages.suggestionMergePrefix', 'Gợi ý bổ sung: ')}\n${nextPrompt}`.trim());
    setPromptSuggestion(null);
  }

  function replaceSuggestion() {
    const nextPrompt = promptSuggestion?.finalPrompt || promptSuggestion?.raw || '';
    if (!nextPrompt) return;
    setPrompt(nextPrompt);
    setPromptSuggestion(null);
  }

  async function copySuggestion() {
    const nextPrompt = promptSuggestion?.finalPrompt || promptSuggestion?.raw || '';
    if (!nextPrompt) return;
    await navigator.clipboard.writeText(nextPrompt);
    setStatus('success');
    setMessage(t('statusMessages.suggestionCopied', 'Đã sao chép đề xuất chỉnh sửa.'));
    window.setTimeout(() => setStatus('idle'), 1200);
  }

  function useSuggestionForGenerate() {
    const nextPrompt = promptSuggestion?.finalPrompt || promptSuggestion?.raw || '';
    if (!nextPrompt) return;
    setPrompt(nextPrompt);
    setPromptSuggestion(null);
    setPendingSuggestionGenerate({
      prompt: nextPrompt,
      requestId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    });
  }

  async function videoReferenceDataUrl() {
    const file = videoReferenceFiles[0];
    if (!file) return '';
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('REFERENCE_IMAGE_READ_FAILED'));
      reader.readAsDataURL(file);
    });
  }

  function buildGenerationTask(overrides = {}) {
    const basePrompt = typeof overrides.prompt === 'string' ? overrides.prompt : composedGenerationPrompt();
    const taskMode = overrides.mode || mode;
    const taskReferenceItems = Array.isArray(overrides.referenceItems) ? overrides.referenceItems : referenceItems;
    const taskSelectedCanvasNode = overrides.selectedCanvasNodeSnapshot
      || (selectedCanvasNode ? { ...selectedCanvasNode } : null);
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: 'queued',
      createdAt: Date.now(),
      mode: taskMode,
      prompt: basePrompt,
      model,
      aspect,
      aspectRatio: aspect,
      customSize,
      size,
      quality,
      resolutionTier,
      outputFormat,
      moderation,
      count: countValue,
      videoModel,
      videoAspect,
      videoAspectRatio: videoAspect,
      videoDuration,
      duration: videoDuration,
      videoFps,
      fps: videoFps,
      videoMotion,
      videoStyle,
      videoQuality,
      negativePrompt,
      referenceItems: taskReferenceItems,
      videoReferenceFiles,
      maskFile: taskMode === 'mask' ? maskEditorRef.current?.exportMask?.() || null : null,
      selectedCanvasNodeId: overrides.selectedCanvasNodeId ?? selectedCanvasNodeId,
      selectedCanvasNodeSnapshot: taskSelectedCanvasNode,
      referencesOpen: overrides.referencesOpen ?? layoutSections.references,
    summary: basePrompt || prompt.trim() || selectedCanvasNode?.prompt?.trim() || 'Chưa nhập prompt'
    };
  }

  function markGenerationTask(id, patch) {
    generationQueueRef.current = generationQueueRef.current.map((item) => (
      item.id === id ? { ...item, ...patch } : item
    ));
    setGenerationQueue(generationQueueRef.current);
  }

  function cancelGenerationTask(id) {
    const target = generationQueueRef.current.find((item) => item.id === id);
    if (!target) return;
    if (target.remote && target.serverJobId) {
      const historyClient = new StudioHistoryClient({ session: loadSession() });
      if (generationRef.current.remoteJobId === target.serverJobId) {
        generationRef.current.controller?.abort(new Error('JOB_CANCELED'));
        generationRef.current = { id: generationRef.current.id + 1, controller: null };
      }
      markGenerationTask(id, { status: 'canceled', completedAt: Date.now() });
      setStatus('error');
      setProgress((current) => ({
        ...current,
        stage: 'failed',
        percent: 0
      }));
      historyClient.cancelGenerationJob(target.serverJobId)
        .then((job) => {
          setMessage(serverJobMessage(job || { status: 'canceled' }));
        })
        .catch(() => {
          setMessage(t('statusMessages.queueCancelFailed', 'Đã xóa mục khỏi hàng đợi trên trang nhưng không hủy được ở máy chủ. Hãy kiểm tra lịch sử ảnh sau.'));
        });
      return;
    }
    if (target.status === 'running') {
      stopGeneration();
      return;
    }
    generationQueueRef.current = generationQueueRef.current.map((item) => (
      item.id === id ? { ...item, status: 'canceled', completedAt: Date.now() } : item
    ));
    setGenerationQueue(generationQueueRef.current);
    setMessage(t('statusMessages.queueCanceled', 'Đã hủy tác vụ đang chờ.'));
  }

  function retryGenerationTask(id) {
    const target = generationQueueRef.current.find((item) => item.id === id);
    if (!target) return;
    if (target.remote || target.restorable === false) {
      setStatus('error');
      setMessage(t('statusMessages.queueRemoteRetryBlocked', 'Không thể tự động gửi lại an toàn tác vụ được khôi phục từ máy chủ. Hãy kiểm tra lịch sử ảnh trước; nếu chưa có kết quả mới, tạo ảnh lại bằng prompt hiện tại.'));
      return;
    }
    const retryTask = {
      ...target,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: 'queued',
      createdAt: Date.now(),
      startedAt: null,
      completedAt: null,
      restored: false,
      summary: target.prompt || target.summary || t('statusMessages.queueRetryFallbackSummary', 'Thử lại tác vụ tạo ảnh')
    };
    generationQueueRef.current = [
      retryTask,
      ...generationQueueRef.current.filter((item) => item.id !== id)
    ].slice(0, GENERATION_QUEUE_LIMIT);
    setGenerationQueue(generationQueueRef.current);
    setMessage(t('statusMessages.queueRetryAdded', 'Đã thêm lại vào hàng đợi tạo ảnh.'));
    runGenerationQueue();
  }

  function acknowledgeGenerationTask(id) {
    const target = generationQueueRef.current.find((item) => item.id === id);
    generationQueueRef.current = generationQueueRef.current.filter((item) => item.id !== id);
    setGenerationQueue(generationQueueRef.current);
    if (target?.status === 'unknown') {
      setMessage(t('statusMessages.queueUnknownDismissed', 'Đã ẩn tác vụ chưa rõ kết quả. Hãy kiểm tra lịch sử ảnh sau; nếu chưa có ảnh mới thì thử lại.'));
    } else {
      setMessage(t('statusMessages.queueDismissed', 'Đã ẩn thông báo hàng đợi.'));
    }
  }

  function enqueueGeneration(overrides = {}) {
    const task = buildGenerationTask(overrides);
    if (!task.prompt) {
      setStatus('error');
      setMessage(caseResolving
        ? t('statusMessages.templateLoading', 'Đang tải prompt mẫu, vui lòng đợi.')
        : t('statusMessages.promptRequired', 'Hãy nhập prompt hoặc chọn một nút trên canvas để tiếp tục.'));
      return;
    }
    const activeCount = generationQueueRef.current.filter((item) => item.status === 'queued' || item.status === 'running').length;
    if (activeCount >= GENERATION_QUEUE_LIMIT) {
      setStatus('error');
      setMessage(t('statusMessages.queueLimit', 'Hàng đợi đã đầy, tối đa {count} tác vụ chờ.', { count: GENERATION_QUEUE_LIMIT }));
      return;
    }
    generationQueueRef.current = [...generationQueueRef.current, task].slice(-GENERATION_QUEUE_LIMIT);
    setGenerationQueue(generationQueueRef.current);
    setMessage(activeCount
      ? t('statusMessages.queueAddedBehind', 'Đã thêm vào hàng đợi; còn {count} tác vụ phía trước.', { count: activeCount })
      : t('statusMessages.queueAdded', 'Đã thêm vào hàng đợi.'));
    runGenerationQueue();
  }

  async function runGenerationQueue() {
    if (generationQueueRunnerRef.current) return;
    generationQueueRunnerRef.current = true;
    try {
      while (true) {
        const nextTask = generationQueueRef.current.find((item) => item.status === 'queued');
        if (!nextTask) break;
        if (nextTask.remote || nextTask.restorable === false) {
          markGenerationTask(nextTask.id, {
            status: 'failed',
            completedAt: Date.now(),
            summary: `${nextTask.summary || nextTask.prompt || t('composer.queue', 'Hàng đợi tạo ảnh')}${t('statusMessages.queueRestoredUnsafeSuffix', ' (không thể tự động gửi lại an toàn sau khi tải lại trang)')}`
          });
          continue;
        }
        markGenerationTask(nextTask.id, { status: 'running', startedAt: Date.now() });
        applyGenerationTaskSnapshot(nextTask);
        await new Promise((resolve) => window.setTimeout(resolve, 0));
        const succeeded = await generate({ fromQueue: true, queueTaskId: nextTask.id, task: nextTask, maskFile: nextTask.maskFile || null });
        markGenerationTask(nextTask.id, {
          status: succeeded ? 'done' : 'failed',
          completedAt: Date.now()
        });
        if (!succeeded) break;
      }
    } finally {
      generationQueueRunnerRef.current = false;
    }
  }

  async function generationFilesForJob(files) {
    const source = Array.isArray(files) ? files.slice(0, IMAGE_REFERENCE_LIMIT) : [];
    return Promise.all(source.map(async (file, index) => ({
      name: file?.name || `reference-${index + 1}.png`,
      type: file?.type || 'image/png',
      dataUrl: await fileToDataUrl(file)
    })));
  }

  function serverJobProgress(job, fallbackTotal = 1) {
    const total = Math.max(1, Number(job?.total || job?.count || fallbackTotal || 1));
    const completed = Math.max(0, Number(job?.completed || 0));
    const stage = job?.stage || job?.status || 'queued';
    const basePercent = {
      queued: 12,
      dispatching: 22,
      upstream: 52,
      saving: 88,
      succeeded: 100,
      failed: 0,
      canceled: 0,
      unknown: 12
    }[stage] ?? 18;
    return {
      stage,
      completed,
      total,
      percent: stage === 'upstream' && total > 1
        ? Math.min(96, Math.max(basePercent, Math.round((completed / total) * 86)))
        : basePercent
    };
  }

  function serverJobMessage(job) {
    const status = job?.status || job?.stage;
    if (status === 'queued') return t('jobs.queued', 'Yêu cầu đã vào hàng đợi máy chủ; trạng thái vẫn được giữ sau khi tải lại trang.');
    if (status === 'dispatching') return t('jobs.dispatching', 'Máy chủ đang gửi yêu cầu đến gateway.');
    if (status === 'upstream') return t('jobs.upstream', 'Dịch vụ nguồn đang tạo ảnh; máy chủ sẽ tiếp tục chờ và lưu kết quả.');
    if (status === 'saving') return t('jobs.saving', 'Đang lưu kết quả.');
    if (status === 'succeeded') return t('jobs.succeeded', 'Đã tạo xong và lưu kết quả trên máy chủ.');
    if (status === 'unknown') return t('jobs.unknown', 'Máy chủ ngừng chờ trước khi nhận kết quả. Hãy kiểm tra lịch sử ảnh rồi quyết định có thử lại không.');
    if (status === 'canceled') return t('jobs.canceled', 'Tác vụ đã được hủy tại máy này.');
    if (status === 'failed') return generationErrorMessage({
      ...(job?.error || {}),
      message: job?.error?.message || 'GENERATION_JOB_FAILED',
      status: job?.error?.status,
      requestId: job?.error?.requestId || job?.requestIds?.[0] || ''
    }, t);
    return t('jobs.processing', 'Máy chủ đang xử lý tác vụ.');
  }

  async function waitForServerJob(historyClient, jobId, { signal, total }) {
    let latest = await historyClient.getGenerationJob(jobId);
    while (latest && !['succeeded', 'failed', 'unknown', 'canceled'].includes(latest.status)) {
      setProgress(serverJobProgress(latest, total));
      setMessage(serverJobMessage(latest));
      await delay(1400, signal);
      latest = await historyClient.getGenerationJob(jobId);
    }
    if (latest) {
      setProgress(serverJobProgress(latest, total));
      setMessage(serverJobMessage(latest));
    }
    return latest;
  }

  async function generate(options = {}) {
    const task = options.task || null;
    const activeMode = task?.mode || mode;
    const configuredImageModel = String(providerSettings.imageGenerationModel || '').trim();
    const configuredEditModel = String(providerSettings.imageEditModel || '').trim();
    const configuredVideoModel = String(providerSettings.videoModel || '').trim();
    const activeModel = task?.model
      || ((activeMode === 'edit' || activeMode === 'mask') ? configuredEditModel : configuredImageModel)
      || model;
    const activePrompt = task?.prompt || composedGenerationPrompt();
    const activeSelectedNode = task?.selectedCanvasNodeSnapshot || selectedCanvasNode;
    const activeLineageParentId = activeSelectedNode?.id || '';
    const activeReferenceFiles = task?.referenceItems?.map((item) => item.file).filter(Boolean) || referenceFiles;
    const activeVideoReferenceFiles = task?.videoReferenceFiles || videoReferenceFiles;
    const activeIsImageEditMode = activeMode === 'edit' || activeMode === 'mask';
    const activeSize = task?.size || size;
    const activeQuality = task?.quality || quality;
    const activeResolutionTier = task?.resolutionTier || resolutionTier;
    const activeOutputFormat = task?.outputFormat || outputFormat;
    const activeModeration = task?.moderation || moderation;
    const providerAdapter = resolveProviderAdapter({
      providerId: providerSettings.providerId,
      authMode: providerSettings.apiKeySource
    });
    const activeImageParameters = providerAdapter.normalizeImageParameters({
      size: activeSize,
      quality: activeQuality,
      resolutionTier: activeResolutionTier,
      outputFormat: activeOutputFormat,
      moderation: activeModeration,
      count: task?.count || countValue,
      n: task?.count || countValue
    });
    const normalizedActiveSize = activeImageParameters.size;
    const normalizedActiveQuality = activeImageParameters.quality;
    const normalizedActiveResolutionTier = activeImageParameters.resolutionTier;
    const normalizedActiveOutputFormat = activeImageParameters.outputFormat;
    const normalizedActiveModeration = activeImageParameters.moderation;
    const activeCount = normalizeCount(activeImageParameters.count);
    const activeVideoModel = task?.videoModel || configuredVideoModel || videoModel;
    const activeVideoAspect = task?.videoAspect || videoAspect;
    const activeVideoDuration = normalizeVideoDuration(task?.videoDuration || task?.duration || videoDuration);
    const activeVideoFps = normalizeVideoFps(task?.videoFps || task?.fps || videoFps);
    const activeVideoMotion = task?.videoMotion || videoMotion;
    const activeVideoStyle = task?.videoStyle || videoStyle;
    const activeVideoQuality = task?.videoQuality || videoQuality;
    const activeNegativePrompt = task?.negativePrompt || negativePrompt;
    const activeVideoSize = videoSizeFromAspect(activeVideoAspect);
    if (caseResolving) {
      setStatus('error');
      setMessage(t('statusMessages.templateLoading', 'Đang tải prompt mẫu, vui lòng đợi.'));
      return false;
    }
    if (status === 'loading' && !generationRef.current.controller) {
      setStatus('error');
      setProgress((current) => ({ ...current, stage: 'pending_review', percent: current.percent || 0 }));
      setMessage(t('statusMessages.disconnectedReview', 'Trạng thái tạo của lượt trước đã bị ngắt. Hãy kiểm tra lịch sử ảnh và canvas để chắc chắn chưa có kết quả mới rồi mới chọn “Xác nhận thử lại”.'));
      return false;
    }
    if (progress.stage === 'pending_review') {
      setProgress({ stage: 'idle', percent: 0, completed: 0, total: activeCount });
      setMessage('');
    }
    const basePrompt = activePrompt;
    const lineageParentId = activeLineageParentId;
    if (!basePrompt) {
      setStatus('error');
      setMessage(caseResolving
        ? t('statusMessages.templateLoading', 'Đang tải prompt mẫu, vui lòng đợi.')
        : t('statusMessages.promptRequired', 'Hãy nhập prompt hoặc chọn một nút trên canvas để tiếp tục.'));
      return false;
    }
    const willUseCanvasReference = Boolean(activeSelectedNode && activeSelectedNode.kind !== 'video' && activeSelectedNode.url && (activeMode === 'edit' || activeMode === 'mask'));
    if (activeIsImageEditMode && !activeReferenceFiles.length && !willUseCanvasReference) {
      setStatus('error');
      setMessage(activeMode === 'mask'
        ? t('statusMessages.maskModeReferenceRequired', 'Hãy tải ảnh tham chiếu lên trong chế độ Mask.')
        : t('statusMessages.referenceRequired', 'Hãy tải ảnh tham chiếu lên.'));
      return false;
    }
    let maskFile = null;
    if (activeMode === 'mask') {
      maskFile = options.maskFile || maskEditorRef.current?.exportMask?.() || null;
      if (!maskFile) {
        setStatus('error');
        setMessage(t('statusMessages.maskEditorRequired', 'Tải ảnh tham chiếu lên và tô vùng cần vẽ lại trong trình chỉnh sửa Mask.'));
        return false;
      }
    }
    if (usesGatewayAccount(providerSettings) && !isAuthenticated) {
      saveDraft({
        caseId: selectedCase?.id || null,
        mode: activeMode,
        prompt: basePrompt,
        model: activeModel,
        ...draftParameters(),
        ...videoDraftParameters()
      });
      onRequireLogin();
      return false;
    }
    const providerRequest = resolveProviderRequest(providerSettings, apiKey);
    if (!providerRequest.apiKey) {
      setStatus('error');
      setMessage(providerSettings.apiKeySource === 'manual'
        ? t('statusMessages.keyRequired', 'Hãy nhập key.')
        : t('statusMessages.accountPreparing', 'Đang chuẩn bị kết nối tài khoản.'));
      onOpenSettings();
      return false;
    }

    generationRef.current.controller?.abort();
    const requestId = generationRef.current.id + 1;
    const controller = new AbortController();
    const startedAt = Date.now();
    const generationId = `${startedAt}-${Math.random().toString(36).slice(2, 8)}`;
    const generationMeta = {
      mode: activeMode === 'video' ? 'video' : 'image',
      providerId: activeMode === 'video'
        ? activeVideoModel
        : activeModel,
      createdAt: new Date(startedAt).toISOString(),
      prompt: basePrompt,
      size: activeSize,
      quality: activeQuality,
      resolutionTier: activeResolutionTier,
      outputFormat: activeOutputFormat,
      sessionId,
      id: generationId
    };
    let firstByteAt = null;
    let timeoutReached = false;
    generationRef.current = { id: requestId, controller };
    const isCurrentRequest = () => generationRef.current.id === requestId;
    const stallTimer = window.setTimeout(() => {
      if (!isCurrentRequest() || firstByteAt) return;
      setMessage(t('statusMessages.upstreamStall', 'Dịch vụ nguồn chưa trả dữ liệu, có thể yêu cầu đang xếp hàng hoặc xử lý chậm. Hãy tiếp tục chờ.'));
      setProgress((current) => current.stage === 'request' ? { ...current, stage: 'queued', percent: Math.max(current.percent || 0, 12) } : current);
    }, GENERATION_STALL_NOTICE_MS);
    const timeoutTimer = window.setTimeout(() => {
      if (!isCurrentRequest()) return;
      timeoutReached = true;
      generationRef.current = { id: requestId + 1, controller: null };
      setStatus('error');
      setProgress((current) => ({
        ...current,
        stage: 'pending_review',
        percent: Math.max(current.percent || 0, 12)
      }));
      setMessage(t('errors.timeout', 'Trang đã chờ quá lâu và ngừng chờ; điều này không có nghĩa dịch vụ nguồn đã hủy yêu cầu. Yêu cầu có thể vẫn đang xử lý, xếp hàng hoặc đã phát sinh phí. Hãy kiểm tra lịch sử ảnh và canvas rồi quyết định có thử lại không.'));
      const timeoutError = new Error('GENERATION_TIMEOUT');
      timeoutError.code = 'GENERATION_TIMEOUT';
      controller.abort(timeoutError);
    }, GENERATION_TIMEOUT_MS);

    setStatus('loading');
    setResultBatchMeta(generationMeta);
    setProgress({ stage: 'request', percent: 8, completed: 0, total: activeCount });
    setTiming({
      status: 'running',
      startedAt,
      firstByteAt: null,
      completedAt: null,
      model: activeMode === 'video' ? activeVideoModel : activeModel,
      spec: activeMode === 'video' ? `${activeVideoAspect} · ${activeVideoDuration}s · ${activeVideoFps}fps` : `${normalizedActiveSize} · ${normalizedActiveQuality} · ${RESOLUTION_TIER_LABELS[normalizedActiveResolutionTier] || normalizedActiveResolutionTier}`
    });
    setMessage(t('statusMessages.submitted', 'Đã gửi'));
    try {
      if (activeMode === 'video') {
        if (!hasSyncedVideoModels || !activeVideoModel) {
          const failedAt = Date.now();
          setStatus('error');
          setProgress({ stage: 'failed', percent: 0, completed: 0, total: 1 });
          setTiming((current) => current ? { ...current, status: 'failed', completedAt: failedAt } : current);
          setMessage(modelsStatus === 'loading'
            ? t('statusMessages.videoModelsLoadingWait', 'Đang tải model video cho key hiện tại, vui lòng đợi.')
            : t('statusMessages.videoModelsUnavailable', 'Key hiện tại chưa được cấp quyền dùng model video.'));
          return false;
        }
        const referenceImage = activeVideoReferenceFiles[0]
          ? await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(new Error('REFERENCE_IMAGE_READ_FAILED'));
            reader.readAsDataURL(activeVideoReferenceFiles[0]);
          })
          : '';
        if (!isCurrentRequest()) return false;
        const payload = await client.generateVideo({
          ...providerRequest,
          model: activeVideoModel,
          prompt: basePrompt,
          image: referenceImage,
          duration: activeVideoDuration,
          width: activeVideoSize.width,
          height: activeVideoSize.height,
          fps: activeVideoFps,
          n: 1,
          metadata: {
            aspect_ratio: activeVideoAspect,
            camera_motion: activeVideoMotion,
            style: activeVideoStyle,
            quality_level: activeVideoQuality,
            negative_prompt: activeNegativePrompt.trim(),
            source: 'ai-image-workbench'
          },
          signal: controller.signal,
          onProgress: (nextProgress) => {
            if (!isCurrentRequest()) return;
            if (!firstByteAt && nextProgress.stage && nextProgress.stage !== 'request') {
              firstByteAt = Date.now();
              setTiming((current) => current ? { ...current, firstByteAt } : current);
            }
            setVideoTask(nextProgress.task || null);
            setProgress((current) => ({ ...current, ...nextProgress }));
            setMessage(progressText(nextProgress, t('progress.videoGenerating', 'Đang tạo video')));
          }
        });
        if (!isCurrentRequest()) return false;
        const urls = getVideoUrls(payload);
        if (!urls.length) {
          throw new Error('Tác vụ video đã hoàn tất nhưng không trả về địa chỉ video.');
        }
        setResults([]);
        setVideoResults(urls);
        appendCanvasNodes(urls, {
          kind: 'video',
          parentId: lineageParentId,
          promptText: basePrompt,
          downloadMeta: generationMeta,
          title: 'Kết quả video'
        });
        setVideoTask(payload);
      setProgress({ stage: 'completed', percent: 100, completed: 1, total: 1 });
      const completedAt = Date.now();
      setTiming((current) => current ? { ...current, status: 'completed', firstByteAt: current.firstByteAt || firstByteAt || completedAt, completedAt } : current);
      clearDraft();
      if (!options.fromQueue) setPrompt('');
      setStatus('success');
      setConversationOpen(false);
      setMessage(t('statusMessages.videoDone', 'Đã tạo xong video.'));
        const historyId = generationMeta.id;
        const historyCreatedAt = generationMeta.createdAt;
        onHistoryAdd({
          id: historyId,
          sessionId,
          createdAt: historyCreatedAt,
          mode: 'video',
          kind: 'video',
          providerId: generationMeta.providerId,
          prompt: basePrompt,
          model: activeVideoModel,
          aspect: activeVideoAspect,
          aspectRatio: activeVideoAspect,
          videoAspect: activeVideoAspect,
          videoAspectRatio: activeVideoAspect,
          duration: activeVideoDuration,
          videoDuration: activeVideoDuration,
          fps: activeVideoFps,
          videoFps: activeVideoFps,
          videoMotion: activeVideoMotion,
          videoStyle: activeVideoStyle,
          videoQuality: activeVideoQuality,
          negativePrompt: activeNegativePrompt.trim(),
          width: activeVideoSize.width,
          height: activeVideoSize.height,
          taskId: payload.task_id || payload.id || '',
          usageSummary: payloadUsageSummary(payload.raw || payload),
          timing: {
            startedAt,
            firstByteMs: (firstByteAt || completedAt) - startedAt,
            totalMs: completedAt - startedAt
          },
          resultUrls: storedResultUrls(urls),
          case: selectedCase ? {
            id: selectedCase.id,
            title: selectedCase.title,
            image: selectedCase.image || selectedCase.image_url || '',
            imageAlt: selectedCase.imageAlt,
            promptPreview: selectedCase.promptPreview,
            category: selectedCase.category
          } : null
        });
        if (usesGatewayAccount(providerSettings)) onProfileRefresh();
        return true;
      }

      const canvasReferenceFiles = willUseCanvasReference ? await selectedCanvasReferenceFiles(activeSelectedNode) : [];
      if (!isCurrentRequest()) return false;
      const editReferenceFiles = [...canvasReferenceFiles, ...activeReferenceFiles].slice(0, IMAGE_REFERENCE_LIMIT);
      const shouldUseImageEdits = activeMode === 'mask' || (activeMode === 'edit' && editReferenceFiles.length > 0);
      const effectivePrompt = withResolutionHint(basePrompt, normalizedActiveResolutionTier, t);
      let payload = null;
      let urls = [];
      let persistedResultUrls = [];
      const canUseServerJob = Boolean(providerRequest.apiKey && (isAuthenticated || providerSettings.apiKeySource === 'manual'));
      if (canUseServerJob) {
        try {
          const historyClient = new StudioHistoryClient({ session: loadSession() });
          const jobImages = shouldUseImageEdits ? await generationFilesForJob(editReferenceFiles) : [];
          const jobMask = maskFile ? {
            name: maskFile.name || 'mask.png',
            type: maskFile.type || 'image/png',
            dataUrl: await fileToDataUrl(maskFile)
          } : null;
          if (!isCurrentRequest()) return false;
          const job = await historyClient.createGenerationJob({
            apiKey: providerRequest.apiKey,
            gatewayBaseUrl: providerRequest.gatewayBaseUrl,
            images: jobImages,
            mask: jobMask,
            request: {
              id: generationMeta.id,
              clientRequestId: `studio-${generationMeta.id}`,
              sessionId,
              parentCanvasNodeId: lineageParentId,
              providerId: providerSettings.providerId,
              providerFamily: providerSettings.providerId,
              apiKeySource: providerSettings.apiKeySource,
              providerLabel: providerLabel(providerSettings, apiKey),
              mode: activeMode,
              route: shouldUseImageEdits ? 'edits' : 'generations',
              model: activeModel,
              prompt: basePrompt,
              generationPrompt: effectivePrompt,
              size: normalizedActiveSize,
              quality: normalizedActiveQuality,
              resolutionTier: normalizedActiveResolutionTier,
              outputFormat: normalizedActiveOutputFormat,
              moderation: normalizedActiveModeration,
              n: activeCount,
              count: activeCount
            }
          });
          if (!job?.id) throw new Error('GENERATION_JOB_CREATE_FAILED');
          generationRef.current = { ...generationRef.current, remoteJobId: job.id };
          if (options.queueTaskId) {
            markGenerationTask(options.queueTaskId, {
              serverJobId: job.id,
              remote: true,
              restorable: false,
      summary: job.prompt || basePrompt || 'Tác vụ tạo ảnh trên máy chủ'
            });
          } else {
            syncRemoteGenerationJob(job);
          }
          setProgress(serverJobProgress(job, activeCount));
          setMessage(serverJobMessage(job));
          const finalJob = await waitForServerJob(historyClient, job.id, { signal: controller.signal, total: activeCount });
          if (!isCurrentRequest()) return false;
          if (!finalJob || finalJob.status !== 'succeeded') {
            if (finalJob?.id) syncRemoteGenerationJob(finalJob);
            const error = new Error(finalJob?.error?.message || 'GENERATION_JOB_FAILED');
            error.status = finalJob?.error?.status;
            error.code = finalJob?.status === 'unknown' ? 'GENERATION_JOB_UNKNOWN' : finalJob?.error?.code;
            throw error;
          }
          persistedResultUrls = Array.isArray(finalJob.resultUrls) ? finalJob.resultUrls : [];
          urls = await Promise.all(persistedResultUrls.map((url) => historyClient.resolveAssetUrl(url).catch(() => url)));
          if (!isCurrentRequest()) {
            revokeBlobUrls(urls);
            return false;
          }
          payload = {
            data: urls.map((url) => ({ url })),
            usage: finalJob.usage,
            job: finalJob
          };
          if (!firstByteAt) {
            firstByteAt = Date.now();
            setTiming((current) => current ? { ...current, firstByteAt } : current);
          }
        } catch (error) {
          if (generationRef.current.remoteJobId) throw error;
          setMessage(t('statusMessages.serviceQueueFallback', 'Hàng đợi máy chủ tạm thời không khả dụng; đã chuyển sang gửi yêu cầu trực tiếp từ trang này.'));
        }
      }
      if (!payload) {
        const request = {
          ...providerRequest,
          model: activeModel,
          prompt: effectivePrompt,
          size: normalizedActiveSize,
          quality: normalizedActiveQuality,
          outputFormat: normalizedActiveOutputFormat,
          moderation: normalizedActiveModeration,
          n: activeCount,
          signal: controller.signal,
          onPartial: (partialUrls) => {
            if (!isCurrentRequest()) return;
            if (!firstByteAt) {
              firstByteAt = Date.now();
              setTiming((current) => current ? { ...current, firstByteAt } : current);
            }
            setResults(partialUrls);
            if (partialUrls.length) {
              appendCanvasNodes(partialUrls, {
                kind: 'image',
                parentId: lineageParentId,
                promptText: basePrompt,
                downloadMeta: generationMeta,
                title: t('statusMessages.previewTitle', 'Ảnh xem trước'),
                replaceBatchId: generationMeta.id
              });
            }
            setMessage(t('statusMessages.previewReceived', 'Đã nhận ảnh xem trước'));
          },
          onProgress: (nextProgress) => {
            if (!isCurrentRequest()) return;
            if (!firstByteAt && nextProgress.stage && nextProgress.stage !== 'request') {
              firstByteAt = Date.now();
              setTiming((current) => current ? { ...current, firstByteAt } : current);
            }
            setProgress((current) => ({ ...current, ...nextProgress }));
            setMessage(progressText(nextProgress, t('statusMessages.generating', 'Đang tạo')));
          }
        };
        payload = shouldUseImageEdits
          ? await client.editImage({ ...request, images: editReferenceFiles, mask: maskFile })
          : await client.generateImage({ ...request, referenceImages: [] });
        urls = getImageUrls(payload);
      }
      if (!isCurrentRequest()) return false;
      if (!urls.length) {
        throw new Error(t('statusMessages.noImagesReturned', 'Yêu cầu đã hoàn tất nhưng không có ảnh trả về.'));
      }
      setResults(urls);
      appendCanvasNodes(urls, {
        kind: 'image',
        parentId: lineageParentId,
        promptText: basePrompt,
        downloadMeta: generationMeta,
        title: t('statusMessages.resultTitle', 'Kết quả'),
        replaceBatchId: generationMeta.id,
        persistedUrls: persistedResultUrls
      });
      setProgress({ stage: 'completed', percent: 100, completed: urls.length, total: activeCount || urls.length || 1 });
      const completedAt = Date.now();
      setTiming((current) => current ? { ...current, status: 'completed', firstByteAt: current.firstByteAt || firstByteAt || completedAt, completedAt } : current);
      clearDraft();
      if (!options.fromQueue) setPrompt('');
      setStatus('success');
      setConversationOpen(false);
      setMessage(urls.length
        ? t('statusMessages.imageDone', 'Đã tạo xong ảnh.')
        : t('statusMessages.noImagesReturned', 'Yêu cầu đã hoàn tất nhưng không có ảnh trả về.'));
      const historyId = generationMeta.id;
      const historyCreatedAt = generationMeta.createdAt;
      onHistoryAdd({
        id: historyId,
        sessionId,
        createdAt: historyCreatedAt,
        mode: activeMode,
        providerId: generationMeta.providerId,
        prompt: basePrompt,
        generationPrompt: effectivePrompt,
        model: activeModel,
        aspect: task?.aspect || aspect,
        aspectRatio: task?.aspectRatio || task?.aspect || aspect,
        customSize: task?.customSize || customSize,
        size: normalizedActiveSize,
        quality: normalizedActiveQuality,
        resolutionTier: normalizedActiveResolutionTier,
        outputFormat: normalizedActiveOutputFormat,
        moderation: normalizedActiveModeration,
        count: activeCount,
        usageSummary: payloadUsageSummary(payload),
        timing: {
          startedAt,
          firstByteMs: (firstByteAt || completedAt) - startedAt,
          totalMs: completedAt - startedAt
        },
        resultUrls: persistedResultUrls.length ? persistedResultUrls : storedResultUrls(urls),
        case: selectedCase ? {
          id: selectedCase.id,
          title: selectedCase.title,
          image: selectedCase.image || selectedCase.image_url || '',
          imageAlt: selectedCase.imageAlt,
          promptPreview: selectedCase.promptPreview,
          category: selectedCase.category
        } : null
      });
      if (usesGatewayAccount(providerSettings)) onProfileRefresh();
      return true;
    } catch (error) {
      if (!isCurrentRequest() && !timeoutReached) return false;
      setStatus('error');
      const failedAt = Date.now();
      setTiming((current) => current ? { ...current, status: 'failed', firstByteAt: current.firstByteAt || firstByteAt, completedAt: failedAt } : current);
      const displayError = timeoutReached && error?.name === 'AbortError'
        ? Object.assign(new Error('GENERATION_TIMEOUT'), { code: 'GENERATION_TIMEOUT' })
        : error;
      setProgress((current) => ({
        ...current,
        stage: timeoutReached || firstByteAt ? 'pending_review' : 'failed',
        percent: current.percent || 0
      }));
      setMessage(generationErrorMessage(displayError, t));
      return false;
    } finally {
      if (isCurrentRequest()) {
        generationRef.current = { id: requestId, controller: null };
      }
      window.clearTimeout(stallTimer);
      window.clearTimeout(timeoutTimer);
    }
  }

  function stopGeneration() {
    const activeGeneration = generationRef.current;
    if (!activeGeneration?.controller) return;
    const currentRunningTask = generationQueueRef.current.find((item) => item.status === 'running');
    const remoteJobId = activeGeneration.remoteJobId || currentRunningTask?.serverJobId || '';
    const stoppedError = new Error('GENERATION_STOPPED');
    stoppedError.code = 'GENERATION_STOPPED';
    activeGeneration.controller.abort(stoppedError);
    generationRef.current = { id: activeGeneration.id + 1, controller: null };
    const stoppedAt = Date.now();
    setStatus('error');
    setProgress((current) => ({
      ...current,
      stage: 'pending_review',
      percent: current.percent || 0
    }));
    setTiming((current) => current ? { ...current, status: 'failed', completedAt: stoppedAt } : current);
    setMessage(generationErrorMessage(stoppedError, t));
    if (currentRunningTask) markGenerationTask(currentRunningTask.id, { status: 'failed', completedAt: stoppedAt });
    if (remoteJobId) {
      clearRemoteGenerationJob(remoteJobId, 'canceled');
      const historyClient = new StudioHistoryClient({ session: loadSession() });
      historyClient.cancelGenerationJob(remoteJobId)
        .then((job) => setMessage(serverJobMessage(job || { status: 'canceled' })))
        .catch(() => setMessage(t('errors.cancelFailed', 'Đã dừng chờ trên trang này nhưng máy chủ không hủy được yêu cầu. Hãy kiểm tra lịch sử ảnh và canvas rồi quyết định có thử lại không.')));
    }
  }

  const primaryImageResult = mode !== 'video' ? results[0] || '' : '';
  const primaryVideoResult = mode === 'video' ? videoResults[0] || '' : '';
  const hasPrimaryResult = Boolean(primaryImageResult || primaryVideoResult);
  const workPreviewImage = primaryImageResult
    ? primaryImageResult
    : mode === 'edit' && referencePreviews[0]
    ? referencePreviews[0]
    : mode === 'mask' && referencePreviews[0]
      ? referencePreviews[0]
    : mode === 'video' && videoReferencePreviews[0]
      ? videoReferencePreviews[0]
    : templatePreviewImage(selectedCase)
      ? assetPath(templatePreviewImage(selectedCase))
      : '';
  const workPreviewFallback = templateThumbnail(selectedCase);
  const previewAlt = primaryImageResult
    ? 'Kết quả tạo ảnh 1'
    : mode === 'video' && videoReferenceFiles[0]
    ? videoReferenceFiles[0].name
    : isImageEditMode && referenceFiles[0]
    ? referenceFiles[0].name
    : selectedCase?.imageAlt || selectedCase?.title || 'Preview';
  const isGenerating = status === 'loading' && Boolean(generationRef.current.controller);
  const generationActionDisabled = false;
  const generationActionClass = status === 'error' ? 'isRetryAction' : '';
  const needsReviewBeforeRetry = status === 'error' && progress.stage === 'pending_review';
  const generationActionLabel = isGenerating
    ? t('composer.queueMore', 'Thêm vào hàng đợi')
    : needsReviewBeforeRetry
      ? t('composer.confirmRetry', 'Xác nhận thử lại')
      : status === 'error'
        ? t('composer.retry', 'Thử lại')
        : mode === 'video' ? t('composer.generateVideo', 'Tạo video') : t('composer.generateImage', 'Tạo ảnh');
  const generationActionIcon = status === 'error' ? <Redo2 size={18} /> : <Sparkles size={18} />;
  const compactGenerationActionIcon = status === 'error' ? <Redo2 size={16} /> : <Sparkles size={16} />;
  const handleGenerateAction = () => {
    if (!isReady) { onOpenSettings(); return; }
    if (!prompt.trim()) { promptInputRef.current?.focus(); return; }
    if (isGenerating) {
      enqueueGeneration();
      return;
    }
    enqueueGeneration();
  };
  const handleImprovePrompt = () => {
    if (!isReady) { onOpenSettings(); return; }
    if (!prompt.trim()) { promptInputRef.current?.focus(); return; }
    if (optimizingPrompt || caseResolving || isGenerating) return;
    sendAssistantMessage();
  };
  const maskSourcePreview = referencePreviews[0] || (mode === 'mask' && selectedCanvasNode && selectedCanvasNode.kind !== 'video' ? selectedCanvasNode.url : '');
  const maskSourceFile = referenceFiles[0] || (maskSourcePreview ? { name: selectedCanvasNode ? `#${selectedCanvasNode.canvasIndex || 1}.png` : 'reference.png' } : null);
  const referenceSideCount = mode === 'mask'
    ? (maskSourcePreview ? 1 : 0)
    : mode === 'video'
      ? videoReferenceFiles.length
      : referenceFiles.length;
  const referenceSideLimit = mode === 'mask' || mode === 'video' ? 1 : IMAGE_REFERENCE_LIMIT;
  const composerUsesEditRoute = mode === 'mask' || (mode === 'edit' && (referenceFiles.length || selectedCanvasNode?.url));
  const composerRouteLabel = mode === 'video'
    ? t('composer.routeVideo', 'API tác vụ video')
    : composerUsesEditRoute
      ? '/v1/images/edits'
      : '/v1/images/generations';
  const composerContextTitle = selectedCanvasNode
    ? t('composer.contextContinue', 'Tiếp tục sáng tạo từ #{index}', { index: selectedCanvasNode.canvasIndex || '' })
    : selectedCase?.title
      ? t('composer.contextTemplate', 'Từ mẫu: {title}', { title: selectedCase.title })
      : t('composer.contextNew', 'Phiên sáng tạo mới');
  const composerContextMeta = selectedCanvasNode
    ? composerUsesEditRoute
      ? t('composer.contextUsesReference', 'Ảnh đã chọn sẽ được dùng làm ảnh tham chiếu')
      : t('composer.contextLineageOnly', 'Chỉ kế thừa prompt và liên kết trên canvas')
    : mode === 'video'
      ? t('composer.contextVideo', 'Cài thông số video ở bên phải')
      : t('composer.title', 'Chia sẻ ý tưởng, hoàn thiện prompt rồi tạo ảnh');
  // Any later status message replaces this one, so the match ends on its own once the next action runs.
  const assistantErrorShown = status === 'error' && Boolean(assistantError) && assistantError.message === message;
  const composerGenerationVisible = status === 'loading' || progress.stage === 'failed' || progress.stage === 'pending_review' || (status === 'error' && Boolean(message));
  const composerThreadHasContent = Boolean(composerGenerationVisible || assistantMessages.length || promptSuggestion);
  const conversationVisible = conversationOpen && composerThreadHasContent;
  const hasCanvasContent = Boolean(canvasNodes.length || hasPrimaryResult || workPreviewImage);
  const isStarting = !hasCanvasContent && !isGenerating;
  const starterIdeas = mode === 'video' ? [
    { id: 'product-video', label: t('starter.videoProduct', 'Video sản phẩm'), prompt: t('starter.videoProductPrompt', 'Máy quay chậm rãi di chuyển quanh một chai nước hoa trên nền đá sáng, ánh sáng cửa sổ mềm, khung hình ổn định.') },
    { id: 'landscape', label: t('starter.landscape', 'Phong cảnh'), prompt: t('starter.landscapePrompt', 'Máy quay lướt chậm qua một thung lũng phủ sương vào bình minh, ánh sáng ấm, chuyển động tự nhiên.') },
    { id: 'animation', label: t('starter.animation', 'Hoạt hình'), prompt: t('starter.animationPrompt', 'Một nhân vật bằng giấy đang đọc sách bên cửa sổ, phong cách hoạt hình thủ công, chuyển động nhẹ nhàng.') }
  ] : [
    { id: 'product', label: t('starter.product', 'Ảnh sản phẩm'), prompt: t('starter.productPrompt', 'Ảnh sản phẩm: một chai nước hoa trên nền đá sáng, ánh sáng cửa sổ mềm, bố cục tối giản, không có chữ.') },
    { id: 'illustration', label: t('starter.illustration', 'Minh họa'), prompt: t('starter.illustrationPrompt', 'Minh họa một tiệm sách nhỏ vào buổi tối, ánh đèn vàng ấm, nét vẽ tay và bảng màu dịu.') },
    { id: 'poster', label: t('starter.poster', 'Áp phích'), prompt: t('starter.posterPrompt', 'Áp phích cho một triển lãm kiến trúc, hình khối táo bạo, tông đen và kem, chừa khoảng trống để đặt tiêu đề.') }
  ];
  const activeGenerationQueueItems = generationQueue.filter((item) => CURRENT_PROJECT_QUEUE_STATUSES.has(item.status));
  const composerFolded = layoutSections.bottomComposer && layoutSections.composerFolded === true;

  return (
    <section className={`creationDesk ${isStarting ? 'isStarting' : 'hasWorkspaceContent'} ${layoutSections.references ? 'referencesOpen' : ''} ${layoutSections.bottomComposer ? 'composerOpen' : ''} ${conversationVisible ? 'composerHasThread' : ''} ${layoutSections.composerParameters === false ? 'composerParamsCollapsed' : ''} ${layoutSections.parametersRail === false ? 'paramRailCollapsed' : ''} ${composerFolded ? 'composerFolded' : ''}`}
      onDragOver={(event) => {
        if (!event.dataTransfer?.types?.includes('Files')) return;
        event.preventDefault();
        if (!layoutSections.references) updateLayoutSections({ references: true });
      }}
      onDrop={(event) => {
        if (event.defaultPrevented) return;
        const files = event.dataTransfer?.files;
        if (!files?.length) return;
        event.preventDefault();
        if (mode === 'video') appendVideoReferenceImage(files);
        else appendReferenceImages(files);
      }}>
      {isStarting ? (
        <div className="starterWelcome">
          <h2>{mode === 'video' ? t('starter.videoTitle', 'Tạo video đầu tiên') : t('starter.title', 'Tạo ảnh đầu tiên')}</h2>
          <p>{t('starter.hint', 'Chọn một gợi ý hoặc mô tả ý tưởng của bạn.')}</p>
          <div className="starterIdeas">
            {starterIdeas.map((idea) => <button type="button" key={idea.id} onClick={() => { setPrompt(idea.prompt); requestAnimationFrame(() => promptInputRef.current?.focus()); }}>{idea.label}</button>)}
          </div>
        </div>
      ) : null}
      <div
        ref={workPreviewRef}
        className={`workPreview infiniteCanvas ${hasPrimaryResult ? 'hasResult' : ''} ${canvasPerformanceMode ? 'performanceMode' : ''}`}
        onPointerDown={startCanvasPan}
        onPointerMove={moveCanvasPan}
        onPointerUp={endCanvasPan}
        onPointerCancel={endCanvasPan}
        onDragOver={(event) => {
          if (!event.dataTransfer?.types?.includes('Files')) return;
          event.preventDefault();
          if (!layoutSections.references) updateLayoutSections({ references: true });
        }}
        onDrop={(event) => {
          const files = supportedReferenceFiles(event.dataTransfer?.files, mode === 'video' ? 1 : IMAGE_REFERENCE_LIMIT);
          if (!files.length) return;
          event.preventDefault();
          if (mode === 'video') appendVideoReferenceImage(files);
          else appendReferenceImages(files);
        }}
      >
        {activeGenerationQueueItems.length ? (
          <div className="canvasQueueDock" aria-label={t('composer.queue', 'Hàng đợi tạo ảnh')} onPointerDown={(event) => event.stopPropagation()}>
            <div className="canvasQueueHead">
              <strong>{t('composer.queue', 'Hàng đợi tạo ảnh')}</strong>
              <span>{generationQueueHeadline(activeGenerationQueueItems, t)}</span>
            </div>
            <div className="canvasQueueList">
              {activeGenerationQueueItems.slice(0, 5).map((item, index) => (
                <div className={`canvasQueueItem ${item.status}`} key={item.id}>
                  <b>#{index + 1}</b>
                  <span>{generationQueueStatusLabel(item.status, t)}</span>
                  <p>{generationQueueSummary(item, t)}</p>
                  {item.status === 'queued' || item.status === 'running' ? (
                    <button
                      type="button"
                      onClick={() => cancelGenerationTask(item.id)}
                      aria-label={item.status === 'running' ? t('composer.cancelRunningTask', 'Dừng tác vụ hiện tại') : t('composer.cancelQueuedTask', 'Hủy tác vụ đang chờ')}
                      title={item.status === 'running' ? t('composer.cancelRunningTask', 'Dừng tác vụ hiện tại') : t('composer.cancelQueuedTask', 'Hủy tác vụ đang chờ')}
                    >
                      <X size={13} />
                    </button>
                  ) : null}
                  {item.status === 'failed' && !item.remote && item.restorable !== false ? (
                    <button
                      type="button"
                      className="retryQueueAction"
                      onClick={() => retryGenerationTask(item.id)}
                      aria-label={t('composer.retryTask', 'Thử lại tác vụ này')}
                      title={t('composer.retryTask', 'Thử lại tác vụ này')}
                    >
                      <Redo2 size={13} />
                    </button>
                  ) : null}
                  {item.status === 'failed' || item.status === 'unknown' || item.status === 'canceled' || item.status === 'done' ? (
                    <button
                      type="button"
                      onClick={() => acknowledgeGenerationTask(item.id)}
                      aria-label={t('composer.dismissQueueNotice', 'Ẩn thông báo hàng đợi')}
                      title={t('composer.dismissQueueNotice', 'Ẩn thông báo hàng đợi')}
                    >
                      <X size={13} />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
        <div className="canvasToolbar" aria-label={t('canvas.toolbar', 'Công cụ canvas')}>
          <button type="button" onClick={() => setCanvasZoom((value) => value - 0.1)} aria-label={t('canvas.zoomOut', 'Thu nhỏ canvas')} title={`${t('canvas.zoomOut', 'Thu nhỏ canvas')} Ctrl/Cmd + -`}>-</button>
          <span>{Math.round(canvasView.zoom * 100)}%</span>
          <button type="button" onClick={() => setCanvasZoom((value) => value + 0.1)} aria-label={t('canvas.zoomIn', 'Phóng to canvas')} title={`${t('canvas.zoomIn', 'Phóng to canvas')} Ctrl/Cmd + +`}>+</button>
          <button type="button" onClick={resetCanvasView} title={`${t('canvas.reset', 'Đặt lại')} Ctrl/Cmd + 0`}>{t('canvas.reset', 'Đặt lại')}</button>
        </div>
        <div
          className="canvasPlane"
          style={{
            width: CANVAS_PLANE_WIDTH,
            height: CANVAS_PLANE_HEIGHT,
            transform: `translate(calc(-50% + ${canvasView.x}px), calc(-50% + ${canvasView.y}px)) scale(${canvasView.zoom})`
          }}
        >
          {renderedCanvasEdges.length || canvasLinkPreview ? (
            <svg className={`canvasLinks ${selectedCanvasNodeId ? 'hasSelection' : ''} ${canvasLinkDraft ? 'isLinking' : ''} ${canvasPerformanceMode ? 'performanceMode' : ''}`} width={CANVAS_PLANE_WIDTH} height={CANVAS_PLANE_HEIGHT} viewBox={`0 0 ${CANVAS_PLANE_WIDTH} ${CANVAS_PLANE_HEIGHT}`} aria-hidden="true">
              <defs>
                <marker id="canvasLinkArrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="userSpaceOnUse">
                  <path className="canvasLinkArrow" d="M 1 2 L 10 6 L 1 10 z" />
                </marker>
                <marker id="canvasLinkArrowActive" markerWidth="15" markerHeight="15" refX="12" refY="7.5" orient="auto" markerUnits="userSpaceOnUse">
                  <path className="canvasLinkArrowActive" d="M 1 2 L 12 7.5 L 1 13 z" />
                </marker>
                <filter id="canvasLinkGlow" x="-24%" y="-24%" width="148%" height="148%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {renderedCanvasEdges.map((edge) => {
                const fromWidth = nodeWidth(edge.from);
                const fromHeight = nodeHeight(edge.from);
                const toHeight = nodeHeight(edge.to);
                const x1 = CANVAS_PLANE_WIDTH / 2 + edge.from.x + fromWidth + 2;
                const y1 = CANVAS_PLANE_HEIGHT / 2 + edge.from.y + fromHeight * 0.48;
                const x2 = CANVAS_PLANE_WIDTH / 2 + edge.to.x - 2;
                const y2 = CANVAS_PLANE_HEIGHT / 2 + edge.to.y + toHeight * 0.48;
                const bend = Math.max(96, Math.abs(x2 - x1) * 0.46);
                const path = `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`;
                const jointX = (x1 + x2) / 2;
                const jointY = (y1 + y2) / 2;
                const edgeClass = canvasEdgeLineageClass(edge);
                const isEdgeActive = edgeClass.includes('active');
                return (
                  <g className={`canvasLinkGroup ${edgeClass} ${edge.type === 'custom' ? 'custom' : 'lineage'}`} key={edge.id}>
                    <path className="canvasLinkGlow" d={path} filter="url(#canvasLinkGlow)" />
                    <path className="canvasLinkPulse" d={path} />
                    <path className="canvasLinkPath" d={path} markerEnd={isEdgeActive ? 'url(#canvasLinkArrowActive)' : 'url(#canvasLinkArrow)'} />
                    <circle className="canvasLinkJoint" cx={jointX} cy={jointY} r="4.3" />
                    <circle className="canvasLinkJointCore" cx={jointX} cy={jointY} r="1.6" />
                    <text className="canvasLinkLabel" x={jointX + 12} y={jointY - 10}>
                      {`#${edge.from.canvasIndex || ''} -> #${edge.to.canvasIndex || ''}`}
                    </text>
                  </g>
                );
              })}
              {canvasLinkPreview?.point ? (() => {
                const fromWidth = nodeWidth(canvasLinkPreview.from);
                const fromHeight = nodeHeight(canvasLinkPreview.from);
                const x1 = CANVAS_PLANE_WIDTH / 2 + canvasLinkPreview.from.x + fromWidth + 2;
                const y1 = CANVAS_PLANE_HEIGHT / 2 + canvasLinkPreview.from.y + fromHeight * 0.48;
                const x2 = canvasLinkPreview.point.x;
                const y2 = canvasLinkPreview.point.y;
                const bend = Math.max(70, Math.abs(x2 - x1) * 0.38);
                const path = `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`;
                return <path className="canvasLinkPreview" d={path} />;
              })() : null}
            </svg>
          ) : null}
          {canvasNodes.length ? canvasNodes.map((node) => {
            const nodeIndex = Math.max(0, (node.canvasIndex || 1) - 1);
            const currentNodeWidth = nodeWidth(node);
            const currentNodeHeight = nodeHeight(node);
            const nodeIsVisible = visibleCanvasNodeIds.has(node.id);
            const nodeIsVirtualized = canvasPerformanceMode && !nodeIsVisible;
            const nodeExtension = node.kind === 'video' ? resultVideoExtension(node.url) : resultExtension(node.url, outputFormat);
            const nodeDownloadName = buildStudioDownloadFilename({
              ...(node.downloadMeta || currentDownloadMeta || {}),
              mode: node.kind === 'video' ? 'video' : 'image',
              index: nodeIndex,
              extension: nodeExtension
            });
            return (
              <div
                className={`canvasNode resultNode graphNode ${selectedCanvasNodeId === node.id ? 'selected' : ''} ${childNodeIds.has(node.id) ? 'lineageChild' : ''} ${parentNodeIds.has(node.id) ? 'lineageParent' : ''} ${linkedNodeIds.has(node.id) ? 'linkingRelated' : ''} ${canvasLinkDraft?.fromId === node.id ? 'linkingSource' : ''} ${canvasEditorNodeId === node.id ? 'editing' : ''} ${nodeIsVirtualized ? 'virtualized' : ''}`}
                key={node.id}
                style={{
                  left: `calc(50% + ${node.x}px)`,
                  top: `calc(50% + ${node.y}px)`,
                  width: currentNodeWidth,
                  height: currentNodeHeight
                }}
                data-node-id={node.id}
                onPointerDown={(event) => startCanvasNodeDrag(event, node)}
                onDoubleClick={(event) => {
                  event.stopPropagation();
                  openCanvasEditor(node);
                }}
              >
                <button
                  type="button"
                  className="canvasPort canvasPortIn"
                  data-node-id={node.id}
                  onPointerDown={(event) => finishCanvasLink(event, node)}
                  aria-label={`${t('canvas.connectTo', 'Kết nối với ảnh này')} #${node.canvasIndex || ''}`}
                  title={t('canvas.connectTo', 'Kết nối với ảnh này')}
                />
                <button
                  type="button"
                  className="canvasPort canvasPortOut"
                  data-node-id={node.id}
                  onPointerDown={(event) => startCanvasLink(event, node)}
                  aria-label={`${t('canvas.dragConnect', 'Kéo đến ảnh khác để tạo liên kết')} #${node.canvasIndex || ''}`}
                  title={t('canvas.dragConnect', 'Kéo đến ảnh khác để tạo liên kết')}
                />
                <button
                  type="button"
                  className="canvasNodeMedia"
                  onClick={(event) => handleCanvasNodeMediaClick(event, node)}
                  onDoubleClick={(event) => {
                    event.stopPropagation();
                    openCanvasEditor(node);
                  }}
                >
                  {nodeIsVirtualized ? (
                    <div className="canvasNodePlaceholder">
                      <ImageIcon size={20} />
                      <strong>#{node.canvasIndex || ''}</strong>
                      <span>{compact(node.prompt || node.title || '', 32)}</span>
                    </div>
                  ) : node.kind === 'video' ? (
                    <video src={displayResultUrl(node.url)} playsInline preload="metadata" />
                  ) : (
                    <>
                      <ProtectedStudioImage
                        src={displayResultUrl(node.url)}
                        alt={node.title}
                        fallback={<span className="canvasNodeMissing">{t('canvas.recovering', 'Đang khôi phục ảnh. Nếu canvas vẫn trống, hãy mở lại phiên này từ lịch sử ảnh.')}</span>}
                      />
                    </>
                  )}
                </button>
                <span className="canvasNodeLabel">#{node.canvasIndex || ''}</span>
                <button
                  type="button"
                  className="canvasNodeContinue"
                  onClick={(event) => {
                    event.stopPropagation();
                    openCanvasEditor(node);
                  }}
                >
                  <SquarePen size={13} />
                  {t('canvas.continueEdit', 'Tiếp tục chỉnh sửa')}
                </button>
                <div className="canvasNodeToolbar" onClick={(event) => event.stopPropagation()}>
                  <button type="button" onClick={() => previewCanvasNode(node)} aria-label={`${t('canvas.preview', 'Xem trước')} #${node.canvasIndex || ''}`} title={t('canvas.preview', 'Xem trước')}>
                    <Search size={13} />
                  </button>
                  <button type="button" onClick={() => openCanvasEditor(node)} aria-label={`${t('canvas.continueEdit', 'Tiếp tục chỉnh sửa')} #${node.canvasIndex || ''}`} title={t('canvas.continueEdit', 'Tiếp tục chỉnh sửa')}>
                    <SquarePen size={13} />
                  </button>
                  {node.kind !== 'video' ? (
                    <button type="button" onClick={() => setCanvasNodeAsReference(node)} aria-label={`${t('canvas.setReference', 'Đặt làm ảnh tham chiếu')} #${node.canvasIndex || ''}`} title={t('canvas.setReference', 'Đặt làm ảnh tham chiếu')}>
                      <ImageIcon size={13} />
                    </button>
                  ) : null}
                  <button type="button" onClick={() => copyCanvasNodePrompt(node)} disabled={!node.prompt} aria-label={`${t('canvas.copyPrompt', 'Sao chép prompt')} #${node.canvasIndex || ''}`} title={t('canvas.copyPrompt', 'Sao chép prompt')}>
                    <Copy size={13} />
                  </button>
                  <a href={displayResultUrl(node.url)} download={nodeDownloadName} aria-label={`${t('canvas.download', 'Tải xuống')} #${node.canvasIndex || ''}`} title={t('canvas.download', 'Tải xuống')}>
                    <Download size={13} />
                  </a>
                  <button type="button" onClick={() => deleteCanvasNode(node)} aria-label={`${t('canvas.delete', 'Xóa')} #${node.canvasIndex || ''}`} title={t('canvas.delete', 'Xóa')}>
                    <Trash2 size={13} />
                  </button>
                </div>
                {canvasEditorNodeId === node.id ? (
                  <div className="canvasInlineEditor" onClick={(event) => event.stopPropagation()}>
                    <div className="canvasInlineEditorHead">
                      <strong>{t('canvas.inlineContinue', '#{index} Tiếp tục chỉnh sửa', { index: node.canvasIndex || '' })}</strong>
                      <button type="button" onClick={closeCanvasEditor} aria-label={t('settings.close', 'Đóng')}>
                        <X size={13} />
                      </button>
                    </div>
                    <textarea
                      value={canvasEditorPrompt}
                      onChange={(event) => setCanvasEditorPrompt(event.target.value)}
                      placeholder={t('canvas.inlinePlaceholder', 'Nhập nội dung cần bổ sung, chỉnh sửa hoặc vẽ lại trong lượt này')}
                      autoFocus
                    />
                    <div className="canvasInlineModes" role="group" aria-label={t('canvas.continueMode', 'Cách tiếp tục')}>
                      <button type="button" className={canvasEditorMode === 'image' ? 'active' : ''} onClick={() => changeCanvasEditorMode('image')}>{t('canvas.derive', 'Tạo biến thể')}</button>
                      <button type="button" className={canvasEditorMode === 'edit' ? 'active' : ''} onClick={() => changeCanvasEditorMode('edit')}>{t('canvas.referenceEdit', 'Chỉnh theo ảnh tham chiếu')}</button>
                      <button type="button" className={canvasEditorMode === 'mask' ? 'active' : ''} onClick={() => changeCanvasEditorMode('mask')}>Mask</button>
                    </div>
                    {canvasEditorMode === 'image' ? <p>{t('canvas.deriveHint', 'Chỉ kế thừa prompt và liên kết trên canvas, không dùng ảnh gốc làm ảnh tham chiếu.')}</p> : null}
                    {canvasEditorMode === 'edit' ? <p>{t('canvas.editHint', 'Ảnh này sẽ được dùng làm ảnh tham chiếu qua /v1/images/edits.')}</p> : null}
                    {canvasEditorMode === 'mask' ? <p>{t('canvas.maskHint', 'Tô vùng cần vẽ lại trong bảng Mask, rồi dùng nút này để tiếp tục tạo ảnh.')}</p> : null}
                    <button
                      type="button"
                      className={`canvasInlineGenerate ${generationActionClass}`}
                      onClick={() => generateFromCanvasEditor(node)}
                      disabled={generationActionDisabled}
                    >
                      {status === 'error' ? <Redo2 size={14} /> : <Sparkles size={14} />}
                      {generationActionLabel}
                    </button>
                  </div>
                ) : null}
                <button
                  type="button"
                  className="canvasNodeResize"
                  onPointerDown={(event) => startCanvasNodeResize(event, node)}
                  aria-label={`${t('canvas.resize', 'Kéo để thay đổi kích thước cửa sổ')} #${node.canvasIndex || ''}`}
                  title={t('canvas.resize', 'Kéo để thay đổi kích thước cửa sổ')}
                />
                <small>{compact(node.prompt, 46)}</small>
                {selectedCanvasNodeId === node.id && !childNodeIds.size ? (
                  <div className="canvasNextHint">
                    <strong>{t('canvas.continueTitle', 'Tiếp tục chỉnh ảnh này')}</strong>
                    <span>{t('canvas.continueHint', 'Bổ sung yêu cầu trong phiên bên dưới hoặc chọn tiếp tục chỉnh sửa ở góc trên bên phải.')}</span>
                  </div>
                ) : null}
              </div>
            );
          }) : primaryVideoResult ? (
            <div className="canvasNode emptyCanvasNode previewFallbackNode">
              <Video size={28} />
              <strong>{t('canvas.videoResult', 'Kết quả video')}</strong>
              <span>{t('canvas.nextNodeHint', 'Lần tạo tiếp theo sẽ được nối thành một nút trên canvas.')}</span>
            </div>
          ) : workPreviewImage ? (
            <div className="canvasNode sourceNode previewFallbackNode">
              <ProtectedStudioImage
                src={workPreviewImage}
                fallbackSrc={workPreviewFallback}
                alt={previewAlt}
              />
              <span className="canvasNodeLabel">{hasPrimaryResult ? '#1' : selectedCase?.title || t('canvas.sourceImage', 'Ảnh tham chiếu')}</span>
            </div>
          ) : (
            <div className="canvasNode emptyCanvasNode">
              <ImageIcon size={28} />
              <strong>{t('canvas.title', 'Canvas')}</strong>
              <span>{t('canvas.empty', 'Nhập ý tưởng ở phía dưới để tạo ảnh đầu tiên (#1). Chọn ảnh bất kỳ rồi bổ sung yêu cầu để tiếp tục.')}</span>
            </div>
          )}
        </div>
      </div>
      <aside className={`referenceSidePanel ${layoutSections.references ? 'isOpen' : 'isCollapsed'}`} aria-label={t('references.title', 'Ảnh tham chiếu (tùy chọn)')}>
        {layoutSections.references ? (
          <>
            <div className="referenceSideHead">
              <div>
                <strong>{mode === 'mask' ? t('references.maskTitle', 'Ảnh tham chiếu và mặt nạ') : t('references.title', 'Ảnh tham chiếu (tùy chọn)')}</strong>
                <span>{mode === 'mask' ? 'Mask / edits' : referenceFiles.length || videoReferenceFiles.length ? t('references.selected', 'Đã chọn {count} ảnh', { count: mode === 'video' ? videoReferenceFiles.length : referenceFiles.length }) : t('references.sideHint', 'Kéo, dán hoặc tải lên')}</span>
              </div>
              <button type="button" onClick={() => toggleLayoutSection('references')} aria-label={t('references.collapse', 'Thu gọn ảnh tham chiếu')}>
                <PanelLeftClose size={15} />
              </button>
            </div>
            {mode === 'mask' ? (
              <div className="referenceSideBody maskReferenceSideBody">
                <MaskEditor
                  ref={maskEditorRef}
                  imageFile={maskSourceFile}
                  imagePreview={maskSourcePreview}
                  onUpload={(files) => {
                    const nextFile = supportedReferenceFiles(files, 1)[0];
                    if (!nextFile) {
                      setStatus('error');
                      setMessage(t('references.unsupportedFormat', 'Chỉ hỗ trợ ảnh PNG / JPG / WebP.'));
                      return;
                    }
                    setReferenceItems([createReferenceItem(nextFile, 'identity')]);
                    if (maskExportUrl) {
                      URL.revokeObjectURL(maskExportUrl);
                      setMaskExportUrl('');
                    }
                    setStatus('idle');
                    setMessage('');
                  }}
                  onClearImage={clearReferenceImages}
                  onExportReady={handleMaskExportReady}
                  onError={(nextMessage) => {
                    setStatus('error');
                    setMessage(nextMessage);
                  }}
                  onGenerate={selectedCanvasNode ? generateMaskFromPanel : null}
                  generating={status === 'loading'}
                  t={t}
                />
                {maskExportUrl ? (
                  <div className="maskExportPreview">
                    <img src={maskExportUrl} alt="Mask đã xuất" />
                    <span>{t('references.exportedMask', 'Đã xuất mask.png')}</span>
                  </div>
                ) : null}
              </div>
            ) : mode === 'video' ? (
              <div className={`referenceSideBody ${videoReferencePreviews.length ? 'hasReferenceItems' : ''}`}>
                <label
                  className={`uploadDrop sideUploadDrop ${videoDropActive ? 'isDragging' : ''}`}
                  tabIndex={0}
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setVideoDropActive(true);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setVideoDropActive(true);
                  }}
                  onDragLeave={() => setVideoDropActive(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setVideoDropActive(false);
                    appendVideoReferenceImage(event.dataTransfer?.files);
                  }}
                  onPaste={videoReferencePasteFiles}
                >
                  <Upload size={18} />
                  <span>{videoReferenceFiles.length ? t('references.replaceVideo', 'Thay thế hoặc kéo thả thêm') : t('references.optionalUpload', 'Kéo / dán / tải ảnh tham chiếu lên (tùy chọn)')}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => {
                      appendVideoReferenceImage(event.target.files);
                      event.target.value = '';
                    }}
                  />
                </label>
                {videoReferencePreviews.length ? (
                  <div className="referenceThumbs sideReferenceThumbs videoReferenceThumbs">
                    {videoReferencePreviews.map((url, index) => (
                      <figure key={url}>
                        <button
                          type="button"
                          className="referencePreviewButton"
                          onClick={() => setPreviewImage({
                            url,
                            index,
                            downloadMeta: {
                              mode: 'image',
                              providerId: mode === 'video' ? videoModel : model,
                              prompt: prompt.trim(),
                              createdAt: new Date().toISOString()
                            }
                          })}
                          aria-label={t('references.preview', 'Xem ảnh tham chiếu')}
                        >
                          <LazyImage src={url} alt={videoReferenceFiles[index]?.name || t('references.videoReference', 'Video tham chiếu')} />
                        </button>
                        <button type="button" onClick={removeVideoReferenceImage} aria-label={t('references.remove', 'Xóa ảnh tham chiếu')}>
                          <X size={13} />
                        </button>
                      </figure>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className={`referenceSideBody ${referencePreviews.length ? 'hasReferenceItems' : ''}`}>
                <label
                  className={`uploadDrop sideUploadDrop ${referenceDropActive ? 'isDragging' : ''}`}
                  tabIndex={0}
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setReferenceDropActive(true);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setReferenceDropActive(true);
                  }}
                  onDragLeave={() => setReferenceDropActive(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setReferenceDropActive(false);
                    appendReferenceImages(event.dataTransfer?.files);
                  }}
                  onPaste={referencePasteFiles}
                >
                  <Upload size={18} />
                  <span>{referenceFiles.length ? t('references.addMore', 'Thêm ảnh hoặc kéo thả vào đây') : t('references.upload', 'Kéo / dán / tải ảnh tham chiếu lên')}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    onChange={(event) => {
                      appendReferenceImages(event.target.files);
                      event.target.value = '';
                    }}
                  />
                </label>
                {referencePreviews.length ? (
                  <div className="referenceThumbs sideReferenceThumbs">
                    {referencePreviews.map((url, index) => (
                      <figure key={url}>
                        <button
                          type="button"
                          className="referencePreviewButton"
                          onClick={() => setPreviewImage({
                            url,
                            index,
                            downloadMeta: {
                              mode: 'reference',
                              providerId: mode === 'video' ? videoModel : model,
                              prompt: prompt.trim(),
                              createdAt: new Date().toISOString()
                            }
                          })}
                          aria-label={t('references.preview', 'Xem ảnh tham chiếu')}
                        >
                          <LazyImage src={url} alt={referenceItems[index]?.file?.name || t('references.referenceIndex', 'Ảnh tham chiếu {index}', { index: index + 1 })} />
                        </button>
                        <figcaption>
                          <select
                            value={referenceItems[index]?.role || 'identity'}
                            onChange={(event) => updateReferenceRole(index, event.target.value)}
                            aria-label={t('references.role', 'Vai trò của ảnh tham chiếu {index}', { index: index + 1 })}
                          >
                            {REFERENCE_ROLES.map((role) => (
                              <option key={role.value} value={role.value}>{role.label}</option>
                            ))}
                          </select>
                          <span>{index === 0 ? t('references.mainReference', 'Ảnh tham chiếu chính') : t('references.referenceIndex', 'Ảnh tham chiếu {index}', { index: index + 1 })}</span>
                        </figcaption>
                        <div className="referenceFileMeta">
                          <strong>{referenceItems[index]?.file?.name || t('references.referenceIndex', 'Ảnh tham chiếu {index}', { index: index + 1 })}</strong>
                          <span>{formatFileSize(referenceItems[index]?.file?.size) || t('references.preview', 'Xem ảnh tham chiếu')}</span>
                        </div>
                        <div className="referenceThumbActions">
                          <button type="button" onClick={() => moveReferenceImage(index, -1)} disabled={index === 0} aria-label={t('references.moveBefore', 'Đưa ảnh tham chiếu lên trước')}>
                            <ArrowUp size={13} />
                          </button>
                          <button type="button" onClick={() => moveReferenceImage(index, 1)} disabled={index === referencePreviews.length - 1} aria-label={t('references.moveAfter', 'Đưa ảnh tham chiếu xuống sau')}>
                            <ArrowDown size={13} />
                          </button>
                          <button type="button" onClick={() => removeReferenceImage(index)} aria-label={t('references.remove', 'Xóa ảnh tham chiếu')}>
                            <X size={13} />
                          </button>
                        </div>
                      </figure>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
            <div className="referenceSideFoot">
              <span>{referenceSideCount}/{referenceSideLimit}</span>
              <strong>{t('references.title', 'Ảnh tham chiếu (tùy chọn)')}</strong>
            </div>
          </>
        ) : (
          <button type="button" className="referenceSideCollapsed" onClick={() => toggleLayoutSection('references')} title={t('references.add', 'Thêm ảnh tham chiếu')}>
            <Images size={17} />
            <span>{t('references.add', 'Thêm ảnh tham chiếu')}</span>
          </button>
        )}
      </aside>
      <div className="deskPanel">
        {activeWorkspace === 'image' ? (
          <div className="modeTabs imageModeTabs">
            {DESK_MODES.map((item) => {
              const Icon = item.icon;
              return (
                <button type="button" className={mode === item.value ? 'active' : ''} key={item.value} onClick={() => setMode(item.value)}>
                  <Icon size={17} /> {deskModeLabel(item.value)}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="workspaceTitleStrip">
            <Video size={17} />
            <span>{t('workspace.video', 'Tạo video')}</span>
          </div>
        )}
        {selectedCase && mode === 'image' ? (
          <div className="caseMeta">
            <span>{typeof selectedCase.id === 'number' ? `#${selectedCase.id}` : t('gallery.external', 'Bên ngoài')}</span>
            <h2>{selectedCase.title}</h2>
            <p>{[categoryLabel(selectedCase.category || selectedCase.section || 'Mẫu'), selectedCase.sourceName].filter(Boolean).join(' · ')}</p>
            {Array.isArray(selectedCase.riskTags) && selectedCase.riskTags.length ? (
              <div className="riskStrip">
                {selectedCase.riskTags.map((item) => <span key={item}>{riskLabel(item)}</span>)}
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="presetChips">
          {visiblePromptPresets.map((item) => (
            <button type="button" key={item.id || item.title} onClick={() => applyPromptPreset(item)} disabled={caseResolving}>
              {item.title}
            </button>
          ))}
        </div>
        {mode !== 'video' ? (
          <CreativeRecipeBar
            recipes={CREATIVE_RECIPES}
            activeId={activeRecipeId}
            onApply={applyCreativeRecipe}
          />
        ) : null}
        {false && mode !== 'video' && mode !== 'mask' && layoutSections.references ? (
          <div className="referenceBox">
            <div className="miniPanelHead">
              <strong>{t('references.title', 'Ảnh tham chiếu (tùy chọn)')}</strong>
              <button type="button" onClick={() => toggleLayoutSection('references')} aria-label={t('references.collapse', 'Thu gọn ảnh tham chiếu')}>
                <PanelLeftClose size={15} />
              </button>
            </div>
            <label
              className={`uploadDrop ${referenceDropActive ? 'isDragging' : ''}`}
              tabIndex={0}
              onDragEnter={(event) => {
                event.preventDefault();
                setReferenceDropActive(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setReferenceDropActive(true);
              }}
              onDragLeave={() => setReferenceDropActive(false)}
              onDrop={(event) => {
                event.preventDefault();
                setReferenceDropActive(false);
                appendReferenceImages(event.dataTransfer?.files);
              }}
              onPaste={referencePasteFiles}
            >
              <Upload size={18} />
              <span>{referenceFiles.length ? t('references.selected', 'Đã chọn {count} ảnh', { count: referenceFiles.length }) : t('references.upload', 'Kéo / dán / tải ảnh tham chiếu lên')}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={(event) => {
                  appendReferenceImages(event.target.files);
                  event.target.value = '';
                }}
              />
            </label>
            {referencePreviews.length ? (
              <div className="referenceThumbs">
                {referencePreviews.map((url, index) => (
                  <figure key={url}>
                    <LazyImage src={url} alt={referenceItems[index]?.file?.name || t('references.referenceIndex', 'Ảnh tham chiếu {index}', { index: index + 1 })} />
                    <figcaption>
                      <select
                        value={referenceItems[index]?.role || 'identity'}
                        onChange={(event) => updateReferenceRole(index, event.target.value)}
                        aria-label={t('references.role', 'Vai trò của ảnh tham chiếu {index}', { index: index + 1 })}
                      >
                        {REFERENCE_ROLES.map((role) => (
                          <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                      </select>
                      <span>{index === 0 ? t('references.mainReference', 'Ảnh tham chiếu chính') : t('references.referenceIndex', 'Ảnh tham chiếu {index}', { index: index + 1 })}</span>
                    </figcaption>
                    <div className="referenceThumbActions">
                      <button type="button" onClick={() => moveReferenceImage(index, -1)} disabled={index === 0} aria-label={t('references.moveBefore', 'Đưa ảnh tham chiếu lên trước')}>
                        <ArrowUp size={13} />
                      </button>
                      <button type="button" onClick={() => moveReferenceImage(index, 1)} disabled={index === referencePreviews.length - 1} aria-label={t('references.moveAfter', 'Đưa ảnh tham chiếu xuống sau')}>
                        <ArrowDown size={13} />
                      </button>
                      <button type="button" onClick={() => removeReferenceImage(index)} aria-label={t('references.remove', 'Xóa ảnh tham chiếu')}>
                        <X size={13} />
                      </button>
                    </div>
                  </figure>
                ))}
              </div>
            ) : null}
          </div>
        ) : mode !== 'video' && mode !== 'mask' ? (
          <button type="button" className="collapsedWorkbenchBlock referenceCollapsedBlock" onClick={() => toggleLayoutSection('references')}>
            <Upload size={16} />
            <span>{referenceFiles.length ? t('references.collapsedSelected', 'Đã thu gọn ảnh tham chiếu, tổng cộng {count} ảnh', { count: referenceFiles.length }) : t('references.collapsedEmpty', 'Ảnh tham chiếu đã thu gọn. Mở rộng để kéo, dán hoặc tải ảnh lên.')}</span>
          </button>
        ) : null}
        {false && mode === 'mask' && layoutSections.references ? (
          <div className="referenceBox maskReferenceBox">
            <div className="miniPanelHead">
              <strong>{t('references.maskTitle', 'Ảnh tham chiếu và mặt nạ')}</strong>
              <button type="button" onClick={() => toggleLayoutSection('references')} aria-label={t('references.collapse', 'Thu gọn ảnh tham chiếu')}>
                <PanelLeftClose size={15} />
              </button>
            </div>
            <MaskEditor
              ref={maskEditorRef}
              imageFile={maskSourceFile}
              imagePreview={maskSourcePreview}
              onUpload={(files) => {
                const nextFile = supportedReferenceFiles(files, 1)[0];
                if (!nextFile) {
                  setStatus('error');
                  setMessage(t('statusMessages.referenceUnsupported', 'Chỉ hỗ trợ ảnh tham chiếu PNG / JPG / WebP.'));
                  return;
                }
                setReferenceItems([createReferenceItem(nextFile, 'identity')]);
                if (maskExportUrl) {
                  URL.revokeObjectURL(maskExportUrl);
                  setMaskExportUrl('');
                }
                setStatus('idle');
                setMessage('');
              }}
              onClearImage={clearReferenceImages}
              onExportReady={handleMaskExportReady}
              onError={(nextMessage) => {
                setStatus('error');
                setMessage(nextMessage);
              }}
              onGenerate={selectedCanvasNode ? generateMaskFromPanel : null}
              generating={status === 'loading'}
            />
            {maskExportUrl ? (
              <div className="maskExportPreview">
                <img src={maskExportUrl} alt="Mask đã xuất" />
                <span>{t('references.exportedMask', 'Đã xuất mask.png')}</span>
              </div>
            ) : null}
          </div>
        ) : mode === 'mask' ? (
          <button type="button" className="collapsedWorkbenchBlock referenceCollapsedBlock" onClick={() => toggleLayoutSection('references')}>
            <Upload size={16} />
            <span>{t('references.maskCollapsed', 'Ảnh tham chiếu và mặt nạ đã thu gọn. Mở rộng để tiếp tục chỉnh sửa.')}</span>
          </button>
        ) : null}
        {false && mode === 'video' && layoutSections.references ? (
          <div className="referenceBox">
            <div className="miniPanelHead">
              <strong>{t('references.title', 'Ảnh tham chiếu (tùy chọn)')}</strong>
              <button type="button" onClick={() => toggleLayoutSection('references')} aria-label={t('references.collapse', 'Thu gọn ảnh tham chiếu')}>
                <PanelLeftClose size={15} />
              </button>
            </div>
            <label
              className={`uploadDrop ${videoDropActive ? 'isDragging' : ''}`}
              tabIndex={0}
              onDragEnter={(event) => {
                event.preventDefault();
                setVideoDropActive(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setVideoDropActive(true);
              }}
              onDragLeave={() => setVideoDropActive(false)}
              onDrop={(event) => {
                event.preventDefault();
                setVideoDropActive(false);
                appendVideoReferenceImage(event.dataTransfer?.files);
              }}
              onPaste={videoReferencePasteFiles}
            >
              <Upload size={18} />
              <span>{videoReferenceFiles.length ? t('references.selectedVideo', 'Đã chọn video tham chiếu') : t('references.optionalUpload', 'Kéo / dán / tải ảnh tham chiếu lên (tùy chọn)')}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => {
                  appendVideoReferenceImage(event.target.files);
                  event.target.value = '';
                }}
              />
            </label>
            {videoReferencePreviews.length ? (
              <div className="referenceThumbs videoReferenceThumbs">
                {videoReferencePreviews.map((url, index) => (
                  <figure key={url}>
                    <LazyImage src={url} alt={videoReferenceFiles[index]?.name || t('references.videoReference', 'Video tham chiếu')} />
                    <button type="button" onClick={removeVideoReferenceImage} aria-label={t('references.remove', 'Xóa ảnh tham chiếu')}>
                      <X size={13} />
                    </button>
                  </figure>
                ))}
              </div>
            ) : null}
          </div>
        ) : mode === 'video' ? (
          <button type="button" className="collapsedWorkbenchBlock referenceCollapsedBlock" onClick={() => toggleLayoutSection('references')}>
            <Upload size={16} />
            <span>{videoReferenceFiles.length ? t('references.collapsedVideoSelected', 'Đã thu gọn ảnh tham chiếu, tổng cộng 1 ảnh') : t('references.collapsedSimple', 'Ảnh tham chiếu đã thu gọn. Nhấn để mở rộng.')}</span>
          </button>
        ) : null}
        {layoutSections.parameters && mode !== 'video' ? (
          <div className="routeStrip autoRouteStrip">
            <span><SlidersHorizontal size={15} /> {t('composer.routeLabel', 'API')}</span>
            <p>{mode === 'mask' || (mode === 'edit' && (referenceFiles.length || selectedCanvasNode?.url)) ? t('composer.routeEditHint', 'Ảnh tham chiếu / Mask sẽ tự dùng /v1/images/edits') : t('composer.routeImageHint', 'Tạo ảnh từ văn bản / tạo biến thể sẽ dùng /v1/images/generations')}</p>
          </div>
        ) : layoutSections.parameters ? (
          <div className="routeStrip">
            <span><Video size={15} /> {t('composer.videoRouteLabel', 'API video')}</span>
            <div><button type="button" className="active">{t('composer.videoTask', 'Tác vụ')}</button></div>
          </div>
        ) : null}
        {layoutSections.parameters ? <div className="controlGrid">
          {mode === 'video' ? (
            <>
                <label className="controlField modelField">
                  <span>{t('params.videoModel', 'Model video')}</span>
                  <select value={hasVideoModels ? videoModel : ''} onChange={(event) => setVideoModel(event.target.value)} disabled={!hasVideoModels}>
                    {hasVideoModels ? videoModelOptions.map((item) => <option key={item.id} value={item.id}>{item.label || item.id}</option>) : (
                      <option value="">{t('params.currentKeyNoVideo', 'Key hiện tại chưa được cấp quyền dùng model video')}</option>
                    )}
                  </select>
                </label>
              <div className="controlField">
                <span>{t('params.duration', 'Thời lượng')}</span>
                <div className="optionSegment durationSegment">
                  {VIDEO_DURATIONS.map((item) => (
                    <button type="button" className={videoDuration === item ? 'active' : ''} key={item} onClick={() => setVideoDuration(item)}>
                      {item}s
                    </button>
                  ))}
                </div>
              </div>
              <div className="controlField wideControl">
                <span>{t('params.videoAspect', 'Tỷ lệ video')}</span>
                <div className="optionSegment videoSizeSegment">
                  {VIDEO_ASPECT_OPTIONS.map((item) => (
                    <button type="button" className={videoAspect === item.value ? 'active' : ''} key={item.value} onClick={() => setVideoAspect(item.value)}>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="controlField">
                <span>{t('params.fps', 'Tốc độ khung hình')}</span>
                <div className="optionSegment fpsSegment">
                  {VIDEO_FPS_OPTIONS.map((item) => (
                    <button type="button" className={videoFps === item ? 'active' : ''} key={item} onClick={() => setVideoFps(item)}>
                      {item} fps
                    </button>
                  ))}
                </div>
              </div>
              <div className="controlField videoSpecField">
                <span>{t('params.output', 'Đầu ra')}</span>
                <strong>{videoSize.width} x {videoSize.height}</strong>
              </div>
              <div className="controlField wideControl">
                <span>{t('params.motion', 'Chuyển động máy quay')}</span>
                <div className="optionSegment motionSegment">
                  {VIDEO_MOTIONS.map((item) => (
                    <button type="button" className={videoMotion === item.value ? 'active' : ''} key={item.value} onClick={() => setVideoMotion(item.value)}>
                      {videoMotionLabel(item)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="controlField">
                <span>{t('params.style', 'Phong cách')}</span>
                <div className="optionSegment videoStyleSegment">
                  {VIDEO_STYLES.map((item) => (
                    <button type="button" className={videoStyle === item.value ? 'active' : ''} key={item.value} onClick={() => setVideoStyle(item.value)}>
                      {videoStyleLabel(item)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="controlField">
                <span>{t('params.videoQuality', 'Chất lượng video')}</span>
                <div className="optionSegment videoQualitySegment">
                  {VIDEO_QUALITY.map((item) => (
                    <button type="button" className={videoQuality === item ? 'active' : ''} key={item} onClick={() => setVideoQuality(item)}>
                      {item === 'auto' ? t('params.auto', 'Tự động') : item === 'high' ? t('params.high', 'Cao') : t('params.standard', 'Tiêu chuẩn')}
                    </button>
                  ))}
                </div>
              </div>
              <label className="controlField wideControl negativePromptField">
                <span>{t('params.negativePrompt', 'Prompt loại trừ')}</span>
                <input
                  value={negativePrompt}
                  onChange={(event) => setNegativePrompt(event.target.value)}
                  placeholder={t('params.negativePromptPlaceholder', 'Ví dụ: không phụ đề, hình mờ, méo hình, nhấp nháy, biến dạng bàn tay')}
                />
              </label>
            </>
          ) : (
            <>
              <label className="controlField modelField">
                <span>{t('params.imageModel', 'Model ảnh')}</span>
                <select value={model} onChange={(event) => setModel(event.target.value)}>
                  {imageModelOptions.map((item) => <option key={item.id} value={item.id}>{item.label || item.id}</option>)}
                </select>
              </label>
              <div className="controlField countField">
                <div className="fieldHead">
                  <span>{t('params.imageCount', 'Số ảnh')}</span>
                  <strong>{countValue}</strong>
                </div>
                <input
                  type="range"
                  min={imageCountRange.min}
                  max={imageCountRange.max}
                  value={countValue}
                  onChange={(event) => setCount(clampCountForProvider(event.target.value, currentImageProvider))}
                />
              </div>
              <div className="controlField wideControl">
                <span>{t('params.aspect', 'Tỷ lệ ảnh')}</span>
                <div className="optionSegment sizeSegment">
                  {imageAspectOptions.map((item) => (
                    <button
                      type="button"
                      className={aspect === item.value ? 'active' : ''}
                      key={item.value}
                      onClick={() => {
                        setAspect(item.value);
                        if (item.value !== 'custom') setCustomSize(item.size);
                      }}
                    >
                      {resolutionTierLabel(item)}
                    </button>
                  ))}
                </div>
                {aspect === 'custom' ? (
                  <>
                    <select className="compactSelect" aria-label={t('params.apiSize', 'Kích thước API')} value={customSize} onChange={(event) => setCustomSize(normalizeSize(event.target.value))}>
                      {customSizeOptions.map((item) => <option key={item.value} value={item.value}>{customSizeLabel(item)}</option>)}
                    </select>
                    <small className="sizeLimitHint">{t('params.sizeHint', 'Danh sách kích thước được model hiện tại hỗ trợ; mức 2K/4K sẽ được thêm vào prompt làm mục tiêu độ nét.')}</small>
                  </>
                ) : null}
              </div>
              <div className="controlField">
                <span>{t('params.quality', 'Chất lượng')}</span>
                <div className="optionSegment qualitySegment">
                  {imageQualityOptions.map((item) => (
                    <button type="button" className={quality === item ? 'active' : ''} key={item} onClick={() => setQuality(item)}>
                      {qualityLabel(item)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="controlField">
                <span>{t('params.resolution', 'Độ phân giải')}</span>
                <div className="optionSegment resolutionSegment">
                  {imageResolutionTierOptions.map((item) => (
                    <button type="button" className={resolutionTier === item.value ? 'active' : ''} key={item.value} onClick={() => setResolutionTier(item.value)}>
                      {resolutionTierLabel(item)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="controlField">
                <span>{t('params.format', 'Định dạng')}</span>
                <div className="optionSegment formatSegment">
                  {imageOutputFormatOptions.map((item) => (
                    <button type="button" className={outputFormat === item ? 'active' : ''} key={item} onClick={() => setOutputFormat(item)}>
                      {OUTPUT_FORMAT_LABELS[item] || item}
                    </button>
                  ))}
                </div>
              </div>
              <div className="controlField">
                <span>{t('params.moderation', 'Kiểm duyệt')}</span>
                <div className="optionSegment moderationSegment">
                  {MODERATION.map((item) => (
                    <button type="button" className={moderation === item ? 'active' : ''} key={item} onClick={() => setModeration(item)}>
                      {MODERATION_LABELS[item] || item}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div> : (
          <button type="button" className="collapsedWorkbenchBlock" onClick={() => toggleLayoutSection('parameters')}>
            <SlidersHorizontal size={16} />
            <span>{mode === 'video' ? `${videoAspect} · ${videoDuration}s · ${videoFps}fps` : `${size} · ${RESOLUTION_TIER_LABELS[resolutionTier]} · ${qualityLabel(quality)}`}</span>
          </button>
        )}
        {layoutSections.parameters ? <div className="billingStrip">
          <span>{t('params.billingModelSource', 'Nguồn model: {value}', {
            value: mode === 'video'
              ? (modelsStatus === 'loading' ? t('params.loadingVideoModels', 'Đang tải model video') : hasVideoModels ? t('params.availableVideoModels', 'Model video khả dụng với key hiện tại') : t('params.unavailableVideoModels', 'Key hiện tại chưa được cấp quyền dùng model video'))
              : modelsStatus === 'ready'
                ? t('params.availableModels', 'Model khả dụng với key hiện tại')
                : modelsStatus === 'loading'
                  ? t('params.loadingModels', 'Đang tải model')
                  : t('params.defaultModels', 'Model mặc định')
          })}</span>
          <span>{t('params.billingUnit', 'Đơn vị tính phí: {value}', { value: mode === 'video' ? modelBillingUnitLabel(activeVideoModelInfo, t('params.videoUnit', 'đoạn'), 1) : modelBillingLabel(activeModelInfo, countValue) })}</span>
          {mode === 'video' && videoTask?.task_id ? <span>{t('params.videoTask', 'Tác vụ: {value}', { value: videoTask.task_id })}</span> : null}
          <span>{t('params.usage', 'Mức sử dụng tài khoản: {value}', { value: usageSummary || t('params.usageFallback', 'Sau khi tạo, xem thông tin trong hồ sơ dịch vụ') })}</span>
        </div> : null}
        <div className="deskActions">
          <button type="button" onClick={optimizeCurrentPrompt} disabled={optimizingPrompt}>
            {optimizingPrompt ? <LoaderCircle className="spin" size={18} /> : <WandSparkles size={18} />}
            {optimizingPrompt ? t('composer.optimizing', 'Đang tối ưu') : `AI ${t('composer.optimize', 'Tối ưu')}`}
          </button>
          <button type="button" className={`primaryAction ${generationActionClass}`} onClick={handleGenerateAction} disabled={generationActionDisabled}>
            {generationActionIcon}
            {generationActionLabel}
          </button>
        </div>
        {!layoutSections.bottomComposer ? (
          <>
            <ProgressBar progress={progress} active={status === 'loading' || status === 'success' || progress.stage === 'failed' || progress.stage === 'pending_review'} />
            <GenerationTimingPanel timing={timing} />
            {message ? <p className={`statusLine ${status}`}>{message}</p> : null}
            {isGenerating ? (
              <button type="button" className="composerStopAction" onClick={stopGeneration}>
                <X size={14} />
                {t('composer.stopWaiting', 'Dừng chờ')}
              </button>
            ) : null}
          </>
        ) : null}
      </div>
      <section className={`resultStage ${hasPrimaryResult ? 'hasResult' : ''}`}>
        <div className="resultStageHead">
          <strong>{mode === 'video' ? t('canvas.videoResult', 'Kết quả video') : t('composer.resultTitle', 'Kết quả')}</strong>
          <span>{hasPrimaryResult ? t('composer.resultCount', 'Tổng cộng {count} ảnh', { count: mode === 'video' ? videoResults.length : results.length }) : t('composer.pending', 'Chờ tạo')}</span>
        </div>
        {mode === 'video' ? (
          <VideoResultGrid urls={videoResults} downloadMeta={currentDownloadMeta} onPreview={(url, index) => setPreviewVideo({ url, index })} t={t} />
        ) : (
          <ResultGrid urls={results} outputFormat={outputFormat} downloadMeta={currentDownloadMeta} onPreview={(url, index) => setPreviewImage({ url, index })} t={t} />
        )}
      </section>
      <div className={`bottomComposerBar ${selectedCanvasNode ? 'hasLineage' : ''} ${conversationVisible ? 'hasThread' : 'noThread'} ${layoutSections.composerParameters === false ? 'paramsCollapsed' : 'paramsExpanded'} ${composerFolded ? 'isFolded' : 'isExpandedComposer'} noReferences`}>
        {composerThreadHasContent ? (
          <div className="composerPanelHead">
            <button type="button" className="conversationToggle" onClick={() => setConversationOpen((value) => !value)} aria-expanded={conversationVisible} title={conversationVisible ? t('composer.hideConversation', 'Ẩn hội thoại') : t('composer.showConversation', 'Xem hội thoại')}>
              <History size={14} />
              {conversationVisible ? t('composer.hideConversation', 'Ẩn hội thoại') : t('composer.showConversation', 'Xem hội thoại')}
            </button>
          </div>
        ) : null}
        {conversationVisible ? (
          <div className={`composerThread ${composerThreadHasContent ? '' : 'isEmpty'}`} ref={composerThreadRef} aria-label={t('composer.aiThread', 'Lịch sử trò chuyện với AI')}>
            {composerGenerationVisible ? (
              <div className={`composerGenerationCard ${status} ${progress.stage === 'pending_review' ? 'pendingReview' : ''}`}>
                <div className="composerGenerationHead">
                  <strong>{isGenerating ? t('composer.statusGenerating', 'Đang tạo') : status === 'success' ? t('composer.statusDone', 'Đã tạo xong') : progress.stage === 'pending_review' ? t('composer.statusReview', 'Cần xác nhận') : assistantErrorShown ? t('composer.statusAssistantError', 'Lỗi trợ lý prompt') : status === 'error' ? t('composer.statusError', 'Lỗi tạo ảnh') : t('composer.status', 'Trạng thái tạo ảnh')}</strong>
                  <span>{assistantErrorShown ? assistantError.model : mode === 'video' ? videoModel : model}</span>
                  <em>{assistantErrorShown ? '/chat/completions' : composerRouteLabel}</em>
                </div>
                <ProgressBar progress={progress} active={status === 'loading' || status === 'success' || progress.stage === 'failed' || progress.stage === 'pending_review'} />
                <GenerationTimingPanel timing={timing} />
                {message ? <p className={`statusLine ${status}`}>{message}</p> : null}
                {isGenerating ? (
                  <button type="button" className="composerStopAction" onClick={stopGeneration}>
                    <X size={14} />
                    {t('composer.stopWaiting', 'Dừng chờ')}
                  </button>
                ) : null}
              </div>
            ) : null}
            {assistantMessages.length ? assistantMessages.slice(-8).map((item) => (
              <div className={`composerMessage ${item.role} ${item.pending ? 'pending' : ''} ${item.failed ? 'failed' : ''}`} key={item.id}>
                <span>{item.role === 'assistant' ? 'AI' : t('composer.you', 'Bạn')}</span>
                <p>{item.content}</p>
                {item.finalPrompt ? <button type="button" onClick={() => setPrompt(item.finalPrompt)}>{t('composer.putIntoInput', 'Đưa vào ô nhập')}</button> : null}
              </div>
            )) : null}
            <PromptSuggestion
              suggestion={promptSuggestion}
              onMerge={mergeSuggestion}
              onReplace={replaceSuggestion}
              onCopy={copySuggestion}
              onUse={useSuggestionForGenerate}
              t={t}
            />
          </div>
        ) : null}
        <div
          className={`composerPromptRow ${referenceDropActive || videoDropActive ? 'isDroppingReference' : ''}`}
          onDragEnter={(event) => {
            if (!supportedReferenceFiles(event.dataTransfer?.files || event.dataTransfer?.items, mode === 'video' ? 1 : IMAGE_REFERENCE_LIMIT).length) return;
            event.preventDefault();
            if (mode === 'video') setVideoDropActive(true);
            else setReferenceDropActive(true);
          }}
          onDragOver={(event) => {
            if (!supportedReferenceFiles(event.dataTransfer?.files || event.dataTransfer?.items, mode === 'video' ? 1 : IMAGE_REFERENCE_LIMIT).length) return;
            event.preventDefault();
            if (mode === 'video') setVideoDropActive(true);
            else setReferenceDropActive(true);
          }}
          onDragLeave={() => {
            setReferenceDropActive(false);
            setVideoDropActive(false);
          }}
          onDrop={(event) => {
            const files = supportedReferenceFiles(event.dataTransfer?.files, mode === 'video' ? 1 : IMAGE_REFERENCE_LIMIT);
            if (!files.length) return;
            event.preventDefault();
            setReferenceDropActive(false);
            setVideoDropActive(false);
            if (mode === 'video') appendVideoReferenceImage(files);
            else appendReferenceImages(files);
          }}
        >
          <label className="bottomComposerInput">
            <textarea
              ref={promptInputRef}
              rows={2}
              aria-label={t('composer.promptLabel', 'Mô tả ảnh muốn tạo')}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onPaste={(event) => {
                if (mode === 'video') videoReferencePasteFiles(event);
                else referencePasteFiles(event);
              }}
              onFocus={() => {
                if (!layoutSections.bottomComposer) toggleLayoutSection('bottomComposer');
              }}
              onKeyDown={(event) => {
                if (event.nativeEvent.isComposing) return;
                if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                  event.preventDefault();
                  handleImprovePrompt();
                  return;
                }
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleGenerateAction();
                }
              }}
              placeholder={selectedCanvasNode ? t('composer.placeholderCanvas', 'Mô tả cách bạn muốn chỉnh ảnh này…') : mode === 'video' ? t('composer.placeholderVideo', 'Mô tả video bạn muốn tạo…') : t('composer.placeholder', 'Mô tả ảnh bạn muốn tạo…')}
            />
          </label>
          <div className="composerActionBar">
          {!isReady ? <button type="button" className="composerConnectionNotice" onClick={onOpenSettings}><KeyRound size={14} />{t('composer.connectKey', 'Kết nối API key để bắt đầu')}</button> : null}
          <div className="composerActionGroup">
            <button
              type="button"
              className="composerAssistantAction"
              onClick={handleImprovePrompt}
              disabled={!isReady || !prompt.trim() || status === 'loading' || optimizingPrompt || caseResolving}
              aria-label={t('composer.improvePrompt', 'Cải thiện prompt')}
              title={t('composer.improveShortcut', 'Cải thiện prompt · Ctrl/⌘+Enter')}
            >
              {optimizingPrompt ? <LoaderCircle className="spin" size={16} /> : <WandSparkles size={16} />}
              <span>{optimizingPrompt ? t('composer.optimizing', 'Đang cải thiện') : t('composer.improvePrompt', 'Cải thiện prompt')}</span>
            </button>
            <button
              type="button"
              className={`composerGenerateAction ${generationActionClass}`}
              onClick={handleGenerateAction}
              disabled={generationActionDisabled || !isReady || !prompt.trim() || caseResolving || optimizingPrompt}
              title={generationActionLabel}
            >
              {compactGenerationActionIcon}
              <span>{generationActionLabel}</span>
            </button>
          </div>
          </div>
        </div>
        <div className="composerParamShelf compactParameters" aria-label={t('params.current', 'Thông số hiện tại')}>
          {activeWorkspace === 'image' ? (
            <select className="compactModeSelect" value={mode} aria-label={t('workspace.image', 'Tạo ảnh')} title={t('workspace.image', 'Tạo ảnh')} onChange={(event) => {
              setMode(event.target.value);
              if (event.target.value === 'edit' || event.target.value === 'mask') updateLayoutSections({ references: true });
            }}>
              {DESK_MODES.map((item) => <option value={item.value} key={item.value}>{deskModeLabel(item.value)}</option>)}
            </select>
          ) : null}
          <button type="button" onClick={() => openParamPanel('model')} title={t('params.model', 'Model')} aria-label={t('params.model', 'Model')}><Server size={13} /><span>{mode === 'video' ? videoModel || t('params.videoModel', 'Model video') : model}</span></button>
          <button type="button" onClick={() => openParamPanel('size')} title={t('params.size', 'Kích thước')} aria-label={t('params.size', 'Kích thước')}>{mode === 'video' ? videoAspect : aspect}</button>
          <button type="button" onClick={() => openParamPanel('quality')} title={t('params.quality', 'Chất lượng')} aria-label={t('params.quality', 'Chất lượng')}>{mode === 'video' ? qualityLabel(videoQuality) : `${qualityLabel(quality)} · ${RESOLUTION_TIER_LABELS[resolutionTier]}`}</button>
          <button type="button" onClick={() => openParamPanel('count')} title={mode === 'video' ? t('params.duration', 'Thời lượng') : t('params.count', 'Số lượng')} aria-label={mode === 'video' ? t('params.duration', 'Thời lượng') : t('params.count', 'Số lượng')}>{mode === 'video' ? `${videoDuration}s` : `${countValue} ${imageCountSuffix}`}</button>
          <button type="button" onClick={onOpenSettings} title={t('rail.settings', 'Cài đặt kết nối')} aria-label={t('rail.settings', 'Cài đặt kết nối')}><SlidersHorizontal size={14} /></button>
        </div>
        <div className="composerHelpLine">{t('composer.shortcuts', 'Enter để tạo · Shift+Enter để xuống dòng')}</div>
      </div>
      <aside className="paramRail" aria-label={t('params.aria', 'Thông số')}>
        <button
          type="button"
          className="paramRailHead"
          onClick={() => {
            const nextExpanded = layoutSections.parametersRail === false;
            if (nextExpanded && !activeParamPanel) setActiveParamPanel('model');
            if (!nextExpanded) setActiveParamPanel('');
            updateLayoutSections({ parametersRail: nextExpanded, parameters: true });
          }}
          aria-label={layoutSections.parametersRail === false ? t('params.expand', 'Mở thanh thông số') : t('params.collapse', 'Thu gọn thanh thông số')}
          title={layoutSections.parametersRail === false ? t('params.expand', 'Mở thanh thông số') : t('params.collapse', 'Thu gọn thanh thông số')}
        >
          {layoutSections.parametersRail === false ? (
            <SlidersHorizontal size={18} />
          ) : (
            <>
              <span>›</span>
              {t('params.aria', 'Thông số')}
            </>
          )}
        </button>
        <button type="button" className={activeParamPanel === 'model' ? 'active' : ''} onClick={() => openParamPanel('model')} aria-label={t('params.model', 'Model')} title={t('params.model', 'Model')}>
          <Server size={18} />
          <span>{t('params.model', 'Model')}</span>
        </button>
        <button type="button" className={activeParamPanel === 'size' ? 'active' : ''} onClick={() => openParamPanel('size')} aria-label={t('params.size', 'Kích thước')} title={t('params.size', 'Kích thước')}>
          <ScanLine size={18} />
          <span>{t('params.size', 'Kích thước')}</span>
        </button>
        <button type="button" className={activeParamPanel === 'quality' ? 'active' : ''} onClick={() => openParamPanel('quality')} aria-label={t('params.quality', 'Chất lượng')} title={t('params.quality', 'Chất lượng')}>
          <span className="paramRailBadge">HD</span>
          <span>{t('params.quality', 'Chất lượng')}</span>
        </button>
        <button type="button" className={activeParamPanel === 'count' ? 'active' : ''} onClick={() => openParamPanel('count')} aria-label={t('params.count', 'Số lượng')} title={t('params.count', 'Số lượng')}>
          <Images size={18} />
          <span>{t('params.count', 'Số lượng')}</span>
        </button>
        <button type="button" className={`paramGenerateAction ${generationActionClass}`} onClick={handleGenerateAction} disabled={generationActionDisabled} aria-label={generationActionLabel} title={generationActionLabel}>
          {generationActionIcon}
          <span>{generationActionLabel}</span>
        </button>
      </aside>
      {layoutSections.parameters && activeParamPanel ? (
        <aside className="paramDrawer" aria-label={t('params.current', 'Thông số hiện tại')}>
          <div className="paramDrawerHead">
            <strong>{activeParamPanel === 'model' ? t('params.model', 'Model') : activeParamPanel === 'size' ? t('params.size', 'Kích thước') : activeParamPanel === 'quality' ? t('params.quality', 'Chất lượng') : t('params.count', 'Số lượng')}</strong>
            <button type="button" onClick={() => toggleLayoutSection('parameters')} aria-label={t('params.close', 'Thu gọn thông số')}>
              <PanelLeftClose size={15} />
            </button>
          </div>
          {activeParamPanel === 'model' ? (
            <div className="paramDrawerBody">
              {mode === 'video' ? (
                <label className="paramField">
                  <span>{t('params.videoModel', 'Model video')}</span>
                  <select value={hasVideoModels ? videoModel : ''} onChange={(event) => setVideoModel(event.target.value)} disabled={!hasVideoModels}>
                    {hasVideoModels ? videoModelOptions.map((item) => <option key={item.id} value={item.id}>{item.label || item.id}</option>) : (
                      <option value="">{t('params.currentKeyNoVideo', 'Key hiện tại chưa được cấp quyền dùng model video')}</option>
                    )}
                  </select>
                </label>
              ) : (
                <label className="paramField">
                  <span>{t('params.imageModel', 'Model ảnh')}</span>
                  <select value={model} onChange={(event) => setModel(event.target.value)}>
                    {imageModelOptions.map((item) => <option key={item.id} value={item.id}>{item.label || item.id}</option>)}
                  </select>
                </label>
              )}
              {mode !== 'video' ? (
                <div className="paramHint">
                  {mode === 'mask' || (mode === 'edit' && (referenceFiles.length || selectedCanvasNode?.url)) ? t('params.routeEdits', 'Tự động dùng /v1/images/edits.') : t('params.routeGenerations', 'Tự động dùng /v1/images/generations.')}
                </div>
              ) : null}
            </div>
          ) : null}
          {activeParamPanel === 'size' ? (
            <div className="paramDrawerBody">
              {mode === 'video' ? (
                <>
                  <div className="paramSegment">
                    {VIDEO_ASPECT_OPTIONS.map((item) => (
                      <button type="button" className={videoAspect === item.value ? 'active' : ''} key={item.value} onClick={() => setVideoAspect(item.value)}>{item.label}</button>
                    ))}
                  </div>
                  <div className="paramHint">{t('params.outputSize', 'Đầu ra {width} x {height}', { width: videoSize.width, height: videoSize.height })}</div>
                </>
              ) : (
                <>
                  <div className="paramSegment">
                    {imageAspectOptions.map((item) => (
                      <button
                        type="button"
                        className={aspect === item.value ? 'active' : ''}
                        key={item.value}
                        onClick={() => {
                          setAspect(item.value);
                          if (item.value !== 'custom') setCustomSize(item.size);
                        }}
                      >
                        {aspectLabel(item)}
                      </button>
                    ))}
                  </div>
                  {aspect === 'custom' ? (
                    <label className="paramField">
                      <span>{t('params.apiSize', 'Kích thước API')}</span>
                      <select value={customSize} onChange={(event) => setCustomSize(normalizeSize(event.target.value))}>
                        {customSizeOptions.map((item) => <option key={item.value} value={item.value}>{customSizeLabel(item)}</option>)}
                      </select>
                    </label>
                  ) : null}
                  <div className="paramHint">{t('params.currentSizeHint', 'Kích thước yêu cầu hiện tại là {size}; mức 2K/4K sẽ được thêm vào prompt làm mục tiêu phân giải.', { size })}</div>
                </>
              )}
            </div>
          ) : null}
          {activeParamPanel === 'quality' ? (
            <div className="paramDrawerBody">
              {mode === 'video' ? (
                <div className="paramSegment">
                  {VIDEO_QUALITY.map((item) => (
                    <button type="button" className={videoQuality === item ? 'active' : ''} key={item} onClick={() => setVideoQuality(item)}>
                      {item === 'auto' ? t('params.auto', 'Tự động') : item === 'high' ? t('params.high', 'Cao') : t('params.standard', 'Tiêu chuẩn')}
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <div className="paramSegment">
                    {imageQualityOptions.map((item) => (
                      <button type="button" className={quality === item ? 'active' : ''} key={item} onClick={() => setQuality(item)}>
                        {qualityLabel(item)}
                      </button>
                    ))}
                  </div>
                  <div className="paramSegment">
                    {imageResolutionTierOptions.map((item) => (
                      <button type="button" className={resolutionTier === item.value ? 'active' : ''} key={item.value} onClick={() => setResolutionTier(item.value)}>
                        {resolutionTierLabel(item)}
                      </button>
                    ))}
                  </div>
                  <div className="paramHint">{t('params.resolutionHint', 'Mức phân giải sẽ được thêm vào yêu cầu tạo ảnh')}</div>
                </>
              )}
            </div>
          ) : null}
          {activeParamPanel === 'count' ? (
            <div className="paramDrawerBody">
              {mode === 'video' ? (
                <>
                  <div className="paramSegment">
                    {VIDEO_DURATIONS.map((item) => (
                      <button type="button" className={videoDuration === item ? 'active' : ''} key={item} onClick={() => setVideoDuration(item)}>{item}s</button>
                    ))}
                  </div>
                  <div className="paramSegment">
                    {VIDEO_FPS_OPTIONS.map((item) => (
                      <button type="button" className={videoFps === item ? 'active' : ''} key={item} onClick={() => setVideoFps(item)}>{item} fps</button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <label className="paramRange">
                    <span>{t('params.imageCount', 'Số ảnh')}</span>
                    <strong>{countValue}</strong>
                    <input type="range" min={imageCountRange.min} max={imageCountRange.max} value={countValue} onChange={(event) => setCount(clampCountForProvider(event.target.value, currentImageProvider))} />
                  </label>
                  <div className="paramSegment">
                    {imageOutputFormatOptions.map((item) => (
                      <button type="button" className={outputFormat === item ? 'active' : ''} key={item} onClick={() => setOutputFormat(item)}>{OUTPUT_FORMAT_LABELS[item] || item}</button>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : null}
          <button type="button" className={`paramDrawerGenerate ${generationActionClass}`} onClick={handleGenerateAction} disabled={generationActionDisabled}>
            {compactGenerationActionIcon}
            {isGenerating ? t('params.queueMore', 'Thêm vào hàng đợi') : needsReviewBeforeRetry ? t('params.confirmRetry', 'Xác nhận rồi thử lại') : status === 'error' ? t('params.retryParams', 'Thử lại với thông số hiện tại') : mode === 'video' ? t('params.generateVideo', 'Tạo video với thông số hiện tại') : t('params.generateImage', 'Tạo ảnh với thông số hiện tại')}
          </button>
        </aside>
      ) : null}
      <Lightbox
        url={previewImage?.url}
        index={previewImage?.index || 0}
        outputFormat={outputFormat}
        downloadMeta={previewImage?.downloadMeta || currentDownloadMeta}
        t={t}
        onClose={() => setPreviewImage(null)}
      />
      <VideoLightbox
        url={previewVideo?.url || previewVideo}
        index={previewVideo?.index || 0}
        downloadMeta={previewVideo?.downloadMeta || currentDownloadMeta}
        onClose={() => setPreviewVideo('')}
      />
    </section>
  );
}

function SettingsPanel({
  open,
  onClose,
  apiKey,
  keys,
  onSelectKey,
  providerSettings,
  onProviderChange,
  modelOptions = { image: [], responses: [], video: [] },
  modelsStatus = 'idle',
  isAuthenticated,
  onLogin,
  t
}) {
  if (!open) return null;

  const gatewayAccountDisabled = providerSettings.apiKeySource === 'manual';
  const currentProvider = getImageProvider(providerSettings.providerId, providerSettings.apiKeySource);
  const providerCapabilityText = [
    currentProvider?.capabilities?.textToImage ? t('settings.capTextToImage', 'Tạo ảnh') : '',
    currentProvider?.capabilities?.imageEdit ? t('settings.capEdit', 'Chỉnh sửa') : '',
    currentProvider?.capabilities?.mask ? 'Mask' : '',
    currentProvider?.capabilities?.modelSync ? t('settings.capModelSync', 'Đồng bộ model') : ''
  ].filter(Boolean).join(' · ');
  const modelSyncLabel = modelsStatus === 'loading'
    ? t('settings.modelsSyncing', 'Đang đồng bộ model từ dịch vụ nguồn')
    : modelsStatus === 'ready'
      ? t('settings.modelsSynced', 'Đã đồng bộ model từ dịch vụ nguồn')
      : modelsStatus === 'fallback'
        ? t('settings.modelsFallback', 'Không lấy được model từ dịch vụ nguồn; đang dùng danh sách mặc định')
        : t('settings.modelsIdle', 'Model sẽ tự đồng bộ sau khi nhập API và key');
  const modelSyncMeta = t('settings.modelsSyncMeta', 'Ảnh {image} · Hội thoại {responses} · Video {video}', {
    image: modelOptions.image?.length || 0,
    responses: modelOptions.responses?.length || 0,
    video: modelOptions.video?.length || 0
  });
  const providerChoiceOrder = ['gateway-account', 'openai-compatible', 'newapi-compatible', 'nano-banana-compatible', 'video-compatible'];
  const providerChoices = [...IMAGE_PROVIDER_REGISTRY]
    .sort((left, right) => providerChoiceOrder.indexOf(left.id) - providerChoiceOrder.indexOf(right.id))
    .map((provider) => ({
      ...provider,
      active: provider.id === currentProvider?.id,
      nextApiKeySource: provider.authMode
    }));

  return (
    <div className="settingsOverlay" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="settingsDialog">
        <div className="settingsTitle">
          <h2>{t('settings.title', 'Kết nối')}</h2>
          <button type="button" className="iconButton" onClick={onClose} aria-label={t('settings.close', 'Đóng')}>×</button>
        </div>

        {providerSettings.apiKeySource === 'server' ? (
          <div className="providerSummary">
            <span>{t('settings.provider', 'Provider')}</span>
            <strong>{t('settings.serverKey', 'Key trên máy chủ')}</strong>
            <em>.env</em>
            <small>{t('settings.serverKeyHint', 'Địa chỉ API và key được cấu hình trong .env trên máy chủ (AI_GATEWAY_UPSTREAM, AI_GATEWAY_API_KEY); trình duyệt không giữ key.')}</small>
          </div>
        ) : (
          <>
          <div className="settingsGroup providerSettingsGroup">
            <label className="settingsSelectField">
              <small>{t('settings.providerFamily', 'Loại API')}</small>
              <select
                value={currentProvider?.id || providerSettings.providerId}
                onChange={(event) => {
                  const nextProvider = providerChoices.find((provider) => provider.id === event.target.value) || providerChoices[0];
                  onProviderChange({
                    ...providerSettings,
                    apiKeySource: nextProvider.nextApiKeySource,
                    providerId: nextProvider.id
                  });
                }}
              >
                {providerChoices.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.label}
                  </option>
                ))}
              </select>
            </label>
            <span>{t('settings.key', 'Key')}</span>
            <div className="providerChoiceGrid" role="group" aria-label={t('settings.providerFamily', 'Loại API')}>
              {providerChoices.map((provider) => (
                <button
                  type="button"
                  className={provider.active ? 'active' : ''}
                  key={provider.id}
                  onClick={() => onProviderChange({
                    ...providerSettings,
                    apiKeySource: provider.nextApiKeySource,
                    providerId: provider.id
                  })}
                >
                  <strong>{provider.label}</strong>
                  <em>{provider.authMode === 'manual' ? t('settings.providerManual', 'Key tự nhập') : t('settings.providerGateway', 'Tài khoản gateway')}</em>
                </button>
              ))}
            </div>
            <div className="segmentedControl legacyProviderToggle">
              <button
                type="button"
                className={usesGatewayAccount(providerSettings) ? 'active' : ''}
                onClick={() => onProviderChange({ ...providerSettings, apiKeySource: 'gateway', providerId: 'gateway-account' })}
              >
                Gateway
              </button>
              <button
                type="button"
                className={providerSettings.apiKeySource === 'manual' ? 'active' : ''}
                onClick={() => onProviderChange({ ...providerSettings, apiKeySource: 'manual', providerId: 'openai-compatible' })}
              >
                {t('settings.custom', 'Tùy chỉnh')}
              </button>
            </div>
          </div>

          <div className="providerSummary">
            <span>{t('settings.provider', 'Provider')}</span>
            <strong>{currentProvider?.label || providerSettings.providerId || 'Gateway Account'}</strong>
            <em>{currentProvider?.authMode === 'manual' ? t('settings.providerManual', 'Key tự nhập') : t('settings.providerGateway', 'Tài khoản gateway')}</em>
            <small>{providerCapabilityText || t('settings.providerCompatible', 'API tương thích OpenAI')}</small>
          </div>

          {usesGatewayAccount(providerSettings) ? (
            <div className="keyList">
              {isAuthenticated ? keys.map((item) => (
                <button type="button" className={item.id === apiKey?.id ? 'active' : ''} key={item.id} onClick={() => onSelectKey(item)}>
                  <KeyRound size={16} />
                  <span>{item.name}</span>
                  <em>{apiKeyDisplay(item)} · {apiKeyMeta(item)}</em>
                </button>
              )) : (
                <button type="button" className="loginInlineButton" onClick={onLogin}>
                  <KeyRound size={16} />
                  {t('settings.login', 'Đăng nhập')}
                </button>
              )}
              {isAuthenticated && !keys.length ? (
                <div className="settingsEmpty">{t('settings.noKey', 'Chưa có key khả dụng')}</div>
              ) : null}
            </div>
          ) : (
            <div className="manualFields">
              <label>
                <span>{t('settings.gateway', 'Địa chỉ API')}</span>
                <input
                  value={providerSettings.manualGatewayBaseUrl}
                  onChange={(event) => onProviderChange({ ...providerSettings, manualGatewayBaseUrl: event.target.value })}
                  placeholder={getConfiguredBaseUrls().gatewayBaseUrl}
                />
              </label>
              <label>
                <span>{t('settings.key', 'Key')}</span>
                <input
                  type="password"
                  value={providerSettings.manualApiKey}
                  onChange={(event) => onProviderChange({ ...providerSettings, manualApiKey: event.target.value })}
                  placeholder="sk-..."
                />
              </label>
            </div>
          )}
          </>
        )}

        <div className="manualFields">
          <p className="settingsHint">{t('settings.hint', 'Tạo ảnh dùng /v1/images/generations; chỉnh sửa bằng ảnh tham chiếu hoặc Mask dùng /v1/images/edits. Model trợ lý chỉ tối ưu prompt ở bên dưới và sử dụng hạn mức key hiện tại.')}</p>
          <div className="settingsCallConfig">
            <div className="settingsCallConfigHead">
              <strong>{t('settings.modelCallSettings', 'Cài đặt model')}</strong>
              <span>{t('settings.modelCallHint', 'Chọn model riêng cho tạo ảnh, chỉnh sửa, video và trợ lý prompt; ví dụ gpt-image-2, nano-banana, veo3.')}</span>
            </div>
            <div className="settingsCallGrid">
              <label>
                <span>{t('settings.imageGenerationModel', 'Model tạo ảnh')}</span>
                <input value={providerSettings.imageGenerationModel || ''} onChange={(event) => onProviderChange({ ...providerSettings, imageGenerationModel: event.target.value })} placeholder="gpt-image-2 / nano-banana" />
              </label>
              <label>
                <span>{t('settings.imageEditModel', 'Model chỉnh sửa / Mask')}</span>
                <input value={providerSettings.imageEditModel || ''} onChange={(event) => onProviderChange({ ...providerSettings, imageEditModel: event.target.value })} placeholder={providerSettings.imageGenerationModel || 'gpt-image-2'} />
              </label>
              <label>
                <span>{t('settings.videoModel', 'Model video')}</span>
                <input value={providerSettings.videoModel || ''} onChange={(event) => onProviderChange({ ...providerSettings, videoModel: event.target.value })} placeholder="veo3 / kling / runway" />
              </label>
              <label>
                <span>{t('settings.videoGateway', 'URL API video')}</span>
                <input value={providerSettings.videoGatewayBaseUrl || ''} onChange={(event) => onProviderChange({ ...providerSettings, videoGatewayBaseUrl: event.target.value })} placeholder={providerSettings.manualGatewayBaseUrl || getConfiguredBaseUrls().gatewayBaseUrl} />
              </label>
            </div>
          </div>
          <div className={`settingsModelSync ${modelsStatus}`}>
            <span>{modelSyncLabel}</span>
            <em>{modelSyncMeta}</em>
            <small>{t('settings.modelsProviderHint', 'Tương thích với API kiểu OpenAI / NewAPI; có thể mở rộng để hỗ trợ thêm nhiều nhà cung cấp.')}</small>
          </div>
          <label>
            <span>{t('settings.assistantModel', 'Model trợ lý')}</span>
            <input
              value={providerSettings.responsesModel}
              onChange={(event) => onProviderChange({ ...providerSettings, responsesModel: event.target.value })}
            />
          </label>
          <label>
            <span>{t('settings.previewFrames', 'Khung hình xem trước')}</span>
            <input
              type="number"
              min="0"
              max="3"
              value={providerSettings.partialImages}
              onChange={(event) => onProviderChange({ ...providerSettings, partialImages: event.target.value })}
            />
          </label>
        </div>

        <div className="settingsActions">
          <button type="button" onClick={() => onProviderChange({
            ...providerSettings,
            manualApiKey: '',
            manualGatewayBaseUrl: '',
            apiKeySource: gatewayAccountDisabled ? 'manual' : 'gateway',
            providerId: gatewayAccountDisabled ? 'openai-compatible' : 'gateway-account'
          })}>
            {t('settings.clear', 'Xóa')}
          </button>
          <button type="button" className="primaryAction" onClick={onClose}>{t('settings.done', 'Xong')}</button>
        </div>
      </section>
    </div>
  );
}

function LoginScreen({ onLoggedIn, t }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      onLoggedIn(await loginStudio(email, password));
    } catch (loginError) {
      setError(loginError?.status === 429
        ? t('login.rateLimited', 'Thử sai quá nhiều lần. Hãy đợi 15 phút rồi thử lại.')
        : loginError?.status === 401
          ? t('login.invalid', 'Email hoặc mật khẩu không đúng.')
          : t('login.failed', 'Không đăng nhập được. Kiểm tra dịch vụ lịch sử (studio-api) đang chạy.'));
      setBusy(false);
    }
  }

  return (
    <main className="studioLogin">
      <form className="studioLoginCard" onSubmit={submit}>
        <span className="sideBrandMark"><WandSparkles size={18} /></span>
        <h1>{t('login.title', 'Đăng nhập')}</h1>
        <p>{t('login.hint', 'Dùng email và mật khẩu được cấu hình trên máy chủ.')}</p>
        <label>
          <span>Email</span>
          <input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          <span>{t('login.password', 'Mật khẩu')}</span>
          <input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        {error ? <p className="studioLoginError" role="alert">{error}</p> : null}
        <button type="submit" className="primaryAction" disabled={busy}>
          {busy ? <LoaderCircle className="spin" size={16} /> : null}
          {t('login.submit', 'Đăng nhập')}
        </button>
      </form>
    </main>
  );
}

function hasLiveStudioSession(value) {
  return Boolean(value?.accessToken && Number(value.expiresAt) > Date.now());
}

const LAST_STUDIO_USER_KEY = 'ai-image-workbench:last-user:v1';

// The open canvas and draft are cached per browser, not per account; drop them when a different
// account signs in so one user's prompts and images never show up for the next.
function resetBrowserWorkspaceFor(email) {
  try {
    if (localStorage.getItem(LAST_STUDIO_USER_KEY) !== email) {
      clearCurrentSessionCache();
      clearDraft();
    }
    localStorage.setItem(LAST_STUDIO_USER_KEY, email);
  } catch {
    // Storage unavailable: nothing cached to leak.
  }
}

function StudioApp() {
  const initialCurrentSession = useMemo(() => loadCurrentSession(), []);
  // 'loading' until /studio-api/auth/config answers; 'password' = env login + server-held API key.
  const [authMode, setAuthMode] = useState('loading');
  const authModeRef = useRef('loading');
  const [siteData, setSiteData] = useState(null);
  const [session, setSession] = useState(() => loadSession());
  const [profile, setProfile] = useState(() => loadSession()?.user || null);
  const [providerSettings, setProviderSettings] = useState(() => loadProviderSettings());
  const [client, setClient] = useState(() => new AiGatewayClient({ session: loadSession(), providerSettings: loadProviderSettings() }));
  const [apiKey, setApiKey] = useState(null);
  const [keys, setKeys] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [favoriteTemplates, setFavoriteTemplates] = useState(() => loadTemplateFavorites());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bootError, setBootError] = useState('');
  const [historyItems, setHistoryItems] = useState(() => loadHistory());
  const [historyStatus, setHistoryStatus] = useState('idle');
  const [historyNextOffset, setHistoryNextOffset] = useState(null);
  const [historyLoadingMore, setHistoryLoadingMore] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [modelOptions, setModelOptions] = useState({ image: [], responses: [], video: [] });
  const [modelsStatus, setModelsStatus] = useState('idle');
  const [usageSummary, setUsageSummary] = useState('');
  const [theme, setTheme] = useState(() => loadTheme());
  const [language, setLanguage] = useState(() => loadStudioLanguage());
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState(() => initialCurrentSession?.mode === 'video' ? 'video' : 'image');
  const [appendTemplateRequest, setAppendTemplateRequest] = useState(null);
  const [remoteSession, setRemoteSession] = useState(null);
  const [remoteSessionReady, setRemoteSessionReady] = useState(() => !loadSession()?.accessToken);
  const [currentSessionSnapshot, setCurrentSessionSnapshot] = useState(() => initialCurrentSession);
  const [deskSessionId, setDeskSessionId] = useState(() => initialCurrentSession?.sessionId || `desk-${Date.now()}`);
  const [canvasFocusSignal, setCanvasFocusSignal] = useState(0);
  const sessionSaveRef = useRef({ timer: null, lastPayload: '' });
  const isLibraryLocked = LIBRARY_AUTH_REQUIRED && !session?.accessToken;
  const t = useMemo(() => createTranslator(language), [language]);
  const persistenceKey = session?.accessToken || 'local-workspace';

  function historyScope() {
    return historyScopeFromIdentity(session, profile);
  }

  async function hydrateSession(options = {}) {
    if (authModeRef.current === 'loading') return false;
    if (authModeRef.current === 'password') {
      const passwordSession = loadSession();
      if (!hasLiveStudioSession(passwordSession)) {
        clearSession();
        setSession(null);
        setProfile(null);
        return false;
      }
      setSession(passwordSession);
      setProfile(passwordSession.user || null);
      return true;
    }
    const nextSession = loadSession();
    if (!nextSession?.accessToken) {
      if (!options.keepExisting) {
        setSession(null);
        setProfile(null);
        setApiKey(null);
        setKeys([]);
      }
      return false;
    }

    const nextClient = new AiGatewayClient({ session: nextSession, providerSettings });
    try {
      const nextProfile = await nextClient.profile().catch(() => nextClient.me());
      setClient(nextClient);
      setSession(nextSession);
      setProfile(nextProfile || nextSession.user || null);
      return true;
    } catch {
      if (!options.keepExisting) {
        setSession(null);
        setProfile(null);
        setApiKey(null);
        setKeys([]);
      }
      return false;
    }
  }

  function handleProviderChange(nextSettings) {
    const savedSettings = saveProviderSettings(nextSettings);
    setProviderSettings(savedSettings);
    setClient((current) => {
      current.setProviderSettings(savedSettings);
      return current;
    });
  }

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Storage is optional; the selected theme still applies for this tab.
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = t('app.title', 'Không gian sáng tạo');
    saveStudioLanguage(language);
  }, [language, t]);

  useEffect(() => {
    if (!session?.accessToken) {
      if (LIBRARY_AUTH_REQUIRED) {
        setSiteData(EMPTY_SITE_DATA);
        setSelectedCase(null);
        return;
      }
      let active = true;
      setSiteData(null);
      loadStaticLibraryData()
        .then((nextSiteData) => {
          if (!active) return;
          setSiteData(nextSiteData);
          setSelectedCase(null);
        })
        .catch(() => {
          if (!active) return;
          setSiteData(EMPTY_SITE_DATA);
          setSelectedCase(null);
        });
      return () => {
        active = false;
      };
    }
    let active = true;
    const libraryClient = new StudioHistoryClient({ session });
    setSiteData(null);
    libraryClient.listLibrary()
      .then((payload) => {
        if (!active) return;
        const nextSiteData = normalizeLibraryPayload(payload);
        if (!nextSiteData.cases.length) {
          return loadStaticLibraryData();
        }
        return nextSiteData;
      })
      .then((nextSiteData) => {
        if (!active) return;
        setSiteData(nextSiteData);
        const savedDraft = loadDraft();
        const cases = nextSiteData.cases || [];
        const draftedCase = savedDraft?.caseId ? cases.find((item) => String(item.id) === String(savedDraft.caseId)) : null;
        setSelectedCase(draftedCase || null);
      })
      .catch((error) => {
        if (!active) return;
        loadStaticLibraryData()
          .then((nextSiteData) => {
            if (!active) return;
            setSiteData(nextSiteData);
            setBootError('');
          })
          .catch(() => {
            if (!active) return;
            setSiteData(EMPTY_SITE_DATA);
            setBootError(error.message);
          });
      });
    return () => {
      active = false;
    };
  }, [session?.accessToken]);

  useEffect(() => {
    hydrateSession({ keepExisting: true });

    const sync = () => hydrateSession({ keepExisting: true });
    window.addEventListener('focus', sync);
    window.addEventListener('storage', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      window.removeEventListener('focus', sync);
      window.removeEventListener('storage', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetchStudioAuthMode().then((mode) => {
      if (!active) return;
      authModeRef.current = mode;
      setAuthMode(mode);
      const currentSettings = loadProviderSettings();
      if (mode === 'password') {
        if (!hasLiveStudioSession(loadSession())) {
          clearSession();
          setSession(null);
          setProfile(null);
        }
        if (currentSettings.apiKeySource !== 'server') {
          handleProviderChange({ ...currentSettings, apiKeySource: 'server', providerId: 'openai-compatible' });
        }
      } else if (currentSettings.apiKeySource === 'server') {
        handleProviderChange({ ...currentSettings, apiKeySource: 'gateway', providerId: 'gateway-account' });
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    // Gateway account calls (profile, keys) only exist in the Sub2API-style gateway mode.
    if (!session?.accessToken || authMode !== 'none') return;
    let active = true;
    const nextClient = new AiGatewayClient({ session, providerSettings });
    setClient(nextClient);
    Promise.all([
      nextClient.profile().catch(() => nextClient.me()),
      nextClient.ensureApiKey(),
      nextClient.listKeys().catch(() => [])
    ]).then(([nextProfile, nextKey, nextKeys]) => {
      if (!active) return;
      setProfile(nextProfile);
      setApiKey(nextKey);
      setKeys(nextKeys.length ? nextKeys : nextKey ? [nextKey] : []);
    }).catch((error) => {
      if (!active) return;
      setBootError(error.message);
    });
    return () => {
      active = false;
    };
  }, [session?.accessToken, authMode]);

  useEffect(() => {
    const providerRequest = resolveProviderRequest(providerSettings, apiKey);
    if (!providerRequest.apiKey) {
      setModelOptions({ image: [], responses: [], video: [] });
      setModelsStatus('idle');
      setUsageSummary('');
      return;
    }

    const controller = new AbortController();
    const nextClient = new AiGatewayClient({ session, providerSettings });
    setModelsStatus('loading');
      nextClient.listGatewayModels({ ...providerRequest, signal: controller.signal })
      .then((models) => {
        const image = models.filter(modelLooksLikeImage);
        const video = models.filter(modelMatchesVideo);
        setModelOptions({
          image: image.length ? image : [],
          responses: models,
          video
        });
        setModelsStatus('ready');
      })
      .catch((error) => {
        if (error?.name === 'AbortError') return;
        setModelOptions({ image: [], responses: [], video: [] });
        setModelsStatus('fallback');
      });

    nextClient.getGatewayUsage({ ...providerRequest, signal: controller.signal })
      .then((usage) => {
        const parts = [];
        const total = usage?.total || usage?.total_usage || usage?.used || usage?.amount || usage?.cost;
        const requests = usage?.requests || usage?.request_count || usage?.count;
        if (total !== undefined) parts.push(`Đã dùng ${formatUsageValue(total)}`);
        if (requests !== undefined) parts.push(`${formatUsageValue(requests)} lượt`);
        setUsageSummary(parts.join(', ') || 'Máy chủ không trả tổng kết mức sử dụng');
      })
      .catch((error) => {
        if (error?.name === 'AbortError') return;
        setUsageSummary('Máy chủ chưa cung cấp API mức sử dụng');
      });

    return () => controller.abort();
  }, [
    providerSettings.providerId,
    providerSettings.apiKeySource,
    providerSettings.manualApiKey,
    providerSettings.manualGatewayBaseUrl,
    apiKey?.key,
    session?.accessToken
  ]);

  useEffect(() => {
    let active = true;
    const historyClient = new StudioHistoryClient({ session });
    const scope = historyScope();
    setHistoryStatus('loading');
    setHistoryNextOffset(null);
    Promise.all([
      historyClient.listRecords({ limit: HISTORY_PAGE_SIZE }),
      loadPersistedHistory(scope)
    ])
      .then(([{ records, nextOffset }, localRecords]) => {
        if (!active) return;
        const merged = mergeHistoryRecords(records, localRecords);
        setHistoryItems(merged);
        saveHistory(merged, scope);
        setHistoryNextOffset(nextOffset);
        setHistoryStatus('synced');
      })
      .catch(async () => {
        if (!active) return;
        const localRecords = await loadPersistedHistory(scope);
        if (!active) return;
        setHistoryItems(localRecords);
        setHistoryStatus(localRecords.length ? 'local' : 'idle');
      });
    return () => {
      active = false;
    };
  }, [persistenceKey, profile?.id, profile?.email, profile?.username]);

  function handleLoadMoreHistory() {
    if (historyNextOffset === null || historyLoadingMore) return;
    const historyClient = new StudioHistoryClient({ session });
    const scope = historyScope();
    setHistoryLoadingMore(true);
    historyClient.listRecords({ limit: HISTORY_PAGE_SIZE, offset: historyNextOffset })
      .then(({ records, nextOffset }) => {
        const merged = mergeHistoryRecords(records, historyItems);
        setHistoryItems(merged);
        saveHistory(merged, scope);
        setHistoryNextOffset(nextOffset);
        setHistoryStatus('synced');
      })
      .catch(() => setHistoryStatus(historyItems.length ? 'local' : 'idle'))
      .finally(() => setHistoryLoadingMore(false));
  }

  useEffect(() => {
    let active = true;
    setRemoteSessionReady(false);
    const historyClient = new StudioHistoryClient({ session });
    historyClient.getCurrentSession()
      .then((snapshot) => snapshot ? historyClient.resolveSessionAssets(snapshot) : null)
      .then((snapshot) => {
        if (!active) return;
        if (snapshot) {
          const sessionSnapshot = saveCurrentSession({ ...snapshot, sessionId: snapshot.sessionId || deskSessionId });
          setCurrentSessionSnapshot(sessionSnapshot);
        }
        setRemoteSession(snapshot);
        setRemoteSessionReady(true);
      })
      .catch(() => {
        if (!active) return;
        setRemoteSession(null);
        setRemoteSessionReady(true);
      });
    return () => {
      active = false;
    };
  }, [persistenceKey, profile?.id, profile?.email, profile?.username]);

  const categoryGroups = useMemo(() => buildCategoryGroups(siteData?.cases || []), [siteData]);
  const visibleCases = useMemo(() => {
    const source = orderTemplates(siteData?.cases || []);
    const needle = query.trim().toLowerCase();
    return source.filter((item) => {
      const matchesCategory = category === 'All' || item.category === category;
      const matchesQuery = !needle || `${item.title} ${categoryLabel(item.category)} ${item.sourceLabel} ${item.sourceName} ${item.promptPreview}`.toLowerCase().includes(needle);
      const matchesFavorite = !showFavoritesOnly || favoriteTemplates.has(templateKey(item));
      return matchesCategory && matchesQuery && matchesFavorite;
    });
  }, [siteData, query, category, favoriteTemplates, showFavoritesOnly]);

  const filteredHistoryItems = useMemo(() => {
    if (activeWorkspace === 'image') return historyItems.filter((item) => item.mode !== 'video' && item.kind !== 'video');
    if (activeWorkspace === 'video') return historyItems.filter((item) => item.mode === 'video' || item.kind === 'video');
    return historyItems;
  }, [historyItems, activeWorkspace]);
  const workspaceIsDesk = activeWorkspace === 'image' || activeWorkspace === 'video';
  const currentProject = useMemo(() => currentSessionProject(currentSessionSnapshot || remoteSession), [currentSessionSnapshot, remoteSession]);

  function handleWorkspaceChange(nextWorkspace, options = {}) {
    setActiveWorkspace(nextWorkspace);
    setQuery('');
    setCategory('All');
    if (nextWorkspace !== 'history' && !options.preserveHistory) {
      setSelectedHistory(null);
    }
    setSelectedCase((current) => {
      if (!current) return current;
      if (nextWorkspace === 'video') return current.kind === 'video-inspiration' ? current : null;
      if (nextWorkspace === 'image') return current.kind === 'video-inspiration' ? null : current;
      return current;
    });
  }

  function handleNewSession() {
    if (sessionSaveRef.current.timer) {
      window.clearTimeout(sessionSaveRef.current.timer);
      sessionSaveRef.current.timer = null;
    }
    sessionSaveRef.current.lastPayload = '';
    clearDraft();
    clearCurrentSessionCache();
    setCurrentSessionSnapshot(null);
    setRemoteSession(null);
    setSelectedCase(null);
    setSelectedHistory(null);
    setAppendTemplateRequest(null);
    setQuery('');
    setCategory('All');
    setActiveWorkspace('image');
    setDeskSessionId(`desk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    const latestSession = loadSession() || session;
    const historyClient = new StudioHistoryClient({ session: latestSession });
    historyClient.clearCurrentSession().catch(() => {});
  }

  async function refreshProfile() {
    if (!client || !session?.accessToken) return;
    const nextProfile = await client.profile().catch(() => profile);
    setProfile(nextProfile);
  }

  async function handleRequireLogin() {
    if (authModeRef.current === 'password') {
      clearSession();
      setSession(null);
      setProfile(null);
      return;
    }
    const ready = await hydrateSession();
    if (ready) return;
    window.location.href = getLoginUrl();
  }

  function handleLogout() {
    if (authModeRef.current === 'password') {
      // Shared computers: drop this account's local caches; the server keeps the real history.
      const scope = historyScope();
      try {
        localStorage.removeItem(historyStorageKey(scope));
        localStorage.removeItem(legacyHistoryStorageKey(scope));
      } catch {
        // Storage unavailable: nothing cached.
      }
      clearSession();
      clearCurrentSessionCache();
      clearDraft();
      clearHistoryItems(scope).catch(() => {}).finally(() => window.location.reload());
      return;
    }
    clearSession();
    setSession(null);
    setProfile(null);
    setApiKey(null);
    setKeys([]);
    setSiteData(EMPTY_SITE_DATA);
    setSelectedCase(null);
    setSelectedHistory(null);
    setHistoryItems(loadHistory('guest'));
    setHistoryStatus('idle');
    setModelOptions({ image: [], responses: [], video: [] });
    setModelsStatus('idle');
    setUsageSummary('');
  }

  function handleSelectKey(nextKey) {
    saveSelectedKeyId(nextKey.id);
    setApiKey(nextKey);
  }

  function handleLanguageToggle() {
    setLanguage((current) => nextLanguage(current));
  }

  function handleSelectCase(item) {
    setSelectedHistory(null);
    setSelectedCase(item);
    setActiveWorkspace(item?.kind === 'video-inspiration' ? 'video' : 'image');
  }

  async function handleAppendTemplate(item) {
    setSelectedHistory(null);
    setActiveWorkspace(item?.kind === 'video-inspiration' ? 'video' : 'image');
    const resolved = await resolveLibraryCase(item, { updateSelection: false }).catch(() => item);
    const nextPrompt = resolved?.prompt || resolved?.promptPreview || item?.prompt || item?.promptPreview || item?.summary || '';
    if (!nextPrompt) return;
    setAppendTemplateRequest({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      prompt: nextPrompt
    });
  }

  function handleToggleTemplateFavorite(item) {
    const key = templateKey(item);
    if (!key) return;
    setFavoriteTemplates((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      saveTemplateFavorites(next);
      return next;
    });
  }

  async function resolveLibraryCase(item, options = {}) {
    const updateSelection = options.updateSelection !== false;
    if (!session?.accessToken || item?.prompt || item?.staticLibrary) return item;
    const historyClient = new StudioHistoryClient({ session });
    if (item?.kind === 'video-inspiration') {
      const resolvedInspiration = await historyClient.getVideoInspiration(item.id);
      if (!resolvedInspiration) return item;
      const nextCase = { ...item, ...resolvedInspiration };
      setSiteData((current) => {
        if (!current?.videoInspirations) return current;
        return {
          ...current,
          videoInspirations: current.videoInspirations.map((inspiration) => String(inspiration.id) === String(nextCase.id) ? nextCase : inspiration)
        };
      });
      if (updateSelection) {
        setSelectedCase((current) => (current && String(current.id) === String(nextCase.id) ? nextCase : current));
      }
      return nextCase;
    }
    const resolvedCase = await historyClient.getLibraryCase(item.id);
    if (!resolvedCase) return item;
    const nextCase = { ...item, ...resolvedCase };
    setSiteData((current) => {
      if (!current?.cases) return current;
      return {
        ...current,
        cases: current.cases.map((caseItem) => String(caseItem.id) === String(nextCase.id) ? nextCase : caseItem)
      };
    });
    if (updateSelection) {
      setSelectedCase((current) => (current && String(current.id) === String(nextCase.id) ? nextCase : current));
    }
    return nextCase;
  }

function handleSelectHistory(item, options = {}) {
    const { openWorkspace = true } = options;
    const cases = siteData?.cases || [];
    const matchedCase = item.case?.id ? cases.find((caseItem) => caseItem.id === item.case.id) : null;
    setSelectedCase(matchedCase || item.case || null);
    setSelectedHistory(item);
    if (openWorkspace) {
      setActiveWorkspace(item.mode === 'video' || item.kind === 'video' ? 'video' : 'image');
    }
  }

  function handleHistoryAdd(item) {
    setSelectedHistory(null);
    const normalizedItem = { ...item, sessionId: item.sessionId || deskSessionId };
    setHistoryItems((current) => {
      const nextItems = [normalizedItem, ...current.filter((historyItem) => historyItem.id !== normalizedItem.id)].slice(0, LOCAL_HISTORY_LIMIT);
      saveHistory(nextItems, historyScope());
      return nextItems;
    });
    const latestSession = loadSession() || session;
    if (latestSession?.accessToken) setSession(latestSession);
    const historyClient = new StudioHistoryClient({ session: latestSession });
    historyClient.saveRecord(normalizedItem)
      .then((savedRecord) => historyClient.resolveRecordAssets(savedRecord))
      .then((savedRecord) => {
        setHistoryItems((current) => {
          const nextItems = mergeHistoryRecords([savedRecord], current.filter((historyItem) => historyItem.id !== normalizedItem.id && historyItem.id !== savedRecord.id));
          saveHistory(nextItems, historyScopeFromIdentity(latestSession, profile));
          return nextItems;
        });
        setHistoryStatus('synced');
      })
      .catch(() => setHistoryStatus('local'));
  }

  function handleSessionSnapshot(snapshot) {
    setCurrentSessionSnapshot(snapshot);
    if (!remoteSessionReady) return;
    const latestSession = loadSession() || session;
    const payload = prepareCurrentSessionForServer(snapshot);
    if (!payload) return;
    const encoded = sessionSnapshotComparePayload(snapshot);
    if (sessionSaveRef.current.lastPayload === encoded) return;
    sessionSaveRef.current.lastPayload = encoded;
    if (sessionSaveRef.current.timer) window.clearTimeout(sessionSaveRef.current.timer);
    sessionSaveRef.current.timer = window.setTimeout(() => {
      const historyClient = new StudioHistoryClient({ session: latestSession });
      historyClient.saveCurrentSession(payload)
        .then((savedSession) => {
          setRemoteSession((current) => {
            const currentUpdated = Date.parse(current?.updatedAt || '') || 0;
            const savedUpdated = Date.parse(savedSession?.updatedAt || '') || 0;
            return savedUpdated >= currentUpdated ? savedSession : current;
          });
        })
        .catch(() => {
          sessionSaveRef.current.lastPayload = '';
        });
    }, 800);
  }

  function handleDeleteHistory(recordId) {
    if (recordId && typeof recordId === 'object') {
      const recordIds = recordId.recordIds || [recordId.id];
      recordIds.forEach((id) => handleDeleteHistory(id));
      return;
    }
    setHistoryItems((current) => {
      const nextItems = current.filter((item) => item.id !== recordId);
      saveHistory(nextItems, historyScope());
      return nextItems;
    });
    deletePersistedHistory(recordId, historyScope());
    if (selectedHistory?.id === recordId || selectedHistory?.sessionId === recordId || selectedHistory?.recordIds?.includes?.(recordId)) setSelectedHistory(null);
    const latestSession = loadSession() || session;
    const historyClient = new StudioHistoryClient({ session: latestSession });
    historyClient.deleteRecord(recordId).catch(() => setHistoryStatus('local'));
  }

  function handleClearHistory() {
    const scope = historyScope();
    saveHistory([], scope);
    clearPersistedHistory(scope);
    setHistoryItems([]);
    setSelectedHistory(null);
    const latestSession = loadSession() || session;
    const historyClient = new StudioHistoryClient({ session: latestSession });
    historyClient.clearRecords().catch(() => setHistoryStatus('local'));
  }

  if (bootError && !siteData) {
    return <main className="studioError">Không thể tải: {bootError}</main>;
  }
  if (authMode === 'loading') return null;
  if (authMode === 'password' && !session?.accessToken) {
    return (
      <LoginScreen
        t={t}
        onLoggedIn={(nextSession) => {
          resetBrowserWorkspaceFor(nextSession.user?.email || '');
          // Reload so every workspace state initializes from this account's server data.
          window.location.reload();
        }}
      />
    );
  }

  return (
    <main id="studio-workbench">
      <section className="studioIntro" aria-label={t('studio.introLabel', 'Giới thiệu không gian sáng tạo')}>
        <div className="studioIntroCopy">
          <h1 className="studioIntroTitle">{workspaceIsDesk ? (selectedHistory?.title || (currentProject ? t('rail.currentSession', 'Phiên hiện tại') : t('rail.newSessionTitle', 'Phiên mới'))) : t(`workspace.${activeWorkspace}`, t('workspace.image', 'Tạo ảnh'))}</h1>
          <p>{activeWorkspace === 'history'
            ? t('studio.historyDescription', 'Chọn một phiên để xem kết quả và tiếp tục chỉnh sửa trên canvas.')
            : activeWorkspace === 'inspiration'
              ? t('studio.inspirationDescription', 'Chọn một mẫu để đưa ý tưởng và prompt vào canvas.')
              : t('studio.description', 'Prompt, ảnh tham chiếu và các phiên bản luôn ở cùng một canvas.')}</p>
        </div>
        <div className="studioIntroActions">
          <button
            type="button"
            className="headerIconButton headerLanguageButton"
            onClick={handleLanguageToggle}
            aria-label={t('language.switchTo', 'Switch language')}
            title={`${t('language.current', 'Ngôn ngữ hiện tại: Tiếng Việt')} · ${t('language.switchTo', 'Switch language')}`}
          >
            <Languages size={16} />
            <span>{(SUPPORTED_LANGUAGES.find((item) => item.value === language) || SUPPORTED_LANGUAGES[0]).shortLabel}</span>
          </button>
          <button
            type="button"
            className="headerIconButton"
            onClick={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))}
            aria-label={theme === 'dark' ? t('rail.light', 'Chuyển sang giao diện sáng') : t('rail.dark', 'Chuyển sang giao diện tối')}
            title={theme === 'dark' ? t('rail.light', 'Chuyển sang giao diện sáng') : t('rail.dark', 'Chuyển sang giao diện tối')}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {authMode === 'password' ? (
            <button
              type="button"
              className="headerIconButton"
              onClick={handleLogout}
              aria-label={t('topbar.logout', 'Đăng xuất')}
              title={t('topbar.logout', 'Đăng xuất')}
            >
              <LogOut size={16} />
            </button>
          ) : null}
        </div>
      </section>
      {isLibraryLocked ? (
        <div className="libraryLockNotice">
          <KeyRound size={15} />
          <span>{t('lock.protected', 'Thư viện tư liệu và prompt được bảo vệ; hãy đăng nhập để tải.')}</span>
          <button type="button" onClick={handleRequireLogin}>{t('topbar.login', 'Đăng nhập')}</button>
        </div>
      ) : null}
      <Topbar
        profile={profile}
        apiKey={apiKey}
        providerSettings={providerSettings}
        isAuthenticated={Boolean(session?.accessToken)}
        activeWorkspace={activeWorkspace}
        onWorkspaceChange={handleWorkspaceChange}
        t={t}
        theme={theme}
        onLogin={handleRequireLogin}
        onLogout={handleLogout}
        onOpenSettings={() => setSettingsOpen(true)}
        onThemeToggle={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))}
      />
      <div className={`studioLayout ${railCollapsed ? 'railCollapsed' : ''}`}>
        <LeftRail
          activeWorkspace={activeWorkspace}
          onWorkspaceChange={handleWorkspaceChange}
          onNewSession={handleNewSession}
          profile={profile}
          apiKey={apiKey}
          isAuthenticated={Boolean(session?.accessToken)}
          onOpenSettings={() => setSettingsOpen(true)}
          t={t}
          selected={selectedCase}
          currentProject={currentProject}
          historyItems={historyItems}
          selectedHistoryId={selectedHistory?.id}
          onSelectHistory={handleSelectHistory}
          onDeleteHistory={handleDeleteHistory}
          onFocusCurrentProject={() => setCanvasFocusSignal((value) => value + 1)}
          collapsed={railCollapsed}
          onToggleCollapse={() => setRailCollapsed((value) => !value)}
        />
        {workspaceIsDesk ? (
          <CreationDesk
            key={deskSessionId}
            sessionId={deskSessionId}
            activeWorkspace={activeWorkspace}
            selectedCase={selectedCase}
            selectedHistory={selectedHistory}
            onResolveCase={resolveLibraryCase}
            apiKey={apiKey}
            client={client}
            providerSettings={providerSettings}
            onProviderChange={handleProviderChange}
            modelOptions={modelOptions}
            modelsStatus={modelsStatus}
            usageSummary={usageSummary}
            isAuthenticated={Boolean(session?.accessToken)}
            onRequireLogin={handleRequireLogin}
            onOpenSettings={() => setSettingsOpen(true)}
            onProfileRefresh={refreshProfile}
            onHistoryAdd={handleHistoryAdd}
            remoteSession={remoteSession}
            remoteSessionReady={remoteSessionReady}
            persistenceKey={persistenceKey}
            onSessionSnapshot={handleSessionSnapshot}
            promptPresets={siteData?.promptPresets || PROMPT_PRESETS}
            appendTemplateRequest={appendTemplateRequest}
            onAppendTemplateConsumed={(requestId) => {
              setAppendTemplateRequest((current) => current?.id === requestId ? null : current);
            }}
            onOpenWorkspace={(workspace) => handleWorkspaceChange(workspace, { preserveHistory: true })}
            focusSignal={canvasFocusSignal}
            t={t}
          />
        ) : activeWorkspace === 'inspiration' ? (
          <GalleryWorkspacePanel
            type="inspiration"
            cases={visibleCases}
            categoryGroups={categoryGroups}
            selected={selectedCase}
            onSelect={handleSelectCase}
            query={query}
            setQuery={setQuery}
            category={category}
            setCategory={setCategory}
            totalCaseCount={siteData?.cases?.length || 0}
            loading={!siteData || isLibraryLocked}
            videoInspirations={siteData?.videoInspirations || FALLBACK_VIDEO_INSPIRATIONS}
            historyItems={filteredHistoryItems}
            historyStatus={historyStatus}
            historyHasMore={historyNextOffset !== null}
            historyLoadingMore={historyLoadingMore}
            selectedHistoryId={selectedHistory?.id}
            onSelectHistory={handleSelectHistory}
            onDeleteHistory={handleDeleteHistory}
            onClearHistory={handleClearHistory}
            onLoadMoreHistory={handleLoadMoreHistory}
            favoriteTemplates={favoriteTemplates}
            showFavoritesOnly={showFavoritesOnly}
            onToggleFavoritesOnly={() => setShowFavoritesOnly((value) => !value)}
            onToggleTemplateFavorite={handleToggleTemplateFavorite}
            onAppendTemplate={handleAppendTemplate}
            licenseNotice={siteData?.license}
            onOpenWorkspace={(workspace) => handleWorkspaceChange(workspace, { preserveHistory: true })}
            t={t}
          />
        ) : (
          <GalleryWorkspacePanel
            type="history"
            cases={visibleCases}
            categoryGroups={categoryGroups}
            selected={selectedCase}
            onSelect={handleSelectCase}
            query={query}
            setQuery={setQuery}
            category={category}
            setCategory={setCategory}
            totalCaseCount={siteData?.cases?.length || 0}
            loading={!siteData || isLibraryLocked}
            videoInspirations={siteData?.videoInspirations || FALLBACK_VIDEO_INSPIRATIONS}
            historyItems={filteredHistoryItems}
            historyStatus={historyStatus}
            historyHasMore={historyNextOffset !== null}
            historyLoadingMore={historyLoadingMore}
            selectedHistoryId={selectedHistory?.id}
            onSelectHistory={(item) => handleSelectHistory(item, { openWorkspace: false })}
            onDeleteHistory={handleDeleteHistory}
            onClearHistory={handleClearHistory}
            onLoadMoreHistory={handleLoadMoreHistory}
            favoriteTemplates={favoriteTemplates}
            showFavoritesOnly={showFavoritesOnly}
            onToggleFavoritesOnly={() => setShowFavoritesOnly((value) => !value)}
            onToggleTemplateFavorite={handleToggleTemplateFavorite}
            onAppendTemplate={handleAppendTemplate}
            licenseNotice={siteData?.license}
            onOpenWorkspace={(workspace) => handleWorkspaceChange(workspace, { preserveHistory: true })}
            t={t}
          />
        )}
      </div>
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        apiKey={apiKey}
        keys={keys}
        onSelectKey={handleSelectKey}
        providerSettings={providerSettings}
        onProviderChange={handleProviderChange}
        modelOptions={modelOptions}
        modelsStatus={modelsStatus}
        isAuthenticated={Boolean(session?.accessToken)}
        onLogin={handleRequireLogin}
        t={t}
      />
    </main>
  );
}

createRoot(document.getElementById('studio-root')).render(<StudioApp />);
