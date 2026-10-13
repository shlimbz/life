#!/usr/bin/env node
/* 선택지 효과 점검 — 의도와 결과가 어긋나 보이는 선택지를 찾는다 (사람이 읽고 판단할 목록)
   1) 성공했는데 실패보다 행복·건강·돈이 나쁜 경우  2) 부분 성공이 성공보다 좋은 경우
   3) 편안한 의도(가족·사랑·건강·휴식·취미·사교)를 골라 '성공'했는데 행복이 크게 떨어지는 경우
   4) 건강을 위한 선택인데 성공해도 건강이 떨어지는 경우
   5) (실제 플레이) 결과에 적히지 않은 행복·관계 하락이 숨어 있는 경우 — 판을 복제해 모든 선택지를 실제로 눌러 본다
   사용법: node tools/audit-effects.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sc = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]).filter(s => !s.startsWith('js/ui/'));
const ctx = { window: {}, console, Math, Date, JSON, Object, Array }; ctx.window = ctx; vm.createContext(ctx);
sc.forEach(s => vm.runInContext(fs.readFileSync(path.join(root, s), 'utf8'), ctx, { filename: s }));
const LG = ctx.LG;
const val = (o, k) => !o ? 0 : k === 'hp' ? (o.hp || 0) : k === 'health' ? ((o.st && o.st.health) || 0) : k === 'money' ? (o.money || 0) - (o.debt || 0) : 0;
const soft = ['family', 'love', 'health', 'rest', 'hobby', 'social'];
const out = [];
LG.DATA.events.forEach(ev => (ev.choices || []).forEach(c => {
  const o = c.out || {}, s = o.success, f = o.fail, pa = o.partial;
  const lbl = typeof c.label === 'function' ? '(함수)' : c.label;
  const tag = `${ev.id}/${c.id} "${lbl}" [${c.intent}]`;
  if (s && f) ['hp', 'health'].forEach(k => { if (val(s, k) < val(f, k)) out.push(`성공<실패 ${k}: ${tag} 성공 ${val(s, k)} / 실패 ${val(f, k)}`); });
  if (s && pa) ['hp'].forEach(k => { if (val(pa, k) > val(s, k) + 2) out.push(`부분>성공 ${k}: ${tag} 성공 ${val(s, k)} / 부분 ${val(pa, k)}`); });
  const main = s || (o.t !== undefined || o.fn ? o : null);
  if (main && soft.indexOf(c.intent) >= 0 && val(main, 'hp') <= -6) out.push(`편안한 의도인데 행복↓: ${tag} 행복 ${val(main, 'hp')}`);
  if (main && c.intent === 'health' && val(main, 'health') < -3 && ev.cat !== 'health') out.push(`건강 선택인데 건강↓: ${tag} 건강 ${val(main, 'health')}`);
}));
console.log(out.length ? out.join('\n') : '어긋난 선택지 없음');
console.log(`\n총 ${out.length}건 (선택 이벤트 ${LG.DATA.events.filter(e => e.choices).length}개 검사)`);

// 5) 실제로 눌러 보기: 선언되지 않은 행복·관계 하락 찾기
const hidden = {};
for (let i = 0; i < (+process.argv[2] || 80); i++) {
  const p = LG.Game.newLife(i % 2 ? 'M' : 'F', 'ae' + i); let g = 0;
  while (p.alive && g++ < 130) {
    LG.Game.advance(p); let ev = LG.Game.pendingEvent(p);
    while (ev) {
      const vis = LG.Events.visibleChoices(p, ev);
      vis.forEach(c => {
        const q = JSON.parse(JSON.stringify(p)); let res;
        try { res = LG.Events.resolve(q, ev, c.id); } catch (e) { return; }
        const o = c.check ? (c.out[res.type] || c.out.fail) : (c.out || {});
        const relNeg = o.rel && Object.keys(o.rel).some(k => o.rel[k] < 0);
        const breaks = /헤어|이별|이혼|떠나|breakup/.test(String(o.fn || '')) || /헤어|이별|이혼/.test(String(o.t || '') + String(o.log || ''));
        res.deltas.forEach(d => {
          if (d.good) return;
          if (d.k === 'happy' && !((o.hp || 0) < 0) && !breaks) (hidden[`${ev.id}/${c.id}/${res.type} 행복 ${d.text}`] = (hidden[`${ev.id}/${c.id}/${res.type} 행복 ${d.text}`] || 0) + 1);
          if (d.k === 'rel' && !relNeg && !breaks) (hidden[`${ev.id}/${c.id}/${res.type} 관계 ${d.text}`] = (hidden[`${ev.id}/${c.id}/${res.type} 관계 ${d.text}`] || 0) + 1);
        });
      });
      LG.Game.choose(p, vis[Math.floor(Math.random() * vis.length)].id); ev = LG.Game.pendingEvent(p);
    }
  }
}
const hk = Object.keys(hidden);
console.log(`\n숨은 행복·관계 하락: ${hk.length ? hk.length + '건' : '없음'}`);
hk.sort((a, b) => hidden[b] - hidden[a]).slice(0, 30).forEach(k => console.log(`  ${hidden[k]}회 · ${k}`));
