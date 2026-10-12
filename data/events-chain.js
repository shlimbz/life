/* 이벤트 — 인과의 고리: 예전에 한 투자·선택이 몇 년 뒤 결과로 돌아온다
   자녀 교육(c.plan) → 자녀 입시(k_child_csat) → 자녀의 첫 직장(relationship.js, 26세) */
(function (LG) {
  const H = LG.EH, has = H.has;
  const S = H.S;
  const ch = H.pusher({ tier: 'major', cat: 'child', label: '자녀', max: 9 });
  const kid19 = p => H.kids(p).find(c => c.age === 19 && !c.uni);
  const PLAN = {
    hagwon: '학원에 쏟은 시간과 돈이 오늘 숫자로 나온다.',
    arts: '실기 시험 날. 어릴 때부터 지원해 온 그 길의 문 앞이다.',
    free: '스스로 공부하라고 믿고 맡겼던 아이다.',
    time: '학원 대신 함께 보낸 주말이 많았던 아이다.'
  };
  // 그동안의 투자 + 관계 + 형편 + 부모 학력이 결과를 만든다
  const score = (p, c) => (c.edu || 50) * 0.5 + (c.rel - 50) * 0.25 + (p.family.tier - 3) * 3 + ({ grad: 8, college: 4 }[p.edu] || 0) + ({ hagwon: 8, time: 3, free: 0, arts: 2 }[c.plan] || 0) + (LG.State.netWorth(p) > 30000 ? 4 : 0);

  ch({
    id: 'k_child_csat', queued: true, icon: '📝',
    if: p => !!kid19(p),
    child: kid19,
    title: '{child}의 입시', text: p => { const c = kid19(p); return `{child}이(가) 수능을 봤다. ${PLAN[c.plan] || '어떤 길을 가든 이제 아이의 인생이다.'} 성적표를 받아 든 아이의 얼굴이 굳어 있다.`; },
    choices: [
      { id: 'trust', label: '결과대로, 아이의 선택을 믿어 준다', intent: 'family',
        check: { base: 0, partial: 0.45, f: [['fn', p => ({ label: '그동안 쌓아 온 것', v: Math.round(score(p, kid19(p))) })]] },
        out: {
          success: { t: '{child}이(가) 원하던 대학에 합격했다. 합격 문자를 보고 둘이서 한참을 울었다.', log: '{child}의 대학 합격', hp: 12, fn: p => { const c = kid19(p); c.uni = c.plan === 'arts' ? 'arts' : (score(p, c) >= 52 ? 'top' : 'univ'); c.edu = Math.max(c.edu || 0, 70); return ''; } },
          partial: { t: '{child}은(는) 원하던 곳보다 낮춰 지원했다. 그래도 새 출발이다.', fn: p => { const c = kid19(p); c.uni = 'univ'; return ''; } },
          fail: { t: '{child}은(는) 대학 대신 바로 일을 하겠다고 했다. 잠시 섭섭했지만 아이의 길이다.', fn: p => { const c = kid19(p); c.uni = 'work'; return ''; } }
        } },
      { id: 'retake', label: '1년 더 해 보자며 재수를 지원한다', intent: 'education', if: p => S().netWorth(p) > 1500,
        check: { base: 0, partial: 0.4, f: [['fn', p => ({ label: '그동안 쌓아 온 것', v: Math.round(score(p, kid19(p)) + 8) })]] },
        out: {
          success: { t: '재수 끝에 {child}이(가) 목표하던 대학에 들어갔다. 1년의 무게가 보상받았다.', log: '{child} 재수 끝에 합격', hp: 10, money: -1200, fn: p => { const c = kid19(p); c.uni = 'top'; c.rel = Math.min(100, c.rel + 4); return ''; } },
          fail: { t: '1년이 더 흘렀지만 결과는 비슷했다. {child}과(와) 사이에 미안함과 서운함이 함께 남았다.', money: -1200, sr: 10, fn: p => { const c = kid19(p); c.uni = 'univ'; c.rel = Math.max(0, c.rel - 8); return ''; } }
        } },
      { id: 'abroad', label: '해외 대학으로 유학을 보낸다', intent: 'adventure', if: p => S().netWorth(p) > 20000 || p.family.ext > 0,
        out: { t: '공항에서 {child}을(를) 보냈다. 학비와 생활비가 만만치 않지만 아이가 넓은 세상을 보길 바랐다.', log: '{child} 해외 유학', money: -6000, sr: 6, fn: p => { const c = kid19(p); c.uni = 'abroad'; return ''; } } },
      { id: 'work', label: '대학보다 기술·일을 먼저 배우라고 권한다', intent: 'independence',
        out: { t: '{child}은(는) 고민 끝에 기술을 배우기로 했다. 남들과 다른 길이지만 눈빛이 단단하다.', fn: p => { const c = kid19(p); c.uni = 'work'; c.job = 'technician'; return ''; } } }
    ]
  });
})(window.LG = window.LG || {});
