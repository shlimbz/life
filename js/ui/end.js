/* UI · 죽음과 엔딩 · 결과 카드 · 공유 이미지 */
(function (LG) {
  'use strict';
  const K = LG.UIK;
  const { $, $$, esc, wait, render, st } = K;
  const S = LG.State, U = LG.U;
  const bar = (...a) => K.bar(...a);
  const initTitle = (...a) => K.initTitle(...a);
  const show = (...a) => K.show(...a);
  const startLife = (...a) => K.startLife(...a);
  const toast = (...a) => K.toast(...a);

  // ───────────────── 죽음과 엔딩 ─────────────────
  async function deathSequence() {
    let p = K.p;
    clearTimeout(st.timer);
    st.busy = true;
    const fade = $('#fade');
    $('#fade-text').textContent = `${p.age}세.\n${p.cause} 세상을 떠났다.\n\n당신의 인생이 끝났습니다.`;
    await wait(900);
    fade.classList.remove('hidden');
    LG.Storage.clear();
    const e = LG.Timeline.ending(p);
    if (!p.archived) {
      p.archived = true; LG.Storage.archive(LG.Game.summary(p));
      // 인생 도감에 기록 (새로 모은 것은 결과 화면에 표시)
      const r = LG.Dex.record(LG.Storage.dex(), p, e);
      LG.Storage.setDex(r.dex); e.fresh = r.fresh;
    }
    await wait(4200);
    renderEnd(e);
    show('scr-end');
    fade.classList.add('hidden');
    st.busy = false;
  }

  function renderEnd(e) {
    let p = K.p;
    const s = e.s;
    const bar = (ic, label, v, val) => `<div class="r-stat"><div class="top"><span>${ic} ${label}</span>${val != null ? val : v}</div><div class="bar"><i style="width:${v}%"></i></div></div>`;
    const RES = { success: '성공', partial: '절반의 성공', fail: '실패', done: '' };
    const cr = e.cross || [];
    const facts = [`💼 ${e.job}`, `💍 배우자 ${e.spouse}`, `👶 자녀 ${e.kids}명`, `📍 ${LG.DATA.regions[p.region].short} 출생`];
    const tl = p.history.filter(h => h.k !== 'minor');
    $('#end-body').innerHTML = `
      <div class="rcard" id="rcard">
        <p class="r-kicker">${p.daily ? `📅 오늘의 인생 · ${esc(p.daily)}` : '나의 인생'}</p>
        <p class="r-name">${esc(p.name)} · ${p.birthYear} – ${p.year}</p>
        <div class="r-age">${p.age}<small>세</small></div>
        <h2 class="r-title">${esc(e.title)}</h2>
        <p class="r-grade"><b>종합 ${e.total}점</b> · ${esc(e.grade)}</p>
        <div class="r-tags">${e.dom ? `<span>${e.dom.icon} ${esc(e.dom.short)}형으로 살았다</span>` : ''}${e.tend ? `<span>${e.tend.icon} ${esc(e.tend.name)}</span>` : ''}</div>
        <div class="r-stats">
          ${bar('💰', '자산', s.money, U.money(e.net))}${bar('❤️', '건강', s.health)}
          ${bar('😊', '행복', s.happy)}${bar('🤝', '관계', s.rel)}
          ${bar('🏆', '성취', s.achv)}${bar('🧭', '경험', s.exp)}
        </div>
        <div class="r-facts">${facts.map(f => `<span>${esc(f)}</span>`).join('')}</div>
        ${K.lifemap ? K.lifemap.html(p, e) : ''}
        ${(e.talents && e.talents.length) ? `<p class="r-sec">타고난 재능</p><ul class="r-tal">${e.talents.map(t => `<li class="${t.found ? '' : 'lost'}"><b>${t.icon} ${esc(t.name)}${t.grade === 'genius' ? ' ★' : t.grade === 'gifted' ? ' ☆' : ''}</b><span>${esc(t.line)}</span></li>`).join('')}</ul>` : `<p class="r-sec">타고난 재능</p><ul class="r-tal"><li class="lost"><span>특별히 타고난 재능은 없었다. 그래서 더 평범하게, 더 스스로의 힘으로.</span></li></ul>`}
        <p class="r-sec">인생의 갈림길</p>
        <ul class="r-cross">${cr.map(x => `<li><b>${x.a}세 · ${esc(x.ic)} ${esc(x.ti)}</b><span>“${esc(x.ch)}”${RES[x.ty] ? ` <em class="${x.ty}">${RES[x.ty]}</em>` : ''}</span></li>`).join('') || '<li><span>조용한 인생이었다.</span></li>'}</ul>
        <p class="r-quote">"${esc(e.oneLiner)}"</p>
        <p class="r-seed">인생 코드 ${esc(p.seed)} · 선택 ${e.choices}번 · 대한민국 인생게임</p>
      </div>
      ${e.fresh && e.fresh.length ? `<p class="end-fresh">📖 도감에 새로 추가 · ${e.fresh.map(esc).join(' · ')}</p>` : ''}
      ${p.daily ? (() => { const b = LG.Storage.dex().daily[p.daily]; return `<p class="end-fresh">📅 오늘의 인생 공식 기록(첫 도전) · ${b ? b.total + '점 (' + esc(b.title) + ')' : '-'}${b && b.tries > 1 ? `<br><small>이번은 ${b.tries}번째 도전 — 연습 기록 최고 ${b.best}점</small>` : ''}<br><small>같은 날 같은 출발점 — 결과 카드를 친구에게 보내 겨뤄 보세요</small></p>`; })() : ''}
      <p class="end-text">${esc(e.values)}<br>${esc(e.luck)}<br><span style="color:var(--ink-3)">어느 쪽이 더 좋은 인생인지는, 당신이 정합니다.</span></p>
      <div class="end-actions">
        <button class="btn btn-primary" id="btn-reborn" type="button">다시 태어나기</button>
        <div class="row2">
          <button class="btn btn-ghost" id="btn-save-card" type="button">결과 저장</button>
          <button class="btn btn-ghost" id="btn-same" type="button">같은 출발점으로</button>
        </div>
      </div>
      <div class="end-tl"><h3 class="sh-sec">인생 연표</h3>${tl.map(x => `<div class="log-item k-${x.k}"><b>${x.a}세</b><span>${esc(x.t)}</span></div>`).join('')}</div>`;
    $('#end-body').scrollTop = 0;
    if (K.lifemap) K.lifemap.bind($('#end-body'), p);
    $('#btn-reborn').onclick = () => { p = K.p = null; initTitle(); };
    $('#btn-same').onclick = () => { startLife(null, p.seed); };
    $('#btn-save-card').onclick = () => saveCard(e);
  }

  // 결과 카드를 이미지로 (공유 시트 또는 다운로드)
  function saveCard(e) {
    let p = K.p;
    const W = 1080, H = 1720, c = document.createElement('canvas');
    c.width = W; c.height = H;
    const x = c.getContext('2d');
    const F = getComputedStyle(document.body).fontFamily;
    const g = x.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#fffaf2'); g.addColorStop(1, '#efe3d3');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    const glow = getComputedStyle($('#app')).getPropertyValue('--glow').trim() || '#ffb0a0';
    const rg = x.createRadialGradient(W - 120, 80, 10, W - 120, 80, 420);
    rg.addColorStop(0, glow); rg.addColorStop(1, 'rgba(255,255,255,0)');
    x.globalAlpha = .55; x.fillStyle = rg; x.fillRect(0, 0, W, H); x.globalAlpha = 1;
    const ink = '#2a2230', ink2 = '#6b6070';
    const text = (t, px, py, size, weight, color, align) => { x.font = `${weight} ${size}px ${F}`; x.fillStyle = color; x.textAlign = align || 'left'; x.fillText(t, px, py); };
    const L = 90;
    text('나 의  인 생', L, 150, 34, 700, ink2);
    text(`${p.name} · ${p.birthYear} – ${p.year}`, L, 205, 36, 500, ink2);
    text(String(p.age), L, 380, 190, 900, ink);
    x.font = `900 190px ${F}`; const aw = x.measureText(String(p.age)).width;
    text('세', L + aw + 10, 380, 64, 800, ink);
    text(e.title, L, 470, 58, 900, ink);
    text(`종합 ${e.total}점 · ${e.grade}`, L, 530, 36, 700, ink2);
    const tags = [e.dom ? `${e.dom.short}형으로 살았다` : '', e.tend ? e.tend.name : ''].filter(Boolean).join('  ·  ');
    if (tags) text(tags, L, 580, 30, 600, ink2);

    const fit = (t, w, size, weight) => { x.font = `${weight} ${size}px ${F}`; let u = t; while (x.measureText(u).width > w && u.length > 4) u = u.slice(0, -2); return u !== t ? u + '…' : u; };
    const tl_ = (e.talents || []).filter(t => t.found && t.grade !== 'common' || t.grade === 'genius');
    if (tl_.length) text(fit(tl_.map(t => `${t.icon}${t.name}${t.grade === 'genius' ? ' 천재' : ' 수재'}`).join('  ·  ') + '', 900, 26, 500), L, 622, 26, 500, ink2);
    const s = e.s;
    const rows = [['💰 자산', s.money, U.money(e.net)], ['❤️ 건강', s.health], ['😊 행복', s.happy], ['🤝 관계', s.rel], ['🏆 성취', s.achv], ['🧭 경험', s.exp]];
    rows.forEach((r, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const bx = L + col * 460, by = 660 + row * 88;
      text(r[0], bx, by, 32, 600, ink2);
      text(String(r[2] || r[1]), bx + 400, by, 34, 800, ink, 'right');
      x.fillStyle = '#e3d8ca'; x.fillRect(bx, by + 20, 400, 10);
      x.fillStyle = ink; x.fillRect(bx, by + 20, 400 * r[1] / 100, 10);
    });
    const RES = { success: '성공', partial: '절반의 성공', fail: '실패', done: '' };
    // 인생 지도 (행복·관계·건강 곡선 + 큰 순간 아이콘)
    text('인생 지도', L, 900, 28, 700, ink2);
    if (!(K.lifemap && K.lifemap.canvas(x, p, L, 930, W - L * 2, 170, F))) text('기록이 충분하지 않다', L, 990, 26, 500, ink2);
    text('인생의 갈림길', L, 1230, 28, 700, ink2);
    const cr = e.cross || [];
    x.fillStyle = '#d9cbb9'; x.fillRect(L, 1257, 4, cr.length * 104 - 20);
    cr.forEach((h, i) => {
      const y = 1295 + i * 104;
      x.fillStyle = ink; x.beginPath(); x.arc(L + 2, y - 10, 8, 0, Math.PI * 2); x.fill();
      text(fit(`${h.a}세 · ${h.ti}`, 820, 33, 800), L + 30, y, 33, 800, ink);
      text(fit(`“${h.ch}”${RES[h.ty] ? '  ' + RES[h.ty] : ''}`, 820, 28, 500), L + 30, y + 44, 28, 500, '#4a4050');
    });
    text(`"${e.oneLiner}"`, L, 1640, 42, 800, ink);
    text(p.daily ? `대한민국 인생게임 · 오늘의 인생 ${p.daily} · 종합 ${e.total}점${(() => { const b = LG.Storage.dex().daily[p.daily]; return b && b.tries > 1 ? ` (${b.tries}번째 도전)` : ''; })()}` : '대한민국 인생게임 · 인생 코드 ' + p.seed, L, 1692, 26, 500, ink2);
    c.toBlob(async blob => {
      if (!blob) return;
      const file = new File([blob], `인생_${p.name}_${p.age}세.png`, { type: 'image/png' });
      try {
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: '나의 인생', text: `${p.name}, ${p.age}세 — ${e.title}` });
          return;
        }
      } catch (err) { if (err && err.name === 'AbortError') return; }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = file.name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      toast('결과 카드를 저장했다');
    }, 'image/png');
  }

  // 시작: 저장된 인생이 있으면 바로 이어서, 없으면 타이틀

  Object.assign(K, { deathSequence, renderEnd, saveCard });
})(window.LG = window.LG || {});
