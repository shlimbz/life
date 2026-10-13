/* 이벤트 — 노년 · 여행 · 취미 + 자동 이벤트(선택 없이 지나가는 일, 희귀 사건) */
(function (LG) {
  const E = LG.DATA.events;
  const H = LG.EH, has = H.has, seq = H.seq;

  // ───────────────────────── 여행 · 취미 (전 연령) ─────────────────────────

  E.push({
    id: 'tr_travel', cat: 'travel', tier: 'choice', ages: [21, 82], w: 5, cd: 8, max: 3, icon: '🧳',
    if: p => p.status !== 'military' && H.cash(p) >= 300,
    label: '여행', title: '긴 여행',
    text: p => p.age < 40 ? '지금이 아니면 언제 가 볼까. 오래 꿈꾸던 곳으로 떠날까?' : p.age < 65 ? '일만 하다 보니 계절이 바뀌는 것도 몰랐다. 훌쩍 떠나 볼까?' : '다리 힘이 남아 있을 때 꼭 가 보고 싶은 곳이 있다.',
    choices: [
      { id: 'go', label: '떠난다', intent: 'adventure',
        check: { base: 62, partial: 0.5, f: [['assets', 0.3], ['health', 0.3]] },
        out: {
          success: { t: '평생 기억할 풍경을 봤다. 사진첩이 두꺼워졌다.', log: '긴 여행', exp: 10, hp: 12, sr: -12, money: -400, rel: { love: 4 } },
          partial: { t: '여행 중 지갑을 잃어버렸지만, 그것도 추억이 됐다.', exp: 8, hp: 4, money: -600 },
          fail: { t: '출발 직전 일이 터져 여행을 취소했다.', hp: -5, money: -100 }
        } },
      { id: 'later', label: '다음으로 미룬다', intent: 'money', out: { t: '여행은 다음에. 통장은 지켰다.', minor: true } }
    ]
  });

  E.push({
    id: 'hb_hobby', cat: 'hobby', tier: 'choice', ages: [25, 82], w: 6, cd: 10, max: 2, icon: '🪴',
    if: p => !has(p, 'hobby'),
    label: '취미', title: '새로운 취미',
    text: p => p.age < 60 ? '퇴근길에 지나치던 공방 광고가 오늘따라 눈에 들어온다.' : '복지관 게시판에 새 강좌 안내가 붙었다. 그림, 기타, 서예, 탁구…',
    choices: [
      { id: 'start', label: '시작해 본다', intent: 'hobby',
        check: { base: 62, partial: 0, f: [['stat', 'creativity', 0.25], ['health', 0.15]] },
        out: {
          success: { t: '푹 빠졌다. 주말이 기다려진다. 같은 취미의 친구도 생겼다.', log: '새 취미를 시작함', flag: 'hobby', hp: 10, eff: { art: 15 }, fn: seq(H.friend(58, '취미 친구'), H.disc('art', 'music', 'writing', 'mechanical', 'sport')) },
          fail: { t: '생각보다 어렵다. 몇 번 가다 말았다.', money: -50 }
        } },
      { id: 'no', label: '지금도 충분히 바쁘다', intent: 'career', out: { t: '나중에 여유가 생기면.', minor: true } }
    ]
  });

  // ───────────────────────── 노년 ─────────────────────────

  E.push({
    id: 'o_retire_life', cat: 'retirement', tier: 'major', ages: [56, 85], w: 30, max: 1, icon: '🌇',
    if: p => p.status === 'retired',
    label: '은퇴 후', title: '두 번째 하루',
    text: '출근하지 않는 아침이 낯설다. 남은 시간을 무엇으로 채울까?',
    choices: [
      { id: 'volunteer', label: '봉사 활동을 한다', intent: 'social', out: { t: '도서관에서 아이들에게 책을 읽어 준다. 누군가에게 쓸모 있다는 게 좋다.', log: '봉사 활동 시작', flag: 'volunteer', hp: 8, st: { social: 3 }, fn: H.friend(60, '봉사 동료') } },
      { id: 'grand', label: '손주를 돌본다', intent: 'family', if: p => has(p, 'grandparent'), out: { t: '손주 등하원을 맡았다. 허리는 아파도 웃음이 늘었다.', log: '손주를 돌봄', rel: { children: 10 }, hp: 8, st: { health: -2 } } },
      { id: 'farm', label: '귀농·귀촌한다', intent: 'adventure',
        check: { base: 52, partial: 0, f: [['health', 0.3], ['assets', 0.2], ['fn', p => !p.urban ? { label: '시골 출신', v: 10 } : null]] },
        out: { success: { t: '작은 텃밭을 일구며 산다. 흙냄새가 좋다.', log: '귀농', flag: 'hobby', exp: 6, st: { health: 5 }, hp: 8 }, fail: { t: '시골살이는 낭만과 달랐다. 1년 만에 돌아왔다.', sr: 8, money: -800 } } },
      { id: 'rest', label: '실컷 쉰다', intent: 'rest', out: { t: '알람 없이 일어나는 삶. 이게 행복이지.', hp: 6, sr: -10 } }
    ]
  });

  E.push({
    id: 'o_estate', cat: 'money', tier: 'major', ages: [68, 95], w: 8, max: 1, icon: '📜',
    if: p => LG.State.netWorth(p) >= 5000,
    label: '정리', title: '재산 정리',
    text: '언젠가는 정리해야 할 것들. 남은 재산을 어떻게 할까?',
    choices: [
      { id: 'gift', label: '자녀에게 미리 물려준다', intent: 'family', if: p => H.kids(p).length > 0,
        out: { t: '', log: '자녀에게 재산 증여', rel: { children: 12 }, flag: 'gave_estate', fn: p => { const a = Math.round(H.cash(p) * 0.5 / 100) * 100; if (a < 300) { LG.State.flag(p, 'will_written'); return p.house ? `현금으로 줄 만한 돈은 거의 없어, 살고 있는 집(${LG.U.money(p.house.value)}원)을 아이들에게 남긴다는 유언장을 썼다.` : '물려줄 만한 돈이 거의 없었다. 대신 그동안의 이야기를 편지로 남겼다.'; } p.money -= a; const tax = a > 5000 ? Math.round((a - 5000) * 0.1) : 0; return `예금과 투자금에서 ${LG.U.money(a)}원을 아이들에게 나눠 주었다${tax ? `(증여세 약 ${LG.U.money(tax)}원은 아이들이 냈다)` : ''}.`; } } },
      { id: 'donate', label: '일부를 기부한다', intent: 'social',
        out: { t: '', log: '재산 일부 기부', achv: 8, hp: 10, flag: 'donor', fn: p => { const a = Math.round(H.cash(p) * 0.2 / 100) * 100; p.money -= a; return `${LG.U.money(a)}원을 장학재단에 기부했다. 내 이름이 붙은 장학금이 생겼다.`; } } },
      { id: 'keep', label: '내 노후를 위해 쓴다', intent: 'rest', out: { t: '평생 아끼며 살았다. 이제는 나를 위해 쓴다.', hp: 6, exp: 6, fn: p => { p.money -= Math.round(H.cash(p) * 0.1); return ''; } } }
    ]
  });

  E.push({
    id: 'o_friend', cat: 'friend', tier: 'choice', ages: [58, 92], w: 6, cd: 6, icon: '☎️',
    label: '인연', title: '옛 친구의 연락',
    text: '수십 년 만에 학창 시절 친구에게서 연락이 왔다. "얼굴 한번 보자."',
    choices: [
      { id: 'meet', label: '만나러 간다', intent: 'social',
        check: { base: 62, partial: 0, f: [['stat', 'social', 0.2], ['health', 0.2]] },
        out: { success: { t: '밤새 옛날 이야기를 했다. 그때 우리 참 어렸다.', log: '옛 친구와 재회', hp: 10, flag: 'kept_friends', fn: H.friend(72, '옛 친구') }, fail: { t: '약속 날 몸이 아파 나가지 못했다.', hp: -3 } } },
      { id: 'no', label: '전화로 안부만 묻는다', intent: 'rest', out: { t: '목소리를 들은 것만으로도 반가웠다.', hp: 2 } }
    ]
  });

  E.push({
    id: 'o_health_old', cat: 'aging', tier: 'choice', ages: [68, 98], w: 8, cd: 5, icon: '🦯',
    label: '노년', title: '늘어나는 약 봉투',
    text: '무릎이 시리고, 약 봉투가 늘어 간다. 몸이 예전 같지 않다.',
    choices: [
      { id: 'walk', label: '매일 산책을 한다', intent: 'health',
        check: { base: 55, partial: 0, f: [['stat', 'mental', 0.3], ['flag', 'exercise_habit', 12, '평생의 운동 습관']] },
        out: { success: { t: '매일 아침 공원 한 바퀴. 다리에 힘이 붙었다.', eff: { health: 30 }, st: { health: 4 } }, fail: { t: '며칠 하다 넘어질 뻔했다. 무리하지 않기로 했다.', st: { health: -2 } } } },
      { id: 'family', label: '자녀들 곁으로 이사한다', intent: 'family', if: p => H.kids(p).length > 0, out: { t: '아이들 집 근처로 옮겼다. 자주 얼굴을 본다.', rel: { children: 10 }, hp: 6 } },
      { id: 'rest', label: '그냥 순리대로 산다', intent: 'rest', out: { t: '나이 드는 것도 삶의 일부다.', hp: 2 } }
    ]
  });

  E.push({
    id: 'o_reflect', cat: 'aging', tier: 'major', ages: [74, 98], w: 6, max: 1, icon: '🕰️',
    label: '노년', title: '지나온 시간',
    text: '창밖을 보다 지나온 시간이 떠올랐다. 하고 싶은 말이 있다면…',
    choices: [
      { id: 'letter', label: '가족에게 편지를 쓴다', intent: 'family', out: { t: '서툰 글씨로 고맙다고, 사랑한다고 썼다.', log: '가족에게 편지를 씀', rel: { family: 10 }, hp: 8 } },
      { id: 'reconcile', label: '연락이 끊긴 사람에게 먼저 연락한다', intent: 'social',
        check: { base: 50, partial: 0, f: [['stat', 'social', 0.2]] },
        out: { success: { t: '오랜 앙금이 풀렸다. 진작 할 걸 그랬다.', log: '오랜 앙금을 풂', rel: { siblings: 15, friends: 10 }, hp: 10 }, fail: { t: '답장은 오지 않았다. 그래도 마음은 가벼워졌다.', hp: 2 } } },
      { id: 'memoir', label: '자서전을 쓴다', intent: 'education',
        check: { base: 40, partial: 0, f: [['stat', 'creativity', 0.4], ['talent', 'writing', 15]] },
        out: { success: { t: '책으로 엮어 냈다. 손주가 읽고 웃었다.', log: '자서전 출간', achv: 6, exp: 4, hp: 8 }, fail: { t: '몇 장 쓰다 멈췄다. 기억이 자꾸 흐려진다.', hp: -2 } } }
    ]
  });

  // ───────────────────────── 자동 이벤트 ─────────────────────────
  const auto = H.pusher({ tier: 'auto' });

  auto({ id: 'a_sick_child', cat: 'health', ages: [1, 9], w: 4, max: 1, icon: '🤒',
    check: { base: 72, f: [['region', 'medical', 0.4], ['family', 0.3]] },
    out: { success: { t: '심한 폐렴에 걸렸지만 금방 나았다.', st: { health: -2 } }, fail: { t: '오랫동안 병원 신세를 졌다. 몸이 약한 아이로 자랐다.', log: '어린 시절 큰 병치레', major: true, st: { health: -10 } } } });

  auto({ id: 'a_family_trip', cat: 'family', ages: [4, 15], w: 6, cd: 4, max: 2, icon: '🏖️',
    if: p => p.family.tier >= 2,
    auto: { t: p => (p.done.a_family_trip || 0) ? (p.family.tier >= 4 ? '이번 여름엔 가족과 유럽에 다녀왔다. 사진 속 나는 늘 졸린 얼굴이다.' : p.urban ? '가족과 계곡에 텐트를 쳤다. 아버지가 끓인 라면이 세상에서 제일 맛있었다.' : '가족과 서울 구경을 다녀왔다. 지하철이 미로 같았다.') : (p.family.tier >= 4 ? '가족과 해외여행을 다녀왔다. 비행기 창밖 구름이 신기했다.' : '가족과 바다에 다녀왔다. 오래 기억에 남을 여름이다.'), hp: 6, rel: { parents: 4 }, exp: 2 } });

  auto({ id: 'a_parents_divorce', cat: 'family', ages: [6, 17], w: 5, max: 1, icon: '💔',
    // 다툼(c_parents_fight)을 먼저 겪은 뒤에야 이혼이 온다 — 갑작스러운 이혼으로 이야기가 끊기지 않게
    if: p => p.family.tags.indexOf('conflict') >= 0 && !!H.rel(p, 'father') && !!H.rel(p, 'mother') && !!p.done.c_parents_fight && p.age - (p.catLast.family || 0) >= 1,
    auto: { t: '부모님이 이혼하셨다. 집이 갑자기 넓어진 것 같다.', log: '부모님의 이혼', major: true, hp: -14, sr: 14, fn: H.parentsDivorce } });

  auto({ id: 'a_moving', cat: 'family', ages: [5, 14], w: 2, max: 1, icon: '📦',
    auto: { t: '부모님 일 때문에 이사를 갔다. 친구들과 헤어지는 날 많이 울었다.', log: '어린 시절 이사', hp: -6, rel: { friends: -25 }, exp: 2 } });

  auto({ id: 'a_award', cat: 'education', ages: [9, 18], cd: 3, icon: '🏆',
    w: p => p.effort.study > 25 ? 6 : 1,
    check: { base: 30, f: [['eff', 'study', 0.5], ['stat', 'intelligence', 0.3]] },
    out: { success: { t: '교내 경시대회에서 상을 받았다.', achv: 2, hp: 5 }, fail: { skip: true } } });

  auto({ id: 'a_scholarship', cat: 'education', ages: [19, 23], w: 8, max: 1, icon: '🎖️',
    if: p => p.status === 'college' && p.family.tier <= 3,
    check: { base: 30, f: [['stat', 'intelligence', 0.5], ['eff', 'study', 0.35], ['flag', 'good_gpa', 12, '좋은 학점']] },
    out: { success: { t: '성적 장학금을 받았다. 등록금 걱정을 덜었다.', log: '장학금 수혜', flag: 'scholarship', hp: 8 }, fail: { skip: true } } });

  // 우연한 만남 — 선택이 아니라 타인과 우연이 만드는 인연
  auto({ id: 'a_meet_naturally', cat: 'relationship', ages: [21, 45], w: 4, cd: 3, icon: '☂️', card: true, title: '새로운 인연',
    if: p => H.single(p) && p.status !== 'military',
    check: { base: 40, f: [['stat', 'social', 0.4], ['happy', 0.2], ['trait', 'extrovert', 6]] },
    // 만남의 장면을 여러 갈래로 (예전엔 모든 연애가 '비 오는 날 우산'으로 시작했다)
    out: { success: { t: p => LG.RNG.pick(p, [
      '비 오는 날 우산을 같이 쓴 것이 인연이 되어 {partner}와(과) 만나기 시작했다.',
      '친구가 억지로 끌고 간 소개팅 자리였다. 의외로 말이 잘 통한 {partner}와(과) 두 번째 약속을 잡았다.',
      p.job ? '거래처 미팅에서 처음 본 {partner}에게서 먼저 연락이 왔다. 업무 얘기는 금방 끝나고 사적인 얘기가 길어졌다.' : '동네 도서관에서 늘 같은 자리에 앉던 {partner}와(과) 눈인사를 하다가 커피를 마시게 됐다.',
      '동호회 뒤풀이에서 집 방향이 같던 {partner}와(과) 같이 걸었다. 그 길이 자꾸 짧게 느껴졌다.',
      '친구 결혼식 하객석 옆자리였던 {partner}와(과) 연락처를 주고받았다.',
      '반려견 산책길마다 마주치던 {partner}와(과) 어느새 산책을 같이 하게 됐다.',
      '데이팅 앱에서 반신반의하며 만난 {partner}. 첫 만남이 세 시간을 넘겼다.',
      '이사 온 동네 단골 가게에서 자주 마주치던 {partner}와(과) 결국 이름을 묻게 됐다.'
    ]), log: '{partner}와 우연히 만나 연애 시작', major: true, hp: 10, fn: H.lover() }, fail: { skip: true } } });

  auto({ id: 'a_coworker', cat: 'social', ages: [22, 60], w: 3, cd: 8, max: 4, icon: '☕',
    if: p => !!p.job,
    auto: { t: p => LG.RNG.pick(p, ['새로 온 동료와 금방 친해졌다. 점심시간이 즐거워졌다.', '옆 부서 사람과 엘리베이터에서 말을 텄다. 이제 커피 한 잔 같이 마시는 사이다.', '프로젝트를 같이 하다 보니 동료와 가까워졌다. 퇴근 후 맥주 한 잔이 일상이 되었다.', '회식 2차에서 동료와 속 깊은 이야기를 나눴다. 이후 서로 든든한 편이 되었다.']), hp: 3, fn: H.friend(60, '직장 동료') } });

  // 친구 결혼식: 아직 결혼하지 않은 친구가 결혼한다 (예전엔 늘 '첫 친구'가 몇 번이고 결혼했다)
  const singleFriend = p => LG.Rel.all(p, 'friend').find(f => !f.married);
  auto({ id: 'a_friend_wedding', cat: 'social', ages: [26, 42], w: 3, cd: 4, icon: '💐',
    if: p => !!singleFriend(p), who: singleFriend,
    auto: { t: p => LG.RNG.pick(p, ['{who}의 결혼식에서 축가를 불렀다. 떨려서 음이 하나 나갔다.', '{who}의 결혼식 사회를 봤다. 대본을 세 번이나 고쳤다.', '{who}의 결혼식에서 부케를 받았다. 다들 다음은 너라며 웃었다.', '{who}이(가) 결혼했다. 신랑 신부 입장 때 괜히 코끝이 찡했다.']),
      rel: { friends: 4 }, hp: 3, fn: p => { const f = p.ctx && p.people.find(n => n.id === p.ctx.who); if (f) f.married = true; return ''; } } });

  auto({ id: 'a_pet_bye', cat: 'family', ages: [8, 35], w: p => has(p, 'pet') && p.age - p.flags.pet >= ({ 햄스터: 3, 고양이: 14 }[(p.pet || {}).kind] || 11) ? 20 : 0, max: 1, icon: '🌈',
    if: p => has(p, 'pet'),
    auto: { t: p => `${(p.pet || { name: '콩이' }).name}이(가) 무지개다리를 건넜다. 한참을 울었다.`, log: p => `${(p.pet || { kind: '반려견' }).kind} ${(p.pet || { name: '콩이' }).name}과(와) 이별`, major: true, hp: -12, unflag: 'pet' } });

  auto({ id: 'a_bonus', cat: 'money', ages: [24, 62], w: 3, cd: 5, max: 4, icon: '💵',
    if: p => !!p.job && ['office_big', 'developer', 'researcher', 'office_small', 'technician', 'lawyer', 'doctor'].indexOf(p.job.id) >= 0,
    check: { base: 38, f: [['perf', 0.6]] },
    out: { success: { t: '', hp: 6, fn: p => { const a = Math.round(LG.Economy.salary(p) * 0.15 / 10) * 10; p.money += a; return [`성과급 ${LG.U.money(a)}원이 나왔다!`, `올해 고생한 보람이 있었다. 성과급 ${LG.U.money(a)}원.`, `팀 성과가 좋았다. 성과급 ${LG.U.money(a)}원이 들어왔다.`, `성과급 ${LG.U.money(a)}원. 그동안 미뤄 둔 걸 하나 질렀다.`][(p.done.a_bonus || 0) % 4]; } }, fail: { skip: true } } });

  auto({ id: 'a_parent_support', cat: 'family', ages: [30, 60], w: 3, max: 1, icon: '🧧',
    if: p => !!p.job && p.family.tier <= 2 && LG.Rel.parents(p).length > 0 && !has(p, 'supporting_parents'),
    auto: { t: '부모님 생활비를 조금씩 보내드리기 시작했다.', log: '부모님 생활비 지원', flag: 'supporting_parents', rel: { parents: 8 } } });

  auto({ id: 'a_return_home', cat: 'travel', queued: true, icon: '🛬',
    auto: { t: '해외 근무를 마치고 돌아왔다. 김치찌개가 이렇게 맛있었나.', log: '해외 근무를 마치고 귀국', unflag: 'abroad_alone', exp: 3 } });

  auto({ id: 'a_child_teen', cat: 'child', ages: [40, 65], w: 4, max: 1, icon: '🚪',
    if: p => H.kids(p).some(c => c.age >= 13 && c.age <= 17),
    child: p => H.kids(p).find(c => c.age >= 13 && c.age <= 17),
    auto: { t: '{child}이(가) 사춘기를 심하게 앓고 있다. 방문이 쾅 닫힌다.', rel: { children: -6 }, sr: 6 } });

  auto({ id: 'a_child_proud', cat: 'child', ages: [45, 80], w: 3, max: 1, icon: '🥇',
    if: p => H.kids(p).some(c => c.age >= 22 && c.age <= 35 && c.rel >= 60),
    child: p => H.kids(p).find(c => c.age >= 22 && c.age <= 35 && c.rel >= 60),
    auto: { t: '{child}이(가) 첫 월급으로 용돈을 보내왔다. 괜히 눈물이 났다.', hp: 10, rel: { children: 4 } } });

  // 사고 — 크게 다치면 그해 '회복을 어떻게 할지' 선택(hl_accident)이 이어진다
  auto({ id: 'a_accident', cat: 'accident', ages: [16, 85], rate: p => 0.012 + (p.age > 70 ? 0.008 : 0), cd: 12, icon: '🚑', card: true, title: '사고',
    check: { base: 70, partial: 0.5, f: [['fn', p => p.age > 70 ? { label: '나이', v: -(p.age - 70) } : null], ['stat', 'physical', 0.15]] },
    out: {
      success: { t: p => LG.RNG.pick(p, ['접촉 사고가 났다. 크게 다치진 않았지만 목과 허리가 한동안 뻐근했다.', '빗길에 미끄러져 넘어졌다. 멍이 든 정도로 끝났다.', '횡단보도에서 아찔한 순간이 있었다. 다치진 않았지만 한동안 가슴이 뛰었다.']), st: { health: -3 }, sr: 4, hp: -2 },
      partial: { t: '빙판길에 넘어져 다리가 부러졌다. 석 달을 깁스로 지냈다. 출퇴근도, 집안일도 남의 손을 빌려야 했다.', log: '골절 사고', major: true, st: { health: -8, physical: -2 }, money: -150, hp: -6, sr: 5 },
      fail: { t: '교통사고로 크게 다쳤다. 수술을 두 번 받고 몇 달을 병원에서 보냈다.', log: '큰 교통사고', major: true, st: { health: -18, physical: -4 }, money: -800, hp: -14, sr: 12, flag: 'injured', next: 'hl_accident' }
    } });

  auto({ id: 'a_disaster', cat: 'crisis', ages: [10, 90], rate: 0.004, max: 1, icon: '🌀', card: true, title: '태풍',
    auto: { t: '큰 태풍이 지나갔다. 동네가 물에 잠겼다. 아무도 피할 수 없는 일이었다.', log: '태풍 피해', major: true, money: -500, hp: -8 } });

  // 로또 1등 — 실제 1등 당첨금은 회차마다 다르지만 세후 십수억 원대. 당첨 직후 '이 돈을 어떻게 할지'를 고른다(m_lottery)
  auto({ id: 'a_lottery', cat: 'opportunity', ages: [20, 85], rate: 0.0005, max: 1, icon: '🎰', card: true, title: '로또 1등',
    auto: { t: '', log: '로또 1등 당첨', major: true, hp: 20, next: 'm_lottery', fn: p => { const v = Math.round(LG.RNG.float(p, 11, 24)) * 10000; p.money += v; p.lotto = v; return `토요일 밤, 번호 여섯 개가 모두 맞았다. 세금을 떼고 ${LG.U.money(v)}원. 손이 떨려 한참을 앉아 있었다.`; } } });

  // 로또 2·3·4등 — 1등보다 훨씬 흔한 '작은 당첨'. 등수에 따라 금액과 기쁨이 다르다 (실제 평균 당첨금 기준: 2등 5~8천만, 3등 150만, 4등 5만)
  auto({ id: 'a_lotto_2nd', cat: 'opportunity', ages: [20, 85], rate: 0.0008, max: 1, icon: '🎟️', card: true, title: '로또 2등',
    auto: { t: '', log: p => `로또 2등 당첨 (+${LG.U.money(p.lotto2 || 0)}원)`, major: true, hp: 10, sr: -3, fn: p => { const v = LG.RNG.int(p, 50, 80) * 100; p.money += v; p.lotto2 = v; return `번호 다섯 개와 보너스 번호가 맞았다. 로또 2등, 세금을 떼고 ${LG.U.money(v)}원! 1등은 아니어도 심장이 한참 뛰었다.`; } } });
  auto({ id: 'a_lotto_small', cat: 'opportunity', ages: [20, 85], rate: 0.012, max: 4, cd: 3, icon: '🎟️',
    auto: { t: '', fn: p => {
      if (LG.RNG.chance(p, 0.3)) { const v = LG.RNG.int(p, 120, 170); p.money += v; LG.State.addStat(p, 'happy', 4); return `로또 3등에 당첨됐다. ${LG.U.money(v)}원. 큰돈은 아니지만 일주일 내내 기분이 좋았다.`; }
      p.money += 5; LG.State.addStat(p, 'happy', 1); return '로또 4등, 5만 원. 다음 주 복권 값이 생겼다.';
    } } });

  // 즉석복권·연금복권 같은 작은 행운
  auto({ id: 'a_scratch', cat: 'opportunity', ages: [20, 85], rate: 0.004, max: 2, icon: '🎫',
    auto: { t: p => { const v = LG.RNG.pick(p, [500, 1000, 2000]); p.money += v; return `편의점에서 긁은 즉석복권이 ${LG.U.money(v)}원에 당첨됐다. 오늘 저녁은 내가 쏜다.`; }, hp: 8 } });

  auto({ id: 'a_inherit_rare', cat: 'opportunity', ages: [30, 75], rate: 0.0015, max: 1, icon: '✉️', card: true,
    if: p => p.family.tier <= 3,
    auto: { t: '연락이 끊겼던 먼 친척이 재산을 남겼다는 편지가 왔다.', log: '뜻밖의 상속', major: true, money: 5000, hp: 8 } });

  auto({ id: 'a_grandparent_bye', cat: 'family', ages: [8, 30], w: 3, max: 1, icon: '🕯️',
    if: p => !p.family.tags.includes('with_grandparents'),
    auto: { t: '시골 할머니께서 돌아가셨다. 장례식장에서 처음으로 아버지가 우는 걸 봤다.', log: '할머니와의 이별', hp: -6 } });
})(window.LG = window.LG || {});
