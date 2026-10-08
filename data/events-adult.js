/* 이벤트 — 20대 이후: 대학 · 군대 · 취업 · 경력 · 연애 · 결혼 · 자녀 · 돈 · 주거 · 건강 */
(function (LG) {
  const E = LG.DATA.events;
  const H = LG.EH, has = H.has, found = H.found, seq = H.seq, disc = H.disc;
  const S = () => LG.State;
  const jobIn = (p, ids) => !!p.job && ids.indexOf(p.job.id) >= 0;
  const CREATIVE = ['artist', 'musician', 'writer', 'creator', 'freelancer', 'designer'];

  H.housePrice = p => Math.round(S().liveRegion(p).rent * 70 * ((!p.urban && !p.liveIn) ? 0.6 : 1) / 100) * 100;
  H.buyHouse = (scale, label) => p => {
    const price = Math.round(H.housePrice(p) * scale / 100) * 100;
    const down = Math.min(Math.max(0, p.money), Math.round(price * 0.5));
    p.money -= down; p.debt += price - down;
    p.house = { value: price, label: label || S().liveRegion(p).short + ' ' + (p.urban || p.liveIn ? '아파트' : '주택') };
    p.home = 'own'; S().flag(p, 'home_owner');
    return `(${LG.U.money(price)}원, 대출 ${LG.U.money(price - down)}원)`;
  };
  H.enlist = p => {
    p.afterMilitary = p.status; p.afterMilitaryHome = p.home;
    if (p.job) { p.afterJob = p.job; p.job = null; }
    if (p.college) p.college.end += 2;
    p.status = 'military'; p.militaryUntil = p.age + 2; p.home = 'barracks';
    S().flag(p, 'served');
    return '';
  };
  // 이민: 전문 기술은 가져가고, 나머지는 바닥부터
  H.abroadJob = (p, hard) => {
    const keep = ['developer', 'researcher', 'doctor', 'nurse', 'designer', 'technician', 'cook', 'artist', 'musician', 'writer', 'creator', 'freelancer'];
    if (p.job && keep.indexOf(p.job.id) >= 0) { p.job.perf = Math.max(0, p.job.perf - (hard ? 15 : 5)); return ''; }
    const j = LG.RNG.chance(p, hard ? 0.3 : 0.55) ? 'office_small' : 'service';
    LG.Outcome.setJob(p, j);
    return j === 'service' ? '처음엔 식당 일부터 시작했다.' : '현지 회사에 자리를 구했다.';
  };
  H.creativeJob = p => {
    if (found(p, 'music') || p.talents.indexOf('music') >= 0 && p.effort.art > 20) return 'musician';
    if (found(p, 'writing')) return 'writer';
    if (has(p, 'gamer_dream')) return 'creator';
    return p.major === 'arts' ? 'artist' : LG.RNG.pick(p, ['artist', 'creator', 'writer']);
  };

  // ───────────────────────── 대학 · 군대 ─────────────────────────

  E.push({
    id: 'u_military', cat: 'career', tier: 'major', ages: [20, 23], milestone: true, prio: 8, icon: '🪖',
    if: p => p.gender === 'M' && !has(p, 'served') && ['college', 'seeking', 'working', 'retake'].indexOf(p.status) >= 0 && p.stats.health >= 35,
    label: '국방의 의무', title: '입영 통지서',
    text: '우편함에 입영 통지서가 꽂혀 있다. 머리를 짧게 자를 시간이다.',
    choices: [
      { id: 'army', label: '현역으로 입대한다', intent: 'stability',
        out: { t: '훈련소 앞에서 가족과 인사를 나눴다. 18개월이 시작됐다.', log: '군 입대', st: { physical: 6, mental: 5, social: 2 }, sr: 8, fn: H.enlist } },
      { id: 'katusa', label: '카투사·특기병에 지원한다', intent: 'adventure',
        check: { base: 30, partial: 0, f: [['stat', 'intelligence', 0.3], ['talent', 'language', 15]] },
        out: {
          success: { t: '카투사에 선발됐다. 영어가 부쩍 늘었다.', log: '카투사 입대', st: { intelligence: 3, social: 3, mental: 3 }, flag: 'katusa', fn: H.enlist },
          fail: { t: '선발에서 떨어졌다. 결국 육군 현역으로 입대했다.', log: '군 입대', st: { physical: 6, mental: 5 }, sr: 8, fn: H.enlist }
        } }
    ]
  });

  E.push({
    id: 'u_college_life', cat: 'education', tier: 'choice', ages: [19, 24], w: 16, cd: 2, max: 2, icon: '🏛️',
    if: p => p.status === 'college' && p.college && p.college.kind === 'univ',
    label: '대학 생활', title: '이번 학기는…',
    text: '캠퍼스에 봄이 왔다. 이번 학기는 어디에 힘을 쏟을까?',
    choices: [
      { id: 'gpa', label: '학점 관리에 집중한다', intent: 'education',
        check: { base: 55, partial: 0.5, f: [['stat', 'intelligence', 0.4], ['eff', 'study', 0.3]] },
        out: {
          success: { t: '장학금 명단에 이름이 올랐다.', log: '좋은 학점을 받음', eff: { study: 25 }, flag: 'good_gpa', achv: 2 },
          partial: { t: 'B+ 행진. 나쁘지 않다.', eff: { study: 15 } },
          fail: { t: '열심히 했는데 학점이 안 나온다. 교수님과 안 맞나 보다.', sr: 6, eff: { study: 10 } }
        } },
      { id: 'spec', label: '인턴·대외활동으로 스펙을 쌓는다', intent: 'career',
        check: { base: 42, partial: 0.5, f: [['stat', 'social', 0.3], ['region', 'job', 0.3], ['flag', 'lower_college', -8, '출신 학교'], ['eff', 'work', 0.2]] },
        out: {
          success: { t: '원하던 회사 인턴에 합격했다. 실무를 배웠다.', log: '인턴십 합격', flag: 'intern', eff: { work: 22 }, st: { social: 2 } },
          partial: { t: '대외활동 몇 개를 했다. 이력서 한 줄이 늘었다.', eff: { work: 12 } },
          fail: { t: '서류에서 줄줄이 떨어졌다.', sr: 8 }
        } },
      { id: 'love', label: '동아리와 연애로 청춘을 즐긴다', intent: 'love', if: p => H.single(p),
        check: { base: 45, partial: 0.5, f: [['stat', 'social', 0.4], ['trait', 'extrovert', 6]] },
        out: {
          success: { t: '동아리에서 {partner}을(를) 만나 연애를 시작했다.', log: '{partner}와 캠퍼스 커플이 됨', hp: 12, fn: H.lover() },
          partial: { t: '연애는 아니지만 좋은 친구들이 생겼다.', hp: 6, fn: H.friend(66, '대학 동기') },
          fail: { t: '설레는 일은 없었다. 술만 늘었다.', hp: -3 }
        } },
      { id: 'travel', label: '휴학하고 세계여행을 떠난다', intent: 'adventure',
        check: { base: 50, partial: 0, f: [['assets', 0.5], ['family', 0.5], ['eff', 'work', 0.2]] },
        out: {
          success: { t: '배낭 하나 메고 30개국을 돌았다. 세상은 넓었다.', log: '휴학하고 세계여행', exp: 14, hp: 14, money: -500, flag: 'traveled_young', fn: p => { if (p.college) p.college.end += 1; return ''; } },
          fail: { t: '여행 경비를 모으다 한 학기가 지나갔다.', money: 250, eff: { work: 10 } }
        } }
    ]
  });

  E.push({
    id: 'u_exchange', cat: 'travel', tier: 'choice', ages: [20, 24], w: 6, max: 1, icon: '✈️',
    if: p => p.status === 'college',
    label: '기회', title: '교환학생 모집',
    text: '학과 게시판에 교환학생 모집 공고가 붙었다. 1년간 해외에서 공부할 수 있다.',
    choices: [
      { id: 'go', label: '지원한다', intent: 'adventure',
        check: { base: 35, partial: 0, f: [['stat', 'intelligence', 0.3], ['talent', 'language', 15], ['family', 0.6], ['flag', 'good_gpa', 8, '좋은 학점']] },
        out: {
          success: { t: '1년간 유럽에서 공부했다. 세상을 보는 눈이 달라졌다.', log: '해외 교환학생', exp: 16, st: { intelligence: 3, social: 3 }, flag: 'exchange', money: -400, fn: seq(disc('language'), p => { if (p.college) p.college.end += 1; return ''; }) },
          fail: { t: '선발에서 떨어졌다. 다음을 기약했다.', hp: -4 }
        } },
      { id: 'no', label: '국내에서 학업에 집중한다', intent: 'education', out: { t: '지금 할 일에 집중하기로 했다.', eff: { study: 10 } } }
    ]
  });

  E.push({
    id: 'u_grad_school', cat: 'education', tier: 'choice', ages: [22, 30], w: 7, max: 1, icon: '🔬',
    if: p => p.edu === 'college' && !p.college && (p.status === 'seeking' || (p.job && p.job.years <= 3)),
    label: '진로', title: '대학원? 로스쿨?',
    text: '지도교수님이 대학원에 와서 함께 연구하자고 하신다. 로스쿨을 준비하는 동기들도 있다.',
    choices: [
      { id: 'grad', label: '대학원에 간다', intent: 'education',
        check: { base: 45, partial: 0, f: [['stat', 'intelligence', 0.5], ['eff', 'study', 0.3], ['family', 0.35], ['assets', 0.25]] },
        out: {
          success: { t: '연구실 생활이 시작됐다. 밤샘 실험이 일상이다.', log: '대학원 진학', quit: 'grad', flag: 'grad_school', fn: H.college(2, 'grad') },
          fail: { t: '등록금과 생활비를 감당할 수 없었다.', hp: -5 }
        } },
      { id: 'law', label: '로스쿨에 도전한다', intent: 'career',
        check: { base: 20, partial: 0, f: [['stat', 'intelligence', 0.6], ['eff', 'study', 0.4], ['family', 0.45], ['flag', 'good_gpa', 8, '좋은 학점']] },
        out: {
          success: { t: '로스쿨에 합격했다. 3년간 법전과 씨름한다.', log: '로스쿨 입학', quit: 'grad', fn: H.college(3, 'law') },
          fail: { t: '로스쿨 입시에서 떨어졌다.', hp: -6 }
        } },
      { id: 'no', label: '사회로 나간다', intent: 'career', out: { t: '공부는 여기까지. 이제 돈을 벌 때다.', minor: true } }
    ]
  });

  // ───────────────────────── 취업 ─────────────────────────

  const JOB_CHOICES = [
    { id: 'big', label: '대기업 공채에 지원한다', intent: 'career', if: p => p.edu === 'college' || p.edu === 'grad',
      check: { base: 22, partial: 0.55, f: [['stat', 'intelligence', 0.35], ['eff', 'work', 0.25], ['eff', 'study', 0.15], ['flag', 'intern', 10, '인턴 경험'], ['flag', 'good_gpa', 8, '좋은 학점'], ['flag', 'exchange', 5, '해외 경험'], ['flag', 'lower_college', -8, '출신 학교'], ['region', 'job', 0.25], ['stat', 'social', 0.15], ['ageOver', 30, 2]] },
      out: {
        success: { t: '최종 합격! 사원증을 목에 걸었다.', log: '대기업 입사', job: 'office_big', hp: 14, achv: 5 },
        partial: { t: '대기업은 떨어졌지만 탄탄한 중견기업에 붙었다.', log: '중견기업 입사', job: 'office_small', hp: 4 },
        fail: { t: '서류, 인적성, 면접… 결국 최종 탈락.', log: '대기업 공채 탈락', sr: 10, hp: -7 }
      } },
    { id: 'civil', label: '공무원 시험을 준비한다', intent: 'stability',
      check: { base: 22, partial: 0.6, f: [['stat', 'intelligence', 0.35], ['eff', 'study', 0.45], ['stat', 'mental', 0.25], ['ageOver', 32, 1.5]] },
      out: {
        success: { t: '합격! 합격자 명단에서 이름을 세 번 확인했다.', log: '공무원 합격', job: 'civil', hp: 14, achv: 4 },
        partial: { t: '아깝게 떨어졌다. 한 번만 더 하면 될 것 같다.', log: '공무원 시험 낙방', eff: { study: 20 }, sr: 8, queue: [{ id: 'w_civil_retry', in: 1 }] },
        fail: { t: '1년을 쏟았지만 커트라인이 너무 높았다.', log: '공무원 시험 낙방', sr: 12, hp: -8 }
      } },
    { id: 'dev', label: '개발자로 취업한다', intent: 'career', if: p => p.major === 'it' || (found(p, 'math') && p.stats.intelligence >= 55) || p.stats.intelligence >= 68,
      check: { base: 28, partial: 0.5, f: [['stat', 'intelligence', 0.4], ['eff', 'study', 0.2], ['eff', 'work', 0.3], ['fn', p => p.major === 'it' ? { label: '전공', v: 15 } : { label: '비전공', v: -8 }], ['talent', 'math', 8], ['region', 'job', 0.2], ['ageOver', 33, 1.5]] },
      out: {
        success: { t: '개발자로 첫 출근. 첫 커밋에 손이 떨렸다.', log: '개발자로 취업', job: 'developer', hp: 12, achv: 4 },
        partial: { t: '개발은 아니지만 IT 회사 운영팀에 들어갔다. 일단 발은 들였다.', log: 'IT 회사 입사', job: 'office_small', hp: 2 },
        fail: { t: '코딩 테스트에서 연달아 떨어졌다.', sr: 10, hp: -6 }
      } },
    { id: 'teacher', label: '임용시험을 본다', intent: 'stability', if: p => p.major === 'edu',
      check: { base: 32, partial: 0.6, f: [['stat', 'intelligence', 0.35], ['eff', 'study', 0.45]] },
      out: {
        success: { t: '임용 합격! 3월, 첫 담임을 맡았다.', log: '교사 임용', job: 'teacher', hp: 14, achv: 4 },
        partial: { t: '임용은 떨어졌지만 기간제 교사로 교단에 섰다.', log: '기간제 교사', job: 'teacher', jobOpt: { mul: 0.75 }, flag: 'contract_teacher' },
        fail: { t: '임용의 벽은 높았다.', sr: 10, hp: -6 }
      } },
    { id: 'nurse', label: '간호사로 일한다', intent: 'career', if: p => p.major === 'nursing',
      check: { base: 75, partial: 0, f: [['health', 0.2]] },
      out: { success: { t: '국가고시에 합격해 병동에 배치됐다.', log: '간호사로 취업', job: 'nurse', achv: 3 }, fail: { t: '국가고시에 떨어졌다. 내년에 다시 본다.', sr: 10 } } },
    { id: 'research', label: '연구소에 지원한다', intent: 'education', if: p => p.edu === 'grad',
      check: { base: 45, partial: 0, f: [['stat', 'intelligence', 0.5], ['eff', 'study', 0.2]] },
      out: { success: { t: '연구원이 되었다. 실험실 불은 늘 마지막에 꺼진다.', log: '연구원 취업', job: 'researcher', achv: 4 }, fail: { t: '자리가 없었다. 계약직 공고만 가득하다.', sr: 8 } } },
    { id: 'design', label: '디자인 회사에 들어간다', intent: 'hobby', if: p => p.major === 'arts',
      check: { base: 38, partial: 0.5, f: [['stat', 'creativity', 0.45], ['eff', 'art', 0.35], ['talent', 'art', 10]] },
      out: {
        success: { t: '포트폴리오가 통했다. 디자이너가 되었다.', log: '디자이너로 취업', job: 'designer', hp: 10 },
        partial: { t: '정규직 대신 프리랜서로 일을 받기 시작했다.', log: '프리랜서 시작', job: 'freelancer' },
        fail: { t: '포트폴리오를 들고 스무 곳을 돌았다. 연락이 없다.', sr: 10, hp: -6 }
      } },
    { id: 'tech', label: '기술을 배워 현장에 뛰어든다', intent: 'career', if: p => p.edu !== 'college' && p.edu !== 'grad',
      check: { base: 52, partial: 0.5, f: [['stat', 'physical', 0.2], ['talent', 'mechanical', 15], ['flag', 'certified', 15, '자격증'], ['flag', 'vocational', 12, '특성화고 출신'], ['eff', 'work', 0.2]] },
      out: {
        success: { t: '기술직으로 채용됐다. 손에 굳은살이 박이기 시작했다.', log: '기술직 취업', job: 'technician', hp: 8, fn: disc('mechanical') },
        partial: { t: '생산 라인에서 일을 시작했다. 교대 근무가 고되다.', log: '생산직 취업', job: 'factory' },
        fail: { t: '자리가 나지 않아 우선 아르바이트를 시작했다.', job: 'parttime', hp: -4 }
      } },
    { id: 'small', label: '중소기업에 들어간다', intent: 'stability',
      check: { base: 64, partial: 0.4, f: [['region', 'job', 0.3], ['stat', 'social', 0.2], ['ageOver', 35, 1.5]] },
      out: {
        success: { t: '작은 회사지만 내 책상이 생겼다.', log: '중소기업 입사', job: 'office_small', hp: 6 },
        partial: { t: '사무직은 안 됐지만 매장 관리직으로 들어갔다.', log: '서비스직 취업', job: 'service' },
        fail: { t: '면접에서 "다음에 연락드리겠습니다"만 반복해서 들었다.', sr: 8, hp: -5 }
      } },
    { id: 'creative', label: '좋아하는 일로 승부한다 (예술·음악·글·방송)', intent: 'adventure',
      if: p => found(p, 'art') || found(p, 'music') || found(p, 'writing') || has(p, 'gamer_dream') || p.stats.creativity >= 66 || p.effort.art >= 30,
      check: { base: 14, partial: 0.5, max: 60, f: [['stat', 'creativity', 0.45], ['eff', 'art', 0.4], ['talent', 'art', 10], ['talent', 'music', 10], ['talent', 'writing', 10], ['flag', 'gamer_dream', 10, '게임 실력'], ['region', 'culture', 0.15]] },
      out: {
        success: { t: '꿈꾸던 일로 첫 수입을 얻었다. 가난해도 행복하다.', log: '좋아하는 일로 데뷔', flag: ['found_calling', 'dream_job'], hp: 14, achv: 4, fn: p => { LG.Outcome.setJob(p, H.creativeJob(p)); return ''; } },
        partial: { t: '프리랜서로 일을 받으며 꿈을 이어 가는 중이다.', log: '프리랜서 시작', job: 'freelancer', flag: 'found_calling', hp: 4 },
        fail: { t: '꿈만으로 월세를 낼 수는 없었다. 아르바이트를 시작했다.', log: '꿈을 미루고 아르바이트', job: 'parttime', flag: 'dream_deferred', hp: -8 }
      } },
    { id: 'shop', label: '작은 가게를 차린다', intent: 'risk', if: p => p.age >= 30 && p.money >= 2000,
      check: { base: 38, partial: 0.5, f: [['talent', 'entrepreneur', 14], ['stat', 'social', 0.3], ['assets', 0.4], ['region', 'job', 0.15], ['fn', p => p.family.tags.indexOf('self_employed') >= 0 ? { label: '장사하는 집안', v: 8 } : null]] },
      out: {
        success: { t: '가게 문을 열었다. 첫 손님이 들어왔다.', log: '가게 창업', job: 'selfemp', money: -2000, flag: 'started_business', queue: [{ id: 'w_business_check', in: 3 }] },
        partial: { t: '가게를 열었지만 손님이 뜸하다.', log: '가게 창업 (고전 중)', job: 'selfemp', jobOpt: { mul: 0.65 }, money: -2000, flag: 'started_business', queue: [{ id: 'w_business_check', in: 2 }] },
        fail: { t: '권리금만 날렸다. 1년 만에 문을 닫았다.', log: '가게 폐업', money: -3500, flag: 'business_failed', sr: 15, hp: -12 }
      } },
    { id: 'service', label: '당장 할 수 있는 일부터 한다', intent: 'money', if: p => (p.edu !== 'college' && p.edu !== 'grad') || (p.done.w_first_job || 0) >= 2,
      out: { t: '일단 매장 일을 시작했다. 생활비는 벌어야 하니까.', log: '서비스직으로 일을 시작', job: 'service' } }
  ];

  E.push({
    id: 'w_first_job', cat: 'career', tier: 'major', ages: [18, 62], milestone: true, prio: 5, cd: 1, icon: '💼',
    if: p => p.status === 'seeking' && !p.job,
    label: '일자리', title: p => p.jobHistory.length ? '다시 일자리를 찾아서' : '첫 직장',
    text: p => p.jobHistory.length
      ? `${p.age}세. 다시 이력서를 쓴다. 어떤 일을 찾아볼까?`
      : (p.edu === 'college' || p.edu === 'grad') ? '졸업장을 받았다. 이제 진짜 사회로 나갈 시간이다.' : '이력서를 쓰는 손이 어색하다. 어떤 일을 할까?',
    wait: '연락을 기다리는 중',
    choices: JOB_CHOICES
  });

  E.push({
    id: 'w_better_job', cat: 'career', tier: 'choice', ages: [21, 45], w: 10, cd: 4, icon: '🪜',
    if: p => jobIn(p, ['parttime', 'service', 'factory']) && p.job.years >= 1,
    label: '커리어', title: '더 나은 자리',
    text: '{job} 일을 한 지 몇 년. 이대로 괜찮을까? 다른 일에 도전해 볼까?',
    wait: '연락을 기다리는 중',
    choices: JOB_CHOICES.filter(c => c.id !== 'service').map(c => Object.assign({}, c, {
      out: Object.assign({}, c.out, { fail: Object.assign({}, c.out.fail, { job: undefined, t: (c.out.fail.t || '') + ' 하던 일은 계속하기로 했다.' }) })
    })).concat([{ id: 'stay', label: '지금 일을 계속한다', intent: 'stability', out: { t: '익숙한 일이 주는 안정감도 있다.', eff: { work: 8 } } }])
  });

  E.push({
    id: 'w_civil_retry', cat: 'career', tier: 'major', queued: true, icon: '📖',
    if: p => p.status === 'seeking',
    label: '다시 한 번', title: '공무원 시험, 한 번 더',
    text: '작년엔 몇 문제 차이였다. 다시 도전할까?',
    choices: [
      { id: 'again', label: '한 번 더 도전한다', intent: 'stability',
        check: { base: 38, partial: 0, f: [['stat', 'intelligence', 0.3], ['eff', 'study', 0.45], ['stat', 'mental', 0.25]] },
        out: {
          success: { t: '합격! 버틴 보람이 있었다.', log: '재도전 끝에 공무원 합격', job: 'civil', hp: 16, achv: 4, flag: 'late_bloomer' },
          fail: { t: '또 떨어졌다. 공시는 여기까지.', log: '공무원 시험 포기', sr: 10, hp: -10, flag: 'civil_quit' }
        } },
      { id: 'other', label: '다른 길을 찾는다', intent: 'career', out: { t: '미련을 접고 다른 길을 찾기로 했다.', minor: true } }
    ]
  });

  E.push({
    id: 'u_night_college', cat: 'education', tier: 'choice', ages: [22, 45], w: 6, max: 1, icon: '🌙',
    if: p => p.edu !== 'college' && p.edu !== 'grad' && !!p.job && !p.college,
    label: '배움', title: '야간 대학',
    text: '일하면서 학위를 딴 동료가 있다. 나도 해 볼 수 있을까?',
    choices: [
      { id: 'go', label: '야간 대학에 등록한다', intent: 'education',
        check: { base: 42, partial: 0, f: [['stat', 'mental', 0.4], ['stat', 'intelligence', 0.25], ['eff', 'work', 0.15], ['assets', 0.2], ['stress', 0.2]] },
        out: {
          success: { t: '퇴근 후 강의실로 향하는 4년이 시작됐다.', log: '야간 대학 입학', flag: ['night_college', 'late_bloomer'], sr: 10, eff: { study: 25 }, fn: p => { p.college = { end: p.age + 4, kind: 'night' }; return ''; } },
          fail: { t: '일과 공부를 같이 하다 몸살이 났다. 한 학기 만에 그만뒀다.', st: { health: -5 }, sr: 6 }
        } },
      { id: 'no', label: '지금은 일에 집중한다', intent: 'career', out: { t: '학위보다 경력이라고 생각했다.', eff: { work: 10 } } }
    ]
  });

  E.push({
    id: 'u_cert', cat: 'education', tier: 'choice', ages: [20, 50], w: 7, cd: 6, max: 2, icon: '📜',
    if: p => p.edu !== 'grad' && (jobIn(p, ['factory', 'service', 'technician', 'parttime', 'office_small', 'driver']) || p.status === 'seeking'),
    label: '배움', title: '자격증',
    text: '자격증이 하나 있으면 길이 훨씬 넓어질 것 같다.',
    choices: [
      { id: 'study', label: '퇴근 후 공부한다', intent: 'education',
        check: { base: 45, partial: 0, f: [['stat', 'intelligence', 0.35], ['stat', 'mental', 0.2], ['eff', 'study', 0.2], ['stress', 0.2], ['talent', 'mechanical', 8]] },
        out: {
          success: { t: p => jobIn(p, ['factory', 'service', 'parttime', 'driver']) ? '자격증을 따고 기술직으로 자리를 옮겼다.' : '자격증을 땄다. 인정받기 시작했다.', log: '자격증 취득', flag: 'certified', eff: { work: 10 }, achv: 3, perf: 10,
            fn: p => { if (jobIn(p, ['factory', 'service', 'parttime', 'driver'])) LG.Outcome.setJob(p, 'technician', { perf: 55 }); return ''; } },
          fail: { t: '필기는 붙었는데 실기에서 떨어졌다.', sr: 6 }
        } },
      { id: 'no', label: '쉬는 시간이 더 소중하다', intent: 'rest', out: { t: '저녁은 쉬라고 있는 거다.', sr: -4 } }
    ]
  });

  E.push({
    id: 'h_move_out', cat: 'housing', tier: 'choice', ages: [21, 34], w: 9, max: 2, cd: 3, icon: '🔑',
    if: p => p.home === 'parents' && !!p.job,
    label: '독립', title: '혼자 살아 볼까',
    text: '부모님 집에서 출퇴근한 지 꽤 됐다. 이제 독립할 때일까?',
    choices: [
      { id: 'out', label: '방을 구해 독립한다', intent: 'adventure',
        check: { base: 55, partial: 0.5, f: [['assets', 0.6], ['fn', p => ({ label: '지역 주거비', v: -(S().liveRegion(p).rent - 600) / 40 })]] },
        out: {
          success: { t: '{region}에 작은 원룸을 구했다. 내 공간이 생겼다.', log: '독립', home: 'rent', hp: 10, rel: { parents: -2 }, flag: 'independent_life' },
          partial: { t: '반지하 방밖에 구하지 못했다. 그래도 내 방이다.', log: '독립 (반지하)', home: 'rent', hp: 3, st: { health: -2 } },
          fail: { t: '보증금이 모자랐다. 조금 더 모아야 한다.', sr: 5 }
        } },
      { id: 'stay', label: '돈을 모으며 부모님과 산다', intent: 'money', out: { t: '눈치는 보이지만 통장은 든든해진다.', flag: 'saved_early', rel: { parents: 3 }, hp: -2 } }
    ]
  });

  // ───────────────────────── 연애 · 결혼 ─────────────────────────

  const MEET_TEXT = ['소개팅에서 대화가 유난히 잘 통하는 사람을 만났다.', '동호회에서 자꾸 눈이 마주치는 사람이 있다.', '친구 결혼식 뒤풀이에서 옆자리에 앉은 사람과 밤새 이야기했다.', '회사 근처 단골 카페에서 매일 마주치는 사람이 있다.', '친구가 "너랑 딱 맞을 것 같은 사람이 있어"라며 연락처를 건넸다.'];
  E.push({
    id: 'r_meet', cat: 'relationship', tier: 'choice', ages: [20, 50], cd: 1, icon: '💘',
    w: p => (p.age < 36 ? 22 : 9) + (has(p, 'had_breakup') ? -2 : 0),
    if: p => H.single(p) && p.status !== 'military' && !has(p, 'childfree_single'),
    label: '인연', title: '새로운 인연',
    text: p => MEET_TEXT[(p.age * 7 + p.choices) % MEET_TEXT.length],
    choices: [
      { id: 'confess', label: '먼저 마음을 표현한다', intent: 'love',
        check: { base: 40, partial: 0.55, f: [['stat', 'social', 0.35], ['trait', 'extrovert', 5], ['assets', 0.25], ['happy', 0.2], ['flag', 'had_breakup', -3, '지난 이별의 상처'], ['ageOver', 38, 1]] },
        out: {
          success: { t: '용기를 냈다. {partner}와(과) 연애를 시작했다.', log: '{partner}와 연애 시작', hp: 14, fn: H.lover() },
          partial: { t: '"조금 더 알아가고 싶어요." 애매한 사이가 이어졌다.', queue: [{ id: 'r_some', in: 1 }], hp: 2 },
          fail: { t: '정중하게 거절당했다. 집에 오는 길이 길었다.', log: '고백 거절', hp: -8 }
        } },
      { id: 'slow', label: '천천히 친구로 지낸다', intent: 'social',
        check: { base: 50, partial: 0, f: [['stat', 'social', 0.3], ['trait', 'careful', 6]] },
        out: {
          success: { t: '편하게 연락하는 사이가 됐다.', queue: [{ id: 'r_some', in: 1 }] },
          fail: { t: '자연스럽게 연락이 끊겼다.', hp: -2 }
        } },
      { id: 'pass', label: '지금은 내 일에 집중한다', intent: 'career', out: { t: '연애는 나중에. 지금은 내 일이 먼저다.', eff: { work: 8 } } }
    ]
  });

  E.push({
    id: 'r_some', cat: 'relationship', tier: 'choice', queued: true, icon: '💭',
    if: p => H.single(p),
    label: '인연', title: '애매한 사이',
    text: '몇 달째 매일 연락은 하는데, 우리 무슨 사이일까?',
    choices: [
      { id: 'confess', label: '확실하게 고백한다', intent: 'love',
        check: { base: 52, partial: 0, f: [['stat', 'social', 0.3], ['happy', 0.2], ['trait', 'introvert', -4]] },
        out: {
          success: { t: '"나도 기다리고 있었어." {partner}와(과) 연인이 되었다.', log: '{partner}와 연애 시작', hp: 15, fn: H.lover() },
          fail: { t: '"좋은 친구로 남자." 그렇게 정리됐다.', hp: -6, fn: H.friend(55, '친구로 남은 인연') }
        } },
      { id: 'wait', label: '그냥 이대로 둔다', intent: 'stability', out: { t: '흐지부지 연락이 뜸해졌다.', hp: -2 } }
    ]
  });

  E.push({
    id: 'r_propose', cat: 'marriage', tier: 'major', ages: [24, 60], cd: 2, milestone: true, prio: 2, icon: '💍',
    w: p => { const pt = H.rel(p, 'partner'); return pt ? 10 + (p.age - pt.since) * 6 + (p.age >= 30 ? 6 : 0) : 0; },
    if: p => { const pt = H.rel(p, 'partner'); return !!pt && p.age - pt.since >= 2; },
    label: '결혼', title: '함께하는 미래',
    text: '{partner}와(과) 만난 지 꽤 되었다. 함께하는 미래를 그려 본다.',
    choices: [
      { id: 'propose', label: '프러포즈한다', intent: 'love',
        check: { base: 40, partial: 0.5, f: [['rel', 'partner', 0.6], ['assets', 0.45], ['fn', p => p.job ? { label: '직업 안정성', v: (LG.DATA.jobs[p.job.id].stab - 50) * 0.15 } : { label: '불안정한 벌이', v: -12 }], ['ageOver', 42, 0.6]] },
        out: {
          success: { t: '"응." {spouse}와(과) 결혼했다! 식장에서 부모님이 우셨다.', log: '{spouse}와 결혼', hp: 16, achv: 2, money: -1500, rel: { parents: 4 },
            fn: p => { LG.Rel.marry(p); if (p.age < 28) S().flag(p, 'married_young'); if (p.home === 'parents') p.home = 'rent'; return ''; } },
          partial: { t: '"조금만 더 생각해 보고 싶어." 대답이 미뤄졌다.', rel: { partner: -3 } },
          fail: { t: '"우린 원하는 미래가 달라." 결국 헤어졌다.', log: '프러포즈 거절, 이별', hp: -14, fn: p => { LG.Rel.breakup(p); return ''; } }
        } },
      { id: 'wait', label: '아직은 연애만 한다', intent: 'independence', out: { t: '지금이 좋다. 서두르지 않기로 했다.', rel: { partner: 2 } } },
      { id: 'end', label: '헤어진다', intent: 'independence', out: { t: '서로를 위해 각자의 길을 가기로 했다.', log: '{partner}와 이별', hp: -8, fn: p => { LG.Rel.breakup(p); return ''; } } }
    ]
  });

  E.push({
    id: 'r_couple_fight', cat: 'relationship', tier: 'choice', ages: [17, 70], w: 5, cd: 4, icon: '⛈️',
    if: p => !!H.rel(p, 'partner'),
    label: '연애', title: '잦아진 다툼',
    text: '사소한 말다툼이 점점 잦아진다. {partner}의 표정이 차갑다.',
    choices: [
      { id: 'talk', label: '진지하게 대화한다', intent: 'love',
        check: { base: 50, partial: 0, f: [['rel', 'partner', 0.5], ['stat', 'social', 0.3], ['stress', 0.25]] },
        out: { success: { t: '밤새 이야기했다. 서로를 조금 더 알게 됐다.', rel: { partner: 12 }, hp: 4 }, fail: { t: '대화는 결국 싸움으로 번졌다.', rel: { partner: -9 }, hp: -4 } } },
      { id: 'space', label: '잠시 거리를 둔다', intent: 'independence',
        check: { base: 45, partial: 0, f: [['rel', 'partner', 0.4]] },
        out: { success: { t: '잠깐의 거리가 서로를 그립게 만들었다.', rel: { partner: 5 } }, fail: { t: '그 거리가 결국 이별이 되었다.', log: '{partner}와 이별', hp: -10, fn: p => { LG.Rel.breakup(p); return ''; } } } },
      { id: 'end', label: '헤어진다', intent: 'independence', out: { t: '더는 서로를 아프게 하지 않기로 했다.', log: '이별', hp: -8, fn: p => { LG.Rel.breakup(p); return ''; } } }
    ]
  });

  E.push({
    id: 'r_marriage_crisis', cat: 'marriage', tier: 'major', ages: [28, 80], cd: 4, icon: '🥀',
    w: p => { const s = H.rel(p, 'spouse'); return s ? Math.max(0, 55 - s.rel) * 1.2 : 0; },
    if: p => { const s = H.rel(p, 'spouse'); return !!s && s.rel < 52; },
    label: '부부의 위기', title: '같은 집, 다른 마음',
    text: '{spouse}와(과) 대화가 사라진 지 오래다. 같은 집에 사는 남 같다.',
    choices: [
      { id: 'counsel', label: '부부 상담을 받는다', intent: 'family',
        check: { base: 45, partial: 0.5, f: [['rel', 'spouse', 0.5], ['stat', 'social', 0.2], ['stress', 0.2]] },
        out: {
          success: { t: '상담실에서 처음으로 서로의 이야기를 끝까지 들었다.', log: '부부 상담으로 관계 회복', rel: { spouse: 20 }, hp: 6 },
          partial: { t: '조금 나아졌다. 아직 갈 길이 멀다.', rel: { spouse: 7 } },
          fail: { t: '상담실에서도 서로 탓만 했다.', rel: { spouse: -6 }, sr: 6 }
        } },
      { id: 'time', label: '일을 줄이고 함께 시간을 보낸다', intent: 'family',
        out: { t: '저녁 약속을 줄이고 주말엔 함께 걸었다. 어색하지만 나쁘지 않다.', rel: { spouse: 12, children: 6 }, flag: 'family_time', unflag: 'workaholic', perf: -8, sr: -6 } },
      { id: 'divorce', label: '이혼을 결심한다', intent: 'independence',
        out: { t: '긴 이야기 끝에 각자의 길을 가기로 했다.', log: '이혼', hp: -16, sr: 12, fn: p => { LG.Rel.divorce(p); return ''; } } }
    ]
  });

  E.push({
    id: 'r_late_love', cat: 'relationship', tier: 'choice', ages: [42, 85], w: 6, cd: 5, icon: '🌷',
    if: p => H.single(p) && (has(p, 'divorced') || has(p, 'widowed') || p.age >= 45),
    label: '인연', title: '늦게 찾아온 인연',
    text: '모임에서 만난 사람과 이야기하는 시간이 기다려진다.',
    choices: [
      { id: 'go', label: '마음을 열어 본다', intent: 'love',
        check: { base: 45, partial: 0, f: [['stat', 'social', 0.3], ['happy', 0.3], ['health', 0.15]] },
        out: { success: { t: '이 나이에도 설렐 수 있다는 게 신기하다. {partner}와(과) 만나기 시작했다.', log: '{partner}와 늦은 연애', hp: 14, flag: 'late_love', fn: H.lover() }, fail: { t: '상대는 친구로 지내길 원했다.', hp: -4, fn: H.friend(55, '모임 친구') } } },
      { id: 'alone', label: '혼자가 편하다', intent: 'independence', out: { t: '혼자인 삶에도 익숙해졌다.', hp: 2, st: { mental: 2 } } }
    ]
  });

  E.push({
    id: 'r_reunion', cat: 'relationship', tier: 'choice', ages: [28, 60], w: 3, max: 1, icon: '🌉',
    if: p => H.single(p) && (has(p, 'first_love') || has(p, 'had_breakup')),
    label: '인연', title: '옛 인연',
    text: '우연히 옛 연인을 길에서 마주쳤다. 서로 어색하게 웃었다.',
    choices: [
      { id: 'coffee', label: '커피 한잔 하자고 한다', intent: 'love',
        check: { base: 32, partial: 0, f: [['stat', 'social', 0.3], ['happy', 0.15]] },
        out: { success: { t: '다시 시작하기로 했다. 이번엔 다를 것 같다.', log: '옛 연인과 재회', hp: 14, flag: 'reunion', fn: H.lover() }, fail: { t: '반가웠지만 그걸로 끝이었다.', hp: -2 } } },
      { id: 'pass', label: '인사만 하고 지나간다', intent: 'stability', out: { t: '지나간 일은 지나간 대로.', minor: true } }
    ]
  });

  // ───────────────────────── 자녀 ─────────────────────────

  E.push({
    id: 'k_child', cat: 'child', tier: 'major', ages: [25, 44], cd: 3, milestone: true, prio: 2, icon: '👶',
    w: p => H.kids(p).length === 0 ? 24 : 9,
    if: p => !!H.rel(p, 'spouse') && H.kids(p).length < 3 && !has(p, 'childfree') && p.age - H.rel(p, 'spouse').since >= 1 && (H.kids(p).length === 0 || p.age - p.flags.parent >= 2),
    label: '가족', title: p => H.kids(p).length ? '또 한 명의 가족?' : '아이를 가질까',
    text: p => H.kids(p).length ? '{spouse}와(과) 둘째 이야기가 나왔다. 아이가 동생을 갖고 싶어 한다.' : '{spouse}와(과) 아이 이야기를 꺼냈다. 우리가 부모가 될 수 있을까?',
    choices: [
      { id: 'yes', label: '아이를 갖는다', intent: 'family',
        check: { base: 74, partial: 0.5, f: [['ageOver', 34, 2.6], ['health', 0.2], ['rel', 'spouse', 0.15]] },
        out: {
          success: { t: '', log: '자녀 출생', hp: 15, sr: 8, achv: 2, rel: { spouse: 5 }, fn: p => { const c = LG.Rel.haveChild(p); return `${c.name.slice(1)}이(가) 태어났다. 작은 손이 내 손가락을 꼭 잡았다.`; } },
          partial: { t: '아이가 쉽게 찾아오지 않았다. 마음이 지쳐 간다.', sr: 10, hp: -6 },
          fail: { t: '난임 판정을 받았다. 병원을 오가는 날들이 길어진다.', sr: 14, hp: -10, money: -500 }
        } },
      { id: 'later', label: '아직은 둘만의 시간을', intent: 'love', out: { t: '조금 더 둘이서 지내기로 했다.', rel: { spouse: 3 } } },
      { id: 'no', label: p => H.kids(p).length ? '지금으로 충분하다' : '아이 없이 살기로 한다', intent: 'independence',
        out: { t: p => H.kids(p).length ? '지금 가족으로 충분하다고 생각했다.' : '둘이서도 충분하다고 생각했다.', flag: 'childfree' } }
    ]
  });

  E.push({
    id: 'k_education', cat: 'child', tier: 'choice', ages: [30, 65], w: 14, max: 1, icon: '📚',
    if: p => H.kids(p).some(c => c.age >= 8 && c.age <= 14),
    label: '자녀', title: '아이의 교육',
    text: '{child}의 교육을 어떻게 할까? 옆집 아이는 학원을 네 개 다닌다고 한다.',
    choices: [
      { id: 'hagwon', label: '학원을 보내 공부시킨다', intent: 'education',
        out: { t: '학원비가 월급에서 숭덩숭덩 빠져나간다.', flag: 'kid_hagwon', fn: p => { H.kids(p).forEach(c => { c.edu = (c.edu || 50) + 15; c.rel -= 6; }); return ''; } } },
      { id: 'free', label: '스스로 하게 둔다', intent: 'independence', out: { t: '아이를 믿어 보기로 했다.', flag: 'kid_free', rel: { children: 6 } } },
      { id: 'arts', label: '하고 싶은 걸 하게 해 준다 (예체능)', intent: 'hobby', out: { t: '아이가 무대 위에서 반짝였다.', flag: 'kid_arts', rel: { children: 10 } } },
      { id: 'time', label: '돈보다 시간을 쓴다', intent: 'family', out: { t: '매주 주말 아이와 캠핑을 갔다.', flag: 'family_time', rel: { children: 12, spouse: 4 }, perf: -6 } }
    ]
  });

  E.push({
    id: 'k_child_indep', cat: 'child', tier: 'choice', ages: [45, 80], w: 12, max: 1, icon: '🏡',
    if: p => H.kids(p).some(c => c.age >= 26 && c.age <= 36) && p.money >= 1500,
    label: '자녀', title: '자녀의 독립',
    text: '{child}이(가) 독립해 새 출발을 앞두고 있다. 집 구할 돈이 모자란다고 한다.',
    choices: [
      { id: 'give', label: '목돈을 보태준다', intent: 'family',
        out: { t: '', log: '자녀에게 목돈 지원', rel: { children: 15 }, flag: 'supported_kids', fn: p => { const amt = Math.round(Math.min(p.money * 0.4, 15000) / 100) * 100; p.money -= amt; return `${LG.U.money(amt)}원을 보태 주었다. 아이가 고맙다며 울었다.`; } } },
      { id: 'self', label: '스스로 하게 한다', intent: 'independence', out: { t: '"너도 이제 어른이다." 서운한 기색이 보였다.', rel: { children: -5 } } }
    ]
  });

  // ───────────────────────── 가족 ─────────────────────────

  E.push({
    id: 'f_parent_ill', cat: 'family', tier: 'major', ages: [35, 75], w: 12, max: 1, icon: '🏥',
    if: p => LG.Rel.parents(p).some(n => n.health < 55 || n.age >= 75),
    label: '가족', title: '부모님의 건강',
    text: '{parent}의 건강이 많이 나빠지셨다. 누군가 곁에 있어야 한다.',
    choices: [
      { id: 'care', label: '내가 모신다', intent: 'family',
        out: { t: '퇴근하면 병간호가 기다린다. 힘들지만, 함께하는 시간이 소중하다.', log: '부모님을 모심', flag: ['caregiver', 'supporting_parents'], rel: { parents: 15 }, sr: 15, perf: -10, hp: -4, fn: p => { LG.Rel.parents(p).forEach(n => n.health = Math.min(100, n.health + 6)); return ''; } } },
      { id: 'facility', label: '요양 시설에 모신다', intent: 'stability',
        check: { base: 58, partial: 0, f: [['assets', 0.5]] },
        out: { success: { t: '좋은 시설을 찾았다. 주말마다 찾아뵙는다.', money: -1500, rel: { parents: -3 } }, fail: { t: '좋은 시설은 대기가 길고 비쌌다. 무리해서 모셨다.', money: -2500, sr: 8, rel: { parents: -6 } } } },
      { id: 'share', label: '형제들과 분담한다', intent: 'family', if: p => !!H.rel(p, 'sibling'),
        check: { base: 45, partial: 0, f: [['rel', 'sibling', 0.5]] },
        out: { success: { t: '형제들과 돌아가며 모시기로 했다. 오랜만에 가족이 모였다.', money: -600, rel: { siblings: 8, parents: 6 } }, fail: { t: '누가 더 부담하느냐로 형제끼리 크게 다퉜다.', log: '간병 문제로 형제와 다툼', rel: { siblings: -22 }, sr: 12 } } }
    ]
  });

  E.push({
    id: 'f_sibling_money', cat: 'family', tier: 'choice', ages: [28, 65], w: 5, max: 1, icon: '🤲',
    if: p => !!H.rel(p, 'sibling') && p.money >= 1000,
    label: '가족', title: '형제의 부탁',
    text: '{sibling}이(가) 사업 자금이 급하다며 1천만 원만 빌려달라고 한다.',
    choices: [
      { id: 'lend', label: '빌려준다', intent: 'family',
        check: { base: 45, partial: 0.4, f: [['rel', 'sibling', 0.3], ['fn', p => { const s = H.rel(p, 'sibling'); return s && (s.personality === '실용적' || s.personality === '이성적') ? { label: '형제의 성실함', v: 12 } : null; }]] },
        out: {
          success: { t: '1년 만에 이자까지 쳐서 갚았다. 형제 사이가 더 끈끈해졌다.', money: 150, rel: { siblings: 12 } },
          partial: { t: '절반만 돌려받았다. 나머지는 말하지 않기로 했다.', money: -500 },
          fail: { t: '연락이 끊겼다. 돈도, 형제도 잃은 기분이다.', log: '형제에게 빌려준 돈을 잃음', money: -1000, rel: { siblings: -28 }, hp: -8 }
        } },
      { id: 'no', label: '거절한다', intent: 'stability', out: { t: '"미안하다." 한동안 연락이 뜸해졌다.', rel: { siblings: -9 } } }
    ]
  });

  E.push({
    id: 'f_support_parents', cat: 'family', tier: 'choice', ages: [27, 55], w: 6, max: 1, icon: '🧧',
    if: p => !!p.job && p.family.tier <= 3 && LG.Rel.parents(p).length > 0 && !has(p, 'supporting_parents'),
    label: '가족', title: '부모님의 노후',
    text: '부모님의 벌이가 줄었다. 생활비가 빠듯하신 것 같다.',
    choices: [
      { id: 'send', label: '매달 생활비를 보내드린다', intent: 'family', out: { t: '매달 조금씩 보내드리기로 했다. 전화 목소리가 밝아지셨다.', log: '부모님 생활비 지원 시작', flag: 'supporting_parents', rel: { parents: 10 } } },
      { id: 'later', label: '내 앞가림이 먼저다', intent: 'money', out: { t: '지금은 내 미래를 준비할 때다. 마음은 무겁다.', flag: 'saved_early', rel: { parents: -4 } } }
    ]
  });

  // ───────────────────────── 경력 ─────────────────────────

  E.push({
    id: 'w_burnout', cat: 'career', tier: 'major', ages: [24, 60], cd: 4, icon: '🔥',
    w: p => Math.max(0, p.stress - 52) * 0.8,
    if: p => !!p.job && p.stress >= 60,
    label: '번아웃', title: '더는 못 하겠다',
    text: '아침에 눈을 뜨는 게 두렵다. 회사 앞에서 발이 떨어지지 않는다.',
    choices: [
      { id: 'quit', label: '퇴사한다', intent: 'rest',
        out: { t: '사직서를 냈다. 후련하면서도 막막하다.', log: '번아웃으로 퇴사', quit: true, sr: -28, hp: 6 } },
      { id: 'leave', label: '긴 휴가를 쓴다', intent: 'health',
        check: { base: 52, partial: 0, f: [['job', ['civil', 'teacher', 'office_big', 'researcher'], 14, '제도가 갖춰진 직장'], ['perf', 0.2]] },
        out: { success: { t: '한 달간 아무것도 하지 않았다. 다시 숨이 쉬어진다.', sr: -22, hp: 8 }, fail: { t: '눈치가 보여 결국 휴가를 반납했다.', sr: 6, hp: -4 } } },
      { id: 'endure', label: '참고 계속 다닌다', intent: 'career',
        check: { base: 42, partial: 0.4, f: [['stat', 'mental', 0.5], ['health', 0.2]] },
        out: {
          success: { t: '어느 순간 고비를 넘겼다. 단단해진 기분이다.', perf: 10, sr: -6, st: { mental: 3 } },
          partial: { t: '버티고는 있다. 웃는 날이 줄었다.', sr: 4, hp: -5 },
          fail: { t: '몸이 먼저 신호를 보냈다. 원형탈모가 생겼다.', log: '번아웃을 버티다 건강을 잃음', st: { health: -9 }, sr: 8, flag: 'burnout_scar' }
        } }
    ]
  });

  E.push({
    id: 'w_promotion', cat: 'career', tier: 'choice', ages: [27, 58], w: 9, cd: 4, icon: '📊',
    if: p => !!p.job && p.job.years >= 3 && LG.DATA.jobs[p.job.id].stab >= 40 && p.job.id !== 'parttime',
    label: '커리어', title: '승진 기회',
    text: '회사가 큰 프로젝트를 맡을 사람을 찾는다. 성공하면 승진이다.',
    choices: [
      { id: 'take', label: '프로젝트를 맡는다', intent: 'career',
        check: { base: 40, partial: 0.5, f: [['perf', 0.5], ['stat', 'intelligence', 0.2], ['stat', 'social', 0.2], ['eff', 'work', 0.3], ['jobYears', 1, 10]] },
        out: {
          success: { t: '프로젝트가 대성공했다. 승진 발표에 내 이름이 있었다.', log: '승진', perf: 10, achv: 6, sr: 4, hp: 10, flag: 'promoted', fn: H.mulJob(1.15) },
          partial: { t: '무난하게 마쳤다. 승진은 다음 기회로.', perf: 3 },
          fail: { t: '프로젝트가 엎어졌다. 책임은 내 몫이었다.', log: '프로젝트 실패', perf: -12, sr: 10, hp: -6 }
        } },
      { id: 'pass', label: '무리하지 않는다', intent: 'stability', out: { t: '승진보다 저녁이 있는 삶을 택했다.', sr: -5, perf: -2, flag: 'work_life' } },
      { id: 'all', label: '모든 걸 걸고 일한다', intent: 'career',
        out: { t: '새벽에 출근하고 자정에 퇴근했다. 성과는 오르고, 집은 멀어졌다.', log: '일에 모든 걸 걸기로 함', flag: 'workaholic', unflag: 'family_time', eff: { work: 35 }, perf: 8, sr: 12, rel: { love: -6, children: -5 } } }
    ]
  });

  E.push({
    id: 'w_job_change', cat: 'career', tier: 'choice', ages: [27, 55], w: 8, cd: 4, icon: '📨',
    if: p => !!p.job && p.job.years >= 2 && ['parttime', 'selfemp', 'ceo', 'artist', 'writer', 'musician', 'athlete'].indexOf(p.job.id) < 0,
    label: '커리어', title: '이직 제안',
    text: '헤드헌터에게서 연락이 왔다. 연봉을 꽤 올려 주겠다고 한다.',
    choices: [
      { id: 'move', label: '이직한다', intent: 'career',
        check: { base: 50, partial: 0.5, f: [['perf', 0.3], ['jobYears', 1, 10], ['stat', 'social', 0.2], ['ageOver', 45, 1.5]] },
        out: {
          success: { t: '이직에 성공했다. 새 명함이 생겼다.', log: '이직 성공', hp: 8, flag: 'job_changed', fn: p => { H.mulJob(1.25)(p); p.job.carry = (p.job.carry || 0) + p.job.years; p.job.years = 0; return ''; } },
          partial: { t: '연봉은 올랐지만 새 회사 분위기가 숨 막힌다.', log: '이직', sr: 10, fn: p => { H.mulJob(1.12)(p); p.job.carry = (p.job.carry || 0) + p.job.years; p.job.years = 0; return ''; } },
          fail: { t: '최종 면접에서 떨어졌다. 지금 회사에 소문까지 났다.', perf: -8, sr: 6 }
        } },
      { id: 'nego', label: '지금 회사와 연봉 협상을 한다', intent: 'money',
        check: { base: 42, partial: 0, f: [['perf', 0.5], ['stat', 'social', 0.2]] },
        out: { success: { t: '회사가 연봉을 맞춰 줬다.', fn: H.mulJob(1.1) }, fail: { t: '분위기만 어색해졌다.', perf: -3 } } },
      { id: 'stay', label: '남는다', intent: 'stability', out: { t: '익숙한 곳이 좋다.', minor: true } }
    ]
  });

  E.push({
    id: 'w_overseas', cat: 'opportunity', tier: 'major', ages: [25, 48], w: 5, max: 1, icon: '🌏',
    if: p => jobIn(p, ['office_big', 'developer', 'researcher', 'office_small', 'technician', 'designer', 'nurse']),
    label: '새로운 기회', title: '해외 근무 제안',
    text: '회사에서 해외 법인 근무를 제안했다. 연봉은 오르지만 가족·친구와 떨어져야 한다.',
    choices: [
      { id: 'go', label: '해외로 간다', intent: 'adventure',
        check: { base: 55, partial: 0.4, f: [['talent', 'language', 12], ['stat', 'social', 0.25], ['stat', 'mental', 0.2], ['flag', 'exchange', 8, '교환학생 경험']] },
        out: {
          success: { t: '3년간 해외에서 일했다. 낯선 도시가 두 번째 고향이 됐다.', log: '해외 근무', exp: 16, achv: 5, flag: 'worked_abroad', rel: { friends: -8, parents: -4 }, fn: seq(H.mulJob(1.3), p => { if (H.rel(p, 'spouse') && H.kids(p).length) S().flag(p, 'abroad_alone'); return ''; }), queue: [{ id: 'a_return_home', in: 3 }] },
          partial: { t: '일은 잘 풀렸지만 외로움이 컸다.', exp: 12, sr: 10, flag: 'worked_abroad', rel: { love: -6 }, fn: H.mulJob(1.2), queue: [{ id: 'a_return_home', in: 2 }] },
          fail: { t: '적응에 실패했다. 1년 만에 돌아왔다.', log: '해외 근무 조기 귀국', exp: 6, sr: 10, perf: -6 }
        } },
      { id: 'stay', label: '국내에 남는다', intent: 'family', out: { t: '지금 곁에 있는 사람들이 더 중요하다.', rel: { family: 3 } } },
      { id: 'nego', label: '가족과 함께 가는 조건으로 협상한다', intent: 'family',
        check: { base: 35, partial: 0, f: [['perf', 0.4], ['jobYears', 0.8, 8]] },
        out: { success: { t: '회사가 조건을 받아들였다. 온 가족이 함께 떠났다.', log: '가족과 함께 해외 근무', exp: 16, flag: 'worked_abroad', rel: { spouse: 5 }, fn: H.mulJob(1.25) }, fail: { t: '협상은 결렬됐다. 기회는 다른 사람에게 갔다.', perf: -4 } } }
    ]
  });

  E.push({
    id: 'w_startup_friend', cat: 'opportunity', tier: 'major', ages: [24, 48], w: 6, max: 1, icon: '🚀',
    label: '새로운 기회', title: '창업 제안',
    text: p => (LG.Rel.all(p, 'friend')[0] ? '{friend}' : '대학 동기') + '이(가) 함께 창업하자고 한다. 아이템은 꽤 그럴듯하다.',
    choices: [
      { id: 'join', label: '함께 창업한다', intent: 'risk',
        check: { base: 30, partial: 0.45, f: [['stat', 'creativity', 0.25], ['stat', 'social', 0.2], ['talent', 'entrepreneur', 15], ['eff', 'work', 0.2], ['region', 'job', 0.15], ['assets', 0.2]] },
        out: {
          success: { t: '회사를 그만두고 창업했다. 첫 투자를 받았다!', log: '창업', quit: true, job: 'ceo', jobOpt: { mul: 0.8 }, money: -1500, flag: 'started_business', hp: 10, queue: [{ id: 'w_business_check', in: 3 }] },
          partial: { t: '창업은 했지만 매출이 지지부진하다.', log: '창업 (고전 중)', quit: true, job: 'ceo', jobOpt: { mul: 0.45 }, money: -1500, flag: 'started_business', sr: 10, queue: [{ id: 'w_business_check', in: 2 }] },
          fail: { t: '6개월 만에 접었다. 모아둔 돈이 사라졌다.', log: '창업 실패', quit: true, money: -2500, flag: 'business_failed', sr: 16, hp: -12 }
        } },
      { id: 'invest', label: '돈만 투자한다', intent: 'money', if: p => p.money >= 1000,
        check: { base: 33, partial: 0, f: [['talent', 'entrepreneur', 8]] },
        out: { success: { t: '투자한 회사가 성장했다. 지분 가치가 세 배가 됐다.', log: '친구 회사 투자 성공', money: 2000, hp: 8 }, fail: { t: '회사는 2년 만에 문을 닫았다. 투자금은 돌아오지 않았다.', money: -1000, hp: -5 } } },
      { id: 'no', label: '거절한다', intent: 'stability', out: { t: '지금 자리가 낫다고 생각했다.', minor: true } }
    ]
  });

  E.push({
    id: 'w_business_check', cat: 'career', tier: 'auto', queued: true, icon: '📈',
    if: p => jobIn(p, ['ceo', 'selfemp']),
    check: { base: 40, partial: 0.45, f: [['perf', 0.4], ['stat', 'creativity', 0.2], ['talent', 'entrepreneur', 12], ['eff', 'work', 0.3], ['stat', 'mental', 0.2]] },
    out: {
      success: { t: '사업이 궤도에 올랐다! 직원이 열 명을 넘었다.', log: '사업 성공', major: true, achv: 12, hp: 14, flag: 'business_success', fn: H.mulJob(1.9) },
      partial: { t: '사업은 버티는 중이다. 크게 벌지도, 망하지도 않는다.', fn: H.mulJob(1.05), queue: [{ id: 'w_business_check', in: 4 }] },
      fail: { t: '사업이 무너졌다. 빚만 남았다.', log: '사업 실패', major: true, quit: true, debt: 3000, flag: 'business_failed', hp: -16, sr: 20 }
    }
  });

  E.push({
    id: 'w_own_shop', cat: 'career', tier: 'choice', ages: [33, 58], w: 5, max: 1, icon: '🏪',
    if: p => !!p.job && ['selfemp', 'ceo'].indexOf(p.job.id) < 0 && p.money >= 2500,
    label: '인생 2막', title: '내 가게',
    text: '언젠가 내 가게를 하고 싶었다. 모은 돈으로 차려 볼까?',
    choices: [
      { id: 'open', label: '가게를 연다', intent: 'risk',
        check: { base: 40, partial: 0.5, f: [['talent', 'entrepreneur', 12], ['stat', 'social', 0.3], ['assets', 0.4], ['region', 'job', 0.15], ['fn', p => p.family.tags.indexOf('self_employed') >= 0 ? { label: '장사하는 집안', v: 8 } : null]] },
        out: {
          success: { t: '가게 문을 열었다. 단골이 하나둘 생긴다.', log: '가게 창업', job: 'selfemp', money: -2500, flag: 'started_business', queue: [{ id: 'w_business_check', in: 3 }] },
          partial: { t: '가게를 열었지만 손님이 뜸하다.', log: '가게 창업 (고전 중)', job: 'selfemp', jobOpt: { mul: 0.6 }, money: -2500, flag: 'started_business', queue: [{ id: 'w_business_check', in: 2 }] },
          fail: { t: '권리금만 날렸다. 1년 만에 폐업했다.', log: '가게 폐업', quit: true, money: -4000, flag: 'business_failed', sr: 15, hp: -12 }
        } },
      { id: 'no', label: '꿈으로 남겨 둔다', intent: 'stability', out: { t: '안정적인 월급이 주는 평화도 있다.', minor: true } }
    ]
  });

  E.push({
    id: 'w_layoff', cat: 'crisis', tier: 'major', ages: [33, 62], cd: 8, icon: '📦',
    w: p => p.job ? Math.max(0, 85 - LG.DATA.jobs[p.job.id].stab) / 9 : 0,
    if: p => !!p.job && LG.DATA.jobs[p.job.id].stab < 85 && ['selfemp', 'ceo', 'artist', 'writer', 'musician', 'creator', 'freelancer', 'parttime'].indexOf(p.job.id) < 0,
    label: '위기', title: '구조조정',
    text: '회사가 어렵다. 희망퇴직 명단에 내 이름이 있다는 소문이 돈다. 내 잘못이 아니어도 일은 일어난다.',
    choices: [
      { id: 'fight', label: '버텨 본다', intent: 'stability',
        check: { base: 45, partial: 0, f: [['perf', 0.5], ['jobYears', 0.6, 8], ['ageOver', 50, 1]] },
        out: { success: { t: '살아남았다. 옆자리가 비었다.', sr: 8 }, fail: { t: '결국 회사를 나오게 됐다.', log: '구조조정으로 실직', quit: true, money: 1200, sr: 12, hp: -10 } } },
      { id: 'accept', label: '퇴직금을 받고 나온다', intent: 'adventure',
        out: { t: '두둑한 위로금을 받고 나왔다. 이제 뭘 하지?', log: '희망퇴직', quit: true, money: 3000, sr: 4, hp: -4 } }
    ]
  });

  E.push({
    id: 'w_side_hustle', cat: 'money', tier: 'choice', ages: [24, 55], w: 6, max: 1, icon: '🌙',
    if: p => !!p.job && CREATIVE.indexOf(p.job.id) < 0,
    label: '부업', title: '퇴근 후 두 번째 일',
    text: '월급만으로는 부족하다. 퇴근 후 시간을 활용해 볼까?',
    choices: [
      { id: 'side', label: '부업을 시작한다', intent: 'money',
        check: { base: 42, partial: 0, f: [['stat', 'creativity', 0.25], ['eff', 'work', 0.2], ['stress', 0.2], ['talent', 'entrepreneur', 8]] },
        out: { success: { t: '부업 수입이 쏠쏠하다. 통장이 두툼해졌다.', log: '부업 성공', money: 1500, sr: 6 }, fail: { t: '시간만 쓰고 남는 게 없었다.', sr: 8 } } },
      { id: 'channel', label: '영상 채널을 시작한다', intent: 'adventure',
        check: { base: 10, partial: 0.5, max: 45, f: [['stat', 'creativity', 0.4], ['stat', 'social', 0.3], ['talent', 'writing', 6], ['flag', 'gamer_dream', 10, '게임 실력']] },
        out: {
          success: { t: '채널이 터졌다! 구독자 30만. 회사를 그만뒀다.', log: '크리에이터로 전업', job: 'creator', jobOpt: { mul: 1.6 }, achv: 6, hp: 12, flag: 'found_calling' },
          partial: { t: '구독자 2천 명. 소소한 취미가 됐다.', flag: 'hobby', hp: 4 },
          fail: { t: '조회수 12. 조용히 채널을 닫았다.', hp: -3 }
        } },
      { id: 'no', label: '쉬는 게 남는 거다', intent: 'rest', out: { t: '퇴근 후엔 푹 쉬었다.', sr: -4 } }
    ]
  });

  E.push({
    id: 'w_viral', cat: 'opportunity', tier: 'auto', ages: [22, 60], w: 4, max: 1, icon: '🌟',
    if: p => jobIn(p, ['artist', 'musician', 'writer', 'creator', 'designer']),
    check: { base: 14, partial: 0, f: [['stat', 'creativity', 0.4], ['perf', 0.3], ['talent', 'art', 6], ['talent', 'music', 6], ['talent', 'writing', 6]] },
    out: {
      success: { t: '작품이 입소문을 타고 크게 알려졌다. 유명해졌다!', log: '작품이 크게 알려지며 유명해짐', major: true, achv: 15, hp: 15, flag: 'famous', fn: H.mulJob(3) },
      fail: { skip: true }
    }
  });

  E.push({
    id: 'w_retire', cat: 'retirement', tier: 'major', ages: [58, 75], milestone: true, cd: 3, prio: 3, icon: '🌅',
    if: p => {
      if (!p.job) return false;
      const late = ['selfemp', 'ceo', 'farmer', 'freelancer', 'artist', 'writer', 'musician', 'creator'].indexOf(p.job.id) >= 0;
      const age = late ? 65 : jobIn(p, ['civil', 'teacher']) ? 62 : 60;
      return p.age >= age;
    },
    label: '은퇴', title: '일을 내려놓을 때',
    text: p => `${p.age}세. 정년이 다가온다. ${p.job.years + (p.job.carry || 0)}년 동안 해 온 일을 내려놓을 때일까?`,
    choices: [
      { id: 'retire', label: '은퇴한다', intent: 'rest', out: { t: '마지막 퇴근길. 동료들이 꽃다발을 안겨 주었다.', log: '은퇴', quit: 'retired', hp: 8, sr: -20, flag: 'retired' } },
      { id: 'keep', label: '계속 일한다', intent: 'career',
        check: { base: 55, partial: 0, f: [['health', 0.4], ['perf', 0.3], ['ageOver', 62, 3]] },
        out: { success: { t: '아직은 현역이다. 일이 나를 젊게 만든다.', achv: 2 }, fail: { t: '회사는 더 이상 자리를 내주지 않았다.', log: '은퇴', quit: 'retired', hp: -6, flag: 'retired' } } },
      { id: 'second', label: '인생 2막을 시작한다', intent: 'adventure',
        check: { base: 45, partial: 0, f: [['stat', 'creativity', 0.2], ['health', 0.3], ['assets', 0.2]] },
        out: {
          success: { t: '', log: '인생 2막 시작', flag: ['late_bloomer', 'second_act'], hp: 12,
            fn: p => { if (!p.urban) { LG.Outcome.setJob(p, 'farmer'); return '고향 땅에 작은 밭을 일구기 시작했다.'; } LG.Outcome.setJob(p, 'selfemp', { mul: 0.55 }); return '오래 꿈꾸던 작은 가게를 열었다.'; } },
          fail: { t: '새 출발은 생각보다 어려웠다. 결국 쉬기로 했다.', log: '은퇴', quit: 'retired', flag: 'retired' }
        } }
    ]
  });

  E.push({
    id: 'x_mentor', cat: 'opportunity', tier: 'choice', ages: [19, 42], w: 1.5, max: 1, icon: '🎩',
    label: '희귀한 기회', title: '인생의 은인',
    text: '지하철에서 쓰러진 노신사를 도왔다. 알고 보니 업계의 큰손이었다. 함께 일해 보자고 한다.',
    choices: [
      { id: 'yes', label: '기회를 잡는다', intent: 'career',
        check: { base: 55, partial: 0, f: [['stat', 'social', 0.3], ['stat', 'intelligence', 0.2]] },
        out: {
          success: { t: '그분 밑에서 일을 배웠다. 인생이 바뀌었다.', log: '인생의 은인을 만남', achv: 8, flag: 'mentor', hp: 10, fn: p => { if (p.job && ['parttime', 'service', 'factory', 'office_small'].indexOf(p.job.id) < 0) { H.mulJob(1.3)(p); p.job.perf = Math.min(100, p.job.perf + 15); } else LG.Outcome.setJob(p, 'office_big', { perf: 65 }); return ''; } },
          fail: { t: '기회는 생각보다 짧게 끝났다. 그래도 배운 게 많다.', st: { intelligence: 2 } }
        } },
      { id: 'no', label: '정중히 사양한다', intent: 'stability', out: { t: '지금 내 길을 가기로 했다.', minor: true } }
    ]
  });

  // ───────────────────────── 돈 · 주거 ─────────────────────────

  E.push({
    id: 'h_buy_house', cat: 'housing', tier: 'major', ages: [29, 62], w: 11, cd: 3, icon: '🏠',
    if: p => !p.house && !!p.job && LG.State.netWorth(p) >= H.housePrice(p) * 0.18 && p.liveIn !== 'abroad',
    label: '내 집 마련', title: '집을 살까',
    text: p => `${S().liveRegion(p).short} 집값이 또 올랐다는 뉴스가 나온다. 시세는 ${LG.U.money(H.housePrice(p))}원. 지금이라도 사야 할까?`,
    choices: [
      { id: 'buy', label: '대출을 받아 산다', intent: 'stability',
        check: { base: 44, partial: 0.45, f: [['assets', 0.5], ['fn', p => p.job ? { label: '소득 안정성', v: (LG.DATA.jobs[p.job.id].stab - 50) * 0.25 } : null], ['fn', p => H.rel(p, 'spouse') && H.rel(p, 'spouse').income ? { label: '맞벌이', v: 8 } : null]] },
        out: {
          success: { t: '', log: '내 집 마련', hp: 12, achv: 3, fn: p => '마침내 내 집이 생겼다! ' + H.buyHouse(1)(p) },
          partial: { t: '', log: '작은 집 마련', hp: 6, fn: p => '원하던 곳보다 작은 집을 샀다. ' + H.buyHouse(0.65, S().liveRegion(p).short + ' 소형 아파트')(p) },
          fail: { t: '대출 심사에서 떨어졌다.', sr: 8, hp: -4 }
        } },
      { id: 'cheap', label: '외곽의 싼 집을 산다', intent: 'family',
        out: { t: '', log: '외곽에 집 마련', hp: 6, perf: -4, sr: 4, fn: p => '출퇴근은 멀어졌지만 내 집이다. ' + H.buyHouse(0.45, S().liveRegion(p).short + ' 외곽 주택')(p) } },
      { id: 'wait', label: '전·월세로 버틴다', intent: 'money', out: { t: '집값이 떨어지길 기다리기로 했다.', flag: 'saved_early' } }
    ]
  });

  E.push({
    id: 'm_invest', cat: 'money', tier: 'choice', ages: [24, 70], w: 7, cd: 5, icon: '📈',
    if: p => p.money >= 1500,
    label: '재테크', title: '투자해 볼까',
    text: '주변에서 다들 투자로 돈을 벌었다는데…',
    choices: [
      { id: 'stock', label: '주식에 투자한다', intent: 'money',
        check: { base: 48, partial: 0.5, f: [['stat', 'intelligence', 0.2], ['trait', 'careful', 5], ['trait', 'impulsive', -5]] },
        out: {
          success: { t: '', log: '주식 투자 수익', fn: p => { const a = Math.round(Math.min(p.money * 0.3, 6000) * 0.55); p.money += a; return `수익률 55%. ${LG.U.money(a)}원을 벌었다.`; } },
          partial: { t: '본전 근처에서 빠져나왔다. 마음고생만 했다.', sr: 4 },
          fail: { t: '', log: '주식 투자 손실', sr: 8, fn: p => { const a = Math.round(Math.min(p.money * 0.3, 6000) * 0.4); p.money -= a; return `물렸다. ${LG.U.money(a)}원을 잃었다.`; } }
        } },
      { id: 'coin', label: '코인에 크게 건다', intent: 'risk',
        check: { base: 28, partial: 0.15, f: [['trait', 'impulsive', 4]] },
        out: {
          success: { t: '', log: '코인 대박', hp: 10, fn: p => { const a = Math.round(Math.min(p.money * 0.4, 8000) * 2.5); p.money += a; return `떡상했다! ${LG.U.money(a)}원을 벌었다.`; } },
          partial: { t: '롤러코스터를 탔다. 결국 제자리다.', sr: 8 },
          fail: { t: '', log: '코인 폭락', hp: -12, sr: 12, fn: p => { const a = Math.round(Math.min(p.money * 0.4, 8000) * 0.8); p.money -= a; return `-80%. ${LG.U.money(a)}원이 사라졌다.`; } }
        } },
      { id: 'save', label: '적금·연금에 넣는다', intent: 'stability', out: { t: '재미는 없지만 마음은 편하다.', flag: ['saved_early', 'private_pension'], sr: -3 } }
    ]
  });

  E.push({
    id: 'm_fraud', cat: 'crisis', tier: 'choice', ages: [38, 80], w: 4, max: 1, icon: '🎣',
    if: p => p.money >= 2000,
    label: '솔깃한 제안', title: '원금 보장, 월 5%',
    text: '오랜 지인이 "원금 보장, 월 5% 수익"이라며 투자를 권한다. 벌써 돈을 번 사람이 많다고 한다.',
    choices: [
      { id: 'invest', label: '투자한다', intent: 'money',
        check: { base: 8, partial: 0, max: 15, f: [] },
        out: {
          success: { t: '운 좋게 원금과 이자를 챙겨 빠져나왔다. 석 달 뒤 회사가 사라졌다.', money: 800 },
          fail: { t: '', log: '투자 사기 피해', hp: -16, sr: 16, fn: p => { const a = Math.round(Math.min(p.money * 0.5, 20000)); p.money -= a; return `사기였다. 지인은 잠적했다. ${LG.U.money(a)}원을 잃었다.`; } }
        } },
      { id: 'no', label: '정중히 거절한다', intent: 'stability', out: { t: '몇 달 뒤, 그 지인이 사기로 구속됐다는 뉴스를 봤다.', st: { mental: 2 } } }
    ]
  });

  E.push({
    id: 'm_debt', cat: 'crisis', tier: 'major', ages: [20, 80], w: 26, cd: 5, icon: '🧾',
    if: p => has(p, 'heavy_debt'),
    label: '위기', title: '빚의 늪',
    text: p => `빚이 ${LG.U.money(p.debt)}원. 이자가 벌이를 갉아먹는다. 독촉 전화가 온다.`,
    choices: [
      { id: 'rehab', label: '개인회생을 신청한다', intent: 'stability',
        check: { base: 55, partial: 0, f: [['fn', p => p.job ? { label: '꾸준한 소득', v: 10 } : { label: '소득 없음', v: -10 }]] },
        out: { success: { t: '회생이 인가됐다. 갚을 수 있는 만큼만 갚으면 된다.', log: '개인회생', hp: 6, sr: -14, flag: 'rehab', fn: p => { p.debt = Math.round(p.debt * 0.4); return ''; } }, fail: { t: '신청이 기각됐다.', sr: 8, hp: -6 } } },
      { id: 'two', label: '투잡을 뛴다', intent: 'money',
        check: { base: 50, partial: 0, f: [['health', 0.3], ['stat', 'mental', 0.3]] },
        out: { success: { t: '밤낮으로 일했다. 빚이 조금씩 줄어든다.', money: 1800, st: { health: -4 }, sr: 8 }, fail: { t: '몸이 버티지 못했다.', st: { health: -9 }, sr: 8 } } },
      { id: 'family', label: '가족에게 도움을 청한다', intent: 'family', if: p => LG.Rel.parents(p).length > 0 || !!H.rel(p, 'sibling'),
        check: { base: 38, partial: 0, f: [['support', 0.4], ['family', 0.6]] },
        out: { success: { t: '가족이 빚을 일부 갚아 줬다. 고개를 들 수 없었다.', rel: { parents: -4 }, fn: p => { p.debt = Math.max(0, p.debt - 3000); return ''; } }, fail: { t: '도움은커녕 꾸중만 들었다.', rel: { parents: -10, siblings: -6 }, hp: -6 } } }
    ]
  });

  E.push({
    id: 'h_relocate', cat: 'housing', tier: 'choice', ages: [24, 55], w: 4, max: 1, icon: '🚚',
    if: p => !p.house && p.liveIn !== 'abroad',
    label: '이주', title: p => ['seoul', 'gyeonggi'].indexOf(p.liveIn || p.region) >= 0 ? '도시를 떠날까' : '수도권으로 갈까',
    text: p => ['seoul', 'gyeonggi'].indexOf(p.liveIn || p.region) >= 0 ? '꽉 막힌 출근길. 집값도 숨 막힌다. 지방에서 여유롭게 살아 볼까?' : '수도권으로 가면 기회가 훨씬 많다는데…',
    choices: [
      { id: 'move', label: '이사한다', intent: 'adventure',
        check: { base: 55, partial: 0, f: [['stat', 'social', 0.2], ['assets', 0.3]] },
        out: {
          success: { t: '', log: '이사', exp: 5, rel: { friends: -10 }, hp: 4, fn: p => { const cap = ['seoul', 'gyeonggi'].indexOf(p.liveIn || p.region) >= 0; const to = cap ? LG.RNG.pick(p, ['jeju', 'gangwon', 'gyeongnam', 'chungbuk']) : LG.RNG.pick(p, ['seoul', 'gyeonggi']); p.liveIn = to; if (p.job && p.job.id !== 'civil' && p.job.id !== 'teacher') p.job.perf = Math.max(0, p.job.perf - 5); return `${LG.DATA.regions[to].name}(으)로 삶의 터전을 옮겼다.`; } },
          fail: { t: '집도 일도 구하지 못하고 다시 돌아왔다.', money: -300, sr: 6 }
        } },
      { id: 'stay', label: '지금 사는 곳에 머문다', intent: 'stability', out: { t: '익숙한 동네가 좋다.', rel: { friends: 3 } } }
    ]
  });

  E.push({
    id: 'h_emigrate', cat: 'travel', tier: 'major', ages: [27, 46], w: 3, max: 1, icon: '🛫',
    label: '새로운 시작', title: '이민',
    text: '해외 이민 설명회 전단지를 받았다. 다른 나라에서 처음부터 다시 시작해 볼까?',
    choices: [
      { id: 'go', label: '이민을 떠난다', intent: 'adventure',
        check: { base: 30, partial: 0.4, f: [['talent', 'language', 15], ['assets', 0.4], ['stat', 'mental', 0.3], ['ageOver', 38, 2], ['flag', 'worked_abroad', 10, '해외 근무 경험']] },
        out: {
          success: { t: '새 나라에서 새 삶이 시작됐다. 모든 게 낯설고 신선하다.', log: '해외 이민', exp: 25, flag: 'emigrated', liveIn: 'abroad', home: 'abroad', rel: { parents: -10, friends: -15, siblings: -6 }, hp: 8, fn: p => H.abroadJob(p) },
          partial: { t: '이민은 했지만 언어의 벽이 높다. 매일이 시험이다.', log: '해외 이민', exp: 18, flag: 'emigrated', liveIn: 'abroad', home: 'abroad', rel: { parents: -10, friends: -15 }, sr: 15, fn: p => H.abroadJob(p, true) },
          fail: { t: '비자가 거절됐다. 서류 뭉치를 서랍에 넣었다.', hp: -6 }
        } },
      { id: 'no', label: '여기서 산다', intent: 'stability', out: { t: '그래도 여기가 내 자리다.', minor: true } }
    ]
  });

  // ───────────────────────── 건강 ─────────────────────────

  E.push({
    id: 'hl_exercise', cat: 'health', tier: 'choice', ages: [22, 62], w: 7, cd: 6, max: 2, icon: '🏃',
    if: p => !has(p, 'exercise_habit'),
    label: '건강', title: '운동을 시작할까',
    text: '계단을 오르다 숨이 찼다. 건강검진 결과지에 "운동하세요"라고 적혀 있다.',
    choices: [
      { id: 'gym', label: '운동을 시작한다', intent: 'health',
        check: { base: 45, partial: 0.5, f: [['stat', 'mental', 0.3], ['trait', 'impulsive', -5], ['stress', 0.2], ['talent', 'sport', 10]] },
        out: {
          success: { t: '운동이 습관이 됐다. 몸이 가벼워졌다.', log: '운동 습관을 들임', eff: { health: 45, sport: 20 }, flag: 'exercise_habit', st: { health: 5, physical: 3 }, sr: -6 },
          partial: { t: '작심삼주. 그래도 안 한 것보단 낫다.', eff: { health: 18 }, st: { health: 2 } },
          fail: { t: '헬스장 1년 회원권은 기부가 되었다.', money: -60 }
        } },
      { id: 'later', label: '다음에 하자', intent: 'rest', out: { t: '내일부터 하기로 했다. 내일은 오지 않았다.', minor: true } }
    ]
  });

  E.push({
    id: 'hl_drink', cat: 'health', tier: 'choice', ages: [20, 40], w: 6, max: 1, icon: '🍺',
    if: p => !!p.job || p.status === 'college',
    label: '사회생활', title: '회식 자리',
    text: '회식이 잦다. 술과 담배를 권하는 분위기에서 나는…',
    choices: [
      { id: 'join', label: '분위기를 맞춘다', intent: 'social', out: { t: '동료들과 가까워졌다. 몸은 무거워졌다.', flag: 'drinker', st: { social: 3 }, perf: 3, fn: H.friend(55, '직장 동료') } },
      { id: 'smoke', label: '스트레스에 담배를 피운다', intent: 'rest', out: { t: '담배 한 개비에 잠깐 숨이 트인다.', flag: 'smoker', sr: -6 } },
      { id: 'refuse', label: '적당히 선을 긋는다', intent: 'health',
        check: { base: 55, partial: 0, f: [['stat', 'mental', 0.35], ['stat', 'social', 0.2]] },
        out: { success: { t: '눈치는 보였지만 내 페이스를 지켰다.', st: { mental: 2 } }, fail: { t: '"분위기 깨는 사람"이 됐다.', st: { social: -2 }, perf: -3 } } }
    ]
  });

  E.push({
    id: 'hl_checkup', cat: 'health', tier: 'choice', ages: [40, 78], cd: 8, max: 2, icon: '🩻',
    w: p => p.stats.health < 60 ? 12 : 4,
    label: '건강', title: '건강검진 결과',
    text: '검진 결과지에 빨간 글씨가 여러 개다.',
    choices: [
      { id: 'treat', label: '정밀검사를 받고 생활을 바꾼다', intent: 'health',
        check: { base: 55, partial: 0, f: [['stat', 'mental', 0.3], ['region', 'medical', 0.25], ['assets', 0.2]] },
        out: { success: { t: '초기에 발견했다. 생활습관을 싹 바꿨다.', log: '건강 관리 시작', st: { health: 8 }, eff: { health: 25 }, unflag: 'smoker', money: -200 }, fail: { t: '바꾸려 했지만 꾸준하지 못했다.', st: { health: 2 }, money: -200 } } },
      { id: 'ignore', label: '바빠서 넘긴다', intent: 'career', out: { t: '"괜찮겠지." 결과지는 서랍 속으로 들어갔다.', fn: p => { if (LG.RNG.chance(p, 0.45)) S().flag(p, 'chronic'); return ''; } } }
    ]
  });

  E.push({
    id: 'hl_illness', cat: 'health', tier: 'major', ages: [38, 95], cd: 10, max: 2, icon: '🏥',
    w: p => Math.max(0.5, (68 - p.stats.health) * 0.5 + (p.age - 40) * 0.12),
    label: '위기', title: '큰 병',
    text: '몸이 이상해 병원에 갔다. 정밀검사 결과, 큰 병이 발견됐다.',
    wait: '검사 결과를 기다리는 중',
    choices: [
      { id: 'treat', label: '적극적으로 치료한다', intent: 'health',
        check: { base: 50, partial: 0.5, f: [['region', 'medical', 0.35], ['assets', 0.35], ['health', 0.3], ['stat', 'mental', 0.2], ['ageOver', 65, 0.8], ['flag', 'exercise_habit', 6, '운동 습관']] },
        out: {
          success: { t: '힘든 치료를 견뎌냈다. 완치 판정을 받았다.', log: '큰 병을 이겨냄', st: { health: -6 }, money: -1500, hp: 6 },
          partial: { t: '치료는 됐지만 평생 관리해야 하는 몸이 됐다.', log: '투병 후 만성질환', st: { health: -16 }, flag: 'chronic', money: -2000 },
          fail: { t: '치료가 잘 듣지 않는다. 남은 시간을 생각하게 됐다.', log: '중병 진단', st: { health: -30 }, flag: 'cancer', money: -3000, hp: -12 }
        } },
      { id: 'gentle', label: '보존 치료하며 일상을 지킨다', intent: 'rest',
        out: { t: '병원보다 가족 곁을 택했다. 하루하루가 소중하다.', log: '투병하며 일상을 지킴', st: { health: -18 }, flag: 'chronic', hp: 6, exp: 4, rel: { family: 8 } } }
    ]
  });

  E.push({
    id: 'hl_mental', cat: 'health', tier: 'choice', ages: [17, 70], cd: 5, icon: '🌫️',
    w: p => Math.max(0, (p.stress - 55) / 2) + Math.max(0, (45 - p.happy) / 2),
    if: p => p.stress >= 60 || p.happy < 40,
    label: '마음', title: '마음의 감기',
    text: '이유 없이 눈물이 난다. 아무것도 하고 싶지 않다.',
    choices: [
      { id: 'counsel', label: '상담을 받는다', intent: 'health',
        check: { base: 60, partial: 0, f: [['region', 'medical', 0.2], ['support', 0.1]] },
        out: { success: { t: '처음으로 마음을 털어놓았다. 조금씩 나아지고 있다.', log: '상담으로 마음을 돌봄', sr: -25, hp: 14, st: { mental: 4 } }, fail: { t: '맞는 선생님을 찾기 어려웠다.', sr: -5 } } },
      { id: 'travel', label: '훌쩍 떠난다', intent: 'adventure', out: { t: '바다를 보고 왔다. 숨이 조금 쉬어진다.', sr: -15, hp: 8, exp: 4, money: -300 } },
      { id: 'alone', label: '혼자 견딘다', intent: 'independence',
        check: { base: 40, partial: 0, f: [['stat', 'mental', 0.5]] },
        out: { success: { t: '터널 끝에서 빛이 보이기 시작했다.', st: { mental: 4 }, sr: -8 }, fail: { t: '혼자서는 버거웠다. 몸까지 상했다.', st: { health: -6 }, hp: -8, sr: 4 } } }
    ]
  });
})(window.LG = window.LG || {});
