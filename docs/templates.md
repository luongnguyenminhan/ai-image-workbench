> [Quay lại trang chủ README](../README.md)

<a name="section-templates"></a>

## Mẫu prompt và hướng dẫn tránh lỗi

Tài liệu này cung cấp các mẫu prompt tạo ảnh có thể sao chép và chỉnh sửa, làm tài liệu tham khảo cho các mẫu cộng đồng của `image-sub2api-studio`.

Nội dung mẫu prompt đến từ cộng đồng và tuân theo giấy phép CC BY 4.0. Khi sử dụng hoặc chỉnh sửa, vui lòng ghi nhận tác giả hoặc nguồn gốc ban đầu. Đây chỉ là nội dung khởi đầu tùy chọn, không phải nội dung do dự án tạo ra hay sở hữu.

<a name="tpl-ui"></a>

### UI và giao diện

**Mẫu cơ bản**

```text
Tạo ảnh giao diện cho [loại sản phẩm] trên [nền tảng, chẳng hạn iOS/Android/Web].
Chức năng chính: [tính năng A], [tính năng B], [tính năng C].
Phong cách hình ảnh: [tối giản/công nghệ/mô phỏng vật thể], màu chủ đạo [màu], màu nhấn [màu].
Bố cục: [thanh điều hướng trên cùng/hai cột/danh sách thẻ], phân cấp thông tin rõ ràng, có đủ khoảng trống.
Đầu ra: ảnh chụp giao diện độ trung thực cao, chữ rõ và dễ đọc, tỷ lệ [9:16/16:9].
```

**Mẫu JSON nâng cao (khuyến nghị dùng khi gọi Agent)**

```json
{
  "type": "UI Screenshot",
  "platform": "iOS",
  "product": "Fitness App",
  "layout": "Card-based feed with bottom tab bar",
  "style": {
    "theme": "Dark Mode",
    "primary_color": "Neon Green",
    "typography": "Clean sans-serif"
  },
  "content": {
    "header": "Today's Activity",
    "cards": [
      {"title": "Running", "data": "5.2 km", "button": "Start"},
      {"title": "Calories", "data": "340 kcal"}
    ]
  },
  "constraints": "High fidelity, readable text, 9:16 aspect ratio"
}
```

**Mẫu tạo ảnh chụp màn hình**

```text
Tạo ảnh chụp nội dung trên [nền tảng, chẳng hạn X/TikTok/RedNote/Moments], giao diện [sáng/tối].
Tỷ lệ tổng thể: [9:16 / 3:4 / 1:1], phong cách ảnh chụp màn hình điện thoại.

Nội dung chính:
- Thông tin tài khoản: [mô tả ảnh đại diện / tên người dùng / dấu xác minh]
- Nội dung bài đăng: [nội dung văn bản cụ thể, bằng tiếng Việt được chỉ định]
- Số liệu tương tác: [lượt thích/bình luận/chia sẻ/lưu]

Thành phần giao diện:
- Phía trên: [thanh trạng thái/thanh điều hướng/thanh tìm kiếm]
- Phía dưới: [thanh thao tác/thanh tab/ô nhập]
- Thành phần bổ sung: [cửa sổ nổi/bình luận chạy hiệu ứng quà tặng/thẻ giỏ hàng]

Ràng buộc: hiển thị chính xác phần chữ tiếng Việt được chỉ định, không dùng chữ lỗi hoặc văn bản giữ chỗ, giữ cố định tỷ lệ ảnh.
Đầu ra: ảnh chụp giao diện mạng xã hội có độ chân thực cao, chữ rõ và dễ đọc.
```

**Mẫu giao diện phát trực tiếp**

```text
Tạo ảnh chụp giao diện phát trực tiếp trên [nền tảng, chẳng hạn TikTok/Kuaishou/Bilibili].
Người phát: [mô tả nhân vật/tên], tư thế: [ngồi/đứng/đang hoạt động], trang phục: [mô tả trang phục].
Bối cảnh: [mô tả phòng phát trực tiếp], ánh sáng: [tông ấm/tông lạnh/kết hợp].

Lớp phủ giao diện:
- Phía trên: ảnh đại diện người phát + nút theo dõi + số người xem trực tuyến + thứ hạng/độ phổ biến
- Góc dưới bên trái: danh sách bình luận chạy ( [N] bình luận, có ví dụ nội dung)
- Góc dưới bên phải hoặc ở giữa: thẻ sản phẩm / hiệu ứng quà tặng / thanh tiến độ PK
- Phía dưới: ô nhập + biểu tượng chức năng (chia sẻ/thích/quà tặng/giỏ hàng)

Phong cách: [ảnh chụp buổi phát trực tiếp chân thực/giao diện độ trung thực cao/tông tối/tông hồng pastel], tỷ lệ 9:16.
Ràng buộc: chữ rõ và dễ đọc, bình luận hợp lý, thành phần giao diện không che khuất mặt người phát.
Đầu ra: hình ảnh mô phỏng ảnh chụp màn hình buổi phát trực tiếp.
```
**Hướng dẫn tránh lỗi**

- **Tránh chỉ dẫn mơ hồ**: nêu rõ “nền tảng + tỷ lệ + bố cục”, nếu không mô hình có thể sắp xếp tùy tiện.
- **Khóa chính xác nội dung chữ**: yêu cầu “chữ phải rõ và hiển thị đúng nội dung tiếng Việt được chỉ định” để tránh nút có chữ lỗi hoặc ký tự vô nghĩa.
- **Phân biệt đặc trưng từng nền tảng**: X (Twitter) có dấu xác minh màu xanh và phân biệt chia sẻ với trích dẫn; TikTok có đĩa nhạc và hiệu ứng thích; RedNote có bố cục dạng lưới hai cột. Hãy nêu nền tảng trước khi tạo để tránh trộn lẫn các đặc điểm.
- **Chọn loại buổi phát trực tiếp trước**: giao diện bán hàng và phát trực tiếp biểu diễn khác nhau đáng kể (bán hàng thường có danh sách sản phẩm ở góc trên bên phải, còn biểu diễn chú trọng tương tác bình luận). Hãy xác định loại buổi phát trước khi điền chi tiết.
- **Khóa tỷ lệ cho giao diện không chuẩn**: màn hình ô tô hoặc nhà thông minh có tỷ lệ cố định (chẳng hạn 21:9); hãy ghi rõ ngay từ đầu, nếu không mô hình thường mặc định tỷ lệ điện thoại 9:16.

<a name="tpl-infographic"></a>

### Biểu đồ và trực quan hóa thông tin

**Mẫu cơ bản**

```text
Tạo đồ họa thông tin về [chủ đề: nêu cụ thể, tránh quá rộng; chẳng hạn “Hướng dẫn chăm sóc sức khỏe hằng ngày cho người cao tuổi” thay vì “Sức khỏe”], dành cho [đối tượng: mô tả rõ độ tuổi, nghề nghiệp, sở thích, v.v.].
Cấu trúc: vùng tiêu đề + [3-5] mô-đun (mỗi mô-đun có biểu tượng, tiêu đề ngắn và 1-2 câu giải thích; thể hiện mối liên hệ giữa các mô-đun bằng mũi tên, màu sắc hoặc đường nối phù hợp).
Loại biểu đồ: [lưu đồ/biểu đồ so sánh/sơ đồ quan hệ/dòng thời gian].
Phong cách: [báo cáo chuyên nghiệp/minh họa phổ biến khoa học/giáo dục trẻ em], màu chủ đạo [màu], nền [sáng/tối].
Đầu ra: đồ họa thông tin bằng tiếng Việt, phân cấp rõ ràng và dễ đọc.
```

**Mẫu JSON nâng cao (khuyến nghị dùng khi gọi Agent)**

```json
{
  "type": "Infographic",
  "topic": "Urban Metabolism",
  "audience": "General Public",
  "structure": {
      "title_area": "Bản đồ hệ thống sống của đô thị",
    "layout": "Isometric cutaway, 12 numbered panels",
    "modules": [
      {"title": "Năng lượng", "icon": "lightning", "text": "Power flows"},
      {"title": "Vòng tuần hoàn nước", "icon": "water_drop", "text": "Water flows"}
    ]
  },
  "style": {
    "aesthetic": "Scientific atlas",
    "colors": "Low saturation, color-coded flows",
    "background": "Light paper texture"
  },
  "constraints": "No cyberpunk, no gibberish text, strict structural layout"
}
```

**Mẫu đồ họa thông tin khoa học theo tỷ lệ quy mô**

```text
Tạo đồ họa thông tin khoa học thể hiện các cấp độ quy mô của [chủ đề].
Cấu trúc: 6-8 khung tròn hoặc lục giác, sắp xếp theo thứ tự từ vi mô đến vĩ mô.
Mỗi khung gồm: tên cấp độ, nhận xét ngắn 3-5 từ, đơn vị đo hoặc độ phóng đại, cùng hình dựng 3D chi tiết ở cấp độ đó.
Dùng đường mảnh nối các cấp độ và tránh lặp lại thứ bậc. Đặt tiêu đề “[chủ đề]: Ở MỌI QUY MÔ” hoặc “PHÓNG TO: THẾ GIỚI CỦA [chủ đề]”.
Phong cách: đồ họa thông tin khoa học dạng biên tập, ánh sáng cận cảnh chính xác, phân cấp rõ, chữ ngắn và dễ đọc.
Ràng buộc: không dùng biểu tượng kính lúp chung chung, không vẽ mọi cấp độ cùng kích thước, không chèn đoạn văn dài.
```

**Hướng dẫn tránh lỗi**

- **Giới hạn số mô-đun**: chỉ định rõ “số mô-đun” và “loại biểu đồ” để giảm đáng kể tình trạng bố cục rối và quá tải thông tin.
- **Giữ nội dung ngắn gọn**: ưu tiên câu ngắn trong biểu đồ; đừng đưa cả đoạn văn dài vào hình vì mô hình không phải công cụ dàn trang.

<a name="tpl-poster"></a>

### Áp phích và trình bày chữ

**Mẫu cơ bản**

```text
Thiết kế áp phích [sự kiện/sản phẩm/phim] với chủ đề [từ khóa chủ đề].
Hình ảnh chủ đạo: [thành phần chính], nội dung tiêu đề: [tiêu đề], tiêu đề phụ: [tiêu đề phụ].
Bố cục: [căn giữa/căn trái/đường chéo], phong cách: [cổ điển/tương lai/tối giản].
Màu sắc: [màu chính + màu phụ], không khí: [từ khóa cảm xúc].
Đầu ra: áp phích độ phân giải cao, phù hợp chia sẻ trên mạng xã hội.
```

**Mẫu áp phích chiến dịch thể thao thương mại**

```text
Thiết kế áp phích chiến dịch thương mại cho [môn thể thao/nhóm sản phẩm thể hình].
Chủ thể: [vận động viên/người mẫu/đạo cụ sản phẩm], tư thế: [ngồi/chạy nước rút/vung vợt/tạo dáng thể hiện sức mạnh].
Đạo cụ chính: [vợt/tạ/giày thể thao/áo đấu], dùng tỷ lệ phóng đại hoặc bố cục chéo để tạo điểm nhấn thị giác.
Bố cục: [một hình ảnh chủ đạo mạnh/bộ ba tranh/áp phích dữ liệu dạng graffiti].
Tiêu đề lớn: “[tiêu đề chính]”, nội dung bổ trợ: “[câu ngắn/số liệu/thông điệp cổ vũ]”.
Phong cách hình ảnh: quảng cáo thương hiệu thể thao cao cấp, ánh sáng tương phản mạnh, sàn phản chiếu, bố cục sạch, màu thương hiệu [màu chính + màu phụ].
Ràng buộc: chủ thể rõ nét, chữ dễ đọc, tông màu thống nhất, không ghép ảnh lộn xộn, không tạo sai dụng cụ thể thao.
Đầu ra: tỷ lệ 1:1 hoặc 4:5, hình ảnh thể thao thương mại phù hợp mạng xã hội.
```

**Mẫu áp phích chữ mang tính khái niệm**

```text
Create ONE finished premium conceptual typography poster for the exact title:

"[tiêu đề/từ/cụm từ ngắn]"

Single poster only. No moodboard, grid, presentation board, mockup, captions, prompt text, process sheet, or sample labels.

The title must be the dominant visual structure of the poster: huge, readable, powerful, and spelled exactly. Do not translate, shorten, replace, or misspell it. Do not add other large readable text.

Silently interpret the title's meaning, mood, cultural aura, symbolic associations, psychological tension, and visual rhythm. Turn that interpretation into one strong visual metaphor.

Typography is the hero. Design custom-looking letterforms whose weight, width, contrast, spacing, rhythm, distortion, negative space, edge quality, and ink texture express the temperament of the title. The type should feel intentionally designed, not like a default font.

If the title refers to a widely known person, make a large editorial portrait or half-body figure a major visual presence, occupying roughly 40%-70% of the composition. The figure should interact with the typography: overlapping the letters, emerging from them, being framed by them, casting shadows on them, breaking through them, or being partially hidden behind them.

For abstract or non-person titles, use a human figure, landscape, object, or atmospheric setting only when it strengthens the meaning. It must interact with the typography and deepen the concept, not decorate it.

Use a restrained 4-6 color system matched to the theme: dominant background color, primary typography color, figure / landscape tone, emotional accent color, muted support color, and subtle paper / ink texture tone.

Composition style: high-end editorial poster, museum-quality graphic design, dramatic scale, strong hierarchy, few elements, intelligent whitespace, bold flat color areas, sharp cropping, silkscreen / lithograph / risograph grain, paper fibers, subtle ink imperfections, refined visual tension.

Avoid generic word art, glossy 3D lettering, random icons, stock-photo realism, cluttered collage, excessive grunge, tourist clichés, official logos, copied slogans, copied campaign aesthetics, unrelated text, and misspelled typography.
```

**Mẫu áp phích lựa chọn chữ ký với nhiều phong cách**

> Nguồn tham khảo: [signature-image-prompts-gpt-image-2.md](https://github.com/zaizhi-1112/ai-image-extension-playbook/blob/main/signature-image-prompts-gpt-image-2.md) / [@liyue_ai](https://x.com/liyue_ai)

```text
Bạn là hệ thống thiết kế chữ ký cao cấp kết hợp hệ thống hình ảnh thể hiện cá tính phong cách.

Đầu vào:
Tên: [họ tên/biệt danh]

Nhiệm vụ:
Dựa trên tên, tự động tạo áp phích dọc tỷ lệ 9:16 để lựa chọn chữ ký với nhiều phong cách.
Chuyển tên thành 6 phương án chữ ký có nét bút, thần thái và sức biểu đạt riêng.

Phân tích nội bộ:
1. Phân tích hình dạng chữ trong tên: độ dày đặc, tỷ lệ nét ngang/dọc, trọng tâm, khả năng nối nét và viết thảo.
2. Suy ra thần thái: lạnh và thanh, phóng khoáng, tiết chế, thương mại, nghệ thuật, tự nhiên, sắc sảo hoặc cao cấp.
3. Xác định cách viết cho từng chữ ký: nét bắt đầu, cách nối nét, nhịp điệu, biến đổi cấu trúc và nét kết thúc.

Bố cục:
- Nền trắng hoặc chuyển sắc xám rất nhạt, khoảng trống chiếm ít nhất 40%
- Tiêu đề lớn phía trên: [tên] · Chọn phong cách chữ ký
- Tiêu đề phụ: Nét bút khác nhau, thần thái khác nhau
- Ở giữa là lưới thẻ gồm 2 cột × 3 hàng
- Chữ nhỏ phía dưới: Chọn một mẫu làm chữ ký riêng của bạn.

Quy cách thẻ:
- Các thẻ có cùng kích thước và khoảng cách, được căn chỉnh thống nhất
- Bo góc nhẹ 8-16px
- Viền rất mảnh hoặc không viền
- Bóng đổ rất nhẹ
- Bề mặt trắng tinh tế, xám rất nhạt, giấy xuyến chỉ hoặc kính mờ
- Hướng đến bố cục tạp chí cao cấp, tránh cảm giác giao diện quá rõ

6 phong cách chữ ký:
1. Tối giản, lý trí: gần với chữ ký thương hiệu, nét bút tiết chế, khoảng trống rõ ràng
2. Phóng khoáng, mạnh mẽ: nối nét dứt khoát, cảm giác tốc độ, nét cuối kéo dài
3. Tự nhiên, thoải mái: nét viết tay rõ, mềm mại, thân thiện và gần gũi
4. Thư pháp phương Đông: nét khô, sắc thái mực tàu, nhịp điệu lên xuống rõ
5. Cấu trúc sắc nét: góc cắt hình học, nét đứt, cảm giác điềm tĩnh và tiết chế
6. Thử nghiệm: một phần khó đọc, tái cấu trúc nét chữ, cá tính tiên phong

Mỗi thẻ phải có:
- Số thứ tự
- Tên phong cách
- Chữ ký kích thước lớn
- Một câu ngắn mô tả thần thái
- Một điểm nhấn màu rất nhẹ

Ánh sáng và chất liệu:
Ánh sáng studio cao cấp, môi trường ánh sáng mềm, bóng đổ tinh tế và cảm giác không gian trong trẻo.
Tổng thể dùng đen, xám và trắng; màu nhấn cần tiết chế.

Điều cần tránh:
Không ghép nhiều phông chữ, không dùng chữ thư pháp thông thường, không phối màu lộn xộn, không thu nhỏ chữ ký, không bố cục lỏng lẻo, không làm nét bút thiếu sức sống và không để thiết kế giống mẫu ghép sẵn.
```

**Mẫu trích xuất một chữ ký**

```text
Trích xuất nét bút cốt lõi của chữ ký [vị trí/số thứ tự/tên phong cách] trong ảnh đầu vào và tạo một ảnh chỉ có chữ ký đó.

Yêu cầu:
- Chỉ giữ phần chữ ký, không tạo thẻ áp phích, tiêu đề, tiêu đề phụ hoặc phần giải thích
- Giữ nét bắt đầu, cách nối nét, độ nghiêng cấu trúc, nét khô và nhịp kết thúc của chữ ký gốc
- Nền trắng hoặc trắng ngà rất nhạt
- Căn chữ ký ở giữa, kích thước đủ lớn, chừa khoảng trống sạch quanh viền
- Mực đen hoặc đen tuyền, có đầu bút tự nhiên, vết mực nhẹ và thay đổi lực tay chân thực
- Xuất ảnh chữ ký thuần độ phân giải cao, phù hợp để luyện viết, sưu tầm hoặc dùng cho thiết kế tiếp theo

Tránh:
Không tạo thêm nhiều chữ ký, không biến thành bảng trưng bày phông chữ, không thêm viền hoặc họa tiết trang trí, không làm yếu nét bút ban đầu.
```

**Mẫu sơ đồ hướng dẫn luyện viết chữ ký**

```text
Dựa trên [ảnh chữ ký/phong cách chữ ký] đầu vào, tạo sơ đồ hướng dẫn luyện viết chữ ký.

Mục tiêu:
Giúp người dùng luyện chữ ký này bằng bút đen trên giấy; phân tích đường đi, thứ tự, lực tay và nhịp điệu của từng nét.

Bố cục hình ảnh:
- Sơ đồ hướng dẫn dọc hoặc bảng luyện viết ngang
- Đặt mẫu chữ ký hoàn chỉnh ở phía trên
- Ở giữa, chia các nét chính thành 8-12 bước
- Mỗi bước thể hiện nét hiện tại, mũi tên chỉ hướng chuyển động, điểm bắt đầu, điểm dừng và điểm kết thúc
- Phía dưới trình bày đường viết liền hoàn chỉnh và 3-5 dòng gợi ý luyện tập

Yêu cầu phân tích:
- Mỗi nét phải tương ứng với nét bút thực tế trong chữ ký gốc
- Đánh dấu viết nhanh, viết chậm, nhấn mạnh, nhấc nhẹ, đổi hướng, móc ngược, nét khô và nét kéo dài
- Thể hiện tiến trình từ khung nét cơ bản đến chữ ký hoàn chỉnh
- Giải thích cách nối các chữ và sự thay đổi trọng tâm tổng thể

Phong cách hình ảnh:
Nền giấy trắng, nét viết tay màu đen, mũi tên hướng dẫn màu đỏ hoặc xanh, đánh số rõ ràng, cảm giác như vở luyện viết.

Tránh:
Không chỉ đưa ảnh thành phẩm, không lược bỏ nét quan trọng, không vẽ các bước thành nét nguệch ngoạc ngẫu nhiên, không tạo mẫu luyện thư pháp không liên quan.

**Mẫu tiếng Việt: áp phích chữ mang tính khái niệm**

```text
Tạo một áp phích chữ mang tính khái niệm cao cấp, hoàn thiện chỉn chu cho tiêu đề sau; chỉ tạo một ảnh duy nhất.

Tiêu đề: “[tiêu đề/từ/cụm từ ngắn]”

Chỉ tạo một áp phích. Không tạo moodboard, bố cục dạng lưới, bảng trình bày, mô hình mẫu, phần giải thích, bản phác thảo quy trình hoặc nhãn mẫu.

Tiêu đề phải là cấu trúc hình ảnh chủ đạo của áp phích: kích thước lớn, dễ đọc, giàu sức biểu đạt và viết chính xác hoàn toàn. Không dịch, rút gọn, thay thế hoặc viết sai tiêu đề. Không thêm đoạn chữ lớn dễ đọc nào khác.

Hãy phân tích sâu ý nghĩa, cảm xúc, sắc thái văn hóa, liên tưởng biểu tượng, sức căng tâm lý và nhịp điệu thị giác của tiêu đề. Chuyển cách diễn giải đó thành một ẩn dụ hình ảnh mạnh mẽ.

Chữ là nhân vật chính. Thiết kế hình dạng chữ riêng; độ đậm, chiều rộng, độ tương phản, khoảng cách, nhịp điệu, biến dạng, khoảng âm, chất liệu viền và kết cấu mực phải thể hiện thần thái của tiêu đề. Chữ cần trông được thiết kế có chủ đích, không giống phông mặc định.

Nếu tiêu đề nói về một nhân vật nổi tiếng, hãy đưa ảnh chân dung biên tập cỡ lớn hoặc hình bán thân vào làm điểm nhấn chính, chiếm khoảng 40%-70% bố cục. Nhân vật phải tương tác với chữ: chồng lên chữ cái, xuất hiện từ bên trong, được chữ bao khung, đổ bóng lên chữ, phá vỡ nét chữ hoặc ẩn một phần phía sau chữ.

Với tiêu đề trừu tượng hoặc không nói về con người, chỉ dùng nhân vật, phong cảnh, vật thể hoặc bối cảnh không khí khi chúng giúp tăng cường ý nghĩa. Các thành phần này phải tương tác với chữ và làm sâu sắc thêm ý tưởng, không chỉ đóng vai trò trang trí.

Dùng bảng màu giới hạn 4-6 màu phù hợp chủ đề: màu nền chính, màu chữ chính, tông màu nhân vật/phong cảnh, màu nhấn cảm xúc, màu phụ dịu và màu tinh tế cho kết cấu giấy/mực.

Phong cách bố cục: áp phích biên tập cao cấp, thiết kế đồ họa đạt chuẩn trưng bày bảo tàng, tỷ lệ ấn tượng, phân cấp mạnh, ít thành phần, khoảng trống có chủ ý, mảng màu phẳng táo bạo, cắt khung sắc nét, hạt in lụa/in thạch bản/in risograph, thớ giấy, khuyết điểm mực tinh tế và sức căng thị giác tinh luyện.

Tránh hiệu ứng chữ chung chung, chữ 3D bóng loáng, biểu tượng ngẫu nhiên, hình ảnh chân thực kiểu ảnh kho, ghép ảnh lộn xộn, làm cũ quá mức, hình ảnh du lịch sáo mòn, logo chính thức, sao chép khẩu hiệu, bắt chước thẩm mỹ chiến dịch, chữ không liên quan và chữ viết sai.

```

**Mẫu áp phích chân dung phơi sáng kép bằng mực tàu**

```text
Tạo áp phích chân dung phơi sáng kép bằng mực tàu cho [nhân vật/nhân vật hư cấu/nhà sáng lập thương hiệu/vận động viên].
Khung hình: dọc tỷ lệ 9:16, bố cục áp phích điện ảnh cao cấp.
Cấu trúc chủ thể:
- Nửa trên: phóng lớn đầu, đường nét khuôn mặt hoặc bóng bán thân của nhân vật để tạo điểm nhận diện mạnh nhất.
- Nửa giữa và phía dưới: toàn thân hoặc bán thân của cùng nhân vật, ở tư thế [đứng/đang hoạt động/nhìn vào máy quay].
- Bên trong bóng nhân vật: kết hợp [bối cảnh chính], [vật thể biểu tượng], [đoạn kể chuyện] và [kết cấu môi trường] để tạo câu chuyện phơi sáng kép.
Kết nối thị giác: dùng mây sương, hiệu ứng loang mực, viền nét khô, khoảng âm và chuyển sắc sáng tối dịu để nối bóng phía trên, phần ghép bên trong và chủ thể phía dưới thành một dòng thị giác từ trên xuống.
Phong cách: mỹ học mực tàu phương Đông kết hợp chất điện ảnh chân thực; tiết chế, cao cấp, nhiều khoảng trống, nhiều lớp nhưng không rối.
Chữ: có thể thêm [tiêu đề/tên/cụm từ ngắn], phải ít, dễ đọc và giống dấu đề trên áp phích chứ không phải chú thích đồ họa thông tin.
Ràng buộc: không ghép cứng, không lấp kín nền, không dùng hiệu ứng võ hiệp rẻ tiền, không sao chép bố cục áp phích có thật, không để bóng nhân vật và chủ thể tranh giành điểm nhấn.
Đầu ra: hình hoàn thiện ở cấp độ áp phích, chủ thể rõ nét, viền mực tự nhiên, yếu tố kể chuyện gắn chặt với danh tính nhân vật.
```

**Mẫu áp phích phổ biến kiến thức tự nhiên**

```text
Bạn là hệ thống tạo áp phích phổ biến kiến thức tự nhiên cao cấp, hướng đến việc tạo áp phích theo phong cách Apple Keynote về động vật quý hiếm, côn trùng, bò sát, động vật có vú hoặc các sinh vật ít phổ biến khác.

Định hướng hình ảnh tổng thể:
Tạo áp phích phổ biến kiến thức cao cấp, khổ dọc 9:16, theo ngôn ngữ thiết kế tối giản, trắng sạch, hiện đại như áp phích ra mắt sản phẩm của Apple. Nền trắng hoặc chuyển sắc xám trắng rất nhạt, giữ nhiều khoảng trống. Thiết kế tổng thể cần có vẻ cao cấp, tiết chế, tạo ấn tượng thị giác và mang tinh thần trưng bày khoa học.

Nguyên tắc thiết kế cốt lõi:
1. Phóng lớn con vật làm chủ thể để trở thành tâm điểm thị giác mạnh nhất.
2. Chủ thể cần có khối nổi rõ, chất liệu chân thực, chi tiết độ phân giải cao và ánh sáng studio mềm.
3. Thông tin trên áp phích ít nhưng chính xác, tránh chật chội.
4. Không dùng thẻ, khung bo góc, nền hoa văn phức tạp, chất giấy vàng nhạt hoặc viền trang trí kiểu đồ họa thông tin truyền thống.
5. Khu vực thông tin phía dưới chỉ có bốn cột tối giản gồm biểu tượng + tiêu đề + mô tả ngắn, ngăn cách bằng đường dọc mảnh.
6. Trình bày chữ như hình ảnh sự kiện ra mắt cao cấp: tiêu đề rất lớn, tiêu đề phụ tiết chế, nội dung nhỏ nhưng rõ.
7. Từ khóa phong cách: cảm hứng Apple, biên tập cao cấp, nền trắng tinh, chủ thể nổi bật, kiểu chữ sạch, đồ họa thông tin tối giản, áp phích khoa học cao cấp.

Bố cục hình ảnh:
Góc trên bên trái là vùng tiêu đề:
Tiêu đề tiếng Việt cỡ lớn: {tên loài bằng tiếng Việt}
Tiêu đề phụ tiếng Việt: {một câu giới thiệu hấp dẫn về loài}
Một đường ngang ngắn, mảnh
Tên tiếng Anh: {tên loài bằng tiếng Anh}
Thông tin phân bố: khu vực phân bố chính {khu vực}

Khu vực giữa và nửa dưới là hình ảnh chủ thể:
Tạo hình {tên loài bằng tiếng Việt} siêu nét, chân thực và có khối nổi rõ.
Chủ thể chiếm 50% đến 70% diện tích thị giác.
Tư thế cần có tính trưng bày, thể hiện sức mạnh hoặc dễ nhận diện.
Giữ nền trắng, không thêm môi trường tự nhiên phức tạp.
Có thể giữ lại một vài vật đỡ cần thiết như cành cây, đá, tuyết, cát hoặc vỏ cây, nhưng phải tối giản.
Tạo bóng đổ chân thực để chủ thể nổi bật như trong ảnh chụp sản phẩm cao cấp.

Khu vực thông tin phía dưới:
Dùng bốn cột thông tin tối giản để trình bày kiến thức.
Mỗi cột gồm:
Một biểu tượng nét mảnh
Một tiêu đề nhỏ có màu
Một đoạn ngắn từ 1 đến 3 dòng
Ngăn cách các cột bằng đường dọc màu xám nhạt thật mảnh.
Không dùng khung thẻ, nền bo góc hoặc mảng màu lớn.

Bốn cột thông tin:
Cột 1:
Tiêu đề: {tiêu đề đặc điểm nổi bật 1}
Mô tả: {mô tả ngắn đặc điểm nổi bật 1}

Cột 2:
Tiêu đề: {tiêu đề đặc điểm nổi bật 2}
Mô tả: {mô tả ngắn đặc điểm nổi bật 2}

Cột 3:
Tiêu đề: {tiêu đề đặc điểm nổi bật 3}
Mô tả: {mô tả ngắn đặc điểm nổi bật 3}

Cột 4:
Tiêu đề: {tiêu đề đặc điểm nổi bật 4}
Mô tả: {mô tả ngắn đặc điểm nổi bật 4}

Câu tổng kết phía dưới cùng:
Căn giữa một câu tổng kết chữ nhỏ màu xám ở cạnh dưới:
{một câu tổng kết kiến thức cao cấp, tiết chế và dễ nhớ}

Kiểu chữ và trình bày:
Tiêu đề tiếng Việt dùng chữ đen cỡ lớn, cao cấp, vững chãi và giàu sức biểu đạt.
Tiêu đề phụ màu xám, cỡ vừa, giãn chữ nhẹ.
Tên tiếng Anh màu xám, cỡ nhỏ, đơn giản và hiện đại.
Nội dung dùng kiểu chữ tiếng Việt hiện đại, rõ ràng và dễ đọc.
Mọi phần chữ đều cần đủ khoảng trống để bố cục thông thoáng.

Quy chuẩn màu sắc:
Nền: trắng tinh, xám rất nhạt hoặc chuyển sắc ánh sáng mềm nhẹ.
Tiêu đề chính: đen hoặc xám than đậm.
Tiêu đề phụ và nội dung: xám trung tính.
Bốn tiêu đề thông tin phía dưới có thể dùng màu nhấn bão hòa thấp:
nâu ấm, xanh lạnh, xanh ngọc, tím hoặc cam.
Chỉ dùng màu cho biểu tượng và tiêu đề nhỏ, không tô thành mảng lớn.

Chất lượng hình ảnh:
Độ nét 2K, chi tiết rõ, chủ thể sắc nét, ánh sáng và bóng đổ chân thực.
Kết cấu chủ thể phải đáng tin cậy, chẳng hạn lông, vảy, mai, nếp da, lông vũ hoặc hoa văn.
Tránh hình biến dạng, chi sai, giải phẫu sai, chủ thể mờ, chất liệu phủ kém, cảm giác nhựa hoặc hoạt hình.

Điều cần tránh:
Không dùng nền giấy cũ màu vàng nhạt.
Không dùng lưới đồ họa thông tin phức tạp.
Không dùng thẻ bo góc.
Không dùng viền dày.
Không dùng hình trang trí chiếm diện tích lớn.
Không thêm logo không liên quan.
Không thêm chữ nhỏ thừa.
Không thu nhỏ chủ thể.
Không để chữ che chủ thể.
Không làm khu vực thông tin phía dưới quá chật.
Không dùng phong cách tài liệu thiếu nhi, hoạt hình hoặc bảng trưng bày chất lượng thấp.

Đầu ra cuối cùng:
Tạo áp phích phổ biến kiến thức tự nhiên khổ dọc 9:16, cao cấp, sạch sẽ, có sức hút thị giác mạnh và mang phong cách Apple.
```

**Mẫu JSON nâng cao (khuyến nghị dùng khi gọi Agent)**

```json
{
  "type": "Movie Poster",
  "theme": "Interstellar Journey",
  "typography": {
    "headline": "BEYOND STARS",
    "subheading": "A New Era Begins",
    "layout": "Centered, bold cinematic font, bottom heavy"
  },
  "visuals": {
    "subject": "Silhouette of an astronaut looking at a glowing nebula",
    "style": "Cinematic lighting, high contrast, dramatic shadows",
    "color_palette": "Deep space blue, glowing orange accents"
  },
  "vibe": "Epic, mysterious, vast"
}
```

**Hướng dẫn tránh lỗi**

- **Nêu rõ hình ảnh chủ đạo**: mô tả chính xác chủ thể, đừng chỉ yêu cầu “làm một áp phích” rồi mong có kết quả xuất sắc.
- **Chốt nội dung chữ**: ghi chính xác tiêu đề chính và phụ để mô hình không tự ý thêm thắt hoặc bịa nội dung khó hiểu.
- **Xác định cấu trúc áp phích thể thao trước**: áp phích chiến dịch thể thao dễ thành ảnh ghép lộn xộn; hãy chọn “một hình chủ đạo / bộ ba tranh / áp phích dữ liệu kiểu graffiti” trước khi mô tả chủ thể và câu chữ.
- **Dùng đạo cụ làm khung bố cục**: nên chỉ định góc, tỷ lệ và vị trí của vợt, tạ, giày thể thao; nếu không, mô hình có thể biến chúng thành vật trang trí nền thông thường.
- **Khóa tiêu đề của áp phích chữ trước**: yêu cầu rõ “tiêu đề phải viết hoàn toàn chính xác và trở thành hình ảnh chủ đạo”, nếu không ảnh có thể đẹp nhưng chữ không đọc được.
- **Tạo tương tác giữa hình và chữ**: nhân vật, vật thể hoặc bối cảnh nên lồng vào, che một phần, xuyên qua hoặc nâng đỡ hình dạng chữ; chỉ đặt cạnh nhau sẽ giống ảnh trang trí.
- **Tránh biến thành moodboard**: yêu cầu rõ chỉ tạo một áp phích để tránh bảng nhiều phương án, bản quy trình hoặc ảnh ghép mẫu.
- **Phóng lớn chủ thể**: trong áp phích khoa học tự nhiên, chủ thể động vật phải chiếm 50%-70% diện tích thị giác để trở thành điểm nhấn mạnh nhất.
- **Tiết chế thông tin**: theo nguyên tắc “ít nhưng chính xác”, chỉ dùng bố cục tối giản bốn cột ở phía dưới để tránh chật chội và rối mắt.
- **Giữ phong cách thống nhất**: tuân theo mỹ học tối giản kiểu Apple, dùng nền trắng, trình bày sạch và ánh sáng studio mềm; tránh thẻ và khung bo góc kiểu đồ họa thông tin truyền thống.

<a name="tpl-product"></a>

### Sản phẩm và thương mại điện tử

**Mẫu cơ bản**

```text
Tạo ảnh sản phẩm chính cho cửa hàng trực tuyến [tên sản phẩm], nêu bật [ưu điểm 1] và [ưu điểm 2].
Bối cảnh: [chụp studio nền đơn sắc/khung cảnh phong cách sống], góc máy: [cận cảnh/bán thân/toàn cảnh].
Chi tiết chất liệu: [từ khóa chất liệu], ánh sáng: [ánh sáng mềm/ánh sáng bên/ánh sáng viền].
Thành phần bổ sung: [nhãn giá/biểu tượng ưu điểm/nội dung khuyến mãi].
Đầu ra: ảnh giới thiệu sản phẩm có thể dùng trực tiếp trên sàn thương mại điện tử.
```

**Mẫu báo cáo tư vấn mỹ phẩm cá nhân hóa**

```text
Bạn là chuyên gia tư vấn mỹ phẩm, hệ thống phân tích khuôn mặt và hệ thống thiết kế hình ảnh thương hiệu.
Mục tiêu: dựa trên [ảnh selfie của người dùng] và [thương hiệu son môi], tạo báo cáo đồ họa thông tin dọc về gợi ý son, gồm “phân tích + đề xuất + thử màu + gợi ý hoàn cảnh sử dụng”.

Thông tin đầu vào:
Ảnh người dùng: [ảnh selfie]
Thương hiệu: [Dior / YSL / Armani / Chanel / TF / thương hiệu khác]
Phong cách ưa thích (không bắt buộc): [đi làm / dịu dàng / nổi bật / giàu không khí / ưu tiên tôn da]
Số lượng gợi ý: [3-5]

Phân tích:
- Xác định tông da: lạnh / ấm / trung tính (bao gồm độ sáng)
- Nhận định thần thái: thanh lạnh / dịu dàng / rạng rỡ / trong trẻo / trưởng thành
- Đánh giá đặc điểm môi: độ đậm nhạt màu môi, dáng môi và sắc độ phù hợp
- Đưa ra câu kết luận: “Phù hợp hơn với son [nhóm màu] + [độ bão hòa] + [chất son]”

Gợi ý:
Chọn [3-5] màu son khác biệt từ [thương hiệu], mỗi màu gồm:
- Tên màu
- Nhãn nhóm màu
- Hiệu ứng khi đánh lên môi
- Hoàn cảnh sử dụng phù hợp

Hình ảnh thương hiệu:
Dựa trên [thương hiệu] để tự tạo sắc thái hình ảnh phù hợp; chỉ dùng một lượng nhỏ màu nhấn của thương hiệu cho tiêu đề, đường mảnh, biểu tượng nhỏ và chi tiết điểm xuyết.
Ví dụ: YSL tương phản đen-vàng, Dior ánh sáng Pháp dịu trên nền xám trắng, Armani bề mặt mờ ít bão hòa, Chanel tối giản đen-trắng, TF sắc thái điện ảnh tông tối.

Bố cục:
Góc trên trái: ảnh người dùng + phân tích tông da
Góc trên phải: một câu kết luận phân tích
Ở giữa: bảng thử 3-5 màu son trên cùng một khuôn mặt, mỗi cột là một màu
Phía dưới: lời khuyên cá nhân có cơ sở

Yêu cầu hình ảnh:
Phong cách biên tập mỹ phẩm cao cấp, trình bày thông tin có cấu trúc, chất da chân thực, màu môi chính xác, ánh sáng thống nhất, khổ dọc 9:16, độ phân giải 8K.
```

**Mẫu JSON nâng cao (khuyến nghị dùng khi gọi Agent)**

```json
{
  "type": "E-commerce Hero Image",
  "product": {
    "name": "Noise Cancelling Headphones",
    "material": "Matte black finish with metallic accents",
    "angle": "3/4 profile, floating slightly"
  },
  "setting": {
    "background": "Minimalist studio setup, soft gray gradient",
    "lighting": "Softbox overhead, sharp rim light on edges"
  },
  "copywriting": {
    "badges": ["NEW", "$299"],
    "slogan": "Silence the World"
  },
  "constraints": "Commercial photography quality, hyper-realistic textures"
}
```

**Hướng dẫn tránh lỗi**

- **Chất liệu và ánh sáng là cốt lõi**: kết hợp từ khóa về chất liệu (như “bề mặt mờ”) và ánh sáng (như “ánh sáng viền”); ảnh sản phẩm thiếu ánh sáng sẽ trông rẻ tiền.
- **Đừng phủ kín hình bằng khuyến mãi**: chỉ đưa 1-2 câu nội dung chính (như “Ra mắt sản phẩm mới”); quá nhiều chữ sẽ phá hỏng bố cục.
- **Phân tích trước khi tạo ảnh**: với gợi ý mỹ phẩm, hãy yêu cầu mô hình phân tích tông da, thần thái và đặc điểm môi trước, rồi mới đối chiếu với màu son.
- **Chỉ dùng thương hiệu làm điểm nhấn**: thể hiện sắc thái thương hiệu qua đường mảnh, màu nhấn, phong cách chữ và ánh sáng; không phủ kín ảnh bằng logo hoặc mảng màu lớn.
- **Giữ cùng một khuôn mặt trong bảng thử màu**: nêu rõ “cùng một khuôn mặt, chỉ thay đổi màu son”, nếu không mô hình có thể tạo mỗi màu son trên một người khác nhau.

<a name="tpl-brand"></a>

### Thương hiệu và logo

**Mẫu cơ bản**

```text
Thiết kế phương án hình ảnh thương hiệu cho [tên thương hiệu].
Từ khóa thương hiệu: [từ khóa 1], [từ khóa 2], [từ khóa 3].
Bao gồm: hướng logo [hình học/chữ cách điệu/biểu tượng], họa tiết phụ, màu chính và màu phụ, ví dụ ứng dụng.
Phong cách: [hiện đại/cao cấp/thân thiện], ngành: [ngành], đối tượng: [khách hàng].
Đầu ra: hình ảnh nhận diện thương hiệu có phong cách thống nhất.
```

**Mẫu bộ nhận diện thương hiệu hoàn chỉnh**

```text
Bạn là giám đốc sáng tạo tại một công ty thương hiệu hàng đầu; mục tiêu là xây dựng bộ nhận diện hoàn chỉnh cho [doanh nghiệp/sản phẩm], bao gồm logo, màu sắc, kiểu chữ, giọng điệu và các điểm tiếp xúc ứng dụng.

Thông tin đầu vào:
Tên doanh nghiệp: [tên]
Mô tả doanh nghiệp: [giải thích trong một câu]
Ngành: [ngành]
Khách hàng mục tiêu: [mô tả chi tiết]
Đối thủ cạnh tranh: [3-5 đối thủ]
Cá tính thương hiệu: [5 từ khóa]
Cảm xúc muốn gợi lên: [tin cậy / hào hứng / sang trọng / gần gũi / mạnh mẽ / khác]
Nhận diện hình ảnh yêu thích: [3 ví dụ]
Nhận diện hình ảnh không thích: [3 phản ví dụ]
Ngân sách thiết kế: [miễn phí / trả phí]

Vui lòng cung cấp:
1. Nền tảng chiến lược thương hiệu: nguyên mẫu thương hiệu, cam kết cốt lõi, định vị, điểm khác biệt và từ khóa độc nhất.
2. Ý tưởng logo: đưa ra 3-5 hướng logo hoàn toàn khác nhau; giải thích ý tưởng hình ảnh cốt lõi, ngôn ngữ hình khối, ý nghĩa biểu tượng, định hướng kiểu chữ, cảm xúc ban đầu và điểm tiếp xúc phù hợp.
3. Hệ màu: màu chính, màu phụ, màu nhấn, màu trung tính, mã HEX, giải thích tâm lý màu sắc, quy tắc sử dụng và các cách phối cần tránh.
4. Hệ kiểu chữ: phông tiêu đề, phông nội dung, phông nhấn, thứ bậc cỡ chữ, giãn chữ, chiều cao dòng và phương án thay thế miễn phí.
5. Điểm tiếp xúc ứng dụng: ví dụ trên danh thiếp, biểu tượng ứng dụng, trang chủ, mẫu mạng xã hội, biển quảng cáo hoặc bao bì.
6. Quy tắc thương hiệu: 3 nguyên tắc cốt lõi tuyệt đối không được phá vỡ.

Hình thức đầu ra:
Cẩm nang thương hiệu có cấu trúc để bất kỳ nhà thiết kế, lập trình viên hoặc công cụ AI nào cũng có thể hiểu và tái sử dụng trong 10 phút.
```

**Mẫu bảng hình ảnh hệ thống điểm tiếp xúc thương hiệu**

```text
Tạo bảng hình ảnh cao cấp về hệ thống điểm tiếp xúc cho [tên thương hiệu]; đây không phải một áp phích riêng lẻ mà là phần trình bày đầy đủ các ứng dụng thương hiệu.

Định vị thương hiệu: [ngành/phong cách sống/nhóm sản phẩm]
Thần thái cốt lõi: [từ khóa 1], [từ khóa 2], [từ khóa 3]
Bối cảnh hình ảnh chủ đạo: [sản phẩm/dịch vụ/trải nghiệm chính], đặt trên [bề mặt chất liệu/không gian], thể hiện bằng [ánh sáng] và [góc máy].

Hệ thống điểm tiếp xúc phải bao gồm:
- Ảnh chủ đạo của sản phẩm
- Vật phẩm thương hiệu như hộp, túi xách, cốc, nhãn, nhãn dán hoặc tem niêm phong
- Thẻ thực đơn, bảng giá và mẫu trình bày chữ cỡ nhỏ
- Bối cảnh phong cách sống hoặc khoảnh khắc người dùng sử dụng sản phẩm
- Cách áp dụng thống nhất màu sắc, kiểu chữ và ngôn ngữ đồ họa trên các điểm tiếp xúc

Ngôn ngữ thiết kế:
[tối giản hiện đại/khoảng trống kiểu Nhật/biên tập xa xỉ/thương hiệu công nghệ], màu chính [màu], màu phụ [màu], nhiều khoảng trống, chất liệu tinh tế, bóng đổ chân thực, chữ nhỏ rõ và dễ đọc.

Yêu cầu bố cục:
Giống trang đề xuất của một đơn vị thiết kế hàng đầu; các điểm tiếp xúc được sắp xếp ngăn nắp nhưng không cứng nhắc, hình ảnh chính nổi bật nhất, vật phẩm phụ có thứ bậc rõ ràng, tổng thể thể hiện hệ thống thương hiệu hoàn chỉnh và có thể triển khai thực tế.

Ràng buộc:
Không chỉ tạo một logo; không dồn mọi vật phẩm thành ảnh ghép lộn xộn; không dùng chữ lỗi ngẫu nhiên; không để bao bì, thực đơn và nhãn dán lệch phong cách với nhau.
```

**Mẫu quảng cáo sản phẩm theo phong cách thương hiệu**

```text
Đầu vào: [ảnh sản phẩm], [nhận diện thương hiệu], [định dạng đầu ra]

GIAI ĐOẠN 1 / ĐỊNH HƯỚNG: mô tả [nhận diện thương hiệu] trong 2 dòng, gồm bảng màu, chất liệu, ánh sáng và cảm xúc.
GIAI ĐOẠN 2 / TÍCH HỢP: đặt [sản phẩm] vào thế giới thương hiệu này; sản phẩm cần phù hợp với thần thái thương hiệu và ngôn ngữ môi trường.
GIAI ĐOẠN 3 / ĐỊNH DẠNG: chỉ định [định dạng đầu ra], chẳng hạn ảnh chủ đạo, quảng cáo vuông, story dọc hoặc ảnh đầu trang cửa hàng.
GIAI ĐOẠN 4 / DẤU ẤN: thêm [yếu tố thương hiệu], chẳng hạn hạt ảnh, bóng đổ, kết cấu phủ, biểu tượng bao bì hoặc khung họa tiết.

Biến số:
[nhận diện thương hiệu] / [sản phẩm] / [định dạng đầu ra] / [yếu tố thương hiệu]

Mục tiêu: khi thay các sản phẩm khác nhau trong cùng một thương hiệu, thế giới hình ảnh vẫn nhất quán; ảnh quảng cáo vẫn có chủ thể rõ ràng và chất lượng thương mại.
```

**Mẫu đồ họa thông tin dạng truyện tranh về cá tính thương hiệu**

```text
Dựa trên [logo/hình ảnh thương hiệu] đã tải lên, tạo đồ họa thông tin truyện tranh khổ dọc 4:5 với tiêu đề “Thương hiệu này mang lại cảm giác gì”.
Mục tiêu: biến thương hiệu thành một nhân vật có cá tính dễ cảm nhận, đồng thời giải thích cách thương hiệu giao tiếp, hành động, bán hàng, phản hồi đối thủ và xử lý lời phê bình.
Quy tắc cốt lõi: mọi màu sắc, trang phục, tư thế, giọng điệu và yếu tố đồ họa đều xuất phát từ logo và từ khóa thương hiệu.
Hình ảnh chính: nhân vật đại diện thương hiệu, trang phục, biểu cảm và tư thế thể hiện [thần thái thương hiệu].
Bố cục xung quanh: 6-8 khung truyện nhỏ; mỗi khung có tiêu đề ngắn, hành động, bong bóng thoại hoặc độc thoại nội tâm.
Mô-đun bổ trợ: giọng điệu, mức năng lượng, hành vi xã hội, phong cách giao tiếp, NÊN / KHÔNG NÊN.
Phong cách: truyện tranh kết hợp đồ họa thông tin biên tập, biểu đạt mạnh nhưng vẫn cao cấp, câu chữ ngắn gọn, bố cục phân tầng phong phú.
Ràng buộc: không dùng từ ngữ tiếp thị chung chung, không để vùng trống và không biến cá tính thương hiệu thành nhân vật ngẫu nhiên.
```

**Mẫu JSON nâng cao (khuyến nghị dùng khi gọi Agent)**

```json
{
  "type": "Brand Identity Design",
  "brand": {
    "name": "Nova Dynamics",
    "industry": "AI Technology",
    "keywords": ["Innovative", "Minimalist", "Trustworthy"]
  },
  "deliverables": [
    "Logo mark (geometric fusion of a neural network node and a star)",
    "Color palette (Electric Blue and Pure White)",
    "Business card mockup"
  ],
  "style": "Modern corporate, flat vector, high contrast",
  "constraints": "No gradients, scalable vector style, clean white background for logo"
}
```

**Hướng dẫn tránh lỗi**

- **Tinh giản**: xác định từ khóa thương hiệu trước rồi mới yêu cầu tạo hình để kết quả thống nhất hơn. Đừng yêu cầu vẽ “một con rồng phun lửa quấn quanh cột Vạn Lý Trường Thành kèm tia sét”; đó là tranh minh họa, không phải logo.
- **Quy định nền**: nhấn mạnh “nền trắng tinh (Pure White Background)” để thuận tiện tách nền sau này.
- **Làm chiến lược thương hiệu trước khi vẽ logo**: thiếu đối tượng mục tiêu, đối thủ và cảm xúc mong muốn sẽ khiến logo chỉ đẹp mà không giải thích được vì sao phù hợp.
- **Xem logo trong bối cảnh ứng dụng**: yêu cầu trình bày cùng danh thiếp, biểu tượng ứng dụng, trang web, biển quảng cáo và các điểm tiếp xúc khác để nhanh chóng phát hiện vấn đề khó đọc khi thu nhỏ hoặc không phù hợp với bố cục ngang/dọc.
- **Ghi rõ quy tắc cần tránh trong cẩm nang thương hiệu**: ngoài màu sắc và phông chữ, cần nêu cả “không nên sử dụng như thế nào” để các ứng dụng sau này giữ được tính nhất quán.

<a name="tpl-architecture"></a>

### Kiến trúc và không gian

**Mẫu cơ bản**

```text
Tạo ảnh phối cảnh thiết kế [loại không gian], với công năng [mục đích sử dụng].
Phong cách: [tối giản hiện đại/công nghiệp/Trung Hoa đương đại], chất liệu: [gỗ/đá/kim loại/kính].
Cấu trúc không gian: [mở/phân khu], lối di chuyển: [mô tả lối đi chính].
Ánh sáng: [ánh sáng tự nhiên/phương án chiếu sáng nhân tạo], thời điểm: [ban ngày/cảnh đêm].
Đầu ra: hình dựng không gian kiến trúc chân thực.
```

**Mẫu JSON nâng cao (khuyến nghị dùng khi gọi Agent)**

```json
{
  "type": "Architectural Visualization",
  "space": {
    "type": "Modern Cabin Interior",
    "function": "Living room",
    "materials": "Exposed concrete, large floor-to-ceiling glass, warm timber accents"
  },
  "environment": "Nestled in a dense, snowy pine forest visible through the glass",
  "camera": {
    "angle": "Eye-level perspective, wide-angle lens",
    "lighting": "Golden hour, warm interior lights glowing, cool blue ambient light outside"
  },
  "render_quality": "Unreal Engine 5 style, hyper-realistic, 8k resolution, ray tracing"
}
```

**Hướng dẫn tránh lỗi**

- **Kiểm soát góc nhìn**: phối cảnh sai là lỗi dễ gặp nhất trong ảnh kiến trúc. Dùng “phối cảnh tầm mắt (Eye-level perspective)” để hạn chế lỗi này.
- **Tương phản nóng-lạnh**: kết hợp ánh sáng lạnh bên ngoài (xanh/xám) với ánh sáng ấm bên trong (vàng/cam) là cách hiệu quả để nâng cảm giác cao cấp của không gian.

<a name="tpl-photo"></a>

### Nhiếp ảnh và phong cách chân thực

**Mẫu cơ bản**

```text
Chủ thể ảnh: [người/vật thể/cảnh phố], bối cảnh: [địa điểm].
Phong cách thông số chụp: [35mm/85mm], [độ sâu trường ảnh nông/sâu], [phóng sự/điện ảnh].
Ánh sáng: [tự nhiên/đèn neon ban đêm/ngược sáng], cảm xúc: [từ khóa cảm xúc].
Yêu cầu chi tiết: [chất da/chất liệu/hạt ảnh].
Đầu ra: hình ảnh theo phong cách nhiếp ảnh chân thực cao.
```

**Mẫu JSON nâng cao (khuyến nghị dùng khi gọi Agent)**

```json
{
  "type": "Hyper-realistic Photography",
  "subject": {
    "description": "A weary 30-year-old barista wiping a coffee cup",
    "details": "Subtle sweat on forehead, detailed skin pores, wearing a denim apron"
  },
  "setting": "Dimly lit vintage cafe, rain visible through the window behind",
  "camera_specs": {
    "gear": "Shot on Sony A7R IV, 50mm lens",
    "aperture": "f/1.4 (shallow depth of field, background completely blurred)",
    "lighting": "Cinematic lighting, neon sign reflecting on wet window, soft rim light on subject's hair"
  },
  "film_aesthetic": "Kodak Portra 400 emulation, subtle film grain"
}
```

**Mẫu ảnh phóng sự chân thực về khoảnh khắc bất ngờ trên phố**

```text
Tạo ảnh phóng sự dọc bằng điện thoại về [sự cố/khoảnh khắc đời thường] xảy ra ở [đường phố/địa điểm ngoài trời].
Chủ thể: [vật thể/hành động của nhân vật/dấu vết tại hiện trường], phải thể hiện trạng thái chất liệu chân thực như [chất lỏng loang ra/đá tan vương vãi/giấy nhăn/bụi li ti].
Bối cảnh: [chất liệu mặt đất/tường/yếu tố đường phố], giữ lại sự lộn xộn tự nhiên và dấu vết sinh hoạt.
Ánh sáng: [nắng gắt giữa trưa/ánh sáng khuếch tán ngày âm u/đèn đường ban đêm], bóng đổ đúng hướng thực tế; có thể thêm [bóng người/bóng biển báo/bóng cây].
Góc máy: góc nhìn cầm điện thoại, hơi chụp từ trên xuống hoặc góc thấp, bố cục tự nhiên như ảnh chụp nhanh tại hiện trường.
Chất ảnh: phong cách ảnh thô chưa chỉnh sửa, màu sắc tự nhiên, kết cấu chân thực, nhiều chi tiết.
Ràng buộc phủ định: không minh họa, hoạt hình, CGI, ánh sáng studio, vẻ sạch sẽ quá mức, bố cục quá trau chuốt, chất lỏng giả, vật thể lơ lửng, chữ thương hiệu, hình mờ hoặc cảm giác thiết kế áp phích.
Đầu ra: một ảnh phóng sự đời thường đáng tin cậy.
```

**Hướng dẫn tránh lỗi**

- **Thêm một chút khuyết điểm**: người do AI tạo thường quá hoàn hảo nên trông giả. Thêm “kết cấu lỗ chân lông”, “tàn nhang” hoặc “hạt phim nhẹ” để tăng cảm giác chân thực.
- **Dùng thông số cụ thể**: dùng `f/1.4` thay cho “độ sâu trường ảnh nông”, dùng `50mm` thay cho “ảnh bán thân”; mô hình thường phản hồi tốt với cách mô tả này.
- **Mô tả rõ điều chưa hoàn hảo**: ghi “gạch đá thô ráp, đá lạnh rơi vãi, bóng tự nhiên, cảm giác cầm máy hơi rung” sẽ ổn định hơn chỉ ghi “chân thực”.

<a name="tpl-illustration"></a>

### Minh họa và nghệ thuật

**Mẫu cơ bản**

```text
Tạo tranh minh họa về [chủ đề], nhân vật hoặc chủ thể chính là [nhân vật/chủ thể].
Phong cách vẽ: [anime Nhật/màu nước/phẳng/sơn dày], nét vẽ: [tinh tế/mạnh mẽ].
Bảng màu: [phương án màu], hậu cảnh: [đơn giản/bối cảnh phức tạp].
Bố cục: [cận cảnh/trung cảnh/toàn cảnh], nhấn mạnh [chi tiết].
Đầu ra: tranh minh họa chất lượng cao dùng làm ảnh bìa hoặc đăng mạng xã hội.
```

**Mẫu JSON nâng cao (khuyến nghị dùng khi gọi Agent)**

```json
{
  "type": "Artistic Illustration",
  "art_style": "Studio Ghibli inspired anime style",
  "scene": {
    "description": "A giant flying whale carrying a small cozy village on its back",
    "details": "Windmills turning, tiny people looking over the edge, fluffy white clouds"
  },
  "palette": "Vibrant sky blue, lush greens, soft pastel accents",
  "technique": "Cel shading, detailed background art, soft glowing magical aura",
  "mood": "Whimsical, adventurous, nostalgic"
}
```

**Hướng dẫn tránh lỗi**

- **Chốt nét vẽ**: nếu không giới hạn kiểu nét (như “sơn dày” hoặc “loang màu nước”), tranh minh họa có thể mang phong cách AI mặc định bóng nhựa và thiếu sức sống.
- **Cẩn trọng khi nêu tên danh họa**: gọi tên họ có thể khiến mô hình sao chép bố cục tác phẩm tiêu biểu. Hãy mô tả đặc điểm cụ thể (chẳng hạn “nét vẽ bầu trời xoáy của Van Gogh”) thay vì chỉ nêu tên.

<a name="tpl-character"></a>

### Con người và nhân vật

**Mẫu cơ bản**

```text
Thiết kế bảng tạo hình cho nhân vật [danh tính nhân vật].
Ngoại hình: [tuổi/kiểu tóc/trang phục/phụ kiện], tính cách: [từ khóa].
Tư thế: [đứng/động tác], biểu cảm: [cảm xúc].
Bối cảnh thế giới: [thời đại phe phái/nghề nghiệp], yếu tố nhận diện: [yếu tố].
Đầu ra: hình ảnh chính của nhân vật và bảng tạo hình có phong cách thống nhất.
```

**Mẫu bảng tham chiếu phân tích chuyển động**

```text
Tạo bảng tham chiếu phân tích chuyển động cho [nhân vật/con người].
Phong cách: [nét vẽ đen trắng/3D thang xám/khung truyện tranh/hình hướng dẫn], nền sạch, cảm giác như hình tham khảo kỹ thuật.
Bố cục: lưới 4×4 gồm 16 khung cùng kích thước, ngăn cách bằng đường mảnh, đánh số 1-16 ở góc trên trái mỗi khung.
Tính nhất quán nhân vật: dùng cùng một nhân vật trong mọi khung, giữ nguyên khuôn mặt, trang phục, tỷ lệ cơ thể và kiểu tóc.
Cấu trúc từng khung:
- Phía trên: tiêu đề động tác
- Ở giữa: tư thế chuyển động toàn thân
- Phía dưới: 3-4 dòng mô tả động tác
- Lớp phủ: mũi tên chỉ hướng, mũi tên xoay hoặc đường quỹ đạo chuyển động
Chuỗi động tác: [các bước hoàn chỉnh từ tư thế đứng cơ bản đến động tác kết thúc]
Ràng buộc: không dùng nền phức tạp, không thêm nhân vật, không dùng màu gây nhiễu, không thay đổi danh tính nhân vật.
Đầu ra: bảng động tác nhân vật rõ ràng, dễ đọc, dùng làm tài liệu tham khảo cho hoạt hình, vũ đạo hoặc chuyển động trong trò chơi.
```

**Mẫu chuyển ảnh tham chiếu thành đồ chơi sưu tầm 3D**

```text
Chuyển ảnh đầu vào thành hình đồ chơi sưu tầm 3D cao cấp.
Giữ nguyên danh tính: bảo toàn khuôn mặt, kiểu tóc chính, thần thái biểu cảm và đặc điểm trang phục nhận diện của người/nhân vật gốc.
Tỷ lệ tạo hình: đầu lớn, đường nét khuôn mặt hơi phóng đại, tỷ lệ cơ thể như đồ chơi nhưng tổng thể vẫn có cảm giác thiết kế cao cấp.
Chất liệu: bề mặt vinyl/resin/mô hình sưu tầm mờ; chất liệu da và quần áo cần có chi tiết.
Ánh sáng và nền: ánh sáng studio mềm, nền sạch [đen/trắng/màu thương hiệu], chủ thể ở giữa, đường nét rõ.
Chất lượng: độ sắc nét siêu cao, phản xạ chất liệu chân thực, dựng hình 8K, thẩm mỹ đồ chơi thiết kế cao cấp.
Ràng buộc: không đổi danh tính, không tạo cảm giác nhựa rẻ tiền, không thêm nhân vật, không dùng nền phức tạp, không có chữ hoặc hình mờ.
Đầu ra: một ảnh dựng hoàn chỉnh về đồ chơi sưu tầm cao cấp.
```

**Mẫu JSON nâng cao (khuyến nghị dùng khi gọi Agent)**

```json
{
  "type": "Character Concept Art",
  "character": {
    "identity": "Cybernetic Bounty Hunter",
    "appearance": "Short silver hair, glowing red synthetic left eye, athletic build",
    "attire": "Tactical trench coat with neon piping, holding a plasma rifle"
  },
  "pose": "Dynamic action stance, looking over shoulder with a smirk",
  "environment": "Rainy neon-lit alleyway background (blurred)",
  "style": "Concept art, sharp linework, vibrant cyberpunk palette"
}
```

**Hướng dẫn tránh lỗi**

- **Mô tả cụ thể đường nét khuôn mặt**: đừng chỉ ghi “cô gái xinh đẹp”, vì mô hình không biết tiêu chuẩn thẩm mỹ của bạn. Hãy mô tả như “mắt long lanh, sống mũi cao, lông mày tự nhiên”.
- **Nêu chất liệu trang phục**: mô tả rõ chất liệu quần áo (như “lụa” hoặc “vải chắn gió kỹ thuật”) để nhân vật có chiều sâu hơn.
- **Khóa lưới cho bảng động tác**: nêu rõ số khung, đánh số và cấu trúc từng khung, nếu không các bước có thể bị dồn thành một hình giải thích lộn xộn.
- **Giữ dấu hiệu nhận diện khi biến thành đồ chơi**: chốt hình dáng khuôn mặt, kiểu tóc và đặc điểm trang phục trước khi mô tả tỷ lệ đầu lớn và chất liệu để giảm nguy cơ nhân vật trông như người khác.
- **Đặt yêu cầu nhất quán nhân vật lên trước**: chuỗi động tác càng dài càng dễ làm đổi mặt hoặc quần áo; hãy ghi “cùng một nhân vật, cùng trang phục, cùng tỷ lệ” trước danh sách động tác.

<a name="tpl-scene"></a>

### Bối cảnh và kể chuyện

**Mẫu cơ bản**

```text
Tạo hình bối cảnh về [chủ đề câu chuyện], diễn ra tại [thời gian + địa điểm].
Sự kiện chính: [mô tả sự kiện], nhân vật chính: [nhân vật], xung đột: [xung đột].
Ngôn ngữ máy quay: [toàn cảnh góc rộng/khung trung cảnh kể chuyện/cận cảnh].
Không khí: [căng thẳng/ấm áp/bí ẩn], tông màu: [lạnh/ấm/tương phản cao].
Đầu ra: hình ý tưởng bối cảnh có sức căng kể chuyện.
```

**Mẫu JSON nâng cao (khuyến nghị dùng khi gọi Agent)**

```json
{
  "type": "Narrative Scene",
  "story_context": "The exact moment an ancient seal breaks",
  "environment": "Crumbling stone temple overgrown with glowing blue vines",
  "action": "A young explorer dropping their torch as a massive beam of light shoots into the sky",
  "atmosphere": {
    "mood": "Awe-inspiring, terrifying",
    "lighting": "Blinding central light casting long dramatic shadows"
  },
  "camera": "Low angle shot, emphasizing the scale of the light beam"
}
```

**Hướng dẫn tránh lỗi**

- **Dùng động từ**: hình kể chuyện dễ bị biến thành bưu thiếp phong cảnh. Hãy mô tả sự kiện (như “đang sụp đổ” hoặc “vừa châm đuốc”) để khung hình có chuyển động.
- **Ngôn ngữ máy quay**: dùng “góc máy thấp (Low angle shot)” hoặc “góc nghiêng Hà Lan (Dutch angle)” để tăng kịch tính.

<a name="tpl-history"></a>

### Lịch sử và chủ đề cổ điển

**Mẫu cơ bản**

```text
Tạo hình ảnh theo chủ đề [triều đại/bối cảnh cổ điển], với nội dung [chủ đề].
Nhân vật: [danh tính/trang phục/vật dụng], bối cảnh: [cung đình/phố thị/phong cảnh núi sông].
Phong cách mỹ thuật: [vẽ công bút/tả ý/hiện thực điện ảnh], tông màu: [tông màu].
Chi tiết văn hóa: [hoa văn/lễ nghi/yếu tố kiến trúc].
Đầu ra: hình ảnh chủ đề cổ điển có không khí lịch sử chính xác.
```

**Mẫu JSON nâng cao (khuyến nghị dùng khi gọi Agent)**

```json
{
  "type": "Historical/Oriental Scene",
  "setting": "Tang Dynasty Capital City at Night",
  "subject": {
    "identity": "Noblewoman",
    "clothing": "Traditional Ruqun (áo váy truyền thống) with elaborate floral embroidery",
    "action": "Holding a glowing silk lantern, looking at fireworks"
  },
  "style": "Cinematic realism combined with subtle traditional ink wash textures",
  "details": "Accurate Tang architecture, bustling crowd in background",
  "constraints": "No modern elements, historically accurate clothing structure"
}
```

**Hướng dẫn tránh lỗi**

- **Tránh pha trộn tùy tiện**: nêu rõ triều đại (nhà Đường/Tống/Minh), nếu không mô hình có thể vẽ người mặc kimono, cầm quạt gấp thời Thanh nhưng đứng trong cung điện nhà Đường.
- **Loại bỏ chi tiết sai lệch**: thêm “không có yếu tố hiện đại (No modern elements)” để tránh xuất hiện ly cà phê hiện đại trong tay nhân vật cổ trang.

<a name="tpl-document"></a>

### Tài liệu và ấn phẩm

**Mẫu cơ bản**

```text
Tạo [loại tài liệu, chẳng hạn thực đơn/trang trong tạp chí/bố cục báo].
Cấu trúc trang: [số cột/lề trang/thứ bậc tiêu đề].
Mô-đun nội dung: [vùng bìa/vùng nội dung/vùng biểu đồ/chú thích cuối trang].
Phong cách chữ: [có chân/không chân], bảng màu: [phương án phối màu].
Đầu ra: bản thiết kế ấn phẩm có bố cục chuẩn và dễ đọc.
```

**Mẫu JSON nâng cao (khuyến nghị dùng khi gọi Agent)**

```json
{
  "type": "Editorial Layout",
  "document": "Fashion Magazine Double-page Spread",
  "grid": "3-column grid, wide margins",
  "content": {
    "left_page": "Full-bleed high-fashion photograph of a model in a red dress",
    "right_page": {
      "headline": "THE RED RENAISSANCE",
      "body_text": "(Simulated text blocks)",
      "pull_quote": "\"Color is power.\""
    }
  },
  "typography": "Elegant serif for headlines, clean sans-serif for body",
  "palette": "Monochrome with stark red accents"
}
```

**Hướng dẫn tránh lỗi**

- **Ưu tiên cấu trúc**: nêu rõ “số cột (columns)” và “lề trang (margins)” quan trọng hơn việc thêm nhiều từ khóa phong cách.
- **Không yêu cầu tạo toàn văn**: đừng kỳ vọng mô hình dàn cả trang nội dung mà không sai chữ. Hãy dùng “khối văn bản giả lập (Simulated text blocks)” cho phần thân và chỉ chốt chính xác tiêu đề lớn.

<a name="tpl-other"></a>

### Trường hợp sử dụng khác

**Mẫu cơ bản**

```text
Mục tiêu tác vụ: [loại nội dung cần tạo].
Ràng buộc đầu vào: chủ thể [chủ thể], bối cảnh [bối cảnh], phong cách [phong cách], màu sắc [bảng màu].
Ràng buộc chất lượng: độ nét [cao/4K], tỷ lệ [tỷ lệ], bố cục [kiểu bố cục].
Ràng buộc đầu ra: dùng cho [mục đích], cần làm nổi bật [thông tin cốt lõi].
Vui lòng đưa ra một phương án chính và một phương án thay thế.
```

**Mẫu bảng phân tích nghiên cứu và phát triển sản phẩm ý tưởng**

```text
Tạo bảng phân tích đầy đủ cho quá trình nghiên cứu và phát triển [sản phẩm/đồ nội thất/thiết bị], không chỉ tạo một ảnh dựng thành phẩm.

Ý tưởng cốt lõi:
Chuyển hóa [nguồn cảm hứng, chẳng hạn giấy vò/ vỏ sò/giấy gấp/cấu trúc cơ khí] thành [loại sản phẩm].
Triết lý thiết kế: [một câu mô tả công năng và cảm xúc, chẳng hạn “biến sự hỗn loạn có kiểm soát thành một chiếc ghế ngồi thoải mái”].

Bố cục hình ảnh:
Ở giữa: ảnh dựng chủ đạo chất lượng cao, thể hiện hình dáng, chất liệu và tỷ lệ chính của sản phẩm hoàn chỉnh.
Bên trái: quan sát và phân tích hình thái, gồm hình cảm hứng, phác đường viền, đường cấu trúc và chú thích nếp gấp/kết cấu/hướng chịu lực.
Khu vực giữa: quá trình lặp lại hình thái với 3-5 bước tiến hóa từ hình dạng ban đầu đến vỏ sản phẩm.
Phía dưới: xác minh công thái học hoặc tình huống sử dụng, gồm kích thước, góc, tư thế sử dụng và mô tả chức năng chính.
Bên phải: tích hợp cấu trúc và phương án vật liệu, thể hiện phân rã theo lớp của khung bên trong, vỏ, đệm/vải/khớp nối.
Cuối trang: chất liệu hoàn thiện, kết cấu bề mặt, phương án màu và bảng thông số chính.

Phong cách hình ảnh:
Bảng đề xuất thiết kế công nghiệp, nền trắng sạch hoặc xám nhạt, kết hợp bản vẽ kỹ thuật và ảnh sản phẩm, chú thích bằng nét mảnh, tiêu đề rõ ràng, bóng đổ chân thực và nhìn thấy chi tiết chất liệu.

Ràng buộc:
Không chỉ vẽ một sản phẩm đẹp; phải thể hiện phân tích, các bước phát triển, công thái học, cấu trúc, vật liệu và thông số.
Không để chữ lấp đầy hình; mỗi giai đoạn chỉ giữ tiêu đề ngắn và nhãn quan trọng.
Hình dáng sản phẩm cần giữ đặc điểm nhận diện của [nguồn cảm hứng], nhưng vẫn trông có thể sản xuất và sử dụng.
```

**Mẫu JSON nâng cao (khuyến nghị dùng khi gọi Agent)**

```json
{
  "type": "Custom Generation",
  "objective": "Generate [Specific content]",
  "inputs": {
    "subject": "[Main subject details]",
    "scene": "[Background and context]",
    "style": "[Artistic/Visual style]",
    "palette": "[Color scheme]"
  },
  "quality_constraints": {
    "resolution": "8k, hyper-detailed",
    "aspect_ratio": "[e.g., 16:9]",
    "composition": "[e.g., Rule of thirds]"
  },
  "output_requirements": {
    "usage": "[Intended use case]",
    "focus": "[Key element to highlight]"
  }
}
```

**Hướng dẫn tránh lỗi**

- **Nêu mục đích trước**: bắt đầu bằng “mục tiêu và cách sử dụng” để mô hình hiểu bối cảnh tổng thể, rồi mới mô tả chi tiết hình ảnh.
- **Thử nghiệm A/B**: với trường hợp thông thường, yêu cầu “tạo một phương án chính + một phương án thay thế” trong cùng prompt để dễ chọn kết quả phù hợp.

***

