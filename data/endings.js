/* 엔딩 데이터 — 인생을 돈 하나로 평가하지 않는다.
   s = { money, health, happy, rel, achv, exp } (0~100) */
(function (LG) {
  LG.DATA = LG.DATA || {};
  const has = (p, f) => Object.prototype.hasOwnProperty.call(p.flags, f);

  // 인생 제목 (위에서부터 첫 번째로 맞는 것)
  LG.DATA.endingTitles = [
    { if: (s) => s.happy >= 72 && s.rel >= 72 && s.money < 55, t: '평범하지만 행복한 삶' },
    { if: (s) => s.money >= 78 && s.happy >= 65, t: '모든 것을 가진 듯한 삶' },
    { if: (s) => s.money >= 75 && s.rel < 45, t: '성공했지만 외로웠던 삶' },
    { if: (s) => s.achv >= 80 && s.happy < 55, t: '쉼 없이 달려온 삶' },
    { if: (s) => s.achv >= 75, t: '무언가를 이뤄낸 삶' },
    { if: (s) => s.exp >= 75, t: '세상을 누빈 삶' },
    { if: (s) => s.rel >= 78, t: '사람이 곁에 있던 삶' },
    { if: (s) => s.happy >= 70, t: '마음이 넉넉했던 삶' },
    { if: (s) => s.health >= 72, t: '건강하게 오래 걸어온 삶' },
    { if: (s) => s.happy < 40 && s.rel < 45, t: '고단했지만 끝까지 버틴 삶' },
    { if: (s) => s.money < 30, t: '가진 것은 적었지만 정직했던 삶' },
    { if: () => true, t: '자기 속도로 걸어온 삶' }
  ];

  // 인생 한 줄 (조건에 맞는 후보 중 점수가 가장 높은 것)
  LG.DATA.oneLiners = [
    { score: (p, s) => (has(p, 'late_bloomer') || has(p, 'night_college') || has(p, 'retake_success')) ? 80 : 0, t: '늦게 시작했지만 끝까지 도전한 사람.' },
    { score: (p, s) => has(p, 'supporting_parents') || has(p, 'caregiver') ? 75 : 0, t: '가족을 위해 많은 것을 내려놓은 사람.' },
    { score: (p, s) => (p.intents.adventure || 0) * 14 + (has(p, 'emigrated') ? 30 : 0) + (has(p, 'worked_abroad') ? 20 : 0), t: '안정보다 경험을 선택했던 사람.' },
    { score: (p, s) => (p.intents.risk || 0) * 14 + (has(p, 'business_failed') && has(p, 'business_success') ? 40 : 0), t: '넘어져도 다시 일어서던 사람.' },
    { score: (p, s) => (p.intents.family || 0) * 13 + (s.rel > 70 ? 20 : 0), t: '가족을 선택한 사람.' },
    { score: (p, s) => (p.intents.career || 0) * 11 + (s.achv > 70 ? 20 : 0), t: '일에서 자신을 증명하고 싶었던 사람.' },
    { score: (p, s) => (p.intents.love || 0) * 12, t: '사랑 앞에서 망설이지 않았던 사람.' },
    { score: (p, s) => (p.intents.stability || 0) * 11 + (s.money > 55 ? 10 : 0), t: '흔들리지 않는 일상을 지켜낸 사람.' },
    { score: (p, s) => (p.intents.education || 0) * 10, t: '배움을 멈추지 않았던 사람.' },
    { score: (p, s) => (p.intents.health || 0) * 12 + (s.health > 70 ? 15 : 0), t: '자신을 아끼는 법을 알았던 사람.' },
    { score: (p, s) => (p.intents.social || 0) * 11, t: '사람 사이에서 길을 찾은 사람.' },
    { score: (p, s) => has(p, 'found_calling') ? 70 : 0, t: '좋아하는 일을 끝내 놓지 않은 사람.' },
    { score: () => 10, t: '조용히, 그러나 성실하게 살아낸 사람.' }
  ];

  // 가치관 서술 (가장 많이 선택한 의도)
  LG.DATA.valueText = {
    education: '배우고 성장하는 것을 중요하게 생각했습니다.',
    career: '일과 성취를 중요하게 생각했습니다.',
    family: '가족과 함께하는 시간을 중요하게 생각했습니다.',
    love: '사랑하는 사람과의 관계를 중요하게 생각했습니다.',
    risk: '기회가 오면 붙잡는 것을 중요하게 생각했습니다.',
    adventure: '새로운 경험을 중요하게 생각했습니다.',
    stability: '안정적인 삶을 중요하게 생각했습니다.',
    health: '몸과 마음의 건강을 중요하게 생각했습니다.',
    social: '사람들과의 연결을 중요하게 생각했습니다.',
    money: '경제적인 여유를 중요하게 생각했습니다.',
    rest: '쉬어 가는 것도 인생이라고 생각했습니다.',
    hobby: '좋아하는 일을 하며 사는 것을 중요하게 생각했습니다.',
    independence: '누구에게도 기대지 않는 삶을 중요하게 생각했습니다.'
  };
})(window.LG = window.LG || {});
