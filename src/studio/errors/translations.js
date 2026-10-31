// src/studio/errors/translations.js
//
// Bảng Error Translation Table và tiện ích translateError: chuẩn hóa lỗi từ mọi nhà cung cấp
// thành thông báo tiếng Việt thân thiện để giao diện hiển thị (message + hint + chi tiết kỹ thuật có thể mở rộng).
//
// Cơ sở thiết kế:
//   - requirements.md Requirement 4 (4.1 ~ 4.6)
//   - mục "Error Translation Table" trong design.md
//   - tác vụ 1.5 trong tasks.md
//
// Nơi sử dụng:
//   - Nhánh catch của CreationDesk: translateError(providerId, error)
//   - Hook chuẩn hóa lỗi fetch hoặc lỗi nhà cung cấp dạng { status, providerCode, message, payload }
//     thành TranslatedError, rồi chuyển cho máy trạng thái chọn nhánh error hoặc cancelled.
//
// Điểm thiết kế:
//   - Thứ tự tra cứu: `${providerId}:${status}` → `${providerId}:${providerCode}`
//     → `default:${status}` → `default:unknown`.
//   - Mọi lỗi 5xx dùng chung mục `default:5xx`.
//   - AbortError (`error.name === 'AbortError'`) ánh xạ sang `default:abort`, để bên gọi
//     chuyển trạng thái CANCEL trong ProgressMachine thay vì báo lỗi.
//   - Lỗi mạng / CORS (fetch bị từ chối, không có status) dùng `default:network`.
//   - Trường raw giữ payload gốc (ưu tiên error.payload, nếu không có thì giữ chính error),
//     dùng cho bảng "Chi tiết kỹ thuật / Sao chép phản hồi gốc".
//   - Hàm luôn trả về TranslatedError và không ném ngoại lệ.

/**
 * @typedef {Object} TranslatedError
 * @property {string}            providerId
 * @property {number} [status]
 * @property {string} [providerCode]
 * @property {string}            message
 * @property {string} [hint]
 * @property {unknown}           raw
 */

/**
 * @typedef {Object} TranslationEntry
 * @property {string}            message
 * @property {string} [hint]
 */

/**
 * Các mục ban đầu của Error_Translation_Table.
 *
 * Định dạng khóa:
 *   - `default:${status}` — dự phòng theo mã trạng thái HTTP; 5xx dùng `default:5xx`;
 *   - `default:${pseudoCode}` — lỗi không thuộc HTTP (abort / network / unknown);
 *   - `${providerId}:${status}` — ghi đè riêng theo mã trạng thái của từng nhà cung cấp;
 *   - `${providerId}:${providerCode}` — ghi đè theo mã lỗi riêng của nhà cung cấp.
 *
 * @type {Readonly<Record<string, TranslationEntry>>}
 */
export const ERROR_TRANSLATIONS = Object.freeze({
  // --- Mục dự phòng mặc định ---------------------------------------------------
  'default:401': Object.freeze({
    message: 'Xác thực thất bại: API key không hợp lệ hoặc đã hết hạn',
    hint: 'Mở Cài đặt và nhập lại key',
  }),
  'default:402': Object.freeze({
    message: 'Không đủ số dư hoặc điểm',
    hint: 'Nạp tiền trong tài khoản hoặc đổi nhà cung cấp',
  }),
  'default:403': Object.freeze({
    message: 'Bạn không có quyền truy cập model này',
    hint: 'Kiểm tra gói tài khoản hoặc cấu hình nhà cung cấp',
  }),
  'default:404': Object.freeze({
    message: 'Không tìm thấy model hoặc địa chỉ gateway sai',
    hint: 'Kiểm tra tên model trong Cài đặt',
  }),
  'default:415': Object.freeze({
    message: 'Định dạng tệp không được hỗ trợ',
    hint: 'Hãy tải lên ảnh PNG / JPG / WebP',
  }),
  'default:422': Object.freeze({
    message: 'Thông số không hợp lệ',
    hint: 'Kiểm tra kích thước, số lượng và chất lượng có nằm trong giới hạn cho phép không',
  }),
  'default:429': Object.freeze({
    message: 'Bạn gửi yêu cầu quá nhanh. Hãy thử lại sau',
    hint: 'Thường có thể thử lại sau khoảng một phút',
  }),
  'default:5xx': Object.freeze({
    message: 'Dịch vụ nguồn tạm thời không khả dụng',
    hint: 'Thử lại sau hoặc đổi nhà cung cấp',
  }),
  'default:network': Object.freeze({
    message: 'Lỗi mạng hoặc bị CORS chặn',
    hint: 'Kiểm tra mạng hoặc tiện ích trình duyệt',
  }),
  'default:abort': Object.freeze({
    message: 'Đã hủy',
  }),

  // --- Ghi đè riêng cho nhà cung cấp ------------------------------------------
  'replicate:422': Object.freeze({
    message: 'Replicate từ chối prompt này',
    hint: 'Có thể prompt chứa nội dung nhạy cảm hoặc bị hạn chế',
  }),
  'replicate:nsfw': Object.freeze({
    message: 'Prompt bị bộ lọc nội dung nhạy cảm chặn',
    hint: 'Xóa các từ nhạy cảm rồi thử lại',
  }),
  'pollinations:429': Object.freeze({
    message: 'Pollinations hiện đang bận',
    hint: 'Máy chủ miễn phí đang giới hạn lượt gọi; hãy thử lại sau',
  }),
  'sub2api:402': Object.freeze({
    message: 'Không đủ hạn mức sử dụng',
    hint: 'Nạp thêm hoặc đợi hạn mức miễn phí được cấp lại',
  }),
  'fal:401': Object.freeze({
    message: 'Fal key không hợp lệ',
    hint: 'Mở Cài đặt và nhập lại key',
  }),
  'fal:rate-limited': Object.freeze({
    message: 'Fal đang giới hạn tốc độ yêu cầu',
    hint: 'Hãy thử lại sau vài giây',
  }),
  'custom-openai:edits-unsupported': Object.freeze({
    message: 'Dịch vụ nguồn không hỗ trợ chỉnh sửa ảnh',
    hint: 'Chuyển sang /v1/images/generations hoặc dùng gateway hỗ trợ chỉnh sửa ảnh',
  }),
});

/**
 * Xác định lỗi có phát sinh ở tầng mạng của fetch hay không (TypeError không có status, bị CORS chặn, v.v.).
 *
 * @param {{ name?: string, message?: string }} error
 * @returns {boolean}
 */
function isNetworkError(error) {
  if (!error) return false;
  if (error.name === 'TypeError') return true;
  const text = typeof error.message === 'string' ? error.message.toLowerCase() : '';
  if (!text) return false;
  return (
    text.includes('fetch') ||
    text.includes('network') ||
    text.includes('networkerror')
  );
}

/**
 * Chuẩn hóa một lỗi bất kỳ thành TranslatedError.
 *
 * Luôn trả về một đối tượng, không ném ngoại lệ. Bên gọi dùng message / hint để hiển thị thông báo
 * và có thể dùng trường raw trong bảng mở rộng "Chi tiết kỹ thuật".
 *
 * @param {string} providerId
 * @param {{
 *   status?: number,
 *   providerCode?: string,
 *   code?: string,
 *   message?: string,
 *   payload?: unknown,
 *   name?: string,
 * } | null | undefined} error
 * @returns {TranslatedError}
 */
export function translateError(providerId, error) {
  const safeProviderId =
    typeof providerId === 'string' && providerId ? providerId : 'unknown';
  const safeError = error || {};
  const raw =
    safeError && Object.prototype.hasOwnProperty.call(safeError, 'payload')
      ? safeError.payload
      : safeError;

  // 1. Ưu tiên AbortError: luôn dùng default:abort để máy trạng thái xử lý nhánh CANCEL.
  if (safeError && safeError.name === 'AbortError') {
    const entry = ERROR_TRANSLATIONS['default:abort'];
    return {
      providerId: safeProviderId,
      message: entry.message,
      ...(entry.hint ? { hint: entry.hint } : null),
      raw,
    };
  }

  const status = typeof safeError.status === 'number' ? safeError.status : undefined;
  // providerCode có thể nằm trong error.providerCode hoặc error.code (proxy phía máy chủ thường dùng trường sau).
  const providerCode =
    typeof safeError.providerCode === 'string' && safeError.providerCode
      ? safeError.providerCode
      : typeof safeError.code === 'string' && safeError.code
        ? safeError.code
        : undefined;

  // 2. Tra bảng theo thứ tự ưu tiên.
  const entry = lookupEntry({
    providerId: safeProviderId,
    status,
    providerCode,
    error: safeError,
  });

  if (entry) {
    return {
      providerId: safeProviderId,
      ...(typeof status === 'number' ? { status } : null),
      ...(providerCode ? { providerCode } : null),
      message: entry.message,
      ...(entry.hint ? { hint: entry.hint } : null),
      raw,
    };
  }

  // 3. Dự phòng: default:unknown — "Tạo thất bại" kèm mã trạng thái nếu có.
  const fallbackMessage =
    typeof status === 'number' ? `Tạo thất bại (HTTP ${status})` : 'Tạo thất bại';
  return {
    providerId: safeProviderId,
    ...(typeof status === 'number' ? { status } : null),
    ...(providerCode ? { providerCode } : null),
    message: fallbackMessage,
    raw,
  };
}

/**
 * Tìm mục phù hợp trong Error_Translation_Table theo thứ tự ưu tiên.
 *
 * Thứ tự:
 *   1) `${providerId}:${status}`
 *   2) `${providerId}:${providerCode}`
 *   3) `default:${status}` (5xx dùng `default:5xx`)
 *   4) `default:network` (không có status và có vẻ là lỗi mạng)
 *
 * Trả về entry nếu tìm thấy; nếu không, trả về null để bên gọi dùng dự phòng default:unknown.
 *
 * @param {{ providerId: string, status?: number, providerCode?: string, error: object }} ctx
 * @returns {TranslationEntry | null}
 */
function lookupEntry({ providerId, status, providerCode, error }) {
  // 1) Khớp chính xác nhà cung cấp + mã trạng thái (5xx dùng nhóm provider:5xx để có thể ghi đè sau này).
  if (typeof status === 'number') {
    const providerStatusKey =
      status >= 500 && status < 600
        ? `${providerId}:5xx`
        : `${providerId}:${status}`;
    if (ERROR_TRANSLATIONS[providerStatusKey]) {
      return ERROR_TRANSLATIONS[providerStatusKey];
    }
  }

  // 2) Khớp nhà cung cấp + providerCode.
  if (providerCode) {
    const providerCodeKey = `${providerId}:${providerCode}`;
    if (ERROR_TRANSLATIONS[providerCodeKey]) {
      return ERROR_TRANSLATIONS[providerCodeKey];
    }
  }

  // 3) Mặc định theo mã trạng thái (gộp 5xx vào default:5xx).
  if (typeof status === 'number') {
    const defaultStatusKey =
      status >= 500 && status < 600 ? 'default:5xx' : `default:${status}`;
    if (ERROR_TRANSLATIONS[defaultStatusKey]) {
      return ERROR_TRANSLATIONS[defaultStatusKey];
    }
  }

  // 4) Lỗi mạng / CORS.
  if (typeof status !== 'number' && isNetworkError(error)) {
    return ERROR_TRANSLATIONS['default:network'];
  }

  return null;
}
