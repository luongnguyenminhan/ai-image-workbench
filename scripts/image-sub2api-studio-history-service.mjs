import { createHash, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bearerFromHeader, checkStudioCredentials, signStudioToken, studioAuthConfig, verifyStudioToken } from './studio-auth.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || process.env.STUDIO_HISTORY_PORT || 8787);
const HOST = process.env.HOST || process.env.STUDIO_HISTORY_HOST || '127.0.0.1';
const DATA_DIR = path.resolve(process.env.STUDIO_DATA_DIR || path.join(__dirname, '..', '.image-sub2api-studio-data'));
const LIBRARY_DIR = path.resolve(process.env.STUDIO_LIBRARY_DIR || path.join(__dirname, '..', 'data'));
const LIBRARY_ASSET_DIR = path.resolve(process.env.STUDIO_LIBRARY_ASSET_DIR || path.join(LIBRARY_DIR, 'images'));
const AUTH_MODE = String(process.env.STUDIO_AUTH_MODE || 'gateway').toLowerCase();
const AI_GATEWAY_BASE_URL = String(process.env.AI_GATEWAY_BASE_URL || process.env.SUB2API_BASE_URL || process.env.AI_GATEWAY_UPSTREAM || 'http://127.0.0.1:8080').replace(/\/+$/, '');
// Set when STUDIO_LOGIN_EMAIL/STUDIO_LOGIN_PASSWORD exist: studio login + server-held AI_GATEWAY_API_KEY.
const PASSWORD_AUTH = studioAuthConfig();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILURES = 10;
const loginFailures = new Map();
const HISTORY_LIMIT = Number(process.env.STUDIO_HISTORY_LIMIT || 200);
const SESSION_NODE_LIMIT = Number(process.env.STUDIO_SESSION_NODE_LIMIT || 80);
const SESSION_URL_LIMIT = Number(process.env.STUDIO_SESSION_URL_LIMIT || 24);
const SESSION_QUEUE_LIMIT = Number(process.env.STUDIO_SESSION_QUEUE_LIMIT || 12);
const SESSION_MESSAGE_LIMIT = Number(process.env.STUDIO_SESSION_MESSAGE_LIMIT || 24);
const SESSION_ASSET_ID = 'session-current';
const JOB_LIMIT = Number(process.env.STUDIO_JOB_LIMIT || 120);
const JOB_TIMEOUT_MS = Number(process.env.STUDIO_JOB_TIMEOUT_MS || 45 * 60 * 1000);
const JOB_CONCURRENCY = Math.max(1, Math.min(6, Number(process.env.STUDIO_JOB_CONCURRENCY || 1)));
const JOB_ACTIVE_STATUSES = new Set(['queued', 'dispatching', 'upstream', 'saving']);
const SERVICE_STARTED_AT = Date.now();
const MAX_BODY_BYTES = Number(process.env.STUDIO_MAX_BODY_BYTES || 96 * 1024 * 1024);
const MAX_IMAGE_BYTES = Number(process.env.STUDIO_MAX_IMAGE_BYTES || 32 * 1024 * 1024);
const ALLOWED_ORIGINS = String(process.env.STUDIO_ALLOWED_ORIGINS || 'http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:5205,http://localhost:5205,http://127.0.0.1:5174,http://localhost:5174')
  .split(',')
  .map((item) => item.trim().replace(/\/+$/, ''))
  .filter(Boolean);
const LIBRARY_LICENSE = {
  name: 'Mẫu prompt cộng đồng · CC BY 4.0',
  spdx: 'CC-BY-4.0',
  url: 'https://creativecommons.org/licenses/by/4.0/',
  notice: 'Nội dung mẫu prompt đến từ cộng đồng công khai và tuân theo giấy phép CC BY 4.0. Khi sử dụng hoặc chỉnh sửa, vui lòng ghi nhận tác giả hoặc nguồn gốc ban đầu.'
};
const PROMPT_PRESETS = [
  {
    id: 'image-product-poster',
    mode: 'image',
    title: 'Áp phích sản phẩm',
    prompt: 'Tạo áp phích sản phẩm cao cấp: chủ thể rõ nét ở chính giữa, giữ nguyên cấu trúc và chất liệu thật của sản phẩm, dùng ánh sáng studio tinh tế, nền sạch, chừa đủ khoảng trống cho tiêu đề, tổng thể phù hợp quảng cáo thương mại.',
    tag: 'product'
  },
  {
    id: 'image-social-cover',
    mode: 'image',
    title: 'Ảnh bìa mạng xã hội',
    prompt: 'Tạo ảnh bìa mạng xã hội có điểm nhấn rõ, bố cục hiện đại, màu sắc sống động nhưng không quá rực, chừa chỗ cho tiêu đề ngắn, ánh sáng tinh tế, phù hợp nền tảng nội dung, video ngắn hoặc ảnh bìa sự kiện.',
    tag: 'social'
  },
  {
    id: 'image-portrait',
    mode: 'image',
    title: 'Ảnh chân dung đại diện',
    prompt: 'Tạo ảnh chân dung đại diện được chỉnh sửa tinh tế: giữ làn da tự nhiên và đường nét chân thực, ánh mắt giàu biểu cảm, nền sạch, ánh sáng nghiêng dịu, thần thái tự tin, thành phẩm mang phong cách ảnh biên tập cao cấp.',
    tag: 'portrait'
  },
  {
    id: 'image-commerce-main',
    mode: 'image',
    title: 'Ảnh sản phẩm thương mại điện tử',
    prompt: 'Tạo ảnh sản phẩm chính cho cửa hàng trực tuyến: giữ nguyên nhận diện sản phẩm, cải thiện ánh sáng và chất liệu, loại bỏ chi tiết rối mắt, đặt chủ thể rõ nét ở giữa, phù hợp làm ảnh đại diện sản phẩm trên cửa hàng.',
    tag: 'commerce'
  },
  {
    id: 'video-product-spot',
    mode: 'video',
    title: 'Video quảng cáo sản phẩm',
    prompt: 'Tạo video quảng cáo sản phẩm dài 5 giây: giữ nguyên cấu trúc và chất liệu thật của sản phẩm, máy quay từ từ tiến gần, ánh sáng studio tinh tế, nền sạch, phong cách thương mại cao cấp, chuyển động ổn định, không có chữ hoặc hình mờ.'
  },
  {
    id: 'video-cinematic-shot',
    mode: 'video',
    title: 'Cảnh quay điện ảnh',
    prompt: 'Tạo video mang chất điện ảnh: chủ thể rõ nét, độ sâu trường ảnh nông, ánh sáng ngược dịu, máy quay lia ngang chậm, không gian có chiều sâu chân thực, chuyển động tự nhiên, khung hình ổn định.'
  },
  {
    id: 'video-architecture-tour',
    mode: 'video',
    title: 'Video tham quan kiến trúc',
    prompt: 'Tạo video tham quan không gian kiến trúc: máy quay từ từ tiến dọc theo trục không gian, giữ các đường thẳng đứng ổn định, thể hiện chất liệu, ánh sáng và quy mô không gian theo phong cách nhiếp ảnh chân thực.'
  },
  {
    id: 'video-social-motion',
    mode: 'video',
    title: 'Video chuyển động cho mạng xã hội',
    prompt: 'Tạo video chuyển động phù hợp làm ảnh bìa video ngắn: chủ thể cử động nhẹ, nhịp máy quay rõ ràng, màu sắc trong trẻo, thu hút ngay giây đầu tiên, không có phụ đề hoặc hình mờ.'
  }
];
const VIDEO_INSPIRATIONS = [
  {
    id: 'video-product-launch',
    kind: 'video-inspiration',
    title: 'Video ra mắt sản phẩm',
    intent: 'Quảng cáo thương mại',
    summary: 'Chất lượng ánh sáng studio, máy quay tiến gần, làm nổi bật chất liệu và ưu điểm.',
    prompt: 'Tạo video giới thiệu sản phẩm dài 5 giây: giữ nguyên cấu trúc và chất liệu thật, máy quay từ khung trung cảnh từ từ tiến đến cận cảnh chi tiết, nền sạch, ánh sáng studio cao cấp, khung hình ổn định, không phụ đề, hình mờ hoặc biến dạng.',
    videoAspect: '16:9',
    videoDuration: 5,
    videoFps: 24,
    videoMotion: 'push_in',
    videoStyle: 'product_ad',
    videoQuality: 'high',
    negativePrompt: 'Chữ, hình mờ, biến dạng, thay đổi cấu trúc sản phẩm, ngón tay che khuất'
  },
  {
    id: 'video-social-hook',
    kind: 'video-inspiration',
    title: 'Mở đầu thu hút trên mạng xã hội',
    intent: 'Ảnh bìa video ngắn',
    summary: 'Có chuyển động ngay giây đầu, khung dọc bắt mắt, phù hợp quảng bá trên mạng xã hội.',
    prompt: 'Tạo video dọc dài 5 giây để mở đầu nội dung mạng xã hội: chủ thể có hành động rõ ngay giây đầu tiên, máy quay hơi tiến gần, màu sắc sạch, nhịp điệu rõ, khung hình có cảm giác như ảnh bìa, không phụ đề hoặc hình mờ của nền tảng.',
    videoAspect: '9:16',
    videoDuration: 5,
    videoFps: 24,
    videoMotion: 'push_in',
    videoStyle: 'realistic',
    videoQuality: 'standard',
    negativePrompt: 'Phụ đề, hình mờ, nhấp nháy quá mức, biến dạng khuôn mặt, lỗi lộ phông nền'
  },
  {
    id: 'video-architecture-walkthrough',
    kind: 'video-inspiration',
    title: 'Video tham quan không gian kiến trúc',
    intent: 'Trình bày không gian',
    summary: 'Di chuyển dọc trục không gian, thể hiện chất liệu, ánh sáng và quy mô.',
    prompt: 'Tạo video tham quan không gian kiến trúc: máy quay từ từ tiến dọc trục không gian, giữ các đường thẳng đứng ổn định, thể hiện chất liệu tường, ánh sáng tự nhiên và quy mô không gian theo phong cách nhiếp ảnh chân thực, chuyển động mượt mà.',
    videoAspect: '16:9',
    videoDuration: 10,
    videoFps: 24,
    videoMotion: 'push_in',
    videoStyle: 'realistic',
    videoQuality: 'high',
    negativePrompt: 'Phối cảnh méo, tường biến dạng, đồ đạc lơ lửng, chữ hoặc hình mờ'
  },
  {
    id: 'video-cinematic-portrait',
    kind: 'video-inspiration',
    title: 'Cảnh quay nhân vật phong cách điện ảnh',
    intent: 'Không khí nhân vật',
    summary: 'Độ sâu trường ảnh nông, ánh sáng ngược, lia ngang nhẹ để làm nổi bật cảm xúc.',
    prompt: 'Tạo video nhân vật mang chất điện ảnh: biểu cảm chủ thể tự nhiên, độ sâu trường ảnh nông, ánh sáng ngược dịu, máy quay lia ngang chậm, hậu cảnh có chiều sâu chân thực, chuyển động tiết chế, khung hình ổn định, chất ảnh như phim nhựa.',
    videoAspect: '16:9',
    videoDuration: 5,
    videoFps: 24,
    videoMotion: 'pan',
    videoStyle: 'cinematic',
    videoQuality: 'high',
    negativePrompt: 'Khuôn mặt biến dạng, ngón tay thừa, ánh mắt lệch, phụ đề, hình mờ'
  },
  {
    id: 'video-ui-flow',
    kind: 'video-inspiration',
    title: 'Video minh họa thao tác giao diện',
    intent: 'Tính năng sản phẩm',
    summary: 'Giao diện sạch, mô phỏng thao tác nhấp và chuyển đổi trạng thái.',
    prompt: 'Tạo video minh họa thao tác giao diện sản phẩm: giao diện rõ ràng, máy quay cố định, trạng thái nút và bảng điều khiển chuyển đổi tự nhiên, hiệu ứng chuyển động tiết chế, giống video giới thiệu phần mềm chuyên nghiệp được quay trực tiếp, không có chữ thừa hoặc hình mờ.',
    videoAspect: '16:9',
    videoDuration: 5,
    videoFps: 30,
    videoMotion: 'static',
    videoStyle: 'product_ad',
    videoQuality: 'standard',
    negativePrompt: 'Chữ lỗi, giao diện lệch, nhấp nháy, con trỏ chuột biến dạng, hình mờ'
  },
  {
    id: 'video-food-closeup',
    kind: 'video-inspiration',
    title: 'Cận cảnh món ăn',
    intent: 'Nội dung ẩm thực',
    summary: 'Quay cận, hơi nóng và kết cấu chuyển động, phù hợp quảng bá thực đơn.',
    prompt: 'Tạo video quay cận cảnh món ăn: máy quay từ từ tiến gần, nhìn rõ kết cấu bề mặt, hơi nóng và chuyển động nhẹ của món ăn; ánh sáng ấm tự nhiên, nền đơn giản, hình ảnh chân thực và hấp dẫn.',
    videoAspect: '9:16',
    videoDuration: 5,
    videoFps: 24,
    videoMotion: 'push_in',
    videoStyle: 'realistic',
    videoQuality: 'high',
    negativePrompt: 'Bề mặt quá bóng dầu, món ăn biến dạng, chữ, hình mờ, dụng cụ ăn xuyên vào vật thể'
  },
  {
    id: 'video-fashion-turntable',
    kind: 'video-inspiration',
    title: 'Video xoay quanh trang phục',
    intent: 'Giới thiệu sản phẩm trực tuyến',
    summary: 'Máy quay xoay quanh người mẫu hoặc sản phẩm, thể hiện phom dáng và chất liệu.',
    prompt: 'Tạo video trình bày trang phục bằng chuyển động xoay quanh: giữ chủ thể ổn định, máy quay xoay nhẹ, thể hiện kết cấu vải, phom dáng và chi tiết, ánh sáng trong trẻo, chuyển động tự nhiên, phù hợp cửa hàng trực tuyến và video giới thiệu sản phẩm.',
    videoAspect: '9:16',
    videoDuration: 5,
    videoFps: 24,
    videoMotion: 'orbit',
    videoStyle: 'realistic',
    videoQuality: 'standard',
    negativePrompt: 'Tay chân biến dạng, quần áo tan chảy, họa tiết lệch, chữ hoặc hình mờ'
  },
  {
    id: 'video-animation-mascot',
    kind: 'video-inspiration',
    title: 'Hoạt ảnh nhân vật lặp lại',
    intent: 'Nhân vật thương hiệu',
    summary: 'Chuyển động nhẹ có thể lặp, phù hợp nhân vật thương hiệu và nhãn dán biểu cảm.',
    prompt: 'Tạo video hoạt ảnh nhân vật có thể lặp: giữ nhân vật nhất quán, thực hiện động tác vẫy tay hoặc gật đầu nhẹ có thể lặp lại, nền đơn giản, biểu cảm thân thiện, hình ảnh sạch, không phụ đề hoặc hình mờ.',
    videoAspect: '1:1',
    videoDuration: 5,
    videoFps: 24,
    videoMotion: 'static',
    videoStyle: 'animation',
    videoQuality: 'standard',
    negativePrompt: 'Nhân vật thay đổi vị trí, đường nét khuôn mặt thay đổi, tay chân đứt đoạn, chữ, hình mờ'
  },
  {
    id: 'video-event-kv-motion',
    kind: 'video-inspiration',
    title: 'Tạo chuyển động cho hình ảnh chủ đạo sự kiện',
    intent: 'Tư liệu tiếp thị',
    summary: 'Thêm chuyển động nhẹ cho hình ảnh chủ đạo, phù hợp màn hình trình chiếu và mạng xã hội.',
    prompt: 'Tạo video chuyển động từ hình ảnh chủ đạo của sự kiện: giữ nguyên chủ thể chính, các thành phần nền dịch chuyển nhẹ, ánh sáng có chiều sâu, máy quay từ từ lùi xa, phù hợp màn hình lớn và quảng bá trên mạng xã hội, không thêm chữ hoặc hình mờ.',
    videoAspect: '16:9',
    videoDuration: 5,
    videoFps: 24,
    videoMotion: 'pull_out',
    videoStyle: 'cinematic',
    videoQuality: 'standard',
    negativePrompt: 'Chữ lỗi, chủ thể biến dạng, hiệu ứng hạt quá mức, hình mờ'
  },
  {
    id: 'video-scene-establishing',
    kind: 'video-inspiration',
    title: 'Cảnh mở đầu thiết lập không gian',
    intent: 'Mở đầu câu chuyện',
    summary: 'Di chuyển từ môi trường đến chủ thể để tạo không khí và không gian kể chuyện.',
    prompt: 'Tạo cảnh mở đầu câu chuyện để giới thiệu không gian: máy quay từ môi trường từ từ chuyển đến chủ thể, các lớp không gian rõ ràng, ánh sáng tự nhiên, phong cách điện ảnh, chuyển động tiết chế, phù hợp làm cảnh đầu tiên của phim ngắn.',
    videoAspect: '16:9',
    videoDuration: 10,
    videoFps: 24,
    videoMotion: 'pan',
    videoStyle: 'cinematic',
    videoQuality: 'high',
    negativePrompt: 'Máy quay rung, chủ thể biến mất, không gian biến dạng, phụ đề, hình mờ'
  }
];

const jobQueues = new Map();
const activeJobControllers = new Map();
const jobStorageLocks = new Map();

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(payload));
}

function sendCors(req, res) {
  const origin = String(req.headers.origin || '').replace(/\/+$/, '');
  const allowOrigin = !origin || ALLOWED_ORIGINS.includes(origin) ? origin : '';
  if (allowOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  return Boolean(!origin || allowOrigin);
}

function bearerToken(req) {
  return bearerFromHeader(req.headers.authorization || '');
}

function clientAddress(req) {
  return String(req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown');
}

// ponytail: in-memory per-IP limiter, resets on restart; move to shared storage if the service is scaled out.
function loginLocked(req) {
  const entry = loginFailures.get(clientAddress(req));
  if (!entry || Date.now() - entry.firstAt > LOGIN_WINDOW_MS) return false;
  return entry.count >= LOGIN_MAX_FAILURES;
}

function recordLoginFailure(req) {
  const key = clientAddress(req);
  const entry = loginFailures.get(key);
  if (!entry || Date.now() - entry.firstAt > LOGIN_WINDOW_MS) {
    loginFailures.set(key, { count: 1, firstAt: Date.now() });
  } else {
    entry.count += 1;
  }
}

async function handleAuthRoute(req, res, parts) {
  const action = parts[2];
  if (req.method === 'GET' && action === 'config') {
    return sendJson(res, 200, { ok: true, mode: PASSWORD_AUTH ? 'password' : AUTH_MODE });
  }
  if (req.method === 'GET' && action === 'verify') {
    // nginx auth_request: open in non-password modes so existing deployments keep working.
    const valid = !PASSWORD_AUTH || Boolean(verifyStudioToken(PASSWORD_AUTH, bearerToken(req)));
    res.writeHead(valid ? 204 : 401);
    return res.end();
  }
  if (req.method === 'POST' && action === 'login') {
    if (!PASSWORD_AUTH) return sendJson(res, 404, { ok: false, error: 'PASSWORD_LOGIN_DISABLED' });
    if (loginLocked(req)) return sendJson(res, 429, { ok: false, error: 'LOGIN_RATE_LIMITED' });
    const body = await readJsonBody(req).catch(() => ({}));
    if (!checkStudioCredentials(PASSWORD_AUTH, body.email, body.password)) {
      recordLoginFailure(req);
      return sendJson(res, 401, { ok: false, error: 'INVALID_CREDENTIALS' });
    }
    loginFailures.delete(clientAddress(req));
    const { token, expiresAt } = signStudioToken(PASSWORD_AUTH);
    return sendJson(res, 200, {
      ok: true,
      accessToken: token,
      expiresAt,
      user: { id: PASSWORD_AUTH.email, email: PASSWORD_AUTH.email, username: PASSWORD_AUTH.email }
    });
  }
  return sendJson(res, 404, { ok: false, error: 'NOT_FOUND' });
}

async function readJsonBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      const error = new Error('BODY_TOO_LARGE');
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function parseJsonText(raw) {
  return JSON.parse(String(raw || '').replace(/^\uFEFF/, ''));
}

function normalizeGatewayAccountPayload(payload) {
  if (payload && typeof payload === 'object' && 'code' in payload) {
    if (payload.code === 0) return payload.data;
    throw new Error(payload.message || 'GATEWAY_AUTH_FAILED');
  }
  return payload;
}

async function gatewayAccountRequest(pathname, token) {
  const response = await fetch(`${AI_GATEWAY_BASE_URL}${pathname}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.message || `GATEWAY_HTTP_${response.status}`);
    error.status = response.status;
    throw error;
  }
  return normalizeGatewayAccountPayload(payload);
}

async function authenticate(req) {
  const token = bearerToken(req);
  if (!token) {
    const error = new Error('AUTH_REQUIRED');
    error.status = 401;
    throw error;
  }

  if (PASSWORD_AUTH) {
    if (!verifyStudioToken(PASSWORD_AUTH, token)) {
      const error = new Error('AUTH_REQUIRED');
      error.status = 401;
      throw error;
    }
    const key = createHash('sha256').update(`password:${PASSWORD_AUTH.email}`).digest('hex');
    return {
      user: { id: PASSWORD_AUTH.email, email: PASSWORD_AUTH.email, username: PASSWORD_AUTH.email },
      userKey: key,
      userDir: path.join(DATA_DIR, 'users', key)
    };
  }

  if (AUTH_MODE === 'local') {
    const key = createHash('sha256').update(`local:${token}`).digest('hex');
    return {
      user: { id: 'local-workspace', username: 'Local Workspace' },
      userKey: key,
      userDir: path.join(DATA_DIR, 'users', key)
    };
  }

  let user;
  try {
    user = await gatewayAccountRequest('/api/v1/auth/me', token);
  } catch {
    user = await gatewayAccountRequest('/api/v1/user/profile', token);
  }

  const userId = user?.id || user?.user?.id || user?.email || user?.username;
  if (!userId) {
    const error = new Error('USER_ID_MISSING');
    error.status = 401;
    throw error;
  }

  const key = createHash('sha256').update(String(userId)).digest('hex');
  return {
    user,
    userKey: key,
    userDir: path.join(DATA_DIR, 'users', key)
  };
}

async function ensureUserDirs(auth) {
  await fs.mkdir(path.join(auth.userDir, 'assets'), { recursive: true });
  await fs.mkdir(path.join(auth.userDir, 'jobs'), { recursive: true });
}

// Concurrent fs.writeFile calls on one path interleave and leave the tail of a longer write behind
// ("Unexpected non-whitespace character after JSON"). Writing a unique temp file and renaming it is atomic.
async function writeJsonAtomic(filePath, value) {
  const tempPath = `${filePath}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(tempPath, JSON.stringify(value, null, 2));
    await fs.rename(tempPath, filePath);
  } catch (error) {
    await fs.rm(tempPath, { force: true }).catch(() => {});
    throw error;
  }
}

function recordsPath(auth) {
  return path.join(auth.userDir, 'records.json');
}

function sessionPath(auth) {
  return path.join(auth.userDir, 'session.json');
}

function jobsPath(auth) {
  return path.join(auth.userDir, 'jobs.json');
}

async function readRecords(auth) {
  try {
    const raw = await fs.readFile(recordsPath(auth), 'utf8');
    const parsed = parseJsonText(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function writeRecords(auth, records) {
  await ensureUserDirs(auth);
  await writeJsonAtomic(recordsPath(auth), records.slice(0, HISTORY_LIMIT));
}

async function readSession(auth) {
  try {
    const raw = await fs.readFile(sessionPath(auth), 'utf8');
    const parsed = parseJsonText(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function writeSession(auth, session) {
  await ensureUserDirs(auth);
  await writeJsonAtomic(sessionPath(auth), session);
}

function jobRuntimeKey(auth, jobId) {
  return `${auth.userKey}:${jobId}`;
}

function isQueuedInMemory(auth, jobId) {
  const queue = jobQueues.get(auth.userKey);
  return Boolean(queue?.items?.some((item) => item.jobId === jobId));
}

function jobIsActiveInMemory(auth, jobId) {
  return activeJobControllers.has(jobRuntimeKey(auth, jobId)) || isQueuedInMemory(auth, jobId);
}

function normalizeJobForRead(auth, job) {
  if (!job || typeof job !== 'object') return null;
  const status = text(job.status || 'queued', 40);
  if (JOB_ACTIVE_STATUSES.has(status) && !jobIsActiveInMemory(auth, job.id)) {
    const updatedAt = Date.parse(job.updatedAt || job.startedAt || job.createdAt || '');
    if (!Number.isFinite(updatedAt) || updatedAt < SERVICE_STARTED_AT - 1000) {
      return {
        ...job,
        status: 'unknown',
        stage: 'unknown',
        updatedAt: new Date().toISOString(),
        error: {
          code: 'JOB_RUNTIME_NOT_ATTACHED',
          message: 'The service restarted or lost the active runner before this job returned a final result.'
        }
      };
    }
  }
  return job;
}

async function withUserJobLock(auth, action) {
  const previous = jobStorageLocks.get(auth.userKey) || Promise.resolve();
  let release;
  const current = new Promise((resolve) => {
    release = resolve;
  });
  jobStorageLocks.set(auth.userKey, previous.then(() => current, () => current));
  await previous.catch(() => {});
  try {
    return await action();
  } finally {
    release();
    if (jobStorageLocks.get(auth.userKey) === current) {
      jobStorageLocks.delete(auth.userKey);
    }
  }
}

async function readJobsUnlocked(auth) {
  try {
    const raw = await fs.readFile(jobsPath(auth), 'utf8');
    const parsed = parseJsonText(raw);
    const jobs = Array.isArray(parsed) ? parsed : [];
    let changed = false;
    const normalized = jobs.map((job) => {
      const nextJob = normalizeJobForRead(auth, job);
      if (nextJob && nextJob !== job) changed = true;
      return nextJob;
    }).filter(Boolean);
    if (changed) {
      await writeJobsUnlocked(auth, normalized);
    }
    return normalized;
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function readJobs(auth) {
  return withUserJobLock(auth, () => readJobsUnlocked(auth));
}

async function writeJobsUnlocked(auth, jobs) {
  await ensureUserDirs(auth);
  await writeJsonAtomic(jobsPath(auth), jobs.slice(0, JOB_LIMIT));
}

async function writeJobs(auth, jobs) {
  return withUserJobLock(auth, () => writeJobsUnlocked(auth, jobs));
}

async function updateJob(auth, jobId, patch) {
  return withUserJobLock(auth, async () => {
    const jobs = await readJobsUnlocked(auth);
    const index = jobs.findIndex((job) => job.id === jobId);
    if (index < 0) return null;
    const nextJob = {
      ...jobs[index],
      ...patch,
      updatedAt: new Date().toISOString()
    };
    const nextJobs = [nextJob, ...jobs.filter((job) => job.id !== jobId)];
    await writeJobsUnlocked(auth, nextJobs);
    return nextJob;
  });
}

async function upsertJob(auth, job) {
  return withUserJobLock(auth, async () => {
    const jobs = await readJobsUnlocked(auth);
    await writeJobsUnlocked(auth, [job, ...jobs.filter((item) => item.id !== job.id)].slice(0, JOB_LIMIT));
    return job;
  });
}

function text(value, length) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, length);
}

function cleanLibraryId(value) {
  const raw = String(value || '').trim();
  if (!/^[a-zA-Z0-9._:-]{1,120}$/.test(raw)) {
    const error = new Error('LIBRARY_ITEM_NOT_FOUND');
    error.status = 404;
    throw error;
  }
  return raw;
}

function cleanRecordId(value) {
  const raw = String(value || '');
  return /^[a-zA-Z0-9_-]{8,80}$/.test(raw) ? raw : randomUUID();
}

function assetExtension(mime) {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/webp') return 'webp';
  return 'png';
}

async function writeAssetBuffer(auth, recordId, buffer, mime, index) {
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) return '';
  const ext = assetExtension(mime);
  const assetDir = path.join(auth.userDir, 'assets', recordId);
  await fs.mkdir(assetDir, { recursive: true });
  const fileName = `${index}.${ext}`;
  await fs.writeFile(path.join(assetDir, fileName), buffer);
  return `/studio-api/history/${recordId}/assets/${fileName}`;
}

async function storeResultUrl(auth, recordId, value, index) {
  const raw = String(value || '');
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('/studio-api/history/')) return raw;
  if (raw.startsWith('/studio-api/generation-jobs/')) return raw;

  const match = raw.match(/^data:(image\/(?:png|jpeg|webp));base64,([a-zA-Z0-9+/=\s]+)$/);
  if (!match) return '';

  const buffer = Buffer.from(match[2].replace(/\s+/g, ''), 'base64');
  return writeAssetBuffer(auth, recordId, buffer, match[1], index);
}

async function storeSessionUrl(auth, value, index) {
  return storeResultUrl(auth, SESSION_ASSET_ID, value, index);
}

async function readJsonFile(filePath, fallback = {}) {
  try {
    return parseJsonText(await fs.readFile(filePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
}

function protectedLibraryAssetUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^\/studio-api\/library-assets\//i.test(raw)) return raw;
  if (/^(?:\.\/)?\/?images\//i.test(raw)) return `/studio-api/library-assets/${raw.replace(/^(?:\.\/)?\/?images\//i, '')}`;
  if (/^https?:\/\//i.test(raw)) return raw;
  return '';
}

function sanitizeLibrarySummary(item) {
  const image = protectedLibraryAssetUrl(item.image || item.image_url);
  const thumbnail = protectedLibraryAssetUrl(item.thumbnail) || image;
  return {
    id: item.id,
    title: text(item.title, 180),
    image,
    thumbnail,
    imageAlt: text(item.imageAlt, 240),
    sourceLabel: text(item.sourceLabel, 120),
    sourceName: text(item.sourceName, 120),
    promptPreview: text(item.promptPreview, 160),
    category: text(item.category, 120),
    styles: Array.isArray(item.styles) ? item.styles.slice(0, 8).map((value) => text(value, 80)).filter(Boolean) : [],
    scenes: Array.isArray(item.scenes) ? item.scenes.slice(0, 8).map((value) => text(value, 80)).filter(Boolean) : [],
    featured: Boolean(item.featured),
    external: Boolean(item.external),
    sourceUrl: text(item.sourceUrl || item.githubUrl || item.sourceRepository, 600),
    sourceLicense: LIBRARY_LICENSE.spdx,
    attributionRequired: item.attributionRequired !== false,
    riskTags: Array.isArray(item.riskTags) ? item.riskTags.slice(0, 8).map((value) => text(value, 80)).filter(Boolean) : []
  };
}

function sanitizeLibraryDetail(item) {
  return {
    ...sanitizeLibrarySummary(item),
    prompt: text(item.prompt, 12000)
  };
}

function sanitizePromptPresetSummary(item) {
  return {
    id: item.id,
    mode: item.mode,
    title: text(item.title, 120),
    tag: text(item.tag, 80)
  };
}

function sanitizePromptPresetDetail(item) {
  return {
    ...sanitizePromptPresetSummary(item),
    prompt: text(item.prompt, 4000)
  };
}

function sanitizeVideoInspirationSummary(item) {
  return {
    id: item.id,
    kind: 'video-inspiration',
    title: text(item.title, 160),
    intent: text(item.intent, 120),
    summary: text(item.summary, 180),
    videoAspect: text(item.videoAspect, 20),
    videoDuration: Number(item.videoDuration) || 5,
    videoFps: Number(item.videoFps) || 24,
    videoMotion: text(item.videoMotion, 80),
    videoStyle: text(item.videoStyle, 80),
    videoQuality: text(item.videoQuality, 40)
  };
}

function sanitizeVideoInspirationDetail(item) {
  return {
    ...sanitizeVideoInspirationSummary(item),
    prompt: text(item.prompt, 4000),
    negativePrompt: text(item.negativePrompt, 1000)
  };
}

async function readLibrary() {
  const localData = await readJsonFile(path.join(LIBRARY_DIR, 'cases.json'), { cases: [] });
  const inspirationData = await readJsonFile(path.join(LIBRARY_DIR, 'inspirations.json'), { cases: [] });
  const localCases = Array.isArray(localData?.cases) ? localData.cases : [];
  const inspirationCases = Array.isArray(inspirationData?.cases) ? inspirationData.cases : [];
  const rawCases = [...localCases, ...inspirationCases].filter((item) => item && item.id !== undefined && item.id !== null);
  const cases = rawCases.map(sanitizeLibrarySummary);
  return {
    rawCases,
    payload: {
      ok: true,
      license: LIBRARY_LICENSE,
      totalCases: cases.length,
      categories: [...new Set([
        ...(Array.isArray(localData?.categories) ? localData.categories : []),
        ...(Array.isArray(inspirationData?.categories) ? inspirationData.categories : []),
        ...cases.map((item) => item.category).filter(Boolean)
      ])].sort(),
      styles: [...new Set(cases.flatMap((item) => item.styles || []))].sort(),
      scenes: [...new Set(cases.flatMap((item) => item.scenes || []))].sort(),
      promptPresets: PROMPT_PRESETS.map(sanitizePromptPresetSummary),
      videoInspirations: VIDEO_INSPIRATIONS.map(sanitizeVideoInspirationSummary),
      cases
    }
  };
}

function sanitizeCase(value) {
  if (!value || typeof value !== 'object') return null;
  return {
    id: value.id || null,
    title: text(value.title, 160),
    image: text(value.image, 600),
    imageAlt: text(value.imageAlt, 240),
    promptPreview: text(value.promptPreview, 800),
    category: text(value.category, 120)
  };
}

function sanitizeSessionObject(value) {
  if (!value || typeof value !== 'object') return null;
  return { ...value };
}

function sanitizeAssistantMessages(items) {
  const source = Array.isArray(items) ? items.slice(-SESSION_MESSAGE_LIMIT) : [];
  return source
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      id: text(item.id || randomUUID(), 120),
      role: item.role === 'assistant' ? 'assistant' : 'user',
      content: text(item.content, 8000),
      finalPrompt: text(item.finalPrompt, 12000),
      pending: Boolean(item.pending),
      failed: Boolean(item.failed)
    }))
    .filter((item) => item.content || item.finalPrompt);
}

function sanitizePromptSuggestion(value) {
  if (!value || typeof value !== 'object') return null;
  const suggestion = {
    subject: text(value.subject, 2000),
    scene: text(value.scene, 2000),
    composition: text(value.composition, 2000),
    style: text(value.style, 2000),
    lighting: text(value.lighting, 2000),
    details: text(value.details, 3000),
    textRules: text(value.textRules, 2000),
    constraints: text(value.constraints, 3000),
    finalPrompt: text(value.finalPrompt, 12000),
    raw: text(value.raw, 16000)
  };
  return Object.values(suggestion).some(Boolean) ? suggestion : null;
}

function sanitizeCanvasView(value) {
  if (!value || typeof value !== 'object') return { x: 0, y: 0, zoom: 1 };
  const x = Number(value.x);
  const y = Number(value.y);
  const zoom = Number(value.zoom);
  return {
    x: Number.isFinite(x) ? Math.max(-8000, Math.min(8000, x)) : 0,
    y: Number.isFinite(y) ? Math.max(-8000, Math.min(8000, y)) : 0,
    zoom: Number.isFinite(zoom) ? Math.max(0.2, Math.min(3, zoom)) : 1
  };
}

function sanitizeDownloadMeta(value) {
  if (!value || typeof value !== 'object') return null;
  return {
    mode: text(value.mode || 'image', 40),
    providerId: text(value.providerId, 160),
    createdAt: value.createdAt && !Number.isNaN(Date.parse(value.createdAt)) ? value.createdAt : '',
    prompt: text(value.prompt, 6000),
    id: text(value.id, 160)
  };
}

async function sanitizeSessionUrls(auth, values, assetIndex) {
  const urls = [];
  const source = Array.isArray(values) ? values.slice(0, SESSION_URL_LIMIT) : [];
  for (const value of source) {
    const stored = await storeSessionUrl(auth, value, assetIndex.current);
    assetIndex.current += 1;
    if (stored) urls.push(stored);
    else if (/^(https?:|blob:)/i.test(String(value || ''))) urls.push(String(value));
  }
  return urls;
}

async function sanitizeCanvasNodes(auth, nodes, assetIndex) {
  const source = Array.isArray(nodes) ? nodes.slice(0, SESSION_NODE_LIMIT) : [];
  const result = [];
  for (const node of source) {
    if (!node || typeof node !== 'object') continue;
    const rawUrl = String(node.url || '');
    let url = '';
    if (rawUrl) {
      url = await storeSessionUrl(auth, rawUrl, assetIndex.current);
      assetIndex.current += 1;
      if (!url && /^(https?:|blob:)/i.test(rawUrl)) url = rawUrl;
    }
    const x = Number(node.x);
    const y = Number(node.y);
    const width = Number(node.width);
    const height = Number(node.height);
    const canvasIndex = Math.round(Number(node.canvasIndex));
    result.push({
      id: text(node.id || randomUUID(), 120),
      parentId: text(node.parentId, 120),
      canvasIndex: Number.isFinite(canvasIndex) ? canvasIndex : result.length + 1,
      kind: text(node.kind || 'image', 40),
      url,
      persistedUrl: url,
      sourceUrl: text(node.sourceUrl, 1200),
      prompt: text(node.prompt, 6000),
      generationPrompt: text(node.generationPrompt || node.prompt, 6000),
      title: text(node.title, 160),
      x: Number.isFinite(x) ? Math.max(-8000, Math.min(8000, x)) : 0,
      y: Number.isFinite(y) ? Math.max(-8000, Math.min(8000, y)) : 0,
      width: Number.isFinite(width) ? Math.max(240, Math.min(620, Math.round(width))) : undefined,
      height: Number.isFinite(height) ? Math.max(200, Math.min(520, Math.round(height))) : undefined,
      createdAt: node.createdAt && !Number.isNaN(Date.parse(node.createdAt)) ? node.createdAt : new Date().toISOString(),
      downloadMeta: sanitizeDownloadMeta(node.downloadMeta)
    });
  }
  return result;
}

function sanitizeCanvasCustomLinks(links) {
  const source = Array.isArray(links) ? links.slice(0, SESSION_NODE_LIMIT) : [];
  return source
    .map((link) => ({
      id: text(link?.id || randomUUID(), 120),
      fromId: text(link?.fromId, 120),
      toId: text(link?.toId, 120),
      createdAt: link?.createdAt && !Number.isNaN(Date.parse(link.createdAt)) ? link.createdAt : new Date().toISOString()
    }))
    .filter((link) => link.fromId && link.toId);
}

function sanitizeGenerationQueue(items) {
  const source = Array.isArray(items) ? items.slice(-SESSION_QUEUE_LIMIT) : [];
  return source
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      id: text(item.id || randomUUID(), 120),
      serverJobId: text(item.serverJobId, 120),
      remote: Boolean(item.remote),
      status: text(item.status || 'queued', 40),
      createdAt: Number(item.createdAt || Date.now()),
      startedAt: item.startedAt ? Number(item.startedAt) : null,
      completedAt: item.completedAt ? Number(item.completedAt) : null,
      mode: text(item.mode || 'image', 40),
      providerId: text(item.providerId || item.provider || '', 160),
      providerFamily: text(item.providerFamily || item.providerId || item.provider || '', 160),
      apiKeySource: text(item.apiKeySource || '', 60),
      providerLabel: text(item.providerLabel || '', 160),
      prompt: text(item.prompt, 12000),
      model: text(item.model, 160),
      aspect: text(item.aspect || item.aspectRatio, 40),
      aspectRatio: text(item.aspectRatio || item.aspect, 40),
      customSize: text(item.customSize, 40),
      size: text(item.size, 40),
      quality: text(item.quality, 40),
      resolutionTier: text(item.resolutionTier, 40),
      outputFormat: text(item.outputFormat, 20),
      moderation: text(item.moderation, 40),
      count: Math.max(1, Math.min(4, Number(item.count || 1))),
      selectedCanvasNodeId: text(item.selectedCanvasNodeId, 120),
      selectedCanvasNodeSnapshot: sanitizeSessionObject(item.selectedCanvasNodeSnapshot),
      referencesOpen: Boolean(item.referencesOpen),
      summary: text(item.summary || item.prompt, 260),
      restorable: Boolean(item.restorable),
      restored: Boolean(item.restored),
      stage: text(item.stage, 40),
      completed: Math.max(0, Math.min(4, Number(item.completed || 0))),
      total: Math.max(1, Math.min(4, Number(item.total || item.count || 1))),
      resultUrls: Array.isArray(item.resultUrls) ? item.resultUrls.slice(0, 4).map((value) => text(value, 1200)).filter(Boolean) : [],
      requestIds: Array.isArray(item.requestIds) ? item.requestIds.slice(0, 8).map((value) => text(value, 160)).filter(Boolean) : [],
      error: item.error && typeof item.error === 'object'
        ? {
          code: text(item.error.code, 120),
          status: item.error.status || null,
          requestId: text(item.error.requestId, 160),
          message: text(item.error.message, 1200)
        }
        : null
    }));
}

async function pruneSessionAssets(auth, session) {
  const assetDir = path.join(auth.userDir, 'assets', SESSION_ASSET_ID);
  const referenced = new Set();
  const collect = (url) => {
    const match = String(url || '').match(new RegExp(`/studio-api/history/${SESSION_ASSET_ID}/assets/([0-9]{1,3}\\.(?:png|jpg|webp))$`));
    if (match) referenced.add(match[1]);
  };
  for (const url of session.results || []) collect(url);
  for (const node of session.canvasNodes || []) collect(node?.url);
  const files = await fs.readdir(assetDir).catch(() => []);
  await Promise.all(files
    .filter((fileName) => /^[0-9]{1,3}\.(png|jpg|webp)$/.test(fileName) && !referenced.has(fileName))
    .map((fileName) => fs.rm(path.join(assetDir, fileName), { force: true })));
}

async function sanitizeSession(auth, body) {
  const assetIndex = { current: 0 };
  const results = await sanitizeSessionUrls(auth, body.results, assetIndex);
  const videoResults = Array.isArray(body.videoResults) ? body.videoResults.slice(0, SESSION_URL_LIMIT).map((value) => text(value, 1200)).filter(Boolean) : [];
  const canvasNodes = await sanitizeCanvasNodes(auth, body.canvasNodes, assetIndex);
  const session = {
    updatedAt: new Date().toISOString(),
    sessionId: text(body.sessionId, 120),
    mode: text(body.mode || 'image', 40),
    prompt: text(body.prompt, 12000),
    model: text(body.model, 160),
    results,
    videoResults,
    resultBatchMeta: sanitizeSessionObject(body.resultBatchMeta),
    canvasNodes,
    canvasCustomLinks: sanitizeCanvasCustomLinks(body.canvasCustomLinks),
    generationQueue: sanitizeGenerationQueue(body.generationQueue),
    selectedCanvasNodeId: text(body.selectedCanvasNodeId, 120),
    canvasEditorNodeId: text(body.canvasEditorNodeId, 120),
    canvasView: sanitizeCanvasView(body.canvasView),
    status: text(body.status || 'idle', 40),
    message: text(body.message, 1000),
    progress: sanitizeSessionObject(body.progress),
    timing: sanitizeSessionObject(body.timing),
    assistantMessages: sanitizeAssistantMessages(body.assistantMessages),
    promptSuggestion: sanitizePromptSuggestion(body.promptSuggestion),
    selectedCase: sanitizeCase(body.selectedCase),
    parameters: sanitizeSessionObject(body.parameters)
  };
  await pruneSessionAssets(auth, session);
  return session;
}

async function sanitizeRecord(auth, body) {
  const recordId = cleanRecordId(body.id);
  const inputUrls = Array.isArray(body.resultUrls) ? body.resultUrls.slice(0, 4) : [];
  const resultUrls = [];
  for (let index = 0; index < inputUrls.length; index += 1) {
    const stored = await storeResultUrl(auth, recordId, inputUrls[index], index);
    if (stored) resultUrls.push(stored);
  }

  return {
    id: recordId,
    sessionId: text(body.sessionId, 120),
    createdAt: body.createdAt && !Number.isNaN(Date.parse(body.createdAt)) ? body.createdAt : new Date().toISOString(),
    mode: text(body.mode || 'image', 40),
    kind: text(body.kind || body.mode || 'image', 40),
    providerId: text(body.providerId || body.provider || '', 160),
    providerFamily: text(body.providerFamily || body.providerId || body.provider || '', 160),
    apiKeySource: text(body.apiKeySource || '', 60),
    providerLabel: text(body.providerLabel || '', 160),
    prompt: text(body.prompt, 6000),
    generationPrompt: text(body.generationPrompt || body.prompt, 6000),
    model: text(body.model, 120),
    size: text(body.size, 40),
    quality: text(body.quality, 40),
    outputFormat: text(body.outputFormat || body.output_format || '', 20),
    moderation: text(body.moderation || '', 40),
    requestIds: Array.isArray(body.requestIds) ? body.requestIds.slice(0, 8).map((value) => text(value, 160)).filter(Boolean) : [],
    usageSummary: text(body.usageSummary || body.costSummary || '', 240),
    costSummary: text(body.costSummary || '', 240),
    timing: sanitizeSessionObject(body.timing),
    count: Math.max(1, Math.min(4, Number(body.count || 1))),
    resultUrls,
    case: sanitizeCase(body.case)
  };
}

function cleanJobId(value) {
  const raw = String(value || '');
  return /^[a-zA-Z0-9_-]{8,100}$/.test(raw) ? raw : randomUUID();
}

function normalizeGatewayBaseUrl(value) {
  const raw = String(value || AI_GATEWAY_BASE_URL).replace(/\/+$/, '');
  if (raw.endsWith('/v1')) return raw;
  return `${raw}/v1`;
}

function dataUrlToBuffer(value) {
  const raw = String(value || '');
  const match = raw.match(/^data:(image\/(?:png|jpeg|webp));base64,([a-zA-Z0-9+/=\s]+)$/);
  if (!match) return null;
  const buffer = Buffer.from(match[2].replace(/\s+/g, ''), 'base64');
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) return null;
  return {
    mime: match[1],
    buffer,
    ext: assetExtension(match[1])
  };
}

function normalizeImageInput(value, index) {
  if (!value) return null;
  const dataUrl = typeof value === 'string' ? value : value.dataUrl;
  const parsed = dataUrlToBuffer(dataUrl);
  if (!parsed) return null;
  return {
    ...parsed,
    name: text(value.name || `reference-${index + 1}.${parsed.ext}`, 120)
  };
}

function gatewayErrorMessage(error) {
  const payload = error?.payload || {};
  const message = payload?.error?.message || payload?.message || error?.message || 'GENERATION_JOB_FAILED';
  return String(message).slice(0, 1200);
}

function gatewayRequestId(payload, headers) {
  return text(
    payload?.request_id
    || payload?.id
    || payload?.error?.request_id
    || payload?.error?.requestId
    || headers?.get?.('x-request-id')
    || headers?.get?.('openai-request-id')
    || '',
    180
  );
}

async function readGatewayResponse(response) {
  const raw = await response.text();
  let payload = {};
  try {
    payload = raw ? parseJsonText(raw) : {};
  } catch {
    payload = { message: raw.slice(0, 1200) };
  }
  if (!response.ok) {
    const error = new Error(payload?.error?.message || payload?.message || `GATEWAY_HTTP_${response.status}`);
    error.status = response.status;
    error.payload = payload;
    error.requestId = gatewayRequestId(payload, response.headers);
    throw error;
  }
  const requestId = gatewayRequestId(payload, response.headers);
  if (requestId && !payload.request_id) payload.request_id = requestId;
  return payload;
}

async function persistRemoteImage(auth, recordId, rawUrl, index) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60 * 1000);
  try {
    const response = await fetch(rawUrl, { signal: controller.signal });
    if (!response.ok) return rawUrl;
    const mime = String(response.headers.get('content-type') || 'image/png').split(';')[0].trim().toLowerCase();
    if (!/^image\/(png|jpeg|webp)$/.test(mime)) return rawUrl;
    const buffer = Buffer.from(await response.arrayBuffer());
    return await writeAssetBuffer(auth, recordId, buffer, mime, index) || rawUrl;
  } catch {
    return rawUrl;
  } finally {
    clearTimeout(timer);
  }
}

async function persistGatewayImage(auth, recordId, item, index, outputFormat = 'png') {
  const url = String(item?.url || item?.image_url || '').trim();
  if (item?.b64_json || item?.image_base64) {
    const mime = outputFormat === 'jpeg'
      ? 'image/jpeg'
      : outputFormat === 'webp'
        ? 'image/webp'
        : 'image/png';
    const buffer = Buffer.from(String(item.b64_json || item.image_base64).replace(/\s+/g, ''), 'base64');
    return writeAssetBuffer(auth, recordId, buffer, mime, index);
  }
  if (url.startsWith('data:')) {
    return storeResultUrl(auth, recordId, url, index);
  }
  if (/^https?:\/\//i.test(url)) {
    return persistRemoteImage(auth, recordId, url, index);
  }
  return '';
}

function buildJobRecord(body) {
  const request = body?.request && typeof body.request === 'object' ? body.request : body;
  const mode = ['edit', 'mask'].includes(request.mode) ? request.mode : 'image';
  const route = mode === 'image' && request.route !== 'edits' ? 'generations' : 'edits';
  const count = Math.max(1, Math.min(4, Number(request.n || request.count || 1)));
  const now = new Date().toISOString();
  return {
    id: cleanJobId(request.id || body.id),
    clientRequestId: cleanJobId(request.clientRequestId || body.clientRequestId),
    sessionId: text(request.sessionId || body.sessionId, 120),
    parentCanvasNodeId: text(request.parentCanvasNodeId || body.parentCanvasNodeId, 120),
    status: 'queued',
    stage: 'queued',
    createdAt: now,
    updatedAt: now,
    startedAt: '',
    completedAt: '',
    mode,
    route,
    endpoint: route === 'edits' ? '/v1/images/edits' : '/v1/images/generations',
    providerId: text(request.providerId || request.provider || '', 160),
    providerFamily: text(request.providerFamily || request.providerId || request.provider || '', 160),
    apiKeySource: text(request.apiKeySource || '', 60),
    providerLabel: text(request.providerLabel || '', 160),
    model: text(request.model, 160),
    prompt: text(request.prompt, 12000),
    generationPrompt: text(request.generationPrompt || request.prompt, 12000),
    size: text(request.size || 'auto', 40),
    quality: text(request.quality || 'auto', 40),
    outputFormat: text(request.outputFormat || request.output_format || 'png', 20),
    moderation: text(request.moderation || 'auto', 40),
    count,
    completed: 0,
    total: count,
    resultUrls: [],
    usage: null,
    error: null,
    requestIds: [],
    timing: {
      queuedAt: Date.now(),
      startedAt: null,
      completedAt: null,
      totalMs: null
    },
    inputSummary: {
      referenceCount: Array.isArray(body.images) ? body.images.length : 0,
      hasMask: Boolean(body.mask)
    }
  };
}

function buildJobRuntime(body) {
  const request = body?.request && typeof body.request === 'object' ? body.request : body;
  if (PASSWORD_AUTH) {
    // The server key must never be sent to a client-chosen URL, so the base URL is fixed here too.
    if (!PASSWORD_AUTH.apiKey) {
      const error = new Error('SERVER_API_KEY_MISSING');
      error.status = 500;
      throw error;
    }
    return {
      apiKey: PASSWORD_AUTH.apiKey,
      gatewayBaseUrl: normalizeGatewayBaseUrl(AI_GATEWAY_BASE_URL),
      images: (Array.isArray(body.images) ? body.images : []).slice(0, 4).map(normalizeImageInput).filter(Boolean),
      mask: body.mask ? normalizeImageInput(body.mask, 0) : null
    };
  }
  const apiKey = text(body.apiKey || request.apiKey, 4000);
  if (!apiKey) {
    const error = new Error('GENERATION_JOB_API_KEY_REQUIRED');
    error.status = 400;
    throw error;
  }
  return {
    apiKey,
    gatewayBaseUrl: normalizeGatewayBaseUrl(body.gatewayBaseUrl || request.gatewayBaseUrl || AI_GATEWAY_BASE_URL),
    images: (Array.isArray(body.images) ? body.images : []).slice(0, 4).map(normalizeImageInput).filter(Boolean),
    mask: body.mask ? normalizeImageInput(body.mask, 0) : null
  };
}

async function writeHistoryRecordForJob(auth, job) {
  if (!Array.isArray(job.resultUrls) || !job.resultUrls.length) return;
  const records = await readRecords(auth);
  const record = {
    id: job.id,
    sessionId: job.sessionId,
    createdAt: job.createdAt,
    mode: job.mode,
    providerId: job.providerId,
    providerFamily: job.providerFamily,
    apiKeySource: job.apiKeySource,
    providerLabel: job.providerLabel,
    prompt: job.prompt,
    generationPrompt: job.generationPrompt || job.prompt,
    model: job.model,
    size: job.size,
    quality: job.quality,
    outputFormat: job.outputFormat,
    moderation: job.moderation,
    count: job.count,
    resultUrls: job.resultUrls,
    requestIds: Array.isArray(job.requestIds) ? job.requestIds : [],
    usageSummary: job.usage ? JSON.stringify(job.usage).slice(0, 240) : '',
    timing: job.timing || null,
    case: null
  };
  await writeRecords(auth, [record, ...records.filter((item) => item.id !== record.id)].slice(0, HISTORY_LIMIT));
}

async function postJsonToGateway(url, apiKey, body, clientRequestId, signal) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Client-Request-ID': clientRequestId,
      'X-Request-ID': clientRequestId
    },
    body: JSON.stringify(body),
    signal
  });
  return readGatewayResponse(response);
}

async function postMultipartToGateway(url, apiKey, form, clientRequestId, signal) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'X-Client-Request-ID': clientRequestId,
      'X-Request-ID': clientRequestId
    },
    body: form,
    signal
  });
  return readGatewayResponse(response);
}

async function runGenerationRequest(auth, job, runtime, signal) {
  const resultUrls = [];
  const requestIds = [];
  const usages = [];
  const total = Math.max(1, Number(job.count || 1));
  if (job.route === 'edits') {
    const form = new FormData();
    form.set('model', job.model);
    form.set('prompt', job.generationPrompt || job.prompt);
    form.set('size', job.size);
    form.set('quality', job.quality);
    form.set('output_format', job.outputFormat || 'png');
    form.set('moderation', job.moderation || 'auto');
    form.set('n', String(total));
    runtime.images.forEach((image, index) => {
      form.append('image', new Blob([image.buffer], { type: image.mime }), image.name || `reference-${index + 1}.${image.ext}`);
    });
    if (runtime.mask) {
      form.set('mask', new Blob([runtime.mask.buffer], { type: runtime.mask.mime }), runtime.mask.name || `mask.${runtime.mask.ext}`);
    }
    const payload = await postMultipartToGateway(`${runtime.gatewayBaseUrl}/images/edits`, runtime.apiKey, form, job.clientRequestId, signal);
    const items = Array.isArray(payload?.data) ? payload.data : [];
    for (let index = 0; index < items.length; index += 1) {
      const stored = await persistGatewayImage(auth, job.id, items[index], resultUrls.length, job.outputFormat);
      if (stored) resultUrls.push(stored);
    }
    requestIds.push(gatewayRequestId(payload));
    if (payload?.usage) usages.push(payload.usage);
    return { resultUrls, requestIds, usage: usages[0] || null };
  }

  for (let index = 0; index < total; index += 1) {
    const payload = await postJsonToGateway(`${runtime.gatewayBaseUrl}/images/generations`, runtime.apiKey, {
      model: job.model,
      prompt: job.generationPrompt || job.prompt,
      size: job.size,
      quality: job.quality,
      n: 1
    }, `${job.clientRequestId}-${index + 1}`, signal);
    const items = Array.isArray(payload?.data) ? payload.data : [];
    if (!items.length) {
      const error = new Error('IMAGES_GENERATIONS_RETURNED_NO_IMAGES');
      error.payload = payload;
      throw error;
    }
    for (const item of items) {
      const stored = await persistGatewayImage(auth, job.id, item, resultUrls.length, job.outputFormat);
      if (stored) resultUrls.push(stored);
    }
    requestIds.push(gatewayRequestId(payload));
    if (payload?.usage) usages.push(payload.usage);
    await updateJob(auth, job.id, {
      status: 'upstream',
      stage: 'upstream',
      completed: Math.min(resultUrls.length, total),
      resultUrls,
      requestIds: requestIds.filter(Boolean)
    });
  }
  return { resultUrls, requestIds, usage: usages.length === 1 ? usages[0] : usages.length ? usages : null };
}

async function runGenerationJob(auth, jobId, runtime) {
  const existingJobs = await readJobs(auth);
  const existingJob = existingJobs.find((job) => job.id === jobId);
  if (!existingJob || existingJob.status === 'canceled') return;

  const startedAt = Date.now();
  const controller = new AbortController();
  const key = jobRuntimeKey(auth, jobId);
  activeJobControllers.set(key, controller);
  const timer = setTimeout(() => controller.abort(new Error('JOB_TIMEOUT')), JOB_TIMEOUT_MS);
  try {
    let job = await updateJob(auth, jobId, {
      status: 'dispatching',
      stage: 'dispatching',
      startedAt: new Date(startedAt).toISOString(),
      timing: {
        queuedAt: null,
        startedAt,
        completedAt: null,
        totalMs: null
      }
    });
    if (!job) return;
    job = await updateJob(auth, jobId, {
      status: 'upstream',
      stage: 'upstream'
    });
    const result = await runGenerationRequest(auth, job, runtime, controller.signal);
    const completedAt = Date.now();
    const nextJob = await updateJob(auth, jobId, {
      status: 'succeeded',
      stage: 'succeeded',
      completedAt: new Date(completedAt).toISOString(),
      completed: result.resultUrls.length,
      total: Math.max(Number(job.count || 1), result.resultUrls.length),
      resultUrls: result.resultUrls,
      usage: result.usage,
      requestIds: result.requestIds.filter(Boolean),
      timing: {
        startedAt,
        completedAt,
        totalMs: completedAt - startedAt
      },
      error: null
    });
    if (nextJob) await writeHistoryRecordForJob(auth, nextJob);
  } catch (error) {
    const completedAt = Date.now();
    const reason = String(controller.signal.reason?.message || '');
    const timedOut = controller.signal.aborted && reason.includes('JOB_TIMEOUT');
    const canceled = controller.signal.aborted && reason.includes('JOB_CANCELED');
    await updateJob(auth, jobId, {
      status: timedOut ? 'unknown' : canceled ? 'canceled' : 'failed',
      stage: timedOut ? 'unknown' : canceled ? 'canceled' : 'failed',
      completedAt: new Date(completedAt).toISOString(),
      timing: {
        startedAt,
        completedAt,
        totalMs: completedAt - startedAt
      },
      error: {
        code: timedOut ? 'JOB_TIMEOUT' : canceled ? 'JOB_CANCELED' : (error?.status ? `HTTP_${error.status}` : 'GENERATION_JOB_FAILED'),
        status: error?.status || null,
        requestId: error?.requestId || gatewayRequestId(error?.payload || {}),
        message: timedOut
          ? 'The server stopped waiting for this generation job. The upstream request may still finish or bill.'
          : canceled
            ? 'The queued or running job was canceled locally. If it already reached the upstream, the upstream may still finish or bill.'
          : gatewayErrorMessage(error)
      }
    });
  } finally {
    clearTimeout(timer);
    activeJobControllers.delete(key);
  }
}

function enqueueGenerationJob(auth, job, runtime) {
  const queue = jobQueues.get(auth.userKey) || { running: 0, draining: false, items: [] };
  queue.items.push({ auth, jobId: job.id, runtime });
  jobQueues.set(auth.userKey, queue);
  setTimeout(() => drainGenerationQueue(auth.userKey), 0);
}

async function drainGenerationQueue(userKey) {
  const queue = jobQueues.get(userKey);
  if (!queue || queue.draining) return;
  queue.draining = true;
  while (queue.items.length && queue.running < JOB_CONCURRENCY) {
    const item = queue.items.shift();
    queue.running += 1;
    runGenerationJob(item.auth, item.jobId, item.runtime)
      .catch(() => {})
      .finally(() => {
        queue.running = Math.max(0, queue.running - 1);
        setTimeout(() => drainGenerationQueue(userKey), 0);
      });
  }
  queue.draining = false;
}

async function removeRecordAssets(auth, recordId) {
  await fs.rm(path.join(auth.userDir, 'assets', recordId), { recursive: true, force: true });
}

function parseRoute(req) {
  const url = new URL(req.url, 'http://localhost');
  const parts = url.pathname.split('/').filter(Boolean);
  return { url, parts };
}

async function serveAsset(req, res, auth, parts) {
  const recordId = cleanRecordId(parts[2]);
  const fileName = parts[4] || '';
  if (!/^[0-9]{1,3}\.(png|jpg|webp)$/.test(fileName)) {
    return sendJson(res, 404, { ok: false, error: 'ASSET_NOT_FOUND' });
  }

  const filePath = path.join(auth.userDir, 'assets', recordId, fileName);
  const relative = path.relative(path.join(auth.userDir, 'assets'), filePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return sendJson(res, 404, { ok: false, error: 'ASSET_NOT_FOUND' });
  }

  const stat = await fs.stat(filePath).catch(() => null);
  if (!stat?.isFile()) return sendJson(res, 404, { ok: false, error: 'ASSET_NOT_FOUND' });

  const ext = path.extname(fileName).slice(1);
  const mime = ext === 'jpg' ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : 'image/png';
  res.writeHead(200, {
    'Content-Type': mime,
    'Content-Length': stat.size,
    'Cache-Control': 'private, max-age=3600'
  });
  createReadStream(filePath).pipe(res);
}

async function serveLibraryAsset(req, res, auth, parts) {
  const rawAssetPath = decodeURIComponent(parts.slice(2).join('/'));
  const segments = rawAssetPath.split('/').filter(Boolean);
  if (!segments.length || segments.some((segment) => segment === '..' || segment.includes('\0'))) {
    return sendJson(res, 404, { ok: false, error: 'ASSET_NOT_FOUND' });
  }

  const filePath = path.join(LIBRARY_ASSET_DIR, ...segments);
  const relative = path.relative(LIBRARY_ASSET_DIR, filePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return sendJson(res, 404, { ok: false, error: 'ASSET_NOT_FOUND' });
  }

  const stat = await fs.stat(filePath).catch(() => null);
  if (!stat?.isFile()) return sendJson(res, 404, { ok: false, error: 'ASSET_NOT_FOUND' });

  const ext = path.extname(filePath).slice(1).toLowerCase();
  const mime = ext === 'jpg' || ext === 'jpeg'
    ? 'image/jpeg'
    : ext === 'webp'
      ? 'image/webp'
      : ext === 'svg'
        ? 'image/svg+xml'
        : 'image/png';
  res.writeHead(200, {
    'Content-Type': mime,
    'Content-Length': stat.size,
    'Cache-Control': 'private, max-age=300',
    'X-Robots-Tag': 'noindex, nofollow, noarchive'
  });
  createReadStream(filePath).pipe(res);
}

async function handler(req, res) {
  const corsAllowed = sendCors(req, res);
  if (req.method === 'OPTIONS') {
    res.writeHead(corsAllowed ? 204 : 403);
    res.end();
    return;
  }
  if (!corsAllowed) {
    return sendJson(res, 403, { ok: false, error: 'ORIGIN_NOT_ALLOWED' });
  }

  const { url, parts } = parseRoute(req);
  if (parts.join('/') === 'studio-api/health') {
    return sendJson(res, 200, { ok: true });
  }
  if (parts[0] === 'studio-api' && parts[1] === 'auth' && parts.length === 3) {
    return handleAuthRoute(req, res, parts);
  }

  if (parts[0] !== 'studio-api' || !['history', 'session', 'generation-jobs', 'library', 'library-assets', 'prompt-presets', 'video-inspirations'].includes(parts[1])) {
    return sendJson(res, 404, { ok: false, error: 'NOT_FOUND' });
  }

  try {
    const auth = await authenticate(req);

    if (req.method === 'GET' && parts[0] === 'studio-api' && parts[1] === 'session' && parts.length === 2) {
      const session = await readSession(auth);
      return sendJson(res, 200, { ok: true, session });
    }

    if (req.method === 'POST' && parts[0] === 'studio-api' && parts[1] === 'session' && parts.length === 2) {
      const body = await readJsonBody(req);
      const session = await sanitizeSession(auth, body);
      await writeSession(auth, session);
      return sendJson(res, 200, { ok: true, session });
    }

    if (req.method === 'DELETE' && parts[0] === 'studio-api' && parts[1] === 'session' && parts.length === 2) {
      await fs.rm(sessionPath(auth), { force: true });
      await fs.rm(path.join(auth.userDir, 'assets', SESSION_ASSET_ID), { recursive: true, force: true });
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === 'GET' && parts[0] === 'studio-api' && parts[1] === 'generation-jobs' && parts.length === 2) {
      const sessionId = text(url.searchParams.get('sessionId'), 120);
      const limit = Math.max(1, Math.min(JOB_LIMIT, Number(url.searchParams.get('limit') || 40)));
      const jobs = await readJobs(auth);
      const filtered = sessionId ? jobs.filter((job) => job.sessionId === sessionId) : jobs;
      return sendJson(res, 200, { ok: true, jobs: filtered.slice(0, limit) });
    }

    if (req.method === 'POST' && parts[0] === 'studio-api' && parts[1] === 'generation-jobs' && parts.length === 2) {
      const body = await readJsonBody(req);
      const job = buildJobRecord(body);
      const runtime = buildJobRuntime(body);
      if (job.route === 'edits' && !runtime.images.length) {
        return sendJson(res, 400, { ok: false, error: 'REFERENCE_IMAGE_REQUIRED' });
      }
      await upsertJob(auth, job);
      enqueueGenerationJob(auth, job, runtime);
      return sendJson(res, 202, { ok: true, job });
    }

    if (req.method === 'GET' && parts[0] === 'studio-api' && parts[1] === 'generation-jobs' && parts.length === 3) {
      const jobId = cleanJobId(parts[2]);
      const jobs = await readJobs(auth);
      const job = jobs.find((item) => item.id === jobId);
      if (!job) return sendJson(res, 404, { ok: false, error: 'GENERATION_JOB_NOT_FOUND' });
      return sendJson(res, 200, { ok: true, job });
    }

    if (req.method === 'DELETE' && parts[0] === 'studio-api' && parts[1] === 'generation-jobs' && parts.length === 3) {
      const jobId = cleanJobId(parts[2]);
      const jobs = await readJobs(auth);
      const currentJob = jobs.find((item) => item.id === jobId);
      if (!currentJob) return sendJson(res, 404, { ok: false, error: 'GENERATION_JOB_NOT_FOUND' });
      if (!JOB_ACTIVE_STATUSES.has(currentJob.status)) {
        return sendJson(res, 200, { ok: true, job: currentJob });
      }
      const key = jobRuntimeKey(auth, jobId);
      const controller = activeJobControllers.get(key);
      if (controller) controller.abort(new Error('JOB_CANCELED'));
      const queue = jobQueues.get(auth.userKey);
      if (queue?.items?.length) {
        queue.items = queue.items.filter((item) => item.jobId !== jobId);
      }
      const job = await updateJob(auth, jobId, {
        status: 'canceled',
        stage: 'canceled',
        completedAt: new Date().toISOString(),
        error: {
          code: 'JOB_CANCELED',
          message: 'The job was canceled locally.'
        }
      });
      return sendJson(res, 200, { ok: true, job });
    }

    if (req.method === 'GET' && parts[0] === 'studio-api' && parts[1] === 'library' && parts.length === 2) {
      const { payload } = await readLibrary();
      return sendJson(res, 200, payload);
    }

    if (req.method === 'GET' && parts[0] === 'studio-api' && parts[1] === 'library' && parts.length === 3) {
      const id = cleanLibraryId(decodeURIComponent(parts[2]));
      const { rawCases } = await readLibrary();
      const item = rawCases.find((caseItem) => String(caseItem.id) === id);
      if (!item) return sendJson(res, 404, { ok: false, error: 'LIBRARY_ITEM_NOT_FOUND' });
      return sendJson(res, 200, { ok: true, case: sanitizeLibraryDetail(item) });
    }

    if (req.method === 'GET' && parts[0] === 'studio-api' && parts[1] === 'prompt-presets' && parts.length === 3) {
      const id = cleanLibraryId(decodeURIComponent(parts[2]));
      const item = PROMPT_PRESETS.find((preset) => preset.id === id);
      if (!item) return sendJson(res, 404, { ok: false, error: 'PROMPT_PRESET_NOT_FOUND' });
      return sendJson(res, 200, { ok: true, preset: sanitizePromptPresetDetail(item) });
    }

    if (req.method === 'GET' && parts[0] === 'studio-api' && parts[1] === 'video-inspirations' && parts.length === 3) {
      const id = cleanLibraryId(decodeURIComponent(parts[2]));
      const item = VIDEO_INSPIRATIONS.find((inspiration) => inspiration.id === id);
      if (!item) return sendJson(res, 404, { ok: false, error: 'VIDEO_INSPIRATION_NOT_FOUND' });
      return sendJson(res, 200, { ok: true, inspiration: sanitizeVideoInspirationDetail(item) });
    }

    if (req.method === 'GET' && parts[0] === 'studio-api' && parts[1] === 'library-assets') {
      return serveLibraryAsset(req, res, auth, parts);
    }

    if (req.method === 'GET' && parts.length === 2) {
      const records = await readRecords(auth);
      const limit = Math.max(1, Math.min(HISTORY_LIMIT, Number(url.searchParams.get('limit') || 30)));
      const offset = Math.max(0, Number(url.searchParams.get('offset') || 0));
      const page = records.slice(offset, offset + limit);
      const nextOffset = offset + page.length < records.length ? offset + page.length : null;
      return sendJson(res, 200, { ok: true, records: page, total: records.length, nextOffset });
    }

    if (req.method === 'POST' && parts.length === 2) {
      const body = await readJsonBody(req);
      const record = await sanitizeRecord(auth, body);
      const records = await readRecords(auth);
      const nextRecords = [record, ...records.filter((item) => item.id !== record.id)].slice(0, HISTORY_LIMIT);
      await writeRecords(auth, nextRecords);
      return sendJson(res, 200, { ok: true, record });
    }

    if (req.method === 'DELETE' && parts.length === 2) {
      const records = await readRecords(auth);
      await Promise.all(records.map((record) => removeRecordAssets(auth, record.id)));
      await writeRecords(auth, []);
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === 'DELETE' && parts.length === 3) {
      const recordId = cleanRecordId(parts[2]);
      const records = await readRecords(auth);
      await removeRecordAssets(auth, recordId);
      await writeRecords(auth, records.filter((item) => item.id !== recordId));
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === 'GET' && parts.length === 5 && parts[3] === 'assets') {
      return serveAsset(req, res, auth, parts);
    }

    res.setHeader('Allow', 'GET, POST, DELETE, OPTIONS');
    return sendJson(res, 405, { ok: false, error: 'METHOD_NOT_ALLOWED' });
  } catch (error) {
    const status = error.status || 500;
    const message = status >= 500 ? 'STUDIO_HISTORY_FAILED' : error.message;
    if (status >= 500) {
      console.warn('Studio history service failed', {
        message: String(error?.message || 'unknown').slice(0, 240)
      });
    }
    return sendJson(res, status, { ok: false, error: message });
  }
}

const server = http.createServer((req, res) => {
  handler(req, res).catch((error) => {
    console.warn('Unhandled studio history error', {
      message: String(error?.message || 'unknown').slice(0, 240)
    });
    sendJson(res, 500, { ok: false, error: 'STUDIO_HISTORY_FAILED' });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`image-sub2api-studio history service listening on http://${HOST}:${PORT}/studio-api`);
  console.log(`Data directory: ${DATA_DIR}`);
  console.log(`AI gateway base URL: ${AI_GATEWAY_BASE_URL}`);
  console.log(`Auth mode: ${PASSWORD_AUTH ? `password (${PASSWORD_AUTH.apiKey ? 'server API key set' : 'AI_GATEWAY_API_KEY missing'})` : AUTH_MODE}`);
});
