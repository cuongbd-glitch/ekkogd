/**
 * The starting curriculum. Admins edit all of this in the portal afterwards.
 *
 * Frame kinds and their payloads:
 *   text_image  { title, body, image?, imageAlt?, caption? }
 *   slide       { image, alt, caption? }            rendered at 1 : 1.371
 *   interactive { title, intro?, image, alt, hotspots: [{ x, y, label, text }] }
 *   quiz        { question, options: [{ text, correct, explain? }] }
 *
 * Hotspot x/y are percentages of the image box, so art can be swapped freely.
 */

const t = (title, body, extra = {}) => ({ kind: 'text_image', payload: { title, body, ...extra } });
const s = (image, caption, alt) => ({ kind: 'slide', payload: { image, caption, alt: alt || caption } });
const i = (title, image, hotspots, intro) => ({ kind: 'interactive', payload: { title, intro, image, alt: title, hotspots } });
const q = (question, options) => ({ kind: 'quiz', payload: { question, options } });

const ISLAND = '/assets/islands';
const PIG = '/assets/levels';
const BOT = '/assets/mascot';

export const MODULES = [
  // ------------------------------------------------------------------ 1
  {
    slug: 'bat-dau-voi-tien-cua-ban',
    title: 'Bắt đầu với tiền của bạn',
    summary: 'Ba bài học nền tảng: tiền của bạn đang đi đâu, ghi lại nó thế nào, và phân biệt điều cần với điều muốn.',
    cover_image: `${ISLAND}/module.png`,
    unlock_level: 1,
    xp_reward: 60,
    lessons: [
      {
        slug: 'tien-cua-ban-di-dau',
        title: 'Tiền của bạn đi đâu?',
        summary: 'Hầu hết chúng ta không biết mình tiêu gì trong tháng vừa rồi. Bài này chỉ ra lý do.',
        est_minutes: 4,
        xp_reward: 25,
        frames: [
          t(
            'Câu hỏi khó nhất về tiền',
            'Thử trả lời nhanh: **tháng trước bạn tiêu bao nhiêu cho ăn uống?**\n\nGần như ai cũng ngập ngừng. Không phải vì bạn tiêu hoang, mà vì tiền rời khỏi ví theo hàng chục lần nhỏ lẻ mà não không ghi nhớ nổi.\n\nChú heo của chúng ta cũng vậy khi mới lên đảo: có lương, có tiêu, nhưng không có bức tranh.',
            { image: `${PIG}/pig-1.png`, imageAlt: 'Chú heo cầm sổ tay và bút chì', caption: 'Bước đầu tiên luôn là nhìn thấy.' },
          ),
          t(
            'Ba dòng tiền bạn cần thấy',
            '**1. Tiền vào** - lương, thưởng, làm thêm.\n\n**2. Tiền ra cố định** - tiền nhà, điện nước, học phí con. Nhóm này ít thay đổi và dễ đoán.\n\n**3. Tiền ra linh hoạt** - ăn uống, đi lại, mua sắm, giải trí. Nhóm này chính là nơi tiền biến mất mà bạn không hay.\n\nKhi bạn tách được nhóm 2 và nhóm 3, bạn đã đi trước phần lớn mọi người.',
          ),
          i(
            'Chạm vào từng nơi tiền rò rỉ',
            `${ISLAND}/feature-expenses.png`,
            [
              { x: 30, y: 26, label: 'Chi lặt vặt', text: 'Cà phê 30.000đ, gửi xe 5.000đ, nước 15.000đ. Mỗi ngày 50.000đ là 1.500.000đ một tháng.' },
              { x: 68, y: 34, label: 'Mua theo cảm xúc', text: 'Đơn hàng đặt lúc 11 giờ đêm hiếm khi là thứ bạn thực sự cần. Hãy để giỏ hàng qua đêm.' },
              { x: 46, y: 62, label: 'Phí tự động', text: 'Gói cước, ứng dụng, gói bảo hiểm cũ vẫn trừ tiền đều đặn dù bạn không còn dùng.' },
              { x: 22, y: 76, label: 'Trả hộ, cho mượn', text: 'Những khoản không ai nhắc lại. Ghi vào sổ để nhớ, không phải để đòi.' },
            ],
            'Bốn điểm dưới đây là nơi tiền thoát ra nhiều nhất. Chạm vào từng điểm sáng.',
          ),
          q('Nhóm chi tiêu nào thường khiến bạn bất ngờ nhất khi cộng lại cuối tháng?', [
            { text: 'Tiền nhà và điện nước', correct: false, explain: 'Đây là nhóm cố định, bạn thường đã biết trước con số.' },
            { text: 'Các khoản nhỏ lặp lại hằng ngày', correct: true, explain: 'Chính xác. Khoản nhỏ nhưng lặp lại 30 lần mới là thứ ăn mòn ngân sách.' },
            { text: 'Học phí của con', correct: false, explain: 'Khoản này lớn nhưng đã nằm trong kế hoạch từ đầu năm.' },
          ]),
        ],
      },
      {
        slug: 'ghi-chep-trong-ba-phut',
        title: 'Ghi chép chi tiêu trong 3 phút mỗi ngày',
        summary: 'Phương pháp ghi chép đủ nhanh để bạn không bỏ cuộc sau ba ngày.',
        est_minutes: 4,
        xp_reward: 25,
        frames: [
          t(
            'Vì sao mọi người bỏ ghi chép',
            'Không phải vì lười. Vì cách ghi quá nặng.\n\nMở ứng dụng, chọn ví, chọn nhóm, gõ ghi chú, chọn ngày, bấm lưu. Sáu thao tác cho một ly cà phê 30.000đ thì ai cũng bỏ.\n\nQuy tắc duy nhất cần nhớ: **ghi càng nhanh càng bền**.',
            { image: `${BOT}/bot-5.png`, imageAlt: 'Ekko bot cầm kính lúp soi các thẻ giá' },
          ),
          t(
            'Cách nhanh nhất: nhắn cho Ekko bot',
            'Trong app này, bạn chỉ cần nhắn cho Ekko bot đúng một câu như bạn nói với bạn bè:\n\n> cà phê 35k\n\n> ăn trưa 60 nghìn\n\n> grab về nhà 85k\n\nEkko bot đọc số tiền, đoán nhóm chi tiêu và lưu vào sổ. Bạn xác nhận là xong. Ba giây, không phải ba phút.',
            { image: `${ISLAND}/feature-expenses.png`, imageAlt: 'Đảo Ghi chép chi tiêu', caption: 'Đảo Ghi chép chi tiêu nằm ngay cạnh đảo trung tâm.' },
          ),
          t(
            'Ghi khi nào?',
            'Ngay lúc trả tiền. Không phải cuối ngày, càng không phải cuối tuần.\n\nMẹo thực tế: gắn việc ghi vào một hành động sẵn có. Vừa cất ví hoặc vừa đóng app ngân hàng là mở Ekko bot ghi ngay.\n\nSau 7 ngày liên tiếp, việc này thành phản xạ và bạn không cần cố nữa. Đó cũng là lúc bạn nhận huy hiệu **Streak 7 ngày**.',
          ),
          q('Đâu là cách ghi chép dễ duy trì nhất?', [
            { text: 'Cuối tháng ngồi tổng kết một lần', correct: false, explain: 'Đến cuối tháng bạn đã quên phần lớn các khoản nhỏ.' },
            { text: 'Ghi ngay tại thời điểm trả tiền, càng nhanh càng tốt', correct: true, explain: 'Đúng. Ghi ngay và ghi nhanh là hai yếu tố quyết định bạn có duy trì được hay không.' },
            { text: 'Chỉ ghi những khoản trên 500.000đ', correct: false, explain: 'Bỏ qua khoản nhỏ là bỏ qua đúng chỗ tiền rò rỉ nhiều nhất.' },
          ]),
        ],
      },
      {
        slug: 'can-va-muon',
        title: 'Phân biệt "cần" và "muốn"',
        summary: 'Công cụ đơn giản nhất để cắt giảm chi tiêu mà không thấy khổ sở.',
        est_minutes: 3,
        xp_reward: 25,
        frames: [
          t(
            'Hai câu hỏi, không phải một',
            'Khi định mua gì đó, đừng hỏi "cái này có đáng không". Câu đó quá mơ hồ.\n\nHỏi hai câu cụ thể:\n\n**Nếu không có nó tuần này, cuộc sống của tôi có gì hỏng không?**\n\n**Tôi đã muốn nó từ bao lâu rồi?**\n\nCâu một tách "cần" khỏi "muốn". Câu hai tách "muốn thật" khỏi "muốn bốc đồng".',
          ),
          i(
            'Xếp thử vào đúng nhóm',
            `${ISLAND}/lesson.png`,
            [
              { x: 50, y: 22, label: 'Cần', text: 'Gạo, tiền trọ, thuốc men, vé xe đi làm, học phí của con. Thiếu là ảnh hưởng ngay tuần này.' },
              { x: 24, y: 55, label: 'Muốn thật', text: 'Đôi giày bạn ngắm ba tháng nay, khoá học tiếng Anh. Đáng chi, nhưng nên có kế hoạch.' },
              { x: 74, y: 58, label: 'Muốn bốc đồng', text: 'Món đồ vừa thấy trên livestream 10 phút trước. Đây là nhóm cắt được ngay mà không thấy tiếc.' },
            ],
            'Chạm từng điểm để xem ví dụ thuộc mỗi nhóm.',
          ),
          t(
            'Quy tắc 24 giờ',
            'Với mọi khoản "muốn" trên 500.000đ, để nó nằm trong giỏ hàng đúng 24 giờ.\n\nHôm sau đọc lại, phần lớn sẽ tự thấy không cần nữa. Số còn lại là thứ bạn thực sự muốn, và lúc đó mua sẽ thấy vui chứ không thấy hối.\n\nĐây là một trong những mẹo tiết kiệm hiếm hoi không đòi hỏi bạn phải kỷ luật.',
            { image: `${BOT}/bot-1.png`, imageAlt: 'Ekko bot vui vẻ' },
          ),
          q('Bạn thấy một chiếc áo giảm giá 40% trên livestream lúc 11 giờ đêm. Nên làm gì?', [
            { text: 'Mua ngay kẻo hết khuyến mãi', correct: false, explain: 'Cảm giác khan hiếm là công cụ bán hàng, không phải lý do tài chính.' },
            { text: 'Lưu lại và xem lại sau 24 giờ', correct: true, explain: 'Đúng. Đa số ham muốn bốc đồng tự biến mất sau một đêm.' },
            { text: 'Hỏi ý kiến bạn bè rồi mua', correct: false, explain: 'Hỏi thêm người thường chỉ tìm sự đồng thuận cho quyết định đã có sẵn.' },
          ]),
        ],
      },
    ],
  },

  // ------------------------------------------------------------------ 2
  {
    slug: 'lap-ngan-sach',
    title: 'Lập ngân sách hằng tháng',
    summary: 'Từ con số lương về tay đến một bản ngân sách bạn thực sự dùng được, theo quy tắc 50/30/20.',
    cover_image: `${ISLAND}/feature-budget.png`,
    unlock_level: 2,
    xp_reward: 80,
    lessons: [
      {
        slug: 'ngan-sach-la-gi',
        title: 'Ngân sách không phải là ăn kiêng',
        summary: 'Hiểu đúng bản chất ngân sách trước khi lập bản đầu tiên.',
        est_minutes: 3,
        xp_reward: 30,
        frames: [
          t(
            'Ngân sách là lời hứa với chính mình',
            'Nhiều người nghe "lập ngân sách" là nghĩ đến cắt giảm, nhịn ăn, không đi chơi. Không phải vậy.\n\nNgân sách chỉ là việc **quyết định trước** tiền sẽ đi đâu, thay vì để cuối tháng nhìn lại và tự hỏi tiền đi đâu mất rồi.\n\nBạn vẫn được đi cà phê. Chỉ khác là bạn biết mình có bao nhiêu cho việc đó.',
            { image: `${ISLAND}/feature-budget.png`, imageAlt: 'Đảo Lập ngân sách với túi tiền vàng' },
          ),
          t(
            'Bắt đầu từ con số thật',
            'Ngân sách sai gần như luôn vì một lý do: người lập dùng con số mình *mong muốn* thay vì con số *thật*.\n\nTrước khi lập, hãy lấy dữ liệu 30 ngày gần nhất từ mục Ghi chép chi tiêu. Nếu tháng trước bạn tiêu 4.200.000đ cho ăn uống, đừng đặt ngân sách 2.000.000đ. Hãy đặt 3.800.000đ và giảm dần.\n\nNgân sách cắt quá sâu sẽ bị bỏ trong hai tuần.',
          ),
          q('Bản ngân sách đầu tiên nên dựa trên điều gì?', [
            { text: 'Mức chi tiêu thực tế tháng trước', correct: true, explain: 'Đúng. Dữ liệu thật là nền của một ngân sách dùng được.' },
            { text: 'Mức chi tiêu lý tưởng bạn mong muốn', correct: false, explain: 'Ngân sách xa rời thực tế sẽ bị bỏ chỉ sau vài tuần.' },
            { text: 'Mức chi tiêu trung bình của người cùng thu nhập', correct: false, explain: 'Hoàn cảnh mỗi nhà mỗi khác, con số trung bình không nói lên gì về bạn.' },
          ]),
        ],
      },
      {
        slug: 'quy-tac-50-30-20',
        title: 'Quy tắc 50/30/20',
        summary: 'Khung chia tiền đơn giản nhất để bắt đầu, và cách điều chỉnh cho thu nhập Việt Nam.',
        est_minutes: 4,
        xp_reward: 30,
        frames: [
          s(`${ISLAND}/feature-budget.png`, '50% thiết yếu · 30% mong muốn · 20% tương lai', 'Sơ đồ quy tắc 50/30/20'),
          t(
            'Ba chiếc hũ',
            '**50% cho nhu cầu thiết yếu** - tiền nhà, điện nước, ăn uống cơ bản, đi lại đi làm, học phí con.\n\n**30% cho mong muốn** - ăn ngoài, giải trí, mua sắm, du lịch.\n\n**20% cho tương lai** - trả nợ và tiết kiệm.\n\nVới lương 10.000.000đ: 5.000.000đ thiết yếu, 3.000.000đ mong muốn, 2.000.000đ cho tương lai.',
          ),
          t(
            'Điều chỉnh cho thực tế Việt Nam',
            'Ở các thành phố lớn, riêng tiền thuê nhà đã có thể chiếm 30-35% thu nhập. Lúc đó tỷ lệ 50/30/20 khó giữ nguyên.\n\nCách điều chỉnh hợp lý: **60/20/20**. Giữ nguyên 20% cho tương lai, ép phần mong muốn xuống.\n\nĐiều quan trọng không phải con số 50 hay 60, mà là **phần 20% cho tương lai không bị đụng đến**. Đó là phần duy nhất làm bạn khá lên theo thời gian.',
          ),
          q('Thu nhập của bạn là 12.000.000đ. Theo quy tắc 50/30/20, mỗi tháng bạn nên dành bao nhiêu cho tiết kiệm và trả nợ?', [
            { text: '1.200.000đ', correct: false, explain: 'Đó là 10%. Quy tắc đề nghị gấp đôi con số này.' },
            { text: '2.400.000đ', correct: true, explain: 'Chính xác, 20% của 12 triệu là 2,4 triệu.' },
            { text: '3.600.000đ', correct: false, explain: 'Đó là 30%, phần dành cho nhóm mong muốn.' },
          ]),
        ],
      },
      {
        slug: 'lap-ngan-sach-dau-tien',
        title: 'Lập bản ngân sách đầu tiên của bạn',
        summary: 'Làm ngay trong app, từng bước một.',
        est_minutes: 5,
        xp_reward: 35,
        frames: [
          t(
            'Bốn bước, làm một lần trong tháng',
            '**Bước 1.** Nhập thu nhập thực nhận trong tháng.\n\n**Bước 2.** Điền các khoản cố định trước: nhà, điện nước, học phí. Đây là phần bạn biết chắc.\n\n**Bước 3.** Chia phần còn lại cho các nhóm linh hoạt dựa trên số liệu tháng trước.\n\n**Bước 4.** Đặt phần tiết kiệm **trước**, không phải phần còn thừa. Đây là điểm khác biệt lớn nhất giữa người tiết kiệm được và người không.',
            { image: `${PIG}/pig-3.png`, imageAlt: 'Chú heo ở cấp độ 3' },
          ),
          t(
            'Theo dõi trong tháng',
            'Đảo Lập ngân sách sẽ hiển thị từng nhóm với một thanh tiến độ: đã tiêu bao nhiêu trên hạn mức bạn đặt.\n\nKhi một nhóm chạm 80%, bạn thấy ngay và còn kịp điều chỉnh. Khi vượt 100%, hãy lấy phần bù từ nhóm mong muốn chứ đừng lấy từ phần tiết kiệm.\n\nMỗi ngày bạn mở mục này lần đầu, chuỗi streak của bạn cũng được cộng thêm một ngày.',
          ),
          q('Nên đặt khoản tiết kiệm vào lúc nào trong tháng?', [
            { text: 'Cuối tháng, với phần tiền còn dư', correct: false, explain: 'Cách này gần như luôn dẫn đến việc không còn gì để tiết kiệm.' },
            { text: 'Ngay đầu tháng, trước khi chi các khoản linh hoạt', correct: true, explain: 'Đúng. Nguyên tắc "trả cho mình trước" là điều tạo ra khác biệt.' },
            { text: 'Bất cứ khi nào có tiền thưởng', correct: false, explain: 'Thưởng là khoản bổ sung, không thay thế được thói quen đều đặn.' },
          ]),
        ],
      },
    ],
  },

  // ------------------------------------------------------------------ 3
  {
    slug: 'quy-du-phong-va-muc-tieu',
    title: 'Quỹ dự phòng và mục tiêu tiết kiệm',
    summary: 'Xây tấm đệm an toàn trước, rồi mới đến những mục tiêu bạn thực sự mong muốn.',
    cover_image: `${ISLAND}/feature-goals.png`,
    unlock_level: 3,
    xp_reward: 80,
    lessons: [
      {
        slug: 'quy-khan-cap',
        title: 'Quỹ khẩn cấp: tấm đệm 3 đến 6 tháng',
        summary: 'Khoản tiền giúp một sự cố không biến thành một khoản nợ.',
        est_minutes: 4,
        xp_reward: 30,
        frames: [
          t(
            'Vì sao đây là việc đầu tiên',
            'Xe hỏng 2.000.000đ. Con ốm phải nhập viện. Công ty giảm giờ làm.\n\nNếu không có khoản dự phòng, mỗi sự cố như vậy đều biến thành một khoản vay. Và khoản vay lãi cao là thứ kéo lùi tài chính của bạn nhiều năm.\n\nQuỹ khẩn cấp không làm bạn giàu lên. Nó giữ cho bạn không nghèo đi vì những chuyện ngoài ý muốn.',
            { image: `${PIG}/pig-4.png`, imageAlt: 'Chú heo ở cấp độ 4' },
          ),
          t(
            'Cần bao nhiêu và để ở đâu',
            '**Mục tiêu ban đầu: 1 tháng chi phí thiết yếu.** Đừng nhắm ngay 6 tháng, con số đó làm nản lòng.\n\nĐạt được 1 tháng rồi thì nâng dần lên 3 tháng, sau đó 6 tháng nếu thu nhập của bạn không ổn định.\n\n**Để ở đâu:** một tài khoản tiết kiệm riêng, tách khỏi tài khoản chi tiêu hằng ngày. Không để chung ví, vì để chung là sẽ tiêu.',
          ),
          i(
            'Ba mức của quỹ dự phòng',
            `${ISLAND}/level-4.png`,
            [
              { x: 50, y: 24, label: 'Mức 3: sáu tháng', text: 'Dành cho người thu nhập theo mùa vụ, làm tự do, hoặc là lao động chính duy nhất trong nhà.' },
              { x: 30, y: 48, label: 'Mức 2: ba tháng', text: 'Mức tiêu chuẩn. Đủ để bạn tìm việc mới mà không phải nhận vội một công việc tệ.' },
              { x: 66, y: 66, label: 'Mức 1: một tháng', text: 'Bắt đầu từ đây. Chỉ cần đủ chi phí thiết yếu một tháng là bạn đã an toàn hơn hẳn.' },
            ],
            'Leo từ chân đảo lên đỉnh. Chạm vào từng mức.',
          ),
          q('Bạn chi thiết yếu khoảng 6.000.000đ mỗi tháng và chưa có khoản dự phòng nào. Mục tiêu hợp lý để bắt đầu là gì?', [
            { text: '36.000.000đ cho đủ 6 tháng', correct: false, explain: 'Mục tiêu đúng nhưng quá xa để bắt đầu, dễ bỏ cuộc trong tháng đầu.' },
            { text: '6.000.000đ cho một tháng', correct: true, explain: 'Đúng. Đạt mốc đầu tiên rồi mới nâng dần là cách bền nhất.' },
            { text: 'Không cần, cứ ứng lương khi có việc gấp', correct: false, explain: 'Ứng lương giải quyết được việc gấp, nhưng không thay thế được khoản dự phòng của riêng bạn.' },
          ]),
        ],
      },
      {
        slug: 'muc-tieu-smart',
        title: 'Đặt mục tiêu tiết kiệm đúng cách',
        summary: 'Một mục tiêu tốt luôn có con số, có hạn, và chia được thành từng tuần.',
        est_minutes: 4,
        xp_reward: 30,
        frames: [
          t(
            'Từ mong muốn thành mục tiêu',
            '"Muốn tiết kiệm nhiều hơn" không phải mục tiêu. Không có con số, không có hạn, nên không có cách biết mình đang thắng hay thua.\n\nĐổi thành: **"Tiết kiệm 20.000.000đ mua xe máy trước tháng 6 năm sau."**\n\nGiờ nó chia được: 20.000.000đ trong 10 tháng là 2.000.000đ mỗi tháng, tức khoảng 67.000đ mỗi ngày. Con số hằng ngày mới là thứ bạn thực sự quyết định được.',
            { image: `${ISLAND}/feature-goals.png`, imageAlt: 'Đảo Mục tiêu tài chính' },
          ),
          t(
            'Ba mục tiêu là tối đa',
            'Đặt nhiều mục tiêu cùng lúc là cách chắc chắn để không đạt được cái nào.\n\nThứ tự hợp lý:\n\n1. Quỹ khẩn cấp một tháng\n2. Trả hết khoản nợ lãi cao nhất\n3. Một mục tiêu bạn thực sự mong muốn\n\nMục tiêu thứ ba quan trọng hơn bạn nghĩ. Nó là phần thưởng giữ cho bạn không bỏ cuộc.',
          ),
          q('Đâu là mục tiêu tiết kiệm được đặt đúng cách?', [
            { text: 'Cố gắng để dành nhiều hơn năm ngoái', correct: false, explain: 'Không có con số và không có hạn thì không theo dõi được.' },
            { text: 'Tiết kiệm 15.000.000đ cho học phí con trước tháng 8', correct: true, explain: 'Đúng. Có con số, có hạn, và chia được ra từng tháng.' },
            { text: 'Không tiêu gì ngoài nhu cầu thiết yếu', correct: false, explain: 'Đây là hình phạt chứ không phải mục tiêu, và rất khó duy trì.' },
          ]),
        ],
      },
      {
        slug: 'tiet-kiem-tu-dong',
        title: 'Để việc tiết kiệm tự chạy',
        summary: 'Cách duy nhất để tiết kiệm bền là không phải quyết định lại mỗi tháng.',
        est_minutes: 3,
        xp_reward: 30,
        frames: [
          t(
            'Đừng dựa vào ý chí',
            'Ý chí là nguồn lực có hạn và nó cạn vào cuối ngày, đúng lúc bạn dễ tiêu tiền nhất.\n\nGiải pháp là bỏ ý chí ra khỏi phương trình: đặt lệnh chuyển tiền tự động sang tài khoản tiết kiệm vào **đúng ngày lương về**.\n\nTiền chưa kịp nằm trong tài khoản chi tiêu thì bạn không có cảm giác mất nó.',
            { image: `${BOT}/bot-1.png`, imageAlt: 'Ekko bot thích thú' },
          ),
          t(
            'Bắt đầu nhỏ đến mức buồn cười',
            'Nếu 20% là quá sức, hãy bắt đầu với 3%. Với lương 8.000.000đ thì đó là 240.000đ.\n\nMục tiêu của tháng đầu không phải số tiền, mà là **chứng minh cho chính bạn rằng bạn làm được**.\n\nMỗi lần tăng lương, tăng tỷ lệ tiết kiệm lên trước khi bạn kịp quen với mức sống mới. Đây là mẹo hiệu quả nhất trong toàn bộ khoá học này.',
          ),
          q('Thời điểm tốt nhất để chuyển tiền vào khoản tiết kiệm là khi nào?', [
            { text: 'Ngay ngày lương về', correct: true, explain: 'Đúng. Tiền chưa kịp vào dòng chi tiêu thì không bị tiêu.' },
            { text: 'Giữa tháng, khi biết còn dư bao nhiêu', correct: false, explain: 'Đến giữa tháng, phần "còn dư" thường đã nhỏ hơn nhiều so với dự tính.' },
            { text: 'Cuối tháng, sau khi trả hết mọi thứ', correct: false, explain: 'Đây chính là cách phổ biến nhất khiến người ta không tiết kiệm được đồng nào.' },
          ]),
        ],
      },
    ],
  },

  // ------------------------------------------------------------------ 4
  {
    slug: 'no-va-ung-luong',
    title: 'Nợ và ứng lương thông minh',
    summary: 'Hiểu lãi suất thật, phân biệt nợ tốt với nợ xấu, và dùng ứng lương như một công cụ thay vì một cái bẫy.',
    cover_image: `${ISLAND}/lesson.png`,
    unlock_level: 4,
    xp_reward: 90,
    lessons: [
      {
        slug: 'no-tot-no-xau',
        title: 'Nợ tốt và nợ xấu',
        summary: 'Không phải khoản vay nào cũng xấu. Điều quyết định là nó tạo ra hay lấy đi giá trị.',
        est_minutes: 4,
        xp_reward: 35,
        frames: [
          t(
            'Một câu hỏi để phân loại',
            '**Khoản vay này có làm tăng khả năng kiếm tiền hoặc giá trị tài sản của tôi không?**\n\nCó: vay học nghề, vay mua xe để đi làm, vay mua nhà ở. Đây là nợ tốt, miễn là khoản trả hằng tháng nằm trong khả năng.\n\nKhông: vay để mua điện thoại đời mới, vay để đi du lịch, vay để trả một khoản vay khác. Đây là nợ xấu, và nhóm cuối cùng là dấu hiệu nguy hiểm nhất.',
            { image: `${PIG}/pig-5.png`, imageAlt: 'Chú heo ở cấp độ 5' },
          ),
          t(
            'Nhìn vào lãi suất thật',
            'Một khoản vay quảng cáo "chỉ 2% mỗi tháng" nghe rất nhẹ. Nhưng 2% mỗi tháng là **hơn 24% mỗi năm**, cao hơn hầu hết thẻ tín dụng.\n\nLuôn quy mọi lãi suất về **năm** trước khi so sánh. Và luôn hỏi tổng số tiền phải trả, không chỉ số tiền trả mỗi tháng.\n\nCâu "trả góp chỉ 500.000đ một tháng" giấu đi việc bạn sẽ trả trong 24 tháng, tức 12.000.000đ cho món hàng giá 8.000.000đ.',
          ),
          q('Khoản vay nào sau đây có nhiều khả năng là nợ tốt nhất?', [
            { text: 'Vay trả góp điện thoại mới nhất', correct: false, explain: 'Món đồ mất giá ngay khi mở hộp và không tăng thu nhập của bạn.' },
            { text: 'Vay học một chứng chỉ nghề giúp tăng lương', correct: true, explain: 'Đúng. Khoản vay này làm tăng khả năng kiếm tiền trong nhiều năm sau.' },
            { text: 'Vay tiêu dùng để trả nợ thẻ tín dụng', correct: false, explain: 'Vay để trả nợ là dấu hiệu cần dừng lại và tìm tư vấn ngay.' },
          ]),
        ],
      },
      {
        slug: 'lai-kep',
        title: 'Lãi kép hoạt động thế nào',
        summary: 'Cùng một cơ chế: nó làm giàu cho người tiết kiệm và làm nghèo người mắc nợ.',
        est_minutes: 4,
        xp_reward: 35,
        frames: [
          s(`${ISLAND}/level-6.png`, 'Lãi sinh ra lãi. Thời gian là biến số mạnh nhất.', 'Đảo Thịnh Vượng nhìn từ trên cao'),
          t(
            'Con số làm bạn bất ngờ',
            'Gửi 2.000.000đ mỗi tháng, lãi suất 6% một năm:\n\nSau 5 năm: khoảng **140.000.000đ**\n\nSau 10 năm: khoảng **328.000.000đ**\n\nSau 20 năm: khoảng **924.000.000đ**\n\nTrong 20 năm bạn chỉ bỏ vào 480.000.000đ. Gần một nửa số cuối là do lãi sinh ra lãi. Thời gian làm phần việc nặng nhất, không phải số tiền.',
          ),
          t(
            'Mặt còn lại của đồng xu',
            'Cơ chế đó chạy ngược lại với nợ.\n\nDư nợ thẻ tín dụng 20.000.000đ, lãi 30% một năm, nếu chỉ trả mức tối thiểu thì bạn sẽ trả trong nhiều năm và tổng tiền lãi có thể vượt cả gốc.\n\nĐây là lý do quy tắc thứ tự luôn là: **trả hết khoản nợ lãi cao nhất trước khi nghĩ đến đầu tư.** Không khoản đầu tư an toàn nào trả cho bạn 30% một năm.',
          ),
          q('Bạn có 10.000.000đ dư. Đang nợ thẻ tín dụng lãi 28%/năm và thấy một kênh đầu tư hứa hẹn 12%/năm. Nên làm gì?', [
            { text: 'Đầu tư để tiền sinh lời', correct: false, explain: 'Lãi 12% không bù nổi khoản lãi 28% bạn đang phải trả.' },
            { text: 'Trả nợ thẻ tín dụng trước', correct: true, explain: 'Đúng. Trả một khoản nợ 28% chắc chắn tương đương một khoản đầu tư sinh lời 28% không rủi ro.' },
            { text: 'Chia đôi cho cả hai', correct: false, explain: 'Nửa số tiền vẫn đang chịu chênh lệch lãi bất lợi cho bạn.' },
          ]),
        ],
      },
      {
        slug: 'ung-luong-dung-cach',
        title: 'Dùng ứng lương đúng cách',
        summary: 'Ứng lương Ekko là tiền bạn đã làm ra. Dùng đúng thì nó thay thế khoản vay lãi cao.',
        est_minutes: 4,
        xp_reward: 35,
        frames: [
          t(
            'Ứng lương khác vay tiền',
            'Khi bạn ứng lương qua Ekko, bạn nhận trước phần lương **bạn đã làm ra** trong tháng này. Đó không phải khoản vay từ một bên thứ ba, và không có lãi suất kiểu tín dụng.\n\nGiá trị lớn nhất của nó là thay thế những lựa chọn tệ hơn: vay nóng, vay app lãi cao, hoặc mua trả góp lãi ẩn.',
            { image: `${BOT}/ekko-bot.png`, imageAlt: 'Ekko bot' },
          ),
          t(
            'Ba câu hỏi trước khi ứng',
            '**1. Việc này có gấp thật không?** Viện phí thì có. Đợt sale thì không.\n\n**2. Tháng tới tôi có xoay xở được với phần lương còn lại không?** Nếu câu trả lời là không, ứng lương chỉ đẩy vấn đề sang tháng sau.\n\n**3. Đây là lần thứ mấy trong ba tháng gần đây?** Ứng đều đặn mỗi tháng là tín hiệu chi tiêu đang vượt thu nhập, và điều cần sửa là ngân sách chứ không phải dòng tiền.',
          ),
          q('Trường hợp nào ứng lương là lựa chọn hợp lý nhất?', [
            { text: 'Đóng viện phí gấp cho người nhà, tháng này còn xoay xở được', correct: true, explain: 'Đúng. Việc gấp, có thật, và không đẩy bạn vào thế kẹt tháng sau.' },
            { text: 'Mua điện thoại mới đang giảm giá', correct: false, explain: 'Không gấp, và món đồ không tạo ra giá trị nào cho tài chính của bạn.' },
            { text: 'Ứng đủ mức tối đa mỗi tháng cho chắc', correct: false, explain: 'Ứng đều đặn hằng tháng cho thấy ngân sách đang có vấn đề cần sửa từ gốc.' },
          ]),
        ],
      },
    ],
  },

  // ------------------------------------------------------------------ 5
  {
    slug: 'bao-ve-va-dau-tu',
    title: 'Bảo vệ và đầu tư',
    summary: 'Bảo hiểm cơ bản, những bước đầu tư đầu tiên, và cách nhận ra một lời mời lừa đảo.',
    cover_image: `${ISLAND}/level-4.png`,
    unlock_level: 5,
    xp_reward: 90,
    lessons: [
      {
        slug: 'bao-hiem-co-ban',
        title: 'Bảo hiểm: mua cái gì trước',
        summary: 'Thứ tự ưu tiên và những khoản không cần mua.',
        est_minutes: 3,
        xp_reward: 35,
        frames: [
          t(
            'Bảo hiểm y tế trước tiên',
            'Bảo hiểm y tế bắt buộc là khoản có tỷ lệ giá trị trên chi phí tốt nhất mà bạn có thể mua ở Việt Nam. Nếu đang đi làm chính thức, bạn đã có.\n\nNếu làm tự do, hãy mua bảo hiểm y tế tự nguyện. Chi phí một năm thấp hơn một lần nằm viện ngắn.\n\nSau đó mới đến bảo hiểm tai nạn và bảo hiểm nhân thọ, và chỉ khi bạn là người tạo thu nhập chính cho gia đình.',
          ),
          t(
            'Hai lỗi thường gặp',
            '**Lỗi một: mua bảo hiểm nhân thọ như một kênh đầu tư.** Sản phẩm kết hợp bảo vệ và đầu tư thường kém ở cả hai vai. Nếu cần bảo vệ, mua sản phẩm bảo vệ thuần. Nếu cần đầu tư, đầu tư riêng.\n\n**Lỗi hai: mua khi chưa có quỹ khẩn cấp.** Nhiều người phải huỷ hợp đồng giữa chừng vì không đóng nổi phí, và mất phần lớn số đã đóng.',
            { image: `${BOT}/bot-5.png`, imageAlt: 'Ekko bot soi các thẻ giá' },
          ),
          q('Bạn làm tự do, chưa có bảo hiểm nào và chưa có quỹ dự phòng. Nên làm gì trước?', [
            { text: 'Mua bảo hiểm nhân thọ có tích luỹ', correct: false, explain: 'Chi phí cao và rủi ro phải huỷ giữa chừng khi chưa có quỹ dự phòng.' },
            { text: 'Mua bảo hiểm y tế tự nguyện và xây quỹ khẩn cấp', correct: true, explain: 'Đúng. Đây là hai lớp bảo vệ rẻ nhất và hiệu quả nhất.' },
            { text: 'Đầu tư trước để có thêm tiền mua bảo hiểm sau', correct: false, explain: 'Đầu tư khi chưa có lớp bảo vệ nào là lúc rủi ro nhất.' },
          ]),
        ],
      },
      {
        slug: 'bat-dau-dau-tu-nho',
        title: 'Bắt đầu đầu tư với số tiền nhỏ',
        summary: 'Ba điều kiện cần có trước khi đầu tư đồng đầu tiên.',
        est_minutes: 4,
        xp_reward: 35,
        frames: [
          t(
            'Ba điều kiện, không thiếu cái nào',
            '**1. Đã có quỹ khẩn cấp ít nhất 3 tháng.**\n\n**2. Đã trả hết nợ lãi trên 15% một năm.**\n\n**3. Số tiền đầu tư là tiền bạn không cần đến trong 3 năm tới.**\n\nThiếu một trong ba, bạn sẽ phải bán ra đúng lúc thị trường xuống, và đó là cách phổ biến nhất để mất tiền.',
            { image: `${PIG}/pig-6.png`, imageAlt: 'Chú heo ở cấp độ 6' },
          ),
          t(
            'Bắt đầu ở đâu',
            'Với người mới, thứ tự rủi ro từ thấp đến cao:\n\n**Gửi tiết kiệm ngân hàng** - an toàn, lãi thấp, phù hợp cho quỹ khẩn cấp.\n\n**Chứng chỉ quỹ mở** - do công ty quản lý quỹ đầu tư giúp, số tiền tối thiểu thấp, phù hợp để bắt đầu.\n\n**Cổ phiếu riêng lẻ** - cần thời gian tìm hiểu từng doanh nghiệp. Đừng bắt đầu ở đây.\n\nĐiều quan trọng nhất với người mới không phải chọn đúng kênh, mà là **đều đặn và không bán khi hoảng loạn**.',
          ),
          q('Điều nào sau đây KHÔNG phải điều kiện cần trước khi bắt đầu đầu tư?', [
            { text: 'Có quỹ khẩn cấp', correct: false, explain: 'Đây là điều kiện bắt buộc.' },
            { text: 'Đã trả hết nợ lãi cao', correct: false, explain: 'Đây cũng là điều kiện bắt buộc.' },
            { text: 'Có ít nhất 100 triệu đồng vốn', correct: true, explain: 'Đúng. Bạn có thể bắt đầu với vài trăm nghìn đồng. Số vốn không phải điều kiện.' },
          ]),
        ],
      },
      {
        slug: 'tranh-bay-lua-dao',
        title: 'Nhận ra bẫy lừa đảo tài chính',
        summary: 'Bốn dấu hiệu xuất hiện trong gần như mọi vụ lừa đảo.',
        est_minutes: 3,
        xp_reward: 35,
        frames: [
          i(
            'Bốn dấu hiệu cảnh báo',
            `${ISLAND}/feature-goals.png`,
            [
              { x: 46, y: 20, label: 'Lợi nhuận cam kết cao', text: 'Hứa 20-30% mỗi tháng, hoặc "cam kết không lỗ". Không có khoản đầu tư hợp pháp nào cam kết được điều này.' },
              { x: 26, y: 46, label: 'Giục gấp', text: '"Chỉ còn hôm nay", "suất cuối cùng". Áp lực thời gian tồn tại để bạn không kịp kiểm tra.' },
              { x: 70, y: 52, label: 'Thưởng theo người giới thiệu', text: 'Khi thu nhập đến từ việc rủ thêm người chứ không từ sản phẩm, đó là mô hình đa cấp.' },
              { x: 48, y: 74, label: 'Không thể rút tiền', text: 'Rút thử một khoản nhỏ ngay từ đầu. Nếu bị trì hoãn hoặc bị đòi "phí giải ngân", hãy dừng lại.' },
            ],
            'Chạm vào từng điểm để xem dấu hiệu và cách kiểm tra.',
          ),
          t(
            'Quy tắc an toàn',
            '**Không bao giờ chuyển tiền cho người bạn chỉ quen qua mạng.** Kể cả khi họ gọi video, kể cả khi họ gửi ảnh giấy tờ.\n\n**Không cung cấp mã OTP cho bất kỳ ai.** Không ngân hàng nào, không nhân viên nào cần mã OTP của bạn.\n\n**Kiểm tra giấy phép.** Công ty quản lý quỹ và công ty chứng khoán hợp pháp đều có tên trên trang của Uỷ ban Chứng khoán Nhà nước.\n\nNếu vẫn phân vân, hãy hỏi Ekko bot hoặc bộ phận nhân sự của công ty bạn trước khi chuyển bất kỳ khoản nào.',
          ),
          q('Một người quen qua mạng mời bạn góp vốn, cam kết lãi 25% mỗi tháng và giục chốt trong hôm nay. Bạn nên?', [
            { text: 'Góp thử một khoản nhỏ để kiểm tra', correct: false, explain: 'Khoản nhỏ đầu tiên thường được trả lãi đúng hạn để lấy lòng tin trước khi mất khoản lớn.' },
            { text: 'Từ chối hoàn toàn', correct: true, explain: 'Đúng. Cam kết lãi cao cộng với giục gấp là hai dấu hiệu đủ để dừng lại ngay.' },
            { text: 'Nhờ người quen đó gửi thêm giấy tờ chứng minh', correct: false, explain: 'Giấy tờ giả rất dễ làm. Kiểm tra ở nguồn chính thức, không kiểm tra qua chính người mời.' },
          ]),
        ],
      },
    ],
  },

  // ------------------------------------------------------------------ 6
  {
    slug: 'lam-chu-tai-chinh-dai-han',
    title: 'Làm chủ tài chính dài hạn',
    summary: 'Ghép mọi thứ đã học thành một hệ thống chạy được trong nhiều năm.',
    cover_image: `${ISLAND}/level-6.png`,
    unlock_level: 6,
    xp_reward: 120,
    lessons: [
      {
        slug: 'ke-hoach-12-thang',
        title: 'Kế hoạch tài chính 12 tháng',
        summary: 'Một trang giấy, bốn con số, xem lại mỗi quý.',
        est_minutes: 4,
        xp_reward: 40,
        frames: [
          t(
            'Bốn con số của năm',
            '**1. Thu nhập mục tiêu** - bạn muốn thu nhập tháng cuối năm là bao nhiêu.\n\n**2. Tỷ lệ tiết kiệm** - phần trăm thu nhập bạn giữ lại, không phải số tiền tuyệt đối.\n\n**3. Số dư quỹ khẩn cấp** - bao nhiêu tháng chi phí vào cuối năm.\n\n**4. Tổng nợ** - con số này phải nhỏ hơn đầu năm.\n\nBốn con số này quan trọng hơn mọi bảng tính chi tiết. Viết chúng ra và xem lại mỗi ba tháng.',
            { image: `${ISLAND}/level-6.png`, imageAlt: 'Đảo Thịnh Vượng' },
          ),
          t(
            'Xem lại mỗi quý, không phải mỗi ngày',
            'Kiểm tra ngân sách hằng ngày là việc tốt. Kiểm tra kế hoạch năm hằng ngày thì không.\n\nMỗi quý, dành 30 phút trả lời ba câu:\n\n**Con số nào đang đi đúng hướng?**\n\n**Con số nào đang lệch, và vì sao?**\n\n**Tôi cần đổi một thói quen nào trong ba tháng tới?**\n\nMột thói quen mỗi quý là bốn thói quen mỗi năm. Đó là tốc độ thay đổi bền vững nhất.',
          ),
          q('Chỉ số nào phản ánh sức khoẻ tài chính tốt hơn cả?', [
            { text: 'Tổng thu nhập hằng tháng', correct: false, explain: 'Thu nhập cao vẫn có thể đi kèm chi tiêu cao hơn và không dư đồng nào.' },
            { text: 'Tỷ lệ phần trăm thu nhập bạn giữ lại được', correct: true, explain: 'Đúng. Tỷ lệ tiết kiệm là chỉ số dự báo tốt nhất cho tài chính dài hạn.' },
            { text: 'Số dư trong tài khoản hôm nay', correct: false, explain: 'Số dư một thời điểm không cho biết xu hướng.' },
          ]),
        ],
      },
      {
        slug: 'tang-thu-nhap',
        title: 'Tăng thu nhập bền vững',
        summary: 'Cắt giảm có giới hạn, tăng thu nhập thì không.',
        est_minutes: 4,
        xp_reward: 40,
        frames: [
          t(
            'Trần của việc tiết kiệm',
            'Bạn chỉ có thể cắt giảm đến một mức nào đó. Không ai giảm chi tiêu xuống dưới 0.\n\nNhưng phía tăng thu nhập thì không có trần.\n\nĐiều này không có nghĩa là bỏ ngân sách. Nghĩa là khi bạn đã kiểm soát được chi tiêu, năng lượng tiếp theo nên dồn vào phía thu nhập.',
            { image: `${BOT}/bot-1.png`, imageAlt: 'Ekko bot' },
          ),
          t(
            'Ba hướng thực tế',
            '**1. Tăng giá trị ở công việc hiện tại.** Chứng chỉ nghề, kỹ năng mới, nhận thêm trách nhiệm. Đây là hướng ít rủi ro nhất.\n\n**2. Đổi việc.** Ở nhiều ngành, mức tăng khi chuyển việc cao hơn hẳn mức tăng lương định kỳ.\n\n**3. Nguồn thu phụ.** Bán kỹ năng bạn đã có, không phải kỹ năng bạn phải học từ đầu.\n\nMẹo quan trọng: **mỗi lần thu nhập tăng, tăng tỷ lệ tiết kiệm trước.** Nếu không, mức sống sẽ tự động dâng lên cho vừa hết phần tăng thêm.',
          ),
          q('Bạn vừa được tăng lương 2.000.000đ mỗi tháng. Việc nên làm đầu tiên là gì?', [
            { text: 'Nâng mức sống cho xứng đáng với công sức', correct: false, explain: 'Đây là hiện tượng lạm phát lối sống, lý do nhiều người tăng lương mà không giàu lên.' },
            { text: 'Chuyển ngay một phần vào tiết kiệm trước khi quen tiêu', correct: true, explain: 'Đúng. Bạn chưa quen có khoản đó nên sẽ không thấy thiếu.' },
            { text: 'Chờ vài tháng xem thu nhập ổn định rồi tính', correct: false, explain: 'Sau vài tháng, khoản tăng thêm thường đã hoà vào chi tiêu hằng ngày.' },
          ]),
        ],
      },
      {
        slug: 'nghi-huu-bat-dau-hom-nay',
        title: 'Nghỉ hưu bắt đầu từ hôm nay',
        summary: 'Vì sao mười năm đầu quan trọng hơn hai mươi năm sau.',
        est_minutes: 4,
        xp_reward: 40,
        frames: [
          s(`${ISLAND}/level-6.png`, 'Người bắt đầu sớm hơn 10 năm thường về đích trước, dù bỏ vào ít tiền hơn.', 'Đảo Thịnh Vượng'),
          t(
            'Hai người bạn',
            'Hùng bắt đầu để dành 2.000.000đ mỗi tháng từ năm 25 tuổi, và dừng lại sau 10 năm.\n\nNam bắt đầu ở tuổi 35, cũng 2.000.000đ mỗi tháng, và làm liên tục 25 năm đến khi 60.\n\nVới lãi 7% một năm, đến tuổi 60 Hùng thường vẫn nhiều hơn Nam, dù chỉ bỏ vào 240 triệu so với 600 triệu của Nam.\n\nKhác biệt duy nhất là **thời gian tiền được ở trong đó**. Đây là lý do câu trả lời cho "khi nào nên bắt đầu" luôn là hôm nay.',
          ),
          t(
            'Ba việc làm trong tuần này',
            '**1. Kiểm tra bạn đã đóng bảo hiểm xã hội đủ và đúng chưa.** Đây là nền lương hưu của bạn và nhiều người không kiểm tra bao giờ.\n\n**2. Đặt một lệnh chuyển tiền tự động**, dù chỉ 200.000đ mỗi tháng.\n\n**3. Viết ra con số bạn cần mỗi tháng khi nghỉ hưu.** Chỉ cần ước lượng thô. Có một con số vẫn tốt hơn không có gì.\n\nBạn đã đi hết hành trình sáu hòn đảo. Phần còn lại là giữ chuỗi streak của mình.',
            { image: `${PIG}/pig-6.png`, imageAlt: 'Chú heo ở cấp độ 6' },
          ),
          q('Vì sao bắt đầu tiết kiệm sớm lại quan trọng đến vậy?', [
            { text: 'Vì lãi suất khi còn trẻ thường cao hơn', correct: false, explain: 'Lãi suất không phụ thuộc vào tuổi của bạn.' },
            { text: 'Vì tiền có thêm nhiều năm để lãi sinh ra lãi', correct: true, explain: 'Đúng. Thời gian là biến số mạnh nhất trong công thức lãi kép.' },
            { text: 'Vì khi trẻ bạn kiếm được nhiều tiền hơn', correct: false, explain: 'Thường thì ngược lại. Lợi thế nằm ở thời gian, không ở thu nhập.' },
          ]),
        ],
      },
    ],
  },
];
