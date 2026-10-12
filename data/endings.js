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
  // 무작위로 고를 때 각 의도가 차지하는 평균 비율 (선택지 구성상 '안정'이 원래 많다).
  // 한 줄 평과 성향은 '얼마나 많이 골랐나'가 아니라 '평균보다 얼마나 더 골랐나(lift)'로 판단한다.
  LG.DATA.intentBase = { stability: 0.197, rest: 0.118, career: 0.111, education: 0.087, health: 0.076, independence: 0.072, family: 0.069, risk: 0.061, adventure: 0.048, social: 0.047, money: 0.042, hobby: 0.036, love: 0.035 };   // node tools/intents.js 로 다시 잴 수 있다
  const lift = (p, k) => {
    const tot = Object.keys(p.intents).reduce((a, x) => a + p.intents[x], 0);
    if (tot < 8) return 0;
    return ((p.intents[k] || 0) / tot) / (LG.DATA.intentBase[k] || 0.06);
  };
  LG.DATA.lift = lift;
  const L = (p, k, w) => Math.max(0, lift(p, k) - 1.15) * (w || 70);

  LG.DATA.oneLiners = [
    // 삶에서 일어난 큰 일 (구체적인 기억이 가장 강하다)
    { score: (p, s) => (has(p, 'late_bloomer') || has(p, 'night_college') || has(p, 'retake_success') || has(p, 'second_act')) ? 62 : 0, t: '늦게 시작했지만 끝까지 도전한 사람.' },
    { score: (p, s) => has(p, 'supporting_parents') || has(p, 'caregiver') ? 58 : 0, t: '가족을 위해 많은 것을 내려놓은 사람.' },
    { score: (p, s) => has(p, 'stood_up') ? 60 : 0, t: '부당함 앞에서 침묵하지 않았던 사람.' },
    { score: (p, s) => has(p, 'mentor_given') ? 56 : 0, t: '받은 만큼 길을 내어 준 사람.' },
    { score: (p, s) => has(p, 'sober') && has(p, 'alcoholic') === false ? 58 : has(p, 'turned_around') ? 58 : 0, t: '무너졌다가 스스로 다시 일어선 사람.' },
    { score: (p, s) => p.blocked && Object.keys(p.blocked).length ? 57 : 0, t: '재능을 접고도 삶을 포기하지 않은 사람.' },
    { score: (p, s) => p.prodigy && p.found.indexOf(p.prodigy) >= 0 && !(p.blocked && p.blocked[p.prodigy] != null) ? 75 : 0, t: '타고난 빛을 끝까지 꺼뜨리지 않은 사람.' },
    { score: (p, s) => has(p, 'emigrated') || has(p, 'study_abroad') ? 54 : 0, t: '낯선 땅에 뿌리를 내린 사람.' },
    { score: (p, s) => has(p, 'widowed') && has(p, 'widow_decided') ? 52 : 0, t: '혼자 남은 뒤에도 하루를 꾸려 간 사람.' },
    { score: (p, s) => has(p, 'grandparent') && has(p, 'grand_care_decided') ? 48 : 0, t: '손주의 웃음으로 노년을 채운 사람.' },
    { score: (p, s) => has(p, 'donor') ? 50 : 0, t: '가진 것을 세상에 돌려준 사람.' },
    { score: (p, s) => has(p, 'world_stage') ? 78 : 0, t: '세계 무대에 이름을 새긴 사람.' },
    { score: (p, s) => has(p, 'genius_founder') && has(p, 'business_success') ? 76 : 0, t: '아이디어 하나로 세상을 바꾼 사람.' },
    { score: (p, s) => has(p, 'idol_debut') || has(p, 'comedian') || (has(p, 'famous') && (p.jobHistory || []).some(j => ['idol', 'entertainer', 'creator'].indexOf(j.id) >= 0)) ? 64 : 0, t: '조명 아래서 가장 빛났던 사람.' },
    { score: (p, s) => has(p, 'landlord') ? 52 : 0, t: '물려받은 것 위에서 자기 삶을 찾은 사람.' },
    { score: (p, s) => has(p, 'rich_idle') ? 54 + (s.happy >= 60 ? 6 : 0) : 0, t: '일하지 않을 자유를 누린 사람.' },
    { score: (p, s) => has(p, 'turned_around') && p.done.al_recluse_out ? 60 : 0, t: '닫힌 문을 스스로 열고 나온 사람.' },
    { score: (p, s) => has(p, 'ex_trainee') || has(p, 'stage_actor') ? 40 : 0, t: '한때 무대를 꿈꿨던 사람.' },
    { score: (p, s) => has(p, 'cancer_survivor') ? 55 : 0, t: '큰 병을 이겨 내고 남은 날을 더 사랑한 사람.' },
    { score: (p, s) => has(p, 'debt_cleared') ? 46 : 0, t: '무거운 짐을 내려놓고 남은 날을 지킨 사람.' },
    { score: (p, s) => has(p, 'found_calling') ? 55 : 0, t: '좋아하는 일을 끝내 놓지 않은 사람.' },
    { score: (p, s) => has(p, 'childfree_single') && s.happy >= 55 ? 50 : 0, t: '혼자서도 충분히 단단했던 사람.' },
    { score: (p, s) => has(p, 'career_break') === false && has(p, 'career_break_decided') && p.jobHistory.some(j => j.id === 'homemaker') ? 50 : 0, t: '멈췄던 자리에서 다시 걸어 나온 사람.' },
    // 결과의 대비 (돈과 행복은 다르다)
    { score: (p, s) => s.money >= 72 && s.rel < 45 ? 70 : 0, t: '돈은 모았지만 사람을 놓친 사람.' },
    { score: (p, s) => s.money < 38 && s.happy >= 62 ? 68 : 0, t: '적게 가졌지만 많이 웃었던 사람.' },
    { score: (p, s) => s.achv >= 82 && s.happy < 50 ? 66 : 0, t: '성공을 쥐었지만 쉬는 법을 몰랐던 사람.' },
    { score: (p, s) => s.rel >= 78 && s.money < 50 ? 60 : 0, t: '사람이 곧 재산이었던 사람.' },
    { score: (p, s) => s.health >= 75 && p.age >= 88 ? 58 : 0, t: '몸을 돌본 만큼 오래 즐긴 사람.' },
    // 선택의 성향 (평균보다 유난히 많이 고른 쪽)
    { score: (p, s) => L(p, 'adventure') + L(p, 'risk', 40), t: '안정보다 경험을 선택했던 사람.' },
    { score: (p, s) => L(p, 'risk') + (has(p, 'business_failed') && has(p, 'business_success') ? 30 : 0), t: '넘어져도 다시 일어서던 사람.' },
    { score: (p, s) => L(p, 'family') + (s.rel > 70 ? 10 : 0), t: '가족을 선택한 사람.' },
    { score: (p, s) => L(p, 'career') + (s.achv > 70 ? 10 : 0), t: '일에서 자신을 증명하고 싶었던 사람.' },
    { score: (p, s) => L(p, 'love'), t: '사랑 앞에서 망설이지 않았던 사람.' },
    { score: (p, s) => L(p, 'stability') + (s.money > 55 ? 5 : 0), t: '흔들리지 않는 일상을 지켜낸 사람.' },
    { score: (p, s) => L(p, 'education'), t: '배움을 멈추지 않았던 사람.' },
    { score: (p, s) => L(p, 'health') + (s.health > 70 ? 10 : 0), t: '자신을 아끼는 법을 알았던 사람.' },
    { score: (p, s) => L(p, 'social'), t: '사람 사이에서 길을 찾은 사람.' },
    { score: (p, s) => L(p, 'rest') + L(p, 'hobby', 40), t: '서두르지 않고 자기 속도로 걸은 사람.' },
    { score: (p, s) => L(p, 'independence'), t: '누구에게도 기대지 않고 제 길을 간 사람.' },
    { score: (p, s) => L(p, 'money') + (s.money > 70 ? 10 : 0), t: '셈이 빨랐고, 끝까지 손해 보지 않은 사람.' },
    // 삶의 방식
    { score: (p, s) => (p.styleYears && p.styleYears.luxury >= 12 ? 48 : 0) + (s.money < 40 ? 10 : 0), t: '오늘을 마음껏 누리며 산 사람.' },
    { score: (p, s) => (p.styleYears && p.styleYears.frugal >= 15 ? 48 : 0) + (s.money > 75 ? 10 : 0), t: '한 푼 한 푼이 자유가 된다고 믿은 사람.' },
    { score: (p, s) => (p.styleYears && p.styleYears.work >= 15 ? 46 : 0) + (s.achv > 70 ? 10 : 0), t: '일에서 자신을 찾으려 했던 사람.' },
    { score: (p, s) => (p.styleYears && p.styleYears.growth >= 15 ? 46 : 0), t: '어제보다 나은 내일을 믿었던 사람.' },
    { score: (p, s) => (p.styleYears && p.styleYears.family >= 15 ? 48 : 0) + (s.rel > 68 ? 10 : 0), t: '퇴근길마다 가족에게 돌아간 사람.' },
    { score: (p, s) => (p.styleYears && p.styleYears.health >= 15 ? 46 : 0), t: '매일 걷고, 매일 잘 자던 사람.' },
    { score: () => 20, t: '조용히, 그러나 성실하게 살아낸 사람.' }
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

  // 기록용 플래그 — 다른 이벤트의 조건으로 쓰지 않고 연표·통계에만 남긴다 (tools/check.js 가 이유를 확인)
  LG.DATA.recordFlags = {
    college: '대학 진학 여부 기록 (게임 로직은 p.edu 를 쓴다; 밸런스 도구 집계용)',
    moved_stalk: '스토킹 피해로 이사한 기록 (해당 연표 문장으로 남음)',
    small_wedding: '결혼식 방식 기록 (연표)',
    no_wedding: '결혼식 방식 기록 (연표)'
  };
})(window.LG = window.LG || {});
