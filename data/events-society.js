/* 이벤트 — 지금의 한국 사회: 코로나 학번, 코로나 자영업, '쉬었음' 청년, 부모 간병과 형제 갈등,
   경력 단절과 재취업, 이혼 후 재혼, 정년 이후 재취업 (직장 내 괴롭힘·번아웃은 events-echo.js) */
(function (LG) {
  const E = LG.DATA.events;
  const H = LG.EH, has = H.has;
  const S = H.S;
  const kids = p => LG.Rel.all(p, 'child').filter(c => c.alive);
  const lastRealJob = p => { const h = (p.jobHistory || []).filter(j => ['homemaker', 'parttime'].indexOf(j.id) < 0); return h.length ? h[h.length - 1].id : 'office_small'; };
  const ch = H.pusher({ tier: 'choice', w: 16, max: 1, cat: 'society', label: '사회' });

  // ───── 코로나 학번 ─────
  ch({
    id: 's_covid_class', ages: [18, 26], w: 60, icon: '😷', label: '2020',
    if: p => p.year >= 2020 && p.year <= 2022 && (p.status === 'college' || !!p.college),
    title: '코로나 학번', text: '입학식도, MT도, 축제도 없었다. 노트북 화면 속 네모 칸이 동기들의 전부다. 캠퍼스는 지도 앱으로만 안다.',
    choices: [
      { id: 'study', label: '혼자 깊게 판다', intent: 'education', out: { t: '집중할 시간은 많았다. 학점은 좋았지만 이름을 아는 동기가 거의 없다.', log: '코로나 학번: 혼공으로 버팀', eff: { study: 14 }, st: { intelligence: 2, social: -2 }, hp: -2, flag: 'good_gpa' } },
      { id: 'online', label: '온라인 동아리·스터디를 만든다', intent: 'social',
        check: { base: 46, partial: 0.4, f: [['stat', 'social', 0.3], ['stat', 'creativity', 0.2]] },
        out: { success: { t: '줌 스터디에서 만난 친구들이 졸업 후까지 이어졌다.', log: '코로나 학번: 온라인으로 사람을 모음', hp: 8, fn: H.friend(70, '줌 스터디 동기') }, fail: { t: '카메라를 켜는 사람이 점점 줄었다.', hp: -3 } } },
      { id: 'gap', label: '휴학하고 일부터 해 본다', intent: 'independence', out: { t: '배달·물류 알바를 하며 1년을 보냈다. 세상이 어떻게 돌아가는지 몸으로 배웠다.', eff: { work: 12 }, money: 900, fn: p => { if (p.college) p.college.end += 1; return ''; } } }
    ]
  });

  // ───── 코로나 자영업 ─────
  ch({
    id: 's_covid_shop', ages: [22, 75], w: 60, icon: '🚫', label: '2020',
    if: p => p.year >= 2020 && p.year <= 2021 && !!p.job && ['selfemp', 'cook', 'service', 'musician', 'artist', 'coach'].indexOf(p.job.id) >= 0,
    title: '텅 빈 가게', text: '영업시간 제한, 집합 금지. 매출이 반의반으로 줄었다. 월세 날짜만 정확히 돌아온다.',
    choices: [
      { id: 'pivot', label: '배달·온라인으로 바꾼다', intent: 'risk',
        check: { base: 40, partial: 0.4, f: [['stat', 'creativity', 0.3], ['talent', 'entrepreneur', 12], ['stat', 'intelligence', 0.15]] },
        out: { success: { t: '밤새 메뉴를 바꾸고 배달 앱에 올렸다. 오히려 단골이 전국으로 늘었다.', log: '코로나 위기를 온라인 전환으로 넘김', achv: 4, hp: 10, fn: H.mulJob(1.15) },
          partial: { t: '수수료를 빼면 남는 게 별로 없지만, 문은 닫지 않았다.', sr: 10 },
          fail: { t: '경쟁이 너무 치열했다. 광고비만 날렸다.', money: -800, sr: 14, hp: -6 } } },
      { id: 'loan', label: '소상공인 대출로 버틴다', intent: 'stability', out: { t: '정책 대출로 한 해를 버텼다. 끝나면 갚아야 할 빚이다.', debt: 2000, money: 2000, sr: 10 } },
      { id: 'close', label: '눈물을 머금고 폐업한다', intent: 'money', out: { t: '셔터를 내리던 날, 간판 불을 마지막으로 켜 봤다.', log: '코로나로 폐업', major: true, flag: 'closed_business', quit: true, hp: -14, sr: 8 } }
    ]
  });

  // ───── '쉬었음' 청년 ─────
  ch({
    id: 's_rest_youth', ages: [23, 35], w: 20, icon: '🛋️', label: '청년',
    if: p => !p.job && p.status === 'seeking' && !p.college && p.age >= 23,
    title: '그냥 쉬었음', text: '이력서를 쓴 지 얼마나 됐더라. 통계에는 "쉬었음"으로 잡힌다고 한다. 부모님의 "요즘 뭐 하니"가 제일 무섭다.',
    choices: [
      { id: 'train', label: '국비 직업훈련에 등록한다', intent: 'education',
        check: { base: 50, partial: 0.4, f: [['stat', 'mental', 0.25], ['eff', 'study', 0.2], ['region', 'job', 0.15]] },
        out: { success: { t: '6개월 과정을 수료하고 작은 회사에 취업했다. 출근길이 이렇게 반가울 줄이야.', log: '직업훈련으로 다시 일을 시작함', hp: 12, fn: p => { LG.Outcome.setJob(p, LG.RNG.pick(p, ['technician', 'developer', 'office_small', 'designer'])); return ''; } },
          partial: { t: '수료는 했지만 취업은 아직이다. 그래도 매일 갈 곳이 생겼다.', hp: 4, eff: { work: 8 } },
          fail: { t: '중간에 그만뒀다. 자책이 깊어졌다.', hp: -8, sr: 10 } } },
      { id: 'part', label: '알바부터 다시 시작한다', intent: 'money', out: { t: '편의점 야간 알바를 시작했다. 작지만 내 힘으로 버는 돈이다.', fn: p => { LG.Outcome.setJob(p, 'parttime'); return ''; }, hp: 4 } },
      { id: 'counsel', label: '청년 마음 상담부터 받는다', intent: 'health', out: { t: '"쉬는 것도 회복이에요." 상담사의 말에 처음으로 울었다. 조금씩 기운이 돌아왔다.', log: '청년 상담으로 마음을 추스름', sr: -14, hp: 8, st: { mental: 3 } } },
      { id: 'hide', label: '방에서 나가지 않는다', intent: 'rest', out: { t: '하루가 일주일이 되고, 일주일이 한 달이 되었다.', hp: -10, sr: 6, st: { social: -3 }, rel: { parents: -6 } } }
    ]
  });

  // ───── 부모 간병과 형제 갈등 ─────
  ch({
    id: 's_care_conflict', ages: [38, 68], w: 18, icon: '🏥', cat: 'family', label: '가족',
    if: p => LG.Rel.parents(p).some(n => n.alive && n.health < 45) && !!LG.Rel.get(p, 'sibling') && !has(p, 'care_decided'),
    title: '누가 모실 것인가', text: '{parent}의 거동이 불편해지셨다. 형제들이 모였지만, 아무도 먼저 "내가 모실게"라고 말하지 않는다. 대신 각자의 사정이 길게 이어진다.',
    choices: [
      { id: 'me', label: '내가 모시겠다고 한다', intent: 'family',
        out: { t: '부모님 방을 꾸렸다. 내 생활은 사라졌지만, 부모님 손을 잡고 잠드는 밤이 있다.', log: '부모님을 직접 모심', flag: ['care_decided', 'supporting_parents'], rel: { parents: 15, siblings: 4 }, hp: -2, sr: 18 } },
      { id: 'split', label: '비용과 순번을 공평하게 나누자고 한다', intent: 'stability',
        check: { base: 40, partial: 0.4, f: [['rel', 'sibling', 0.4], ['stat', 'social', 0.2], ['fn', p => ({ label: '형제 수', v: (LG.Rel.all(p, 'sibling').length - 1) * 5 })]] },
        out: { success: { t: '엑셀로 순번표를 짰다. 처음엔 어색했지만, 형제들이 오히려 자주 모이게 됐다.', log: '형제들과 간병을 나눔', flag: 'care_decided', rel: { siblings: 10, parents: 6 }, hp: 4, money: -400 },
          fail: { t: '"너는 그동안 뭐 했는데?" 오래 묵은 서운함이 터졌다. 명절에 얼굴 보기도 어색해졌다.', log: '간병 문제로 형제와 갈등', flag: 'care_decided', rel: { siblings: -18 }, hp: -10, sr: 14 } } },
      { id: 'facility', label: '요양원을 알아본다', intent: 'money', out: { t: '좋은 곳을 찾느라 몇 주를 다녔다. 입소 날, {parent}가 내 손을 오래 놓지 않으셨다.', flag: 'care_decided', money: -900, hp: -6, rel: { parents: -4 } } },
      { id: 'away', label: '형편이 안 된다며 빠진다', intent: 'career', out: { t: '형제들의 단톡방이 조용해졌다. 그 침묵이 오래갔다.', flag: 'care_decided', rel: { siblings: -14, parents: -8 }, hp: -4 } }
    ]
  });

  // ───── 경력 단절 ─────
  ch({
    id: 's_career_break', ages: [25, 45], w: p => p.gender === 'F' ? 30 : 12, icon: '🍼', cat: 'family', label: '일과 육아',
    if: p => !!p.job && p.job.id !== 'homemaker' && kids(p).some(c => c.age <= 2) && !has(p, 'career_break_decided'),
    title: '일이냐, 아이냐', text: '육아휴직이 끝나 간다. 어린이집 대기 순번은 아직 멀고, 아이는 밤마다 열이 난다. 회사에서는 복귀 날짜를 묻는다.',
    choices: [
      { id: 'leave', label: '육아휴직을 연장하고 복귀한다', intent: 'family',
        check: { base: 52, partial: 0.4, f: [['fn', p => ({ label: '직장의 안정성', v: (LG.DATA.jobs[p.job.id].stab - 55) * 0.3 })], ['rel', 'spouse', 0.2]] },
        out: { success: { t: '1년을 더 아이 곁에 있었다. 복귀하니 자리는 그대로였다.', flag: 'career_break_decided', rel: { children: 10 }, hp: 8, perf: -4 },
          fail: { t: '복귀했더니 한직으로 밀려 있었다. 눈치 속에 버티는 중이다.', flag: 'career_break_decided', rel: { children: 6 }, perf: -14, sr: 14 } } },
      { id: 'quit', label: '회사를 그만두고 아이를 키운다', intent: 'family',
        out: { t: '사원증을 반납했다. 아이의 첫걸음을 내 눈으로 봤다. 가끔은 내가 누구였는지 잊는다.', log: '육아로 경력이 끊김', major: true, flag: ['career_break_decided', 'career_break'], rel: { children: 14 }, hp: 4, fn: p => { LG.Outcome.setJob(p, 'homemaker'); return ''; } } },
      { id: 'grand', label: '부모님께 아이를 부탁한다', intent: 'career', if: p => LG.Rel.parents(p).length > 0,
        out: { t: '부모님이 아이를 봐 주셨다. 고마움과 미안함이 매일 교차한다.', flag: 'career_break_decided', rel: { parents: 4 }, sr: 6, hp: 2, money: -300 } },
      { id: 'both', label: '맞벌이로 버틴다', intent: 'career', out: { t: '퇴근하면 두 번째 출근이 시작된다. 둘 다 지쳐 간다.', flag: 'career_break_decided', sr: 16, rel: { spouse: -4 }, perf: 2 } }
    ]
  });

  ch({
    id: 's_return_work', ages: [30, 56], w: 26, icon: '👩‍💼', label: '일과 육아',
    if: p => has(p, 'career_break') && p.job && p.job.id === 'homemaker' && kids(p).every(c => c.age >= 6),
    title: '다시 일하고 싶다', text: '아이가 학교에 들어갔다. 이력서의 빈칸이 몇 년째다. 다시 일할 수 있을까?',
    choices: [
      { id: 'back', label: '원래 하던 분야로 재취업한다', intent: 'career',
        check: { base: 30, partial: 0.5, f: [['ageOver', 38, 2], ['stat', 'mental', 0.25], ['eff', 'work', 0.2], ['region', 'job', 0.2]] },
        out: { success: { t: '면접에서 육아 공백을 솔직하게 말했다. "그동안 무엇을 배웠는지가 보이네요." 합격이었다.', log: '경력 단절 후 재취업', major: true, unflag: 'career_break', hp: 14, achv: 3, fn: p => { LG.Outcome.setJob(p, lastRealJob(p), { mul: 0.85 }); return ''; } },
          partial: { t: '정규직은 어려웠지만 계약직으로 다시 일을 시작했다.', unflag: 'career_break', hp: 6, fn: p => { LG.Outcome.setJob(p, 'office_small', { mul: 0.8 }); return ''; } },
          fail: { t: '서류에서 계속 떨어졌다. "경력 공백"이라는 네 글자가 무겁다.', hp: -10, sr: 10 } } },
      { id: 'new', label: '자격증을 따서 새 일을 한다', intent: 'education', out: { t: '아이가 잠든 밤에 공부해 자격증을 땄다. 사회복지사로 새 출발.', log: '자격증으로 새 일을 시작', unflag: 'career_break', hp: 10, fn: p => { LG.Outcome.setJob(p, 'socialworker'); return ''; } } },
      { id: 'stay', label: '조금 더 아이 곁에 있는다', intent: 'family', out: { t: '아직은 아이가 나를 필요로 한다.', rel: { children: 4 }, hp: 2 } }
    ]
  });

  // ───── 이혼 후 재혼 ─────
  ch({
    id: 's_remarry', ages: [33, 72], w: 18, icon: '💐', cat: 'relationship', label: '인연',
    if: p => has(p, 'divorced') && H.single(p) && !has(p, 'remarry_decided'),
    title: '다시 사랑해도 될까', text: p => `이혼한 지 몇 해가 지났다. 소개받은 사람과 몇 번 만났는데, 대화가 편하다. ${kids(p).some(c => c.age < 20) ? '아이들은 어떻게 받아들일까.' : '이번엔 다를 수 있을까.'}`,
    choices: [
      { id: 'go', label: '천천히 다시 시작해 본다', intent: 'love',
        check: { base: 44, partial: 0.4, f: [['stat', 'social', 0.3], ['stat', 'mental', 0.2], ['fn', p => kids(p).some(c => c.age >= 10 && c.age < 20) ? { label: '사춘기 자녀의 반대', v: -10 } : null]] },
        out: { success: { t: '서로의 상처를 아는 사람이라 더 조심스러웠다. 그래서 더 편했다.', log: '이혼 후 새 인연', flag: 'remarry_decided', hp: 14, fn: H.lover({}) },
          partial: { t: '좋은 사람이지만 아직은 친구로 지내기로 했다.', flag: 'remarry_decided', hp: 4 },
          fail: { t: '아이가 크게 반대했다. 결국 마음을 접었다.', flag: 'remarry_decided', hp: -8, rel: { children: -4 } } } },
      { id: 'kids', label: '아이들이 클 때까지 미룬다', intent: 'family', if: p => kids(p).some(c => c.age < 20), out: { t: '지금은 아이들이 먼저다. 아쉬움은 혼자 삼켰다.', flag: 'remarry_decided', rel: { children: 6 }, hp: -2 } },
      { id: 'alone', label: '혼자가 편하다', intent: 'independence', out: { t: '결혼은 한 번으로 충분했다. 혼자서도 잘 산다.', flag: 'remarry_decided', hp: 4 } }
    ]
  });

  // ───── 정년 이후 재취업 ─────
  ch({
    id: 's_reemploy', ages: [59, 68], w: 22, icon: '🔄', cat: 'retirement', label: '은퇴 후',
    if: p => p.status === 'retired' && !p.job && !has(p, 'reemploy_decided'),
    title: '정년 이후', text: p => `정년퇴직하고 1년. 연금 수령까지는 ${p.age < 65 ? '아직 몇 년이 남았다.' : '이제 막 시작이다.'} 예전 거래처에서 "경험 있는 분이 필요하다"며 연락이 왔다.`,
    choices: [
      { id: 'contract', label: '계약직으로 다시 출근한다', intent: 'career',
        check: { base: 55, partial: 0.4, f: [['health', 0.3], ['ageOver', 63, 3]] },
        out: { success: { t: '연봉은 반으로 줄었지만, 아침에 갈 곳이 있다는 게 좋다.', log: '정년 후 재취업', flag: 'reemploy_decided', hp: 8, fn: p => { LG.Outcome.setJob(p, lastRealJob(p), { mul: 0.55 }); return ''; } },
          fail: { t: '체력이 따라 주지 않아 석 달 만에 그만뒀다.', flag: 'reemploy_decided', hp: -4, st: { health: -2 } } } },
      { id: 'startup', label: '퇴직금으로 작은 가게를 연다', intent: 'risk',
        check: { base: 30, partial: 0.4, f: [['talent', 'entrepreneur', 14], ['flag', 'sold_business', 8, '장사 경험'], ['assets', 0.3]] },
        out: { success: { t: '동네 사랑방 같은 가게가 되었다.', log: '은퇴 후 창업', flag: 'reemploy_decided', hp: 10, fn: p => { LG.Outcome.setJob(p, 'selfemp', { mul: 0.6 }); return ''; } },
          fail: { t: '1년 만에 퇴직금 절반이 사라졌다. 은퇴 창업의 흔한 결말이었다.', log: '은퇴 창업 실패', flag: ['reemploy_decided', 'closed_business'], money: -3000, hp: -12, sr: 16 } } },
      { id: 'rest', label: '이제는 정말 쉰다', intent: 'rest', out: { t: '연락을 정중히 거절했다. 남은 시간은 나를 위해 쓰기로 했다.', flag: 'reemploy_decided', hp: 4, sr: -6 } }
    ]
  });
})(window.LG = window.LG || {});
