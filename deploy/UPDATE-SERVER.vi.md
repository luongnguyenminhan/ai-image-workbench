# Hướng dẫn cập nhật bằng gói zip cũ

Tài liệu này chỉ dành cho tình huống tạm thời khi không thể lấy mã trực tiếp từ GitHub. Với triển khai VPS lâu dài, hãy ưu tiên dùng:

```text
docs/VPS-GIT-SYNC.vi.md
deploy/sync-from-git.sh
```

Cách đồng bộ Git sẽ build trên máy chủ, thay đúng thư mục tĩnh của Nginx, cập nhật dịch vụ lịch sử/phiên và giữ nguyên thư mục dữ liệu bền vững `/var/lib/image-sub2api-studio`.

## Không tải lại thư viện ảnh và dữ liệu lịch sử

Khi cập nhật thường ngày, chỉ cần thay sản phẩm build frontend và tập lệnh dịch vụ. Không xóa hoặc ghi đè các thư mục sau:

```text
/var/lib/image-sub2api-studio/
/var/lib/image-sub2api-studio/library/
```

Các thư mục này lưu lịch sử ảnh, phiên hiện tại, tác vụ hàng đợi, ảnh đã tạo và thư viện tư liệu được bảo vệ. Tên dự án đang được đổi dần thành AI Image Workbench, nhưng đường dẫn dữ liệu của môi trường thực tế vẫn giữ tên cũ để tránh mất dữ liệu lịch sử sau khi nâng cấp.

## Quy ước luồng hiện tại

```text
Tạo ảnh thông thường  -> POST /v1/images/generations
Ảnh tham chiếu / Mask -> POST /v1/images/edits
Trợ lý prompt         -> POST /v1/chat/completions
/v1/responses         -> Chỉ dùng khi chủ động kiểm tra tương thích
```

Chỉ khi bảng điều khiển gateway hiển thị cả đường dẫn nhận vào và upstream của yêu cầu tạo ảnh từ văn bản là `/v1/images/generations` thì luồng mô hình ảnh chính thức mới đang hoạt động. Không đổi luồng tạo ảnh thông thường về `/v1/responses` theo mặc định.

## Tạo gói zip

Build phiên bản dùng đường dẫn con `/studio/`:

```powershell
$env:STUDIO_BASE_PATH="/studio/"
npm run build
Remove-Item Env:\STUDIO_BASE_PATH
```

Tạo gói frontend và gói dịch vụ:

```bash
npm run package:release
```

Tập lệnh sẽ tạo:

- `ai-image-workbench-core-update-*.zip`: thay nội dung thư mục tĩnh.
- `ai-image-workbench-service-update-*.zip`: thay nội dung thư mục chạy dịch vụ.
- `image-sub2api-studio-core-update-*.zip` và `image-sub2api-studio-service-update-*.zip`: bản sao tương thích với tên cũ để các tập lệnh hiện có tiếp tục sử dụng được.

## Tải lên máy chủ

```bash
scp release/ai-image-workbench-core-update-YYYYMMDD-HHMMSS.zip user@YOUR_SERVER:/home/user/
scp release/ai-image-workbench-service-update-YYYYMMDD-HHMMSS.zip user@YOUR_SERVER:/home/user/
```

## Thay nội dung thư mục tĩnh

Thư mục tĩnh Nginx hiện tại của Oh Laoo Studio trên máy chủ là:

```text
/var/www/ohlaoo-studio
```

Vì vậy, hãy giải nén vào:

```bash
sudo mkdir -p /var/www/ohlaoo-studio
sudo unzip -o /home/user/ai-image-workbench-core-update-YYYYMMDD-HHMMSS.zip -d /var/www/ohlaoo-studio

sudo find /var/www/ohlaoo-studio -type d -exec chmod 755 {} \;
sudo find /var/www/ohlaoo-studio -type f -exec chmod 644 {} \;
```

Không giải nén vào `/var/www/image-sub2api-studio`, trừ khi bạn cũng đổi `alias` của Nginx để đọc thư mục đó.

## Thay nội dung thư mục dịch vụ

Nếu bản cập nhật này có thay đổi về lưu trữ phía máy chủ, hàng đợi, API thư viện ảnh hoặc API thư viện tư liệu, hãy cập nhật gói dịch vụ:

```bash
sudo mkdir -p /opt/image-sub2api-studio
sudo unzip -o /home/user/ai-image-workbench-service-update-YYYYMMDD-HHMMSS.zip -d /opt/image-sub2api-studio

cd /opt/image-sub2api-studio
sudo npm ci --omit=dev
sudo systemctl restart image-sub2api-studio-history
curl -s http://127.0.0.1:8787/studio-api/health
```

Nếu dịch vụ systemd chưa tồn tại:

```bash
sudo cp /opt/image-sub2api-studio/deploy/image-sub2api-studio-history.service \
  /etc/systemd/system/image-sub2api-studio-history.service
sudo systemctl daemon-reload
sudo systemctl enable --now image-sub2api-studio-history
```

## Xác minh

Trước tiên, xem mã hash JS/CSS mà trang trên máy chủ đang tham chiếu:

```bash
curl -s https://studio.ohlaoo.com/studio/ | grep 'studio-assets'
```

Tiếp theo, kiểm tra các tài nguyên này không bị trả về trang HTML dự phòng:

```bash
curl -I https://studio.ohlaoo.com/studio/
curl -I https://studio.ohlaoo.com/studio/studio-assets/<actual-js-file>.js
curl -I https://studio.ohlaoo.com/studio/studio-assets/<actual-css-file>.css
curl -I https://studio.ohlaoo.com/studio-api/health
```

Kết quả đúng phải là:

- Trang Studio trả về `text/html`.
- JS trả về `application/javascript`.
- CSS trả về `text/css`.
- `/studio-api/health` trả về JSON.

Nếu JS/CSS trả về `text/html` hoặc 404, thư mục tĩnh, base path hoặc alias Nginx đang sai và trang có thể trắng.

## Kiểm tra thư viện tư liệu

Nếu Quảng trường cảm hứng trống, trước tiên hãy kiểm tra thư viện tư liệu được bảo vệ:

```bash
for f in /var/lib/image-sub2api-studio/library/cases.json \
  /var/lib/image-sub2api-studio/library/inspirations.json \
  /var/lib/image-sub2api-studio/library/style-library.json; do
  [ -f "$f" ] || continue
  echo "== $f =="
  sudo node -e "const fs=require('fs'); const j=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); for (const [k,v] of Object.entries(j)) if (Array.isArray(v)) console.log(k, v.length);" "$f"
done

sudo find /var/lib/image-sub2api-studio/library/images \
  -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.webp' \) | wc -l
```

Không thể ẩn hoàn toàn ảnh, JSON và prompt đã tải về trình duyệt chỉ bằng mã frontend. Để bảo vệ tư liệu và prompt trong môi trường thực tế, hãy để máy chủ đọc `/var/lib/image-sub2api-studio/library`, yêu cầu đăng nhập khi frontend truy cập `/studio-api/library`, đồng thời dùng Nginx chặn truy cập công khai vào `/studio/cases.json`, `/studio/inspirations.json` và `/studio/images/`.
