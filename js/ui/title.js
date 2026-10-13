/* UI · 타이틀 · 새 인생 · 출생 공개 */
(function (LG) {
  'use strict';
  const K = LG.UIK;
  const { $, $$, esc, wait, render, st } = K;
  const S = LG.State, U = LG.U;
  const enterPlay = (...a) => K.enterPlay(...a);
  const setStage = (...a) => K.setStage(...a);
  const show = (...a) => K.show(...a);

  // ───────────────── 타이틀 ─────────────────
  function initTitle() {
    let p = K.p;
    const saved = LG.Storage.load();
    const btn = $('#btn-continue');
    if (saved && saved.alive) {
      btn.textContent = `이어하기 · ${saved.name}, ${saved.age}세`;
      btn.classList.remove('hidden');
      btn.onclick = () => { p = K.p = saved; LG.Events.init(); enterPlay(true); };
    } else btn.classList.add('hidden');
    const lives = LG.Storage.lives();
    $('#past-lives').textContent = lives.length ? `지금까지 ${lives.length}번의 인생을 살았다` : '';
    // 오늘의 인생 · 도감 요약
    const dex = LG.Storage.dex(), today = LG.Dex.today(), best = dex.daily[today];
    $('#daily-sub').textContent = best ? `오늘 기록 ${best.total}점` : today.slice(5).replace('-', '월 ') + '일';
    const cat = LG.Dex.catalog();
    $('#dex-sub').textContent = `칭호 ${Object.keys(dex.titles).length}/${cat.titles.length}`;
    if (LG.Storage.lastError) { setTimeout(() => K.toast(LG.Storage.lastError), 400); LG.Storage.lastError = null; }
    setStage(0);
    show('scr-title');
  }

  $('#btn-born').addEventListener('click', () => {
    const old = LG.Storage.load();
    if (old && old.alive && !confirm(`저장된 인생(${old.name}, ${old.age}세)이 있어요.\n새로 시작하면 사라집니다. 계속할까요?`)) return;
    startLife(null);   // 성별은 시드에서 정해진다 (같은 인생 코드 = 같은 성별)
  });

  const askOverwrite = () => { const old = LG.Storage.load(); return !(old && old.alive) || confirm(`저장된 인생(${old.name}, ${old.age}세)이 있어요.\n새로 시작하면 사라집니다. 계속할까요?`); };
  // 오늘의 인생: 오늘 날짜로 정해진 같은 출발점에서, 누가 더 잘 살아 내는지 친구와 비교한다
  $('#btn-daily').addEventListener('click', () => { if (askOverwrite()) startLife(null, LG.Dex.dailySeed(), LG.Dex.today()); });
  $('#btn-dex').addEventListener('click', () => K.openSheet('dex'));
  $('#btn-settings').addEventListener('click', () => K.openSheet('settings'));

  function startLife(gender, seed, daily) {
    let p = K.p;
    // 주소의 ?seed= 는 '처음 한 판'에만 쓴다 — 공유 링크로 들어온 사람이 다시 태어날 때마다 같은 인생이 나오지 않게
    if (!seed) {
      const urlSeed = new URLSearchParams(location.search).get('seed');
      if (urlSeed) { seed = urlSeed; try { history.replaceState(history.state, '', location.pathname + location.hash); } catch (e) { /* 무시 */ } }
    }
    seed = seed || undefined;
    p = K.p = LG.Game.newLife(gender, seed, daily);
    LG.Storage.save(p);
    birthReveal();
  }

  // ───────────────── 출생 공개 ─────────────────
  async function birthReveal() {
    let p = K.p;
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
    line('🏠', `${esc(p.family.home)} · 형편 <b>${LG.Birth.tierLabel(p)}</b>`);
    await wait(420);
    LG.Rel.parents(p).forEach(n => {
      const ic = n.role === 'father' ? '👨' : n.role === 'mother' ? '👩' : '🧓';
      const label = n.role === 'grandparent' ? (n.gender === 'M' ? '할아버지' : '할머니') : LG.Rel.ROLE_LABEL[n.role];
      line(ic, `${label} ${n.age}세 · <b>${esc(LG.DATA.jobs[n.job] ? LG.DATA.jobs[n.job].name : '무직')}</b> · ${esc(n.personality)}`);
    });
    if (p.family.tags.indexOf('single_parent') >= 0) line('🫂', '한 부모 가정에서 자란다');
    if (p.daily) line('📅', `<b>오늘의 인생</b> · ${esc(p.daily)} · 오늘 이 출발점은 모두에게 같다`);
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

  Object.assign(K, { initTitle, startLife, birthReveal, askOverwrite });
})(window.LG = window.LG || {});
