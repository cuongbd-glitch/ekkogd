# Ekko · Giáo dục tài chính

Tính năng Giáo dục tài chính dạng gamification cho app Ekko. Chú heo khám phá các
hòn đảo trên trời: đảo trung tâm là cấp độ hiện tại của người học, xung quanh là
bốn đảo chức năng.

Dự án gồm hai phần chạy chung một máy chủ:

| Phần | Đường dẫn | Dành cho |
|---|---|---|
| **Cổng preview** | `/` | Xem cả hai giao diện trong hai tab |
| App người học (mobile first) | `/app/` | Nhân viên, mở từ app Ekko bằng SSO |
| Admin portal | `/admin/` | Quản trị viên nội dung |

---

## Chạy dự án

Yêu cầu **Node.js 22.5 trở lên** (dự án dùng `node:sqlite` có sẵn trong Node).
Không có dependency nào, không cần `npm install`, không cần bước build.

```bash
cd app && npm start
```

Mở trình duyệt:

- `http://127.0.0.1:4321/` — **cổng preview**, hai tab: App người dùng và Admin portal
- `http://127.0.0.1:4321/dev/login` — vào thẳng app với tài khoản nhân viên demo
- `http://127.0.0.1:4321/dev/login?role=admin` — vào thẳng Admin portal

Các lệnh khác:

```bash
npm run dev     # tự khởi động lại khi sửa file
npm run smoke   # chạy bộ kiểm thử end-to-end (152 kiểm tra)
npm run reset   # xoá cơ sở dữ liệu để tạo lại dữ liệu mẫu
```

Dữ liệu nằm ở `app/data/gdtc.sqlite`. Nội dung khoá học được nạp tự động khi
khởi động lần đầu.

---

## Cổng preview

Trang gốc `/` nhúng **cả hai giao diện thật** trong hai tab, không phải ảnh chụp:
bấm, cuộn, học bài, sửa nội dung đều hoạt động bên trong iframe.

Tab được tạo **lười**: iframe chỉ dựng khi bạn mở tab đó lần đầu, và giữ nguyên
sau đó, nên quay lại tab cũ không mất chỗ đang xem.

**Cả hai tab dùng chung một phiên đăng nhập**, nên tài khoản demo của trang này
phải có quyền quản trị: chỉ có một cookie phiên, không thể vừa là nhân viên vừa
là quản trị viên. Vì vậy app người dùng trong tab 1 hiển thị đúng tiến độ của tài
khoản quản trị đó. Muốn xem bằng con mắt của một nhân viên thuần thì mở
`/dev/login` ở tab trình duyệt riêng.

Khung iPhone trong tab 1 cần chiều cao iframe từ 680px trở lên. Trên màn hình
thấp hơn (ví dụ laptop 720p), khung tự biến mất và app chạy tràn viền — vẫn dùng
được, chỉ là không còn hình chiếc điện thoại.

---

## Khung máy iPhone

Toàn bộ giao diện người học chạy bên trong khung iPhone lấy từ `iphone mockup.fig`.
Vùng màn hình trong ảnh khung là **trong suốt**, nên đây không phải ảnh chụp dán
vào: app thật chạy xuyên qua khung, bấm và cuộn được bình thường.

Số đo lấy trực tiếp từ file Figma:

| | Giá trị |
|---|---|
| Khung máy | 450 × 920 pt |
| Vùng màn hình | 402 × 874 pt, lệch (24, 23) |
| Dynamic Island | đã vẽ sẵn trong ảnh khung |
| Thanh trạng thái | không có trong ảnh, được dựng lại bằng HTML |

Mọi kích thước bên trong tính theo phần trăm của khung, nên khung tự co lại vừa
cửa sổ mà chữ vẫn nét (không dùng `transform: scale`).

Bên trong có **hai lớp lồng nhau, và đó là chủ đích**:

- `.device__screen` mang `transform`, làm mốc neo cho `position: fixed`, nhưng
  **không cuộn**.
- `.device__scroll` bên trong mới là phần cuộn, chứa nội dung app.

Gộp hai lớp làm một sẽ hỏng: `transform` biến `position: fixed` thành neo theo
hộp của phần tử chứ không theo khung nhìn, nên thanh trạng thái, nút Ekko bot và
home indicator sẽ trôi theo nội dung khi cuộn. Tách ra thì các lớp nổi (nút bot,
nút hành động chính, trình phát bài học, bottom sheet, toast, màn chúc mừng)
đứng yên đúng như trên máy thật.

**Đổi màu vỏ máy:** sửa `data-device` trên `.device` trong
`public/app/index.html` thành `black`, `natural` hoặc `copper` (ba biến thể có
sẵn trong file Figma).

**Trên máy thật khung sẽ tự biến mất.** Dưới 768px ngang hoặc 680px dọc, app
chạy tràn viền và nhường thanh trạng thái lại cho hệ điều hành, vì vẽ một chiếc
điện thoại bên trong một chiếc điện thoại thì vô nghĩa.

Đồng hồ trên thanh trạng thái hiển thị **giờ thật** theo múi giờ Việt Nam chứ
không đứng yên ở 9:41.

---

## Đăng nhập một lần (SSO) từ app Ekko

App Ekko là nguồn danh tính duy nhất. Nó ký một JWT (HS256) bằng bí mật dùng
chung `EKKO_SSO_SECRET` rồi mở webview tới dịch vụ này.

**1. Tạo token** (hạn dùng nên ≤ 5 phút):

```json
{
  "sub": "ma-nhan-vien-trong-he-thong-ekko",
  "name": "Trần Bảo Ngọc",
  "email": "ngoc.tran@congty.vn",
  "avatar": "https://...",
  "employer": "Công ty TNHH Minh Phát",
  "role": "member",
  "exp": 1767225600
}
```

Chỉ `sub` là bắt buộc. `role: "admin"` cấp quyền vào Admin portal; ngoài ra có
thể liệt kê email quản trị trong biến môi trường `EKKO_ADMIN_SUBJECTS`.

**2. Mở webview:**

```
https://<host>/sso?token=<jwt>&redirect=/app/
```

**3.** Dịch vụ xác thực token, tạo hoặc cập nhật hồ sơ người học, đặt cookie
phiên (`HttpOnly`, `SameSite=Lax`, 30 ngày) rồi chuyển hướng tới `redirect`.
Tham số `redirect` chỉ nhận đường dẫn cùng miền, nên token không thể bị dùng để
đẩy người dùng ra trang ngoài.

Xem mẫu token thật để đối chiếu khi tích hợp:

```bash
curl "http://127.0.0.1:4321/dev/sso-token?sub=nv-001"
```

### Biến môi trường

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `PORT` | `4321` | Cổng máy chủ |
| `EKKO_SSO_SECRET` | tự sinh và lưu lại | Bí mật dùng chung với app Ekko |
| `EKKO_SESSION_SECRET` | tự sinh và lưu lại | Bí mật ký cookie phiên |
| `EKKO_ADMIN_SUBJECTS` | `admin@ekko.vn,cuongbd@ekko.vn` | Danh sách email/ID được cấp quyền quản trị |
| `EKKO_APP_URL` | `https://ekko.vn` | Nơi quay về khi đăng xuất |
| `EKKO_TZ` | `Asia/Ho_Chi_Minh` | Múi giờ dùng để tính ngày cho streak |
| `EKKO_DATA_DIR` | `app/data` | Thư mục chứa SQLite |
| `ANTHROPIC_API_KEY` | trống | Bật chế độ trả lời dự phòng bằng Claude cho Ekko bot |
| `NODE_ENV` | `development` | Đặt `production` để tắt `/dev/login` và dữ liệu mẫu |

Ở môi trường thật, **bắt buộc** đặt `EKKO_SSO_SECRET`, `EKKO_SESSION_SECRET` và
`NODE_ENV=production`.

---

## Luật trò chơi hoá

### Streak

- Hành động **đầu tiên trong ngày** cộng +1 streak: hoàn thành một bài học, hoặc
  **làm một việc** trong ba chức năng — lưu ngân sách, đặt hoặc nạp một mục tiêu,
  ghi một khoản chi.
- **Mở một chức năng lên xem thì không được gì**: không XP, không streak, không
  ghi vào nhật ký hoạt động. Đọc dữ liệu chỉ là đọc dữ liệu.
- Các lần sau trong cùng ngày không cộng thêm, nên không thể "cày" streak bằng
  cách vào ra một màn hình.
- Nghỉ một ngày thì chuỗi **bị đóng băng** chứ chưa mất. Đóng băng tối đa **3 ngày**.
- Quay lại trong thời gian đóng băng: chuỗi tiếp tục và +1.
- Quá 3 ngày đóng băng mà vẫn không hoạt động: mất chuỗi, lần sau bắt đầu lại từ 1.

Tính theo số ngày cách nhau kể từ lần hoạt động gần nhất:

| Cách | Kết quả |
|---|---|
| 0 ngày | Đã tính hôm nay, không đổi |
| 1 ngày | Ngày liên tiếp, +1 |
| 2 – 4 ngày | Đã dùng 1 – 3 ngày đóng băng, chuỗi vẫn sống, +1 |
| ≥ 5 ngày | Mất chuỗi, về 1 |

Mọi phép tính chạy trên **ngày theo lịch ở múi giờ Việt Nam**, không phải trên
mốc thời gian UTC, nên học lúc 23:50 và 00:10 được tính là hai ngày khác nhau.

### Cấp độ và XP

Sáu cấp độ ("Cấp độ heo"), mỗi cấp có emoji, ảnh nhân vật heo, ảnh hòn đảo, và
một ô **Phúc lợi** để ghi người học được gì khi đạt cấp đó:

| Cấp | | Tên | XP tối thiểu |
|---|---|---|---|
| 1 | 🐷 | Heo Mầm Non | 0 |
| 2 | 🐖 | Heo Học Việc | 30 |
| 3 | 🐽 | Heo Tích Lũy | 80 |
| 4 | 🐹 | Heo No Đủ | 160 |
| 5 | 🐗 | Heo Đầu Tư | 260 |
| 6 | 👑 | Heo Thịnh Vượng | 350 |

Nguồn XP: hoàn thành bài học (20 – 40), hoàn thành trọn mô đun (60 – 120), **làm
một việc** trong một chức năng lần đầu trong ngày (15), và thưởng kèm huy hiệu.

> **Lưu ý về nhịp lên cấp.** Ngưỡng cao nhất là 350 XP, trong khi 18 bài học đã
> cho 450 XP (chưa kể thưởng mô đun và huy hiệu). Người học sẽ đạt cấp cao nhất
> khi mới đi được khoảng nửa giáo trình. Nếu muốn cấp 6 trùng với lúc học xong,
> hãy nâng các ngưỡng trong Admin portal. Ô cảnh báo trong trang Cấp độ sẽ nhắc
> nếu các ngưỡng không còn tăng dần.

### Huy hiệu

Huy hiệu được xét lại sau **mỗi** hành động có thưởng, và không bao giờ bị thu
hồi. Mỗi huy hiệu là một luật gồm loại điều kiện + ngưỡng, cấu hình trong Admin
portal:

`lessons_completed`, `modules_completed`, `streak_days`, `feature_used`,
`expenses_logged`, `goals_created`, `goals_completed`, `budgets_created`,
`level_reached`, `xp_total`, `bot_chats`.

Bộ khởi tạo có 12 huy hiệu, gồm *Bài học đầu tiên*, *Mô đun đầu tiên*,
*Streak 7 ngày*, *Ngân sách đầu tiên*, *Cán đích*, *Bậc thầy bầu trời*.

---

## Điều hướng

Không có thanh tab dưới đáy. Bản đồ đảo chính **là** trung tâm điều hướng: bốn
hòn đảo quanh đảo của người chơi dẫn tới Khám phá và ba chức năng, thanh HUD dẫn
tới Huy hiệu. Từ mọi màn hình con, nút `←` bên trái thanh HUD đưa về đảo chính
trong một lần chạm. Riêng màn hình một mô đun có thêm nút "← Các đảo" vì nó lùi
về danh sách đảo bài học chứ không về thẳng đảo chính.

Đáy màn hình được làm mờ dần thay cho thanh tab, để nút hành động và Ekko bot
không trôi lơ lửng trên chữ.

---

## Concept giao diện của màn Khám phá

Cùng một lộ trình học có thể được kể bằng nhiều cách. Mỗi cách là một **concept**;
quản trị viên chọn concept trong Admin portal (**Trò chơi hoá → Concept**) và
**chỉ một concept được bật tại một thời điểm** — hai người học mở app phải thấy
cùng một thế giới, nên đây không phải tuỳ chọn của từng người.

| | Concept | Hình hài |
|---|---|---|
| 1 | **Đảo trên trời** (mặc định) | Đảo nổi giữa mây, đường nét đứt uốn lượn đi từ dưới lên |
| 2 | **Quần đảo so le** | Đảo bay xếp so le trái – phải, nhãn bài nằm bên đối diện; cũng đi từ dưới lên |

Đổi concept **không đụng tới nội dung hay tiến độ**: cùng thứ tự bài, cùng luật mở
khoá, cùng số bài đã học. Server trả về đúng một danh sách chặng cho mọi concept
(`GET /api/learn/map` kèm trường `concept`), client chỉ chọn bộ vẽ tương ứng —
`views/explore-sky.js` hoặc `views/explore-islands.js`. Bộ kiểm thử khoá điều này
lại: đổi concept xong, `entries` phải giống hệt trước đó.

Concept đang bật lưu trong `settings.explore_concept`; giá trị lạ sẽ tự lùi về
concept 1 thay vì làm hỏng màn hình.

### Bộ hình của concept 2

Toàn bộ hình của concept 2 cắt ra từ **một file duy nhất**: `Đảo.svg` do Ekko vẽ,
giữ nguyên bản tại `assets/islands/trail/_source.svg`. Script cắt đọc hộp giới hạn
của từng mảnh rồi xuất ra SVG riêng, chỉ mang theo những rule `.stN` mà mảnh đó
thực sự dùng:

| Nhóm | File | Dùng làm |
|---|---|---|
| Đảo bài học | `island-1` … `island-6` | sáu kiểu đảo, xoay vòng theo thứ tự chặng |
| Đảo mở đầu | `island-home` | đảo của người học (có rương báu) ở chân trang |
| Đảo nhỏ | `island-small` | chặng trắc nghiệm cuối mô-đun |
| Trang trí | `cloud-1` … `cloud-3` | mây nền |

Bộ hình đang dùng nặng **124 KB** SVG vector, nên bản đồ nét ở mọi kích thước màn
hình.

Script cắt còn xuất ra `plank`, `ladder`, `ladder-long`, `rope`, `island-tree` và
`coin` — dấu vết của một bản concept 2 trước đó, khi các đảo được nối bằng ván gỗ
và thang gỗ thật. Bản hiện tại **không dùng những hình này**; chúng nằm lại trong
thư mục để khỏi phải dò lại toạ độ trong `Đảo.svg` nếu muốn quay về ý tưởng đó.

### Bố cục và đường nối của concept 2

Mỗi chặng là **một hàng chia đôi**: hòn đảo chiếm một bên, nhãn bài chiếm bên còn
lại, và hai bên đổi chỗ sau mỗi chặng — đọc xuống thấy một lối mòn lượn qua lượn
lại. Nhãn không bao giờ nằm dưới đảo nên không có chuyện chữ bị hình đè.

Đường nối là **một nét đứt SVG duy nhất**, đo theo vị trí thật của từng đảo sau khi
layout xong rồi vẽ lại mỗi lần bản đồ đổi chiều cao — cùng cách và cùng class
`.trail` với concept 1, chứ không phải hình ván gỗ rời bắc giữa hai đảo.

Hai chi tiết khiến mối nối không bị lệch:

- Điểm nối lấy ở **vành cỏ** của mỗi hình (`GROUND`), không lấy giữa hộp ảnh: hộp
  của đảo có cây thừa gần nửa trên là tán lá và trời.
- Mỗi hình khai báo sẵn tỉ lệ khung (`RATIO`) nên chiều cao hộp đúng ngay từ khung
  hình đầu, không phải đợi SVG tải xong mới đo được.

Cùng lý do đó, mỗi chặng được kéo lên hay xuống một khoảng (`--align`) để vành cỏ
của mọi kiểu đảo rơi vào cùng một đường chuẩn; không có nó thì nhịp giữa các chặng
lúc sát lúc thưa. Toàn bộ nhịp cố định theo thứ tự chặng, không có yếu tố ngẫu
nhiên, nên bản đồ giống nhau ở mọi lần mở.

---

## Bản đồ học tập · concept 1 (Đảo trên trời)

Màn Khám phá là **một bản đồ dọc liền mạch**, không còn danh sách mô đun rồi bấm
vào từng mô đun. Hành trình bắt đầu từ đảo của người chơi ở **dưới cùng** rồi leo
lên theo một đường nét đứt uốn lượn.

Trên đường có hai loại chặng: **bài học** và **trắc nghiệm cuối mô-đun**. Mốc
**MÔ-ĐUN n** đứng cạnh đường như biển chỉ dẫn, kèm emoji và mô tả của mô đun.

Mỗi chặng hiển thị trạng thái ngay trên bản đồ:

| Trạng thái | Dấu hiệu |
|---|---|
| Đang ở đây | Chú heo đứng cạnh đảo, nút ▶ xanh |
| Mở, chưa học | Nút ▶ xanh |
| Đã xong | Số đổi thành ✓, nút xanh lá |
| Chưa mở khoá | Đảo xám, nút 🔒, chữ nhạt |

Vài chi tiết kỹ thuật đáng biết:

- Thứ tự DOM là **thứ tự học**, còn `flex-direction: column-reverse` lo việc chặng
  đầu tiên nằm dưới cùng. Không phải tự đảo mảng.
- Đường nét đứt là **một SVG duy nhất, đo từ vị trí thật của các chặng** sau khi
  layout xong, chứ không phải hình nền vẽ sẵn chỉ trùng khớp đại khái. Vẽ lại khi
  cửa sổ đổi kích thước.
- Mở màn hình là **nhảy thẳng tới chặng đang làm**, không phải đầu hay cuối danh sách.
- Mốc mô đun dùng chung một hình đảo đá làm biển chỉ dẫn, nên `cover_image` của mô
  đun hiện không còn xuất hiện trong app (vẫn sửa được trong Admin, không gây lỗi).

---

## Nội dung học tập

Cấu trúc: **Mô-đun** → **Bài học** → các trang, cộng một **bộ trắc nghiệm cuối
mô-đun**.

Trong Admin portal, mỗi mô-đun là một thẻ mở rộng được. Gập lại chỉ thấy emoji,
tên và mô tả; mở ra thấy bảng bài học và toàn bộ câu hỏi cuối mô-đun trong cùng
một chỗ.

### Bài học

Một bài học là **một danh sách trang có thứ tự**, trộn ba loại tuỳ ý:

| Loại trang | Nội dung |
|---|---|
| **Chữ + hình** | Trang chữ kèm ảnh và chú thích |
| **Hình tương tác** | Ảnh có các điểm chạm, mỗi điểm mở một mẩu nội dung |
| **Slide ảnh** | Ảnh toàn trang, tỉ lệ **1 : 1,371** |

Trình soạn chỉ có **một danh sách** và ba nút thêm nằm cạnh nhau. Trước đây có hai
tab "Văn bản" / "Slide ảnh", mỗi tab chỉ thấy một phần các trang — trong khi người
học luôn xem theo đúng một mạch từ trang 1 đến trang cuối, nên chia tab làm người
soạn không thấy được thứ tự thật. Đổi thứ tự bằng ↑ ↓ trên cùng một danh sách;
slide tải lên được nhiều ảnh một lượt.

Cột `lessons.content_type` không còn ô chọn: nó được **suy ra** khi lưu — bài chỉ
gồm slide là `slides`, còn lại là `text`. Đó vốn là bản chất của nó, và cũng đúng
cách bộ seed suy ra kiểu cho dữ liệu cũ.

Ô nội dung nhận cú pháp rút gọn: dòng trống tách đoạn, `**đậm**`, `- ` cho gạch
đầu dòng, `> ` cho trích dẫn. Toàn bộ được escape trước khi dựng HTML, nên nội
dung do quản trị viên nhập không thể chèn mã vào trang.

Toạ độ điểm tương tác lưu theo **phần trăm** chiều rộng và chiều cao ảnh, nên
thay ảnh khác kích thước không làm lệch điểm.

### Trắc nghiệm cuối mô-đun

Câu hỏi thuộc **mô-đun**, không nằm trong bài học. Người học mở được phần trắc
nghiệm sau khi hoàn thành **tất cả** bài học của mô-đun đó.

- Chấm điểm **ở phía máy chủ**. Đáp án đúng không bao giờ được gửi ra client
  trước khi nộp, nên không thể xem trước bằng tab Network.
- Thưởng theo số câu đúng: 10 XP mỗi câu.
- Làm lại được, nhưng **chỉ điểm cao hơn mới được thưởng thêm**, nên không thể
  cày XP bằng cách nộp lại.
- Trắc nghiệm **không chặn** việc hoàn thành mô-đun: XP thưởng mô-đun vẫn được
  cộng khi học xong bài cuối, giống như trước.

Bộ khởi tạo có 6 mô-đun / 18 bài học / 44 trang nội dung / 18 câu hỏi (3 câu mỗi
mô-đun).

---

## Ekko bot

Mascot trả lời trong một bottom sheet, xử lý theo thứ tự ưu tiên:

1. **Ghi chi tiêu nhanh.** `"cà phê 35k"`, `"ăn trưa 60 nghìn"`, `"grab 1,2 triệu"`,
   `"mua sách 250.000đ"` đều được đọc đúng số tiền, đoán nhóm chi tiêu theo danh
   sách từ khoá và lưu ngay vào sổ. Một số chỉ được coi là tiền khi có đơn vị
   (`k`, `nghìn`, `triệu`, `đ`…) hoặc dấu phân cách hàng nghìn, nên câu
   *"quy tắc 50/30/20 là gì?"* không bị ghi nhầm thành khoản chi.
2. **Câu hỏi về số liệu của chính người dùng:** streak, cấp độ, chi tiêu tháng
   này, ngân sách còn lại, tiến độ mục tiêu, số huy hiệu.
3. **Lệnh điều hướng:** *"mở ngân sách"*, *"vào mục tiêu"*.
4. **Câu hỏi về Ekko và chương trình** (FAQ có sẵn).
5. **Tìm trong nội dung bài học** và đề xuất mở đúng bài.
6. **Dự phòng bằng Claude** — chỉ khi có `ANTHROPIC_API_KEY`. Không có key thì bot
   chạy hoàn toàn ngoại tuyến.

Từ khoá phân loại chi tiêu nằm ở mục **Nhóm chi tiêu** trong Admin portal, sửa
được mà không cần đụng vào mã.

### Một dòng thời gian, hai chỗ gõ

Câu gõ ở **thanh ghi nhanh** dưới đáy màn hình cũng được ghi vào khung chat của
Ekko bot: một tin của người dùng (đúng câu đã gõ) và một tin xác nhận của bot.
Người dùng chỉ có một chỗ để xem lại "hôm qua mình đã ghi những gì", không phải
hai nơi rời rạc. Câu xác nhận dùng chung một hàm với đường chat
(`expenseLoggedReply` trong `services/botLog.js`) nên hai đường vào nói cùng kiểu.

Tin nhắn mang cột `bot_messages.source`: `chat` (gõ trong khung chat) hoặc `quick`
(gõ ở thanh ghi nhanh). Hai điều phụ thuộc vào cột này:

- Trong khung chat, tin `quick` có nhãn **⚡ ghi nhanh**, để người dùng hiểu vì sao
  có tin nhắn mình không gõ ở đây.
- Huy hiệu **Bạn của Ekko bot** chỉ đếm `source = 'chat'`. Ghi nhanh 20 khoản
  không làm bạn thành "bạn của bot" — đó là ghi sổ, không phải trò chuyện.

Form **Ghi một khoản chi** (bốn ô nhập) thì *không* đồng bộ vào chat: nó là một
biểu mẫu, không phải một câu nói.

---

## Ba chức năng

- **Lập ngân sách** — thu nhập tháng, hạn mức từng nhóm, đối chiếu với chi tiêu
  thực tế theo thanh tiến độ. Cảnh báo khi một nhóm vượt hạn mức.
- **Mục tiêu tài chính** — chọn từ bộ mục tiêu gợi ý, đặt kỳ tiết kiệm, nạp nhanh
  theo các mức có sẵn, và Ekko tính hộ số tiền phải để dành mỗi kỳ để kịp hạn.
- **Ghi chép chi tiêu** — nhập tay, gõ vào thanh ghi nhanh ở đáy, hoặc nhắn cho
  Ekko bot; tổng hợp theo ngày và theo nhóm.

### Mục tiêu tài chính: chọn trước, sửa sau

Màn hình có **hai tab** ghim ngay dưới HUD:

| Tab | Nội dung |
|---|---|
| **Mục tiêu của bạn** | các mục tiêu đang chạy, tiến độ, nạp nhanh, sửa, xoá |
| **Đặt thêm mục tiêu** | bộ mục tiêu gợi ý xếp theo nhóm |

Chưa có mục tiêu nào thì màn hình mở thẳng vào tab gợi ý — tab kia không có gì để
xem. Lưu xong một mục tiêu mới thì về lại tab **Mục tiêu của bạn**, đúng chỗ vừa
thêm vào.

Người dùng không bắt đầu từ một form trống. Bộ gợi ý xếp theo bốn nhóm — An toàn,
Mua sắm tài sản, Gia đình, Tự do — mỗi gợi ý là một thẻ có emoji, tên và một dòng
mô tả. Chọn một thẻ là sang màn thiết lập với **tên, số tiền và thời hạn đã điền
trước**; chỉ cần sửa cho khớp hoàn cảnh của mình.

Màn thiết lập có bốn ô: tên, số tiền mục tiêu, thời hạn, và **kỳ tiết kiệm** (mỗi
tháng hoặc mỗi tuần). Bên dưới là ô **"Ekko tính giúp bạn"**: mỗi lần sửa một ô là
nó tính lại ngay số tiền phải để dành mỗi kỳ.

```
30.000.000đ · hạn 11/02/2028 · mỗi tháng  →  1.666.667đ / tháng trong 18 tháng
30.000.000đ · hạn 11/02/2028 · mỗi tuần   →    384.615đ / tuần  trong 78 tuần
```

Vài quyết định đáng biết:

- Số kỳ đếm theo **tháng và tuần dương lịch** giữa hôm nay và thời hạn, nên "18
  tháng" là 18 lần để dành thật, không phải 18 × 30 ngày.
- Ngày "hôm nay" do server trả về (`today` trong `GET /api/goals`), tức là **ngày ở
  Việt Nam**, không phải đồng hồ của thiết bị — cùng một quy ước với luật streak.
- Bộ gợi ý nằm ở `services/goalTemplates.js` để app và Ekko bot dùng chung một
  nguồn. Số tiền và số tháng trong đó là **điểm khởi đầu hợp lý**, không phải khuyến
  nghị tài chính; muốn đổi thì sửa một chỗ.
- Mục tiêu **Tự do** cố tình để trống tên và số tiền — đó là phần người dùng tự đặt.
- Sửa một mục tiêu đã có dùng lại đúng màn đó, nên chỉ có một chỗ để bảo trì.
- `goals.period` và `goals.template` là hai cột mới, thêm bằng `ALTER TABLE ADD
  COLUMN` nên cơ sở dữ liệu đang chạy không cần làm gì.

### Lọc theo thời gian

Màn Ghi chép chi tiêu có ba tab: **Hôm nay · Tuần này · Tháng này**. Tuần bắt đầu
từ **thứ Hai** theo cách tính của Việt Nam. Mỗi khoảng phủ trọn kỳ chứ không cắt
ở ngày hôm nay, nên một khoản ghi lùi hoặc ghi trước trong kỳ vẫn hiện ra.

Lựa chọn nằm trong URL (`#/expenses?range=week`) nên nó sống sót qua mỗi lần
render lại: ghi nhanh một khoản xong, tab đang chọn vẫn giữ nguyên.

### Thanh ghi nhanh

Đáy mọi màn hình có một ô nhập luôn sẵn sàng. Gõ đúng cách bạn nói thường ngày:

```
cà phê 35k          →  35.000đ · 🍜 Ăn uống · "cà phê"
đổ xăng 120 nghìn   →  120.000đ · 🛵 Đi lại · "đổ xăng"
học phí con 2,5tr   →  2.500.000đ · 👨‍👩‍👧 Gia đình · "học phí con"
```

Dùng chung bộ đọc tiếng Việt với Ekko bot (`services/nlp.js`) nhưng ghi thẳng
vào sổ qua `POST /api/expenses/quick`, nên một lần ghi nhanh không làm đầy lịch
sử trò chuyện. Câu không có số tiền sẽ bị từ chối kèm gợi ý cách gõ, thay vì lưu
nhầm một khoản 0đ.

Ô nhập chiếm phần còn lại của hàng có nút Ekko bot, nên không thêm tầng chrome
nào ở đáy. Nút gửi chỉ hiện khi đã gõ gì đó.

### Cảnh báo chi tiêu bất thường

Ghi xong một khoản, nếu con số trông bất thường thì thay vì lời xác nhận, người
dùng nhận một **cảnh báo màu hổ phách**:

> **1.500.000đ cho một lần ăn uống?**
> Mức này lớn bất thường cho một khoản ăn uống thường ngày (trên 500.000đ). Nếu
> bạn gõ nhầm số, sửa lại trong sổ chi tiêu nhé.

Việc cần bắt nhất là **gõ nhầm số**: "ăn trưa 2 triệu" gần như luôn là 200 nghìn
bị thêm một số 0. Ba luật trong `services/spendingAlerts.js`, xếp theo mức đáng
nói:

| Mã | Khi nào | Ví dụ |
|---|---|---|
| `daily_large` | vượt ngưỡng "một lần" của nhóm | 1.500.000đ cho Ăn uống |
| `personal_spike` | gấp ≥ 4 lần mức thường của chính người dùng | thường 45k, lần này 300k |
| `budget_share` | một khoản ≥ 50% hạn mức tháng của nhóm | 1,5tr trên hạn mức 3tr |

**Ngưỡng chỉ đặt cho nhóm chi thường ngày** (`categories.daily_limit`): Ăn uống
500.000đ, Đi lại 500.000đ, Giải trí 1.000.000đ, Mua sắm 2.000.000đ. Tiền nhà, học
phí, gia đình, tiết kiệm để trống — ở đó số lớn là bình thường, cảnh báo chỉ là
tiếng ồn. Sửa được trong **Nhóm chi tiêu** ở Admin portal.

Hai điều làm cảnh báo không trở thành tiếng ồn:

- **Ngưỡng của nhóm nhường cho lịch sử của chính người dùng.** Nếu phần lớn khoản
  chi gần đây của họ ở nhóm đó cũng quanh mức ấy (`amount ≤ median × 3`) thì luật
  `daily_large` im lặng. Người hay ăn nhà hàng không bị nhắc mỗi ngày.
- **Mức tham chiếu là trung vị của 20 khoản gần nhất**, không phải trung bình:
  một khoản lệch lớn không kéo mức tham chiếu lên theo.

Cảnh báo **không chặn**: khoản chi vẫn được lưu, người dùng tự sửa hoặc xoá. Nó
xuất hiện ở cả ba đường ghi — thanh ghi nhanh, form Ghi một khoản chi, và tin nhắn
cho Ekko bot (bot chèn thêm một dòng ⚠️ vào câu xác nhận, nên cảnh báo còn lại
trong lịch sử trò chuyện).

### Chống ghi trùng

Một lần "ghi" của người dùng có thể phát ra **hai lần gọi API**: bấm hai lần liên
tiếp, bàn phím tiếng Việt gửi Enter hai lần khi chốt bộ gõ (`keydown` với
`isComposing`), hay `click` chồng lên `keydown`. Server không có cơ chế nào loại
bỏ bản trùng — hai lần gọi là hai dòng trong sổ.

Mọi hành động ghi dữ liệu vì vậy đi qua `singleFlight()` trong
`shared/client.js`: lần gọi thứ hai bị bỏ qua khi lần đầu còn đang chạy. Riêng
thanh ghi nhanh có thêm lớp thứ hai — **dọn ô nhập ngay khi đã lấy được nội
dung** — để lần gọi đến *sau khi* lần đầu kết thúc cũng không còn gì để gửi; gửi
lỗi thì chữ được trả lại cho người dùng.

Đang dùng ở: thanh ghi nhanh, form ghi khoản chi, nạp tiền vào mục tiêu, lưu mục
tiêu. Lưu ý `.is-busy` (làm mờ + `pointer-events: none`) **không** thay được cơ
chế này: nó khoá chuột nhưng không khoá bàn phím.

Mọi lệnh đọc (`GET`) của ba chức năng đều **không trả thưởng**: mở màn hình, đổi
tháng, đổi tab lọc, hay màn hình chính lấy số liệu tóm tắt — tất cả đều miễn phí
và không đụng tới streak. Chỉ các lệnh ghi (`PUT /api/budget`, `POST /api/goals`,
`POST /api/goals/:id/deposit`, `POST /api/expenses`) mới đi qua `useFeature`, và
cũng chỉ lần đầu mỗi ngày cho mỗi chức năng mới trả XP + streak.

Dấu tích ✓ trên đảo chức năng ở màn hình chính vì vậy có nghĩa là "hôm nay đã làm
gì đó ở đây", không phải "hôm nay đã mở lên xem".

---

## Admin portal

| Mục | Làm được gì |
|---|---|
| Bảng điều khiển | Người hoạt động theo ngày, phân bố cấp độ, bài học phổ biến, mức dùng ba chức năng |
| Người học | Tiến độ, XP, streak, huy hiệu. **Không** hiển thị chi tiêu, ngân sách hay mục tiêu của cá nhân |
| Concept | Chọn cách kể chuyện cho màn Khám phá; chỉ một concept được bật, đổi bất cứ lúc nào |
| Cấp độ | Tên, ngưỡng XP, ảnh đảo, ảnh nhân vật; cảnh báo nếu ngưỡng XP không tăng dần |
| Huy hiệu | Loại điều kiện, ngưỡng, phạm vi, XP thưởng, bật/tắt |
| Mô đun & bài học | Cây nội dung, tạo/sửa/xoá, đặt cấp độ mở khoá, xuất bản hoặc để nháp |
| Trình soạn frame | Bốn loại frame, xem trước văn bản, khung xem trước 1:1,371 cho slide, trình đặt điểm tương tác, sắp xếp lại thứ tự |
| Đảo chức năng | Tên, mô tả, ảnh đảo, XP mỗi ngày, bật/tắt. Riêng **Ghi chép chi tiêu** có thêm tab **Nhóm chi tiêu**: tên, biểu tượng, màu, và từ khoá cho Ekko bot |

Cột **Trạng thái** ở mọi danh sách là một công tắc bật/tắt ngay tại chỗ, không cần
mở hộp thoại: mô-đun và bài học (xuất bản / bản nháp), đảo chức năng (hiện / ẩn
trong app), huy hiệu (bật / tắt). Công tắc lưu ngay khi bấm và tự trả về trạng
thái cũ nếu lưu thất bại, nên hàng trong danh sách không bao giờ hiển thị sai so
với dữ liệu đã lưu.

Ảnh có thể chọn từ bộ artwork có sẵn hoặc tải lên (PNG/JPG/WebP/SVG, tối đa
1,5 MB), lưu vào `public/assets/uploads/`.

---

## Cấu trúc mã nguồn

```
app/
├── server/
│   ├── index.js              máy chủ HTTP, định tuyến, chặn quyền, xử lý lỗi
│   ├── config.js             biến môi trường và bí mật
│   ├── db.js                 lược đồ SQLite + helper truy vấn
│   ├── auth.js               SSO, phiên đăng nhập, phân quyền
│   ├── lib/                  router, JWT HS256, tiện ích ngày giờ
│   ├── services/
│   │   ├── streak.js         luật streak và đóng băng 3 ngày
│   │   ├── progression.js    XP, cấp độ, bộ luật huy hiệu
│   │   ├── world.js          dữ liệu cho màn hình chính
│   │   ├── botEngine.js      Ekko bot
│   │   ├── concepts.js       concept giao diện của màn Khám phá
│   │   ├── goalTemplates.js  bộ mục tiêu tiết kiệm gợi ý
│   │   ├── spendingAlerts.js cảnh báo khoản chi bất thường
│   │   ├── botLog.js         sổ hội thoại dùng chung cho chat và ghi nhanh
│   │   └── nlp.js            đọc số tiền và phân loại tiếng Việt
│   ├── routes/               session, learn, features, bot, admin
│   └── seed/                 6 cấp độ, 12 huy hiệu, giáo trình 18 bài
├── public/
│   ├── shared/               token thiết kế Ekko + client dùng chung
│   ├── app/                  giao diện người học (trong khung iPhone)
│   ├── admin/                Admin portal
│   └── assets/               artwork đảo, nhân vật, mascot, logo, khung máy
└── test/smoke.js             152 kiểm tra end-to-end
```

Giao diện dùng ES module thuần, không bundler. Màu sắc, khoảng cách, bo góc và
kiểu chữ lấy từ Ekko Design System (`shared/tokens.css`); cả hai giao diện dùng
thẳng các component CSS của design system (button, input, table, badge, toast, icon).

**Không còn màu tự đặt trong dự án.** Mọi giá trị màu đều là token của design
system; lớp phủ mờ và bóng đổ pha từ token bằng `color-mix()` chứ không viết
`rgba()` tay. Ba ngoại lệ, đều là giới hạn của nền tảng chứ không phải màu mới:

| Chỗ | Vì sao |
|---|---|
| `mask-image: ... #000` | `#000` là giá trị kênh mask (đục/trong), không phải màu hiển thị |
| `<meta name=theme-color>` | thẻ meta không nhận `var()`; giá trị là token `--ekko-payday-blue` |
| `<input type=color>` trong Admin | ô chọn màu chỉ nhận hex thật, nên đọc token lúc chạy bằng `getComputedStyle` |

Dải trời của app (đảo, bản đồ học tập, mục tiêu) nằm ở **một biến duy nhất**
`--sky-gradient`, ghép từ `--payday-blue-100/-50` và `--jade-100/-50`. Bảng màu
Ekko không có xanh trời nhạt, nên nửa dưới dải trời hơi ngả xanh ngọc — đó là
đánh đổi để không còn hex tự đặt.

---

## Ghi chú kỹ thuật

- **Không có dependency.** Toàn bộ chạy trên thư viện chuẩn của Node: `node:http`,
  `node:sqlite`, `node:crypto`. Không cần cài đặt, không có chuỗi cung ứng npm.
- **Ghi dữ liệu vào SQL đi qua danh sách cột được phép** cho từng loại bản ghi,
  nên trường lạ trong request không thể chạm tới câu lệnh SQL.
- **Phục vụ file tĩnh chặn đường dẫn thoát khỏi thư mục `public`.**
- **Phần thưởng chỉ trả một lần.** Học lại một bài đã hoàn thành vẫn được, nhưng
  không cộng XP lần hai; mở lại một chức năng trong ngày cũng vậy.
- **Toast là component `.ekko-toast` của design system**, không phải kiểu riêng:
  thẻ trắng, bo 24, viền nhạt, ô icon 36px và hai dòng tiêu đề / phụ. Sắc thái
  nằm ở màu ô icon (`bg-success-50`, `bg-error-50`, `bg-brand-50`) chứ không tô
  kín cả thẻ — design system không có toast nền xanh/đỏ. Icon lấy từ sprite
  `shared/icons-core.svg`. Gọi bằng `toast('Đã lưu')` hoặc
  `toast({ title, body }, 'success')`.
- **Toast rơi từ đỉnh màn hình.** Trượt xuống từ mép trên, đậu ngay **dưới HUD**
  trong **4 giây**, rồi trượt lên và biến mất (`TOAST_HOLD` / `TOAST_EXIT` trong
  `shared/client.js`). Chỗ đậu tránh HUD vì XP và streak vừa đổi nằm ở đó.
- **Toast có nút đóng** để tắt sớm — cần cho cảnh báo chi tiêu, vì nó dài hai
  dòng và có thể che nội dung người dùng đang đọc. Bấm đóng thì **huỷ luôn hẹn tự
  tắt**, nếu không hai lần trượt lên sẽ đè nhau. Cả dải toast không nhận chuột
  (`pointer-events: none`) để không chắn nhịp thao tác tiếp theo, nên riêng nút
  đóng phải bật lại (`pointer-events: auto`). Design system không định nghĩa nút
  này, nên nó là `.toast__close` ở phía app, không thêm vào file component.
  Admin portal vẫn dùng `.atoast` riêng ở góc dưới phải.
- **Chuyển động tôn trọng `prefers-reduced-motion`** ở cả hai giao diện.
- Font Bricolage Grotesque và Newsreader nạp từ Google Fonts; nếu không có mạng,
  giao diện tự lùi về font hệ thống mà không vỡ bố cục.

### Việc cần làm trước khi lên môi trường thật

- Đặt `EKKO_SSO_SECRET`, `EKKO_SESSION_SECRET`, `NODE_ENV=production`.
- Chạy sau HTTPS và thêm `Secure` vào cookie phiên (`server/lib/http.js`).
- Chuyển SQLite sang ổ đĩa lưu trữ bền hoặc sang Postgres nếu cần nhiều tiến trình.
- Rà soát giấy phép của bộ icon trước khi phát hành ra ngoài (xem ghi chú trong
  design system).
