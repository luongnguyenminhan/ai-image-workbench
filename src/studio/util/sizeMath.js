// src/studio/util/sizeMath.js
//
// Công cụ tính kích thước: chuyển Size_Input_Mode `auto+ratio+custom` thành chuỗi
// `WIDTHxHEIGHT` và kiểm tra chiều rộng, chiều cao do người dùng nhập ở chế độ tùy chỉnh.
//
// Cơ sở thiết kế:
//   - requirements.md, yêu cầu 16.5 / 16.6 / 16.7 (Size_Input_Mode và Custom_Size_Constraints)
//   - design.md, mục "Size Input Mode" (các hàm `tierRatioToSize` / `validateCustomSize`)
//   - tasks.md, tác vụ 1.3
//
// Nơi sử dụng:
//   - `src/studio/state/sizeInput.js` gọi `tierRatioToSize` để chuyển trạng thái
//     `subMode='ratio'` thành `resolvedSize`;
//   - Chế độ tùy chỉnh trong CreationDesk gọi `validateCustomSize` sau mỗi lần nhập,
//     hiển thị mảng lỗi bên dưới trường và khóa nút tạo khi `errors.length > 0`.
//
// Điểm thiết kế:
//   - `TIER_LONG_SIDE` ánh xạ tên cấp độ dễ đọc sang số pixel của cạnh dài:
//     '1K' = 1024、'2K' = 2048、'4K' = 4096。
//   - `tierRatioToSize` lấy cạnh lớn hơn của tỷ lệ làm cạnh dài, đổi cạnh ngắn theo tỷ lệ
//     rồi làm tròn về bội số của 16 (`Math.round(... / 16) * 16`).
//   - `validateCustomSize` thu thập tất cả lỗi thay vì dừng ở lỗi đầu tiên,
//     để giao diện có thể hiển thị cùng lúc mọi thông báo; `error.field` luôn là
//     'width' | 'height' | 'size' | 'ratio' | 'pixels' và giao diện dùng trường này để gắn lỗi.
//   - Thông báo lỗi được viết bằng tiếng Việt, thống nhất với các bảng điều khiển khác.

/**
 * Số pixel cạnh dài tương ứng với từng cấp độ.
 * Khi đổi tỷ lệ thành kích thước, cạnh dài giữ nguyên giá trị này; cạnh ngắn được đổi theo tỷ lệ
 * rồi làm tròn về bội số của 16.
 *
 * @type {Readonly<Record<'1K'|'2K'|'4K', number>>}
 */
export const TIER_LONG_SIDE = Object.freeze({
  '1K': 1024,
  '2K': 2048,
  '4K': 4096,
});

/**
 * Các ngưỡng cố định của Custom_Size_Constraints (khớp với cách triển khai
 * validateCustomSize trong design.md).
 *
 *   - `MULTIPLE_OF`: chiều rộng và chiều cao phải là bội số nguyên của 16;
 *   - `MAX_SIDE`: cạnh dài nhất không được vượt quá 3840px;
 *   - `MAX_RATIO`: tỷ lệ cạnh dài/cạnh ngắn không được vượt quá 3:1;
 *   - `MIN_PIXELS` / `MAX_PIXELS`: tổng số pixel phải nằm trong đoạn [655 360, 8 294 400].
 */
export const CUSTOM_SIZE_CONSTRAINTS = Object.freeze({
  MULTIPLE_OF: 16,
  MAX_SIDE: 3840,
  MAX_RATIO: 3,
  MIN_PIXELS: 655360,
  MAX_PIXELS: 8294400,
});

/**
 * Chuyển (tier, ratio) thành chuỗi `WIDTHxHEIGHT`.
 *
 * Cách tính:
 *   1) Phân tích ratio thành `[w, h]` (ví dụ `'16:9'` → `[16, 9]`);
 *   2) Lấy số pixel cạnh dài `long` của cấp độ đó;
 *   3) Gán `long` cho cạnh ứng với thành phần tỷ lệ lớn hơn; đổi cạnh ngắn theo `long * (ngắn/dài)` rồi làm tròn về bội số của 16;
 *   4) Trả về `${width}x${height}`.
 *
 * Hàm này không kiểm tra phạm vi. Bên gọi phải bảo đảm ratio có trong danh sách ratios của
 * Capability_Descriptor và tier là một khóa của TIER_LONG_SIDE (nếu không, `long` sẽ là
 * `undefined` và kết quả tính toán là NaN).
 *
 * @param {'1K'|'2K'|'4K'} tier
 * @param {string} ratio  Dạng `'1:1'` / `'16:9'`, phải theo định dạng `W:H`.
 * @returns {string}      Dạng `'1024x576'`.
 */
export function tierRatioToSize(tier, ratio) {
  const [w, h] = String(ratio).split(':').map(Number);
  const long = TIER_LONG_SIDE[tier];
  if (w >= h) {
    const width = long;
    const height = Math.round((long * (h / w)) / 16) * 16;
    return `${width}x${height}`;
  }
  const height = long;
  const width = Math.round((long * (w / h)) / 16) * 16;
  return `${width}x${height}`;
}

/**
 * Kiểm tra chiều rộng và chiều cao người dùng nhập ở chế độ tùy chỉnh, trả về mọi lỗi
 * vi phạm Custom_Size_Constraints.
 *
 * Hàm **không dừng ở lỗi đầu tiên** mà thu thập tất cả vi phạm để giao diện có thể đánh dấu
 * nhiều trường cùng lúc. `error.field` luôn nhận một trong các giá trị sau:
 *
 *   - `'width'`  — chiều rộng không phải bội số của 16;
 *   - `'height'` — chiều cao không phải bội số của 16;
 *   - `'size'`   — cạnh dài nhất vượt quá 3840px;
 *   - `'ratio'`  — tỷ lệ cạnh dài/cạnh ngắn vượt quá 3:1;
 *   - `'pixels'` — tổng số pixel nằm ngoài giới hạn.
 *
 * @param {{ width: number, height: number }} input
 * @returns {Array<{ field: 'width'|'height'|'size'|'ratio'|'pixels', message: string }>}
 */
export function validateCustomSize({ width, height }) {
  /** @type {Array<{ field: 'width'|'height'|'size'|'ratio'|'pixels', message: string }>} */
  const errors = [];
  if (width % CUSTOM_SIZE_CONSTRAINTS.MULTIPLE_OF !== 0) {
    errors.push({ field: 'width', message: 'Chiều rộng phải là bội số của 16' });
  }
  if (height % CUSTOM_SIZE_CONSTRAINTS.MULTIPLE_OF !== 0) {
    errors.push({ field: 'height', message: 'Chiều cao phải là bội số của 16' });
  }
  if (Math.max(width, height) > CUSTOM_SIZE_CONSTRAINTS.MAX_SIDE) {
    errors.push({ field: 'size', message: 'Cạnh dài nhất không được vượt quá 3840px' });
  }
  const ratio = Math.max(width, height) / Math.min(width, height);
  if (ratio > CUSTOM_SIZE_CONSTRAINTS.MAX_RATIO) {
    errors.push({ field: 'ratio', message: 'Tỷ lệ cạnh dài/cạnh ngắn không được vượt quá 3:1' });
  }
  const pixels = width * height;
  if (
    pixels < CUSTOM_SIZE_CONSTRAINTS.MIN_PIXELS ||
    pixels > CUSTOM_SIZE_CONSTRAINTS.MAX_PIXELS
  ) {
    errors.push({
      field: 'pixels',
      message: 'Tổng số pixel phải nằm trong khoảng từ 655 360 đến 8 294 400',
    });
  }
  return errors;
}
