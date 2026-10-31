# AI Image Workbench

## Giới thiệu dự án

AI Image Workbench là một không gian sáng tạo hình ảnh AI có thể tự lưu trữ, kết nối với các gateway tạo và chỉnh sửa ảnh tương thích OpenAI.

Tôi xây dựng công cụ này vì quy trình tạo ảnh trước đây bị phân tán: prompt ở một nơi, ảnh tham chiếu ở nơi khác, model, kích thước và chất lượng lại nằm trong thông số API, còn kết quả thường chỉ được lưu tạm trong trình duyệt. Khi tải lại trang, hết thời gian chờ, gặp lỗi hoặc tiếp tục chỉnh sửa, ngữ cảnh rất dễ bị mất.

Không gian này gom quy trình vào cùng một trang: viết và nhờ AI tối ưu prompt, tải ảnh tham chiếu, chọn nhà cung cấp và model, tạo ảnh qua `/v1/images/generations` hoặc chỉnh sửa theo ảnh tham chiếu và vẽ lại một phần bằng Mask qua `/v1/images/edits`. Sau khi tạo, bạn có thể tiếp tục phát triển từ bất kỳ ảnh nào trên canvas vô hạn; phiên làm việc, hàng đợi, lịch sử và liên kết giữa các ảnh đều được lưu lại.

Ứng dụng kết nối được với API chính thức theo chuẩn OpenAI, gateway tương thích tự cấu hình, Sub2API, NewAPI và các dịch vụ tương tự. Sub2API là một trong những gateway được dùng ở giai đoạn đầu phát triển; đây là dịch vụ được hỗ trợ chứ không phải định danh của dự án.

Kho mã này chỉ gồm ứng dụng và ví dụ triển khai; không bao gồm trang chủ nội bộ, thư viện ảnh riêng đầy đủ, API key thật hay mã nguồn backend gateway.

Bản dùng thử: [studio.ohlaoo.com/studio/](https://studio.ohlaoo.com/studio/)

## Cộng đồng

Nếu bạn đang xây dựng quy trình tạo ảnh AI hoặc muốn trao đổi về API chính thức, API tương thích tự cấu hình, Sub2API, NewAPI, triển khai, gọi model, quy trình prompt và các cải tiến trong tương lai, hãy tham gia nhóm QQ: `260789529`.

<p align="center">
  <a href="https://github.com/margetrp-hub/ai-image-workbench"><img src="https://img.shields.io/badge/project-ai--image--workbench-0f766e?style=flat-square" alt="project"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-1f7268?style=flat-square" alt="MIT License"></a>
  <a href="./README.md"><img src="https://img.shields.io/badge/lang-English-blue?style=flat-square" alt="English"></a>
</p>

## Tính năng trong bản 0.9 Beta

- Tạo ảnh mặc định dùng `/v1/images/generations` và gọi trực tiếp các model ảnh như `gpt-image-2`, tránh chuyển nhầm sang `/v1/responses`.
- Chỉnh sửa theo ảnh tham chiếu và vẽ lại từng vùng bằng Mask dùng `/v1/images/edits`.
- Kết nối được với API chính thức theo chuẩn OpenAI, gateway tương thích OpenAI tự cấu hình, Sub2API, NewAPI và các dịch vụ tương tự.
- Docker hỗ trợ chế độ `STUDIO_AUTH_MODE=local`; phiên hiện tại, lịch sử, hàng đợi và ảnh đã tạo vẫn được lưu mà không cần hệ thống tài khoản từ dịch vụ nguồn.
- Bản triển khai đã có hệ thống tài khoản có thể dùng `STUDIO_AUTH_MODE=gateway` để phân tách dữ liệu theo tài khoản gateway hiện có.
- Cấu hình mới nên dùng tên biến chung `VITE_AI_*` và `AI_GATEWAY_*`; các tên cũ `VITE_SUB2API_*` và `SUB2API_*` vẫn được giữ làm bí danh tương thích.
- Hàng đợi tạo ảnh phía máy chủ được lưu lại; sau khi kiểm tra độ ổn định của nhóm tài khoản nguồn, có thể tăng giới hạn chạy đồng thời cho mỗi người dùng bằng `STUDIO_JOB_CONCURRENCY`.
- Canvas lớn sẽ chuyển sang chế độ hiệu năng, chỉ dựng các nút ảnh/video trong vùng nhìn thấy và giảm tải hoạt ảnh đường nối SVG.
- Khung hội thoại sáng tạo bên dưới có thể gọi model trò chuyện để tối ưu prompt và sử dụng hạn mức của key đang chọn.
- Tiếp tục tạo từ một nút trên canvas sẽ giữ mối liên hệ nhánh, chẳng hạn #1 -> #2 / #3.
- Khi mở một ảnh đã tạo, ứng dụng hiển thị prompt đầy đủ được lưu và chia thành các mục như chủ thể, bối cảnh, phong cách, bố cục.
- Trợ lý prompt tuân theo các yêu cầu như tạo biến thể, chỉnh sửa một phần, viết lại, loại bỏ hoặc thay đổi; không tự đưa nội dung cũ mà người dùng đã từ chối trở lại.
- Phiên canvas hiện tại được lưu qua `/studio-api/session` và tách theo tài khoản đăng nhập hoặc không gian cục bộ.
- Sau khi đăng nhập, yêu cầu tạo ảnh được gửi đến `/studio-api/generation-jobs`. Máy chủ gọi `/v1/images/generations` hoặc `/v1/images/edits` và lưu kết quả để có thể khôi phục từ canvas và lịch sử sau khi tải lại trang.
- Khi tạo ảnh quá thời gian chờ, bị dừng hoặc mất mạng, trang chuyển sang trạng thái “chờ xác nhận”, cho biết dịch vụ nguồn có thể vẫn đang xử lý hoặc đã tính phí để tránh gửi lặp yêu cầu ngoài ý muốn.
- Lịch sử được nhóm theo phiên; danh sách dự án bên trái không còn tách từng ảnh trong cùng phiên thành các dự án riêng.
- Khôi phục lịch sử trên trình duyệt có thêm bộ nhớ đệm IndexedDB; localStorage chỉ dùng dự phòng, giảm nguy cơ mất lịch sử lớn hoặc làm đầy localStorage.
- Lịch sử ảnh, thẻ phiên cục bộ, ý tưởng video và mẫu ảnh được dựng theo từng đợt để tránh tải quá nhiều phần tử DOM và ảnh cùng lúc.
- Key chỉ hiển thị ở dạng đã che; API key của endpoint tự cấu hình chỉ lưu trong phiên trình duyệt hiện tại, không ghi vào localStorage.
- Khu vực tài khoản ở góc dưới bên trái có lựa chọn giao diện tiếng Việt/tiếng Anh và chế độ sáng/tối.
- Mẫu và ý tưởng có thể dùng dữ liệu tĩnh ban đầu; trong môi trường thực tế, có thể yêu cầu đăng nhập rồi tải qua `/studio-api/library` để bảo vệ tư liệu và prompt riêng.

## Ảnh chụp màn hình

Ảnh chụp lấy từ giao diện hiện tại, dùng dữ liệu minh họa và key đã được che.

![Giao diện tiếng Việt của không gian sáng tạo](docs/screenshots/workstation-zh.png)

![Giao diện tiếng Anh của không gian sáng tạo](docs/screenshots/workstation-en.png)

Ảnh chụp các tính năng riêng lẻ của bản cũ vẫn được giữ trong `docs/screenshots/` để so sánh phiên bản; trang dự án hiện chỉ giới thiệu bố cục mới.

## Phạm vi dự án

Kho mã này không phải nhà cung cấp model hay backend gateway; dự án chỉ cung cấp giao diện sáng tạo.

API chính thức, gateway tương thích tự cấu hình, Sub2API, NewAPI và các dịch vụ tương tự phụ trách tài khoản, key, hạn mức, model, tính phí và chuyển tiếp gateway.

AI Image Workbench phụ trách trang sáng tạo, quy trình prompt, tải ảnh tham chiếu, điều khiển thông số, canvas vô hạn, tiếp tục sáng tạo từ canvas, lịch sử, lưu phiên hiện tại và ví dụ triển khai.

Prompt mẫu được tổng hợp từ tài liệu cộng đồng và ví dụ công khai; khi áp dụng, nội dung tuân theo giấy phép `CC BY 4.0`. Hãy ghi nhận tác giả hoặc nguồn khi sử dụng hay chỉnh sửa. Xem thêm [Lời cảm ơn và phạm vi tham khảo](docs/ACKNOWLEDGEMENTS.vi.md).

## Rà soát và giới hạn an toàn

Gói mã nguồn mở không bao gồm key thật, thư viện ảnh riêng đầy đủ, trang chủ sản phẩm hay mã nguồn backend gateway. Khi triển khai, bạn cần kết nối tài khoản API chính thức hoặc gateway tương thích OpenAI hiện có, đồng thời cấu hình Nginx, Docker, HTTPS và thư mục lưu trữ phù hợp môi trường thực tế.

- Hướng dẫn an toàn, xử lý key, lưu dữ liệu và gia cố triển khai: [SECURITY.md](SECURITY.md).
- Hướng dẫn kết nối nhà cung cấp / gateway: [docs/PROVIDERS.md](docs/PROVIDERS.md).
- Ghi chú phát hành 0.9 beta, ảnh hưởng nâng cấp và danh sách kiểm tra: [RELEASE_NOTES.md](RELEASE_NOTES.md).
- Phạm vi giấy phép mã nguồn: [LICENSE](LICENSE). Prompt mẫu và nội dung cộng đồng không tự động thuộc giấy phép MIT của mã nguồn.

## Chạy trên máy cá nhân

```bash
npm install
cp .env.example .env.local
npm run dev:studio
```

Nếu trang chạy cục bộ cần gọi trực tiếp gateway tương thích OpenAI trên đám mây, hãy thêm dòng sau vào `.env.local`:

```env
VITE_DEV_AI_GATEWAY_PROXY_TARGET=https://ten-gateway-cua-ban
```

Như vậy, các yêu cầu `/v1`, `/api`, `/login` từ trang cục bộ sẽ được Vite chuyển tiếp đến gateway, tránh lỗi CORS trong quá trình kiểm thử.

## Tạo bản dựng triển khai

Triển khai tại đường dẫn gốc của trang web:

```bash
npm run build
```

Triển khai trong đường dẫn con `/studio/`:

```bash
STUDIO_BASE_PATH=/studio/ npm run build
```

Trên Windows PowerShell:

```powershell
$env:STUDIO_BASE_PATH="/studio/"
npm run build
Remove-Item Env:\STUDIO_BASE_PATH
```

Bản dựng nằm trong `dist/`. Khi tải lên VPS, hãy dùng `studio.html` và `studio-assets/` trong `dist/`; không dùng tệp nguồn `studio.html` ở thư mục gốc làm tệp chạy trực tuyến.

## Các biến môi trường cơ bản

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

Ý nghĩa các biến thường dùng:

- `VITE_AI_GATEWAY_BASE_URL` dùng cho đăng nhập, hồ sơ người dùng và danh sách key; ứng dụng tự thêm `/api/v1`.
- `VITE_AI_GATEWAY_MODEL_BASE_URL` dùng cho API model và tạo ảnh; ứng dụng tự thêm `/v1`.
- `VITE_AI_IMAGE_ROUTE=auto` là chế độ khuyến nghị: tạo ảnh thông thường dùng `/v1/images/generations`, còn ảnh tham chiếu và Mask dùng `/v1/images/edits`.
- Chỉ chuyển sang `responses` nếu dịch vụ nguồn hỗ trợ tạo ảnh qua `/v1/responses` và bạn muốn kiểm thử tuyến này.
- Bật `VITE_STUDIO_LIBRARY_AUTH_REQUIRED=true` khi thư viện mẫu đã được cung cấp qua backend trong môi trường thực tế.
- Các biến cũ `VITE_SUB2API_*` vẫn là bí danh tương thích; bản triển khai mới nên ưu tiên `VITE_AI_*`.

## Gợi ý triển khai trên VPS

Nên triển khai ứng dụng như một frontend tĩnh cùng dịch vụ Node lưu lịch sử và phiên làm việc:

```text
/var/www/ai-image-workbench/      # Ví dụ thư mục tệp tĩnh
/opt/image-sub2api-studio/        # Dịch vụ Node lưu lịch sử và phiên
/var/lib/image-sub2api-studio/    # Lịch sử ảnh, phiên hiện tại và thư viện tư liệu được bảo vệ
```

Nếu Nginx đọc một thư mục khác, hãy đặt các tệp trong `dist/` vào đúng thư mục đó. Tên thư mục không quan trọng, miễn khớp với `alias` trong Nginx. VPS hiện có thể tiếp tục dùng `/opt/image-sub2api-studio` và `/var/lib/image-sub2api-studio` để giữ nguyên lịch sử, phiên, hàng đợi, ảnh đã tạo và thư viện tư liệu được bảo vệ.

Xem hướng dẫn chi tiết:

- [Hướng dẫn triển khai](docs/DEPLOY.vi.md)
- [Triển khai Docker](docs/DOCKER.vi.md)
- [Triển khai VPS bằng cách đồng bộ kho Git](docs/VPS-GIT-SYNC.vi.md)
- [Cập nhật máy chủ](deploy/UPDATE-SERVER.vi.md)
- [Giới hạn an toàn](SECURITY.md)
- [Kết nối nhà cung cấp / gateway](docs/PROVIDERS.md)
- [Release Notes](RELEASE_NOTES.md)

VPS chạy lâu dài nên triển khai bằng đồng bộ Git: máy chủ lấy mã nguồn, tạo bản dựng, cập nhật tệp tĩnh và dịch vụ, rồi kiểm tra trạng thái trực tuyến.

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

Nếu máy chủ đã có thư viện ảnh, không cần tải thư viện lên lại khi cập nhật frontend bằng gói ZIP. Triển khai đồng bộ qua Git cũng không cần tải gói ZIP thủ công mỗi lần.

```bash
npm run package:release
```

Lệnh này tạo ra:

- `ai-image-workbench-core-update-*.zip`: các tệp frontend tĩnh.
- `ai-image-workbench-service-update-*.zip`: các tệp dịch vụ trong `/opt/image-sub2api-studio`.
- `image-sub2api-studio-core-update-*.zip` và `image-sub2api-studio-service-update-*.zip`: bản sao dùng tên cũ để tương thích với lệnh cập nhật trên VPS hiện có.

Hãy tải gói dịch vụ lên nếu cần lưu phiên hiện tại, khôi phục sau khi tải lại trang, khôi phục hàng đợi hoặc dùng dịch vụ lịch sử ảnh.

## Triển khai bằng Docker

Kho mã cũng có cấu hình Docker Compose để nhanh chóng chạy trên máy chủ mới hoặc cho người dùng mã nguồn mở:

```bash
cp .env.example .env
docker compose up --build -d
```

Lệnh trên khởi động hai container:

- `studio-web`: frontend tĩnh Nginx và proxy cùng nguồn.
- `studio-history`: dịch vụ lưu lịch sử ảnh, phiên hiện tại và tài nguyên đã tạo.

Dữ liệu được lưu trong volume `studio-data`. Tạo lại image sẽ không xóa thư viện ảnh và canvas hiện tại, miễn là bạn không chạy `docker compose down -v`.

Nếu gateway tương thích OpenAI chạy trên máy chủ tại `127.0.0.1:8080`:

```env
AI_GATEWAY_UPSTREAM=http://host.docker.internal:8080
```

Nếu gateway dùng tên miền từ xa:

```env
AI_GATEWAY_UPSTREAM=https://your-gateway-domain
```

Xem hướng dẫn đầy đủ tại [Triển khai Docker](docs/DOCKER.vi.md).

## Kiểm tra cục bộ

Trước khi phát hành hoặc triển khai phiên bản tái cấu trúc, hãy chạy các bước kiểm tra cục bộ không tốn hạn mức:

```bash
npm run check:local
```

Lệnh này tạo bản dựng, kiểm tra tuyến nhà cung cấp và cấu hình triển khai/Docker Compose, xác minh khả năng lưu trữ, hủy và khởi động lại trên máy chủ. Kiểm thử trình duyệt bao phủ khôi phục lịch sử theo phiên, khôi phục lịch sử cục bộ bằng IndexedDB, dựng theo đợt thư viện ảnh, ý tưởng video và mẫu ảnh, giao diện tiếng Anh, cũng như việc key nhập tay không bị ghi vào localStorage.

Nếu máy có Docker Desktop hoặc Docker daemon, bạn cũng có thể kiểm thử container:

```bash
npm run smoke:docker
```

Lệnh này tạo cụm Compose, khởi động `studio-web` và `studio-history`, kiểm tra `/studio/`, `/studio-api/health` và Content-Type của JS/CSS, rồi dọn cụm kiểm thử. Nếu Docker chưa chạy, bước này chưa được xác minh và không nằm trong `npm run check:local`.

Trước khi quyết định phát hành hoặc triển khai, hãy chạy kiểm tra tổng thể:

```bash
npm run audit:readiness
```

Lệnh này chạy lại các bước kiểm tra cục bộ, tạo bản dựng từ workspace hiện tại, kiểm tra gói phát hành và yêu cầu kiểm thử Docker thành công. Nếu Docker Desktop hoặc Docker daemon chưa chạy, lệnh sẽ báo lỗi thay vì coi việc triển khai container là đã được xác minh.

## Chiến lược thư viện tư liệu

Bất kỳ nội dung nào đã tải vào frontend đều có thể được xem qua trình duyệt. Để hạn chế crawler hoặc người khác truy xuất prompt và tư liệu trong môi trường thực tế:

- Chỉ đưa dữ liệu mẫu nhẹ vào kho GitHub, không đưa thư viện ảnh riêng đầy đủ.
- Cung cấp prompt và tư liệu riêng qua `/studio-api/library` sau khi đăng nhập.
- Chặn truy cập tĩnh đến `/studio/images/`, `/studio/cases.json`, `/studio/inspirations.json` trong Nginx.
- Thêm `X-Robots-Tag: noindex, nofollow, noarchive`.

Kho mã đã có cấu hình mẫu cơ bản trong `deploy/nginx-sub2api-studio.conf`.

## Kiểm tra hợp đồng gateway (tùy chọn)

Kiểm tra tuyến nhà cung cấp:

```bash
npm run check:providers
```

Lệnh này bảo đảm tạo ảnh tự động vẫn dùng `/v1/images/generations` và chỉnh sửa ảnh vẫn dùng `/v1/images/edits`.

```bash
AI_GATEWAY_BASE_URL=https://gateway.example.com \
AI_GATEWAY_EMAIL=you@example.com \
AI_GATEWAY_PASSWORD='your-password' \
npm run check:gateway
```

Kiểm tra này chỉ xác minh đăng nhập, hồ sơ và danh sách key của gateway dùng tài khoản; không chạy tạo ảnh có tính phí. Các biến `SUB2API_*` cũ và `npm run check:sub2api` vẫn được giữ làm bí danh tương thích.

## Cấu trúc dự án

```text
.
|- src/
|  |- studio.jsx                         # Giao diện chính
|  |- studio.css                         # Kiểu hiển thị
|  |- aiGatewayClient.js                 # Máy khách gateway tương thích OpenAI
|  |- sub2apiClient.js                   # Chuyển tiếp tương thích đường dẫn import cũ
|  `- studio/                            # Nhà cung cấp, lưu trữ và tiện ích
|- scripts/
|  |- image-sub2api-studio-history-service.mjs
|  |- check-sub2api-contract.mjs
|  |- package-release.mjs
|  `- package-studio-core-update.mjs        # Điểm vào tương thích tên cũ
|- deploy/
|  |- nginx-sub2api-studio.conf
|  |- docker-nginx.conf.template
|  |- image-sub2api-studio-history.service
|  `- UPDATE-SERVER.vi.md
|- docs/
|  |- DEPLOY.vi.md
|  |- DOCKER.vi.md
|  |- open-source-config.vi.md
|  |- sub2api-studio-overlay.md
|  |- templates.md
|  `- screenshots/
|- SECURITY.md
|- RELEASE_NOTES.md
|- public/
|  |- cases.json
|  |- inspirations.json
|  |- inspiration-sources.json
|  `- style-library.json
`- studio.html
```

## Tác giả và giấy phép

Người duy trì: [@margetrp-hub](https://github.com/margetrp-hub)

Mã nguồn được phát hành theo [MIT License](LICENSE). Prompt mẫu cộng đồng tuân theo `CC BY 4.0` khi áp dụng; phần phụ thuộc của bên thứ ba, nguồn prompt và thư viện tư liệu do người dùng kết nối tuân theo giấy phép hoặc điều khoản dịch vụ riêng.
