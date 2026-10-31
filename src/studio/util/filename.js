// src/studio/util/filename.js
//
// Tiện ích tên tệp tải xuống: gộp Provider ID, thời gian tạo, prompt và MIME thành tên dạng
// `ai-image-workbench-{provider}-{YYYYMMDD-HHmm}-{slug}-{index}.{ext}` bằng hàm thuần,
// dùng cho thuộc tính `download` ở ResultGrid / Lightbox / HistoryCard.
//
// Cơ sở thiết kế:
//   - requirements.md, yêu cầu 9.1 ~ 9.8 (quy tắc tên tệp tải xuống)
//   - design.md, mục "Download Filename" (bảng thuật toán, ví dụ và mimeToExt)
//   - tasks.md, tác vụ 1.4
//
// Các thuộc tính quan trọng (design.md, tính an toàn tên tệp, thuộc tính P10):
//   - Đầu ra chỉ chứa `[a-z0-9.-]`, không có dấu phân cách đường dẫn, ký tự điều khiển hay dấu nháy;
//   - slug của prompt dài tối đa 40 ký tự;
//   - prompt rỗng hoặc không có ký tự ASCII sẽ dùng `image`, slug không bao giờ rỗng;
//   - index luôn từ 1 trở lên, kể cả khi bên gọi truyền 0, số âm hoặc NaN;
//   - mọi hàm hỗ trợ (`sanitizeProvider` / `formatLocalStamp` / `buildPromptSlug` /
//     `mimeToExt`) đều xử lý an toàn đầu vào `null`, `undefined` và không phải chuỗi.
//
// Phiên bản 1 không thêm thư viện phiên âm hoặc chuyển tự: prompt chứa CJK và không thể
// chuyển thành chữ số ASCII bằng NFKD sẽ cho slug rỗng, sau đó buildPromptSlug dùng `image`.
// Cách này khớp yêu cầu 9.5 / 9.6; ưu tiên chuyển tự ở mục 9.6 có thể được bổ sung sau.

/**
 * Cấu trúc tham số của `buildDownloadFilename`.
 *
 * @typedef {Object} BuildDownloadFilenameArgs
 * @property {string} providerId
 *   ID trong Provider Registry (ví dụ `'gateway-account'` / `'replicate'`), được
 *   `sanitizeProvider` chuẩn hóa thành `[a-z0-9-]`.
 * @property {string} createdAt
 *   Chuỗi ISO 8601 hoặc giá trị `new Date()` chấp nhận được; định dạng theo múi giờ địa phương thành
 *   `YYYYMMDD-HHmm`。
 * @property {string} prompt
 *   Prompt gốc; chuỗi rỗng, chỉ có CJK hoặc chỉ có ký hiệu sẽ dùng `image`.
 * @property {string} mime
 *   MIME của tài nguyên kết quả như `'image/png'` / `'image/jpeg'` / `'image/webp'`;
 *   nếu không nhận diện được thì dùng `png`.
 * @property {number} index
 *   Số thứ tự bắt đầu từ 0; đầu ra được ánh xạ thành `Math.max(1, (index|0) + 1)`.
 */

/**
 * Gộp siêu dữ liệu kết quả tạo ảnh thành tên tệp tải xuống.
 *
 * Định dạng: `ai-image-workbench-{provider}-{YYYYMMDD-HHmm}-{slug}-{index}.{ext}`.
 *
 * Ví dụ:
 *   - `A corgi running on the beach.` / `gateway-account` / `image/png` / index `0`
 *     → `ai-image-workbench-gateway-account-20260517-1330-a-corgi-running-on-the-beach-1.png`
 *   - `Cận cảnh tách cà phê` / `pollinations` / `image/jpeg` / index `0`
 *     → `ai-image-workbench-pollinations-20260517-1330-image-1.jpg`
 *   - `Café au lait, soft light` / `replicate` / `image/webp` / index `0`
 *     → `ai-image-workbench-replicate-20260517-0905-cafe-au-lait-soft-light-1.webp`
 *
 * @param   {BuildDownloadFilenameArgs} args
 * @returns {string}
 */
export function buildDownloadFilename({ providerId, createdAt, prompt, mime, index }) {
  const provider = sanitizeProvider(providerId);
  const stamp = formatLocalStamp(new Date(createdAt));
  const slug = buildPromptSlug(prompt);
  const ext = mimeToExt(mime);
  const seq = String(Math.max(1, (Number.isFinite(index) ? (index | 0) : 0) + 1));
  return `ai-image-workbench-${provider}-${stamp}-${slug}-${seq}.${ext}`;
}

/**
 * Chuẩn hóa Provider ID về `[a-z0-9-]`.
 *
 *   - Chuyển thành chữ thường;
 *   - Gộp mọi ký tự ngoài `[a-z0-9-]` thành một dấu gạch ngang;
 *   - Xóa dấu gạch ngang ở đầu và cuối;
 *   - Chuỗi rỗng dùng `'provider'` để tên tệp luôn có đoạn hợp lệ.
 *
 * @param {string} providerId
 * @returns {string}
 */
export function sanitizeProvider(providerId) {
  const normalized = String(providerId ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || 'provider';
}

/**
 * Định dạng `Date` theo múi giờ địa phương thành `YYYYMMDD-HHmm`.
 *
 * Ngày không hợp lệ (`Number.isNaN(d.getTime())`) dùng `'00000000-0000'` để tránh ném lỗi
 * và làm gián đoạn toàn bộ quá trình tạo tên tệp.
 *
 * @param {Date} d
 * @returns {string}
 */
export function formatLocalStamp(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) {
    return '00000000-0000';
  }
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hour = pad(d.getHours());
  const minute = pad(d.getMinutes());
  return `${year}${month}${day}-${hour}${minute}`;
}

/**
 * Chuyển prompt thành slug an toàn (tối đa 40 ký tự, chỉ gồm `[a-z0-9-]`).
 *
 * Thuật toán (theo mục "Download Filename" trong design.md):
 *   1. Chuẩn hóa NFKD (tách `é` thành `e` và dấu kết hợp);
 *   2. Xóa mọi dấu kết hợp (U+0300..U+036F);
 *   3. Đổi dấu nháy thông minh và dấu câu full-width thường gặp thành khoảng trắng;
 *   4. Chuyển thành chữ thường, gộp chuỗi ký tự ngoài `[a-z0-9]` thành một dấu gạch ngang;
 *   5. Xóa dấu gạch ngang ở đầu và cuối;
 *   6. Giới hạn 40 ký tự; nếu kết quả kết thúc bằng dấu gạch ngang thì xóa tiếp;
 *   7. Nếu kết quả rỗng (thường do prompt chỉ có CJK hoặc ký hiệu), dùng `'image'`.
 *
 * @param {string} prompt
 * @returns {string}
 */
export function buildPromptSlug(prompt) {
  let text = String(prompt ?? '').normalize('NFKD');
  // Xóa dấu kết hợp (dấu phụ được tách ra khi chuẩn hóa NFKD).
  text = text.replace(/[\u0300-\u036f]/g, '');
  // Đổi dấu nháy thông minh và khoảng trắng full-width thành khoảng trắng thường để bước gộp
  // `[^a-z0-9]+` tiếp theo xử lý chính xác hơn.
  text = text.replace(/[\u2018\u2019\u201C\u201D'"\u00A0\u3000]/g, ' ');
  text = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (text.length > 40) {
    text = text.slice(0, 40).replace(/-+$/, '');
  }
  return text || 'image';
}

/**
 * Ánh xạ chuỗi MIME sang phần mở rộng của tệp tải xuống.
 *
 *   - `'image/png'`              → `'png'`
 *   - `'image/jpeg'` / `'image/jpg'` → `'jpg'`
 *   - `'image/webp'`             → `'webp'`
 *   - Giá trị khác (kể cả `null` / `undefined`) → `'png'`
 *
 * Chỉ cần nhận diện dạng chữ thường: MIME bên gọi truyền vào thường lấy từ `Blob.type` /
 * Content-Type và đã ở dạng chữ thường; nếu dịch vụ nguồn trả chữ hoa, `.toLowerCase()` sẽ xử lý.
 *
 * @param {string} mime
 * @returns {string}
 */
export function mimeToExt(mime) {
  const value = String(mime ?? '').toLowerCase();
  if (value === 'image/png') return 'png';
  if (value === 'image/jpeg' || value === 'image/jpg') return 'jpg';
  if (value === 'image/webp') return 'webp';
  return 'png';
}
