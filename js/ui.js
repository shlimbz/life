/* UI — 모바일 화면, 시간 흐름 연출, 이벤트 카드, 바텀시트, 결과 카드 */
(function (LG) {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const S = LG.State, U = LG.U;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const render = (p, t) => LG.Events.render(p, t);

  let p = null;
  const st = { timer: null, paused: false, speed: 1, eventOpen: false, sheetOpen: false, last: null, busy: false, dash: null };

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
  function saveNow() { if (p && p.alive) LG.Storage.save(p); }
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

  // ───────────────── 타이틀 ─────────────────
  function initTitle() {
    const saved = LG.Storage.load();
    const btn = $('#btn-continue');
    if (saved && saved.alive) {
      btn.textContent = `이어하기 · ${saved.name}, ${saved.age}세`;
      btn.classList.remove('hidden');
      btn.onclick = () => { p = saved; LG.Events.init(); enterPlay(true); };
    } else btn.classList.add('hidden');
    const lives = LG.Storage.lives();
    $('#past-lives').textContent = lives.length ? `지금까지 ${lives.length}번의 인생을 살았다` : '';
    setStage(0);
    show('scr-title');
  }

  $$('.btn-gender').forEach(b => b.addEventListener('click', () => {
    const old = LG.Storage.load();
    if (old && old.alive && !confirm(`저장된 인생(${old.name}, ${old.age}세)이 있어요.\n새로 시작하면 사라집니다. 계속할까요?`)) return;
    startLife(b.dataset.gender);
  }));

  function startLife(gender, seed) {
    seed = seed || new URLSearchParams(location.search).get('seed') || undefined;
    p = LG.Game.newLife(gender, seed);
    LG.Storage.save(p);
    birthReveal();
  }

  // ───────────────── 출생 공개 ─────────────────
  async function birthReveal() {
    show('scr-birth');
    setStage(0);
    const body = $('#birth-body');
    const startBtn = $('#btn-start-life');
    startBtn.disabled = true;
    body.innerHTML = '';
    const reg = LG.DATA.regions[p.region];
    const add = (html, cls) => { const d = document.createElement('div'); d.className = 'reveal ' + (cls || ''); d.innerHTML = html; body.appendChild(d); body.scrollTop = body.scrollHeight; return d; };
    const line = (ic, html) => add(`<p class="b-line"><span class="ic">${ic}</span><span>${html}</span></p>`);

    add(`<p class="b-kicker">당신은 태어났다</p>`);
    await wait(500);
    line('📅', `<b>${p.birthYear}년</b>, 대한민국`);
    await wait(420);
    line('📍', `<b>${esc(reg.name)} ${esc(p.town)}</b>${p.urban ? '' : ' · 시골 마을'}`);
    await wait(420);
    line('🏠', `${esc(p.family.home)} · 형편 <b>${LG.Birth.TIER_LABEL[p.family.tier]}</b>`);
    await wait(420);
    LG.Rel.parents(p).forEach(n => {
      const ic = n.role === 'father' ? '👨' : n.role === 'mother' ? '👩' : '🧓';
      const label = n.role === 'grandparent' ? (n.gender === 'M' ? '할아버지' : '할머니') : LG.Rel.ROLE_LABEL[n.role];
      line(ic, `${label} ${n.age}세 · <b>${esc(LG.DATA.jobs[n.job] ? LG.DATA.jobs[n.job].name : '무직')}</b> · ${esc(n.personality)}`);
    });
    if (p.family.tags.indexOf('single_parent') >= 0) line('🫂', '한 부모 가정에서 자란다');
    const older = p.people.filter(n => n.role === 'sibling' && n.age > 0).length;
    line('👧', older ? `손위 형제 <b>${older}명</b>` : '<b>첫째</b>로 태어났다');
    await wait(500);

    add(`<p class="b-name">당신의 이름은<strong>${esc(p.name)}</strong></p>`);
    await wait(600);

    const st_ = p.stats;
    const g = [['건강', U.healthWord(st_.health)], ['학습능력', U.level(st_.intelligence)], ['운동능력', U.level(st_.physical)], ['사교성', U.level(st_.social)], ['창의력', U.level(st_.creativity)], ['정신력', U.level(st_.mental)]];
    add(`<div class="b-grid">${g.map(x => `<div class="b-stat"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div>`);
    await wait(400);
    add(`<div class="b-chips">${p.traits.map(t => `<span class="chip">${esc(LG.DATA.traits[t].name)}</span>`).join('')}</div>`);
    await wait(400);
    const pc = LG.Birth.prosCons(p);
    add(`<div class="b-pc"><div><h4>👍 이 출발의 장점</h4><ul>${pc.pros.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div><div><h4>👎 이 출발의 단점</h4><ul>${pc.cons.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div></div>`);
    await wait(300);
    add(`<p class="b-note">재능은 살아가며 발견하게 됩니다.<br>출발점은 고를 수 없지만, 방향은 당신이 정합니다.</p>`);
    startBtn.disabled = false;
    startBtn.onclick = () => enterPlay(false);
  }

  // ───────────────── 플레이 ─────────────────
  function enterPlay(resume) {
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
    clearTimeout(st.timer);
    st.timer = setTimeout(tick, ms != null ? ms : LG.Game.yearDelay(p.age) / st.speed);
  }

  function canRun() { return p && p.alive && !st.paused && !st.eventOpen && !st.sheetOpen && !st.busy && document.body.dataset.screen === 'scr-play'; }

  function tick() {
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
    return { money: S.netWorth(p), health: Math.round(p.stats.health), happy: Math.round(p.happy), rel: S.relScore(p) };
  }

  const barTone = (v, inv) => { const x = inv ? 100 - v : v; return x >= 62 ? 'hi' : x >= 38 ? 'mid' : 'lo'; };
  function bar(label, v, inv) {
    v = Math.round(v);
    return `<div class="bc${inv ? ' stress' : ''}"><span class="bl">${label}</span><div class="bt"><i class="${barTone(v, inv)}" style="width:${U.clamp(v, 0, 100)}%"></i></div><b>${v}</b></div>`;
  }

  function dashHTML() {
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
    st.speed = st.speed === 1 ? 2 : st.speed === 2 ? 3 : 1;
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

  // ───────────────── 이벤트 카드 (화면을 가리지 않는다) ─────────────────
  function openEvent(ev) {
    if (!ev) { schedule(); return; }
    clearTimeout(st.timer);
    st.eventOpen = true;
    const layer = $('#event'), card = $('#event-card');
    const opts = LG.Events.preview(p, ev);
    card.innerHTML = `
      <div class="ev-top"><span class="ev-age">${p.age}세 · ${p.year}년</span><span class="ev-kicker">${esc(ev.icon || '')} ${esc(ev.label || '')}</span></div>
      <h2 class="ev-title">${esc(render(p, ev.title))}</h2>
      <p class="ev-text">${esc(render(p, ev.text))}</p>
      <div class="choices">${opts.map(o => `
        <button class="choice" data-id="${esc(o.c.id)}" type="button">
          <span class="lbl">${esc(render(p, o.c.label))}</span>
          ${o.prob ? `<span class="pchip ${o.prob.tone}">${o.prob.label}</span>` : ''}
        </button>`).join('')}
      </div>
      ${opts.some(o => o.prob && o.prob.factors.length) ? `<button class="why-toggle" type="button">무엇이 영향을 줄까? ▾</button><div class="why hidden">${opts.filter(o => o.prob).map(o => `
        <div class="why-row"><b>${esc(render(p, o.c.label))}</b>${o.prob.factors.slice(0, 5).map(f => `<span class="f-chip ${f.v > 0 ? 'pos' : 'neg'}">${f.v > 0 ? '▲' : '▼'} ${esc(f.label)}</span>`).join('') || '<span class="f-chip">특별한 요인 없음</span>'}</div>`).join('')}</div>` : ''}
    `;
    layer.classList.remove('hidden');
    $('#stage').classList.add('has-event');
    card.scrollTop = 0;
    // 되돌릴 수 없는 중요한 선택은 한 번 더 눌러야 확정된다 (실수 방지)
    const confirmOn = LG.Storage.prefs().confirm !== false;
    let armed = null, armTimer = null;
    const disarm = () => { if (armed) { armed.classList.remove('armed'); armed.querySelector('.lbl').textContent = armed.dataset.label; armed = null; } clearTimeout(armTimer); card.classList.remove('has-armed'); };
    let done = false;
    card.querySelectorAll('.choice').forEach(b => {
      const c = opts.find(o => o.c.id === b.dataset.id).c;
      const heavy = confirmOn && (ev.tier === 'major' || ev.milestone || c.confirm || c.intent === 'risk');
      b.dataset.label = b.querySelector('.lbl').textContent;
      b.addEventListener('click', () => {
        if (done) return;
        if (heavy && armed !== b) {
          disarm();
          armed = b; b.classList.add('armed'); card.classList.add('has-armed');
          b.querySelector('.lbl').textContent = '한 번 더 누르면 확정: ' + b.dataset.label;
          if (navigator.vibrate) try { navigator.vibrate(10); } catch (e) { /* 무시 */ }
          armTimer = setTimeout(disarm, 5000);
          return;
        }
        done = true; clearTimeout(armTimer);
        choose(ev, b.dataset.id);
      });
    });
    const why = card.querySelector('.why-toggle');
    if (why) why.addEventListener('click', () => {
      const w = card.querySelector('.why');
      w.classList.toggle('hidden');
      why.textContent = w.classList.contains('hidden') ? '무엇이 영향을 줄까? ▾' : '접기 ▴';
      card.scrollTop = card.scrollHeight;
    });
    const f = $('#feed'); f.scrollTop = f.scrollHeight;
  }

  async function choose(ev, id) {
    const card = $('#event-card');
    card.querySelectorAll('.choice').forEach(b => b.disabled = true);
    if (navigator.vibrate) try { navigator.vibrate(8); } catch (e) { /* 무시 */ }
    const res = LG.Game.choose(p, id);
    LG.Storage.save(p);
    const label = render(p, res.choice.label);
    const fast = st.speed > 1 ? 0.6 : 1;
    card.innerHTML = `<div class="ev-top"><span class="ev-age">${p.age}세</span><span class="ev-kicker">${esc(ev.icon || '')} ${esc(ev.label || '')}</span></div><div class="seq" id="seq"></div>`;
    const seq = card.querySelector('#seq');
    const step = (html, cls) => { const d = document.createElement('p'); d.className = 'seq-step ' + (cls || ''); d.innerHTML = html; seq.appendChild(d); return d; };
    step(`<b>${esc(label)}</b>`, 'strong');
    await wait(600 * fast);
    if (res.type !== 'done') {
      const w = step(esc(res.steps[1] || '결과를 기다리는 중'), 'dots');
      await wait(1000 * fast);
      w.remove();
    }
    seq.innerHTML = '';
    const badge = { success: '✓ 성공', partial: '◐ 부분 성공', fail: '✕ 실패', done: '→ 선택' }[res.type];
    seq.insertAdjacentHTML('beforeend', `<span class="badge ${res.type}">${badge}</span>`);
    seq.insertAdjacentHTML('beforeend', `<p class="res-text">${esc(res.text || '선택했다.')}</p>`);
    if (res.deltas.length) {
      seq.insertAdjacentHTML('beforeend', `<div class="deltas">${res.deltas.map((d, i) => `<span class="delta ${d.good ? 'good' : 'bad'}" style="animation-delay:${i * 70}ms">${d.icon} ${esc(d.label)} ${esc(d.text)}</span>`).join('')}</div>`);
    }
    if (res.type !== 'done') {
      if (res.help.length) seq.insertAdjacentHTML('beforeend', `<p class="because"><b>도움이 된 것</b> · ${res.help.map(esc).join(', ')}</p>`);
      if (res.hurt.length) seq.insertAdjacentHTML('beforeend', `<p class="because"><b>걸림돌</b> · ${res.hurt.map(esc).join(', ')}</p>`);
    }
    const next = document.createElement('button');
    next.className = 'ev-next'; next.type = 'button';
    next.textContent = p.pending ? '다음' : '계속 살아가기';
    seq.appendChild(next);
    card.scrollTop = 0;

    // 피드에도 기록, 현황 패널은 즉시 반영 (카드 뒤가 아니라 아래에 그대로 보인다)
    const block = yearBlock(p.age);
    addLine(block, { t: p.history[p.history.length - 1].t, icon: ev.icon, choice: true, res: res.type !== 'done' ? res.type : null });
    updateHUD();

    next.addEventListener('click', () => {
      if (p.pending) { openEvent(LG.Game.pendingEvent(p)); return; }
      closeEvent();
    }, { once: true });
  }

  function closeEvent() {
    $('#event').classList.add('hidden');
    $('#stage').classList.remove('has-event');
    st.eventOpen = false;
    trimFeed();
    saveNow();
    if (!p.alive) return deathSequence();
    schedule(LG.Game.yearDelay(p.age) / st.speed);
  }

  // ───────────────── 바텀 시트 (사람 · 기록 · 자산 · 메뉴) ─────────────────
  $('#sheet').addEventListener('click', e => { if (e.target.closest('[data-close]')) closeSheet(); });

  function openSheet(tab) {
    if (!p) return;
    clearTimeout(st.timer);
    st.sheetOpen = true;
    const body = $('#sheet-body');
    body.innerHTML = tab === 'people' ? peopleHTML() : tab === 'asset' ? assetHTML() : tab === 'style' ? styleHTML() : tab === 'menu' ? menuHTML() : logHTML('key');
    body.scrollTop = 0;
    $('#sheet').classList.remove('hidden');
    $('#sheet .sheet').classList.remove('closing');
    if (tab === 'log') bindLogSeg();
    if (tab === 'asset') bindAsset();
    if (tab === 'style') bindStyle();
    if (tab === 'menu') bindMenu();
  }

  function closeSheet(silent) {
    const layer = $('#sheet');
    if (layer.classList.contains('hidden')) return;
    const sh = layer.querySelector('.sheet');
    sh.classList.add('closing');
    setTimeout(() => { layer.classList.add('hidden'); sh.classList.remove('closing'); }, 220);
    st.sheetOpen = false;
    updateHUD(true);
    if (silent !== true && canRun()) schedule(500);
  }

  const AVATAR = { father: '👨', mother: '👩', grandparent: '🧓', sibling: '🧒', friend: '🙂', partner: '💗', spouse: '💍', child: '👶', ex: '💭', ex_spouse: '💔', past_friend: '🍂' };
  function personCard(n) {
    const J = n.job && LG.DATA.jobs[n.job];
    let roleLabel = LG.Rel.ROLE_LABEL[n.role] || '';
    if (n.role === 'grandparent') roleLabel = n.gender === 'M' ? '할아버지' : '할머니';
    if (n.role === 'sibling') roleLabel = n.note === '손위' ? (n.gender === 'M' ? '형·오빠' : '누나·언니') : '동생';
    if (n.role === 'child') roleLabel = n.gender === 'M' ? '아들' : '딸';
    const ava = n.role === 'child' && n.age >= 20 ? (n.gender === 'M' ? '👨' : '👩') : AVATAR[n.role] || '🙂';
    const sub = [roleLabel, n.alive ? n.age + '세' : `${n.diedAt != null ? '향년 ' + n.age + '세' : '별세'}`, J ? J.name : null, n.note && n.role !== 'sibling' ? n.note : null, n.personality].filter(Boolean).join(' · ');
    return `<div class="card person ${n.alive ? '' : 'gone'}"><div class="avatar">${n.alive ? ava : '🕯️'}</div>
      <div><div class="p-name">${esc(n.name)}</div><div class="p-sub">${esc(sub)}</div>${n.alive ? `<div class="meter"><i style="width:${Math.round(n.rel)}%"></i></div>` : ''}</div>
      <div class="p-rel">${n.alive ? `관계<b>${relWord(n.rel)}</b>` : ''}</div></div>`;
  }
  function relWord(v) { return v >= 85 ? '각별함' : v >= 68 ? '가까움' : v >= 50 ? '무난함' : v >= 32 ? '서먹함' : '냉랭함'; }

  const closeBtn = '<button class="sheet-x" data-close type="button" aria-label="닫기">✕</button>';

  function peopleHTML() {
    const ppl = p.people.filter(n => n.age >= 0);
    const group = (title, roles) => {
      const list = ppl.filter(n => roles.indexOf(n.role) >= 0);
      return `<h3 class="sh-sec">${title}</h3>` + (list.length ? list.map(personCard).join('') : '<p class="empty">아직 없음</p>');
    };
    return `<h2 class="sh-title">사람들${closeBtn}</h2>` +
      group('사랑', ['spouse', 'partner']) +
      group('가족', ['father', 'mother', 'grandparent', 'sibling']) +
      (ppl.some(n => n.role === 'child') ? group('자녀', ['child']) : '') +
      group('친구', ['friend']) +
      (ppl.some(n => ['ex', 'ex_spouse', 'past_friend'].indexOf(n.role) >= 0) ? group('지나간 인연', ['ex', 'ex_spouse', 'past_friend']) : '');
  }

  // 자산 시트
  function assetHTML() {
    LG.Invest.init(p);
    const I = LG.Invest, m = p.mkt, nw = S.netWorth(p);
    const rows = I.allocation(p);
    const tot = rows.reduce((a, r) => a + r.v, 0) || 1;
    const colors = { cash: '#c9c3d6', deposit: '#7fd6c2', stock: '#7fb2ff', crypto: '#ffb36b', house: '#d89cf0' };
    const pol = p.invPolicy || 'cash';
    const canInvest = p.age >= 19;
    const hist = (m && m.hist) ? m.hist.slice(-10) : [];
    const last = p.invLast;
    const maxAbs = Math.max(20, ...hist.map(h => Math.abs(h.s)));
    return `<h2 class="sh-title">자산 관리${closeBtn}</h2>
      <div class="card as-sum">
        <div class="as-nw"><span>순자산</span><b>${U.money(nw)}원</b></div>
        <div class="as-stack">${rows.filter(r => r.v > 0).map(r => `<i style="flex:${r.v};background:${colors[r.k]}" title="${r.name}"></i>`).join('') || '<i style="flex:1;background:#555"></i>'}</div>
        <div class="as-legend">${rows.map(r => `<div><i style="background:${colors[r.k]}"></i><span>${r.icon} ${r.name}</span><b>${U.money(r.v)}</b><small>${Math.round(r.v / tot * 100)}%</small></div>`).join('')}
          ${p.debt > 0 ? `<div class="debt"><i style="background:#ef6b6b"></i><span>🧾 빚</span><b>-${U.money(p.debt)}</b><small></small></div>` : ''}</div>
      </div>
      <h3 class="sh-sec">돈을 굴리는 방식</h3>
      ${canInvest ? '' : '<p class="empty">아직은 돈을 굴릴 나이가 아니다.</p>'}
      <div class="pol-list ${canInvest ? '' : 'off'}">${Object.keys(I.POLICY).map(k => { const o = I.POLICY[k]; return `<button class="pol ${pol === k && p.invPolicy ? 'on' : ''}" data-pol="${k}" type="button"><span class="pi">${o.icon}</span><span class="pt"><b>${o.name}</b><small>${o.desc}</small></span></button>`; }).join('')}</div>
      <p class="as-note">생활 예비자금(약 ${U.money(I.reserve(p))})은 현금으로 남겨 두고, 그 위로 남는 돈을 위 비율대로 굴립니다. 방식을 바꾸면 보유 자산도 새 비율로 다시 배분돼요.</p>
      <h3 class="sh-sec">시장</h3>
      <div class="card">
        ${m ? `<div class="row"><span>증시</span><b>${I.REGIME_NAME[m.regime]} · 지난해 ${m.stockRet >= 0 ? '+' : ''}${Math.round(m.stockRet * 100)}%</b></div>
        <div class="row"><span>코인</span><b>${I.CRYPTO_NAME[m.crypto]} · 지난해 ${m.cryptoRet >= 0 ? '+' : ''}${Math.round(m.cryptoRet * 100)}%</b></div>
        <div class="row"><span>예금 금리</span><b>연 ${(m.rate * 100).toFixed(1)}%</b></div>
        <div class="mini-hist">${hist.map(h => `<div title="${h.y}년 ${h.s}%"><i class="${h.s >= 0 ? 'up' : 'dn'}" style="height:${Math.max(4, Math.abs(h.s) / maxAbs * 100)}%"></i></div>`).join('')}</div><p class="as-note" style="margin-top:4px">최근 증시 연간 수익률</p>` : '<p class="empty">아직 시장 기록이 없다.</p>'}
        ${last && last.before > 0 ? `<div class="row"><span>지난해 투자 손익</span><b class="${last.pl >= 0 ? 'gain' : 'loss'}">${last.pl >= 0 ? '+' : ''}${U.money(last.pl)}원</b></div>` : ''}
      </div>`;
  }
  function bindAsset() {
    $$('#sheet-body .pol').forEach(b => b.addEventListener('click', () => {
      if (p.age < 19) return;
      LG.Invest.setPolicy(p, b.dataset.pol, true);
      saveNow();
      $('#sheet-body').innerHTML = assetHTML(); bindAsset();
      toast(`'${LG.Invest.POLICY[b.dataset.pol].name}'(으)로 운용합니다`);
    }));
  }

  // 삶의 방식 시트
  function fxChips(k) {
    return LG.Style.STYLES[k].fx.map(f => `<span class="fx ${f[1] > 0 ? 'pos' : f[1] < 0 ? 'neg' : ''}">${f[1] > 0 ? '▲' : f[1] < 0 ? '▼' : ''} ${esc(f[0])}</span>`).join('');
  }
  function styleHTML() {
    const Y = LG.Style, cur = Y.cur(p), can = Y.canSwitch(p);
    const wait = Y.COOLDOWN - (p.age - (p.styleSince || 0));
    const years = p.styleYears || {};
    const tot = Object.keys(years).reduce((a, k) => a + years[k], 0);
    return `<h2 class="sh-title">삶의 방식${closeBtn}</h2>
      <div class="card st-cur"><div class="st-head"><span class="pi">${cur.icon}</span><div><b>${esc(cur.name)}</b><small>${esc(cur.desc)}</small></div></div>
        <div class="fxrow">${fxChips(Y.key(p))}</div>
        ${tot ? `<p class="as-note" style="margin:8px 0 0">지금까지: ${Object.keys(years).sort((a, b) => years[b] - years[a]).map(k => `${Y.STYLES[k].icon} ${years[k]}년`).join(' · ')}</p>` : ''}</div>
      <h3 class="sh-sec">방식 바꾸기</h3>
      ${can ? '' : `<p class="empty">방식을 바꾼 지 얼마 안 됐어요. ${wait}년 뒤에 다시 바꿀 수 있습니다.</p>`}
      <div class="pol-list ${can ? '' : 'off'}">${Y.ORDER.concat(['balanced']).map(k => { const o = Y.STYLES[k]; return `<button class="pol st-opt ${Y.key(p) === k && p.style ? 'on' : ''}" data-st="${k}" type="button"><span class="pi">${o.icon}</span><span class="pt"><b>${esc(o.name)}</b><small>${esc(o.desc)}</small><span class="fxrow">${fxChips(k)}</span></span></button>`; }).join('')}</div>
      <p class="as-note">해마다 조금씩 쌓이는 습관입니다. 모든 방식에는 대가가 있고, 나이마다 어울리는 방식도 달라져요. 바꾸면 ${Y.COOLDOWN}년 동안은 다시 바꿀 수 없습니다.</p>`;
  }
  function bindStyle() {
    $$('#sheet-body .st-opt').forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.st, Y = LG.Style;
      if (!Y.canSwitch(p) || (p.style === k)) return;
      Y.set(p, k);
      LG.Timeline.add(p, `삶의 방식을 '${Y.STYLES[k].name}'(으)로 바꿨다.`, 'choice', Y.STYLES[k].icon);
      saveNow();
      $('#sheet-body').innerHTML = styleHTML(); bindStyle();
      toast(`${Y.STYLES[k].icon} ${Y.STYLES[k].short} 방식으로 살아갑니다`);
    }));
  }

  // 메뉴 시트: 내 정보 · 출발점 · 새 인생
  function menuHTML() {
    const stt = p.stats;
    const reg = LG.DATA.regions[p.region];
    const pc = LG.Birth.prosCons(p);
    const aff = LG.Aff.top(p, 4);
    const J = S.job(p);
    let h = `<h2 class="sh-title">${esc(p.name)}의 이야기${closeBtn}</h2>`;
    h += `<h3 class="sh-sec">내가 걸어온 길</h3><div class="card"><div class="b-chips" style="margin:0 0 6px">${aff.length ? aff.map(k => `<span class="chip">${LG.Aff.DOMAINS[k].icon} ${LG.Aff.DOMAINS[k].name}</span>`).join('') : '<span class="empty">아직 뚜렷한 방향이 없다</span>'}</div>
      <p class="as-note" style="margin:0">출생 환경과 재능, 지금까지의 선택이 쌓여 앞으로 찾아올 갈림길에 영향을 줍니다.</p></div>`;
    h += `<h3 class="sh-sec">재능과 성격</h3><div class="card">` +
      `<div class="b-chips" style="margin:0 0 8px">${p.found.map(t => `<span class="chip">${LG.DATA.talents[t].icon} ${esc(LG.DATA.talents[t].name)} 재능</span>`).join('') || '<span class="empty">발견한 재능이 아직 없다</span>'}</div>` +
      p.traits.map(t => `<div class="row"><span>${esc(LG.DATA.traits[t].name)}</span><b style="font-weight:500;font-size:14px">${esc(LG.DATA.traits[t].desc)}</b></div>`).join('') + `</div>`;
    h += `<h3 class="sh-sec">일과 학력</h3><div class="card">` +
      `<div class="row"><span>현재</span><b>${esc(S.jobLabel(p))}</b></div>` +
      (J ? `<div class="row"><span>경력</span><b>${p.job.years + (p.job.carry || 0)}년</b></div><div class="row"><span>평판</span><b>${U.level(p.job.perf)}</b></div><div class="row"><span>연봉</span><b>${U.money(LG.Economy.salary(p))}원</b></div>` : '') +
      `<div class="row"><span>학력</span><b>${esc(S.eduLabel(p))}</b></div></div>`;
    h += `<h3 class="sh-sec">출발점</h3><div class="card">` +
      `<div class="row"><span>출생</span><b>${p.birthYear}년 · ${esc(reg.short)} ${esc(p.town)}</b></div>` +
      `<div class="row"><span>집안 형편</span><b>${LG.Birth.TIER_LABEL[p.family.tier]}</b></div>` +
      `<div class="row"><span>장점</span><b style="font-weight:500;font-size:14px">${pc.pros.map(esc).join(', ')}</b></div>` +
      `<div class="row"><span>단점</span><b style="font-weight:500;font-size:14px">${pc.cons.map(esc).join(', ')}</b></div>` +
      `<div class="row"><span>인생 코드</span><b>${esc(p.seed)}</b></div></div>`;
    h += `<h3 class="sh-sec">설정</h3><label class="card toggle-row"><span>중요한 선택은 한 번 더 확인<small>실수로 눌러 인생이 정해지는 일을 줄여 줍니다</small></span><input type="checkbox" id="pref-confirm" ${LG.Storage.prefs().confirm !== false ? 'checked' : ''}></label>`;
    h += `<p class="as-note">진행 상황은 자동 저장됩니다. 실수로 뒤로가기를 눌러도, 앱을 닫았다 다시 열어도 이어서 할 수 있어요.</p>`;
    h += `<button id="btn-restart" class="danger-link" type="button">이번 인생 포기하고 처음으로</button>`;
    return h;
  }
  function bindMenu() {
    const pc = $('#sheet-body #pref-confirm');
    if (pc) pc.onchange = () => { LG.Storage.setPref('confirm', pc.checked); toast(pc.checked ? '중요한 선택은 한 번 더 확인합니다' : '확인 없이 바로 선택합니다'); };
    const r = $('#sheet-body #btn-restart');
    if (r) r.onclick = () => {
      if (confirm('지금 인생을 끝내고 처음 화면으로 돌아갈까요?\n(저장된 진행이 사라집니다)')) {
        LG.Storage.clear(); closeSheet(true); clearTimeout(st.timer); p = null; initTitle();
      }
    };
  }

  function logHTML(mode) {
    const items = p.history.filter(x => mode === 'all' || x.k !== 'minor');
    return `<h2 class="sh-title">인생 기록${closeBtn}</h2>
      <div class="seg"><button data-mode="key" class="${mode === 'key' ? 'on' : ''}" type="button">주요 사건</button><button data-mode="all" class="${mode === 'all' ? 'on' : ''}" type="button">전체</button></div>
      <div id="log-list">${items.slice().reverse().map(x => `<div class="log-item k-${x.k}"><b>${x.a}세</b><span>${esc(x.i ? x.i + ' ' : '')}${esc(x.t)}</span></div>`).join('')}</div>`;
  }
  function bindLogSeg() {
    $$('#sheet-body .seg button').forEach(b => b.addEventListener('click', () => {
      $('#sheet-body').innerHTML = logHTML(b.dataset.mode); bindLogSeg();
    }));
  }

  // ───────────────── 죽음과 엔딩 ─────────────────
  async function deathSequence() {
    clearTimeout(st.timer);
    st.busy = true;
    const fade = $('#fade');
    $('#fade-text').textContent = `${p.age}세.\n${p.cause} 세상을 떠났다.\n\n당신의 인생이 끝났습니다.`;
    await wait(900);
    fade.classList.remove('hidden');
    LG.Storage.clear();
    const e = LG.Timeline.ending(p);
    if (!p.archived) { p.archived = true; LG.Storage.archive(LG.Game.summary(p)); }
    await wait(4200);
    renderEnd(e);
    show('scr-end');
    fade.classList.add('hidden');
    st.busy = false;
  }

  function renderEnd(e) {
    const s = e.s;
    const bar = (ic, label, v, val) => `<div class="r-stat"><div class="top"><span>${ic} ${label}</span>${val != null ? val : v}</div><div class="bar"><i style="width:${v}%"></i></div></div>`;
    const RES = { success: '성공', partial: '절반의 성공', fail: '실패', done: '' };
    const cr = e.cross || [];
    const facts = [`💼 ${e.job}`, `💍 배우자 ${e.spouse}`, `👶 자녀 ${e.kids}명`, `📍 ${LG.DATA.regions[p.region].short} 출생`];
    const tl = p.history.filter(h => h.k !== 'minor');
    $('#end-body').innerHTML = `
      <div class="rcard" id="rcard">
        <p class="r-kicker">나의 인생</p>
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
        <p class="r-sec">인생의 갈림길</p>
        <ul class="r-cross">${cr.map(x => `<li><b>${x.a}세 · ${esc(x.ic)} ${esc(x.ti)}</b><span>“${esc(x.ch)}”${RES[x.ty] ? ` <em class="${x.ty}">${RES[x.ty]}</em>` : ''}</span></li>`).join('') || '<li><span>조용한 인생이었다.</span></li>'}</ul>
        <p class="r-quote">"${esc(e.oneLiner)}"</p>
        <p class="r-seed">인생 코드 ${esc(p.seed)} · 선택 ${e.choices}번 · 대한민국 인생게임</p>
      </div>
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
    $('#btn-reborn').onclick = () => { p = null; initTitle(); };
    $('#btn-same').onclick = () => { const g = p.gender, seed = p.seed; startLife(g, seed); };
    $('#btn-save-card').onclick = () => saveCard(e);
  }

  // 결과 카드를 이미지로 (공유 시트 또는 다운로드)
  function saveCard(e) {
    const W = 1080, H = 1440, c = document.createElement('canvas');
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
    const fit = (t, w, size, weight) => { x.font = `${weight} ${size}px ${F}`; let u = t; while (x.measureText(u).width > w && u.length > 4) u = u.slice(0, -2); return u !== t ? u + '…' : u; };
    text('인생의 갈림길', L, 945, 28, 700, ink2);
    const cr = e.cross || [];
    x.fillStyle = '#d9cbb9'; x.fillRect(L, 972, 4, cr.length * 104 - 20);
    cr.forEach((h, i) => {
      const y = 1010 + i * 104;
      x.fillStyle = ink; x.beginPath(); x.arc(L + 2, y - 10, 8, 0, Math.PI * 2); x.fill();
      text(fit(`${h.a}세 · ${h.ti}`, 820, 33, 800), L + 30, y, 33, 800, ink);
      text(fit(`“${h.ch}”${RES[h.ty] ? '  ' + RES[h.ty] : ''}`, 820, 28, 500), L + 30, y + 44, 28, 500, '#4a4050');
    });
    text(`"${e.oneLiner}"`, L, 1345, 42, 800, ink);
    text('대한민국 인생게임 · 인생 코드 ' + p.seed, L, 1400, 26, 500, ink2);
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
  LG.Events.init();
  (function boot() {
    const saved = LG.Storage.load();
    if (saved && saved.alive) {
      try {
        p = saved;
        enterPlay(true);
        setTimeout(() => toast(`${saved.name}, ${saved.age}세 · 저장된 인생을 이어갑니다`), 600);
        return;
      } catch (e) {
        console.error(e); LG.Storage.clear(); p = null;
      }
    }
    initTitle();
  })();
  LG.UI = { get p() { return p; }, st };
})(window.LG = window.LG || {});
