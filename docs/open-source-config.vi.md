# Hướng dẫn cấu hình bản mã nguồn mở

AI Image Workbench có thể được tự lưu trữ như một không gian sáng tạo hình ảnh AI. Theo mặc định, ứng dụng không có API key thật, thư viện ảnh riêng đầy đủ hay backend gateway model.

Bạn cần kết nối ứng dụng với tài khoản API chính thức, gateway tương thích OpenAI, NewAPI, bản triển khai tương thích Sub2API hoặc dịch vụ tạo ảnh tùy chỉnh hiện có.

## Chạy cục bộ

```bash
npm install
cp .env.example .env.local
npm run dev:studio
```

Nếu cần chuyển tiếp yêu cầu cục bộ đến gateway trên đám mây:

```env
VITE_DEV_AI_GATEWAY_PROXY_TARGET=https://gateway.example.com
```

## Cấu hình tối thiểu

```env
VITE_AI_GATEWAY_BASE_URL=https://gateway.example.com
VITE_AI_GATEWAY_MODEL_BASE_URL=https://gateway.example.com
VITE_AI_IMAGE_ROUTE=auto
VITE_AI_RESPONSES_MODEL=gpt-5.5
VITE_AI_GATEWAY_LOGIN_URL=https://studio.example.com/login
VITE_STUDIO_HISTORY_BASE_URL=https://studio.example.com
VITE_STUDIO_BACK_URL=/
VITE_STUDIO_LIBRARY_AUTH_REQUIRED=false
```

Ý nghĩa các trường:

- `VITE_AI_GATEWAY_BASE_URL`: tên miền gốc của API quản lý tài khoản, hồ sơ và danh sách key; nếu gateway cung cấp các API này, frontend tự thêm `/api/v1`.
- `VITE_AI_GATEWAY_MODEL_BASE_URL`: tên miền gốc của API model và tạo ảnh; frontend tự thêm `/v1`.
- `VITE_AI_IMAGE_ROUTE`: `auto` là chế độ khuyến nghị; tạo ảnh thông thường dùng `/v1/images/generations`, ảnh tham chiếu và Mask dùng `/v1/images/edits`. Chỉ đổi thành `responses` nếu dịch vụ nguồn hỗ trợ rõ ràng.
- `VITE_AI_GATEWAY_LOGIN_URL`: địa chỉ trang đăng nhập; sau khi đăng nhập, người dùng cần được chuyển lại Studio.
- `VITE_STUDIO_HISTORY_BASE_URL`: tên miền của dịch vụ lịch sử ảnh; mặc định gọi `/studio-api` cùng tên miền.
- `VITE_STUDIO_BACK_URL`: liên kết quay lại ở góc trên bên trái của không gian làm việc.
- `VITE_STUDIO_LIBRARY_AUTH_REQUIRED`: có yêu cầu đăng nhập trước khi tải thư viện tư liệu hay không. Bản mã nguồn mở mặc định là `false`; trong môi trường thực tế có thể bật `true` sau khi chuyển thư viện sang `/studio-api/library`.

Các biến cũ `VITE_SUB2API_*` vẫn được giữ làm bí danh tương thích; VPS hiện có không cần đổi tên biến ngay để nâng cấp.

## Chế độ lưu dữ liệu

Dùng chế độ không gian cục bộ khi chạy Docker độc lập hoặc thử nghiệm một người dùng:

```env
STUDIO_AUTH_MODE=local
STUDIO_DATA_DIR=/var/lib/image-sub2api-studio
STUDIO_HISTORY_HOST=127.0.0.1
STUDIO_HISTORY_PORT=8787
STUDIO_ALLOWED_ORIGINS=https://studio.example.com
```

Dùng chế độ tài khoản gateway khi kết nối với hệ thống tài khoản hiện có:

```env
STUDIO_AUTH_MODE=gateway
AI_GATEWAY_BASE_URL=http://127.0.0.1:8080
STUDIO_DATA_DIR=/var/lib/image-sub2api-studio
STUDIO_LIBRARY_DIR=/var/lib/image-sub2api-studio/library
STUDIO_LIBRARY_ASSET_DIR=/var/lib/image-sub2api-studio/library/images
```

Dịch vụ lưu lịch sử ảnh, phiên canvas hiện tại, tác vụ trong hàng đợi và ảnh đã tạo vào `STUDIO_DATA_DIR`. API key trong lúc chạy không được ghi vào `records.json`, `session.json` hoặc `jobs.json`.

## Nội dung có thể thay thế

- `src/studio.jsx`: nội dung giao diện, model mặc định, thông số mặc định và cách hiển thị mẫu.
- `src/studio.css`: kiểu hiển thị của ứng dụng.
- `public/cases.json`: mẫu khởi đầu gọn nhẹ; có thể thay bằng danh mục mẫu riêng khi triển khai thực tế.
- `public/inspirations.json`: nơi bổ sung ý tưởng.
- `docs/screenshots/`: ảnh chụp dùng trong README.

## Tạo bản dựng triển khai

```bash
npm run build
```

Triển khai tại `/studio/`:

```bash
STUDIO_BASE_PATH=/studio/ npm run build
```

Bản dựng nằm trong `dist/`. Các thư mục `dist/`, `release/`, `output/`, `.tmp/` chứa sản phẩm cục bộ hoặc tệp trung gian và đã được loại trừ trong `.gitignore`.

## Giấy phép

Prompt mẫu được lấy từ cộng đồng và tuân theo giấy phép CC BY 4.0; hãy ghi nhận tác giả hoặc nguồn khi sử dụng hay chỉnh sửa. Mã nguồn dự án được phát hành theo giấy phép trong `LICENSE` ở thư mục gốc.
