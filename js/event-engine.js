/* EventSystem + ChoiceSystem
   시간 경과 → 조건 필터 → 가중치 → 이벤트 발생 → (선택) → 확률 → RNG → 결과 → 기록 */
(function (LG) {
  'use strict';
  const U = () => LG.U, S = () => LG.State, R = () => LG.RNG;
  let byId = null;

  function init() {
    byId = {};
    (LG.DATA.events || []).forEach(e => {
      if (byId[e.id]) console.warn('중복 이벤트 id:', e.id);
      byId[e.id] = e;
    });
    return byId;
  }
  function get(id) { if (!byId) init(); return byId[id]; }
  function all() { if (!byId) init(); return LG.DATA.events; }

  // 나이대별 선택 이벤트 발생 확률 (20~30대가 가장 바쁘다)
  function choiceRate(age) {
    if (age < 6) return 0;
    if (age < 13) return 0.22;
    if (age < 19) return 0.36;
    if (age < 35) return 0.5;
    if (age < 50) return 0.38;
    if (age < 65) return 0.28;
    return 0.22;
  }

  function weight(p, ev) { return typeof ev.w === 'function' ? ev.w(p) : (ev.w != null ? ev.w : 10); }

  function eligible(p, ev, fromQueue) {
    if (!fromQueue) {
      if (ev.ages && (p.age < ev.ages[0] || p.age > ev.ages[1])) return false;
      if (ev.queued) return false; // 예약으로만 발생하는 이벤트
      if (p.done[ev.id] && !ev.cd) return false;
      if (ev.cd && p.cool[ev.id] && p.cool[ev.id] > p.age) return false;
      if (ev.max && (p.done[ev.id] || 0) >= ev.max) return false;
    }
    if (ev.if && !ev.if(p)) return false;
    if (ev.tier !== 'auto' && !visibleChoices(p, ev).length) return false;
    return true;
  }

  function visibleChoices(p, ev) { return (ev.choices || []).filter(c => !c.if || c.if(p)); }

  // 1년 동안 일어날 일 고르기
  function pickYear(p) {
    const lines = [];
    let choiceEv = null;

    // 1. 예약된 이벤트 (과거 선택의 결과)
    const due = p.queue.filter(q => q.at <= p.age);
    p.queue = p.queue.filter(q => q.at > p.age);
    due.forEach(q => {
      const ev = get(q.id);
      if (!ev || !eligible(p, ev, true)) return;
      if (ev.tier === 'auto') { const l = runAuto(p, ev); if (l) lines.push(l); }
      else if (!choiceEv) choiceEv = ev;
      else p.queue.push({ id: q.id, at: p.age + 1 });
    });

    if (!choiceEv) choiceEv = nextChained(p);

    // 2. 마일스톤 (인생의 정해진 갈림길)
    if (!choiceEv) {
      const ms = all().filter(e => e.milestone && eligible(p, e)).sort((a, b) => (b.prio || 0) - (a.prio || 0));
      if (ms.length) choiceEv = ms[0];
    }

    // 3. 확률적 선택 이벤트
    if (!choiceEv && R().chance(p, choiceRate(p.age))) {
      const pool = all().filter(e => e.tier !== 'auto' && !e.milestone && eligible(p, e));
      choiceEv = R().weighted(p, pool, e => weight(p, e));
    }

    // 4. 자동 이벤트 (선택 없이 지나가는 일들)
    if (p.age >= 1 && R().chance(p, choiceEv ? 0.22 : 0.42)) {
      const pool = all().filter(e => e.tier === 'auto' && eligible(p, e));
      const ev = R().weighted(p, pool, e => weight(p, e));
      if (ev) { const l = runAuto(p, ev); if (l) lines.push(l); }
    }
    return { event: choiceEv, lines };
  }

  // 같은 해에 이어지는 예약 이벤트 (예: 합격 → 전공 선택)
  function nextChained(p) {
    const i = p.queue.findIndex(q => q.at <= p.age && q.chain);
    if (i < 0) return null;
    const q = p.queue.splice(i, 1)[0];
    const ev = get(q.id);
    return ev && eligible(p, ev, true) ? ev : nextChained(p);
  }

  function render(p, t) {
    if (typeof t === 'function') t = t(p);
    if (!t) return '';
    const name = role => { const n = LG.Rel.get(p, role); return n ? n.name.slice(1) : ''; };
    const friend = LG.Rel.all(p, 'friend')[0];
    const child = LG.Rel.all(p, 'child')[0];
    const parent = LG.Rel.get(p, 'mother') || LG.Rel.get(p, 'father') || LG.Rel.get(p, 'grandparent');
    const sib = LG.Rel.get(p, 'sibling');
    return LG.U.fixJosa(t.replace(/\{(\w+)\}/g, (m, k) => {
      switch (k) {
        case 'name': return p.given;
        case 'partner': return name('partner') || '그 사람';
        case 'spouse': return name('spouse') || '배우자';
        case 'friend': return friend ? friend.name.slice(1) : '친구';
        case 'child': return child ? child.name.slice(1) : '아이';
        case 'sibling': return sib ? sib.name.slice(1) : '형제';
        case 'parent': return parent ? (parent.role === 'mother' ? '어머니' : parent.role === 'father' ? '아버지' : '할머니') : '부모님';
        case 'job': return S().jobLabel(p);
        case 'region': return S().liveRegion(p).short;
        case 'town': return p.town;
        default: return m;
      }
    }));
  }

  function preview(p, ev) {
    return visibleChoices(p, ev).map(c => ({
      c, prob: c.check ? LG.Prob.compute(p, c.check, c.intent, !!(c.out && c.out.partial)) : null
    }));
  }

  function resolve(p, ev, choiceId) {
    const c = visibleChoices(p, ev).find(x => x.id === choiceId) || (ev.choices || []).find(x => x.id === choiceId);
    const before = LG.Outcome.snapshot(p);
    S().intent(p, c.intent);
    p.choices++;
    let prob = null, type = 'done', out;
    if (c.check) {
      prob = LG.Prob.compute(p, c.check, c.intent, !!c.out.partial);
      type = LG.Prob.roll(p, prob);
      out = c.out[type] || c.out.fail;
      p.outcomes[type]++;
    } else out = c.out || {};
    const extra = LG.Outcome.apply(p, out, { ev, choice: c, type });
    const text = render(p, out.t);
    const log = render(p, out.log) || (render(p, ev.title) + ': ' + render(p, c.label) + (type === 'fail' ? ' (실패)' : type === 'partial' ? ' (절반의 성공)' : ''));
    LG.Timeline.add(p, log, out.minor ? 'minor' : 'choice', ev.icon || '', !!out.log);
    p.done[ev.id] = (p.done[ev.id] || 0) + 1;
    if (ev.cd) p.cool[ev.id] = p.age + ev.cd;
    if (out.next) p.queue.unshift({ id: out.next, at: p.age, chain: true });
    const after = LG.Outcome.snapshot(p);
    const fx = prob ? prob.factors : [];
    return {
      ev, choice: c, type, prob,
      text: (text + (extra ? ' ' + extra : '')).trim(),
      deltas: LG.Outcome.diff(before, after),
      help: fx.filter(x => x.v > 0).slice(0, 3).map(x => x.label),
      hurt: fx.filter(x => x.v < 0).slice(0, 3).map(x => x.label),
      steps: c.steps || [`'${c.label}'`, ev.wait || '결과를 기다리는 중']
    };
  }

  function runAuto(p, ev) {
    let out = ev.auto || {};
    if (ev.check) {
      const prob = LG.Prob.compute(p, ev.check, ev.intent, !!ev.out.partial);
      const type = LG.Prob.roll(p, prob);
      out = ev.out[type] || ev.out.fail;
    }
    if (out.skip) return null;
    const extra = LG.Outcome.apply(p, out, { ev });
    const text = render(p, out.t);
    if (out.next) p.queue.unshift({ id: out.next, at: p.age, chain: true });
    p.done[ev.id] = (p.done[ev.id] || 0) + 1;
    if (ev.cd) p.cool[ev.id] = p.age + ev.cd;
    const full = (text + (extra ? ' ' + extra : '')).trim();
    const major = !!(out.major || ev.major);
    LG.Timeline.add(p, render(p, out.log) || full, major ? 'major' : 'minor', ev.icon || '');
    return { t: full, icon: ev.icon || '•', major, logged: true };
  }

  function flavor(p) {
    const list = (LG.DATA.flavor || []).filter(f => p.age >= f.a[0] && p.age <= f.a[1] && (!f.if || f.if(p)));
    if (!list.length) return null;
    p.recent = p.recent || [];
    let pick = null;
    for (let i = 0; i < 4 && !pick; i++) {
      const c = R().pick(p, list);
      if (p.recent.indexOf(c.t) < 0) pick = c;
    }
    pick = pick || R().pick(p, list);
    p.recent.push(pick.t); if (p.recent.length > 14) p.recent.shift();
    return { t: render(p, pick.t), icon: pick.i || '·', flavor: true };
  }

  LG.Events = { init, get, all, eligible, pickYear, nextChained, preview, resolve, runAuto, render, flavor, visibleChoices, choiceRate };
})(window.LG = window.LG || {});
