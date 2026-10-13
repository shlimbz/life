/* 이벤트 — 해외로 나가는 길: 조기유학 · 해외 대학원 · 워킹홀리데이 이후 · 이민 정착과 귀향
   (기존 gl_wh / gl_job_abroad / h_emigrate 와 이어진다. 해외에 사는 동안은 p.liveIn === 'abroad') */
(function (LG) {
  const E = LG.DATA.events;
  const H = LG.EH, has = H.has, disc = H.disc;
  const A = H.A;
  const S = H.S;
  const abroad = p => p.liveIn === 'abroad';
  const ch = H.pusher({ tier: 'choice', w: 10, max: 1, cat: 'global', dom: ['global'], label: '세계' });
  const comeHome = (mulJob) => p => {
    p.liveIn = null; p.home = p.job ? 'rent' : 'parents';
    if (p.job && mulJob) p.job.mul = Math.max(0.5, Math.round(p.job.mul * mulJob * 1000) / 1000);
    return '';
  };

  // ───────────── 어릴 때: 조기유학 ─────────────
  ch({
    id: 'gl_early_study', ages: [12, 16], icon: '🛬', w: 40,
    if: p => (p.family.tier >= 4 || p.family.ext > 0) && (A(p, 'global') >= 14 || p.family.ext > 0) && !has(p, 'early_abroad') && !abroad(p),
    title: '조기유학 이야기', text: p => `{parent}가 조심스럽게 말을 꺼냈다. "영어권 나라의 학교로 ${p.family.ext > 0 ? '일찍 나가 보는' : '유학을 가 보는'} 건 어떠니? 네가 원하면 알아볼게."`,
    choices: [
      { id: 'go', label: '가 보겠다고 한다', intent: 'adventure',
        check: { base: 50, partial: 0.4, f: [['stat', 'mental', 0.3], ['stat', 'social', 0.2], ['talent', 'language', 10], ['flag', 'pen_pal', 6, '외국어 경험']] },
        out: {
          success: { t: '낯선 교실, 낯선 억양. 몇 달은 말이 입 밖에 나오지 않았지만, 어느 날 영어로 꿈을 꾸었다.', log: '조기유학', major: true, flag: ['early_abroad', 'abroad_exp', 'lang_camp'], eff: { study: 14 }, st: { intelligence: 3, social: 2, mental: 2 }, hp: 10, exp: 6, rel: { parents: -6, friends: -10 }, fn: disc('language') },
          partial: { t: '외로움을 견디며 1년을 보냈다. 영어는 늘었지만 한국 친구들과는 어색해졌다.', log: '조기유학(1년)', flag: ['early_abroad', 'abroad_exp'], eff: { study: 8 }, hp: -2, exp: 3, rel: { friends: -12, parents: -4 } },
          fail: { t: '적응하지 못하고 몇 달 만에 돌아왔다. 학교에서는 "유학 갔다 온 애"로 불렸다.', flag: 'early_abroad', hp: -9, sr: 14, rel: { friends: -5 } }
        } },
      { id: 'no', label: '친구들과 있고 싶다', intent: 'social', out: { t: '지금 이 동네, 이 친구들이 좋다고 했다.', rel: { friends: 4 }, hp: 3 } }
    ]
  });

  // ───────────── 유학 ─────────────
  ch({
    id: 'gl_study_degree', ages: [22, 32], icon: '🎓', w: 45,
    if: p => (p.edu === 'college') && !p.college && !abroad(p) && p.status !== 'military' && !has(p, 'study_abroad') &&
      (p.status === 'seeking' || (p.job && p.job.years <= 4)) && (A(p, 'global') >= 22 || has(p, 'lang_track') || has(p, 'exchange') || has(p, 'abroad_exp') || p.family.tier >= 4),
    title: '해외 대학원 유학', text: '해외 대학원 합격 이메일이 도착했다. 낯선 나라에서 2~3년 공부하게 된다. 학비와 생활비, 그리고 돌아올 자리가 걱정이다.',
    choices: [
      { id: 'go', label: '합격을 수락하고 떠난다', intent: 'education',
        check: { base: 30, partial: 0.5, f: [['stat', 'intelligence', 0.35], ['eff', 'study', 0.25], ['talent', 'language', 12], ['flag', 'lang_track', 8, '어학 특기'], ['flag', 'exchange', 6, '교환학생 경험'], ['flag', 'good_gpa', 8, '좋은 학점'], ['assets', 0.12], ['family', 0.3]] },
        out: {
          success: { t: '장학금과 대출을 엮어 비행기에 올랐다. 낯선 도시의 도서관에서 새벽까지 불이 꺼지지 않는다.', log: '해외 대학원 유학', major: true, quit: 'grad', flag: ['study_abroad', 'abroad_exp', 'grad_school'], exp: 12, rel: { parents: -4, friends: -8 }, hp: 8,
            fn: H.seq(H.college(3, 'grad'), p => { p.liveIn = 'abroad'; p.home = 'abroad'; p.queue.push({ id: 'gl_after_study', at: p.age + 3 }); return ''; }) },
          partial: { t: '원하던 학교는 아니지만 입학했다. 학비 부담에 아르바이트를 병행하는 빡빡한 유학 생활이다.', log: '해외 대학원 유학(힘든 시작)', quit: 'grad', flag: ['study_abroad', 'abroad_exp', 'grad_school'], exp: 8, sr: 14, hp: 1, debt: 3000, debtKind: 'student',
            fn: H.seq(H.college(3, 'grad'), p => { p.liveIn = 'abroad'; p.home = 'abroad'; p.queue.push({ id: 'gl_after_study', at: p.age + 3 }); return ''; }) },
          fail: { t: '비자 문제와 비용을 감당하지 못해 포기했다. 이메일 보관함에 합격 메일만 남았다.', hp: -9, sr: 12 }
        } },
      { id: 'domestic', label: '국내에서 커리어를 쌓는다', intent: 'career', out: { t: '해외에서 돌아온 뒤의 자리가 불안했다. 지금 있는 곳에서 승부를 보기로 했다.', eff: { work: 6 }, hp: 0 } }
    ]
  });

  ch({
    id: 'gl_after_study', queued: true, tier: 'major', icon: '🛂',
    if: p => abroad(p) && has(p, 'study_abroad') && !p.college,
    title: '졸업, 그리고 비자', text: '학위를 받았다. 졸업 비자는 곧 만료된다. 현지 회사에서 면접 기회가 왔지만, 한국에서도 연락이 온다. 어디에 뿌리를 내릴까?',
    choices: [
      { id: 'stay', label: '현지에서 취업한다', intent: 'adventure',
        check: { base: 36, partial: 0.5, f: [['talent', 'language', 12], ['stat', 'intelligence', 0.25], ['stat', 'social', 0.2], ['ageOver', 33, 2], ['flag', 'working_holiday', 6, '해외 체류 경험']] },
        out: {
          success: { t: '취업 비자를 받았다. 이곳에서의 삶이 계속된다.', log: '유학 후 현지 취업', major: true, flag: ['emigrated', 'abroad_work'], achv: 4, hp: 12, fn: H.abroadJob },
          partial: { t: '임시 직장으로 버티며 비자를 이어 간다. 불안하지만 아직 포기하지 않았다.', log: '현지에서 분투', flag: ['emigrated'], sr: 12, hp: 2, fn: p => H.abroadJob(p, true) },
          fail: { t: '비자가 끝내 나오지 않았다. 짐을 싸서 돌아왔다.', hp: -8, sr: 14, fn: comeHome(1) }
        } },
      { id: 'return', label: '한국으로 돌아간다', intent: 'family',
        out: { t: '공항에 가족이 마중 나왔다. 졸업장을 쥔 손이 조금 떨렸다.', log: '유학을 마치고 귀국', flag: 'returned_scholar', rel: { parents: 6, friends: 3 }, hp: 8, fn: comeHome(1) } }
    ]
  });

  // ───────────── 워킹홀리데이 이후 ─────────────
  ch({
    id: 'gl_wh_after', ages: [20, 34], icon: '🛂', w: 14,
    if: p => has(p, 'working_holiday') && !abroad(p) && !has(p, 'emigrated') && !has(p, 'wh_stay_decided'),
    title: '그곳에 눌러앉을까', text: '워킹홀리데이에서 돌아온 지 얼마 되지 않았는데, 그곳 사장님이 스폰서 비자를 제안했다는 연락이 왔다. 일상은 한국에 있다. 아니면 다시 그곳에?',
    choices: [
      { id: 'go', label: '비자를 받아 다시 떠난다', intent: 'adventure',
        check: { base: 46, partial: 0.4, f: [['talent', 'language', 10], ['stat', 'mental', 0.25], ['stat', 'social', 0.2]] },
        out: {
          success: { t: '이번에는 여행자가 아니라 주민으로 도착했다. 월급날 은행 앱이 낯선 통화로 찍힌다.', log: '워홀 후 현지 정착', major: true, flag: ['emigrated', 'abroad_work', 'wh_stay_decided'], liveIn: 'abroad', home: 'abroad', exp: 12, rel: { parents: -6, friends: -10 }, hp: 10, fn: p => H.abroadJob(p) },
          partial: { t: '임시 비자로 일을 이어 가는 중이다. 수입도 마음도 불안정하다.', flag: ['emigrated', 'wh_stay_decided'], liveIn: 'abroad', home: 'abroad', exp: 8, sr: 12, fn: p => H.abroadJob(p, true) },
          fail: { t: '서류 문제로 무산됐다. 그 나라는 다시 먼 곳이 되었다.', flag: 'wh_stay_decided', hp: -6 }
        } },
      { id: 'no', label: '이제는 한국에서 자리를 잡는다', intent: 'stability', out: { t: '좋은 추억으로 남기기로 했다. 가끔 그곳 노을이 생각난다.', flag: 'wh_stay_decided', eff: { work: 5 }, hp: 1 } }
    ]
  });

  // ───────────── 해외에서 살아가는 동안 ─────────────
  ch({
    id: 'gl_far_parent', ages: [38, 74], icon: '📞', w: 15, cd: 6, max: 2,
    if: p => abroad(p) && LG.Rel.parents(p).length > 0,
    title: '멀리서 온 전화', text: '새벽에 전화가 울렸다. 부모님이 입원하셨다는 소식이다. 비행기로 열두 시간. 내가 지금 있는 곳이 이렇게 먼 줄 몰랐다.',
    choices: [
      { id: 'fly', label: '당장 비행기를 탄다', intent: 'family',
        out: { t: '병실에서 손을 잡았다. 말은 많지 않았지만 오기를 잘했다고 생각했다.', log: '급히 귀국해 부모님 곁을 지킴', money: -300, rel: { parents: 10 }, hp: 3, sr: 10 } },
      { id: 'home', label: '아예 한국으로 돌아간다', intent: 'family',
        out: { t: '짐을 정리하고 돌아왔다. 먼 곳에서 쌓은 것들을 내려놓기가 쉽지는 않았다.', log: '해외 생활을 접고 귀국', major: true, rel: { parents: 12, friends: 4 }, hp: 4, sr: 8, money: -500, fn: comeHome(0.85) } },
      { id: 'remote', label: '병원비를 보내고 영상통화로 곁을 지킨다', intent: 'career',
        out: { t: '화면 속 얼굴이 작게 보였다. 돈은 보냈지만 마음은 계속 무겁다.', money: -400, rel: { parents: -6 }, hp: -6, sr: 14 } }
    ]
  });

  ch({
    id: 'gl_citizen', ages: [38, 66], icon: '🪪', w: 11,
    if: p => abroad(p) && !has(p, 'citizen_abroad') && (p.done && p.done.h_emigrate || has(p, 'abroad_work')),
    title: '영주권, 그리고 시민권', text: '이곳에서 산 지 꽤 되었다. 시민권을 신청할 자격이 생겼다. 서류 한 장이 내가 어디 사람인지를 바꾸는 것 같아 마음이 복잡하다.',
    choices: [
      { id: 'citizen', label: '시민권을 취득한다', intent: 'stability',
        out: { t: '선서식에서 낯선 국가를 따라 불렀다. 집으로 오는 길, 이상하게 눈물이 났다.', log: '현지 시민권 취득', major: true, flag: 'citizen_abroad', achv: 3, hp: 8, st: { mental: 2 } } },
      { id: 'permanent', label: '영주권으로 만족한다', intent: 'independence', out: { t: '한 곳에 완전히 속하지 않는 느낌이 오히려 편했다.', hp: 3 } },
      { id: 'back', label: '언젠가 한국으로 돌아간다', intent: 'family', out: { t: '노후는 고향에서 보내기로 마음먹었다. 짐을 조금씩 줄이기 시작했다.', flag: 'plan_return', rel: { family: 4 }, hp: 4 } }
    ]
  });

  ch({
    id: 'gl_return_late', ages: [55, 80], icon: '🏡', w: 14,
    if: p => abroad(p) && (has(p, 'plan_return') || p.age >= 62),
    title: '고향으로', text: '은퇴가 가까워지자 이상하게 한국말이 그립다. 아이들은 이곳 사람이 되었다. 어디서 마지막 날들을 보낼까.',
    choices: [
      { id: 'korea', label: '한국으로 영구 귀국한다', intent: 'family',
        out: { t: '김포공항에서 맡은 낯익은 공기. 시장에서 흥정하는 소리가 음악 같았다.', log: '노년에 영구 귀국', major: true, rel: { family: 8, friends: 4 }, hp: 14, fn: comeHome(1) } },
      { id: 'stay', label: '이곳에 남는다', intent: 'stability', out: { t: '내 삶의 대부분이 이곳에 있다. 한국은 일 년에 한 번 다녀오는 곳이 되었다.', hp: 2, rel: { family: -3 } } }
    ]
  });
})(window.LG = window.LG || {});
