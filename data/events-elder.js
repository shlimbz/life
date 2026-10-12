/* 이벤트 — 노년(60~90대): 사별, 손주, 간병, 기억, 유언, 부고, 재개발, 노인 일자리, 늦깎이 공부, 마지막 회고 */
(function (LG) {
  const E = LG.DATA.events;
  const H = LG.EH, has = H.has, anyFlag = H.anyFlag;
  const S = H.S;
  const spouse = H.spouse;
  const kidsAlive = H.kidsAlive;
  const ch = H.pusher({ tier: 'choice', w: 14, max: 1, cat: 'aging', label: '노년' });

  // ───── 손주 돌봄 ─────
  ch({
    id: 'o_grand_care', ages: [55, 80], w: 22, icon: '🧸', cat: 'family', label: '가족',
    if: p => has(p, 'grandparent') && !has(p, 'grand_care_decided'),
    child: p => H.kids(p).find(c => c.grandkid) || H.kids(p)[0],
    title: '손주 좀 봐 주실래요?', text: '{child}이(가) 조심스럽게 말을 꺼냈다. "어린이집 끝나고 저녁까지만… 저희 둘 다 야근이 많아서요."',
    choices: [
      { id: 'daily', label: '매일 맡아 준다', intent: 'family',
        out: { t: '등하원과 저녁 밥이 내 일과가 되었다. 허리는 아파도 손주의 "할머니(할아버지)!" 소리에 하루가 간다.', log: '손주를 매일 돌봄', flag: 'grand_care_decided', rel: { children: 14 }, hp: 10, sr: 6, st: { health: -3 }, money: 300 } },
      { id: 'weekend', label: '주말에만 봐 준다', intent: 'stability', out: { t: '주말마다 손주가 온다. 적당한 거리가 서로에게 좋다.', flag: 'grand_care_decided', rel: { children: 6 }, hp: 7 } },
      { id: 'no', label: '내 노후도 소중하다며 거절한다', intent: 'independence', out: { t: '미안했지만 솔직하게 말했다. 아이는 서운해했지만 이해해 주었다.', flag: 'grand_care_decided', rel: { children: -6 }, hp: 2, sr: -4 } }
    ]
  });

  // ───── 혼자 남은 삶 ─────
  ch({
    id: 'o_widow_life', ages: [55, 95], w: 26, icon: '🌙', cat: 'family', label: '가족',
    if: p => has(p, 'widowed') && !spouse(p) && !has(p, 'widow_decided'),
    title: '혼자 남은 집', text: '두 사람이 쓰던 식탁에 숟가락 하나만 놓인다. 텔레비전 소리를 일부러 크게 틀어 둔다.',
    choices: [
      { id: 'kids', label: '자녀 집 근처로 이사한다', intent: 'family', if: p => kidsAlive(p).length > 0,
        out: { t: '아이 집에서 걸어서 10분 거리로 옮겼다. 손주들이 수시로 들락거린다.', log: '사별 후 자녀 곁으로 이사', flag: 'widow_decided', rel: { children: 10 }, hp: 10 } },
      { id: 'center', label: '복지관에 나가 사람들을 만난다', intent: 'social',
        out: { t: '서예반과 노래교실에 등록했다. 같은 처지의 친구들이 생겼다.', log: '복지관에서 새 친구들을 사귐', flag: 'widow_decided', hp: 10, st: { social: 2 }, fn: H.friend(62, '복지관 친구') } },
      { id: 'love', label: '다시 누군가를 만나 볼 용기를 낸다', intent: 'love', if: p => p.age <= 85,
        check: { base: 30, partial: 0.3, f: [['stat', 'social', 0.3], ['health', 0.2], ['flag', 'late_love', 8, '늦게라도 사랑해 본 경험']] },
        out: { success: { t: '공원에서 매일 마주치던 사람과 차를 마시기 시작했다. 자식들은 놀랐지만 결국 웃어 주었다.', log: '황혼의 새 인연', flag: ['widow_decided', 'late_love'], hp: 14, fn: H.lover({}) },
          fail: { t: '아직은 아니었다. 그 사람의 빈자리가 너무 컸다.', flag: 'widow_decided', hp: -2 } } },
      { id: 'alone', label: '혼자 꿋꿋이 지낸다', intent: 'independence', out: { t: '아침마다 그 사람 사진에 인사하고 하루를 시작한다.', flag: 'widow_decided', hp: 2, st: { mental: 2 } } }
    ]
  });

  // ───── 배우자 간병 ─────
  ch({
    id: 'o_care_spouse', ages: [62, 95], w: 18, icon: '🩺', cat: 'family', label: '가족',
    if: p => { const s = spouse(p); return !!s && (s.health < 42 || s.age >= 78) && !has(p, 'spouse_care_decided'); },
    title: '{spouse}의 기억', text: p => `{spouse}이(가) 같은 질문을 몇 번씩 한다. 병원에서 "초기 치매"라는 말을 들었다. ${kidsAlive(p).length ? '아이들은 각자 바쁘다.' : '도와줄 사람이 없다.'}`,
    choices: [
      { id: 'home', label: '집에서 내가 돌본다', intent: 'family',
        check: { base: 46, partial: 0.4, f: [['health', 0.35], ['stat', 'mental', 0.3], ['rel', 'spouse', 0.2]] },
        out: { success: { t: '하루하루가 전쟁 같지만, 가끔 {spouse}이(가) 내 이름을 부르며 웃는다. 그 하루로 버틴다.', log: '배우자를 집에서 간병함', flag: 'spouse_care_decided', rel: { spouse: 12 }, hp: 2, sr: 18, st: { health: -5 } },
          fail: { t: '간병하다 내가 먼저 쓰러졌다. 혼자서는 무리였다.', flag: 'spouse_care_decided', hp: -10, sr: 22, st: { health: -10 } } } },
      { id: 'facility', label: '좋은 요양원을 알아본다', intent: 'stability',
        out: { t: '매일 면회를 간다. 죄책감과 안도감이 같이 밀려온다.', log: '배우자를 요양원에 모심', flag: 'spouse_care_decided', money: -1500, hp: -4, sr: -6 } },
      { id: 'share', label: '자녀들과 순번을 정해 함께 돌본다', intent: 'family', if: p => kidsAlive(p).length > 0,
        check: { base: 48, partial: 0.4, f: [['rel', 'child', 0.4], ['fn', p => ({ label: '자녀 수', v: (kidsAlive(p).length - 1) * 8 })]] },
        out: { success: { t: '아이들이 주말마다 번갈아 왔다. 가족이 다시 한 식탁에 모였다.', flag: 'spouse_care_decided', rel: { children: 8, spouse: 6 }, hp: 4, sr: 8 },
          fail: { t: '누가 더 많이 하느냐로 아이들끼리 다투기 시작했다. 마음이 더 무거워졌다.', flag: 'spouse_care_decided', rel: { children: -8 }, hp: -6, sr: 14 } } }
    ]
  });

  // ───── 나의 기억 ─────
  ch({
    id: 'o_memory', ages: [70, 98], w: 12, icon: '🧩',
    if: p => p.stats.health < 70 || p.age >= 78,
    title: '자꾸 깜빡한다', text: '가스 불을 켜 둔 채 외출했다. 열쇠를 냉장고에서 찾았다. 웃어넘기기엔 조금 무섭다.',
    choices: [
      { id: 'test', label: '바로 검사를 받는다', intent: 'health',
        check: { base: 58, partial: 0.4, f: [['health', 0.3], ['region', 'medical', 0.2], ['flag', 'exercise_habit', 8, '평생의 운동 습관']] },
        out: { success: { t: '경도인지장애. 일찍 알아서 다행이라고 했다. 약과 운동, 그리고 매일 일기를 쓰기로 했다.', log: '기억력 저하를 일찍 발견', hp: 2, st: { health: 2 } },
          fail: { t: '치매 진단을 받았다. 남은 기억이 있을 때 가족에게 하고 싶은 말을 적어 두기로 했다.', log: '치매 진단', major: true, hp: -14, st: { health: -6, intelligence: -6 }, fn: p => { (p.dz = p.dz || {}).dementia = true; return ''; } } } },
      { id: 'brain', label: '퍼즐·외국어·악기로 머리를 쓴다', intent: 'education', out: { t: '손주에게 배운 앱으로 매일 단어를 외운다. 머리가 바빠지니 마음도 젊어졌다.', hp: 6, st: { intelligence: 1 } } },
      { id: 'ignore', label: '나이 들면 다 그렇다', intent: 'rest', out: { t: '대수롭지 않게 넘겼다.', hp: 0, st: { health: -2 } } }
    ]
  });

  // ───── 유언 ─────
  ch({
    id: 'o_will', ages: [70, 98], w: 14, icon: '✒️', cat: 'money', label: '정리',
    if: p => !has(p, 'will_written'),
    title: '유언장', text: p => `변호사 사무실에서 유언장 양식을 받아 왔다. ${has(p, 'gave_estate') ? '재산은 이미 아이들에게 나눠 줬다. 남은 건 마음을 정리하는 일이다.' : has(p, 'donor') ? '전에 기부했던 장학금 이야기가 떠올랐다.' : '남은 것을 어떻게 나눌지, 그리고 무엇을 남길지.'}`,
    choices: [
      { id: 'kids', label: '자녀들에게 공평하게 나눈다', intent: 'family', if: p => kidsAlive(p).length > 0 && !has(p, 'gave_estate'),
        out: { t: '숫자를 몇 번이나 다시 맞췄다. 공평하다는 게 이렇게 어려운 일인 줄 몰랐다.', log: '유언장을 씀', flag: 'will_written', rel: { children: 6 }, hp: 6 } },
      { id: 'give', label: '일부를 사회에 기부하기로 한다', intent: 'social',
        out: { t: '내 이름이 붙은 장학금이 생긴다고 생각하니 마음이 따뜻해졌다.', log: p => has(p, 'donor') ? '두 번째 기부를 약속함' : '유산 기부를 약속함', flag: ['will_written', 'donor'], achv: 5, hp: 10, fn: p => { const a = Math.round(Math.max(0, p.money) * 0.25 / 100) * 100; p.money -= a; return a > 0 ? `${LG.U.money(a)}원을 약정했다.` : ''; } } },
      { id: 'letter', label: '돈보다 편지를 남긴다', intent: 'family', out: { t: '재산 목록 대신 한 사람 한 사람에게 편지를 썼다.', log: '가족에게 마지막 편지를 남김', flag: 'will_written', rel: { family: 10 }, hp: 8 } },
      { id: 'spend', label: '다 쓰고 간다', intent: 'rest', out: { t: '"자식들은 자기 힘으로 살 거다." 남은 돈으로 하고 싶던 여행을 예약했다.', flag: 'will_written', hp: 10, exp: 4, money: -800 } }
    ]
  });

  // ───── 부고 ─────
  ch({
    id: 'o_obituary', ages: [62, 98], w: 12, cd: 6, max: 3, icon: '🖤', cat: 'friend', label: '인연',
    title: '부고 문자', text: p => `휴대폰에 부고 문자가 왔다. ${LG.Rel.all(p, 'friend')[0] ? '{friend}의 이름이었다.' : '학창 시절 짝꿍의 이름이었다.'} 요즘 이런 문자가 부쩍 잦다.`,
    choices: [
      { id: 'go', label: '먼 길이라도 조문을 간다', intent: 'social',
        out: { t: '영정 사진 속 얼굴은 내 기억보다 훨씬 늙어 있었다. 오랜만에 만난 친구들과 "우리도 얼마 안 남았다"며 웃었다.', log: '친구를 떠나보냄', hp: -4, rel: { friends: 6 }, st: { mental: 1 } } },
      { id: 'prepare', label: '나도 하나씩 정리를 시작한다', intent: 'stability', out: { t: '사진첩을 정리하고, 연락처를 정리했다. 남은 날들이 더 선명해졌다.', hp: 2, sr: -4 } },
      { id: 'flower', label: '조화만 보낸다', intent: 'rest', out: { t: '마음만 보냈다. 저녁 내내 그 친구 생각이 났다.', hp: -3 } }
    ]
  });

  // ───── 재개발 ─────
  ch({
    id: 'o_redevelop', ages: [50, 88], w: 12, icon: '🏗️', cat: 'housing', label: '동네',
    if: p => p.liveIn !== 'abroad' && (has(p, 'home_owner') || !!p.house || has(p, 'jeonse_fraud') || p.age >= 60),
    title: '우리 동네 재개발', text: p => p.house ? `평생 살던 동네에 재개발 확정 현수막이 걸렸다. ${p.house.label}의 보상 문제로 주민 회의가 열린다.` : has(p, 'jeonse_fraud') ? '세 들어 사는 동네가 재개발된다. 전세 사기를 당했던 기억에 등골이 서늘하다.' : '살던 동네가 재개발된다. 세입자인 나는 이사 갈 곳부터 알아봐야 한다.',
    choices: [
      { id: 'cash', label: '보상금을 받고 떠난다', intent: 'money', if: p => !!p.house,
        out: { t: '보상금을 받아 조용한 동네로 옮겼다. 이웃들과는 뿔뿔이 흩어졌다.', log: '재개발 보상을 받고 이사', rel: { friends: -6 }, hp: 2, fn: p => { const v = Math.round(p.house.value * 1.15); p.money += v; p.house = null; p.home = 'rent'; return `${LG.U.money(v)}원을 손에 쥐었다.`; } } },
      { id: 'stay', label: '분담금을 내고 새 아파트에 들어간다', intent: 'stability', if: p => !!p.house,
        check: { base: 50, partial: 0.4, f: [['assets', 0.4], ['ageOver', 75, 1.5]] },
        out: { success: { t: '공사 기간을 버티고 새 아파트에 입주했다. 이 나이에 새집이라니.', log: '재개발 새 아파트 입주', hp: 10, fn: p => { p.house.value = Math.round(p.house.value * 1.5); p.debt += Math.round(p.house.value * 0.12); return ''; } },
          fail: { t: '분담금이 감당되지 않았다. 결국 입주권을 팔았다.', hp: -8, sr: 12, fn: p => { p.money += Math.round(p.house.value * 1.05); p.house = null; p.home = 'rent'; return ''; } } } },
      { id: 'move', label: '세입자로서 조용히 이사한다', intent: 'stability', if: p => !p.house,
        out: { t: '이삿짐을 싸며 30년 동네와 작별했다. 새 동네는 낯설다.', money: -300, hp: -6, rel: { friends: -4 } } },
      { id: 'fight', label: '주민들과 함께 목소리를 낸다', intent: 'social',
        check: { base: 36, partial: 0.4, f: [['stat', 'social', 0.3], ['flag', 'stood_up', 10, '맞서 본 경험'], ['flag', 'jeonse_fraud', 6, '당해 본 사람의 절박함']] },
        out: { success: { t: '대책 위원회가 이주비와 임대주택을 얻어 냈다. 동네 사람들이 나를 "위원장님"이라고 부른다.', log: '재개발 주민 대책 활동', hp: 10, rel: { friends: 8 }, achv: 3, money: 400 },
          fail: { t: '몇 달을 싸웠지만 바뀐 건 없었다. 지치기만 했다.', hp: -6, sr: 14 } } }
    ]
  });

  // ───── 노인 일자리 ─────
  ch({
    id: 'o_senior_job', ages: [64, 82], w: 14, icon: '🧹', cat: 'retirement', label: '은퇴 후',
    if: p => p.status === 'retired' && !p.job,
    title: '다시 일하고 싶다', text: p => `연금만으로는 ${LG.State.netWorth(p) < 5000 ? '빠듯하다.' : '심심하다.'} 주민센터 게시판에 노인 일자리 공고가 붙었다.`,
    choices: [
      { id: 'guard', label: '아파트 경비·주차 관리를 한다', intent: 'money', out: { t: '새벽 교대 근무가 고되지만, 매달 들어오는 월급이 든든하다.', log: '노인 일자리(경비)', money: 1500, st: { health: -2 }, hp: 2, sr: 6 } },
      { id: 'talent', label: '평생 해 온 일로 재능 기부를 한다', intent: 'social', out: { t: '젊은 창업자들에게 경험을 나눠 준다. "선생님" 소리가 쑥스럽다.', log: '경험을 나누는 재능 기부', achv: 3, hp: 10, rel: { friends: 4 } } },
      { id: 'park', label: '공원 환경 지킴이를 한다', intent: 'health', out: { t: '하루 세 시간, 공원을 걷고 쓰레기를 줍는다. 다리가 튼튼해졌다.', money: 300, hp: 6, st: { health: 2 } } },
      { id: 'no', label: '이제는 쉬는 게 내 일이다', intent: 'rest', out: { t: '빈 시간이 아깝지 않다. 이 나이에 누리는 여유다.', hp: 3 } }
    ]
  });

  // ───── 늦깎이 공부 ─────
  ch({
    id: 'o_late_study', ages: [60, 85], w: 10, icon: '🎒', cat: 'study', label: '배움',
    if: p => p.status === 'retired' || p.age >= 66,
    title: '늦깎이 학생', text: p => `${p.edu === 'college' || p.edu === 'grad' ? '평생 배우고 싶던 분야가 따로 있었다.' : '못 다닌 학교가 평생 마음에 걸렸다.'} 방송통신대·평생교육원 모집 공고가 눈에 들어왔다.`,
    choices: [
      { id: 'go', label: '입학 원서를 낸다', intent: 'education',
        check: { base: 50, partial: 0.4, f: [['stat', 'intelligence', 0.25], ['health', 0.25], ['stat', 'mental', 0.2]] },
        out: { success: { t: '손주뻘 동기들과 조별 과제를 했다. 4년 뒤 학사모를 썼다.', log: '늦깎이 졸업', major: true, achv: 6, exp: 6, hp: 14, st: { intelligence: 2 } },
          partial: { t: '졸업은 못 했지만 배운 것이 많다.', exp: 4, hp: 6 }, fail: { t: '눈이 침침해 책 읽기가 힘들었다. 한 학기 만에 그만뒀다.', hp: -3 } } },
      { id: 'phone', label: '스마트폰·키오스크부터 제대로 배운다', intent: 'education', out: { t: '키오스크 앞에서 쩔쩔매던 내가 이제는 친구들에게 가르쳐 준다.', hp: 6, st: { intelligence: 1 }, rel: { friends: 3 } } },
      { id: 'no', label: '이제 와서 무슨 공부냐', intent: 'rest', out: { t: '마음만 먹고 접었다.', hp: -1 } }
    ]
  });

  // ───── 마지막 회고: 가장 후회되는 선택 ─────
  const regret = p => (p.cross || []).filter(x => x.ty === 'fail').sort((a, b) => b.w - a.w)[0] || (p.cross || []).slice().sort((a, b) => b.w - a.w)[0];
  ch({
    id: 'o_regret', ages: [76, 104], w: 18, icon: '🕯️', tier: 'major', label: '회고',
    if: p => !!regret(p) && (p.stats.health < 45 || p.age >= 82),
    title: p => regret(p).ty === 'fail' ? '가장 후회되는 선택' : '오래 마음에 남은 선택', text: p => { const x = regret(p); return `밤이 길다. 자꾸 ${x.a}세의 그날이 떠오른다. "${x.ti}" 앞에서 "${x.ch}"를 골랐던 날. 그때 다른 길을 갔다면 지금 나는 어디에 있을까.`; },
    choices: [
      { id: 'accept', label: '그 선택이 지금의 나를 만들었다', intent: 'stability', out: { t: '후회도 내 인생의 일부였다. 그 길 끝에서 만난 사람들이 있었다.', log: '지나온 선택들과 화해함', hp: 14, sr: -14, st: { mental: 3 } } },
      { id: 'tell', label: '젊은 가족에게 그 이야기를 들려준다', intent: 'family', out: { t: '"너는 너무 겁내지 마라." 손주가 진지하게 고개를 끄덕였다.', log: '후회를 지혜로 물려줌', rel: { family: 8 }, hp: 10 } },
      { id: 'sigh', label: '다시 돌아간다면 다르게 할 것이다', intent: 'rest', out: { t: '한숨이 길었다. 그래도 그때의 나는 최선을 다했을 것이다.', hp: -2 } }
    ]
  });

  // ───── 노년의 빚 정리 (개인파산·면책, 기초생활 보장) ─────
  E.push({
    id: 'o_debt_relief', cat: 'money', tier: 'choice', ages: [60, 99], w: 40, max: 1, icon: '⚖️', label: '정리',
    if: p => p.debt > 0 && LG.State.netWorth(p) < 0 && p.debt > Math.max(1500, (p.lastIncome || 0) * 2),
    title: '갚을 수 없는 빚', text: p => `빚이 ${LG.U.money(p.debt)}원 남았다. 연금으로는 이자도 버겁다. 법률구조공단 상담사가 "파산·면책 제도가 있다"고 알려 주었다.`,
    choices: [
      { id: 'bankrupt', label: '파산·면책을 신청한다', intent: 'stability',
        check: { base: 70, partial: 0.3, f: [['ageOver', 70, -0.6]] },
        out: { success: { t: '면책 결정이 났다. 독촉 전화가 끊긴 첫날, 오랜만에 깊이 잤다.', log: '노년에 빚을 정리함', flag: 'debt_cleared', hp: 12, sr: -20, fn: p => { p.debt = Math.round(p.debt * 0.05); return ''; } },
          partial: { t: '일부만 면책되었다. 그래도 숨통이 트였다.', flag: 'debt_cleared', hp: 6, sr: -10, fn: p => { p.debt = Math.round(p.debt * 0.4); return ''; } },
          fail: { t: '서류가 반려됐다. 다시 준비해야 한다.', sr: 8 } } },
      { id: 'kids', label: '자녀에게 털어놓는다', intent: 'family', if: p => LG.Rel.all(p, 'child').some(c => c.alive && c.age >= 25),
        out: { t: '부끄러웠지만 털어놨다. 아이들이 조금씩 나눠 갚아 주기로 했다.', flag: 'debt_cleared', rel: { children: -4 }, hp: 4, sr: -12, fn: p => { p.debt = Math.round(p.debt * 0.5); return ''; } } },
      { id: 'endure', label: '조금씩이라도 내 힘으로 갚는다', intent: 'independence', out: { t: '매달 조금씩 갚는다. 끝이 보이지 않지만 포기하지 않는다.', sr: 8, hp: -4 } }
    ]
  });
})(window.LG = window.LG || {});
