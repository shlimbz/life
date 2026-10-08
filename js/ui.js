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
  const st = { timer: null, paused: false, speed: 1, eventOpen: false, sheetOpen: false, last: null, busy: false };

  // ───────────────── 화면 전환 ─────────────────
  function show(id) {
    $$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  }

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.remove('hidden');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.add('hidden'), 1800);
  }

  function setStage(age) {
    const app = $('#app');
    app.dataset.stage = S.stageOf(age);
    // 해가 인생을 따라 하늘을 가로지른다
    const t = Math.min(1, age / 90);
    app.style.setProperty('--sun-x', (10 + t * 80) + '%');
    app.style.setProperty('--sun-y', (34 - Math.sin(t * Math.PI) * 26) + '%');
  }

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

  $$('.btn-gender').forEach(b => b.addEventListener('click', () => startLife(b.dataset.gender)));

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
    $('#feed').innerHTML = '';
    st.paused = false; st.eventOpen = false; st.busy = false;
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

  function canRun() { return p && p.alive && !st.paused && !st.eventOpen && !st.sheetOpen && !st.busy; }

  function tick() {
    if (!canRun()) return;
    const r = LG.Game.advance(p);
    const block = yearBlock(p.age);
    r.lines.forEach(l => addLine(block, l));
    trimFeed();
    updateHUD();
    LG.Storage.save(p);
    if (r.death) return deathSequence();
    if (r.event) { setTimeout(() => openEvent(r.event), 420 / st.speed); return; }
    schedule(LG.Game.yearDelay(p.age) / st.speed + r.lines.length * 140 / st.speed);
  }

  function yearBlock(age) {
    const feed = $('#feed'), lastEl = feed.lastElementChild;
    if (lastEl && lastEl.dataset.age === String(age)) return lastEl.querySelector('.yr-lines');
    const d = document.createElement('div');
    d.dataset.age = age;
    d.className = 'yr';
    d.innerHTML = `<div class="yr-age">${age}세</div><div class="yr-lines"></div>`;
    $('#feed').appendChild(d);
    return d.querySelector('.yr-lines');
  }

  function addLine(block, l, noScroll) {
    const d = document.createElement('div');
    d.className = 'ln' + (l.major ? ' major' : '') + (l.flavor ? ' flavor' : '') + (l.reflect ? ' reflect' : '') + (l.choice ? ' picked' : '');
    d.innerHTML = `<span class="i">${esc(l.icon || '·')}</span><span>${esc(l.t)}</span>` + (l.res ? `<span class="res ${l.res}">${{ success: '성공', partial: '부분 성공', fail: '실패' }[l.res]}</span>` : '');
    block.appendChild(d);
    if (!noScroll) { const f = $('#feed'); f.scrollTo({ top: f.scrollHeight, behavior: 'smooth' }); }
    else $('#feed').scrollTop = $('#feed').scrollHeight;
  }

  function trimFeed() {
    const f = $('#feed');
    while (f.children.length > 40) f.removeChild(f.firstChild);
  }

  function snapshotHUD() {
    return { money: S.netWorth(p), health: Math.round(p.stats.health), happy: Math.round(p.happy), rel: S.relScore(p) };
  }

  function updateHUD(instant) {
    const age = $('#hud-age');
    if (age.textContent !== String(p.age)) { age.textContent = p.age; age.classList.remove('tick'); void age.offsetWidth; age.classList.add('tick'); }
    $('#hud-name').textContent = p.name;
    $('#hud-year').textContent = `${p.year}년 · ${S.liveRegion(p).short}`;
    const pct = Math.min(100, p.age / 90 * 100);
    $('#life-fill').style.width = pct + '%';
    $('#life-dot').style.left = pct + '%';
    setStage(p.age);
    $('#now-headline').textContent = p.headline || '';
    $('#tag-job').textContent = '💼 ' + S.jobLabel(p);
    $('#tag-home').textContent = '🏠 ' + S.homeLabel(p);
    $('#tag-love').textContent = '❤️ ' + S.relLabel(p);
    const now = snapshotHUD();
    const set = (id, v, k) => {
      const el = $(id);
      el.textContent = k === 'money' ? U.money(v) : v;
      if (!instant && st.last) {
        const d = v - st.last[k];
        const box = el.parentElement;
        if (Math.abs(d) >= (k === 'money' ? 300 : 3)) {
          box.classList.remove('up', 'down'); void box.offsetWidth;
          box.classList.add(d > 0 ? 'up' : 'down');
          setTimeout(() => box.classList.remove('up', 'down'), 700);
        }
      }
    };
    set('#st-money', now.money, 'money');
    set('#st-health', now.health, 'health');
    set('#st-happy', now.happy, 'happy');
    set('#st-rel', now.rel, 'rel');
    st.last = now;
  }

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

  // ───────────────── 이벤트 카드 ─────────────────
  function openEvent(ev) {
    if (!ev) { schedule(); return; }
    clearTimeout(st.timer);
    st.eventOpen = true;
    const layer = $('#event'), card = $('#event-card');
    const opts = LG.Events.preview(p, ev);
    card.innerHTML = `
      <div class="ev-top"><span class="ev-age">${p.age}세 · ${p.year}년</span><span class="ev-kicker">${esc(ev.label || '')}</span></div>
      <div class="ev-icon">${esc(ev.icon || '✨')}</div>
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
    card.scrollTop = 0;
    card.querySelectorAll('.choice').forEach(b => b.addEventListener('click', () => choose(ev, b.dataset.id), { once: true }));
    const why = card.querySelector('.why-toggle');
    if (why) why.addEventListener('click', () => {
      const w = card.querySelector('.why');
      w.classList.toggle('hidden');
      why.textContent = w.classList.contains('hidden') ? '무엇이 영향을 줄까? ▾' : '접기 ▴';
    });
  }

  async function choose(ev, id) {
    const card = $('#event-card');
    card.querySelectorAll('.choice').forEach(b => b.disabled = true);
    if (navigator.vibrate) try { navigator.vibrate(8); } catch (e) { /* 무시 */ }
    const res = LG.Game.choose(p, id);
    LG.Storage.save(p);
    const label = render(p, res.choice.label);
    const fast = st.speed > 1 ? 0.6 : 1;
    card.innerHTML = `<div class="ev-top"><span class="ev-age">${p.age}세</span><span class="ev-kicker">${esc(ev.label || '')}</span></div><div class="seq" id="seq"></div>`;
    const seq = card.querySelector('#seq');
    const step = (html, cls) => { const d = document.createElement('p'); d.className = 'seq-step ' + (cls || ''); d.innerHTML = html; seq.appendChild(d); return d; };
    step(`<b>${esc(label)}</b>`, 'strong');
    await wait(650 * fast);
    if (res.type !== 'done') {
      const w = step(esc(res.steps[1] || '결과를 기다리는 중'), 'dots');
      await wait(1100 * fast);
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

    // 피드에도 기록
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
    st.eventOpen = false;
    trimFeed();
    if (!p.alive) return deathSequence();
    schedule(LG.Game.yearDelay(p.age) / st.speed);
  }

  // ───────────────── 바텀 시트 ─────────────────
  $$('.tab').forEach(t => t.addEventListener('click', () => {
    const tab = t.dataset.tab;
    if (tab === 'life') { closeSheet(); return; }
    openSheet(tab);
  }));
  $$('[data-close]').forEach(el => el.addEventListener('click', closeSheet));

  function setTab(tab) { $$('.tab').forEach(x => x.classList.toggle('active', x.dataset.tab === tab)); }

  function openSheet(tab) {
    if (!p) return;
    clearTimeout(st.timer);
    st.sheetOpen = true;
    setTab(tab);
    const body = $('#sheet-body');
    body.innerHTML = tab === 'people' ? peopleHTML() : tab === 'status' ? statusHTML() : logHTML('key');
    body.scrollTop = 0;
    $('#sheet').classList.remove('hidden');
    $('#sheet .sheet').classList.remove('closing');
    if (tab === 'log') bindLogSeg();
    if (tab === 'status') { const r = body.querySelector('#btn-restart'); if (r) r.onclick = () => { if (confirm('지금 인생을 끝내고 처음 화면으로 돌아갈까요?')) { LG.Storage.clear(); closeSheet(true); clearTimeout(st.timer); p = null; initTitle(); } }; }
  }

  function closeSheet(silent) {
    const layer = $('#sheet');
    if (layer.classList.contains('hidden')) { setTab('life'); return; }
    const sh = layer.querySelector('.sheet');
    sh.classList.add('closing');
    setTimeout(() => { layer.classList.add('hidden'); sh.classList.remove('closing'); }, 220);
    st.sheetOpen = false;
    setTab('life');
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

  function peopleHTML() {
    const ppl = p.people.filter(n => n.age >= 0);
    const group = (title, roles) => {
      const list = ppl.filter(n => roles.indexOf(n.role) >= 0);
      return `<h3 class="sh-sec">${title}</h3>` + (list.length ? list.map(personCard).join('') : '<p class="empty">아직 없음</p>');
    };
    return `<h2 class="sh-title">사람들</h2>` +
      group('사랑', ['spouse', 'partner']) +
      group('가족', ['father', 'mother', 'grandparent', 'sibling']) +
      (ppl.some(n => n.role === 'child') ? group('자녀', ['child']) : '') +
      group('친구', ['friend']) +
      (ppl.some(n => ['ex', 'ex_spouse', 'past_friend'].indexOf(n.role) >= 0) ? group('지나간 인연', ['ex', 'ex_spouse', 'past_friend']) : '');
  }

  function statusHTML() {
    const sr = (label, v, word) => `<div class="stat-row"><div class="top"><span>${label}</span><b>${word}</b></div><div class="meter"><i style="width:${Math.round(v)}%"></i></div></div>`;
    const stt = p.stats;
    const J = S.job(p);
    const reg = LG.DATA.regions[p.region];
    const pc = LG.Birth.prosCons(p);
    const hidden = p.talents.some(t => p.found.indexOf(t) < 0);
    let h = `<h2 class="sh-title">${esc(p.name)}의 상태</h2>`;
    h += `<h3 class="sh-sec">능력</h3><div class="card">` +
      sr('❤️ 건강', stt.health, U.healthWord(stt.health)) + sr('🧠 학습능력', stt.intelligence, U.level(stt.intelligence)) +
      sr('💪 운동능력', stt.physical, U.level(stt.physical)) + sr('🗣️ 사교성', stt.social, U.level(stt.social)) +
      sr('🎨 창의력', stt.creativity, U.level(stt.creativity)) + sr('🧘 정신력', stt.mental, U.level(stt.mental)) +
      sr('😊 행복', p.happy, Math.round(p.happy)) + sr('😣 스트레스', p.stress, Math.round(p.stress)) + `</div>`;
    h += `<h3 class="sh-sec">재능과 성격</h3><div class="card">` +
      `<div class="b-chips" style="margin:0 0 8px">${p.found.map(t => `<span class="chip">${LG.DATA.talents[t].icon} ${esc(LG.DATA.talents[t].name)} 재능</span>`).join('') || '<span class="empty">발견한 재능이 아직 없다</span>'}</div>` +
      (hidden ? `<p class="empty" style="margin:0 0 8px">아직 발견하지 못한 재능이 있을지도…</p>` : '') +
      p.traits.map(t => `<div class="row"><span>${esc(LG.DATA.traits[t].name)}</span><b style="font-weight:500;font-size:14px">${esc(LG.DATA.traits[t].desc)}</b></div>`).join('') + `</div>`;
    h += `<h3 class="sh-sec">일</h3><div class="card">` +
      `<div class="row"><span>현재</span><b>${esc(S.jobLabel(p))}</b></div>` +
      (J ? `<div class="row"><span>경력</span><b>${p.job.years + (p.job.carry || 0)}년</b></div><div class="row"><span>평판</span><b>${U.level(p.job.perf)}</b></div><div class="row"><span>연봉</span><b>${U.money(LG.Economy.salary(p))}원</b></div>` : '') +
      `<div class="row"><span>학력</span><b>${{ none: '미취학', elem: '초등학교', middle: '중학교', high: '고등학교', college: '대학교 졸업', grad: '대학원 졸업' }[p.edu]}${p.college ? ' (재학 중)' : ''}</b></div></div>`;
    h += `<h3 class="sh-sec">돈</h3><div class="card">` +
      `<div class="row"><span>순자산</span><b>${U.money(S.netWorth(p))}원</b></div>` +
      `<div class="row"><span>현금·예금</span><b>${U.money(p.money)}원</b></div>` +
      (p.house ? `<div class="row"><span>${esc(p.house.label)}</span><b>${U.money(p.house.value)}원</b></div>` : '') +
      (p.debt ? `<div class="row"><span>빚</span><b>${U.money(p.debt)}원</b></div>` : '') +
      (p.lastIncome != null && p.age >= 19 ? `<div class="row"><span>지난해 가계 수입</span><b>${U.money(p.lastIncome)}원</b></div><div class="row"><span>지난해 남은 돈</span><b>${U.money(p.lastNet || 0)}원</b></div>` : '') + `</div>`;
    h += `<h3 class="sh-sec">출발점</h3><div class="card">` +
      `<div class="row"><span>출생</span><b>${p.birthYear}년 · ${esc(reg.short)} ${esc(p.town)}</b></div>` +
      `<div class="row"><span>집안 형편</span><b>${LG.Birth.TIER_LABEL[p.family.tier]}</b></div>` +
      `<div class="row"><span>장점</span><b style="font-weight:500;font-size:14px">${pc.pros.map(esc).join(', ')}</b></div>` +
      `<div class="row"><span>단점</span><b style="font-weight:500;font-size:14px">${pc.cons.map(esc).join(', ')}</b></div>` +
      `<div class="row"><span>인생 코드</span><b>${esc(p.seed)}</b></div></div>`;
    h += `<button id="btn-restart" class="danger-link" type="button">이번 인생 포기하고 처음으로</button>`;
    return h;
  }

  function logHTML(mode) {
    const items = p.history.filter(x => mode === 'all' || x.k !== 'minor');
    return `<h2 class="sh-title">인생 기록</h2>
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
    const hl = LG.Timeline.highlights(p, 6);
    const facts = [`💼 ${e.job}`, `💍 배우자 ${e.spouse}`, `👶 자녀 ${e.kids}명`, `📍 ${LG.DATA.regions[p.region].short} 출생`];
    const tl = p.history.filter(h => h.k !== 'minor');
    $('#end-body').innerHTML = `
      <div class="rcard" id="rcard">
        <p class="r-kicker">나의 인생</p>
        <p class="r-name">${esc(p.name)} · ${p.birthYear} – ${p.year}</p>
        <div class="r-age">${p.age}<small>세</small></div>
        <h2 class="r-title">${esc(e.title)}</h2>
        <div class="r-stats">
          ${bar('💰', '자산', s.money, U.money(e.net))}${bar('❤️', '건강', s.health)}
          ${bar('😊', '행복', s.happy)}${bar('🤝', '관계', s.rel)}
          ${bar('🏆', '성취', s.achv)}${bar('🧭', '경험', s.exp)}
        </div>
        <div class="r-facts">${facts.map(f => `<span>${esc(f)}</span>`).join('')}</div>
        <ul class="r-hl">${hl.map(h => `<li><b>${h.a}세</b> ${esc(h.t)}</li>`).join('')}</ul>
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
    const s = e.s;
    const rows = [['💰 자산', s.money, U.money(e.net)], ['❤️ 건강', s.health], ['😊 행복', s.happy], ['🤝 관계', s.rel], ['🏆 성취', s.achv], ['🧭 경험', s.exp]];
    rows.forEach((r, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const bx = L + col * 460, by = 560 + row * 100;
      text(r[0], bx, by, 32, 600, ink2);
      text(String(r[2] || r[1]), bx + 400, by, 34, 800, ink, 'right');
      x.fillStyle = '#e3d8ca'; x.fillRect(bx, by + 20, 400, 10);
      x.fillStyle = ink; x.fillRect(bx, by + 20, 400 * r[1] / 100, 10);
    });
    const hl = LG.Timeline.highlights(p, 6);
    x.fillStyle = '#d9cbb9'; x.fillRect(L, 880, 4, hl.length * 56);
    hl.forEach((h, i) => {
      const y = 915 + i * 56;
      x.fillStyle = ink; x.beginPath(); x.arc(L + 2, y - 10, 8, 0, Math.PI * 2); x.fill();
      text(`${h.a}세`, L + 30, y, 32, 800, ink);
      let t = h.t; x.font = `500 32px ${F}`;
      while (x.measureText(t).width > 760 && t.length > 4) t = t.slice(0, -2);
      if (t !== h.t) t += '…';
      text(t, L + 130, y, 32, 500, '#4a4050');
    });
    text(`"${e.oneLiner}"`, L, 1300, 44, 800, ink);
    text('대한민국 인생게임 · 인생 코드 ' + p.seed, L, 1375, 26, 500, ink2);
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

  // 백그라운드로 가면 멈추기
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearTimeout(st.timer);
    else if (canRun()) schedule(600);
  });

  // 시작
  LG.Events.init();
  initTitle();
  LG.UI = { get p() { return p; }, st };
})(window.LG = window.LG || {});
