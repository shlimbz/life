/* UI · 이벤트 카드: 선택 · 두 번 눌러 확정 · 결과 연출 */
(function (LG) {
  'use strict';
  const K = LG.UIK;
  const { $, $$, esc, wait, render, st } = K;
  const S = LG.State, U = LG.U;
  const addLine = (...a) => K.addLine(...a);
  const deathSequence = (...a) => K.deathSequence(...a);
  const saveNow = (...a) => K.saveNow(...a);
  const schedule = (...a) => K.schedule(...a);
  const trimFeed = (...a) => K.trimFeed(...a);
  const updateHUD = (...a) => K.updateHUD(...a);
  const yearBlock = (...a) => K.yearBlock(...a);

  // ───────────────── 이벤트 카드 (화면을 가리지 않는다) ─────────────────
  function openEvent(ev) {
    let p = K.p;
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
    if (why && LG.Storage.prefs().why === 'open') { card.querySelector('.why').classList.remove('hidden'); why.textContent = '접기 ▴'; }
    if (why) why.addEventListener('click', () => {
      const w = card.querySelector('.why');
      w.classList.toggle('hidden');
      why.textContent = w.classList.contains('hidden') ? '무엇이 영향을 줄까? ▾' : '접기 ▴';
      card.scrollTop = card.scrollHeight;
    });
    const f = $('#feed'); f.scrollTop = f.scrollHeight;
  }

  async function choose(ev, id) {
    let p = K.p;
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
    let p = K.p;
    $('#event').classList.add('hidden');
    $('#stage').classList.remove('has-event');
    st.eventOpen = false;
    trimFeed();
    saveNow();
    if (!p.alive) return deathSequence();
    schedule(LG.Game.yearDelay(p.age) / st.speed);
  }

  Object.assign(K, { openEvent, choose, closeEvent });
})(window.LG = window.LG || {});
