/* UI · 공통: 화면 전환 · 토스트 · 하늘 연출 · 저장 · 뒤로가기 방지 */
(function (LG) {
  'use strict';
  const K = LG.UIK;
  const { $, $$, esc, wait, render, st } = K;
  const S = LG.State, U = LG.U;
  const canRun = (...a) => K.canRun(...a);
  const closeSheet = (...a) => K.closeSheet(...a);
  const schedule = (...a) => K.schedule(...a);

  // ───────────────── 화면 전환 ─────────────────
  function show(id) {
    $$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
    document.body.dataset.screen = id;
  }

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.remove('hidden');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.add('hidden'), 2200);
  }

  function setStage(age) {
    const app = $('#app');
    app.dataset.stage = S.stageOf(age);
    // 해가 인생을 따라 하늘을 가로지른다
    const t = Math.min(1, age / 90);
    app.style.setProperty('--sun-x', (10 + t * 80) + '%');
    app.style.setProperty('--sun-y', (34 - Math.sin(t * Math.PI) * 26) + '%');
  }

  // ───────────────── 저장 · 뒤로가기 ─────────────────
  function saveNow() { const p = K.p; if (p && p.alive) LG.Storage.save(p); }
  // 뒤로가기를 실수로 눌러도 인생이 끝나지 않도록 플레이 중에는 히스토리를 한 칸 잡아 둔다
  function guardBack() {
    try { history.replaceState({ lg: 0 }, ''); history.pushState({ lg: 1 }, ''); } catch (e) { /* 무시 */ }
  }
  window.addEventListener('popstate', () => {
    const scr = document.body.dataset.screen;
    if (scr === 'scr-play' || scr === 'scr-birth') {
      try { history.pushState({ lg: 1 }, ''); } catch (e) { /* 무시 */ }
      saveNow();
      if (st.sheetOpen) closeSheet();
      else toast('뒤로가기를 막아 두었어요 · 진행 상황은 자동 저장돼요');
    }
  });
  window.addEventListener('pagehide', saveNow);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { saveNow(); clearTimeout(st.timer); }
    else if (canRun()) schedule(600);
  });

  // 설정 반영: 글자 크기 · 확률 표시 (body 클래스로 CSS 가 처리)
  function applyPrefs() {
    const pr = LG.Storage.prefs(), b = document.body;
    b.classList.toggle('fs-l', pr.fs === 'l');
    b.classList.toggle('fs-xl', pr.fs === 'xl');
    b.classList.toggle('no-prob', pr.prob === false);
    b.classList.toggle('no-why', pr.why === 'off');
  }

  Object.assign(K, { applyPrefs, show, toast, setStage, saveNow, guardBack });
})(window.LG = window.LG || {});
