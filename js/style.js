/* LifeStyle — 어떤 방식으로 살아갈지. 자산을 굴리는 방식처럼, 삶을 꾸려 가는 방식도 직접 고른다.
   모든 방식에는 얻는 것과 치르는 대가가 함께 있다. 해마다 조금씩 쌓여 건강 · 관계 · 돈 · 능력의 모양을 바꾼다. */
(function (LG) {
  'use strict';
  const U = () => LG.U, S = () => LG.State;

  // fx: 화면에 보여 줄 장단점  [라벨, +1/-1]
  const STYLES = {
    balanced: {
      name: '균형 잡힌 평범한 삶', short: '평범', icon: '🙂', color: '#b9b3c9',
      desc: '한쪽으로 치우치지 않고 하루하루 무난하게 산다.',
      fx: [['특별한 변화 없음', 0]],
      income: 1, cost: 1, extra: 0, mood: 0, stress: 0,
      yr: {}
    },
    growth: {
      name: '성장·자기계발형', short: '성장', icon: '📚', color: '#7fb2ff',
      desc: '배우고 단련한다. 새벽 강의, 자격증, 독서 모임으로 하루가 빡빡하다.',
      fx: [['학습·창의↑', 1], ['재능 발견↑', 1], ['소득 완만↑', 1], ['건강↓', -1], ['스트레스↑', -1], ['사교↓', -1]],
      income: 1.07, cost: 1.06, extra: 0.01, mood: -1, stress: 3,
      yr: { intelligence: 0.9, creativity: 0.4, health: -0.35, social: -0.3, perf: 0.7, effort: { study: 1.5 }, discover: 0.06 }
    },
    work: {
      name: '일 중심형', short: '일', icon: '💼', color: '#ffb36b',
      desc: '일이 곧 나의 정체성. 야근도 마다하지 않고 성과로 증명한다.',
      fx: [['소득↑', 1], ['성취↑', 1], ['평판↑', 1], ['건강↓', -1], ['가족·친구 관계↓', -1], ['스트레스↑', -1]],
      income: 1.1, cost: 1, extra: 0, mood: -2, stress: 5,
      yr: { health: -0.55, perf: 1.0, achv: 0.45, rel: { family: -1.4, friends: -0.9 }, effort: { work: 1.5 } }
    },
    health: {
      name: '건강·웰빙형', short: '건강', icon: '🏃', color: '#7fd6c2',
      desc: '규칙적인 운동과 식단, 충분한 잠. 몸이 좋아야 인생도 길다.',
      fx: [['건강↑', 1], ['체력↑', 1], ['스트레스↓', 1], ['행복↑', 1], ['소득 약간↓', -1], ['식비·운동비↑', -1]],
      income: 0.96, cost: 1.05, extra: 0.01, mood: 3, stress: -6,
      yr: { health: 0.42, physical: 0.5, mental: 0.3, effort: { health: 1.5, sport: 1.2 } }
    },
    family: {
      name: '가족·관계 중심형', short: '가족', icon: '👨‍👩‍👧', color: '#f59bb8',
      desc: '퇴근은 칼같이, 주말은 가족과. 사람 곁에 있는 시간이 가장 소중하다.',
      fx: [['가족·친구 관계↑', 1], ['행복↑', 1], ['스트레스↓', 1], ['소득↓', -1], ['성취↓', -1]],
      income: 0.93, cost: 1, extra: 0, mood: 4, stress: -4,
      yr: { rel: { family: 1.5, friends: 1.0 }, social: 0.3, achv: -0.15, effort: { social: 1.5 } }
    },
    luxury: {
      name: '럭셔리·플렉스형', short: '럭셔리', icon: '🍷', color: '#d89cf0',
      desc: '좋은 집, 좋은 음식, 좋은 여행. 인생은 한 번뿐이니 누리며 산다.',
      fx: [['행복↑', 1], ['건강↑', 1], ['사교↑', 1], ['지출 폭증', -1], ['저축 어려움', -1]],
      income: 1, cost: 1.1, extra: 0.07, mood: 9, stress: -4,
      yr: { health: 0.5, social: 0.5, exp: 0.5, effort: { social: 1 } }
    },
    frugal: {
      name: '절약·파이어형', short: '절약', icon: '🪙', color: '#e3c25b',
      desc: '아끼고 모아서 일찍 자유를 산다. 쓰는 재미는 포기하고 계좌 숫자를 키운다.',
      fx: [['지출↓', 1], ['자산↑', 1], ['투자 수익↑', 1], ['행복↓', -1], ['사교·여가↓', -1]],
      income: 1, cost: 0.76, extra: -0.05, mood: -5, stress: 2,
      yr: { social: -0.4, rel: { friends: -0.6 } , investSkill: 0.005 }
    }
  };
  const ORDER = ['growth', 'work', 'health', 'family', 'luxury', 'frugal'];
  const COOLDOWN = 2; // 방식을 바꾸고 나서 다시 바꿀 수 있기까지 (년)

  const key = p => (p.style && STYLES[p.style]) ? p.style : 'balanced';
  const cur = p => STYLES[key(p)];
  // 성인이 된 뒤에만 방식이 작동한다
  const active = p => p.age >= 19 && !!p.style;

  function mod(p) { return active(p) ? cur(p) : STYLES.balanced; }
  const income = p => (active(p) && p.job) ? cur(p).income : 1;
  const investSkill = p => active(p) ? (cur(p).yr.investSkill || 0) : 0;

  function set(p, k, quiet) {
    if (!STYLES[k]) return false;
    const prev = p.style;
    p.style = k;
    p.styleSince = p.age;
    p.styleChosen = true;
    p.styleLog = p.styleLog || [];
    p.styleLog.push({ a: p.age, k });
    if (!quiet && prev && prev !== k) S().addStat(p, 'happy', -1);
    return true;
  }
  function canSwitch(p) { return p.age >= 19 && (p.age - (p.styleSince || 0) >= COOLDOWN || !p.styleChosen); }

  // 해마다 한 번: 방식이 만든 작은 변화가 쌓인다
  function yearly(p) {
    const lines = [];
    if (!active(p)) return lines;
    const k = key(p), st = STYLES[k], y = st.yr;
    p.styleYears = p.styleYears || {};
    p.styleYears[k] = (p.styleYears[k] || 0) + 1;
    const old = p.age >= 60;
    // 몸이 불편해지는 노년에는 몸을 돌보는 방식이 더 큰 차이를 만든다
    if (y.health) S().addStat(p, 'health', y.health * (k === 'health' && old ? 1.3 : 1));
    ['intelligence', 'creativity', 'physical', 'social', 'mental'].forEach(s => { if (y[s]) S().addStat(p, s, y[s] * (old && s === 'intelligence' ? 0.4 : 1)); });
    if (y.effort) Object.keys(y.effort).forEach(e => { p.effort[e] = U().clamp((p.effort[e] || 0) + y.effort[e], 0, 100); });
    if (y.perf && p.job) p.job.perf = U().clamp(p.job.perf + y.perf, 0, 100);
    if (y.achv) p.achv = Math.max(0, p.achv + y.achv);
    if (y.exp) p.exp += y.exp;
    if (y.rel) Object.keys(y.rel).forEach(r => LG.Rel.adjust(p, r, y.rel[r]));
    if (y.discover && LG.RNG.chance(p, y.discover)) {
      const t = p.talents.find(x => p.found.indexOf(x) < 0);
      if (t) { S().discover(p, t, 'event'); lines.push({ t: `✨ 배우는 삶을 이어 가다 ${LG.DATA.talents[t].name}에 재능이 있다는 걸 알게 되었다.`, icon: '✨', major: true }); }
    }
    return lines;
  }

  // 한 해에 스스로 느끼는 기분/스트레스 (Life.yearly 가 사용)
  const moodShift = p => active(p) ? cur(p).mood : 0;
  const stressShift = p => active(p) ? cur(p).stress : 0;

  // 평생 가장 오래 산 방식
  function dominant(p) {
    const y = p.styleYears || {};
    const ks = Object.keys(y).sort((a, b) => y[b] - y[a]);
    return ks.length && y[ks[0]] >= 6 ? ks[0] : null;
  }

  LG.Style = { STYLES, ORDER, COOLDOWN, key, cur, mod, active, income, investSkill, set, canSwitch, yearly, moodShift, stressShift, dominant };
})(window.LG = window.LG || {});
