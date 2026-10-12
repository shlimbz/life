/* UI · 플레이: 시간 흐름 · 피드 · 하단 현황 패널 · 조작 버튼 */
(function (LG) {
  'use strict';
  const K = LG.UIK;
  const { $, $$, esc, wait, render, st } = K;
  const S = LG.State, U = LG.U;
  const deathSequence = (...a) => K.deathSequence(...a);
  const guardBack = (...a) => K.guardBack(...a);
  const openEvent = (...a) => K.openEvent(...a);
  const openSheet = (...a) => K.openSheet(...a);
  const setStage = (...a) => K.setStage(...a);
  const show = (...a) => K.show(...a);
  const toast = (...a) => K.toast(...a);

  // ───────────────── 플레이 ─────────────────
  function enterPlay(resume) {
    let p = K.p;
    show('scr-play');
    guardBack();
    $('#feed').innerHTML = '';
    $('#event').classList.add('hidden');
    $('#stage').classList.remove('has-event');
    st.paused = false; st.eventOpen = false; st.busy = false; st.sheetOpen = false; st.dash = null;
    st.speed = LG.Storage.prefs().speed || 1;
    updateCtrl();
    // 최근 기록으로 피드 복원
    if (resume) {
      const recent = p.history.slice(-14);
      let cur = null, block = null;
      recent.forEach(h => {
        if (h.a !== cur) { cur = h.a; block = yearBlock(h.a); }
        addLine(block, { t: h.t, icon: h.i, major: h.k === 'major' || h.k === 'birth', reflect: h.k === 'reflect', choice: h.k === 'choice' }, true);
      });
    } else {
      const b = yearBlock(0);
      addLine(b, { t: p.history[0].t, icon: '👶', major: true });
    }
    st.last = snapshotHUD();
    updateHUD(true);
    if (!p.alive) return deathSequence();
    if (p.pending) setTimeout(() => openEvent(LG.Game.pendingEvent(p)), 500);
    else schedule(900);
  }

  function schedule(ms) {
    let p = K.p;
    clearTimeout(st.timer);
    st.timer = setTimeout(tick, ms != null ? ms : LG.Game.yearDelay(p.age) / st.speed);
  }

  function canRun() { const p = K.p; return p && p.alive && !st.paused && !st.eventOpen && !st.sheetOpen && !st.busy && document.body.dataset.screen === 'scr-play'; }

  function tick() {
    let p = K.p;
    if (!canRun()) return;
    const r = LG.Game.advance(p);
    const block = yearBlock(p.age);
    r.lines.forEach((l, i) => setTimeout(() => addLine(block, l), i * 260 / st.speed));
    trimFeed();
    updateHUD();
    LG.Storage.save(p);
    if (r.death) return deathSequence();
    if (r.event) { setTimeout(() => openEvent(r.event), (420 + r.lines.length * 260) / st.speed); return; }
    schedule(LG.Game.yearDelay(p.age) / st.speed + r.lines.length * 330 / st.speed);
  }

  function yearBlock(age) {
    const feed = $('#feed'), lastEl = feed.lastElementChild;
    if (lastEl && lastEl.dataset.age === String(age)) return lastEl.querySelector('.yr-lines');
    const d = document.createElement('div');
    d.dataset.age = age;
    d.className = 'yr';
    d.innerHTML = `<div class="yr-age">${age}세</div><div class="yr-lines"></div>`;
    feed.appendChild(d);
    // 지난 해 블록은 흐리게
    Array.from(feed.children).forEach((c, i, arr) => c.classList.toggle('old', i < arr.length - 1));
    return d.querySelector('.yr-lines');
  }

  function addLine(block, l, noScroll) {
    const d = document.createElement('div');
    d.className = 'ln' + (l.major ? ' major' : '') + (l.flavor ? ' flavor' : '') + (l.reflect ? ' reflect' : '') + (l.choice ? ' picked' : '');
    d.innerHTML = `<span class="i">${esc(l.icon || '·')}</span><span>${esc(l.t)}</span>` + (l.res ? `<span class="res ${l.res}">${{ success: '성공', partial: '부분 성공', fail: '실패' }[l.res]}</span>` : '');
    block.appendChild(d);
    const f = $('#feed');
    if (!noScroll) f.scrollTo({ top: f.scrollHeight, behavior: 'smooth' });
    else f.scrollTop = f.scrollHeight;
  }

  function trimFeed() {
    const f = $('#feed');
    while (f.children.length > 40) f.removeChild(f.firstChild);
  }

  // ───────────────── 하단 현황 패널 ─────────────────
  function snapshotHUD() {
    let p = K.p;
    return { money: S.netWorth(p), health: Math.round(p.stats.health), happy: Math.round(p.happy), rel: S.relScore(p) };
  }

  const barTone = (v, inv) => { const x = inv ? 100 - v : v; return x >= 62 ? 'hi' : x >= 38 ? 'mid' : 'lo'; };
  function bar(label, v, inv) {
    v = Math.round(v);
    return `<div class="bc${inv ? ' stress' : ''}"><span class="bl">${label}</span><div class="bt"><i class="${barTone(v, inv)}" style="width:${U.clamp(v, 0, 100)}%"></i></div><b>${v}</b></div>`;
  }

  function dashHTML() {
    let p = K.p;
    const stt = p.stats;
    const reg = S.liveRegion(p);
    const inv = LG.Invest.total(p);
    const nw = S.netWorth(p);
    const mi = S.monthlyIncome(p);
    const found = p.found.map(t => LG.DATA.talents[t]);
    const hidden = p.talents.some(t => p.found.indexOf(t) < 0);
    const J = S.job(p);
    const jobTxt = S.jobLabel(p);
    return `
      <div class="d-chips">
        <span class="dchip">💼 ${esc(jobTxt)}</span>
        <span class="dchip">🎓 ${esc(S.eduLabel(p))}</span>
        <span class="dchip">🏠 ${esc(S.homeLabel(p))}</span>
        ${p.age >= 19 ? `<button class="dchip tap" data-open="style" type="button">${LG.Style.cur(p).icon} ${esc(p.style ? LG.Style.cur(p).short + '형' : '삶의 방식')}</button>` : ''}
        <button class="dchip tap" data-open="people" type="button">${p.people.some(n => n.alive && n.role === 'spouse') ? '💍' : p.people.some(n => n.alive && n.role === 'partner') ? '💗' : '🙂'} ${esc(S.relLabel(p))}</button>
      </div>
      <button class="d-money" data-open="asset" type="button" aria-label="자산 관리 열기">
        <div class="mc" id="mc-nw"><span>순자산</span><b>${U.money(nw)}</b><small>${p.debt > 0 ? '빚 ' + U.money(p.debt) : p.house ? '집 ' + U.money(p.house.value) : '&nbsp;'}</small></div>
        <div class="mc"><span>현금 · 투자</span><b>${U.money(Math.max(0, p.money) + inv)}</b><small>${inv > 0 ? '투자 ' + U.money(inv) : '현금 ' + U.money(Math.max(0, p.money))}</small></div>
        <div class="mc"><span>월 수입</span><b>${p.age >= 19 && mi > 0 ? U.money(mi) : '—'}</b><small>${p.age >= 19 && p.lastNet != null ? (p.lastNet >= 0 ? '월 저축 +' : '월 적자 -') + U.money(Math.abs(Math.round(p.lastNet / 12))) : '&nbsp;'}</small></div>
        <span class="chev">›</span>
      </button>
      <div class="d-bars">
        ${bar('건강', stt.health)}${bar('행복', p.happy)}${bar('스트레스', p.stress, true)}
        ${bar('학습', stt.intelligence)}${bar('운동', stt.physical)}${bar('사교', stt.social)}
        ${bar('창의', stt.creativity)}${bar('정신', stt.mental)}${bar('관계', S.relScore(p))}
      </div>
      <div class="d-tags">
        ${found.map(t => `<span class="tg tal">${t.icon} ${esc(t.name)}</span>`).join('')}${hidden ? '<span class="tg dim">✨ 숨은 재능?</span>' : ''}
        ${(() => { const t = LG.Timeline.tendency(p); return t ? `<span class="tg tal">${t.icon} ${esc(t.name)}</span>` : ''; })()}
        ${p.traits.map(t => `<span class="tg">${esc(LG.DATA.traits[t].name)}</span>`).join('')}
      </div>`;
  }

  function updateHUD(instant) {
    let p = K.p;
    const age = $('#hud-age');
    if (age.textContent !== String(p.age)) { age.textContent = p.age; age.classList.remove('tick'); void age.offsetWidth; age.classList.add('tick'); }
    $('#hud-name').textContent = p.name;
    $('#hud-year').textContent = `${p.year}년`;
    const pct = Math.min(100, p.age / 90 * 100);
    $('#life-fill').style.width = pct + '%';
    $('#life-dot').style.left = pct + '%';
    setStage(p.age);

    const dash = $('#dash');
    dash.innerHTML = dashHTML();
    const now = snapshotHUD();
    if (!instant && st.last) {
      const d = now.money - st.last.money;
      const box = $('#mc-nw');
      if (box && Math.abs(d) >= 300) { box.classList.add(d > 0 ? 'up' : 'down'); setTimeout(() => box.classList.remove('up', 'down'), 900); }
    }
    st.last = now;
  }

  $('#dash').addEventListener('click', e => {
    const t = e.target.closest('[data-open]');
    if (t) openSheet(t.dataset.open);
  });

  function updateCtrl() {
    $('#btn-speed').textContent = st.speed + '×';
    $('#btn-pause').textContent = st.paused ? '▶' : '❚❚';
    $('#btn-pause').setAttribute('aria-label', st.paused ? '계속' : '일시정지');
  }

  $('#btn-speed').addEventListener('click', () => {
    st.speed = st.speed >= 4 ? 1 : st.speed + 1;
    LG.Storage.setPref('speed', st.speed);
    updateCtrl();
    if (canRun()) schedule(200);
  });
  $('#btn-pause').addEventListener('click', () => {
    st.paused = !st.paused; updateCtrl();
    if (st.paused) { clearTimeout(st.timer); toast('시간이 멈췄다'); } else schedule(300);
  });
  $('#btn-people').addEventListener('click', () => openSheet('people'));
  $('#btn-log').addEventListener('click', () => openSheet('log'));
  $('#btn-asset').addEventListener('click', () => openSheet('asset'));
  $('#btn-menu').addEventListener('click', () => openSheet('menu'));

  Object.assign(K, { enterPlay, schedule, canRun, tick, yearBlock, addLine, trimFeed, snapshotHUD, bar, dashHTML, updateHUD, updateCtrl, barTone });
})(window.LG = window.LG || {});
