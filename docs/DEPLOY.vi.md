# Hướng dẫn triển khai

Hướng dẫn này dành cho bản tự lưu trữ của AI Image Workbench. Kho mã cung cấp ba thành phần:

- Không gian sáng tạo tĩnh: `studio.html` và tài nguyên frontend.
- Kết nối gateway tương thích OpenAI: tạo ảnh, chỉnh sửa ảnh, trợ lý prompt và tùy chọn đăng nhập, hồ sơ người dùng, danh sách key và model.
- Dịch vụ lịch sử/phiên: lưu lịch sử ảnh, phiên canvas hiện tại, tác vụ trong hàng đợi và tài nguyên đã tạo.

Với bản 0.9 beta, nên bật dịch vụ Node lưu lịch sử/phiên. Dịch vụ không chỉ lưu lịch sử ảnh mà còn lưu phiên canvas hiện tại qua `/studio-api/session`. Trong môi trường thực tế, hãy đặt `STUDIO_DATA_DIR` trỏ đến thư mục lưu trữ bền vững, ví dụ `/var/lib/image-sub2api-studio`. Nếu thư mục này nằm trong vùng tạm hoặc bên trong container, việc khôi phục sau khi tải lại trang, trên trình duyệt khác và lịch sử người dùng sẽ bị mất khi dựng lại.

## 1. Chuẩn bị môi trường

Cần có:

- Node.js phiên bản 20 trở lên.
- API tạo ảnh tương thích OpenAI có thể truy cập, tài khoản API chính thức, NewAPI, bản triển khai tương thích Sub2API hoặc gateway tùy chỉnh khác.
- Tùy chọn: Nginx, Docker hoặc dịch vụ lưu trữ website tĩnh khác.

Cài đặt các gói phụ thuộc:

```bash
npm install
```

Sao chép tệp cấu hình:

```bash
cp .env.example .env.local
```

Trên Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

## 2. Chạy cục bộ

```bash
npm run dev:studio
```

Sau khi Vite hiển thị địa chỉ cục bộ, hãy mở `/studio.html`.

Cấu hình `.env.local` tối thiểu:

```env
VITE_AI_GATEWAY_BASE_URL=https://gateway.example.com
VITE_AI_GATEWAY_MODEL_BASE_URL=https://gateway.example.com
VITE_AI_IMAGE_ROUTE=auto
VITE_AI_RESPONSES_MODEL=gpt-5.5
VITE_AI_GATEWAY_LOGIN_URL=https://studio.example.com/login
VITE_STUDIO_HISTORY_BASE_URL=https://studio.example.com
VITE_STUDIO_BACK_URL=/
VITE_STUDIO_LIBRARY_AUTH_REQUIRED=false
VITE_DEV_AI_GATEWAY_PROXY_TARGET=https://gateway.example.com
```

`VITE_DEV_AI_GATEWAY_PROXY_TARGET` chỉ dùng khi phát triển cục bộ với Vite; bản dựng triển khai không cần đặt biến này. Biến này chuyển tiếp `/v1`, `/api`, `/login` từ máy cục bộ đến gateway, thuận tiện để kiểm thử với dịch vụ nguồn thật.

Các biến môi trường cũ `VITE_SUB2API_*` vẫn được giữ làm bí danh tương thích. Bản triển khai mới nên ưu tiên `VITE_AI_*`.

## 3. Tạo bản dựng triển khai

Triển khai tại đường dẫn gốc của website:

```bash
npm run build
```

Triển khai tại đường dẫn con `/studio/`:

```bash
STUDIO_BASE_PATH=/studio/ npm run build
```

Windows PowerShell：

```powershell
$env:STUDIO_BASE_PATH="/studio/"
npm run build
Remove-Item Env:\STUDIO_BASE_PATH
```

Bản dựng nằm trong `dist/`; không đưa thư mục này lên GitHub.

## 4. VPS và Nginx

Thư mục đề xuất:

```text
/var/www/ai-image-workbench/       # Ví dụ thư mục tệp tĩnh
/opt/image-sub2api-studio/         # Dịch vụ Node lưu lịch sử/phiên
/var/lib/image-sub2api-studio/     # Lịch sử ảnh, phiên hiện tại, hàng đợi và thư viện tư liệu được bảo vệ
```

Nếu Nginx đang đọc `/var/www/ohlaoo-studio`, hãy tải tệp tĩnh vào thư mục đó. Tên thư mục không quan trọng, miễn khớp với `alias` trong Nginx.

Tạo bản dựng và tải lên máy chủ:

```bash
npm run build
rsync -av --delete dist/ user@server:/var/www/ai-image-workbench/
rsync -av package.json package-lock.json scripts/ deploy/ user@server:/opt/image-sub2api-studio/
```

Cài đặt các gói phụ thuộc cho dịch vụ lịch sử/phiên trên máy chủ:

```bash
sudo mkdir -p /opt/image-sub2api-studio/scripts /var/www/ai-image-workbench /var/lib/image-sub2api-studio
sudo chown -R www-data:www-data /var/lib/image-sub2api-studio
cd /opt/image-sub2api-studio
npm ci --omit=dev
```

Kiểm tra cấu hình `deploy/image-sub2api-studio-history.service`:

```ini
Environment=STUDIO_AUTH_MODE=gateway
Environment=AI_GATEWAY_BASE_URL=http://127.0.0.1:8080
Environment=STUDIO_DATA_DIR=/var/lib/image-sub2api-studio
Environment=STUDIO_ALLOWED_ORIGINS=https://studio.example.com
```

Nếu muốn dùng không gian cục bộ độc lập, không kết nối hệ thống tài khoản của dịch vụ nguồn:

```ini
Environment=STUDIO_AUTH_MODE=local
Environment=STUDIO_DATA_DIR=/var/lib/image-sub2api-studio
Environment=STUDIO_ALLOWED_ORIGINS=https://studio.example.com
```

Cài đặt dịch vụ systemd:

```bash
sudo cp /opt/image-sub2api-studio/deploy/image-sub2api-studio-history.service /etc/systemd/system/image-sub2api-studio-history.service
sudo systemctl daemon-reload
sudo systemctl enable --now image-sub2api-studio-history
curl http://127.0.0.1:8787/studio-api/health
```

Gộp cấu hình `deploy/nginx-sub2api-studio.conf` vào server block của Nginx và thay các giá trị sau:

- `studio.example.com`: tên miền Studio.
- `gateway.example.com`: tên miền gateway tương thích OpenAI.
- `127.0.0.1:8080`: địa chỉ upstream của gateway.
- `/var/www/ai-image-workbench/`: thư mục tĩnh mẫu; giá trị thực tế phải khớp với `alias` trong Nginx.

Kiểm tra cấu hình rồi tải lại dịch vụ:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 5. Docker

Bản Docker gồm hai container: `studio-web` và `studio-history`. Lịch sử ảnh, phiên canvas hiện tại, tác vụ hàng đợi và ảnh đã lưu cục bộ được giữ trong volume `studio-data`.

```bash
cp .env.example .env
docker compose up --build -d
```

Địa chỉ truy cập mặc định:

```text
http://localhost:8080/studio/
```

Nếu gateway tương thích OpenAI đang chạy trên máy chủ tại `127.0.0.1:8080`, giữ nguyên:

```env
AI_GATEWAY_UPSTREAM=http://host.docker.internal:8080
```

Xem thêm [Hướng dẫn triển khai Docker](./DOCKER.vi.md).

## 6. Kiểm tra tương thích tùy chọn

Nếu bạn dùng gateway tương thích OpenAI có tài khoản người dùng, có thể chạy tập lệnh kiểm tra hợp đồng API:

```bash
AI_GATEWAY_BASE_URL=https://gateway.example.com \
AI_GATEWAY_EMAIL=you@example.com \
AI_GATEWAY_PASSWORD='your-password' \
npm run check:gateway
```

Windows PowerShell：

```powershell
$env:AI_GATEWAY_BASE_URL="https://gateway.example.com"
$env:AI_GATEWAY_EMAIL="you@example.com"
$env:AI_GATEWAY_PASSWORD="your-password"
npm run check:gateway
Remove-Item Env:\AI_GATEWAY_BASE_URL,Env:\AI_GATEWAY_EMAIL,Env:\AI_GATEWAY_PASSWORD
```

Kiểm tra này chỉ xác minh đăng nhập, hồ sơ người dùng và danh sách khóa API, không tạo ảnh tính phí. Các biến `SUB2API_*` cũ và lệnh `npm run check:sub2api` vẫn được giữ làm bí danh tương thích.

## 7. Kiểm tra luồng tạo ảnh

Luồng khuyến nghị cho bản beta 0.9:

```text
Tạo ảnh từ văn bản: POST /v1/images/generations, dùng các mô hình ảnh như gpt-image-2
Ảnh tham chiếu/Mask: POST /v1/images/edits
Trò chuyện với trợ lý: POST /v1/chat/completions
```

Nếu bảng điều khiển gateway hiển thị cả đường dẫn nhận vào và upstream của yêu cầu tạo ảnh từ văn bản là `/v1/images/generations`, luồng tạo ảnh chính thức đang hoạt động. `/v1/responses` chỉ dành cho trợ lý prompt hoặc kiểm tra tương thích khi được bật rõ ràng.

## 8. Thư viện tư liệu và hạn chế thu thập tự động

Không thể ẩn hoàn toàn ảnh, JSON và prompt đã được tải về trình duyệt chỉ bằng mã frontend. Khi triển khai thực tế, nên:

- Không đặt toàn bộ thư viện ảnh và prompt trực tiếp trong thư mục tĩnh.
- Trả tư liệu qua `/studio-api/library` dựa trên trạng thái đăng nhập.
- Cấu hình Nginx trả về 404 hoặc yêu cầu xác thực với `/studio/images/`, `/studio/cases.json` và `/studio/inspirations.json`.
- Thêm `X-Robots-Tag: noindex, nofollow, noarchive` để hạn chế công cụ tìm kiếm lập chỉ mục.
- Nếu bật thư viện tư liệu được bảo vệ, đặt `VITE_STUDIO_LIBRARY_AUTH_REQUIRED=true` trước khi build và xác nhận `/studio-api/library` trả về dữ liệu.

Tệp `deploy/nginx-sub2api-studio.conf` trong kho đã có ví dụ bảo vệ cơ bản.

## 9. Kiểm tra trước khi phát hành

```bash
npm run build
git diff --check
git status --short --ignored
```

Không đưa các thư mục sau vào commit:

```text
node_modules/
dist/
release/
output/
tmp/
.tmp/
data/images/
```
