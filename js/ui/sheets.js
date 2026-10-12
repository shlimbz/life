/* UI · 바텀 시트: 사람 · 기록 · 자산 · 삶의 방식 · 메뉴 */
(function (LG) {
  'use strict';
  const K = LG.UIK;
  const { $, $$, esc, wait, render, st } = K;
  const S = LG.State, U = LG.U;
  const canRun = (...a) => K.canRun(...a);
  const initTitle = (...a) => K.initTitle(...a);
  const saveNow = (...a) => K.saveNow(...a);
  const schedule = (...a) => K.schedule(...a);
  const toast = (...a) => K.toast(...a);
  const updateHUD = (...a) => K.updateHUD(...a);

  // ───────────────── 바텀 시트 (사람 · 기록 · 자산 · 메뉴) ─────────────────
  $('#sheet').addEventListener('click', e => { if (e.target.closest('[data-close]')) closeSheet(); });

  // 도감·설정은 인생이 없어도(타이틀에서도) 열 수 있다
  const NO_LIFE = ['dex', 'settings'];
  function openSheet(tab) {
    let p = K.p;
    if (!p && NO_LIFE.indexOf(tab) < 0) return;
    clearTimeout(st.timer);
    st.sheetOpen = true;
    const body = $('#sheet-body');
    body.innerHTML = tab === 'dex' ? dexHTML() : tab === 'settings' ? `<h2 class="sh-title">설정${closeBtn}</h2>` + settingsBlock() : tab === 'people' ? peopleHTML() : tab === 'asset' ? assetHTML() : tab === 'style' ? styleHTML() : tab === 'menu' ? menuHTML() : logHTML('key');
    if (tab === 'settings') bindSettings();
    if (tab === 'dex') bindDex();
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
    if (K.p && document.body.dataset.screen === 'scr-play') updateHUD(true);
    if (silent !== true && canRun()) schedule(500);
  }

  const AVATAR = { father: '👨', mother: '👩', grandparent: '🧓', sibling: '🧒', friend: '🙂', partner: '💗', spouse: '💍', child: '👶', ex: '💭', ex_spouse: '💔', past_friend: '🍂' };
  function personCard(n) {
    let p = K.p;
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
    let p = K.p;
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
    let p = K.p;
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
    let p = K.p;
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
    let p = K.p;
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
    let p = K.p;
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
    let p = K.p;
    const stt = p.stats;
    const reg = LG.DATA.regions[p.region];
    const pc = LG.Birth.prosCons(p);
    const aff = LG.Aff.top(p, 4);
    const J = S.job(p);
    let h = `<h2 class="sh-title">${esc(p.name)}의 이야기${closeBtn}</h2>`;
    h += `<h3 class="sh-sec">내가 걸어온 길</h3><div class="card"><div class="b-chips" style="margin:0 0 6px">${aff.length ? aff.map(k => `<span class="chip">${LG.Aff.DOMAINS[k].icon} ${LG.Aff.DOMAINS[k].name}</span>`).join('') : '<span class="empty">아직 뚜렷한 방향이 없다</span>'}</div>
      <p class="as-note" style="margin:0">출생 환경과 재능, 지금까지의 선택이 쌓여 앞으로 찾아올 갈림길에 영향을 줍니다.</p></div>`;
    h += `<h3 class="sh-sec">재능과 성격</h3><div class="card">` +
      `<div class="b-chips" style="margin:0 0 8px">${p.found.map(t => `<span class="chip">${LG.DATA.talents[t].icon} ${esc(LG.DATA.talents[t].name)} ${LG.State.gradeName(p, t) === '범재' ? '재능' : LG.State.gradeName(p, t)}</span>`).join('') || '<span class="empty">발견한 재능이 아직 없다</span>'}</div>` +
      p.traits.map(t => `<div class="row"><span>${esc(LG.DATA.traits[t].name)}</span><b style="font-weight:500;font-size:14px">${esc(LG.DATA.traits[t].desc)}</b></div>`).join('') + `</div>`;
    h += `<h3 class="sh-sec">일과 학력</h3><div class="card">` +
      `<div class="row"><span>현재</span><b>${esc(S.jobLabel(p))}</b></div>` +
      (J ? `<div class="row"><span>경력</span><b>${p.job.years + (p.job.carry || 0)}년</b></div><div class="row"><span>평판</span><b>${U.level(p.job.perf)}</b></div><div class="row"><span>연봉</span><b>${U.money(LG.Economy.salary(p))}원</b></div>` : '') +
      `<div class="row"><span>학력</span><b>${esc(S.eduLabel(p))}</b></div></div>`;
    h += `<h3 class="sh-sec">출발점</h3><div class="card">` +
      `<div class="row"><span>출생</span><b>${p.birthYear}년 · ${esc(reg.short)} ${esc(p.town)}</b></div>` +
      `<div class="row"><span>집안 형편</span><b>${LG.Birth.tierLabel(p)}</b></div>` +
      `<div class="row"><span>장점</span><b style="font-weight:500;font-size:14px">${pc.pros.map(esc).join(', ')}</b></div>` +
      `<div class="row"><span>단점</span><b style="font-weight:500;font-size:14px">${pc.cons.map(esc).join(', ')}</b></div>` +
      `<div class="row"><span>인생 코드</span><b>${esc(p.seed)}</b></div></div>`;
    h += `<h3 class="sh-sec">설정</h3>` + settingsBlock(true);
    h += `<p class="as-note">진행 상황은 자동 저장됩니다. 실수로 뒤로가기를 눌러도, 앱을 닫았다 다시 열어도 이어서 할 수 있어요.</p>`;
    h += `<button id="btn-restart" class="danger-link" type="button">이번 인생 포기하고 처음으로</button>`;
    return h;
  }
  function bindMenu() {
    let p = K.p;
    bindSettings();
    const r = $('#sheet-body #btn-restart');
    if (r) r.onclick = () => {
      if (confirm('지금 인생을 끝내고 처음 화면으로 돌아갈까요?\n(저장된 진행이 사라집니다)')) {
        LG.Storage.clear(); closeSheet(true); clearTimeout(st.timer); p = K.p = null; initTitle();
      }
    };
  }

  // ───── 설정: 진행 속도 · 글자 크기 · 확률 표시 · 영향 요인 · 중요한 선택 확인 ─────
  const SEG = (key, label, sub, opts, cur) => `<div class="card set-row"><div class="set-lbl"><b>${label}</b>${sub ? `<small>${sub}</small>` : ''}</div>
    <div class="seg set-seg" data-pref="${key}">${opts.map(o => `<button type="button" data-v="${o[0]}" class="${String(cur) === String(o[0]) ? 'on' : ''}">${o[1]}</button>`).join('')}</div></div>`;
  function settingsBlock(inMenu) {
    const pr = LG.Storage.prefs();
    return SEG('speed', '진행 속도', '자동으로 흐르는 시간의 빠르기', [[1, '1×'], [2, '2×'], [3, '3×'], [4, '4×']], pr.speed || 1) +
      SEG('fs', '글자 크기', '이야기와 선택지 글자', [['m', '보통'], ['l', '크게'], ['xl', '아주 크게']], pr.fs || 'm') +
      SEG('prob', '성공 확률 표시', '선택지 옆의 가능성 표시', [['on', '보기'], ['off', '숨기기']], pr.prob === false ? 'off' : 'on') +
      SEG('why', '영향 요인(확률 근거)', '무엇이 결과에 영향을 주는지', [['tap', '눌러서 보기'], ['open', '항상 펼침'], ['off', '숨기기']], pr.why || 'tap') +
      `<label class="card toggle-row"><span>중요한 선택은 한 번 더 확인<small>실수로 눌러 인생이 정해지는 일을 줄여 줍니다</small></span><input type="checkbox" id="pref-confirm" ${pr.confirm !== false ? 'checked' : ''}></label>` +
      (inMenu ? '' : `<p class="as-note">설정은 이 기기에 저장되고, 모든 인생에 똑같이 적용됩니다.</p>`);
  }
  function bindSettings() {
    $$('#sheet-body .set-seg').forEach(seg => seg.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      const k = seg.dataset.pref; let v = b.dataset.v;
      if (k === 'speed') { v = +v; st.speed = v; if (K.updateCtrl) K.updateCtrl(); }
      if (k === 'prob') v = v === 'on';
      LG.Storage.setPref(k, v);
      seg.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
      K.applyPrefs();
    })));
    const pc = $('#sheet-body #pref-confirm');
    if (pc) pc.onchange = () => { LG.Storage.setPref('confirm', pc.checked); toast(pc.checked ? '중요한 선택은 한 번 더 확인합니다' : '확인 없이 바로 선택합니다'); };
  }

  // ───── 인생 도감 ─────
  function dexHTML(tab) {
    tab = tab || 'title';
    const d = LG.Storage.dex(), cat = LG.Dex.catalog();
    const cnt = (obj, list) => list.filter(x => obj[x]).length;
    const tabs = [['title', '엔딩 칭호', cnt(d.titles, cat.titles), cat.titles.length], ['ach', '업적', cat.ach.filter(a => d.ach[a.k]).length, cat.ach.length], ['liner', '한 줄 평', cnt(d.liners, cat.liners), cat.liners.length], ['job', '직업', cnt(d.jobs, cat.jobs), cat.jobs.length]];
    let body = '';
    if (tab === 'ach') body = `<div class="dex-grid">${cat.ach.map(a => { const n = d.ach[a.k]; return `<div class="dex-a ${n ? 'got' : ''}"><span class="di">${n ? a.icon : '🔒'}</span><b>${esc(a.name)}</b><small>${esc(a.desc)}</small>${n ? `<em>${n}회</em>` : ''}</div>`; }).join('')}</div>`;
    else {
      const list = tab === 'title' ? cat.titles : tab === 'liner' ? cat.liners : cat.jobs, obj = tab === 'title' ? d.titles : tab === 'liner' ? d.liners : d.jobs;
      body = `<div class="dex-list">${list.map(x => obj[x] ? `<div class="dex-i got"><span>${esc(x)}</span><em>${obj[x]}회</em></div>` : `<div class="dex-i"><span>？？？</span></div>`).join('')}</div>`;
    }
    const days = Object.keys(d.daily || {}).sort().reverse().slice(0, 7);
    return `<h2 class="sh-title">인생 도감${closeBtn}</h2>
      <p class="as-note" style="margin-top:0">지금까지 ${d.lives || 0}번의 인생을 끝까지 살았다.</p>
      <div class="seg dex-tabs">${tabs.map(t => `<button type="button" data-tab="${t[0]}" class="${t[0] === tab ? 'on' : ''}">${t[1]} <small>${t[2]}/${t[3]}</small></button>`).join('')}</div>
      ${body}
      ${days.length ? `<h3 class="sh-sec">오늘의 인생 기록</h3><div class="card">${days.map(k => `<div class="row"><span>${k}</span><b>${d.daily[k].total}점 · ${esc(d.daily[k].title)}</b></div>`).join('')}</div>` : ''}`;
  }
  function bindDex() {
    $$('#sheet-body .dex-tabs button').forEach(b => b.addEventListener('click', () => { $('#sheet-body').innerHTML = dexHTML(b.dataset.tab); bindDex(); }));
  }

  function logHTML(mode) {
    let p = K.p;
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

  Object.assign(K, { settingsBlock, bindSettings, dexHTML, bindDex, openSheet, closeSheet, personCard, relWord, peopleHTML, assetHTML, bindAsset, fxChips, styleHTML, bindStyle, menuHTML, bindMenu, logHTML, bindLogSeg, AVATAR, closeBtn });
})(window.LG = window.LG || {});
