/**
 * Bảng đối chiếu Việt → Anh cho **nội dung** và cho những câu do server sinh ra.
 *
 * Khoá là chính câu tiếng Việt, khớp trọn chuỗi (xem `server/i18n/index.js`).
 * Sửa một câu tiếng Việt trong Admin thì nhớ sửa khoá tương ứng ở đây, nếu không
 * câu đó sẽ hiện tiếng Việt trong bản tiếng Anh.
 *
 * Thứ tự các phần đi theo đường người học gặp chúng: mô đun → bài học → khung
 * bài → trắc nghiệm → nhóm chi tiêu, huy hiệu, cấp độ, chức năng → mục tiêu gợi
 * ý → Ekko bot → thông báo lỗi.
 */
export const EN = {
  // ------------------------------------------------------------- mô đun
  'Bắt đầu với tiền của bạn': 'Start with your money',
  'Ba bài học nền tảng: tiền của bạn đang đi đâu, ghi lại nó thế nào, và phân biệt điều cần với điều muốn.':
    'Three foundation lessons: where your money goes, how to write it down, and telling needs from wants.',
  'Lập ngân sách hằng tháng': 'Build a monthly budget',
  'Từ con số lương về tay đến một bản ngân sách bạn thực sự dùng được, theo quy tắc 50/30/20.':
    'From your take-home pay to a budget you will actually use, built on the 50/30/20 rule.',
  'Quỹ dự phòng và mục tiêu tiết kiệm': 'Emergency fund and savings goals',
  'Xây tấm đệm an toàn trước, rồi mới đến những mục tiêu bạn thực sự mong muốn.':
    'Build the safety cushion first, then go after the goals you actually want.',
  'Nợ và ứng lương thông minh': 'Debt and smart salary advances',
  'Hiểu lãi suất thật, phân biệt nợ tốt với nợ xấu, và dùng ứng lương như một công cụ thay vì một cái bẫy.':
    'Understand real interest rates, tell good debt from bad, and use a salary advance as a tool rather than a trap.',
  'Bảo vệ và đầu tư': 'Protect and invest',
  'Bảo hiểm cơ bản, những bước đầu tư đầu tiên, và cách nhận ra một lời mời lừa đảo.':
    'Basic insurance, your first investing steps, and how to spot a scam pitch.',
  'Làm chủ tài chính dài hạn': 'Master the long game',
  'Ghép mọi thứ đã học thành một hệ thống chạy được trong nhiều năm.':
    'Put everything together into a system that runs for years.',

  // ------------------------------------------------------------ bài học
  'Tiền của bạn đi đâu?': 'Where does your money go?',
  'Hầu hết chúng ta không biết mình tiêu gì trong tháng vừa rồi. Bài này chỉ ra lý do.':
    'Most of us cannot say what we spent last month. This lesson explains why.',
  'Ghi chép chi tiêu trong 3 phút mỗi ngày': 'Track your spending in 3 minutes a day',
  'Phương pháp ghi chép đủ nhanh để bạn không bỏ cuộc sau ba ngày.':
    'A tracking method fast enough that you will not quit after three days.',
  'Phân biệt "cần" và "muốn"': 'Telling “need” from “want”',
  'Công cụ đơn giản nhất để cắt giảm chi tiêu mà không thấy khổ sở.':
    'The simplest tool for cutting spending without feeling deprived.',
  'Ngân sách không phải là ăn kiêng': 'A budget is not a diet',
  'Hiểu đúng bản chất ngân sách trước khi lập bản đầu tiên.':
    'Understand what a budget really is before you build your first one.',
  'Quy tắc 50/30/20': 'The 50/30/20 rule',
  'Khung chia tiền đơn giản nhất để bắt đầu, và cách điều chỉnh cho thu nhập Việt Nam.':
    'The simplest split to start with, and how to adapt it to Vietnamese incomes.',
  'Lập bản ngân sách đầu tiên của bạn': 'Build your first budget',
  'Làm ngay trong app, từng bước một.': 'Do it right here in the app, step by step.',
  'Quỹ khẩn cấp: tấm đệm 3 đến 6 tháng': 'Emergency fund: a 3 to 6 month cushion',
  'Khoản tiền giúp một sự cố không biến thành một khoản nợ.':
    'The money that keeps an accident from turning into a debt.',
  'Đặt mục tiêu tiết kiệm đúng cách': 'Set a savings goal properly',
  'Một mục tiêu tốt luôn có con số, có hạn, và chia được thành từng tuần.':
    'A good goal always has a number, a deadline, and weekly pieces.',
  'Để việc tiết kiệm tự chạy': 'Put saving on autopilot',
  'Cách duy nhất để tiết kiệm bền là không phải quyết định lại mỗi tháng.':
    'The only way saving lasts is not having to decide again every month.',
  'Nợ tốt và nợ xấu': 'Good debt and bad debt',
  'Không phải khoản vay nào cũng xấu. Điều quyết định là nó tạo ra hay lấy đi giá trị.':
    'Not every loan is bad. What matters is whether it creates value or drains it.',
  'Lãi kép hoạt động thế nào': 'How compound interest works',
  'Cùng một cơ chế: nó làm giàu cho người tiết kiệm và làm nghèo người mắc nợ.':
    'One mechanism: it makes savers richer and borrowers poorer.',
  'Dùng ứng lương đúng cách': 'Use a salary advance the right way',
  'Ứng lương Ekko là tiền bạn đã làm ra. Dùng đúng thì nó thay thế khoản vay lãi cao.':
    'An Ekko advance is money you already earned. Used well, it replaces a high-interest loan.',
  'Bảo hiểm: mua cái gì trước': 'Insurance: what to buy first',
  'Thứ tự ưu tiên và những khoản không cần mua.': 'The order of priorities, and what you can skip.',
  'Bắt đầu đầu tư với số tiền nhỏ': 'Start investing with a small amount',
  'Ba điều kiện cần có trước khi đầu tư đồng đầu tiên.':
    'Three things to have in place before your first invested dong.',
  'Nhận ra bẫy lừa đảo tài chính': 'Spot a financial scam',
  'Bốn dấu hiệu xuất hiện trong gần như mọi vụ lừa đảo.':
    'Four signs that show up in almost every scam.',
  'Kế hoạch tài chính 12 tháng': 'A 12-month financial plan',
  'Một trang giấy, bốn con số, xem lại mỗi quý.': 'One page, four numbers, reviewed every quarter.',
  'Tăng thu nhập bền vững': 'Grow your income sustainably',
  'Cắt giảm có giới hạn, tăng thu nhập thì không.': 'Cutting back has a floor. Earning more does not.',
  'Nghỉ hưu bắt đầu từ hôm nay': 'Retirement starts today',
  'Vì sao mười năm đầu quan trọng hơn hai mươi năm sau.':
    'Why the first ten years matter more than the twenty that follow.',

  // ------------------------------------------- khung bài · mô đun 1
  'Câu hỏi khó nhất về tiền': 'The hardest question about money',
  'Thử trả lời nhanh: **tháng trước bạn tiêu bao nhiêu cho ăn uống?**\n\nGần như ai cũng ngập ngừng. Không phải vì bạn tiêu hoang, mà vì tiền rời khỏi ví theo hàng chục lần nhỏ lẻ mà não không ghi nhớ nổi.\n\nNhiều người cũng vậy khi mới bắt đầu: có lương, có tiêu, nhưng không có bức tranh.':
    'Answer quickly: **how much did you spend on food and drink last month?**\n\nAlmost everyone hesitates. Not because you overspend, but because money leaves your wallet in dozens of small pieces your brain cannot keep track of.\n\nEveryone starts here: pay comes in, money goes out, but there is no picture.',
  'Chiếc ví với những khoản tiền toả đi nhiều hướng': 'A wallet with money fanning out in every direction',
  'Bước đầu tiên luôn là nhìn thấy.': 'The first step is always seeing it.',
  'Ba dòng tiền bạn cần thấy': 'The three money flows you need to see',
  '**1. Tiền vào** - lương, thưởng, làm thêm.\n\n**2. Tiền ra cố định** - tiền nhà, điện nước, học phí con. Nhóm này ít thay đổi và dễ đoán.\n\n**3. Tiền ra linh hoạt** - ăn uống, đi lại, mua sắm, giải trí. Nhóm này chính là nơi tiền biến mất mà bạn không hay.\n\nKhi bạn tách được nhóm 2 và nhóm 3, bạn đã đi trước phần lớn mọi người.':
    '**1. Money in** — salary, bonuses, side work.\n\n**2. Fixed money out** — rent, utilities, school fees. This group barely moves and is easy to predict.\n\n**3. Flexible money out** — food, transport, shopping, fun. This is exactly where money vanishes without you noticing.\n\nOnce you can separate group 2 from group 3, you are ahead of most people.',
  'Chạm vào từng nơi tiền rò rỉ': 'Tap each place money leaks',
  'Bốn điểm dưới đây là nơi tiền thoát ra nhiều nhất. Chạm vào từng điểm sáng.':
    'These four spots are where the most money escapes. Tap each highlight.',
  'Chi lặt vặt': 'Odds and ends',
  'Cà phê 30.000đ, gửi xe 5.000đ, nước 15.000đ. Mỗi ngày 50.000đ là 1.500.000đ một tháng.':
    'Coffee 30,000đ, parking 5,000đ, a drink 15,000đ. At 50,000đ a day that is 1,500,000đ a month.',
  'Mua theo cảm xúc': 'Emotional buying',
  'Đơn hàng đặt lúc 11 giờ đêm hiếm khi là thứ bạn thực sự cần. Hãy để giỏ hàng qua đêm.':
    'An order placed at 11pm is rarely something you truly need. Let the cart sit overnight.',
  'Phí tự động': 'Automatic charges',
  'Gói cước, ứng dụng, gói bảo hiểm cũ vẫn trừ tiền đều đặn dù bạn không còn dùng.':
    'Phone plans, apps and old policies keep charging you long after you stopped using them.',
  'Trả hộ, cho mượn': 'Paying for others, lending',
  'Những khoản không ai nhắc lại. Ghi vào sổ để nhớ, không phải để đòi.':
    'The amounts nobody brings up again. Write them down to remember, not to chase.',
  ' Nội dung': ' Content',
  'Vì sao mọi người bỏ ghi chép': 'Why people give up on tracking',
  'Không phải vì lười. Vì cách ghi quá nặng.\n\nMở ứng dụng, chọn ví, chọn nhóm, gõ ghi chú, chọn ngày, bấm lưu. Sáu thao tác cho một ly cà phê 30.000đ thì ai cũng bỏ.\n\nQuy tắc duy nhất cần nhớ: **ghi càng nhanh càng bền**.':
    'Not laziness. The method is simply too heavy.\n\nOpen the app, pick a wallet, pick a category, type a note, pick a date, hit save. Six steps for a 30,000đ coffee and anyone would quit.\n\nThe only rule worth remembering: **the faster you log, the longer you last**.',
  'Điện thoại đang ghi khoản chi, bên cạnh là đồng hồ ba phút':
    'A phone logging an expense beside a three-minute timer',
  'Cách nhanh nhất: nhắn cho Ekko bot': 'The fastest way: message Ekko bot',
  'Trong app này, bạn chỉ cần nhắn cho Ekko bot đúng một câu như bạn nói với bạn bè:\n\n> cà phê 35k\n\n> ăn trưa 60 nghìn\n\n> grab về nhà 85k\n\nEkko bot đọc số tiền, đoán nhóm chi tiêu và lưu vào sổ. Bạn xác nhận là xong. Ba giây, không phải ba phút.':
    'In this app you send Ekko bot one line, the way you would tell a friend:\n\n> coffee 35k\n\n> lunch 60 thousand\n\n> grab home 85k\n\nEkko bot reads the amount, guesses the category and files it. You confirm and you are done. Three seconds, not three minutes.',
  'Ghi khi nào?': 'When should you log it?',
  'Ngay lúc trả tiền. Không phải cuối ngày, càng không phải cuối tuần.\n\nMẹo thực tế: gắn việc ghi vào một hành động sẵn có. Vừa cất ví hoặc vừa đóng app ngân hàng là mở Ekko bot ghi ngay.\n\nSau 7 ngày liên tiếp, việc này thành phản xạ và bạn không cần cố nữa. Đó cũng là lúc bạn nhận huy hiệu **Streak 7 ngày**.':
    'The moment you pay. Not at the end of the day, and definitely not at the weekend.\n\nA practical trick: attach logging to something you already do. Just put your wallet away, or just closed your banking app — open Ekko bot and log it.\n\nAfter 7 days in a row it becomes reflex and stops taking effort. That is also when the **7-day streak** badge lands.',
  'Hai câu hỏi, không phải một': 'Two questions, not one',
  'Khi định mua gì đó, đừng hỏi "cái này có đáng không". Câu đó quá mơ hồ.\n\nHỏi hai câu cụ thể:\n\n**Nếu không có nó tuần này, cuộc sống của tôi có gì hỏng không?**\n\n**Tôi đã muốn nó từ bao lâu rồi?**\n\nCâu một tách "cần" khỏi "muốn". Câu hai tách "muốn thật" khỏi "muốn bốc đồng".':
    'When you are about to buy something, do not ask “is this worth it”. That is too vague.\n\nAsk two specific questions:\n\n**If I go without it this week, does anything in my life break?**\n\n**How long have I wanted it?**\n\nThe first separates need from want. The second separates a real want from an impulse.',
  'Xếp thử vào đúng nhóm': 'Sort them into the right group',
  'Chạm từng điểm để xem ví dụ thuộc mỗi nhóm.': 'Tap each spot to see examples from that group.',
  'Cái cân hai đĩa: một bên là thứ cần, một bên là thứ muốn':
    'A two-pan scale with needs on one side and wants on the other',
  'Cần': 'Need',
  'Gạo, tiền trọ, thuốc men, vé xe đi làm, học phí của con. Thiếu là ảnh hưởng ngay tuần này.':
    'Rice, rent, medicine, the fare to work, school fees. Go without and this week suffers.',
  'Muốn thật': 'Real want',
  'Đôi giày bạn ngắm ba tháng nay, khoá học tiếng Anh. Đáng chi, nhưng nên có kế hoạch.':
    'The shoes you have eyed for three months, an English course. Worth buying, but plan for it.',
  'Muốn bốc đồng': 'Impulse want',
  'Món đồ vừa thấy trên livestream 10 phút trước. Đây là nhóm cắt được ngay mà không thấy tiếc.':
    'The thing you saw on a livestream ten minutes ago. This is the group you can cut without missing it.',
  'Quy tắc 24 giờ': 'The 24-hour rule',
  'Với mọi khoản "muốn" trên 500.000đ, để nó nằm trong giỏ hàng đúng 24 giờ.\n\nHôm sau đọc lại, phần lớn sẽ tự thấy không cần nữa. Số còn lại là thứ bạn thực sự muốn, và lúc đó mua sẽ thấy vui chứ không thấy hối.\n\nĐây là một trong những mẹo tiết kiệm hiếm hoi không đòi hỏi bạn phải kỷ luật.':
    'For any “want” above 500,000đ, leave it in the cart for a full 24 hours.\n\nRead it again the next day and most of it will no longer feel necessary. What remains is what you actually want, and buying it then feels good rather than regrettable.\n\nThis is one of the rare saving tricks that asks nothing of your willpower.',

  // ------------------------------------------- khung bài · mô đun 2
  'Ngân sách là lời hứa với chính mình': 'A budget is a promise to yourself',
  'Nhiều người nghe "lập ngân sách" là nghĩ đến cắt giảm, nhịn ăn, không đi chơi. Không phải vậy.\n\nNgân sách chỉ là việc **quyết định trước** tiền sẽ đi đâu, thay vì để cuối tháng nhìn lại và tự hỏi tiền đi đâu mất rồi.\n\nBạn vẫn được đi cà phê. Chỉ khác là bạn biết mình có bao nhiêu cho việc đó.':
    'Many people hear “budget” and picture cutting back, skipping meals, staying home. It is not that.\n\nA budget is simply **deciding in advance** where the money goes, instead of looking back at month end wondering where it went.\n\nYou still get your coffee. The difference is you know how much you have for it.',
  'Đĩa tròn chia thành các phần chi tiêu, ở giữa là gương mặt cười':
    'A pie split into spending slices with a smiling face in the middle',
  'Bắt đầu từ con số thật': 'Start from the real number',
  'Ngân sách sai gần như luôn vì một lý do: người lập dùng con số mình *mong muốn* thay vì con số *thật*.\n\nTrước khi lập, hãy lấy dữ liệu 30 ngày gần nhất từ mục Ghi chép chi tiêu. Nếu tháng trước bạn tiêu 4.200.000đ cho ăn uống, đừng đặt ngân sách 2.000.000đ. Hãy đặt 3.800.000đ và giảm dần.\n\nNgân sách cắt quá sâu sẽ bị bỏ trong hai tuần.':
    'Budgets fail for one reason above all: they are built on the number people *wish* for instead of the *real* one.\n\nBefore you start, pull the last 30 days from your expense log. If you spent 4,200,000đ on food last month, do not budget 2,000,000đ. Budget 3,800,000đ and bring it down gradually.\n\nA budget cut too deep gets abandoned within a fortnight.',
  '50% thiết yếu · 30% mong muốn · 20% tương lai': '50% needs · 30% wants · 20% future',
  'Vòng tròn chia ba phần theo tỉ lệ 50, 30 và 20': 'A circle split into 50, 30 and 20 percent',
  'Ba chiếc hũ': 'Three jars',
  '**50% cho nhu cầu thiết yếu** - tiền nhà, điện nước, ăn uống cơ bản, đi lại đi làm, học phí con.\n\n**30% cho mong muốn** - ăn ngoài, giải trí, mua sắm, du lịch.\n\n**20% cho tương lai** - trả nợ và tiết kiệm.\n\nVới lương 10.000.000đ: 5.000.000đ thiết yếu, 3.000.000đ mong muốn, 2.000.000đ cho tương lai.':
    '**50% for needs** — rent, utilities, basic food, the commute, school fees.\n\n**30% for wants** — eating out, fun, shopping, travel.\n\n**20% for the future** — debt repayment and savings.\n\nOn a 10,000,000đ salary: 5,000,000đ needs, 3,000,000đ wants, 2,000,000đ future.',
  'Điều chỉnh cho thực tế Việt Nam': 'Adjusting for Vietnam',
  'Ở các thành phố lớn, riêng tiền thuê nhà đã có thể chiếm 30-35% thu nhập. Lúc đó tỷ lệ 50/30/20 khó giữ nguyên.\n\nCách điều chỉnh hợp lý: **60/20/20**. Giữ nguyên 20% cho tương lai, ép phần mong muốn xuống.\n\nĐiều quan trọng không phải con số 50 hay 60, mà là **phần 20% cho tương lai không bị đụng đến**. Đó là phần duy nhất làm bạn khá lên theo thời gian.':
    'In the big cities rent alone can take 30–35% of income, which makes a straight 50/30/20 hard to hold.\n\nA sensible adjustment: **60/20/20**. Keep the 20% for the future and squeeze the wants.\n\nWhat matters is not whether it is 50 or 60, but that **the 20% for the future stays untouched**. That is the only slice that makes you better off over time.',
  'Bốn bước, làm một lần trong tháng': 'Four steps, once a month',
  '**Bước 1.** Nhập thu nhập thực nhận trong tháng.\n\n**Bước 2.** Điền các khoản cố định trước: nhà, điện nước, học phí. Đây là phần bạn biết chắc.\n\n**Bước 3.** Chia phần còn lại cho các nhóm linh hoạt dựa trên số liệu tháng trước.\n\n**Bước 4.** Đặt phần tiết kiệm **trước**, không phải phần còn thừa. Đây là điểm khác biệt lớn nhất giữa người tiết kiệm được và người không.':
    '**Step 1.** Enter the income you actually take home this month.\n\n**Step 2.** Fill in the fixed costs first: rent, utilities, school fees. This is the part you know for certain.\n\n**Step 3.** Split what is left across the flexible categories, using last month’s numbers.\n\n**Step 4.** Set savings **first**, not from the leftovers. This is the single biggest difference between people who save and people who do not.',
  'Bản ngân sách với các dòng nhóm chi và dấu tích hoàn thành':
    'A budget sheet with category rows and completion ticks',
  'Theo dõi trong tháng': 'Tracking through the month',
  'Màn Lập ngân sách sẽ hiển thị từng nhóm với một thanh tiến độ: đã tiêu bao nhiêu trên hạn mức bạn đặt.\n\nKhi một nhóm chạm 80%, bạn thấy ngay và còn kịp điều chỉnh. Khi vượt 100%, hãy lấy phần bù từ nhóm mong muốn chứ đừng lấy từ phần tiết kiệm.\n\nMỗi ngày bạn mở mục này lần đầu, chuỗi streak của bạn cũng được cộng thêm một ngày.':
    'The Budget screen shows each category with a progress bar: how much you have spent against the limit you set.\n\nWhen a category hits 80% you see it in time to adjust. When it passes 100%, cover the gap from your wants, not from your savings.\n\nThe first time you open this each day, your streak gains a day too.',

  // ------------------------------------------- khung bài · mô đun 3
  'Vì sao đây là việc đầu tiên': 'Why this comes first',
  'Xe hỏng 2.000.000đ. Con ốm phải nhập viện. Công ty giảm giờ làm.\n\nNếu không có khoản dự phòng, mỗi sự cố như vậy đều biến thành một khoản vay. Và khoản vay lãi cao là thứ kéo lùi tài chính của bạn nhiều năm.\n\nQuỹ khẩn cấp không làm bạn giàu lên. Nó giữ cho bạn không nghèo đi vì những chuyện ngoài ý muốn.':
    'A 2,000,000đ repair. A child in hospital. The company cuts your hours.\n\nWithout savings behind you, each of these turns into a loan. And a high-interest loan sets your finances back years.\n\nAn emergency fund will not make you rich. It keeps you from getting poorer because of things you did not choose.',
  'Chiếc ô che cho hai chồng tiền tiết kiệm': 'An umbrella sheltering two stacks of savings',
  'Cần bao nhiêu và để ở đâu': 'How much, and where to keep it',
  '**Mục tiêu ban đầu: 1 tháng chi phí thiết yếu.** Đừng nhắm ngay 6 tháng, con số đó làm nản lòng.\n\nĐạt được 1 tháng rồi thì nâng dần lên 3 tháng, sau đó 6 tháng nếu thu nhập của bạn không ổn định.\n\n**Để ở đâu:** một tài khoản tiết kiệm riêng, tách khỏi tài khoản chi tiêu hằng ngày. Không để chung ví, vì để chung là sẽ tiêu.':
    '**First target: one month of essential costs.** Do not aim straight at six months; that number just discourages people.\n\nOnce you hit one month, work up to three, then six if your income is unsteady.\n\n**Where to keep it:** a separate savings account, away from the one you spend from. Not in the same wallet — same wallet means it gets spent.',
  'Ba mức của quỹ dự phòng': 'The three levels of an emergency fund',
  'Đi từ mức thấp nhất lên cao nhất. Chạm vào từng mức.': 'Work from the lowest to the highest. Tap each level.',
  'Mức 3: sáu tháng': 'Level 3: six months',
  'Dành cho người thu nhập theo mùa vụ, làm tự do, hoặc là lao động chính duy nhất trong nhà.':
    'For seasonal earners, freelancers, or the only earner in the household.',
  'Mức 2: ba tháng': 'Level 2: three months',
  'Mức tiêu chuẩn. Đủ để bạn tìm việc mới mà không phải nhận vội một công việc tệ.':
    'The standard. Enough to find a new job without rushing into a bad one.',
  'Mức 1: một tháng': 'Level 1: one month',
  'Bắt đầu từ đây. Chỉ cần đủ chi phí thiết yếu một tháng là bạn đã an toàn hơn hẳn.':
    'Start here. One month of essentials already makes you far safer.',
  'Từ mong muốn thành mục tiêu': 'From a wish to a goal',
  '"Muốn tiết kiệm nhiều hơn" không phải mục tiêu. Không có con số, không có hạn, nên không có cách biết mình đang thắng hay thua.\n\nĐổi thành: **"Tiết kiệm 20.000.000đ mua xe máy trước tháng 6 năm sau."**\n\nGiờ nó chia được: 20.000.000đ trong 10 tháng là 2.000.000đ mỗi tháng, tức khoảng 67.000đ mỗi ngày. Con số hằng ngày mới là thứ bạn thực sự quyết định được.':
    '“I want to save more” is not a goal. No number, no deadline, so no way to know whether you are winning.\n\nTurn it into: **“Save 20,000,000đ for a motorbike before June next year.”**\n\nNow it divides: 20,000,000đ over 10 months is 2,000,000đ a month, about 67,000đ a day. The daily number is the one you can actually decide on.',
  'Mũi tên cắm trúng hồng tâm, bên cạnh là chồng tiền': 'An arrow in the bullseye beside a stack of money',
  'Ba mục tiêu là tối đa': 'Three goals is the maximum',
  'Đặt nhiều mục tiêu cùng lúc là cách chắc chắn để không đạt được cái nào.\n\nThứ tự hợp lý:\n\n1. Quỹ khẩn cấp một tháng\n2. Trả hết khoản nợ lãi cao nhất\n3. Một mục tiêu bạn thực sự mong muốn\n\nMục tiêu thứ ba quan trọng hơn bạn nghĩ. Nó là phần thưởng giữ cho bạn không bỏ cuộc.':
    'Setting many goals at once is a reliable way to finish none of them.\n\nA sensible order:\n\n1. A one-month emergency fund\n2. Clear the highest-interest debt\n3. One goal you genuinely want\n\nThe third matters more than you think. It is the reward that keeps you from quitting.',
  'Đừng dựa vào ý chí': 'Do not rely on willpower',
  'Ý chí là nguồn lực có hạn và nó cạn vào cuối ngày, đúng lúc bạn dễ tiêu tiền nhất.\n\nGiải pháp là bỏ ý chí ra khỏi phương trình: đặt lệnh chuyển tiền tự động sang tài khoản tiết kiệm vào **đúng ngày lương về**.\n\nTiền chưa kịp nằm trong tài khoản chi tiêu thì bạn không có cảm giác mất nó.':
    'Willpower is a limited resource, and it runs out late in the day — exactly when spending is easiest.\n\nThe fix is to take willpower out of the equation: set an automatic transfer to savings **on the day your pay lands**.\n\nMoney that never sits in your spending account never feels lost.',
  'Két sắt với mũi tên vòng lặp tự động chuyển tiền vào':
    'A safe with a looping arrow feeding money in automatically',
  'Bắt đầu nhỏ đến mức buồn cười': 'Start almost absurdly small',
  'Nếu 20% là quá sức, hãy bắt đầu với 3%. Với lương 8.000.000đ thì đó là 240.000đ.\n\nMục tiêu của tháng đầu không phải số tiền, mà là **chứng minh cho chính bạn rằng bạn làm được**.\n\nMỗi lần tăng lương, tăng tỷ lệ tiết kiệm lên trước khi bạn kịp quen với mức sống mới. Đây là mẹo hiệu quả nhất trong toàn bộ khoá học này.':
    'If 20% is out of reach, start at 3%. On an 8,000,000đ salary that is 240,000đ.\n\nThe goal of month one is not the amount — it is **proving to yourself that you can**.\n\nEvery time your pay rises, raise the savings rate before you get used to the new lifestyle. This is the most effective trick in the whole course.',

  // ------------------------------------------- khung bài · mô đun 4
  'Một câu hỏi để phân loại': 'One question to sort it out',
  '**Khoản vay này có làm tăng khả năng kiếm tiền hoặc giá trị tài sản của tôi không?**\n\nCó: vay học nghề, vay mua xe để đi làm, vay mua nhà ở. Đây là nợ tốt, miễn là khoản trả hằng tháng nằm trong khả năng.\n\nKhông: vay để mua điện thoại đời mới, vay để đi du lịch, vay để trả một khoản vay khác. Đây là nợ xấu, và nhóm cuối cùng là dấu hiệu nguy hiểm nhất.':
    '**Does this loan raise my earning power or the value of what I own?**\n\nYes: training, a bike to get to work, a home to live in. That is good debt, as long as the monthly payment is within reach.\n\nNo: the latest phone, a holiday, or repaying another loan. That is bad debt — and the last one is the most dangerous sign of all.',
  'Hai tấm thẻ: một đường đi lên màu xanh, một đường đi xuống màu đỏ':
    'Two cards: one green line rising, one red line falling',
  'Nhìn vào lãi suất thật': 'Look at the real interest rate',
  'Một khoản vay quảng cáo "chỉ 2% mỗi tháng" nghe rất nhẹ. Nhưng 2% mỗi tháng là **hơn 24% mỗi năm**, cao hơn hầu hết thẻ tín dụng.\n\nLuôn quy mọi lãi suất về **năm** trước khi so sánh. Và luôn hỏi tổng số tiền phải trả, không chỉ số tiền trả mỗi tháng.\n\nCâu "trả góp chỉ 500.000đ một tháng" giấu đi việc bạn sẽ trả trong 24 tháng, tức 12.000.000đ cho món hàng giá 8.000.000đ.':
    'A loan advertised at “only 2% a month” sounds gentle. But 2% a month is **more than 24% a year**, higher than most credit cards.\n\nAlways convert every rate to a **yearly** figure before comparing. And always ask for the total you will repay, not just the monthly payment.\n\n“Only 500,000đ a month” hides the fact that you pay for 24 months — 12,000,000đ for an 8,000,000đ item.',
  'Lãi sinh ra lãi. Thời gian là biến số mạnh nhất.':
    'Interest earns interest. Time is the strongest variable.',
  'Các cột tiền cao dần theo đường cong đi lên': 'Money columns rising along an upward curve',
  'Con số làm bạn bất ngờ': 'The number that surprises people',
  'Gửi 2.000.000đ mỗi tháng, lãi suất 6% một năm:\n\nSau 5 năm: khoảng **140.000.000đ**\n\nSau 10 năm: khoảng **328.000.000đ**\n\nSau 20 năm: khoảng **924.000.000đ**\n\nTrong 20 năm bạn chỉ bỏ vào 480.000.000đ. Gần một nửa số cuối là do lãi sinh ra lãi. Thời gian làm phần việc nặng nhất, không phải số tiền.':
    'Save 2,000,000đ a month at 6% a year:\n\nAfter 5 years: about **140,000,000đ**\n\nAfter 10 years: about **328,000,000đ**\n\nAfter 20 years: about **924,000,000đ**\n\nOver those 20 years you only put in 480,000,000đ. Nearly half the final figure is interest earning interest. Time does the heavy lifting, not the amount.',
  'Mặt còn lại của đồng xu': 'The other side of the coin',
  'Cơ chế đó chạy ngược lại với nợ.\n\nDư nợ thẻ tín dụng 20.000.000đ, lãi 30% một năm, nếu chỉ trả mức tối thiểu thì bạn sẽ trả trong nhiều năm và tổng tiền lãi có thể vượt cả gốc.\n\nĐây là lý do quy tắc thứ tự luôn là: **trả hết khoản nợ lãi cao nhất trước khi nghĩ đến đầu tư.** Không khoản đầu tư an toàn nào trả cho bạn 30% một năm.':
    'The same mechanism runs in reverse on debt.\n\nA 20,000,000đ credit card balance at 30% a year, paid at the minimum, takes years to clear and the interest alone can exceed the original amount.\n\nWhich is why the order is always: **clear the highest-interest debt before you think about investing.** No safe investment pays you 30% a year.',
  'Ứng lương khác vay tiền': 'An advance is not a loan',
  'Khi bạn ứng lương qua Ekko, bạn nhận trước phần lương **bạn đã làm ra** trong tháng này. Đó không phải khoản vay từ một bên thứ ba, và không có lãi suất kiểu tín dụng.\n\nGiá trị lớn nhất của nó là thay thế những lựa chọn tệ hơn: vay nóng, vay app lãi cao, hoặc mua trả góp lãi ẩn.':
    'When you take an advance through Ekko, you receive pay **you have already earned** this month. It is not borrowing from a third party, and it carries no credit-style interest.\n\nIts real value is replacing worse options: loan sharks, high-interest lending apps, or instalments with hidden interest.',
  'Tờ lịch tháng với một ngày được đánh dấu': 'A monthly calendar with one day marked',
  'Ba câu hỏi trước khi ứng': 'Three questions before you take an advance',
  '**1. Việc này có gấp thật không?** Viện phí thì có. Đợt sale thì không.\n\n**2. Tháng tới tôi có xoay xở được với phần lương còn lại không?** Nếu câu trả lời là không, ứng lương chỉ đẩy vấn đề sang tháng sau.\n\n**3. Đây là lần thứ mấy trong ba tháng gần đây?** Ứng đều đặn mỗi tháng là tín hiệu chi tiêu đang vượt thu nhập, và điều cần sửa là ngân sách chứ không phải dòng tiền.':
    '**1. Is this genuinely urgent?** A hospital bill is. A sale is not.\n\n**2. Can I manage next month on what is left?** If the answer is no, an advance only pushes the problem forward a month.\n\n**3. How many times has this been in the last three months?** Advancing every month signals that spending exceeds income, and what needs fixing is the budget, not the cash flow.',

  // ------------------------------------------- khung bài · mô đun 5
  'Bảo hiểm y tế trước tiên': 'Health insurance comes first',
  'Bảo hiểm y tế bắt buộc là khoản có tỷ lệ giá trị trên chi phí tốt nhất mà bạn có thể mua ở Việt Nam. Nếu đang đi làm chính thức, bạn đã có.\n\nNếu làm tự do, hãy mua bảo hiểm y tế tự nguyện. Chi phí một năm thấp hơn một lần nằm viện ngắn.\n\nSau đó mới đến bảo hiểm tai nạn và bảo hiểm nhân thọ, và chỉ khi bạn là người tạo thu nhập chính cho gia đình.':
    'Compulsory health insurance is the best value-for-money cover you can buy in Vietnam. If you are formally employed, you already have it.\n\nIf you freelance, buy voluntary health insurance. A year of premiums costs less than one short hospital stay.\n\nOnly after that come accident cover and life insurance — and only if you are the household’s main earner.',
  'Hai lỗi thường gặp': 'Two common mistakes',
  '**Lỗi một: mua bảo hiểm nhân thọ như một kênh đầu tư.** Sản phẩm kết hợp bảo vệ và đầu tư thường kém ở cả hai vai. Nếu cần bảo vệ, mua sản phẩm bảo vệ thuần. Nếu cần đầu tư, đầu tư riêng.\n\n**Lỗi hai: mua khi chưa có quỹ khẩn cấp.** Nhiều người phải huỷ hợp đồng giữa chừng vì không đóng nổi phí, và mất phần lớn số đã đóng.':
    '**Mistake one: buying life insurance as an investment.** Products that combine protection and investing tend to be poor at both. If you need protection, buy pure protection. If you need to invest, invest separately.\n\n**Mistake two: buying before you have an emergency fund.** Many people cancel midway because they cannot keep up the premiums, and lose most of what they paid in.',
  'Tấm khiên có dấu chữ thập bảo vệ': 'A shield bearing a protective cross',
  'Ba điều kiện, không thiếu cái nào': 'Three conditions, all of them',
  '**1. Đã có quỹ khẩn cấp ít nhất 3 tháng.**\n\n**2. Đã trả hết nợ lãi trên 15% một năm.**\n\n**3. Số tiền đầu tư là tiền bạn không cần đến trong 3 năm tới.**\n\nThiếu một trong ba, bạn sẽ phải bán ra đúng lúc thị trường xuống, và đó là cách phổ biến nhất để mất tiền.':
    '**1. An emergency fund of at least 3 months.**\n\n**2. No remaining debt above 15% a year.**\n\n**3. The money invested is money you will not need for 3 years.**\n\nMiss any one of these and you will be forced to sell exactly when the market is down — the most common way to lose money.',
  'Mầm cây mọc lên từ chồng đồng xu': 'A seedling growing from a stack of coins',
  'Bắt đầu ở đâu': 'Where to begin',
  'Với người mới, thứ tự rủi ro từ thấp đến cao:\n\n**Gửi tiết kiệm ngân hàng** - an toàn, lãi thấp, phù hợp cho quỹ khẩn cấp.\n\n**Chứng chỉ quỹ mở** - do công ty quản lý quỹ đầu tư giúp, số tiền tối thiểu thấp, phù hợp để bắt đầu.\n\n**Cổ phiếu riêng lẻ** - cần thời gian tìm hiểu từng doanh nghiệp. Đừng bắt đầu ở đây.\n\nĐiều quan trọng nhất với người mới không phải chọn đúng kênh, mà là **đều đặn và không bán khi hoảng loạn**.':
    'For a beginner, from lowest risk to highest:\n\n**A bank savings account** — safe, low return, right for an emergency fund.\n\n**Open-ended fund units** — a fund manager invests on your behalf, the minimum is low, a good place to start.\n\n**Individual shares** — these need time spent understanding each company. Do not start here.\n\nThe most important thing for a beginner is not picking the right vehicle but **being consistent and not selling in a panic**.',
  'Bốn dấu hiệu cảnh báo': 'Four warning signs',
  'Chạm vào từng điểm để xem dấu hiệu và cách kiểm tra.':
    'Tap each spot for the sign and how to check it.',
  'Lưỡi câu móc một đồng tiền, bên cạnh là dấu cảnh báo':
    'A hook through a coin beside a warning sign',
  'Lợi nhuận cam kết cao': 'High guaranteed returns',
  'Hứa 20-30% mỗi tháng, hoặc "cam kết không lỗ". Không có khoản đầu tư hợp pháp nào cam kết được điều này.':
    'Promises of 20–30% a month, or “guaranteed no losses”. No legitimate investment can guarantee that.',
  'Giục gấp': 'Time pressure',
  '"Chỉ còn hôm nay", "suất cuối cùng". Áp lực thời gian tồn tại để bạn không kịp kiểm tra.':
    '“Today only”, “last place available”. Time pressure exists so you cannot check.',
  'Thưởng theo người giới thiệu': 'Referral bonuses',
  'Khi thu nhập đến từ việc rủ thêm người chứ không từ sản phẩm, đó là mô hình đa cấp.':
    'When income comes from recruiting people rather than from a product, it is a pyramid.',
  'Không thể rút tiền': 'You cannot withdraw',
  'Rút thử một khoản nhỏ ngay từ đầu. Nếu bị trì hoãn hoặc bị đòi "phí giải ngân", hãy dừng lại.':
    'Try withdrawing a small amount early. If it is delayed or you are charged a “release fee”, stop.',
  'Quy tắc an toàn': 'Safety rules',
  '**Không bao giờ chuyển tiền cho người bạn chỉ quen qua mạng.** Kể cả khi họ gọi video, kể cả khi họ gửi ảnh giấy tờ.\n\n**Không cung cấp mã OTP cho bất kỳ ai.** Không ngân hàng nào, không nhân viên nào cần mã OTP của bạn.\n\n**Kiểm tra giấy phép.** Công ty quản lý quỹ và công ty chứng khoán hợp pháp đều có tên trên trang của Uỷ ban Chứng khoán Nhà nước.\n\nNếu vẫn phân vân, hãy hỏi Ekko bot hoặc bộ phận nhân sự của công ty bạn trước khi chuyển bất kỳ khoản nào.':
    '**Never send money to someone you only know online.** Not even if they video call, not even if they send photos of documents.\n\n**Never give your OTP to anyone.** No bank and no member of staff needs your OTP.\n\n**Check the licence.** Legitimate fund managers and brokers are all listed on the State Securities Commission’s website.\n\nIf you are still unsure, ask Ekko bot or your company’s HR team before transferring anything.',

  // ------------------------------------------- khung bài · mô đun 6
  'Bốn con số của năm': 'The four numbers of the year',
  '**1. Thu nhập mục tiêu** - bạn muốn thu nhập tháng cuối năm là bao nhiêu.\n\n**2. Tỷ lệ tiết kiệm** - phần trăm thu nhập bạn giữ lại, không phải số tiền tuyệt đối.\n\n**3. Số dư quỹ khẩn cấp** - bao nhiêu tháng chi phí vào cuối năm.\n\n**4. Tổng nợ** - con số này phải nhỏ hơn đầu năm.\n\nBốn con số này quan trọng hơn mọi bảng tính chi tiết. Viết chúng ra và xem lại mỗi ba tháng.':
    '**1. Target income** — what you want to earn in the last month of the year.\n\n**2. Savings rate** — the share of income you keep, not an absolute amount.\n\n**3. Emergency fund balance** — how many months of costs by year end.\n\n**4. Total debt** — this number must be smaller than at the start of the year.\n\nThese four matter more than any detailed spreadsheet. Write them down and review them every three months.',
  'Mười hai ô tháng nối nhau thành một lộ trình': 'Twelve monthly squares linked into a route',
  'Xem lại mỗi quý, không phải mỗi ngày': 'Review it quarterly, not daily',
  'Kiểm tra ngân sách hằng ngày là việc tốt. Kiểm tra kế hoạch năm hằng ngày thì không.\n\nMỗi quý, dành 30 phút trả lời ba câu:\n\n**Con số nào đang đi đúng hướng?**\n\n**Con số nào đang lệch, và vì sao?**\n\n**Tôi cần đổi một thói quen nào trong ba tháng tới?**\n\nMột thói quen mỗi quý là bốn thói quen mỗi năm. Đó là tốc độ thay đổi bền vững nhất.':
    'Checking your budget daily is good. Checking your yearly plan daily is not.\n\nEach quarter, spend 30 minutes on three questions:\n\n**Which number is heading the right way?**\n\n**Which number is off, and why?**\n\n**Which single habit should I change in the next three months?**\n\nOne habit a quarter is four habits a year. That is the most sustainable pace of change there is.',
  'Trần của việc tiết kiệm': 'The ceiling on saving',
  'Bạn chỉ có thể cắt giảm đến một mức nào đó. Không ai giảm chi tiêu xuống dưới 0.\n\nNhưng phía tăng thu nhập thì không có trần.\n\nĐiều này không có nghĩa là bỏ ngân sách. Nghĩa là khi bạn đã kiểm soát được chi tiêu, năng lượng tiếp theo nên dồn vào phía thu nhập.':
    'You can only cut so far. Nobody gets spending below zero.\n\nOn the income side there is no ceiling at all.\n\nThis does not mean abandoning the budget. It means that once spending is under control, the next push belongs on the income side.',
  'Các cột thu nhập cao dần, kèm dấu cộng': 'Income columns rising, with a plus sign',
  'Ba hướng thực tế': 'Three realistic routes',
  '**1. Tăng giá trị ở công việc hiện tại.** Chứng chỉ nghề, kỹ năng mới, nhận thêm trách nhiệm. Đây là hướng ít rủi ro nhất.\n\n**2. Đổi việc.** Ở nhiều ngành, mức tăng khi chuyển việc cao hơn hẳn mức tăng lương định kỳ.\n\n**3. Nguồn thu phụ.** Bán kỹ năng bạn đã có, không phải kỹ năng bạn phải học từ đầu.\n\nMẹo quan trọng: **mỗi lần thu nhập tăng, tăng tỷ lệ tiết kiệm trước.** Nếu không, mức sống sẽ tự động dâng lên cho vừa hết phần tăng thêm.':
    '**1. Become worth more where you are.** A qualification, a new skill, extra responsibility. This is the lowest-risk route.\n\n**2. Change jobs.** In many industries the jump from moving beats any annual raise.\n\n**3. A side income.** Sell a skill you already have, not one you must learn from scratch.\n\nThe key trick: **every time income rises, raise the savings rate first.** Otherwise your lifestyle quietly expands to absorb the whole increase.',
  'Người bắt đầu sớm hơn 10 năm thường về đích trước, dù bỏ vào ít tiền hơn.':
    'Starting ten years earlier usually wins, even with less money put in.',
  'Đường thời gian với các chồng tiền lớn dần về phía mặt trời':
    'A timeline of money stacks growing towards the sun',
  'Hai người bạn': 'Two friends',
  'Hùng bắt đầu để dành 2.000.000đ mỗi tháng từ năm 25 tuổi, và dừng lại sau 10 năm.\n\nNam bắt đầu ở tuổi 35, cũng 2.000.000đ mỗi tháng, và làm liên tục 25 năm đến khi 60.\n\nVới lãi 7% một năm, đến tuổi 60 Hùng thường vẫn nhiều hơn Nam, dù chỉ bỏ vào 240 triệu so với 600 triệu của Nam.\n\nKhác biệt duy nhất là **thời gian tiền được ở trong đó**. Đây là lý do câu trả lời cho "khi nào nên bắt đầu" luôn là hôm nay.':
    'Hùng starts saving 2,000,000đ a month at 25 and stops after ten years.\n\nNam starts at 35, also 2,000,000đ a month, and keeps going for 25 years until he is 60.\n\nAt 7% a year, by 60 Hùng is usually still ahead of Nam — despite putting in 240 million against Nam’s 600 million.\n\nThe only difference is **how long the money sat there**. Which is why the answer to “when should I start” is always today.',
  'Ba việc làm trong tuần này': 'Three things to do this week',
  '**1. Kiểm tra bạn đã đóng bảo hiểm xã hội đủ và đúng chưa.** Đây là nền lương hưu của bạn và nhiều người không kiểm tra bao giờ.\n\n**2. Đặt một lệnh chuyển tiền tự động**, dù chỉ 200.000đ mỗi tháng.\n\n**3. Viết ra con số bạn cần mỗi tháng khi nghỉ hưu.** Chỉ cần ước lượng thô. Có một con số vẫn tốt hơn không có gì.\n\nBạn đã đi hết sáu mô-đun của chương trình. Phần còn lại là giữ chuỗi streak của mình.':
    '**1. Check that your social insurance contributions are complete and correct.** This is the base of your pension and many people never look.\n\n**2. Set up one automatic transfer**, even if it is only 200,000đ a month.\n\n**3. Write down the monthly figure you will need in retirement.** A rough estimate is fine. Having a number beats having none.\n\nYou have finished all six modules of the programme. What is left is keeping your streak alive.',

  // ------------------------------------------------- nhóm chi tiêu (Admin)
  'Ăn uống': 'Food & drink',
  'Đi lại': 'Transport',
  'Nhà ở': 'Housing',
  'Mua sắm': 'Shopping',
  'Sức khoẻ': 'Health',
  'Gia đình': 'Family',
  'Giải trí': 'Entertainment',
  'Học tập': 'Education',
  'Tiết kiệm': 'Savings',
  Khác: 'Other',

  // ------------------------------------------------------------ huy hiệu
  'Bài học đầu tiên': 'First lesson',
  'Hoàn thành bài học đầu tiên của bạn.': 'Finish your very first lesson.',
  'Mô đun đầu tiên': 'First module',
  'Hoàn thành trọn vẹn một mô đun học tập.': 'Complete a whole learning module.',
  'Streak 7 ngày': '7-day streak',
  'Học hoặc dùng một chức năng 7 ngày liên tiếp.': 'Learn or use a tool 7 days in a row.',
  'Streak 30 ngày': '30-day streak',
  'Giữ chuỗi 30 ngày liên tiếp. Rất ít người làm được.':
    'Keep a 30-day streak. Very few people manage it.',
  'Ngân sách đầu tiên': 'First budget',
  'Lập ngân sách tháng đầu tiên của bạn.': 'Build your first monthly budget.',
  'Mục tiêu đầu tiên': 'First goal',
  'Đặt mục tiêu tiết kiệm đầu tiên.': 'Set your first savings goal.',
  'Cán đích': 'Finish line',
  'Hoàn thành một mục tiêu tiết kiệm.': 'Complete a savings goal.',
  'Người ghi chép': 'Record keeper',
  'Ghi 10 khoản chi tiêu.': 'Log 10 expenses.',
  'Sổ tay dày dặn': 'Well-worn ledger',
  'Ghi 50 khoản chi tiêu.': 'Log 50 expenses.',
  'Bạn của Ekko bot': 'Friend of Ekko bot',
  'Trò chuyện với Ekko bot 5 lần.': 'Chat with Ekko bot 5 times.',
  'Nhà Kế Hoạch': 'The Planner',
  'Đạt cấp độ 3.': 'Reach level 3.',
  'Bậc thầy bầu trời': 'Master of the skies',
  'Đạt cấp độ 6, cấp cao nhất.': 'Reach level 6, the highest one.',

  // ------------------------------------------------------------- cấp độ
  'Heo Mầm Non': 'Sprout Piggy',
  'Chú heo bắt đầu hành trình': 'The piggy setting out',
  'Bước đầu tiên của hành trình. Học cách nhìn rõ dòng tiền của mình.':
    'The first step of the journey. Learn to see your own cash flow clearly.',
  'Heo Học Việc': 'Apprentice Piggy',
  'Biết tiền đi đâu': 'Knows where the money goes',
  'Ghi chép đều đặn là kỹ năng nền. Cấp này mở ra khi bạn đã học xong những bài đầu tiên.':
    'Tracking consistently is the base skill. This level opens once you finish the first lessons.',
  'Heo Tích Lũy': 'Saver Piggy',
  'Lập ngân sách cho tháng': 'Budgets the month ahead',
  'Bạn đã biết tiền đi đâu. Giờ là lúc quyết định trước tiền sẽ đi đâu.':
    'You know where the money goes. Now decide in advance where it will go.',
  'Mở khoá gợi ý tiết kiệm cá nhân hoá': 'Unlocks personalised saving tips',
  'Heo No Đủ': 'Comfortable Piggy',
  'Quỹ dự phòng và mục tiêu': 'Emergency fund and goals',
  'Dành cho người đã có khoản để dành đầu tiên.': 'For those with their first savings put aside.',
  'Heo Đầu Tư': 'Investor Piggy',
  'Quản lý nợ và bảo vệ': 'Manages debt and stays protected',
  'Bạn hiểu lãi suất, biết dùng ứng lương đúng cách và tự bảo vệ trước rủi ro.':
    'You understand interest, use advances properly, and protect yourself against risk.',
  'Heo Thịnh Vượng': 'Prosperous Piggy',
  'Cấp cao nhất. Bạn đã có hệ thống tài chính của riêng mình.':
    'The top level. You have a financial system of your own.',

  // ----------------------------------------------------------- chức năng
  'Khám phá': 'Explore',
  'Các bài học về tài chính cá nhân, mở khoá dần theo cấp độ.':
    'Personal finance lessons that unlock as you level up.',
  'Lập ngân sách': 'Budget',
  'Lập và theo dõi ngân sách hằng tháng.': 'Set and track a monthly budget.',
  'Mục tiêu tài chính': 'Financial goals',
  'Đặt và theo dõi mục tiêu tiết kiệm.': 'Set and track savings goals.',
  'Ghi chép chi tiêu': 'Expense log',
  'Ghi nhanh chi tiêu với hỗ trợ AI.': 'Log expenses fast, with AI help.',

  // ------------------------------------------------------ trắc nghiệm
  'Nhóm chi tiêu nào thường khiến bạn bất ngờ nhất khi cộng lại cuối tháng?':
    'Which spending category surprises people most when they add it up at month end?',
  'Tiền nhà và điện nước': 'Rent and utilities',
  'Đây là nhóm cố định, bạn thường đã biết trước con số.':
    'These are fixed costs — you usually know the number in advance.',
  'Các khoản nhỏ lặp lại hằng ngày': 'Small amounts that repeat daily',
  'Chính xác. Khoản nhỏ nhưng lặp lại 30 lần mới là thứ ăn mòn ngân sách.':
    'Exactly. It is the small amount repeated 30 times that eats a budget.',
  'Học phí của con': 'School fees for the children',
  'Khoản này lớn nhưng đã nằm trong kế hoạch từ đầu năm.':
    'It is large, but it has been in the plan since the start of the year.',

  'Đâu là cách ghi chép dễ duy trì nhất?': 'Which tracking habit is easiest to keep up?',
  'Cuối tháng ngồi tổng kết một lần': 'Sit down once at the end of the month',
  'Đến cuối tháng bạn đã quên phần lớn các khoản nhỏ.':
    'By month end you have forgotten most of the small ones.',
  'Ghi ngay tại thời điểm trả tiền, càng nhanh càng tốt':
    'Log it the moment you pay, as fast as possible',
  'Đúng. Ghi ngay và ghi nhanh là hai yếu tố quyết định bạn có duy trì được hay không.':
    'Right. Logging immediately and logging quickly are what decide whether the habit sticks.',
  'Chỉ ghi những khoản trên 500.000đ': 'Only log anything above 500,000đ',
  'Bỏ qua khoản nhỏ là bỏ qua đúng chỗ tiền rò rỉ nhiều nhất.':
    'Skipping the small ones means skipping exactly where the money leaks.',

  'Bạn thấy một chiếc áo giảm giá 40% trên livestream lúc 11 giờ đêm. Nên làm gì?':
    'You see a shirt at 40% off on a livestream at 11pm. What should you do?',
  'Mua ngay kẻo hết khuyến mãi': 'Buy now before the deal ends',
  'Cảm giác khan hiếm là công cụ bán hàng, không phải lý do tài chính.':
    'Scarcity is a sales tool, not a financial reason.',
  'Lưu lại và xem lại sau 24 giờ': 'Save it and look again after 24 hours',
  'Đúng. Đa số ham muốn bốc đồng tự biến mất sau một đêm.':
    'Right. Most impulses disappear on their own overnight.',
  'Hỏi ý kiến bạn bè rồi mua': 'Ask a friend, then buy',
  'Hỏi thêm người thường chỉ tìm sự đồng thuận cho quyết định đã có sẵn.':
    'Asking around usually just seeks approval for a decision already made.',

  'Bản ngân sách đầu tiên nên dựa trên điều gì?': 'What should a first budget be based on?',
  'Mức chi tiêu thực tế tháng trước': 'What you actually spent last month',
  'Đúng. Dữ liệu thật là nền của một ngân sách dùng được.':
    'Right. Real data is the foundation of a budget you can use.',
  'Mức chi tiêu lý tưởng bạn mong muốn': 'The ideal spending you wish you had',
  'Ngân sách xa rời thực tế sẽ bị bỏ chỉ sau vài tuần.':
    'A budget detached from reality gets abandoned within weeks.',
  'Mức chi tiêu trung bình của người cùng thu nhập': 'The average for people on your income',
  'Hoàn cảnh mỗi nhà mỗi khác, con số trung bình không nói lên gì về bạn.':
    'Every household differs; an average says nothing about you.',

  'Thu nhập của bạn là 12.000.000đ. Theo quy tắc 50/30/20, mỗi tháng bạn nên dành bao nhiêu cho tiết kiệm và trả nợ?':
    'Your income is 12,000,000đ. Under the 50/30/20 rule, how much should go to savings and debt each month?',
  '1.200.000đ': '1,200,000đ',
  'Đó là 10%. Quy tắc đề nghị gấp đôi con số này.': 'That is 10%. The rule suggests twice that.',
  '2.400.000đ': '2,400,000đ',
  'Chính xác, 20% của 12 triệu là 2,4 triệu.': 'Exactly — 20% of 12 million is 2.4 million.',
  '3.600.000đ': '3,600,000đ',
  'Đó là 30%, phần dành cho nhóm mong muốn.': 'That is 30%, the share for wants.',

  'Nên đặt khoản tiết kiệm vào lúc nào trong tháng?':
    'When in the month should you set savings aside?',
  'Cuối tháng, với phần tiền còn dư': 'At the end, with whatever is left',
  'Cách này gần như luôn dẫn đến việc không còn gì để tiết kiệm.':
    'This almost always ends with nothing left to save.',
  'Ngay đầu tháng, trước khi chi các khoản linh hoạt':
    'Right at the start, before any flexible spending',
  'Đúng. Nguyên tắc "trả cho mình trước" là điều tạo ra khác biệt.':
    'Right. Paying yourself first is what makes the difference.',
  'Bất cứ khi nào có tiền thưởng': 'Whenever a bonus arrives',
  'Thưởng là khoản bổ sung, không thay thế được thói quen đều đặn.':
    'A bonus is a supplement; it cannot replace a steady habit.',

  'Bạn chi thiết yếu khoảng 6.000.000đ mỗi tháng và chưa có khoản dự phòng nào. Mục tiêu hợp lý để bắt đầu là gì?':
    'Your essentials cost about 6,000,000đ a month and you have no emergency savings. What is a sensible first target?',
  '36.000.000đ cho đủ 6 tháng': '36,000,000đ for a full 6 months',
  'Mục tiêu đúng nhưng quá xa để bắt đầu, dễ bỏ cuộc trong tháng đầu.':
    'The right destination, but too far as a starting point — easy to quit in month one.',
  '6.000.000đ cho một tháng': '6,000,000đ for one month',
  'Đúng. Đạt mốc đầu tiên rồi mới nâng dần là cách bền nhất.':
    'Right. Hit the first milestone, then raise it — that lasts.',
  'Không cần, cứ ứng lương khi có việc gấp': 'Skip it and take an advance when something urgent comes up',
  'Ứng lương giải quyết được việc gấp, nhưng không thay thế được khoản dự phòng của riêng bạn.':
    'An advance handles the emergency, but it is no substitute for savings of your own.',

  'Đâu là mục tiêu tiết kiệm được đặt đúng cách?': 'Which savings goal is set up properly?',
  'Cố gắng để dành nhiều hơn năm ngoái': 'Try to save more than last year',
  'Không có con số và không có hạn thì không theo dõi được.':
    'No number and no deadline means nothing to track.',
  'Tiết kiệm 15.000.000đ cho học phí con trước tháng 8':
    'Save 15,000,000đ for school fees before August',
  'Đúng. Có con số, có hạn, và chia được ra từng tháng.':
    'Right. It has a number, a deadline, and monthly pieces.',
  'Không tiêu gì ngoài nhu cầu thiết yếu': 'Spend nothing beyond bare essentials',
  'Đây là hình phạt chứ không phải mục tiêu, và rất khó duy trì.':
    'That is a punishment, not a goal, and very hard to keep up.',

  'Thời điểm tốt nhất để chuyển tiền vào khoản tiết kiệm là khi nào?':
    'When is the best moment to move money into savings?',
  'Ngay ngày lương về': 'The day your pay lands',
  'Đúng. Tiền chưa kịp vào dòng chi tiêu thì không bị tiêu.':
    'Right. Money that never joins the spending flow does not get spent.',
  'Giữa tháng, khi biết còn dư bao nhiêu': 'Mid-month, once you see what is left',
  'Đến giữa tháng, phần "còn dư" thường đã nhỏ hơn nhiều so với dự tính.':
    'By mid-month, “what is left” is usually far smaller than planned.',
  'Cuối tháng, sau khi trả hết mọi thứ': 'At month end, after paying for everything',
  'Đây chính là cách phổ biến nhất khiến người ta không tiết kiệm được đồng nào.':
    'This is the single most common reason people save nothing at all.',

  'Khoản vay nào sau đây có nhiều khả năng là nợ tốt nhất?':
    'Which of these loans is most likely to be good debt?',
  'Vay trả góp điện thoại mới nhất': 'Instalments on the newest phone',
  'Món đồ mất giá ngay khi mở hộp và không tăng thu nhập của bạn.':
    'It loses value the moment you open the box and adds nothing to your income.',
  'Vay học một chứng chỉ nghề giúp tăng lương':
    'A loan for a professional certificate that raises your pay',
  'Đúng. Khoản vay này làm tăng khả năng kiếm tiền trong nhiều năm sau.':
    'Right. This loan raises your earning power for years afterwards.',
  'Vay tiêu dùng để trả nợ thẻ tín dụng': 'A consumer loan to pay off a credit card',
  'Vay để trả nợ là dấu hiệu cần dừng lại và tìm tư vấn ngay.':
    'Borrowing to repay borrowing is a sign to stop and get advice now.',

  'Bạn có 10.000.000đ dư. Đang nợ thẻ tín dụng lãi 28%/năm và thấy một kênh đầu tư hứa hẹn 12%/năm. Nên làm gì?':
    'You have 10,000,000đ spare. You owe on a credit card at 28% a year and see an investment promising 12% a year. What should you do?',
  'Đầu tư để tiền sinh lời': 'Invest it so the money grows',
  'Lãi 12% không bù nổi khoản lãi 28% bạn đang phải trả.':
    'A 12% return cannot cover the 28% you are already paying.',
  'Trả nợ thẻ tín dụng trước': 'Pay off the credit card first',
  'Đúng. Trả một khoản nợ 28% chắc chắn tương đương một khoản đầu tư sinh lời 28% không rủi ro.':
    'Right. Clearing 28% debt is exactly a guaranteed, risk-free 28% return.',
  'Chia đôi cho cả hai': 'Split it between the two',
  'Nửa số tiền vẫn đang chịu chênh lệch lãi bất lợi cho bạn.':
    'Half the money is still on the losing side of that interest gap.',

  'Trường hợp nào ứng lương là lựa chọn hợp lý nhất?':
    'In which case is a salary advance the most sensible choice?',
  'Đóng viện phí gấp cho người nhà, tháng này còn xoay xở được':
    'An urgent hospital bill for family, with this month still manageable',
  'Đúng. Việc gấp, có thật, và không đẩy bạn vào thế kẹt tháng sau.':
    'Right. Urgent, real, and it does not corner you next month.',
  'Mua điện thoại mới đang giảm giá': 'Buying a new phone that is on sale',
  'Không gấp, và món đồ không tạo ra giá trị nào cho tài chính của bạn.':
    'Not urgent, and the item adds no financial value.',
  'Ứng đủ mức tối đa mỗi tháng cho chắc': 'Taking the maximum every month just in case',
  'Ứng đều đặn hằng tháng cho thấy ngân sách đang có vấn đề cần sửa từ gốc.':
    'Advancing every month signals a budget problem that needs fixing at the root.',

  'Bạn làm tự do, chưa có bảo hiểm nào và chưa có quỹ dự phòng. Nên làm gì trước?':
    'You freelance, have no insurance and no emergency fund. What comes first?',
  'Mua bảo hiểm nhân thọ có tích luỹ': 'Buy a life policy with a savings component',
  'Chi phí cao và rủi ro phải huỷ giữa chừng khi chưa có quỹ dự phòng.':
    'Expensive, and you risk cancelling midway without an emergency fund behind you.',
  'Mua bảo hiểm y tế tự nguyện và xây quỹ khẩn cấp':
    'Get voluntary health insurance and build an emergency fund',
  'Đúng. Đây là hai lớp bảo vệ rẻ nhất và hiệu quả nhất.':
    'Right. These are the cheapest and most effective two layers of protection.',
  'Đầu tư trước để có thêm tiền mua bảo hiểm sau':
    'Invest first to afford insurance later',
  'Đầu tư khi chưa có lớp bảo vệ nào là lúc rủi ro nhất.':
    'Investing with no protection in place is the riskiest moment of all.',

  'Điều nào sau đây KHÔNG phải điều kiện cần trước khi bắt đầu đầu tư?':
    'Which of these is NOT required before you start investing?',
  'Có quỹ khẩn cấp': 'Having an emergency fund',
  'Đây là điều kiện bắt buộc.': 'This one is required.',
  'Đã trả hết nợ lãi cao': 'Having cleared high-interest debt',
  'Đây cũng là điều kiện bắt buộc.': 'This one is required too.',
  'Có ít nhất 100 triệu đồng vốn': 'Having at least 100 million dong of capital',
  'Đúng. Bạn có thể bắt đầu với vài trăm nghìn đồng. Số vốn không phải điều kiện.':
    'Right. You can start with a few hundred thousand dong. The amount is not a condition.',

  'Một người quen qua mạng mời bạn góp vốn, cam kết lãi 25% mỗi tháng và giục chốt trong hôm nay. Bạn nên?':
    'Someone you met online invites you to invest, promises 25% a month, and pushes you to commit today. You should:',
  'Góp thử một khoản nhỏ để kiểm tra': 'Put in a small amount to test it',
  'Khoản nhỏ đầu tiên thường được trả lãi đúng hạn để lấy lòng tin trước khi mất khoản lớn.':
    'The first small amount is usually paid on time to win trust before the big loss.',
  'Từ chối hoàn toàn': 'Refuse outright',
  'Đúng. Cam kết lãi cao cộng với giục gấp là hai dấu hiệu đủ để dừng lại ngay.':
    'Right. A high guaranteed return plus time pressure is enough to walk away.',
  'Nhờ người quen đó gửi thêm giấy tờ chứng minh': 'Ask them for more paperwork as proof',
  'Giấy tờ giả rất dễ làm. Kiểm tra ở nguồn chính thức, không kiểm tra qua chính người mời.':
    'Fake paperwork is easy. Verify with the official source, not with the person pitching.',

  'Chỉ số nào phản ánh sức khoẻ tài chính tốt hơn cả?':
    'Which number best reflects financial health?',
  'Tổng thu nhập hằng tháng': 'Total monthly income',
  'Thu nhập cao vẫn có thể đi kèm chi tiêu cao hơn và không dư đồng nào.':
    'A high income can come with even higher spending and nothing left over.',
  'Tỷ lệ phần trăm thu nhập bạn giữ lại được': 'The share of your income you keep',
  'Đúng. Tỷ lệ tiết kiệm là chỉ số dự báo tốt nhất cho tài chính dài hạn.':
    'Right. The savings rate is the best predictor of long-term finances.',
  'Số dư trong tài khoản hôm nay': 'Your account balance today',
  'Số dư một thời điểm không cho biết xu hướng.': 'A single balance says nothing about the trend.',

  'Bạn vừa được tăng lương 2.000.000đ mỗi tháng. Việc nên làm đầu tiên là gì?':
    'You just got a 2,000,000đ monthly raise. What should you do first?',
  'Nâng mức sống cho xứng đáng với công sức': 'Raise your lifestyle to match the effort',
  'Đây là hiện tượng lạm phát lối sống, lý do nhiều người tăng lương mà không giàu lên.':
    'That is lifestyle inflation — the reason many people earn more without getting richer.',
  'Chuyển ngay một phần vào tiết kiệm trước khi quen tiêu':
    'Move part of it into savings before you get used to spending it',
  'Đúng. Bạn chưa quen có khoản đó nên sẽ không thấy thiếu.':
    'Right. You are not used to having it, so you will not miss it.',
  'Chờ vài tháng xem thu nhập ổn định rồi tính':
    'Wait a few months to see if the income holds',
  'Sau vài tháng, khoản tăng thêm thường đã hoà vào chi tiêu hằng ngày.':
    'After a few months the raise has usually dissolved into daily spending.',

  'Vì sao bắt đầu tiết kiệm sớm lại quan trọng đến vậy?':
    'Why does starting to save early matter so much?',
  'Vì lãi suất khi còn trẻ thường cao hơn': 'Because interest rates are higher when you are young',
  'Lãi suất không phụ thuộc vào tuổi của bạn.': 'Interest rates do not depend on your age.',
  'Vì tiền có thêm nhiều năm để lãi sinh ra lãi':
    'Because the money gets more years for interest to earn interest',
  'Đúng. Thời gian là biến số mạnh nhất trong công thức lãi kép.':
    'Right. Time is the most powerful variable in compounding.',
  'Vì khi trẻ bạn kiếm được nhiều tiền hơn': 'Because you earn more when you are young',
  'Thường thì ngược lại. Lợi thế nằm ở thời gian, không ở thu nhập.':
    'Usually the opposite. The advantage is time, not income.',

  // --------------------------------------------------- mục tiêu gợi ý
  'An toàn': 'Safety',
  'Quỹ khẩn cấp': 'Emergency fund',
  'Bằng 1–3 tháng lương': 'Worth 1–3 months of pay',
  'Mua sắm tài sản': 'Buying assets',
  'Mua xe máy': 'Buy a motorbike',
  'Tài sản cá nhân': 'A personal asset',
  'Mua điện thoại': 'Buy a phone',
  'Nâng cấp thiết bị': 'Upgrade your device',
  'Mua laptop': 'Buy a laptop',
  'Học tập & công việc': 'Study & work',
  'Học phí cho con': 'School fees',
  'Chuẩn bị năm học': 'Ready for the school year',
  'Xây / sửa nhà': 'Build or repair a home',
  'Cho tổ ấm': 'For the family home',
  'Tết sum vầy': 'Tết together',
  'Quà, biếu, du xuân': 'Gifts, giving, spring trips',
  'Tự do': 'Open',
  'Mục tiêu tự do': 'Your own goal',
  'Bạn tự đặt tên': 'You name it',
  'Mỗi tháng': 'Monthly',
  'Mỗi tuần': 'Weekly',

  // ------------------------------------ khoảng thời gian của sổ chi tiêu
  'Hôm nay': 'Today',
  'Tuần này': 'This week',
  'Tháng này': 'This month',

  // ------------------------------------------------------ thông báo lỗi
  'Học xong bài phía trên đã, rồi bài này mới mở.': 'Finish the lesson above and this one opens.',
  'Bài học này chưa mở khoá ở cấp độ hiện tại của bạn.':
    'This lesson is not unlocked at your current level.',
  'Không tìm thấy mô đun này': 'That module was not found',
  'Mô đun này chưa có câu hỏi': 'This module has no questions yet',
  'Không tìm thấy bài học này': 'That lesson was not found',
  'frameIndex không hợp lệ': 'frameIndex is not valid',
  'Số tiền phải là một số dương': 'The amount must be a positive number',
  'Số tiền vượt quá giới hạn cho phép': 'The amount is above the allowed limit',
  'Số tiền mục tiêu phải là một số dương': 'The target amount must be a positive number',
  'Số tiền mục tiêu vượt quá giới hạn cho phép': 'The target amount is above the allowed limit',
  'Số tiền nạp phải là một số dương': 'The deposit must be a positive number',
  'Số tiền nạp vượt quá giới hạn cho phép': 'The deposit is above the allowed limit',
  'Tháng phải có dạng YYYY-MM': 'The month must look like YYYY-MM',
  'Hãy đặt tên cho mục tiêu': 'Give the goal a name',
  'Tên mục tiêu quá dài': 'That goal name is too long',
  'Không tìm thấy mục tiêu này': 'That goal was not found',
  'Không tìm thấy khoản chi này': 'That expense was not found',
  'Khoản chi này không có ảnh hoá đơn': 'This expense has no receipt photo',
  'Không tìm thấy ảnh hoá đơn': 'The receipt photo was not found',
  'Bạn chưa nhập gì': 'You have not typed anything',
  'Nội dung quá dài': 'That is too long',
  'Chưa thấy số tiền trong câu này. Thử kiểu "cà phê 35k" hoặc "ăn trưa 60 nghìn".':
    'I could not find an amount in that. Try something like “coffee 35k” or “lunch 60 thousand”.',
  'Chưa bật tính năng đọc hoá đơn tự động. Bạn nhập tay giúp nhé.':
    'Automatic receipt reading is not switched on. Please type it in yourself.',
  'Khoá API trong app/.env chưa hợp lệ — có vẻ vẫn là chỗ điền mẫu. Bạn nhập tay giúp nhé.':
    'The API key in app/.env is not valid — it looks like the placeholder. Please type it in yourself.',
  'Không tìm thấy đường dẫn này': 'That path was not found',
  'Có lỗi xảy ra ở máy chủ': 'Something went wrong on the server',
  'Chua dang nhap': 'Not signed in',
  'Khong co quyen truy cap': 'No permission to access this',
  'Khong tim thay': 'Not found',
  'Phuong thuc khong duoc ho tro': 'That method is not supported',
  'Du lieu gui len qua lon': 'The uploaded data is too large',
  'JSON khong hop le': 'Invalid JSON',

  // ------------------------------------------------- Ekko bot · câu FAQ
  'Ekko là nền tảng phúc lợi tài chính cho người lao động Việt Nam. Ekko cung cấp ứng lương linh hoạt (nhận trước phần lương bạn đã làm ra, không phí ẩn), các công cụ quản lý tài chính cá nhân, và chương trình Giáo dục tài chính mà bạn đang dùng đây.':
    'Ekko is a financial wellbeing platform for workers in Vietnam. It offers flexible salary advances (take out pay you have already earned, with no hidden fees), personal money tools, and the financial education programme you are using right now.',
  'Đây là hành trình Giáo dục tài chính của Ekko. Bạn là chú heo khám phá các hòn đảo trên trời: đảo trung tâm là cấp độ hiện tại của bạn, xung quanh là 4 đảo chức năng gồm Khám phá (bài học), Lập ngân sách, Mục tiêu tài chính và Ghi chép chi tiêu. Học bài và dùng các chức năng để nhận XP, lên cấp và mở huy hiệu.':
    'This is Ekko’s financial education journey. You are a piggy working along a learning path: the lessons sit in six modules, and the three tools — Budget, Financial goals and Expense log — appear on the path as you go. Take lessons and use the tools to earn XP, level up and unlock badges.',
  'Có 6 cấp độ, mỗi cấp là một hòn đảo riêng với hình chú heo tương ứng: Đảo Khởi Hành, Đảo Ghi Chép, Đảo Kế Hoạch, Đảo Tích Luỹ, Đảo Vững Vàng và Đảo Thịnh Vượng. Bạn lên cấp bằng XP nhận được khi hoàn thành bài học, mô đun và dùng các chức năng mỗi ngày.':
    'There are 6 levels, each with its own piggy: Sprout, Apprentice, Saver, Comfortable, Investor and Prosperous. You level up with XP earned by finishing lessons and modules, and by using the tools each day.',
  'Huy hiệu ghi lại các cột mốc: hoàn thành bài học đầu tiên, hoàn thành mô đun đầu tiên, streak 7 ngày, lập ngân sách đầu tiên, đạt mục tiêu tiết kiệm và nhiều mốc khác. Mở mục Huy hiệu để xem bạn còn thiếu những gì.':
    'Badges mark milestones: your first lesson, your first module, a 7-day streak, your first budget, a savings goal reached, and more. Open Badges to see which ones are still missing.',
  'Bạn chỉ cần nhắn cho mình một câu như "cà phê 35k" hoặc "ăn trưa 60 nghìn". Mình sẽ đọc số tiền, đoán nhóm chi tiêu và lưu vào sổ ngay. Nếu đoán sai nhóm, bạn đổi lại trong màn Ghi chép chi tiêu.':
    'Just message me something like "coffee 35k" or "lunch 60 thousand". I read the amount, guess the category and file it straight away. If I guess the category wrong, change it in the Expense log.',
  'Dữ liệu chi tiêu, ngân sách và mục tiêu của bạn là riêng tư. Công ty của bạn chỉ thấy số liệu tổng hợp ẩn danh về mức độ tham gia chương trình học, không thấy từng khoản chi của cá nhân.':
    'Your spending, budget and goals are private. Your employer only sees anonymous, aggregated figures about participation in the learning programme — never your individual expenses.',
  'Với các câu hỏi về tài khoản, ứng lương hoặc thanh toán, bạn liên hệ bộ phận hỗ trợ Ekko qua app Ekko chính hoặc bộ phận nhân sự của công ty bạn. Mình chỉ hỗ trợ phần Giáo dục tài chính.':
    'For questions about your account, salary advances or payments, contact Ekko support through the main Ekko app or your company’s HR team. I only cover financial education.',

  // ------------------------------------------ Ekko bot · nhãn nút và gợi ý
  'Huy hiệu': 'Badges',
  'Mở sổ chi tiêu': 'Open the expense log',
  'Xem chi tiết': 'See the details',
  'Đặt mục tiêu': 'Set a goal',
  'Mở mục tiêu': 'Open goals',
  'Mở ngân sách': 'Open the budget',
  'Xem huy hiệu': 'See badges',
  'Tháng này tôi tiêu bao nhiêu?': 'How much have I spent this month?',
  'Ngân sách còn bao nhiêu?': 'How much of my budget is left?',
  'Streak hoạt động thế nào?': 'How does the streak work?',
  'Tôi đang ở cấp mấy?': 'What level am I on?',
  'Quỹ khẩn cấp là gì?': 'What is an emergency fund?',
  'Streak của tôi thế nào?': 'How is my streak?',
  'Bạn chưa nhập nội dung': 'You have not typed anything',
  'Tin nhắn quá dài': 'That message is too long',
  'cà phê 35k': 'coffee 35k',
  'ăn trưa 60 nghìn': 'lunch 60 thousand',
  'grab về nhà 85k': 'grab home 85k',
  'mua sách 250.000đ': 'books 250,000đ',
};
