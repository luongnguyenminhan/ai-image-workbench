# Lời cảm ơn và phạm vi tham khảo

AI Image Workbench là ứng dụng frontend độc lập kết nối với gateway tạo và chỉnh sửa ảnh tương thích OpenAI.

Dự án tham khảo các prompt mẫu cộng đồng, quy trình sáng tạo AI công khai và công cụ frontend mã nguồn mở về ý tưởng sản phẩm, mẫu prompt và cách triển khai. Đây là tư liệu học hỏi và nguồn tham khảo prompt; việc tham khảo không hàm ý có liên kết, tài trợ, quyền sở hữu mã nguồn hay tư liệu, cũng không có nghĩa kho mã này là nhánh của dự án khác.

## Phạm vi do dự án này phụ trách

- Quy trình sáng tạo trong `studio.html` và `src/studio.jsx`.
- Giao diện tạo ảnh/video, điều khiển thông số, tải ảnh tham chiếu, che key và bảng lịch sử ảnh.
- Logic kết nối gateway tương thích OpenAI trong `src/aiGatewayClient.js`.
- Dịch vụ lịch sử người dùng tùy chọn trong `scripts/image-sub2api-studio-history-service.mjs`.
- Ví dụ triển khai liên quan đến `deploy/`, Docker và Nginx.
- Ảnh chụp giao diện dự án trong `docs/screenshots/`.

## Nguồn prompt mẫu

Các dự án prompt cộng đồng và ví dụ prompt công khai chỉ được dùng làm nguồn tham khảo và tư liệu học tập.

Prompt trong `docs/templates.md`, `public/cases.json` và dữ liệu mẫu về sau, khi phù hợp, được xem là tư liệu prompt cộng đồng theo giấy phép `CC BY 4.0`. Khi sử dụng, chỉnh sửa hoặc phân phối lại, hãy ghi nhận tác giả hoặc nguồn gốc.

Nguồn prompt hiện đã được ghi nhận rõ:

- [`signature-image-prompts-gpt-image-2.md`](https://github.com/zaizhi-1112/ai-image-extension-playbook/blob/main/signature-image-prompts-gpt-image-2.md) / [@liyue_ai](https://x.com/liyue_ai), được trích dẫn làm tư liệu học tập cho prompt mẫu.

Khi bổ sung nguồn prompt, nên thêm siêu dữ liệu tương tự:

```json
{
  "sourceName": "Tên nguồn gốc",
  "sourceUrl": "https://example.com/source",
  "license": "CC-BY-4.0",
  "usage": "Chỉ dùng làm tư liệu tham khảo prompt mẫu",
  "includesAssets": false
}
```

## Tham khảo sản phẩm và quy trình

Công cụ tạo ảnh AI công khai, thư viện prompt và ứng dụng sáng tạo có thể làm tư liệu tham khảo về sản phẩm và quy trình. Các khía cạnh thường được tham khảo gồm chỉnh sửa prompt, điều khiển thông số, thẻ ý tưởng, lịch sử ảnh, xem trước kết quả và thư viện tư liệu được bảo vệ.

Dự án không chứa ảnh chụp giao diện sản phẩm bên thứ ba, ảnh riêng tư, tư liệu thương hiệu hay tệp giao diện độc quyền.

## Phụ thuộc mã nguồn mở

Ứng dụng được xây dựng bằng React, Vite và Lucide React. Giấy phép của các phần phụ thuộc tuân theo siêu dữ liệu gói và kho mã nguồn tương ứng.

Ví dụ triển khai sử dụng các cấu hình Docker và Nginx phổ biến. Đây là cấu hình tích hợp, không bao gồm dịch vụ bên thứ ba.

## Phạm vi ảnh và tư liệu tĩnh

Kho mã mở không chứa thư viện ảnh tham chiếu đầy đủ.

- Ảnh demo công khai chỉ nên gồm ảnh đã tạo hoặc đã xác nhận được phép phân phối lại.
- Không sao chép ảnh dự án bên thứ ba, ảnh chụp README, ảnh bìa, ảnh thu nhỏ hoặc ảnh tham chiếu riêng vào kho mã hay gói tĩnh công khai, trừ khi giấy phép cho phép rõ ràng.
- Ảnh do AI tạo vẫn có thể liên quan đến điều khoản nền tảng, quyền cá nhân, nhãn hiệu hoặc quyền đối với nhân vật/sở hữu trí tuệ. Ảnh demo công khai nên tránh thương hiệu dễ nhận diện, người nổi tiếng, nhân vật có bản quyền, hình mờ hoặc thành phần tham chiếu không rõ nguồn.
- Nên lưu thư viện tư liệu riêng trên máy chủ, kho đối tượng hoặc CDN và chỉ tải khi người dùng đã đăng nhập.

## Quy tắc ghi nhận nguồn

Khi bổ sung mẫu, ví dụ, gói prompt hoặc tư liệu demo, hãy lưu siêu dữ liệu nguồn gần dữ liệu đó. Có thể ghi nhận dữ liệu mẫu nhẹ trong `public/inspiration-sources.json`; với gói tư liệu riêng, nên giữ bảng nguồn riêng bên trong gói.
