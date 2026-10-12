/* 엔딩 데이터 — 인생을 돈 하나로 평가하지 않는다.
   s = { money, health, happy, rel, achv, exp } (0~100) */
(function (LG) {
  LG.DATA = LG.DATA || {};
  const has = (p, f) => Object.prototype.hasOwnProperty.call(p.flags, f);

  // 인생 제목 (위에서부터 첫 번째로 맞는 것). c = { dom: 가장 오래 산 삶의 방식, tend: 선택 성향, kids, spouse }
  // 돈이 많다고 성공한 인생은 아니다 — 관계 · 행복 · 건강이 함께 본다.
  LG.DATA.endingTitles = [
    { if: (s) => s.money >= 72 && s.rel < 42, t: '성공했지만 곁이 비어 있던 삶' },
    { if: (s, p, c) => c.dom === 'work' && s.health < 42 && s.rel < 48, t: '일에 모든 것을 바친 삶' },
    { if: (s) => s.achv >= 82 && s.happy < 48, t: '쉼 없이 달려온 삶' },
    { if: (s) => s.money >= 70 && s.happy < 40, t: '부유했지만 마음은 가난했던 삶' },
    { if: (s) => s.money < 38 && s.happy >= 62 && s.rel >= 58, t: '가진 것은 적어도 마음은 부자였던 삶' },
    { if: (s) => s.money >= 62 && s.happy >= 60 && s.rel >= 60 && s.health >= 52, t: '모든 것을 가진 듯한 삶' },
    { if: (s, p, c) => c.dom === 'luxury' && s.money < 36 && s.happy >= 55, t: '다 쓰고 떠났지만 후회는 없는 삶' },
    { if: (s, p, c) => c.dom === 'frugal' && s.money >= 78, t: '아끼고 모아 자유를 산 삶' },
    { if: (s, p, c) => c.dom === 'health' && s.health >= 68, t: '몸을 아끼며 오래 걸어온 삶' },
    { if: (s, p, c) => c.dom === 'family' && s.rel >= 66, t: '가족이 전부였던 삶' },
    { if: (s, p, c) => c.dom === 'growth' && s.achv >= 58, t: '끝없이 배우며 성장한 삶' },
    { if: (s, p, c) => c.tend && c.tend.k === 'bold' && (s.exp >= 66 || s.achv >= 66), t: '넘어져도 다시 도전한 삶' },
    { if: (s) => s.exp >= 78, t: '세상을 누빈 삶' },
    { if: (s) => s.achv >= 78, t: '무언가를 이뤄낸 삶' },
    { if: (s, p) => p.outcomes.fail >= 14 && p.outcomes.success >= 12 && s.happy >= 48, t: '파란만장, 그래도 이어 간 삶' },
    { if: (s) => s.happy >= 68, t: '마음이 넉넉했던 삶' },
    { if: (s) => s.rel >= 76, t: '사람이 곁에 있던 삶' },
    { if: (s) => s.health >= 72, t: '건강하게 오래 걸어온 삶' },
    { if: (s, p) => has(p, 'divorced') && s.rel < 50, t: '이별을 안고 홀로 걸어온 삶' },
    { if: (s) => s.rel < 34, t: '말년이 쓸쓸했던 삶' },
    { if: (s, p) => has(p, 'heavy_debt') || (s.money < 22 && s.happy < 50), t: '빚과 싸우며 버텨 낸 삶' },
    { if: (s) => s.happy < 40 && s.rel < 46, t: '고단했지만 끝까지 버틴 삶' },
    { if: (s) => s.money < 32, t: '가진 것은 적었지만 정직했던 삶' },
    { if: (s, p, c) => c.tend && c.tend.k === 'steady' && s.money >= 55, t: '흔들림 없이 지켜 낸 삶' },
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
    { score: (p, s) => s.money >= 72 && s.rel < 45 ? 90 : 0, t: '돈은 모았지만 사람을 놓친 사람.' },
    { score: (p, s) => s.money < 38 && s.happy >= 62 ? 85 : 0, t: '적게 가졌지만 많이 웃었던 사람.' },
    { score: (p, s) => s.achv >= 82 && s.happy < 50 ? 85 : 0, t: '성공을 쥐었지만 쉬는 법을 몰랐던 사람.' },
    { score: (p, s) => (p.styleYears && p.styleYears.health >= 15 ? 60 : 0) + (s.health > 70 ? 15 : 0), t: '몸을 돌본 만큼 오래 즐긴 사람.' },
    { score: (p, s) => (p.styleYears && p.styleYears.luxury >= 12 ? 62 : 0) + (s.money < 40 ? 15 : 0), t: '오늘을 마음껏 누리며 산 사람.' },
    { score: (p, s) => (p.styleYears && p.styleYears.frugal >= 15 ? 62 : 0) + (s.money > 75 ? 15 : 0), t: '한 푼 한 푼이 자유가 된다고 믿은 사람.' },
    { score: (p, s) => (p.styleYears && p.styleYears.work >= 15 ? 62 : 0) + (s.achv > 70 ? 15 : 0), t: '일에서 자신을 찾으려 했던 사람.' },
    { score: (p, s) => (p.styleYears && p.styleYears.growth >= 15 ? 62 : 0), t: '어제보다 나은 내일을 믿었던 사람.' },
    { score: (p, s) => (p.styleYears && p.styleYears.family >= 15 ? 64 : 0) + (s.rel > 68 ? 15 : 0), t: '퇴근길마다 가족에게 돌아간 사람.' },
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
