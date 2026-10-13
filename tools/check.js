#!/usr/bin/env node
/* 자동 검사 — push 할 때마다 (GitHub Actions) 또는 로컬에서: node tools/check.js
   1) 모든 JS 문법   2) 이벤트 id 중복   3) 존재하지 않는 이벤트 참조(queue/next)
   4) 기억 플래그: 설정만 되고 안 읽힘 / 읽기만 하고 설정 안 됨   5) index.html 의 중복 id
   6) 무작위 시뮬레이션 N판 오류 0건   7) 선택지 없는 선택 이벤트
   실패하면 종료 코드 1 */
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const root = path.join(__dirname, '..');
const N = +process.argv[2] || 300;
let fail = 0;
const ok = (m) => console.log('  ✓ ' + m);
const bad = (m) => { console.log('  ✗ ' + m); fail++; };
const warn = (m) => console.log('  ! ' + m);

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scriptsAll = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
const logicScripts = scriptsAll.filter(s => !s.startsWith('js/ui') && !s.includes('main.js'));   // js/ui/* 는 DOM 이 필요하다

console.log('1. 문법');
const jsFiles = ['js', 'js/ui', 'data', 'tools'].flatMap(d => fs.readdirSync(path.join(root, d)).filter(f => f.endsWith('.js')).map(f => d + '/' + f));
let synOk = true;
jsFiles.forEach(f => { try { cp.execFileSync(process.execPath, ['--check', path.join(root, f)], { stdio: 'pipe' }); } catch (e) { bad(f + ' 문법 오류: ' + String(e.stderr).split('\n')[4]); synOk = false; } });
scriptsAll.forEach(s => { if (!fs.existsSync(path.join(root, s))) { bad('index.html 이 없는 파일을 불러옴: ' + s); synOk = false; } });
if (synOk) ok(`JS ${jsFiles.length}개 문법 정상, script 태그 ${scriptsAll.length}개 모두 존재`);

// 로직 로드 (DOM 없이)
const ctx = { window: {}, console: { log() {}, warn: (...a) => warn(a.join(' ')), error: console.error }, Math, Date, JSON, Object, Array };
ctx.window = ctx; vm.createContext(ctx);
logicScripts.forEach(s => vm.runInContext(fs.readFileSync(path.join(root, s), 'utf8'), ctx, { filename: s }));
const LG = ctx.LG, EV = LG.DATA.events;

console.log('2. 이벤트 id');
const ids = {}; EV.forEach(e => { ids[e.id] = (ids[e.id] || 0) + 1; });
const dup = Object.keys(ids).filter(k => ids[k] > 1);
dup.length ? bad('중복 id: ' + dup.join(', ')) : ok(`이벤트 ${EV.length}개, 중복 없음`);
const noChoice = EV.filter(e => e.tier !== 'auto' && (!e.choices || !e.choices.length));
noChoice.length ? bad('선택지 없는 선택 이벤트: ' + noChoice.map(e => e.id).join(', ')) : ok('모든 선택 이벤트에 선택지가 있음');

const src = jsFiles.filter(f => !f.startsWith('tools/')).map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
console.log('3. 이벤트 참조');
const refs = new Set();
[/next:\s*'([a-z0-9_]+)'/g, /queue\.push\(\{\s*id:\s*'([a-z0-9_]+)'/g, /queue:\s*\[\s*\{\s*id:\s*'([a-z0-9_]+)'/g, /queue\.unshift\(\{\s*id:\s*'([a-z0-9_]+)'/g, /\{\s*id:\s*'([a-z0-9_]+)',\s*in:/g].forEach(re => { for (const m of src.matchAll(re)) refs.add(m[1]); });
const missing = [...refs].filter(r => !ids[r]);
missing.length ? bad('존재하지 않는 이벤트 참조: ' + missing.join(', ')) : ok(`참조 ${refs.size}개 모두 존재`);

console.log('4. 기억 플래그');
const setF = new Set(), readF = new Set();
for (const m of src.matchAll(/\b(?:flag|unflagIfNot):\s*(\[[^\]]*\]|'[^']*')/g)) for (const x of m[1].matchAll(/'([a-z_0-9]+)'/g)) setF.add(x[1]);
for (const m of src.matchAll(/\.flag\(p,([^;\n]{0,160})/g)) for (const x of m[1].matchAll(/'([a-z_0-9]+)'/g)) if (!/^(music|art|sport|math|writing|language)$/.test(x[1])) setF.add(x[1]);
for (const m of src.matchAll(/setPolicy\('[a-z]+',\s*'[^']*',\s*\[([^\]]*)\]/g)) for (const x of m[1].matchAll(/'([a-z_0-9]+)'/g)) setF.add(x[1]);
for (const m of src.matchAll(/flags\.([a-z_0-9]+)\s*=/g)) setF.add(m[1]);
[/\bhas\(p,\s*'([a-z_0-9]+)'/g, /\['(?:flag|noflag)',\s*'([a-z_0-9]+)'/g, /flags\.([a-z_0-9]+)\b(?!\s*=[^=])/g, /flags\['([a-z_0-9]+)'\]/g, /hasAny\(p,[^)]*'([a-z_0-9]+)'/g].forEach(re => { for (const m of src.matchAll(re)) readF.add(m[1]); });
// 배열로 여러 개를 한 번에 확인하는 경우: anyFlag(p, ['a','b'])
for (const m of src.matchAll(/anyFlag\(p,\s*\[([^\]]*)\]/g)) for (const x of m[1].matchAll(/'([a-z_0-9]+)'/g)) readF.add(x[1]);
// 친화도 표 / 연결 표 (객체 키로 읽히는 플래그)
const tableKeys = (file, name) => { const s = fs.readFileSync(path.join(root, file), 'utf8'); const m = s.match(new RegExp('const ' + name + ' = \\{([\\s\\S]*?)\\n  \\};')); return m ? [...m[1].matchAll(/\b([a-z_0-9]+):\s*[\{\[']/g)].map(x => x[1]) : []; };
tableKeys('js/affinity.js', 'FLAG').forEach(k => readF.add(k));
// 기록용 플래그(엔딩·연표 표시용으로만 쓰는 것) — 이유와 함께 허용
const RECORD_ONLY = (LG.DATA.recordFlags || {});
Object.keys(RECORD_ONLY).forEach(k => readF.add(k));
const unread = [...setF].filter(f => !readF.has(f)).sort();
const unset = [...readF].filter(f => !setF.has(f) && !RECORD_ONLY[f]).sort();
const SYS = new Set(['married', 'college', 'retired', 'divorced', 'widowed', 'dating', 'teen_job', 'hs_grad_pending', 'single_parent', 'busy_parents', 'job_risk', 'dual_income', 'conflict', 'with_grandparents', 'big_family', 'only_child', 'self_employed', 'divorced_parents', 'last']);
const unset2 = unset.filter(f => !SYS.has(f));
unread.length ? bad(`설정만 되고 안 읽히는 플래그 ${unread.length}개: ${unread.join(', ')}`) : ok(`설정된 플래그 ${setF.size}개 모두 어딘가에서 쓰임`);
unset2.length ? bad(`읽기만 하고 설정되지 않는 플래그 ${unset2.length}개: ${unset2.join(', ')}`) : ok('읽는 플래그는 모두 설정되는 곳이 있음');

console.log('5. index.html');
const hid = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
const hdup = hid.filter((x, i) => hid.indexOf(x) !== i);
hdup.length ? bad('중복 id: ' + [...new Set(hdup)].join(', ')) : ok(`id ${hid.length}개 중복 없음`);

console.log(`6. 시뮬레이션 ${N}판 (무작위 선택)`);
const errs = {}; let deaths = 0;
const audits = {}; const audit = m => { audits[m] = (audits[m] || 0) + 1; };
for (let i = 0; i < N; i++) {
  try {
    const p = LG.Game.newLife(null, 'chk' + i);
    let g = 0;
    while (p.alive && g++ < 130) {
      LG.Game.advance(p);
      // 빚 장부: p.debt == 대출 합계, 음수 없음, 정기 대출이 3년 넘게 연체된 채 방치되지 않음, 갖고 있지 않은 부동산의 대출 없음
      if (Math.abs(LG.Loans.sum(p) - p.debt) > 1) audit('빚 합계와 대출 장부가 다름');
      if ((p.loans || []).some(l => l.amt < 0)) audit('음수 대출');
      if ((p.loans || []).some(l => ['install', 'biz', 'student', 'prop'].indexOf(l.k) >= 0 && l.late >= 3)) audit('정기 대출 연체가 방치됨');
      if (!p.prop && LG.Loans.amount(p, 'deposit') > 0) audit('투자 부동산이 없는데 세입자 보증금이 남음');
      if (p.age < 19 && p.debt > 0 && !p.flags.young_carer) audit('미성년자가 빚을 짐');
      let ev = LG.Game.pendingEvent(p), k = 0;
      while (ev && k++ < 20) {
        const v = LG.Events.visibleChoices(p, ev);
        if (!v.length) throw new Error('보이는 선택지 없음: ' + ev.id);
        const before = { n: p.people.length, kids: LG.Rel.all(p, 'child').length, div: !!p.flags.parents_divorced, cf: !!p.flags.childfree };
        if (ev.id === 'c_parents_fight' && before.div) audit('부모님이 이미 이혼했는데 다툼 이벤트가 열림');
        if (ev.id === 'k_premarital' && p.gender === 'F' && /연인이 임신/.test(LG.Events.render(p, ev.title))) audit('여성 플레이어에게 "연인이 임신했다"');
        const r = LG.Game.choose(p, v[Math.floor(Math.random() * v.length)].id);
        if ((ev.id === 'r_reunion' || ev.id === 'ec_classmates') && LG.Rel.get(p, 'partner') && p.people.length > before.n) audit(ev.id + ': 재회인데 새 인물이 생김');
        if (!before.cf && p.flags.childfree && before.kids > 0) audit('자녀가 있는데 childfree 로 기록');
        if (/그 사람|배우자와 결혼/.test(r.text + (p.history[p.history.length - 1] || {}).t) && /r_propos/.test(ev.id)) audit(ev.id + ': 결과 문장에서 상대 이름이 사라짐');
        ev = LG.Game.pendingEvent(p);
      }
      if (k >= 20) throw new Error('연쇄 이벤트 무한 반복 의심');
    }
    if (!p.alive) deaths++;
    const badText = p.history.find(h => /\{\w+\}|undefined|NaN|\[object/.test(h.t));
    if (badText) throw new Error('연표 문장에 치환되지 않은 값: ' + badText.t.slice(0, 60));
    LG.Timeline.ending(p);
    const s = JSON.stringify(p); if (/NaN|undefined/.test(s.replace(/"[^"]*undefined[^"]*"/g, ''))) throw new Error('상태에 NaN/undefined');
    LG.State.migrate(JSON.parse(s));
  } catch (e) { const k = (e.stack || String(e)).split('\n').slice(0, 2).join(' | '); errs[k] = (errs[k] || 0) + 1; }
}
const ek = Object.keys(errs);
ek.length ? ek.forEach(k => bad(`${errs[k]}회: ${k}`)) : ok(`${N}판 모두 오류 없이 끝까지 진행 (사망 ${deaths})`);

console.log('8. 인물·가족 정합성 (시뮬레이션 중 감시)');
const ak = Object.keys(audits);
ak.length ? ak.forEach(k => bad(`${audits[k]}회: ${k}`)) : ok('재회=같은 인물 · 청혼 후 이름 유지 · 성별에 맞는 임신 대사 · 이혼 후 다툼 이벤트 없음 · childfree 오기록 없음 · 빚 장부 일치');

console.log('7. 옛 저장 데이터 불러오기 (v1 → 현재)');
try {
  const p = LG.Game.newLife(null, 'mig');
  for (let i = 0; i < 30; i++) { LG.Game.advance(p); let ev = LG.Game.pendingEvent(p); while (ev) { LG.Game.choose(p, LG.Events.visibleChoices(p, ev)[0].id); ev = LG.Game.pendingEvent(p); } }
  const old = JSON.parse(JSON.stringify(p));
  old.v = 1; ['inv', 'invPolicy', 'invLast', 'catLast', 'mkt', 'style', 'styleSince', 'styleYears', 'styleLog', 'cross', 'foundAt', 'foundBy', 'prodigy', 'tgrade', 'blocked', 'daily', 'seekTries', 'dz', 'car', 'bldg', 'ctx', 'firstLoveId'].forEach(k => delete old[k]); delete old.family.ext;
  const m = LG.State.migrate(old);
  for (let i = 0; i < 15 && m.alive; i++) { LG.Game.advance(m); let ev = LG.Game.pendingEvent(m); while (ev) { LG.Game.choose(m, LG.Events.visibleChoices(m, ev)[0].id); ev = LG.Game.pendingEvent(m); } }
  m.v === LG.State.SAVE_VERSION ? ok(`v1 저장본을 v${m.v}로 변환해 15년 더 진행`) : bad('버전 번호가 갱신되지 않음');
  let threw = false; try { LG.State.migrate({ v: 1, seed: 'x' }); } catch (e) { threw = true; }
  threw ? ok('필수 항목이 없는 손상된 저장본은 거부(복구 절차로 넘어감)') : bad('손상된 저장본을 그대로 받아들임');
} catch (e) { bad('마이그레이션 실패: ' + e.message); }

console.log(fail ? `\n실패 ${fail}건` : '\n모든 검사 통과');
process.exit(fail ? 1 : 0);
