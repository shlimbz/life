/* UI · 공용 도구 상자 (LG.UIK)
   화면 파일들(core, play, event, sheets, title, end)이 함수와 상태를 이 객체로 주고받는다.
   K.p = 지금 살고 있는 인생(PlayerState), K.st = 화면 진행 상태 */
(function (LG) {
  'use strict';
  const K = LG.UIK = {
    p: null,
    st: { timer: null, paused: false, speed: 1, eventOpen: false, sheetOpen: false, last: null, busy: false, dash: null },
    $: s => document.querySelector(s),
    $$: s => Array.from(document.querySelectorAll(s)),
    esc: s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
    wait: ms => new Promise(r => setTimeout(r, ms)),
    render: (p, t) => LG.Events.render(p, t)
  };
  return K;
})(window.LG = window.LG || {});
