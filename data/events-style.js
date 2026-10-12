/* 이벤트 — 삶의 방식(라이프스타일)을 고르는 갈림길
   처음 돈을 벌 무렵 한 번, 그 뒤로는 나이 마디마다 '지금 방식 그대로 갈까?'를 돌아본다.
   언제든 💰 옆의 현황 칩(삶의 방식)에서 직접 바꿀 수도 있다. */
(function (LG) {
  const E = LG.DATA.events;
  const SY = () => LG.Style;
  const TRADE = {
    growth: '능력·재능↑ / 건강·여유↓',
    work: '소득·성취↑ / 건강·가족↓',
    health: '건강·행복↑ / 소득 약간↓',
    family: '관계·행복↑ / 소득·성취↓',
    luxury: '행복·건강↑ / 돈이 빨리 샌다',
    frugal: '자산↑ / 여가·행복↓'
  };
  const lbl = k => `${SY().STYLES[k].icon} ${SY().STYLES[k].name} — ${TRADE[k]}`;
  const pick = k => ({
    id: k, label: lbl(k), intent: { growth: 'education', work: 'career', health: 'health', family: 'family', luxury: 'rest', frugal: 'stability' }[k],
    rank: p => {
      const nw = LG.State.netWorth(p), rs = LG.State.relScore(p);
      if (k === 'health') return 30 + Math.max(0, 62 - p.stats.health) * 1.2 + Math.max(0, p.stress - 50) * 0.6 + (p.age >= 50 ? 20 : 0);
      if (k === 'family') return 28 + Math.max(0, 58 - rs) * 1.1 + (LG.Rel.all(p, 'child').length ? 14 : 0) + (LG.Rel.get(p, 'spouse') ? 10 : 0);
      if (k === 'work') return 26 + (p.job ? 14 : 0) + (p.age < 50 ? 8 : -10);
      if (k === 'growth') return 26 + (p.age < 45 ? 12 : 0) + Math.max(0, LG.Aff.get(p, 'science') + LG.Aff.get(p, 'tech') - 30) * 0.3;
      if (k === 'luxury') return 22 + Math.min(30, Math.max(0, nw) / 4000);
      return 24 + (nw < 5000 ? 14 : 0) + (p.debt > 0 ? 14 : 0);
    },
    out: { t: SY().STYLES[k].desc, log: '삶의 방식을 고르다: ' + SY().STYLES[k].name, fn: p => { SY().set(p, k); return ''; } }
  });

  E.push({
    id: 'l_style_start', cat: 'life', tier: 'major', ages: [20, 27], milestone: true, prio: 3, icon: '🧭',
    if: p => !p.styleChosen && p.status !== 'military',   // 군 복무 중이면 전역 후로 미룬다
    label: '삶의 방식', title: '어떤 방식으로 살아갈까',
    text: p => `${p.status === 'working' || p.job ? '첫 월급을 받고 나니' : '스무 살이 넘고 나니'} 하루하루를 어떻게 쓸지가 보인다. 바쁘게 일할 수도, 몸을 챙길 수도, 사람과 함께할 수도, 아끼며 모을 수도 있다. 모든 방식에는 얻는 것과 치르는 대가가 있다. 언제든 바꿀 수 있지만 습관은 쌓인다.`,
    maxShow: 7,
    choices: SY().ORDER.map(pick).concat([{
      id: 'balanced', label: '🙂 딱히 정하지 않고 평범하게', intent: 'stability',
      rank: 10, out: { t: '한쪽으로 치우치지 않고 하루하루를 살아가기로 했다.', fn: p => { SY().set(p, 'balanced', true); return ''; } }
    }])
  });

  // 돌아보는 시점은 세 번 (자주 물으면 같은 질문의 반복이 된다)
  [[35, 37, '서른 중반. 처음 정한 방식이 지금의 나를 만들었다. 이대로 괜찮은가?'],
   [50, 52, '쉰이 되었다. 몸과 마음이 예전 같지 않다. 일, 몸, 사람, 돈. 이제 무엇을 가장 지키고 싶은가.'],
   [65, 67, '일에서 한 걸음 물러난 시기. 남은 시간을 어떤 방식으로 보낼 것인가.']
  ].forEach(([a, b, intro], i) => {
    E.push({
      id: 'l_style_' + a, cat: 'life', tier: 'major', ages: [a, b], milestone: true, prio: 1, icon: '🧭',
      if: p => p.styleChosen,
      label: '삶의 방식', title: '삶의 방식을 돌아볼 때',
      text: p => intro + ` (지금은 '${SY().cur(p).name}')`,
      maxShow: 5,
      choices: [{
        id: 'keep', label: p => `지금 방식을 이어 간다 (${SY().cur(p).icon} ${SY().cur(p).short})`, intent: 'stability', must: true, rank: 100,
        out: { t: '지금까지의 방식을 믿고 계속 가기로 했다.', fn: p => { p.styleSince = p.age; return ''; } }
      }].concat(SY().ORDER.map(k => {
        const c = pick(k);
        c.if = p => SY().key(p) !== k;
        return c;
      }))
    });
  });
})(window.LG = window.LG || {});
