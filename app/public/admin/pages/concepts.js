/**
 * Concept giao diện của màn Khám phá.
 *
 * Mỗi concept là một cách kể chuyện cho cùng một lộ trình học. Chỉ **một**
 * concept được bật tại một thời điểm, nên đây là một lựa chọn đơn (radio), không
 * phải danh sách bật/tắt từng cái — hai người học mở app phải thấy cùng một thế
 * giới.
 *
 * Đổi concept không đụng tới nội dung hay tiến độ: cùng thứ tự bài, cùng luật mở
 * khoá, cùng số bài đã học.
 */
import { el, mount } from '/shared/client.js';

/**
 * Ảnh xem trước dựng lại bằng chính cách vẽ của màn thật, không phải ảnh chụp:
 * concept 1 là mấy đốm đảo CSS trên nền trời, concept 2 là hình đảo thật xếp so
 * le hai bên một nét đứt. Quản trị viên bấm "Bật concept này" xong phải thấy
 * đúng cái vừa nhìn trong thẻ.
 */
const PREVIEW = {
  sky: () => el('div.cpreview.cpreview--sky', {}, [
    el('i.cpreview__isle', { style: { left: '18%', top: '58%' } }),
    el('i.cpreview__isle', { style: { left: '52%', top: '38%' } }),
    el('i.cpreview__isle', { style: { left: '26%', top: '18%' } }),
    el('span.cpreview__trail'),
  ]),
  /* Concept 2 xem trước bằng chính bộ hình của nó. Ba chặng so le trái – phải –
     trái, nét đứt đi qua vành cỏ của từng đảo bằng cùng kiểu đường cong Bézier mà
     `explore-islands.js` vẽ, nên thẻ này là bản thu nhỏ của màn thật chứ không
     phải một hình minh hoạ riêng.

     viewBox 0–100 cả hai chiều và `preserveAspectRatio="none"`: toạ độ nét đứt
     dùng đúng hệ phần trăm mà mấy tấm ảnh đảo đang dùng, nên hai thứ khớp nhau ở
     mọi bề ngang thẻ. Nét bị hệ đó kéo méo, `non-scaling-stroke` trong CSS giữ
     lại độ dày và nhịp đứt thật. */
  islands: () => el('div.cpreview.cpreview--islands', {
    html: `<svg class="cpreview__zig" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path d="M 19 80 C 19 63, 81 63, 81 47 C 81 32, 21 32, 21 17" />
    </svg>`,
  }, [
    el('img.cpreview__isl', { src: '/assets/islands/trail/island-1.svg', alt: '', style: { left: '6%', top: '58%', width: '26%' } }),
    el('img.cpreview__isl', { src: '/assets/islands/trail/island-4.svg', alt: '', style: { right: '6%', top: '26%', width: '26%' } }),
    el('img.cpreview__isl', { src: '/assets/islands/trail/island-2.svg', alt: '', style: { left: '8%', top: '-8%', width: '26%' } }),
  ]),
  /* Concept 3 xem trước bằng chính hình hài của nó: tấm biển mô-đun ở đầu, rồi
     chuỗi nút tròn lượn qua lại đúng nhịp `SWAY` mà explore-path.js dùng. */
  path: () => el('div.cpreview.cpreview--path', {}, [
    el('span.cpreview__unit'),
    /* Dịch bằng px chứ không phải %: `translateX` phần trăm tính theo bề ngang
       của chính cái chấm, đúng cái bẫy mà màn thật đã dính. */
    ...[0, 1, 2, 1, 0].map((sway, i) => el('i.cpreview__dot', {
      dataset: { state: i === 0 ? 'done' : i === 1 ? 'current' : 'open' },
      style: { transform: `translateX(${sway * 26}px)` },
    })),
  ]),
};

export default async function conceptsPage(ctx) {
  const host = el('div');

  async function load() {
    const concepts = await ctx.api.get('/api/admin/concepts');
    draw(concepts);
  }

  async function activate(code) {
    try {
      draw(await ctx.api.put('/api/admin/concepts/active', { code }));
      ctx.notify('Đã đổi concept cho màn Khám phá', 'success');
    } catch (err) {
      ctx.notify(err.message, 'error');
    }
  }

  function draw(concepts) {
    mount(host, [
      el('div.page-head', {}, [
        el('div', {}, [
          el('h1', {}, 'Concept'),
          el('p', {}, 'Cách kể chuyện của màn Khám phá. Chỉ một concept được bật tại một thời điểm; đổi concept không ảnh hưởng nội dung bài học hay tiến độ của người học.'),
        ]),
      ]),

      el('div.cgrid', {}, concepts.map((concept) => el('div.ccard', { dataset: { active: String(concept.active) } }, [
        (PREVIEW[concept.code] || PREVIEW.sky)(),

        el('div.ccard__body', {}, [
          el('div.ccard__head', {}, [
            el('span.ccard__index', {}, `Concept ${concept.order_index}`),
            concept.active ? el('span.ekko-badge.ekko-badge--success', {}, 'Đang bật') : null,
          ]),
          el('h2', {}, concept.name),
          el('p.ccard__tagline', {}, concept.tagline),
          el('p.hint', {}, concept.description),
          el('ul.ccard__list', {}, concept.highlights.map((line) => el('li', {}, line))),
        ]),

        el('div.ccard__foot', {}, [
          concept.active
            ? el('span.hint', {}, 'Người học đang thấy concept này.')
            : el('button.ekko-btn.ekko-btn--primary.ekko-btn--md', {
              type: 'button',
              onclick: () => activate(concept.code),
            }, 'Bật concept này'),
        ]),
      ]))),

      el('p.hint', { style: { marginTop: 'var(--spacing-16)' } },
        'Người học đang mở app cần tải lại màn Khám phá để thấy concept mới.'),
    ]);
  }

  mount(host, el('p.hint', {}, 'Đang tải…'));
  load();
  return host;
}
