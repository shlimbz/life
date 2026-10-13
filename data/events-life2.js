/* 생활의 갈림길 2 — 30~50대와 노년에 '선택 없는 해'가 길게 이어지던 구간을 채우는 일상의 선택들.
   특정 진로·재능과 상관없이 누구에게나 올 수 있는 장면들이다. */
(function (LG) {
  'use strict';
  const H = LG.EH, has = H.has;
  const S = () => LG.State;
  const M = v => LG.U.money(v);
  const ch = H.pusher({ tier: 'choice', w: 10, max: 1 });
  const kidsAt = (p, a, b) => LG.Rel.all(p, 'child').filter(c => c.age >= a && c.age <= b);

  // ───────────────── 30~50대 ─────────────────
  ch({
    id: 'lf_recital', cat: 'family', ages: [32, 52], w: 9, icon: '🎭', label: '일과 가족',
    if: p => !!p.job && kidsAt(p, 6, 12).length > 0,
    child: p => kidsAt(p, 6, 12)[0],
    title: '{child}의 학예회', text: '{child}이(가) 학예회에서 주인공을 맡았다며 몇 주째 연습 중이다. 그런데 그날 오후, 놓치기 어려운 회의가 잡혔다.',
    choices: [
      { id: 'go', label: '반차를 내고 맨 앞줄에 앉는다', intent: 'family',
        out: { t: '무대 위에서 나를 찾던 눈이 마주쳤다. 아이가 대사를 하다 말고 손을 흔들었다.', log: '아이의 학예회에 감', rel: { children: 10 }, hp: 8, perf: -4, flag: 'family_time' } },
      { id: 'video', label: '회의에 가고, 영상으로 본다', intent: 'career',
        out: { t: '회의는 잘 끝났다. 밤에 영상을 돌려 보는데, 객석을 두리번거리는 아이 얼굴이 마음에 걸렸다.', rel: { children: -4 }, perf: 6, hp: -2 } },
      { id: 'swap', label: '{spouse}에게 부탁하고 저녁엔 꽃다발을 산다', intent: 'family', if: p => !!H.spouse(p),
        out: { t: '꽃다발을 받은 아이가 "다음엔 꼭 와"라며 새끼손가락을 내밀었다.', rel: { children: 4, spouse: 2 }, money: -5 } }
    ]
  });

  ch({
    id: 'lf_relocation', cat: 'career', ages: [33, 54], w: 7, icon: '🚄', label: '커리어',
    if: p => H.jobIn(p, ['office_big', 'civil', 'engineer', 'office_small', 'researcher', 'factory']) && p.job.years >= 4 && p.liveIn !== 'abroad',
    title: '지방 발령', text: p => `회사가 지방 사업장으로 발령을 냈다. ${H.spouse(p) ? '가족이 다 같이 내려가거나, 나 혼자 주말마다 오가거나.' : '아는 사람 하나 없는 도시다.'} 거절하면 평가에 남는다고 한다.`,
    choices: [
      { id: 'all', label: p => H.spouse(p) ? '가족이 함께 내려간다' : '짐을 싸서 내려간다', intent: 'adventure',
        out: { t: p => H.spouse(p) ? '아이들은 처음엔 울었지만 한 학기 만에 새 친구를 데려왔다. 집이 넓어졌고 출퇴근이 짧아졌다.' : '낯선 도시의 밤길을 걷는 게 습관이 됐다. 생각보다 괜찮다.', log: '지방 발령을 받아들임', perf: 6, hp: 2, sr: -2, rel: { friends: -6 }, exp: 4 } },
      { id: 'alone', label: '혼자 내려가 주말 부부로 지낸다', intent: 'career', if: p => !!H.spouse(p),
        out: { t: '금요일 밤 고속버스, 일요일 밤 다시 고속버스. 통장은 두둑해졌지만 집에 오면 내가 손님 같다.', log: '주말 부부 생활', perf: 8, money: 300, rel: { spouse: -8, children: -6 }, sr: 6, flag: 'workaholic' } },
      { id: 'refuse', label: '발령을 거절한다', intent: 'stability',
        check: { base: 50, partial: 0, f: [['perf', 0.4], ['jobYears', 1, 12]] },
        out: { success: { t: '면담 끝에 발령이 없던 일이 됐다. 다만 팀장의 눈빛이 예전 같지 않다.', perf: -5 },
          fail: { t: '거절은 받아들여졌지만 그해 평가에서 최하점을 받았다.', perf: -14, hp: -6, sr: 8 } } }
    ]
  });

  ch({
    id: 'lf_noise', cat: 'housing', ages: [27, 78], w: 6, icon: '🔊', label: '이웃',
    if: p => p.home !== 'parents' && p.home !== 'barracks' && p.home !== 'dorm' && p.liveIn !== 'abroad',
    title: '층간소음', text: '밤 11시, 위층에서 또 쿵쿵 소리가 울린다. 벌써 석 달째다. 오늘은 잠을 포기해야 할 것 같다.',
    choices: [
      { id: 'talk', label: '간식거리를 들고 올라가 정중히 말한다', intent: 'social',
        check: { base: 52, partial: 0.4, f: [['stat', 'social', 0.35], ['stat', 'mental', 0.15]] },
        out: { success: { t: '문을 연 건 아이 셋을 키우는 젊은 부부였다. 매트를 깔겠다며 오히려 미안해했다. 그 뒤로 엘리베이터에서 인사하는 사이가 됐다.', hp: 6, sr: -6, st: { social: 1 } },
          partial: { t: '조심하겠다는 말은 들었다. 소리는 조금 줄었다.', sr: -2 },
          fail: { t: '"우리 집 아닌데요." 문이 쾅 닫혔다. 계단을 내려오는 다리가 떨렸다.', hp: -6, sr: 8 } } },
      { id: 'office', label: '관리사무소·이웃사이센터에 맡긴다', intent: 'stability', out: { t: '절차는 느렸지만 감정싸움은 피했다. 귀마개가 일상이 됐다.', sr: 2 } },
      { id: 'move', label: '이사를 알아본다', intent: 'independence', if: p => !p.house,
        out: { t: '', log: '층간소음 때문에 이사', fn: p => { const c = 300; p.money -= c; return `복비와 이사비로 ${M(c)}원이 들었다. 새 집의 첫날 밤, 이렇게 조용할 수 있다니.`; }, hp: 4, sr: -4 } }
    ]
  });

  ch({
    id: 'lf_forty', cat: 'life', ages: [40, 52], w: 9, icon: '🏍️', label: '중년',
    if: p => !!p.job,
    title: '마흔의 질문', text: p => `${p.age}세. 문득 거울 앞에서 '이대로 늙어도 괜찮은가' 하는 생각이 들었다. 회사와 집 사이에서 내 이름이 희미해진 것 같다.`,
    choices: [
      { id: 'bike', label: '오래 미뤄 둔 걸 해 본다 (바이크·서핑·밴드)', intent: 'adventure',
        out: { t: '', log: '마흔에 시작한 취미', flag: 'hobby', exp: 6, fn: p => { const c = Math.round(Math.min(H.cash(p) * 0.08, 600) / 10) * 10; p.money -= c; S().addStat(p, 'happy', 10); return `${M(c)}원을 들여 장비를 샀다. 주말마다 스무 살처럼 들뜬다.`; } } },
      { id: 'study', label: '퇴근 후 공부를 다시 시작한다', intent: 'education',
        out: { t: '사이버대 강의를 듣기 시작했다. 졸린 눈을 비비며 듣는 강의가 의외로 재밌다.', log: '마흔에 다시 공부 시작', flag: 'lifelong_learner', eff: { study: 20 }, sr: 4 } },
      { id: 'body', label: '먼저 몸부터 챙긴다', intent: 'health',
        out: { t: '새벽 수영을 끊었다. 석 달 만에 계단이 덜 무섭다.', log: '건강 관리 시작', flag: 'exercise_habit', eff: { health: 20 }, st: { health: 3 } } },
      { id: 'keep', label: '다들 그렇게 산다며 넘긴다', intent: 'rest', out: { t: '맥주 한 캔에 생각을 묻었다. 내일도 출근이다.', hp: -2 } }
    ]
  });

  ch({
    id: 'lf_parents_trip', cat: 'family', ages: [32, 62], w: 7, icon: '🧳', label: '가족',
    if: p => LG.Rel.parents(p).some(n => n.age >= 65) && H.cash(p) >= 400,
    title: '부모님과 여행', text: '"우리 언제 같이 여행 한번 가나." 지나가듯 하신 말씀이 마음에 걸린다. 부모님 무릎이 예전 같지 않다.',
    choices: [
      { id: 'go', label: '이번 봄에 모시고 간다', intent: 'family',
        out: { t: '', log: '부모님을 모시고 여행', rel: { parents: 14 }, hp: 10, exp: 3, fn: p => { p.money -= 300; return '느린 걸음에 맞춰 걸었다. 사진 속 부모님이 이렇게 웃는 걸 오랜만에 봤다.'; } } },
      { id: 'later', label: '조금 더 여유가 생기면', intent: 'career', out: { t: '달력에 "언젠가"라고 적어 두었다.', rel: { parents: -2 } } }
    ]
  });

  ch({
    id: 'lf_friend_loan', cat: 'friend', ages: [28, 66], w: 6, icon: '🤲', label: '친구',
    if: p => LG.Rel.all(p, 'friend').length > 0 && H.cash(p) >= 1500,
    who: p => LG.Rel.all(p, 'friend').sort((a, b) => b.rel - a.rel)[0],
    title: '친구의 부탁', text: p => `오랜 친구 {who}이(가) 어렵게 입을 뗐다. "${M(Math.round(Math.min(H.cash(p) * 0.2, 3000) / 100) * 100)}원만 빌려줄 수 있을까. 석 달이면 갚을게."`,
    choices: [
      { id: 'lend', label: '빌려준다', intent: 'social',
        check: { base: 50, partial: 0.3, f: [['fn', p => { const w = p.people.find(n => n.id === (p.ctx || {}).who); return w ? { label: '친구와의 신뢰', v: (w.rel - 55) * 0.5 } : null; }]] },
        out: {
          success: { t: '석 달 뒤, 정확히 그 날짜에 돈이 들어왔다. 고맙다는 메시지와 함께.', log: '친구에게 돈을 빌려주고 돌려받음', rel: { friends: 6 }, hp: 4, flag: 'kept_friends' },
          partial: { t: '', fn: p => { const a = Math.round(Math.min(H.cash(p) * 0.1, 1500) / 100) * 100; p.money -= a; return `절반은 돌려받았다. 나머지 ${M(a)}원은… 말을 꺼내기가 어렵다.`; }, rel: { friends: -2 } },
          fail: { t: '', log: '친구에게 빌려준 돈을 떼임', fn: p => { const a = Math.round(Math.min(H.cash(p) * 0.2, 3000) / 100) * 100; p.money -= a; const w = p.people.find(n => n.id === (p.ctx || {}).who); if (w) { w.rel = 10; w.role = 'past_friend'; } return `연락이 끊겼다. ${M(a)}원과 친구를 함께 잃었다.`; }, hp: -10, sr: 8 }
        } },
      { id: 'part', label: '갚지 않아도 될 만큼만 준다', intent: 'stability', out: { t: '"이건 빌려주는 거 아니야." 봉투를 건넸다. 친구는 한참 말이 없었다.', money: -300, rel: { friends: 4 }, hp: 2 } },
      { id: 'no', label: '미안하지만 거절한다', intent: 'independence', out: { t: '"그래, 이해해." 그 뒤로 연락이 조금 뜸해졌다.', rel: { friends: -6 } } }
    ]
  });

  // ───────────────── 60대 이후 ─────────────────
  ch({
    id: 'lf_kiosk', cat: 'aging', ages: [66, 92], w: 9, icon: '📱', label: '노년',
    if: p => !(p.done && p.done.o_late_study),
    title: '키오스크 앞에서', text: '햄버거 가게 주문 화면 앞에서 한참을 서 있었다. 뒤에 줄이 길어지자 얼굴이 화끈거렸다.',
    choices: [
      { id: 'learn', label: '복지관 디지털 교실에 등록한다', intent: 'education',
        check: { base: 60, partial: 0.4, f: [['stat', 'intelligence', 0.3], ['ageOver', 75, 1.5]] },
        out: { success: { t: '이제 손주에게 영상 통화도 먼저 건다. 배달 앱으로 짜장면도 시켜 봤다.', log: '디지털 교실 수료', flag: 'lifelong_learner', hp: 8, st: { intelligence: 1 } },
          partial: { t: '몇 가지는 익혔다. 그래도 새 앱이 나오면 또 막막하다.', hp: 2 },
          fail: { t: '수업은 너무 빨랐다. 세 번 나가고 그만뒀다.', hp: -3 } } },
      { id: 'ask', label: '젊은 사람에게 도와 달라고 한다', intent: 'social', out: { t: '"제가 해 드릴게요." 학생 하나가 웃으며 눌러 주었다. 세상이 아직 따뜻하다.', hp: 4 } },
      { id: 'avoid', label: '사람이 주문받는 가게만 다닌다', intent: 'rest', out: { t: '단골 국밥집 사장님이 "늘 먹던 걸로?" 하고 묻는다. 그거면 됐다.', rel: { friends: 0 } } }
    ]
  });

  ch({
    id: 'lf_kid_money', cat: 'family', ages: [56, 84], w: 8, icon: '💼', label: '가족',
    if: p => LG.Rel.all(p, 'child').some(c => c.age >= 28) && H.cash(p) >= 3000,
    child: p => LG.Rel.all(p, 'child').filter(c => c.age >= 28).sort((a, b) => b.rel - a.rel)[0],
    title: '{child}의 부탁', text: p => `{child}이(가) 사업을 해 보겠다며 ${M(Math.round(Math.min(H.cash(p) * 0.35, 20000) / 100) * 100)}원만 도와 달라고 한다. 노후 자금에서 나가는 돈이다.`,
    choices: [
      { id: 'give', label: '믿고 보태 준다', intent: 'family',
        check: { base: 45, partial: 0.4, f: [['fn', p => { const c = p.people.find(n => n.id === (p.ctx || {}).child); return c && c.uni === 'top' ? { label: '아이의 준비', v: 8 } : null; }]] },
        out: {
          success: { t: '', log: '자녀의 창업을 도움 (성공)', rel: { children: 10 }, hp: 10, fn: p => { const a = Math.round(Math.min(H.cash(p) * 0.35, 20000) / 100) * 100; LG.Invest.raise(p, Math.max(0, a - p.money)); p.money -= a; return `${M(a)}원을 보냈다. 몇 해 뒤, 가게가 자리를 잡자 아이가 매달 용돈을 보내오기 시작했다.`; } },
          partial: { t: '', rel: { children: 6 }, hp: -2, fn: p => { const a = Math.round(Math.min(H.cash(p) * 0.35, 20000) / 100) * 100; LG.Invest.raise(p, Math.max(0, a - p.money)); p.money -= a; return `${M(a)}원을 보냈다. 사업은 근근이 버틴다. 돌려받을 생각은 접었다.`; } },
          fail: { t: '', log: '자녀의 사업 실패로 노후 자금 손실', rel: { children: 4 }, hp: -10, sr: 10, fn: p => { const a = Math.round(Math.min(H.cash(p) * 0.35, 20000) / 100) * 100; LG.Invest.raise(p, Math.max(0, a - p.money)); p.money -= a; return `${M(a)}원이 2년 만에 사라졌다. 아이는 고개를 들지 못했다. "괜찮다"는 말밖에 할 수 없었다.`; } }
        } },
      { id: 'half', label: '절반만 돕고, 나머지는 스스로 구하라고 한다', intent: 'stability',
        out: { t: '', rel: { children: 2 }, fn: p => { const a = Math.round(Math.min(H.cash(p) * 0.15, 8000) / 100) * 100; LG.Invest.raise(p, Math.max(0, a - p.money)); p.money -= a; return `${M(a)}원을 건넸다. "나머지는 네 힘으로 해 봐." 아이는 조금 서운해했지만 고개를 끄덕였다.`; } } },
      { id: 'no', label: '노후 자금이라 어렵다고 말한다', intent: 'independence', out: { t: '"알겠어요." 전화가 짧게 끊겼다. 맞는 결정이라 믿지만 마음이 무겁다.', rel: { children: -8 }, hp: -3 } }
    ]
  });

  ch({
    id: 'lf_senior_center', cat: 'aging', ages: [64, 90], w: 9, icon: '🎤', label: '노년',
    if: p => !p.job,
    title: '복지관 게시판', text: '동네 복지관 게시판에 새 강좌가 붙었다. 노래 교실, 탁구, 서예, 그리고 "어르신 연극단 단원 모집".',
    choices: [
      { id: 'sing', label: '노래 교실에 간다', intent: 'hobby', out: { t: '트로트 한 곡을 완창하자 박수가 쏟아졌다. 일주일 중 화요일이 기다려진다.', log: '복지관 노래 교실', flag: 'hobby', hp: 10, rel: { friends: 4 }, st: { social: 1 }, fn: H.friend(62, '복지관 친구') } },
      { id: 'pingpong', label: '탁구를 배운다', intent: 'health', out: { t: '공이 생각보다 빠르다. 땀을 흘리고 나면 밥맛이 돈다.', log: '노년에 탁구 시작', flag: 'exercise_habit', st: { health: 3, physical: 2 }, hp: 6 } },
      { id: 'theater', label: '연극단에 지원한다', intent: 'adventure',
        check: { base: 55, partial: 0, f: [['stat', 'creativity', 0.3], ['stat', 'social', 0.2]] },
        out: { success: { t: '구민회관 무대에 섰다. 대사를 하나 까먹었지만 아무도 몰랐다. 커튼콜에서 눈물이 났다.', log: '어르신 연극단 공연', exp: 6, hp: 14, st: { creativity: 2 } },
          fail: { t: '대사가 도무지 외워지지 않았다. 소품 담당으로 남기로 했다. 그것도 나쁘지 않다.', hp: 3 } } },
      { id: 'no', label: '집이 편하다', intent: 'rest', out: { t: 'TV 소리가 집 안을 채운다.', st: { social: -1 } } }
    ]
  });

  ch({
    id: 'lf_near_kids', cat: 'aging', ages: [70, 92], w: 7, icon: '🏘️', label: '노년',
    if: p => LG.Rel.all(p, 'child').some(c => c.age >= 30) && !H.spouse(p),
    child: p => LG.Rel.all(p, 'child').filter(c => c.age >= 30).sort((a, b) => b.rel - a.rel)[0],
    title: '자식 곁으로', text: '{child}이(가) "혼자 계시는 거 걱정돼요. 저희 동네로 오세요"라고 한다. 평생 산 동네를 떠나야 한다.',
    choices: [
      { id: 'move', label: '아이 근처로 이사한다', intent: 'family', out: { t: '주말마다 손주들이 들이닥친다. 대신 새 동네엔 아는 얼굴이 없다.', log: '자녀 곁으로 이사', rel: { children: 10, friends: -8 }, hp: 4 } },
      { id: 'stay', label: '살던 동네에 남는다', intent: 'independence', out: { t: '"아직은 혼자 할 수 있다." 대신 매일 저녁 전화를 하기로 약속했다.', rel: { children: 2 }, st: { mental: 1 } } }
    ]
  });

  ch({
    id: 'lf_old_pet', cat: 'aging', ages: [60, 82], w: 6, icon: '🐈', label: '노년',
    if: p => !has(p, 'pet') && (!H.spouse(p) || LG.Rel.all(p, 'child').every(c => c.age >= 20)),
    title: '유기동물 보호소', text: '산책길에 들른 보호소에서 나이 든 고양이 한 마리가 계속 나를 쳐다봤다. "이 아이는 입양이 잘 안 돼요."',
    choices: [
      { id: 'adopt', label: '데려온다', intent: 'family', out: { t: '첫날 밤, 고양이가 이불 끝에서 잠들었다. 집에 숨소리가 하나 늘었다.', log: '노년에 반려묘 입양', flag: 'pet', hp: 12, sr: -6, money: -50 } },
      { id: 'volunteer', label: '입양 대신 보호소 봉사를 한다', intent: 'social', out: { t: '매주 목요일, 보호소 청소와 산책 봉사를 한다. 이름을 불러 주면 달려오는 녀석들이 생겼다.', flag: 'volunteer', hp: 8, rel: { friends: 2 } } },
      { id: 'no', label: '끝까지 책임질 자신이 없다', intent: 'stability', out: { t: '돌아오는 길, 그 눈빛이 자꾸 떠올랐다.', hp: -2 } }
    ]
  });
})(window.LG = window.LG || {});
