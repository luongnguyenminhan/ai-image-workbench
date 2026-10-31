# Triển khai Docker trong môi trường thực tế

Cấu hình Docker này chạy đầy đủ các dịch vụ, không chỉ là bản demo tĩnh:

- `studio-web`: Nginx phục vụ frontend tĩnh `/studio/` và chuyển tiếp `/studio-api/`, `/api/`, `/login`, `/v1/*`.
- `studio-history`: dịch vụ Node lưu lịch sử và phiên, quản lý thư viện ảnh, phiên canvas hiện tại và tài nguyên đã tạo.
- `studio-data`: Docker volume lưu `records.json`, `session.json` và ảnh đã lưu cục bộ của từng người dùng đăng nhập.

Gateway model không được đóng gói trong image. Dùng `AI_GATEWAY_UPSTREAM` để kết nối API tương thích OpenAI, NewAPI, dịch vụ tương thích Sub2API hoặc gateway tùy chỉnh hiện có.

## 1. Chuẩn bị môi trường

Sao chép tệp môi trường:

```bash
cp .env.example .env
```

Cấu hình tối thiểu cần ba giá trị:

```env
STUDIO_PORT=8080
AI_GATEWAY_UPSTREAM=http://host.docker.internal:8080
VITE_AI_IMAGE_ROUTE=auto
```

`VITE_AI_IMAGE_ROUTE=auto` định tuyến như sau:

```text
Tạo ảnh thông thường       -> /v1/images/generations
Ảnh tham chiếu / Mask      -> /v1/images/edits
Trợ lý prompt              -> /v1/chat/completions
```

Không đổi thành `responses` trừ khi bạn chủ động kiểm thử khả năng tạo ảnh tương thích qua `/v1/responses`.

Nếu gateway tương thích OpenAI đang chạy trên máy chủ tại `127.0.0.1:8080`, có thể dùng luôn giá trị mặc định của Docker:

```env
AI_GATEWAY_UPSTREAM=http://host.docker.internal:8080
STUDIO_PORT=8080
```

Nếu gateway nằm trong container khác, hãy dùng tên dịch vụ của nó trong cùng mạng Docker:

```env
AI_GATEWAY_UPSTREAM=http://gateway:8080
```

Nếu gateway có tên miền từ xa:

```env
AI_GATEWAY_UPSTREAM=https://gateway.example.com
```

Khuyến nghị để trình duyệt chỉ gọi API cùng tên miền Studio, vì vậy giữ các giá trị sau trong `.env`:

```env
VITE_AI_GATEWAY_BASE_URL=
VITE_AI_GATEWAY_MODEL_BASE_URL=
VITE_AI_GATEWAY_LOGIN_URL=/login
VITE_STUDIO_HISTORY_BASE_URL=
VITE_AI_IMAGE_ROUTE=auto
```

Frontend sẽ gọi `/api`, `/login`, `/v1/images/generations`, `/v1/images/edits` và `/v1/chat/completions` trên cùng tên miền Studio; Nginx chuyển tiếp các yêu cầu đến `AI_GATEWAY_UPSTREAM`.

## 2. Khởi động

```bash
docker compose up --build -d
```

Địa chỉ truy cập mặc định trên máy:

```text
http://localhost:8080/studio/
```

Kiểm tra container:

```bash
docker compose ps
docker compose logs -f studio-web
docker compose logs -f studio-history
```

Kiểm tra tình trạng dịch vụ:

```bash
curl -I http://localhost:8080/studio/
curl http://localhost:8080/studio-api/health
curl -s http://localhost:8080/studio/ | grep 'studio-assets'
```

Kết quả mong đợi:

```json
{"ok":true}
```

Để xác nhận tài nguyên tĩnh không bị fallback thành HTML, hãy lấy tên tệp JS/CSS từ lệnh trên rồi kiểm tra:

```bash
curl -I http://localhost:8080/studio/studio-assets/<file>.js
curl -I http://localhost:8080/studio/studio-assets/<file>.css
```

Content-Type đúng lần lượt là `application/javascript` và `text/css`, không phải `text/html`.

## 3. Dữ liệu lưu trữ

Dữ liệu được lưu mặc định trong Docker volume:

```bash
docker volume ls | grep image-sub2api-studio
docker volume inspect image-sub2api-studio_studio-data
```

Cấu trúc dữ liệu gần như sau:

```text
/data/users/<user-hash>/records.json
/data/users/<user-hash>/session.json
/data/users/<user-hash>/jobs.json
/data/users/<user-hash>/assets/<record-id>/*.png
```

`jobs.json` lưu trạng thái tác vụ phía máy chủ; ảnh kết quả nằm trong `assets/`, nhờ vậy có thể khôi phục kết quả của phiên hiện tại sau khi tải lại trang. Cập nhật image hoặc tạo lại container không xóa volume này. Đừng chạy `docker compose down -v` trừ khi bạn muốn xóa lịch sử ảnh, tác vụ và phiên hiện tại.

Hàng đợi mặc định xử lý tuần tự cho mỗi người dùng với `STUDIO_JOB_CONCURRENCY=1`. Sau khi nhóm tài khoản và dịch vụ nguồn hoạt động ổn định, có thể thử tăng lên `2` với lưu lượng thấp. Không tăng cao ngay từ đầu vì có thể làm trầm trọng thêm tình trạng chờ, lỗi hoặc bị tính phí mà không có kết quả.

Sao lưu dữ liệu:

```bash
docker run --rm \
  -v image-sub2api-studio_studio-data:/data:ro \
  -v "$PWD":/backup \
  alpine tar czf /backup/studio-data-backup.tgz -C /data .
```

Khôi phục dữ liệu:

```bash
docker run --rm \
  -v image-sub2api-studio_studio-data:/data \
  -v "$PWD":/backup \
  alpine sh -c 'cd /data && tar xzf /backup/studio-data-backup.tgz'
```

## 4. Cập nhật

```bash
git pull
docker compose build
docker compose up -d
```

Lịch sử ảnh, canvas hiện tại và ảnh đã lưu cục bộ sẽ được giữ nguyên miễn là không xóa volume `studio-data`.

Không dùng gói ZIP để cập nhật frontend trong container Docker. Với Docker, hãy cập nhật kho Git và dựng lại image. Các gói `ai-image-workbench-core-update-*.zip` và `ai-image-workbench-service-update-*.zip` chỉ dùng cho cách triển khai VPS truyền thống. Các tên cũ `image-sub2api-studio-core-update-*.zip` và `image-sub2api-studio-service-update-*.zip` vẫn được tạo để tương thích.

## 5. Proxy Nginx bên ngoài trên VPS

Nếu dùng tên miền con riêng như `studio.example.com`, nên cấu hình Nginx bên ngoài chuyển tiếp toàn bộ tên miền đến Nginx trong Docker:

```nginx
server {
    listen 80;
    server_name studio.example.com;

    client_max_body_size 120m;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_read_timeout 900s;
        proxy_send_timeout 900s;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Nếu Docker ánh xạ tới cổng `8080` trên máy chủ nhưng bạn chỉ có thể gắn ứng dụng dưới `/studio/` của trang hiện tại, cấu hình Nginx bên ngoài như sau:

```nginx
location /studio/ {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location /studio-api/ {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    client_max_body_size 120m;
    proxy_buffering off;
    proxy_cache off;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location /api/ {
    proxy_pass http://127.0.0.1:8080;
}

location /login {
    proxy_pass http://127.0.0.1:8080;
}

location /v1/ {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_buffering off;
    proxy_read_timeout 900s;
    proxy_send_timeout 900s;
}
```

Nếu Nginx bên ngoài và Nginx trong Docker chạy trên cùng máy, trình duyệt vẫn chỉ thấy một tên miền; đăng nhập, gọi model, lịch sử ảnh và phiên hiện tại đều dùng đường dẫn cùng nguồn.

Sau khi sửa Nginx bên ngoài trên VPS, hãy kiểm tra:

```bash
sudo nginx -t
sudo systemctl reload nginx

curl -I https://studio.example.com/studio/
curl https://studio.example.com/studio-api/health
curl -s https://studio.example.com/studio/ | grep 'studio-assets'
```

## 6. Bảo vệ thư viện tư liệu

Gói mã nguồn mở mặc định đặt các tệp JSON cơ bản trong image và mount `./public`, phù hợp cho bản khởi đầu.

Để bảo vệ prompt và tư liệu:

```env
VITE_STUDIO_LIBRARY_AUTH_REQUIRED=true
STUDIO_LIBRARY_DIR=/srv/image-sub2api-studio-library
```

Sau đó đặt các tệp thư viện tại:

```text
/srv/image-sub2api-studio-library/cases.json
/srv/image-sub2api-studio-library/inspirations.json
/srv/image-sub2api-studio-library/images/...
```

Sau khi đăng nhập, frontend đọc dữ liệu qua `/studio-api/library` và `/studio-api/library-assets/...`, tránh để lộ trực tiếp `/studio/cases.json` và `/studio/images/`.

## 7. Câu hỏi thường gặp

### `/studio-api/health` hoạt động nhưng lịch sử trống

Dịch vụ lịch sử cần Bearer token sau khi người dùng đăng nhập. Khi chưa đăng nhập, ứng dụng chỉ dùng bộ nhớ đệm cục bộ của trình duyệt.

### Ảnh đã tạo biến mất sau khi tải lại trang

Kiểm tra `studio-history` đang chạy bình thường và bạn chưa chạy lệnh:

```bash
docker compose down -v
```

### JS/CSS trả về `text/html`

Điều này có nghĩa yêu cầu tài nguyên tĩnh không trỏ đến tệp thật. Hãy kiểm tra:

```bash
curl -I http://localhost:8080/studio/studio-assets/<file>.js
```

Content-Type đúng phải là `application/javascript`, không phải `text/html`.

### Container không kết nối được gateway trên máy chủ

Trên VPS Linux, cấu hình Compose cần có:

```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

Dự án đã cấu hình sẵn mục này. Nếu vẫn không kết nối được, hãy đặt `AI_GATEWAY_UPSTREAM` thành IP nội bộ hoặc tên miền của gateway. Có thể tiếp tục dùng `SUB2API_UPSTREAM` làm bí danh tương thích.
