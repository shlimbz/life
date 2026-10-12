/* 이벤트 — 분야별 삶의 길 ②  과학·수학 / 기술·IT / 사업·장사 */
(function (LG) {
  const E = LG.DATA.events;
  const H = LG.EH, has = H.has, disc = H.disc;
  const A = H.A;
  const jobIs = H.jobIs;
  const S = H.S;
  const ch = H.pusher({ tier: 'choice', w: 12, max: 1 });
  const net = H.net;

  // ═════════════════════════ 과학 · 수학 ═════════════════════════

  ch({
    id: 'sc_kid_exp', cat: 'science', ages: [8, 13], dom: ['science'], icon: '🧪', label: '과학',
    if: p => A(p, 'science') >= 16 || has(p, 'kid_study'),
    title: '"왜?"가 멈추지 않는 아이', text: '비가 오면 왜 무지개가 뜨는지, 달은 왜 따라오는지 묻고 또 묻는다. 학교에서 과학 전람회 참가 신청을 받는다.',
    choices: [
      { id: 'exp', label: '직접 실험을 설계해 출품한다', intent: 'adventure',
        check: { base: 46, partial: 0.5, f: [['stat', 'intelligence', 0.3], ['stat', 'creativity', 0.2], ['talent', 'math', 8], ['eduEnv', 0.1]] },
        out: {
          success: { t: '실험 결과를 표로 정리해 발표했다. 교육청 대회에서 입상했다!', log: '과학 전람회 입상', flag: 'science_kid', eff: { study: 10 }, st: { intelligence: 2 }, hp: 10, achv: 2, fn: disc('math') },
          partial: { t: '실험은 우여곡절 끝에 마쳤다. 과학이 점점 좋아진다.', flag: 'science_kid', eff: { study: 5 }, hp: 5 },
          fail: { t: '실험이 계속 실패했지만 이유를 알아내는 과정이 흥미로웠다.', flag: 'science_kid', eff: { study: 3 }, hp: 1 }
        } },
      { id: 'read', label: '도서관에서 과학책을 빌려 읽는다', intent: 'education', out: { t: '우주, 공룡, 인체. 책 속의 세계에 빠져 시간 가는 줄 몰랐다.', flag: 'science_kid', eff: { study: 8 }, st: { intelligence: 2 }, hp: 5 } },
      { id: 'play', label: '놀이터가 더 좋다', intent: 'social', out: { t: '과학은 학교 수업 시간만으로도 충분하다.', hp: 2 } }
    ]
  });

  ch({
    id: 'sc_science_hs', cat: 'science', ages: [14, 17], dom: ['science'], icon: '🔭', label: '과학', w: 14,
    if: p => A(p, 'science') >= 28 && p.track !== 'sports' && p.track !== 'vocational',
    title: '과학고·영재원의 문', text: '중학교 담임 선생님이 과학고 지원을 권하신다. 성적과 가능성은 충분하다고 하지만, 입시 경쟁이 치열하다는 것도 사실이다.',
    choices: [
      { id: 'apply', label: '과학고·영재학교에 도전한다', intent: 'education',
        check: { base: 24, partial: 0.5, f: [['stat', 'intelligence', 0.45], ['eff', 'study', 0.35], ['talent', 'math', 12], ['eduEnv', 0.2], ['flag', 'olympiad', 8, '올림피아드 경험'], ['flag', 'science_kid', 5, '어릴 적 과학 경험']] },
        out: {
          success: { t: '합격이다! 기숙사 생활이 시작된다. 동기들은 전국에서 모인 수재들이다.', log: '과학고에 합격', major: true, flag: ['science_hs', 'olympiad'], track: 'academic', achv: 5, hp: 14, st: { intelligence: 4 } },
          partial: { t: '최종에서 떨어졌지만 준비 과정에서 실력이 크게 늘었다.', eff: { study: 14 }, st: { intelligence: 2 }, hp: -2 },
          fail: { t: '실패했다. 한동안 수학 문제집을 펼치기도 싫었다.', hp: -10, sr: 12 }
        } },
      { id: 'general', label: '일반고에서 내신을 챙긴다', intent: 'stability', out: { t: '무리하지 않고 일반고에서 과학 동아리를 이끌어 보기로 했다.', eff: { study: 6 }, hp: 2 } },
      { id: 'club', label: '영재원·동아리 활동으로 만족한다', intent: 'hobby', out: { t: '방과 후 영재 수업에서 친구들과 문제를 푸는 시간이 즐겁다.', flag: 'science_kid', eff: { study: 8 }, hp: 5 } }
    ]
  });

  ch({
    id: 'sc_lab_intern', cat: 'science', ages: [21, 27], dom: ['science'], icon: '🥼', label: '과학', w: 14,
    if: p => A(p, 'science') >= 32 && (['sci', 'med', 'it', 'agri'].indexOf(p.major) >= 0 || p.edu === 'college' && A(p, 'science') >= 45),
    title: '학부연구생 제안', text: '지도교수님이 "우리 연구실에서 실험을 해 보지 않겠느냐"고 말씀하셨다. 대학원에 진학할지 취업을 할지 결정해야 하는 시기다.',
    choices: [
      { id: 'grad', label: '연구실에 합류하고 대학원에 진학한다', intent: 'education',
        check: { base: 46, partial: 0.5, f: [['stat', 'intelligence', 0.3], ['eff', 'study', 0.3], ['stress', 0.2], ['assets', 0.1]] },
        out: {
          success: { t: '연구실에서 첫 데이터를 얻었다. 밤샘 실험 끝에 논문 한 편의 공저자가 되었다.', log: '대학원 진학, 첫 논문', flag: ['grad_school', 'paper'], edu: 'grad', eff: { study: 12 }, st: { intelligence: 3 }, hp: 8, sr: 10, achv: 3 },
          partial: { t: '실험은 잘 안 풀렸지만 연구의 매력을 알았다. 석사 과정을 이어 간다.', flag: 'grad_school', edu: 'grad', eff: { study: 6 }, sr: 14, hp: 1 },
          fail: { t: '교수님과 맞지 않았고 결과도 나오지 않았다. 지쳐서 중도에 나왔다.', flag: 'grad_school', hp: -12, sr: 18 }
        } },
      { id: 'job', label: '취업 준비를 하며 연구는 접는다', intent: 'career', out: { t: '전공 지식을 살려 연구 보조·기업 취업을 노리기로 했다.', eff: { work: 8 }, hp: 1 } },
      { id: 'part', label: '방학 인턴으로 경험만 쌓는다', intent: 'stability', out: { t: '연구실 분위기를 맛보고 진로를 가늠했다.', eff: { study: 5 }, hp: 3 } }
    ]
  });

  ch({
    id: 'sc_paper', cat: 'science', ages: [28, 54], dom: ['science'], icon: '📑', label: '과학', w: 14, cd: 8, max: 2,
    if: p => jobIs(p, 'researcher', 'engineer', 'doctor') && A(p, 'science') >= 35,
    title: '연구비와 논문', text: '연구과제 마감과 논문 투고가 겹쳤다. 결과는 아직 애매하다. 데이터를 조금 "정리"하면 깔끔해질 것 같다는 유혹이 스친다.',
    choices: [
      { id: 'honest', label: '있는 그대로 정직하게 정리한다', intent: 'stability',
        check: { base: 50, partial: 0.5, f: [['stat', 'intelligence', 0.3], ['perf', 0.2], ['stat', 'mental', 0.15]] },
        out: {
          success: { t: '결과는 소박했지만 재현 가능했다. 심사위원이 "정직한 연구"라며 칭찬했다.', log: '정직한 연구로 인정받음', perf: 5, achv: 3, hp: 8 },
          partial: { t: '결과가 애매해 논문이 한 번 반려되었다. 다음 기회를 노린다.', hp: -3, sr: 8 },
          fail: { t: '성과가 부족해 연구비가 끊겼다. 연구실 분위기가 가라앉았다.', hp: -8, sr: 12, perf: -5 }
        } },
      { id: 'tweak', label: '데이터를 "정리"해서 낸다', intent: 'risk',
        check: { base: 30, partial: 0.3, f: [['trait', 'careful', 4]] },
        out: {
          success: { t: '논문이 통과되었다. 하지만 마음 한구석이 계속 불편하다.', achv: 2, sr: 8, hp: 1 },
          partial: { t: '지적을 받아 논문을 수정해야 했다. 위태로운 순간이었다.', hp: -6, sr: 14 },
          fail: { t: '연구윤리 문제로 조사가 열렸다. 경력에 큰 오점이 남았다.', log: '연구부정 의혹으로 징계', major: true, perf: -20, hp: -18, sr: 22, flag: 'research_misconduct' }
        } },
      { id: 'delay', label: '마감을 늦추고 실험을 더 한다', intent: 'education', out: { t: '시간을 더 들여 제대로 실험했다. 마감을 넘겼지만 결과는 더 단단해졌다.', hp: -2, sr: 8, perf: 2 } }
    ]
  });

  ch({
    id: 'sc_mentor', cat: 'science', ages: [55, 76], dom: ['science'], icon: '🌌', label: '과학',
    if: p => A(p, 'science') >= 30 || has(p, 'science_kid') || has(p, 'paper'),
    title: '별을 가르치는 사람', text: '지역 도서관에서 "시민 과학 강좌 강사"를 구한다. 오래 쌓아 온 지식을 아이들에게 나눠 줄 수도 있다.',
    choices: [
      { id: 'teach', label: '시민 강사로 아이들을 만난다', intent: 'hobby', out: { t: '아이들의 "왜요?"가 반갑다. 잊고 있던 호기심이 다시 깨어났다.', log: '시민 과학 강사 활동', hp: 12, sr: -5, rel: { friends: 3 }, st: { mental: 2 } } },
      { id: 'grand', label: '손주에게 별자리를 알려 준다', intent: 'family', out: { t: '옥상에서 망원경을 같이 들여다보았다. 손주가 "할아버지·할머니 최고!"라고 외쳤다.', hp: 10, rel: { family: 5 } } },
      { id: 'rest', label: '조용히 책을 읽으며 지낸다', intent: 'rest', out: { t: '평생 읽고 싶던 책을 하나씩 읽어 간다.', hp: 4 } }
    ]
  });

  // ═════════════════════════ 기술 · IT ═════════════════════════

  ch({
    id: 'tc_kid_build', cat: 'tech', ages: [8, 13], dom: ['tech'], icon: '🔧', label: '기술',
    if: p => A(p, 'tech') >= 14 || has(p, 'gamer_dream'),
    title: '분해하고 조립하는 손', text: '고장 난 라디오를 뜯어 보니 내부가 신기하다. 학교에서는 코딩·로봇 방과후 수업 수강 신청을 받고 있다.',
    choices: [
      { id: 'robot', label: '로봇·코딩 방과후에 등록한다', intent: 'hobby',
        check: { base: 56, partial: 0.4, f: [['family', 0.3], ['stat', 'intelligence', 0.15], ['talent', 'mechanical', 8]] },
        out: {
          success: { t: '블록 코딩으로 처음 만든 로봇이 움직였다! 이게 내가 하고 싶은 일이다.', log: '코딩·로봇 수업을 시작', flag: 'coding_kid', eff: { study: 6 }, st: { intelligence: 2 }, hp: 10, fn: disc('mechanical', 'math') },
          partial: { t: '수업 내용이 조금 어려웠지만 흥미는 이어졌다.', flag: 'coding_kid', eff: { study: 3 }, hp: 4 },
          fail: { t: '정원이 꽉 차 등록하지 못했다. 집에서 조립 장난감만 만지작거렸다.', hp: -2 }
        } },
      { id: 'taking', label: '집 안의 가전을 몰래 분해해 본다', intent: 'adventure',
        check: { base: 50, partial: 0.5, f: [['talent', 'mechanical', 10], ['trait', 'careful', 5]] },
        out: {
          success: { t: '분해한 라디오를 다시 조립했는데 소리가 난다! 아버지가 감탄했다.', log: '가전제품을 고쳐 냄', flag: 'tinkerer', eff: { work: 4 }, hp: 8, fn: disc('mechanical') },
          partial: { t: '조립하고 나니 나사 두 개가 남았다. 그래도 켜지긴 한다.', flag: 'tinkerer', hp: 3 },
          fail: { t: '다시는 켜지지 않는 라디오가 되었다. 한바탕 혼났다.', hp: -5, rel: { parents: -3 } }
        } },
      { id: 'pass', label: '난 게임이 더 좋다', intent: 'rest', out: { t: '기계보다는 화면 속 세계가 좋다.', hp: 2 } }
    ]
  });

  ch({
    id: 'tc_hackathon', cat: 'tech', ages: [17, 27], dom: ['tech'], icon: '⌨️', label: '기술', w: 14,
    if: p => A(p, 'tech') >= 28 && (has(p, 'coding_kid') || has(p, 'coder') || p.major === 'it' || has(p, 'vocational') || jobIs(p, 'developer')),
    title: '48시간 해커톤', text: '학교(회사) 근처에서 해커톤이 열린다. 모르는 사람들과 팀을 짜서 48시간 안에 서비스를 만들어야 한다. 잠은 포기해야 한다.',
    choices: [
      { id: 'join', label: '팀에 합류해 밤을 샌다', intent: 'adventure',
        check: { base: 40, partial: 0.5, f: [['stat', 'intelligence', 0.3], ['eff', 'study', 0.2], ['stat', 'social', 0.15], ['talent', 'mechanical', 8], ['flag', 'coder', 6, '개발 경험']] },
        out: {
          success: { t: '우리 팀이 최우수상을 받았다! 현장에서 스타트업 대표가 명함을 내밀었다.', log: '해커톤 수상', major: true, flag: ['coder', 'hackathon_win'], eff: { study: 8 }, st: { intelligence: 2 }, hp: 14, achv: 4 },
          partial: { t: '완성은 했지만 순위권은 아니었다. 팀원들과 새벽 라면을 먹으며 정이 들었다.', flag: 'coder', hp: 7, rel: { friends: 3 } },
          fail: { t: '배포 직전에 서버가 터졌다. 허탈하게 웃으며 집으로 돌아왔다.', hp: -3, sr: 8 }
        } },
      { id: 'solo', label: '혼자 사이드 프로젝트를 만든다', intent: 'independence', out: { t: '나만의 앱을 한 달에 걸쳐 완성했다. 작지만 직접 만든 것이라 소중하다.', flag: 'coder', eff: { study: 8 }, st: { creativity: 2 }, hp: 6 } },
      { id: 'pass', label: '쉬는 날은 쉬고 싶다', intent: 'rest', out: { t: '주말은 소중하다. 이불 속에서 늘어지게 잤다.', hp: 3 } }
    ]
  });

  ch({
    id: 'tc_startup_offer', cat: 'tech', ages: [22, 36], dom: ['tech'], icon: '🚀', label: '기술', w: 14,
    if: p => A(p, 'tech') >= 34 && (jobIs(p, 'developer', 'engineer', 'creator') || has(p, 'hackathon_win') || p.major === 'it'),
    title: '초기 스타트업의 제안', text: '해커톤에서 만난 대표가 "공동 창업자로 합류해 달라"고 연락해 왔다. 월급은 절반이지만 지분을 약속한다. 지금 직장은 안정적이다.',
    choices: [
      { id: 'join', label: '스타트업에 합류한다', intent: 'risk',
        check: { base: 26, partial: 0.5, f: [['stat', 'intelligence', 0.25], ['trait', 'competitive', 4], ['assets', 0.2], ['support', 0.2], ['flag', 'hackathon_win', 8, '입증된 팀워크']] },
        out: {
          success: { t: '서비스가 시장에서 먹혔다. 투자 유치와 함께 지분 가치가 껑충 뛰었다.', log: '스타트업 초기 멤버로 성공', major: true, flag: 'startup_success', money: 3500, achv: 7, hp: 18 },
          partial: { t: '버티고 버텨 후속 투자를 받았다. 아직 성공이라 하긴 이르지만 계속 달린다.', log: '스타트업에서 분투', flag: 'startup_member', money: 200, achv: 2, sr: 14, hp: 4 },
          fail: { t: '자금이 바닥나 회사가 문을 닫았다. 지분은 휴지조각이 되었다. 하지만 쌓은 경험은 남았다.', log: '스타트업 실패', flag: 'startup_failed', money: -600, hp: -12, sr: 16, eff: { work: 10 } }
        } },
      { id: 'stay', label: '안정적인 직장에 남는다', intent: 'stability', out: { t: '월급을 지키는 쪽을 택했다. 가끔 그 스타트업 소식이 신경 쓰인다.', hp: -1, perf: 2 } },
      { id: 'side', label: '퇴근 후에만 조금 돕는다', intent: 'career', out: { t: '두 일을 병행하느라 체력이 달리지만 어느 쪽도 놓치진 않았다.', flag: 'side_hustle', eff: { work: 4 }, sr: 10, money: 100 } }
    ]
  });

  ch({
    id: 'tc_legacy', cat: 'tech', ages: [34, 52], dom: ['tech'], icon: '🧓', label: '기술', w: 14, cd: 10,
    if: p => jobIs(p, 'developer', 'engineer', 'technician') && p.job.years >= 8,
    title: '신기술의 파도', text: '후배들은 최신 기술로 일하고 있다. 내가 오랫동안 써 온 기술은 점점 레거시가 되어 간다. "슬슬 관리자로 가시죠."라는 말이 은근히 들려온다.',
    choices: [
      { id: 'learn', label: '새 기술을 밤마다 공부해 따라잡는다', intent: 'education',
        check: { base: 46, partial: 0.5, f: [['stat', 'intelligence', 0.25], ['health', 0.2], ['stress', 0.2], ['perf', 0.1]] },
        out: {
          success: { t: '새 스택을 익혀 사내 프로젝트의 핵심이 되었다. "형이 제일 든든해요"라는 말을 들었다.', log: '신기술 재학습으로 입지 회복', perf: 8, achv: 2, hp: 8, sr: 8 },
          partial: { t: '쉽지 않았지만 반쯤은 따라잡았다.', perf: 2, sr: 12, hp: 0 },
          fail: { t: '체력이 따라주지 않았다. 번아웃이 오고 말았다.', hp: -10, sr: 18, st: { health: -2 } }
        } },
      { id: 'manage', label: '팀장·관리자 트랙으로 간다', intent: 'career', out: { t: '코드 대신 사람과 일정을 다룬다. 손은 편해졌지만 마음이 조금 허하다.', log: '관리자 트랙으로 전환', perf: 3, money: 150, sr: 6 } },
      { id: 'leave', label: '자영업·프리랜서로 방향을 튼다', intent: 'adventure', out: { t: '조직을 나와 내 일을 시작했다. 불안하지만 자유롭다.', log: '개발자에서 독립', flag: 'side_hustle', fn: p => { LG.Outcome.quitJob(p, 'seeking'); return ''; }, hp: 3, sr: 8 } }
    ]
  });

  ch({
    id: 'tc_ai_shift', cat: 'tech', ages: [38, 62], dom: ['tech'], icon: '🤖', label: '기술', w: 12,
    if: p => p.year >= 2025 && !!p.job && A(p, 'tech') >= 24,
    title: 'AI가 바꾸는 업무', text: '팀에 AI 도구가 도입되었다. 어제는 일주일 걸리던 일이 한 시간에 끝났다. "우리 부서는 감원 대상이라더라"라는 소문도 돈다.',
    choices: [
      { id: 'adopt', label: '먼저 익혀서 업무 방식을 바꾼다', intent: 'career',
        check: { base: 52, partial: 0.5, f: [['stat', 'intelligence', 0.25], ['perf', 0.2], ['trait', 'careful', 3]] },
        out: {
          success: { t: 'AI를 가장 잘 쓰는 사람이 되어 팀의 에이스로 인정받았다.', log: 'AI 도구를 적극 활용해 성과를 냄', perf: 8, money: 200, hp: 7 },
          partial: { t: '쓸모는 있지만 완벽하지 않았다. 그래도 한 발 앞서 있다.', perf: 3, hp: 2 },
          fail: { t: '의존이 지나쳐 실수가 났다. 책임은 내 몫이었다.', perf: -6, hp: -6, sr: 10 }
        } },
      { id: 'resist', label: '"사람이 하는 일이 더 정확하다"며 고수한다', intent: 'stability', out: { t: '옛 방식을 고수했지만, 어느새 속도에서 뒤처진 느낌이다.', perf: -4, sr: 8 } },
      { id: 'reskill', label: '새로운 분야로 재교육을 받는다', intent: 'education', out: { t: '평일 저녁과 주말을 쪼개 새로운 기술과 자격을 준비했다.', eff: { study: 10 }, sr: 10, hp: 2, money: -100 } }
    ]
  });

  // ═════════════════════════ 사업 · 장사 ═════════════════════════

  ch({
    id: 'bz_flea', cat: 'business', ages: [8, 13], dom: ['business'], icon: '🧸', label: '사업',
    if: p => A(p, 'business') >= 14 || p.family.tags.indexOf('self_employed') >= 0,
    title: '아나바다 장터', text: '학교 앞 벼룩시장에서 쓰던 장난감을 팔면 용돈이 된다고 한다. 부모님 가게에서 본 계산기 소리가 문득 떠오른다.',
    choices: [
      { id: 'sell', label: '물건을 모아 가격표를 붙여 판다', intent: 'money',
        check: { base: 50, partial: 0.5, f: [['stat', 'social', 0.25], ['talent', 'entrepreneur', 10], ['talent', 'leadership', 5]] },
        out: {
          success: { t: '두 시간 만에 다 팔렸다! 번 돈으로 친구들에게 떡볶이를 쐈다.', log: '벼룩시장에서 장사', flag: 'flea_seller', st: { social: 2 }, hp: 10, money: 5, fn: disc('entrepreneur', 'leadership') },
          partial: { t: '절반쯤 팔았다. 가격을 깎아 달라는 흥정이 신기했다.', flag: 'flea_seller', hp: 5 },
          fail: { t: '한 개도 못 팔고 집에 가져왔다. 그래도 재밌었다.', hp: 0 }
        } },
      { id: 'help', label: '부모님 가게 일을 돕는다', intent: 'family', if: p => p.family.tags.indexOf('self_employed') >= 0, out: { t: '손님을 맞이하고 거스름돈을 챙기는 게 은근히 재밌다. 부모님이 대견해하셨다.', flag: 'farm_helper_biz', eff: { work: 6 }, rel: { parents: 5 }, hp: 6 } },
      { id: 'no', label: '그냥 구경만 한다', intent: 'rest', out: { t: '사 먹는 쪽이 편하다.', hp: 1 } }
    ]
  });

  ch({
    id: 'bz_fest', cat: 'business', ages: [14, 19], dom: ['business'], icon: '🎪', label: '사업',
    if: p => A(p, 'business') >= 20 || has(p, 'lemonade') || has(p, 'flea_seller'),
    title: '학교 축제 대목', text: '축제 때 학생회가 부스 운영 팀을 모집한다. 먹거리·굿즈 판매로 수익을 낼 수 있다. 그런데 팀원 모으는 것부터 일이다.',
    choices: [
      { id: 'lead', label: '내가 팀을 꾸려 기획한다', intent: 'career',
        check: { base: 44, partial: 0.5, f: [['stat', 'social', 0.3], ['talent', 'entrepreneur', 12], ['talent', 'leadership', 8], ['flag', 'lemonade', 5, '장사 경험']] },
        out: {
          success: { t: '줄이 부스 밖까지 이어졌다. 순수익을 반으로 나눠도 기대 이상이었다. 장사의 맛을 알았다.', log: '축제 부스로 큰 수익', flag: ['school_biz', 'lemonade'], eff: { work: 8, social: 6 }, st: { social: 3 }, hp: 14, achv: 2, money: 20, fn: disc('entrepreneur', 'leadership') },
          partial: { t: '본전은 건졌다. 팀워크를 배운 것만으로도 의미가 컸다.', flag: 'school_biz', eff: { social: 4 }, hp: 6 },
          fail: { t: '재료를 너무 많이 준비해 적자가 났다. 팀원들과 다투기도 했다.', hp: -6, sr: 8, money: -10 }
        } },
      { id: 'member', label: '팀원으로 참여한다', intent: 'social', out: { t: '시키는 일을 열심히 했다. 축제가 끝나니 친구들이 더 가까워졌다.', eff: { social: 4 }, hp: 6, rel: { friends: 3 } } },
      { id: 'skip', label: '공부해야 해서 패스', intent: 'education', out: { t: '축제는 구경만 했다.', eff: { study: 4 } } }
    ]
  });

  ch({
    id: 'bz_campus', cat: 'business', ages: [19, 29], dom: ['business'], icon: '💼', label: '사업', w: 14,
    if: p => A(p, 'business') >= 28 && (p.status === 'college' || !!p.major || p.status === 'seeking' || has(p, 'online_shop') || has(p, 'school_biz')),
    title: '창업 동아리와 지원금', text: '창업 지원사업 공고가 떴다. 아이디어는 있다. 예비창업패키지에 지원하려면 사업계획서와 팀이 필요하다.',
    choices: [
      { id: 'apply', label: '팀을 꾸려 지원사업에 도전한다', intent: 'adventure',
        check: { base: 28, partial: 0.5, f: [['stat', 'intelligence', 0.2], ['stat', 'social', 0.2], ['talent', 'entrepreneur', 14], ['flag', 'school_biz', 6, '축제 부스 경험'], ['flag', 'online_shop', 6, '온라인 판매 경험']] },
        out: {
          success: { t: '심사를 통과해 지원금을 받았다. 작은 사무실 한 칸을 얻어 진짜 창업을 시작했다.', log: '창업 지원사업 선정', major: true, flag: 'started_business', money: 800, achv: 4, hp: 14 },
          partial: { t: '최종 면접에서 탈락했지만 피드백이 큰 공부가 됐다.', flag: 'biz_plan', eff: { work: 8 }, hp: 2 },
          fail: { t: '준비 부족으로 서류에서 탈락했다. 아이디어를 더 다듬어야겠다.', hp: -5, sr: 6 }
        } },
      { id: 'job', label: '먼저 취업해 경험부터 쌓는다', intent: 'stability', out: { t: '현장의 감각을 배운 뒤 창업하는 쪽이 낫다고 판단했다.', eff: { work: 8 }, hp: 2 } },
      { id: 'side', label: '온라인으로 작게 시작한다', intent: 'money',
        check: { base: 46, partial: 0.5, f: [['talent', 'entrepreneur', 10], ['stat', 'creativity', 0.15]] },
        out: {
          success: { t: '스마트스토어를 열었다. 첫 달부터 주문이 꾸준히 들어왔다.', log: '온라인 스토어 개설', flag: ['online_shop', 'side_hustle'], money: 150, hp: 8 },
          partial: { t: '주문은 적지만 배우는 게 많다.', flag: 'online_shop', hp: 3 },
          fail: { t: '재고만 쌓였다. 광고비만 날렸다.', money: -150, hp: -5 }
        } }
    ]
  });

  ch({
    id: 'bz_expand', cat: 'business', ages: [30, 58], dom: ['business'], icon: '🏬', label: '사업', w: 16, cd: 8, max: 2,
    if: p => jobIs(p, 'selfemp', 'ceo') || has(p, 'started_business') || has(p, 'startup_success'),
    title: '확장이냐, 내실이냐', text: '단골이 늘고 입소문이 났다. 건물주가 옆 점포가 비었다며 "확장하실래요?"라고 물었다. 대출을 받으면 2호점을 열 수 있다.',
    choices: [
      { id: 'expand', label: '대출을 받아 확장한다', intent: 'risk',
        check: { base: 34, partial: 0.5, f: [['stat', 'intelligence', 0.15], ['talent', 'entrepreneur', 12], ['assets', 0.2], ['jobYears', 0.5, 8]] },
        out: {
          success: { t: '2호점도 자리를 잡았다. 직원 몇 명을 둔 어엿한 사장이 되었다.', log: '사업 확장 성공', major: true, flag: 'bz_expanded', money: 1500, debt: 800, achv: 5, hp: 12 },
          partial: { t: '1호점이 흔들릴 만큼 힘들었지만 간신히 버텨 냈다.', debt: 800, money: 200, sr: 16, hp: -2 },
          fail: { t: '경기가 꺾이며 2호점이 적자의 늪이 되었다. 결국 정리했지만 빚이 남았다.', log: '확장 실패로 빚을 짐', major: true, debt: 2500, hp: -16, sr: 20, flag: 'bz_failed' }
        } },
      { id: 'steady', label: '지금 가게를 단단히 지킨다', intent: 'stability', out: { t: '무리하지 않고 품질에 집중했다. 단골은 더 늘었다.', money: 400, hp: 4, sr: -3 } },
      { id: 'franchise', label: '기술·노하우를 다른 사람에게 가르친다', intent: 'career', out: { t: '컨설팅·교육으로 노하우를 나눴다. 새로운 수익원이 생겼다.', money: 500, hp: 5, st: { social: 2 } } }
    ]
  });

  ch({
    id: 'bz_succession', cat: 'business', ages: [54, 76], dom: ['business'], icon: '🔑', label: '사업',
    if: p => (jobIs(p, 'selfemp', 'ceo') || has(p, 'bz_expanded') || has(p, 'started_business')) && p.age >= 54,
    title: '가게를 넘길 때', text: '평생 일군 가게(회사)를 어떻게 할지 고민이다. 자녀는 관심이 없고, 인수 제안은 들어와 있다.',
    choices: [
      { id: 'sell', label: '좋은 값에 매각한다', intent: 'money', out: { t: '권리금과 매각대금이 들어왔다. 열쇠를 건네는 순간 눈물이 핑 돌았다.', log: '평생 일군 사업을 매각', money: 6000, hp: 6, flag: 'sold_business' } },
      { id: 'child', label: '자녀에게 물려준다', intent: 'family', if: p => H.kids(p).length >= 1,
        out: { t: '자녀가 가게를 이어받았다. 부모의 땀이 다음 세대로 이어지는 순간이다.', log: '사업을 자녀에게 물려줌', rel: { children: 8 }, hp: 10, flag: 'business_succession' } },
      { id: 'close', label: '조용히 정리하고 쉰다', intent: 'rest', out: { t: '마지막 영업일에는 단골들이 와서 손을 잡아 주었다. 오래 마음에 남았다.', log: '가게를 정리하고 은퇴', money: 1500, hp: 5, flag: 'closed_business' } }
    ]
  });
})(window.LG = window.LG || {});
