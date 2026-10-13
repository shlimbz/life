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
  // 목표: 한 판에 선택 25~32회 (마일스톤·예약 이벤트 포함). 20~30대가 가장 바쁘고, 노년에도 그 시기만의 선택이 이어진다.
  function choiceRate(age) {
    if (age < 6) return 0;
    if (age < 13) return 0.12;
    if (age < 19) return 0.2;
    if (age < 35) return 0.16;
    if (age < 50) return 0.14;   // 30~50대는 내 집 마련·대출 같은 정해진 갈림길이 많아 무작위 선택은 조금 줄인다
    if (age < 65) return 0.15;
    if (age < 85) return 0.17;
    return 0.17;
  }

  function baseWeight(p, ev) { return typeof ev.w === 'function' ? ev.w(p) : (ev.w != null ? ev.w : 10); }

  // 같은 분야 이야기가 연달아 나오지 않도록: 최근에 나온 분류일수록 가중치를 깎는다
  function recency(p, ev) {
    const last = p.catLast && p.catLast[ev.cat];
    if (last == null) return 1;
    const d = p.age - last, strong = ev.cat === 'relationship' || ev.cat === 'friend';
    if (d <= 1) return strong ? 0.05 : 0.12;
    if (d <= 3) return strong ? 0.2 : 0.4;
    if (d <= 6) return strong ? 0.55 : 0.85;
    return 1;
  }
  // 내 출생 환경·재능·과거 선택과 이어진 이벤트(dom 태그)는 더 자주 찾아온다
  // 시련 이벤트의 환경 가중치 — 어릴 땐 '자란 집'(형편·불화·보호자), 어른이 되면 '지금의 살림'(자산·실직)이 위험을 좌우한다.
  // ev.risk(0~1)가 그 환경 영향의 세기. 가난·불화 → 최대 약 2.4배, 부유·화목 → 최소 약 0.35배.
  function riskMult(p, ev) {
    if (!ev.risk) return 1;
    const tags = p.family.tags;
    let fam = ({ 1: 2.0, 2: 1.45, 3: 1, 4: 0.62, 5: 0.4 }[p.family.tier] || 1) * (p.family.ext < 0 ? 1.25 : p.family.ext > 0 ? 0.7 : 1);
    const conflict = tags.indexOf('conflict') >= 0 || tags.indexOf('divorced_parents') >= 0 || p.flags.parents_divorced;
    if (conflict) fam *= 1.35;
    else if (tags.indexOf('single_parent') >= 0) fam *= 1.15;
    else if (tags.indexOf('busy_parents') < 0) fam *= 0.88;   // 화목하고 보살펴 주는 집
    const nw = LG.State.netWorth(p);
    let eco = nw < 300 ? 1.8 : nw < 3000 ? 1.3 : nw < 15000 ? 1 : nw < 50000 ? 0.65 : 0.45;
    if (p.status === 'seeking') eco *= 1.2;
    const wf = p.age < 17 ? 1 : Math.max(0, 1 - (p.age - 17) / 15);
    const raw = Math.pow(fam, wf) * Math.pow(eco, 1 - wf);
    return Math.max(0.3, 1 + (raw - 1) * ev.risk);
  }
  // 사랑·가족을 자주 골라 온 사람에게는 인연과 가족 이야기가 더 자주 찾아온다
  function bondMult(p, ev) {
    if (['relationship', 'marriage', 'child'].indexOf(ev.cat) < 0 || !LG.DATA.lift) return 1;
    const l = (LG.DATA.lift(p, 'family') + LG.DATA.lift(p, 'love')) / 2;
    return U().clamp(0.75 + l * 0.45, 0.75, 2.2);
  }
  function weight(p, ev) { return baseWeight(p, ev) * LG.Aff.mult(p, ev.dom) * recency(p, ev) * riskMult(p, ev) * bondMult(p, ev); }

  const MIL_OK = ['health', 'money', 'friend', 'relationship', 'hardship', 'crisis', 'family', 'marriage', 'echo'];
  function eligible(p, ev, fromQueue) {
    if (!fromQueue) {
      if (ev.ages && (p.age < ev.ages[0] || p.age > ev.ages[1])) return false;
      if (ev.queued) return false; // 예약으로만 발생하는 이벤트
      if (p.done[ev.id] && !ev.cd) return false;
      if (ev.cd && p.cool[ev.id] && p.cool[ev.id] > p.age) return false;
      if (ev.max && (p.done[ev.id] || 0) >= ev.max) return false;
    }
    // 군 복무 중에는 부대 밖의 일(진로·창업·대회·해외 등)은 일어나지 않는다
    if (p.status === 'military' && !fromQueue && !ev.mil && MIL_OK.indexOf(ev.cat) < 0) return false;
    if (ev.if && !ev.if(p)) return false;
    if (ev.tier !== 'auto' && !visibleChoices(p, ev).length) return false;
    return true;
  }

  // 선택지: 조건에 맞는 것만. ev.maxShow 가 있으면 '지금의 나'와 가장 가까운 것(rank)을 우선해 그 수만큼만 보여 준다.
  function visibleChoices(p, ev) {
    const list = (ev.choices || []).filter(c => !c.if || c.if(p));
    if (!ev.maxShow || list.length <= ev.maxShow) return list;
    const scored = list.map((c, i) => ({ c, i, r: c.must ? 999 : (typeof c.rank === 'function' ? c.rank(p) : (c.rank != null ? c.rank : 40)) }));
    const keep = scored.slice().sort((a, b) => b.r - a.r || a.i - b.i).slice(0, ev.maxShow).map(x => x.i).sort((a, b) => a - b);
    return keep.map(i => list[i]);
  }

  // 마일스톤: 항상(true) 또는 조건부(함수) — 조건이 맞을 때만 '정해진 갈림길'로 취급한다
  const isMs = (p, e) => typeof e.milestone === 'function' ? !!e.milestone(p) : !!e.milestone;

  // 1년 동안 일어날 일 고르기
  function pickYear(p) {
    const lines = [];
    let choiceEv = null;

    // 1. 예약된 이벤트 (과거 선택의 결과)
    const due = p.queue.filter(q => q.at <= p.age);
    p.queue = p.queue.filter(q => q.at > p.age);
    // 'soft' 예약 이벤트(빚 독촉처럼 해마다 다시 올 수 있는 것)는 그해의 정해진 갈림길(구직·입시·결혼 등)에 자리를 양보한다
    const msNow = () => all().some(e => isMs(p, e) && eligible(p, e));
    due.forEach(q => {
      const ev = get(q.id);
      if (!ev || !eligible(p, ev, true)) return;
      if (ev.tier === 'auto') { const l = runAuto(p, ev); if (l) lines.push(l); }
      else if (!choiceEv && ev.soft && (q.deferred || 0) < 2 && msNow()) p.queue.push({ id: q.id, at: p.age + 1, deferred: (q.deferred || 0) + 1 });
      else if (!choiceEv) choiceEv = ev;
      else if (!ev.soft) p.queue.push({ id: q.id, at: p.age + 1 });
    });

    if (!choiceEv) choiceEv = nextChained(p);

    // 2. 마일스톤 (인생의 정해진 갈림길)
    if (!choiceEv) {
      const ms = all().filter(e => isMs(p, e) && eligible(p, e)).sort((a, b) => (b.prio || 0) - (a.prio || 0));
      if (ms.length) choiceEv = ms[0];
    }

    // 3. 확률적 선택 이벤트
    if (!choiceEv && R().chance(p, choiceRate(p.age))) {
      const pool = all().filter(e => e.tier !== 'auto' && !isMs(p, e) && eligible(p, e));
      choiceEv = R().weighted(p, pool, e => weight(p, e));
    }

    // 4. 자동 이벤트 (선택 없이 지나가는 일들) — 한 해에 두 건까지
    if (p.age >= 1) {
      const tries = [choiceEv ? 0.2 : 0.42, 0.14];
      tries.forEach(pr => {
        if (!R().chance(p, pr)) return;
        // 이번 해의 선택 이벤트와 같은 분야의 자동 사건은 겹치지 않게 (예: 부모님 다툼 선택 + 자동 이혼)
        const pool = all().filter(e => e.tier === 'auto' && !e.rate && eligible(p, e) && !(choiceEv && e.cat === choiceEv.cat));
        const ev = R().weighted(p, pool, e => weight(p, e));
        if (ev) { const l = runAuto(p, ev); if (l) lines.push(l); }
      });
    }
    // 5. 해마다 '낮은 확률'로 직접 굴리는 사건 (rate: 연 확률) — 다른 자동 이벤트의 풀 크기에 영향받지 않는다
    if (p.age >= 1) {
      all().filter(e => e.tier === 'auto' && e.rate && eligible(p, e)).forEach(e => {
        const r = (typeof e.rate === 'function' ? e.rate(p) : e.rate) * riskMult(p, e);
        if (r > 0 && R().chance(p, r)) { const l = runAuto(p, e); if (l) lines.push(l); }
      });
    }
    // 자동 사건이 바로 이어지는 선택을 만들었으면(예: 로또 당첨 → 돈을 어떻게 할까) 같은 해에 띄운다
    if (!choiceEv) choiceEv = nextChained(p);
    // 자동 사건 때문에 선택 이벤트의 전제가 깨졌으면(예: 부모님이 이미 이혼) 이번 해에는 띄우지 않는다
    if (choiceEv && !eligible(p, choiceEv, true)) choiceEv = null;
    if (choiceEv) bindCtx(p, choiceEv);
    return { event: choiceEv, lines };
  }

  // 이벤트가 열릴 때 등장인물을 고정한다: 선택 결과로 결혼·이별해도 같은 이름이 쓰이고,
  // 자녀가 여럿이면 이 이벤트가 다루는 바로 그 아이({child}), 특정 인물은 {who} 로 가리킨다.
  function bindCtx(p, ev) {
    const nm = role => { const n = LG.Rel.get(p, role); return n ? n.name.slice(1) : ''; };
    const kid = typeof ev.child === 'function' ? ev.child(p) : null;
    const who = typeof ev.who === 'function' ? ev.who(p) : null;
    p.ctx = { ev: ev.id, partner: nm('partner'), spouse: nm('spouse'), child: kid ? kid.id : null, who: who ? who.id : null };
    // 제목·선택지 문구도 연 순간의 모습으로 고정한다 (예: "둘째를 갖는다"를 고른 뒤 아이가 태어나도 "셋째"로 바뀌지 않게)
    try {
      p.ctx.title = render(p, ev.title);
      p.ctx.labels = {};
      (ev.choices || []).forEach(c => { p.ctx.labels[c.id] = render(p, c.label); });
    } catch (e) { /* 문구 계산 실패 시 나중에 다시 그린다 */ }
  }
  const titleOf = (p, ev) => (p.ctx && p.ctx.ev === ev.id && p.ctx.title) || render(p, ev.title);
  const labelOf = (p, ev, c) => (p.ctx && p.ctx.ev === ev.id && p.ctx.labels && p.ctx.labels[c.id]) || render(p, c.label);

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
    const ctx = p.ctx || {};
    const byId = id => id != null ? p.people.find(n => n.id === id) : null;
    const bound = byId(ctx.child);
    const child = (bound && bound.alive ? bound : null) || LG.Rel.all(p, 'child')[0];
    const who = byId(ctx.who);
    const parent = LG.Rel.get(p, 'mother') || LG.Rel.get(p, 'father') || LG.Rel.get(p, 'grandparent');
    const sib = LG.Rel.get(p, 'sibling');
    // 이름 뒤에 바로 붙은 조사(와/과 · 을/를 · 은/는)는 받침에 맞게 고친다 → "주원와" 대신 "주원과"
    const MARK = '\u0001', END = '\u0002';
    const filled = t.replace(/\{(\w+)\}/g, (m, k) => { const v = fill(k); return v === m ? m : MARK + v + END; });
    const PAIR = { 와: ['과', '와'], 과: ['과', '와'], 을: ['을', '를'], 를: ['을', '를'], 은: ['은', '는'], 는: ['은', '는'], 이: ['이', '가'], 가: ['이', '가'] };
    const fixed = filled.replace(/\u0001([^\u0002]*)\u0002(와|과|을|를|은|는|이|가)?(?=[\s,.!?"'’”)…]|$)/g, (m, v, j) => {
      if (!j) return v;
      const ch = v.charCodeAt(v.length - 1) - 0xAC00;
      const has = ch >= 0 && ch <= 11171 && ch % 28 !== 0;
      return v + PAIR[j][has ? 0 : 1];
    }).replace(/[\u0001\u0002]/g, '');
    return LG.U.fixJosa(fixed);
    function fill(k) {
      switch (k) {
        case 'name': return p.given;
        case 'partner': return name('partner') || ctx.partner || '그 사람';
        case 'spouse': return name('spouse') || ctx.spouse || '배우자';
        case 'who': return who ? who.name.slice(1) : '그 사람';
        case 'friend': return friend ? friend.name.slice(1) : '친구';
        case 'child': return child ? child.name.slice(1) : '아이';
        case 'sibling': return sib ? sib.name.slice(1) : '형제';
        case 'parent': return parent ? (parent.role === 'mother' ? '어머니' : parent.role === 'father' ? '아버지' : '할머니') : '부모님';
        case 'job': return S().jobLabel(p);
        case 'region': return S().liveRegion(p).short;
        case 'town': return p.town;
        default: return '{' + k + '}';
      }
    }
  }

  function preview(p, ev) {
    return visibleChoices(p, ev).map(c => ({
      c, prob: c.check ? LG.Prob.compute(p, c.check, c.intent, !!(c.out && c.out.partial)) : null
    }));
  }

  // 선택의 무게 — 큰 걸 노린 선택은 이기면 크게, 지면 더 아프고, 안전한 선택은 덜 얻는 대신 덜 잃는다.
  const STAKES = {
    risk: { s: 2.1, f: 1.5 }, adventure: { s: 1.35, f: 1.3 }, money: { s: 1.15, f: 1.1 }, career: { s: 1.1, f: 1.05 },
    stability: { s: 0.85, f: 0.6 }, rest: { s: 0.8, f: 0.6 }, health: { s: 1, f: 0.85 }
  };
  function stake(out, intent, type) {
    const k = STAKES[intent];
    if (!k || !out) return out;
    const m = type === 'success' ? k.s : type === 'fail' ? k.f : (k.s + k.f) / 2;
    if (Math.abs(m - 1) < 0.02) return out;
    const o = Object.assign({}, out);
    ['money', 'debt', 'hp', 'sr', 'achv'].forEach(f => { if (typeof o[f] === 'number') o[f] = Math.round(o[f] * m); });
    if (o.st) { o.st = Object.assign({}, o.st); Object.keys(o.st).forEach(s => { o.st[s] = Math.round(o.st[s] * m * 10) / 10; }); }
    return o;
  }

  function resolve(p, ev, choiceId) {
    const c = visibleChoices(p, ev).find(x => x.id === choiceId) || (ev.choices || []).find(x => x.id === choiceId);
    if (!p.ctx || p.ctx.ev !== ev.id) bindCtx(p, ev);
    const title = titleOf(p, ev), label = labelOf(p, ev, c);
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
    if (c.check) out = stake(out, c.intent, type);
    const extra = LG.Outcome.apply(p, out, { ev, choice: c, type });
    // 큰 성취(큰돈·큰 성공)를 스스로 이뤄 내면 자신감이 붙는다 → 정신력 +1
    if (type === 'success' && c.check && ((out.achv || 0) >= 5 || (out.money || 0) >= 3000)) S().addStat(p, 'mental', 1);
    const text = render(p, out.t);
    const log =render(p, out.log) || (title + ': ' + label + (type === 'fail' ? ' (실패)' : type === 'partial' ? ' (절반의 성공)' : ''));
    LG.Timeline.add(p, log, out.minor ? 'minor' : 'choice', ev.icon || '', !!out.log);
    p.done[ev.id] = (p.done[ev.id] || 0) + 1;
    if (ev.cd) p.cool[ev.id] = p.age + (typeof ev.cd === 'function' ? ev.cd(p) : ev.cd);
    if (ev.cat) { p.catLast = p.catLast || {}; p.catLast[ev.cat] = p.age; }
    if (out.next) p.queue.unshift({ id: out.next, at: p.age, chain: true });
    const after = LG.Outcome.snapshot(p);
    // 인생의 갈림길 기록 — 결과 카드에 '가장 큰 선택 3개'로 남는다
    {
      const dMoney = Math.abs(after.money - before.money);
      let w = (ev.tier === 'major' ? 10 : 0) + (ev.milestone ? 6 : 0) + (out.major ? 10 : 0) + (out.log ? 4 : 0) +
        (c.check && type !== 'partial' ? 4 : 0) + Math.abs(after.happy - before.happy) * 0.7 + Math.abs(after.rel - before.rel) * 0.5 +
        Math.abs(after.health - before.health) * 0.4 + Math.log10(1 + dMoney / 100) * 3 + (c.intent === 'risk' || c.intent === 'adventure' ? 3 : 0);
      if (ev.cat === 'life') w *= 0.5;
      p.cross = p.cross || [];
      p.cross.push({ a: p.age, ic: ev.icon || '', ti: title, ch: label, ty: type, tx: (render(p, out.t) || '').slice(0, 90), w: Math.round(w * 10) / 10 });
      if (p.cross.length > 60) { p.cross.sort((x, y) => y.w - x.w); p.cross.length = 40; p.cross.sort((x, y) => x.a - y.a); }
    }
    const fx = prob ? prob.factors : [];
    const deltas = LG.Outcome.diff(before, after);
    const fxs = LG.Outcome.fxText(deltas);
    const hl = p.history[p.history.length - 1];
    if (hl && fxs) hl.fx = fxs;
    return {
      ev, choice: c, type, prob, title, label,
      text: (text + (extra ? ' ' + render(p, extra) : '')).trim(),
      deltas, fx: fxs,
      help: fx.filter(x => x.v > 0).slice(0, 3).map(x => x.label),
      hurt: fx.filter(x => x.v < 0).slice(0, 3).map(x => x.label),
      steps: c.steps || [`'${c.label}'`, ev.wait || '결과를 기다리는 중']
    };
  }

  function runAuto(p, ev) {
    if (ev.child || ev.who) bindCtx(p, ev);
    let out = ev.auto || {};
    if (ev.check) {
      const prob = LG.Prob.compute(p, ev.check, ev.intent, !!ev.out.partial);
      const type = LG.Prob.roll(p, prob);
      out = ev.out[type] || ev.out.fail;
    }
    if (out.skip) return null;
    const before = LG.Outcome.snapshot(p);
    const extra = LG.Outcome.apply(p, out, { ev });
    const text = render(p, out.t);
    const deltas = LG.Outcome.diff(before, LG.Outcome.snapshot(p));
    if (out.next) p.queue.unshift({ id: out.next, at: p.age, chain: true });
    p.done[ev.id] = (p.done[ev.id] || 0) + 1;
    if (ev.cd) p.cool[ev.id] = p.age + (typeof ev.cd === 'function' ? ev.cd(p) : ev.cd);
    const full = (text + (extra ? ' ' + render(p, extra) : '')).trim();
    const major = !!(out.major || ev.major);
    const fxs = LG.Outcome.fxText(deltas);
    LG.Timeline.add(p, render(p, out.log) || full, major ? 'major' : 'minor', ev.icon || '');
    if (fxs) p.history[p.history.length - 1].fx = fxs;
    // 큰 사건은 로그 한 줄로 흘려보내지 않고 카드로 멈춰서 보여 준다 (무엇이 얼마나 바뀌었는지와 함께)
    const card = !!(ev.card || out.card) && (major || deltas.length >= 2);
    return { t: full, fx: fxs, icon: ev.icon || '•', major, logged: true, card: card ? { title: render(p, ev.title) || render(p, out.log) || '큰일', icon: ev.icon || '❗', text: full, deltas } : null };
  }

  // 잔잔한 일상 문장 하나 (나와 이어진 문장일수록 더 자주 뽑힌다)
  function flavorOne(p, taken) {
    p.recent = p.recent || [];
    const fits = f => p.age >= f.a[0] && p.age <= f.a[1] && (!f.if || f.if(p)) && taken.indexOf(f) < 0;
    let list = (LG.DATA.flavor || []).filter(f => fits(f) && p.recent.indexOf(f.t) < 0);
    // 문장이 바닥나면(아주 오래 산 경우) 최근 몇 해에 나온 것만 피하고 다시 쓴다 → 해마다 로그가 비지 않게
    if (!list.length) { const near = p.recent.slice(-8); list = (LG.DATA.flavor || []).filter(f => fits(f) && near.indexOf(f.t) < 0); }
    if (!list.length) return null;
    const pick = R().weighted(p, list, f => (f.if ? 3 : 1) * (f.w || 1) * LG.Aff.mult(p, f.dom));
    if (!pick) return null;
    p.recent.push(pick.t); if (p.recent.length > 40) p.recent.shift();
    return pick;
  }
  function flavorCount(p) {
    const a = p.age, r = R().next(p);
    if (a < 13) return r < 0.25 ? 1 : r < 0.7 ? 2 : 3;
    if (a < 30) return r < 0.35 ? 1 : r < 0.8 ? 2 : 3;
    if (a < 60) return r < 0.3 ? 0 : r < 0.75 ? 1 : 2;
    return r < 0.45 ? 1 : 2;
  }
  // busy: 이 해에 이미 중요한 줄이 몇 개 있는가
  function flavorLines(p, busy, hasEvent) {
    let n = flavorCount(p) - (busy || 0);
    if (hasEvent && p.age >= 13) n = Math.min(n, 1);
    const out = [], taken = [];
    for (let i = 0; i < n; i++) {
      const f = flavorOne(p, taken);
      if (!f) break;
      taken.push(f);
      out.push({ t: render(p, f.t), icon: f.i || '·', flavor: true });
    }
    return out;
  }
  function flavor(p) { return flavorLines(p, 0, false)[0] || null; }

  // '두 번 눌러 확정'은 되돌리기 어려운 선택에만 — 예전엔 전체 선택의 75%(독촉 전화 포함)에 걸려 의미가 흐려졌다
  const HEAVY_CATS = ['education', 'career', 'marriage', 'child', 'retirement', 'housing', 'travel', 'global', 'health', 'opportunity', 'altpath', 'money'];
  const SAFE_IDS = ['wait', 'no', 'later', 'keep', 'stay', 'watch', 'skip', 'rest', 'hold'];
  function isHeavy(ev, c) {
    if (c.confirm) return true;
    if (ev.soft || ev.light || SAFE_IDS.indexOf(c.id) >= 0) return false;
    if (ev.ages && ev.ages[1] < 15) return false;   // 어린 시절 선택은 가볍게
    if (c.intent === 'risk') return true;
    return (ev.tier === 'major' || !!ev.milestone) && HEAVY_CATS.indexOf(ev.cat) >= 0;
  }

  LG.Events = { isHeavy, init, get, all, eligible, pickYear, nextChained, bindCtx, preview, resolve, runAuto, render, flavor, flavorLines, visibleChoices, choiceRate, weight };
})(window.LG = window.LG || {});
