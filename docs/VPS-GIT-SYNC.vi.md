# Triển khai bằng cách đồng bộ trực tiếp kho Git trên VPS

Tài liệu này hướng dẫn chuyển cách cập nhật VPS từ “đóng gói zip ở máy cá nhân rồi tải lên” sang “đồng bộ kho Git trực tiếp trên máy chủ”. Mục tiêu là giữ kho mã và VPS luôn đồng bộ:

- Kho Git là nguồn mã duy nhất.
- Mỗi lần cập nhật, VPS lấy nhánh được chỉ định từ GitHub.
- VPS tự tạo `dist/`, sau đó thay nội dung thư mục tĩnh của Nginx.
- Dịch vụ Node lưu lịch sử/phiên cũng được cập nhật từ cùng kho mã.
- `/var/lib/image-sub2api-studio` là thư mục dữ liệu bền vững của môi trường thực tế và không bị Git ghi đè.

> Lưu ý: tên dự án đang được đổi dần thành AI Image Workbench, nhưng thư mục dữ liệu mặc định vẫn là `/var/lib/image-sub2api-studio`. Cách này tránh làm lịch sử ảnh, phiên hiện tại, tác vụ hàng đợi, ảnh đã tạo và thư viện tư liệu được bảo vệ có vẻ “biến mất” sau khi nâng cấp.

## Đường dẫn hiện dùng trên máy chủ

Nên giữ nguyên các đường dẫn sau trên máy chủ:

```text
/opt/ai-image-workbench-repo/    # Bản checkout của kho Git
/var/www/ohlaoo-studio/          # Thư mục tĩnh Nginx thực sự đọc
/opt/image-sub2api-studio/       # Thư mục chạy dịch vụ Node lưu lịch sử/phiên
/var/lib/image-sub2api-studio/   # Lịch sử ảnh, phiên hiện tại, tác vụ hàng đợi, thư viện tư liệu được bảo vệ
```

Không giải nén gói tĩnh vào `/var/www/image-sub2api-studio`, trừ khi bạn cũng đổi Nginx để đọc thư mục đó.

## Thiết lập lần đầu

Cài đặt các gói phụ thuộc cơ bản:

```bash
sudo apt-get update
sudo apt-get install -y git nodejs npm
```

Tải kho mã về máy chủ:

```bash
sudo git clone https://github.com/margetrp-hub/ai-image-workbench.git \
  /opt/ai-image-workbench-repo
```

Chạy lệnh triển khai đồng bộ:

```bash
cd /opt/ai-image-workbench-repo

sudo BRANCH=main \
  REPO_DIR=/opt/ai-image-workbench-repo \
  STATIC_DIR=/var/www/ohlaoo-studio \
  SERVICE_DIR=/opt/image-sub2api-studio \
  DATA_DIR=/var/lib/image-sub2api-studio \
  BASE_PATH=/studio/ \
  PUBLIC_STUDIO_URL=https://studio.ohlaoo.com/studio/ \
  REQUIRE_LIBRARY=1 \
  bash deploy/sync-from-git.sh
```

`REQUIRE_LIBRARY=1` yêu cầu phải có thư viện tư liệu được bảo vệ. Thư viện riêng trên máy chủ ít nhất cần có:

```text
/var/lib/image-sub2api-studio/library/cases.json
/var/lib/image-sub2api-studio/library/inspirations.json
/var/lib/image-sub2api-studio/library/style-library.json
/var/lib/image-sub2api-studio/library/images/
```

Nếu bước này báo thư viện chưa đầy đủ, hãy chuyển thư viện cũ trước; đừng tắt bước xác minh để đưa bản triển khai lên máy chủ.

## Cập nhật thường ngày

Sau mỗi lần kho mã được cập nhật, chỉ cần chạy lệnh sau trên VPS:

```bash
cd /opt/ai-image-workbench-repo

sudo BRANCH=main \
  REPO_DIR=/opt/ai-image-workbench-repo \
  STATIC_DIR=/var/www/ohlaoo-studio \
  SERVICE_DIR=/opt/image-sub2api-studio \
  DATA_DIR=/var/lib/image-sub2api-studio \
  BASE_PATH=/studio/ \
  PUBLIC_STUDIO_URL=https://studio.ohlaoo.com/studio/ \
  REQUIRE_LIBRARY=1 \
  bash deploy/sync-from-git.sh
```

Tập lệnh sẽ tự động:

1. Lấy nhánh `main` từ GitHub.
2. Cài các gói phụ thuộc và build phiên bản dùng đường dẫn con `/studio/` ngay trên máy chủ.
3. Thay các tệp tĩnh và `studio-assets/` trong `/var/www/ohlaoo-studio`.
4. Cập nhật tập lệnh dịch vụ lịch sử/phiên trong `/opt/image-sub2api-studio`.
5. Ghi các ghi đè runtime của systemd, giữ nguyên `DATA_DIR`.
6. Khởi động lại `image-sub2api-studio-history`.
7. Kiểm tra `studio.html`, các tệp JS/CSS có mã hash, health check, số lượng tư liệu và cấu hình Nginx.

## Khôi phục thư viện tư liệu

Nếu Quảng trường cảm hứng hoặc thư viện tư liệu trống sau khi cập nhật, hãy kiểm tra thư viện được bảo vệ trước:

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

Các chỉ mục thư viện đầy đủ cũ từng nằm ở những vị trí sau:

```text
/home/margetrp/ohlaoo-home-overlay-v47-gallery-20260519-142434/public
/home/margetrp/ohlaoo-studio-backup-20260518-202731
/var/www/ohlaoo-overlay
```

Ví dụ lệnh khôi phục:

```bash
OLD_PUBLIC=/home/margetrp/ohlaoo-home-overlay-v47-gallery-20260519-142434/public
NEW_LIBRARY=/var/lib/image-sub2api-studio/library

sudo install -d -o www-data -g www-data -m 750 "$NEW_LIBRARY"

sudo install -o www-data -g www-data -m 640 "$OLD_PUBLIC/cases.json" "$NEW_LIBRARY/cases.json"
sudo install -o www-data -g www-data -m 640 "$OLD_PUBLIC/inspirations.json" "$NEW_LIBRARY/inspirations.json"
sudo install -o www-data -g www-data -m 640 "$OLD_PUBLIC/style-library.json" "$NEW_LIBRARY/style-library.json"
sudo cp -a "$OLD_PUBLIC/images" "$NEW_LIBRARY/"

sudo chown -R www-data:www-data /var/lib/image-sub2api-studio
sudo find /var/lib/image-sub2api-studio -type d -exec chmod 750 {} \;
sudo find /var/lib/image-sub2api-studio -type f -exec chmod 640 {} \;
sudo systemctl restart image-sub2api-studio-history
```

## Xác minh

Sau khi cập nhật, hãy kiểm tra dịch vụ cục bộ trước:

```bash
systemctl is-active image-sub2api-studio-history
curl -s http://127.0.0.1:8787/studio-api/health
```

Tiếp theo, kiểm tra địa chỉ công khai và tài nguyên tĩnh. Đối chiếu tên tệp JS/CSS với mã hash trong `studio.html` trên máy chủ:

```bash
curl -I https://studio.ohlaoo.com/studio/
curl -s https://studio.ohlaoo.com/studio/ | grep 'studio-assets'
curl -I https://studio.ohlaoo.com/studio-api/health
```

Nếu JS/CSS trả về `text/html`, cấu hình dự phòng của Nginx hoặc đường dẫn tĩnh đang sai và có thể khiến trang trắng. Cần sửa thư mục tĩnh và alias `/studio/studio-assets/` trước.

## Nguyên tắc

- Mã nguồn và tài liệu được quản lý bằng Git.
- Tạo sản phẩm build trực tiếp trên VPS.
- Có thể thay thư mục tĩnh, nhưng không được ghi đè thư mục dữ liệu bền vững.
- Các tệp JSON mẫu công khai có thể cập nhật cùng kho mã; thư viện tư liệu riêng của môi trường thực tế nằm ở `/var/lib/image-sub2api-studio/library`.
- Sau mỗi lần cập nhật, phải xem kết quả xác minh cuối của tập lệnh, không chỉ kiểm tra trang có mở được hay không.
