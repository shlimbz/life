/* 이벤트 — '내 삶과 이어진' 갈림길
   출생 환경 · 재능 · 지금까지의 선택(flag/track/major/job)이 쌓인 만큼 그에 맞는 사건이 찾아온다.
   dom 태그가 달린 이벤트는 LG.Aff(관심사) 점수가 높을수록 더 자주 나온다. */
(function (LG) {
  const E = LG.DATA.events;
  const H = LG.EH, has = H.has, found = H.found, seq = H.seq, disc = H.disc;
  const A = H.A;
  const jobIs = H.jobIs;
  const parentJob = H.parentJob;
  const kids = H.kids;
  const S = H.S;

  // ═════════════════════════ 운동 · 체육 ═════════════════════════

  E.push({
    id: 'sp_tryout', cat: 'sports', tier: 'choice', ages: [11, 15], w: 14, max: 1, dom: ['sports'], icon: '🏃',
    if: p => A(p, 'sports') >= 22 && !p.track,
    label: '운동', title: '학교 대표 선발전',
    text: '체육 선생님이 교내 육상·구기 대표 선발전에 나가 보라고 하신다. 방과 후마다 운동장에서 달리던 시간이 떠오른다.',
    choices: [
      { id: 'go', label: '선발전에 나간다', intent: 'adventure',
        check: { base: 42, partial: 0.5, f: [['stat', 'physical', 0.5], ['eff', 'sport', 0.4], ['talent', 'sport', 12], ['flag', 'kid_sport', 6, '어릴 적 운동 경험']] },
        out: {
          success: { t: '대표 선수로 뽑혔다! 교복 대신 유니폼을 입은 날, 어깨가 으쓱했다.', log: '학교 대표 선수로 선발', flag: 'school_team', eff: { sport: 24 }, st: { physical: 3 }, hp: 10, fn: disc('sport') },
          partial: { t: '후보 선수가 되었다. 벤치에서 응원하며 기회를 기다린다.', eff: { sport: 12 }, hp: 3 },
          fail: { t: '아쉽게 탈락했다. 그래도 운동장이 여전히 좋다.', hp: -3, eff: { sport: 6 } }
        } },
      { id: 'no', label: '공부에 집중하기로 한다', intent: 'education', out: { t: '지금은 책상 앞이 먼저라고 생각했다.', eff: { study: 8 } } }
    ]
  });

  E.push({
    id: 'sp_national', cat: 'sports', tier: 'major', ages: [16, 19], w: 22, max: 1, dom: ['sports'], icon: '🥇',
    if: p => p.track === 'sports' || has(p, 'sports_hs') || (has(p, 'school_team') && A(p, 'sports') >= 35),
    label: '운동', title: '전국대회',
    text: '3년 동안 새벽마다 뛰어 온 시간이 이 대회로 이어진다. 관중석에서 {parent}가 지켜보고 있다.',
    choices: [
      { id: 'all', label: '모든 걸 쏟아붓는다', intent: 'adventure',
        check: { base: 34, partial: 0.5, f: [['stat', 'physical', 0.5], ['eff', 'sport', 0.45], ['talent', 'sport', 14], ['health', 0.3], ['stat', 'mental', 0.25], ['flag', 'athlete_path', 8, '선수 준비']] },
        out: {
          success: { t: '시상대 위에서 애국가가 울렸다. 목에 건 메달이 묵직했다.', log: '전국대회 입상', flag: ['sports_medal', 'athlete_path'], achv: 7, hp: 16, eff: { sport: 20 }, st: { mental: 3 } },
          partial: { t: '아깝게 입상은 놓쳤지만 스카우터의 눈에는 들었다.', log: '전국대회 출전', flag: 'athlete_path', hp: 5, achv: 2 },
          fail: { t: '긴장 탓에 실력의 절반도 못 냈다. 한동안 영상을 다시 볼 수 없었다.', hp: -10, sr: 10, st: { mental: 2 } }
        } },
      { id: 'safe', label: '다치지 않는 선에서 뛴다', intent: 'stability', out: { t: '무리하지 않고 경기를 마쳤다. 몸은 괜찮다. 마음은 조금 아쉽다.', st: { health: 1 } } }
    ]
  });

  E.push({
    id: 'sp_injury', cat: 'sports', tier: 'major', ages: [17, 33], w: 16, cd: 6, max: 2, dom: ['sports'], icon: '🩹',
    if: p => (jobIs(p, 'athlete') || has(p, 'athlete_path') || has(p, 'sports_hs')) && !has(p, 'sports_injury'),
    label: '운동', title: '경기 중 부상',
    text: '착지하는 순간 무릎에서 낯선 소리가 났다. 의사는 인대 손상이라며 길게는 반년을 쉬어야 한다고 한다.',
    choices: [
      { id: 'rehab', label: '재활에 전념한다', intent: 'stability',
        check: { base: 52, partial: 0.5, f: [['stat', 'mental', 0.4], ['health', 0.3], ['support', 0.2], ['assets', 0.25]] },
        out: {
          success: { t: '지루한 재활을 한 달 한 달 버텼다. 마침내 다시 달리는 날, 눈물이 났다.', log: '부상을 딛고 복귀', flag: ['sp_rehab', 'sports_injury'], st: { mental: 4 }, hp: 8, fn: p => { if (p.job) p.job.perf = Math.max(0, p.job.perf - 3); return ''; } },
          partial: { t: '복귀는 했지만 예전 같은 몸은 아니다.', log: '부상 후 복귀했지만 기량 저하', flag: ['sp_rehab', 'sports_injury'], st: { physical: -3 }, fn: p => { if (p.job) p.job.perf = Math.max(0, p.job.perf - 10); return ''; } },
          fail: { t: '재활이 길어졌다. 몸도 마음도 지쳐 간다.', flag: 'sports_injury', st: { physical: -5, health: -3 }, hp: -10, sr: 10 }
        } },
      { id: 'push', label: '무리해서라도 빨리 복귀한다', intent: 'risk',
        check: { base: 28, partial: 0.4, f: [['stat', 'physical', 0.3], ['health', 0.3], ['talent', 'sport', 8]] },
        out: {
          success: { t: '진통제를 삼키고 뛰었다. 운 좋게 몸이 버텨 줬다.', log: '무리한 복귀에 성공', flag: 'sports_injury', hp: 6, achv: 2 },
          partial: { t: '뛰긴 했지만 통증이 계속 따라붙는다.', flag: 'sports_injury', st: { health: -4 }, sr: 8 },
          fail: { t: '다시 쓰러졌다. 이번엔 수술이 필요하다.', log: '무리한 복귀로 큰 부상', flag: 'sports_injury', st: { health: -8, physical: -6 }, hp: -14, sr: 14, money: -600 }
        } },
      { id: 'quit', label: '선수의 길을 내려놓는다', intent: 'independence',
        out: { t: '여기까지라는 걸 알았다. 낯설게 가벼워진 가방을 멨다.', log: '선수 생활을 접음', flag: 'sports_injury', hp: -8, fn: p => { if (jobIs(p, 'athlete')) { LG.Outcome.quitJob(p, 'seeking'); S().flag(p, 'retired_athlete'); } return ''; } } }
    ]
  });

  E.push({
    id: 'sp_contract', cat: 'sports', tier: 'choice', ages: [21, 34], w: 18, max: 2, cd: 4, dom: ['sports'], icon: '🧾',
    if: p => jobIs(p, 'athlete') && p.job.years >= 2,
    label: '프로', title: '재계약 · 해외 진출 제의',
    text: '시즌이 끝나자 에이전트가 두 가지 제안을 가져왔다. 지금 팀과의 재계약, 그리고 해외 리그의 오퍼.',
    choices: [
      { id: 'abroad', label: '해외 리그에 도전한다', intent: 'adventure',
        check: { base: 28, partial: 0.5, f: [['perf', 0.35], ['stat', 'physical', 0.3], ['talent', 'sport', 10], ['stat', 'mental', 0.25], ['flag', 'sports_medal', 6, '입상 경력']] },
        out: {
          success: { t: '낯선 도시, 낯선 언어. 하지만 경기장은 어디나 같았다. 이적료가 터졌다.', log: '해외 리그 진출', flag: 'emigrated', achv: 8, hp: 12, money: 4000, fn: seq(H.mulJob(1.6), p => { S().addStat(p, 'social', 2); return ''; }) },
          partial: { t: '해외에서 주전 경쟁 중이다. 연봉은 올랐지만 출전은 적다.', fn: H.mulJob(1.2), hp: 3 },
          fail: { t: '적응에 실패했다. 몇 달 만에 짐을 싸서 돌아왔다.', hp: -8, sr: 8, fn: H.mulJob(0.85) }
        } },
      { id: 'stay', label: '지금 팀과 재계약한다', intent: 'stability', out: { t: '익숙한 팀, 익숙한 동료들. 안정적인 계약서에 서명했다.', fn: H.mulJob(1.12), hp: 4 } }
    ]
  });

  E.push({
    id: 'sp_club', cat: 'sports', tier: 'choice', ages: [24, 52], w: 12, max: 1, dom: ['sports'], icon: '🏀',
    if: p => A(p, 'sports') >= 30 && !jobIs(p, 'athlete'),
    label: '운동', title: '직장인 동호회',
    text: '동료가 사내 풋살·농구 동호회에 들어오라고 한다. 다시 땀 냄새 나는 코트가 그립다.',
    choices: [
      { id: 'join', label: '가입한다', intent: 'social',
        check: { base: 70, partial: 0.3, f: [['stat', 'physical', 0.2], ['stress', 0.2]] },
        out: {
          success: { t: '주말마다 코트에서 뛴다. 스트레스가 사라지고, 사람도 늘었다.', log: '운동 동호회 가입', flag: ['sp_club', 'exercise_habit'], sr: -10, hp: 6, st: { health: 3, social: 2 }, fn: H.friend(70, '동호회 동료') },
          partial: { t: '바쁜 일정에 몇 번밖에 못 나갔다. 그래도 기분은 좋았다.', flag: 'sp_club', sr: -4 },
          fail: { t: '첫 경기에서 발목을 접질렸다. 아직 몸이 예전 같지 않다.', st: { health: -2 }, hp: -3 }
        } },
      { id: 'no', label: '이젠 퇴근하고 쉬고 싶다', intent: 'rest', out: { t: '소파가 이렇게 편한 줄 몰랐다.', sr: -4 } }
    ]
  });

  E.push({
    id: 'sp_marathon', cat: 'sports', tier: 'choice', ages: [27, 58], w: 9, max: 1, dom: ['sports'], icon: '🏅',
    if: p => A(p, 'sports') >= 35 || has(p, 'exercise_habit'),
    label: '도전', title: '풀코스 마라톤',
    text: '친구가 "올가을 풀코스 한번 뛰어볼래?"라며 접수 링크를 보냈다. 42.195km는 상상만 해도 숨이 차다.',
    choices: [
      { id: 'run', label: '신청하고 훈련을 시작한다', intent: 'adventure',
        check: { base: 46, partial: 0.5, f: [['stat', 'physical', 0.3], ['health', 0.35], ['eff', 'sport', 0.25], ['flag', 'exercise_habit', 8, '운동 습관'], ['ageOver', 45, 0.8]] },
        out: {
          success: { t: '결승선을 넘는 순간 모든 것이 사라졌다. 완주 메달을 목에 걸고 한참을 웃었다.', log: '마라톤 완주', flag: ['marathoner', 'exercise_habit'], hp: 14, achv: 3, st: { health: 4, mental: 3 }, eff: { sport: 12 } },
          partial: { t: '30km에서 다리가 풀렸지만 걸어서라도 들어왔다. 내년엔 더 잘할 것 같다.', hp: 6, st: { health: 2 } },
          fail: { t: '훈련 중 발목을 다쳐 출발선에 서지 못했다.', hp: -5, st: { health: -2 } }
        } },
      { id: 'no', label: '구경만 하겠다', intent: 'stability', out: { t: '응원하는 쪽이 더 마음 편하다.', minor: true } }
    ]
  });

  E.push({
    id: 'sp_kids_team', cat: 'sports', tier: 'choice', ages: [33, 58], w: 10, max: 1, dom: ['sports'], icon: '⚽',
    if: p => A(p, 'sports') >= 40 && kids(p).some(c => c.age >= 8 && c.age <= 15),
    child: p => kids(p).find(c => c.age >= 8 && c.age <= 15),
    label: '가족', title: '유소년 팀 코치',
    text: '{child}가 다니는 유소년 클럽에서 코치를 구하고 있다. "예전에 선수 하셨다면서요? 딱 맞으시겠어요."',
    choices: [
      { id: 'yes', label: '주말 코치를 맡는다', intent: 'family',
        out: { t: '토요일 아침마다 아이들과 운동장을 뛰어다닌다. {child}의 눈에 존경이 비친다.', log: '유소년 팀 코치를 맡음', flag: 'family_time', rel: { children: 14 }, hp: 8, st: { health: 2 }, eff: { sport: 10 } } },
      { id: 'no', label: '응원석에서 지켜본다', intent: 'stability', out: { t: '아이가 뛰는 모습을 바라보는 것만으로도 좋았다.', rel: { children: 3 } } }
    ]
  });

  // ═════════════════════════ 예술 · 음악 · 글 ═════════════════════════

  E.push({
    id: 'ar_contest', cat: 'arts', tier: 'choice', ages: [12, 19], w: 14, max: 2, cd: 3, dom: ['art', 'music'], icon: '🖼️',
    if: p => LG.Aff.max(p, ['art', 'music']) >= 28,
    label: '예술', title: '교외 공모전',
    text: p => A(p, 'music') > A(p, 'art') ? '지역 청소년 음악 경연대회 공고를 봤다. 연습실에서 몇 달째 같은 곡을 붙들고 있다.' : '청소년 미술 공모전 공고를 봤다. 스케치북이 벌써 몇 권째다.',
    choices: [
      { id: 'enter', label: '출품한다', intent: 'hobby',
        check: { base: 32, partial: 0.5, f: [['stat', 'creativity', 0.45], ['eff', 'art', 0.4], ['talent', 'art', 10], ['talent', 'music', 10], ['family', 0.25], ['region', 'culture', 0.15]] },
        out: {
          success: { t: '이름이 호명됐다. 상장을 받아 든 손이 떨렸다.', log: '공모전 입상', achv: 4, hp: 12, eff: { art: 18 }, fn: seq(p => { S().flag(p, A(p, 'music') > A(p, 'art') ? 'music_award' : 'art_award'); return ''; }, disc('art', 'music')) },
          partial: { t: '입상은 못 했지만 심사위원의 한 줄 평이 오래 남았다. "계속 해 보세요."', hp: 5, eff: { art: 10 } },
          fail: { t: '결과는 낙선. 그래도 마감 전날 밤의 흥분만은 진짜였다.', hp: -3, eff: { art: 6 } }
        } },
      { id: 'no', label: '조용히 혼자 즐긴다', intent: 'rest', out: { t: '남에게 평가받는 건 아직 무섭다. 좋아하는 마음만 간직하기로 했다.', flag: 'hobby_kid' } }
    ]
  });

  E.push({
    id: 'ar_band', cat: 'arts', tier: 'choice', ages: [14, 26], w: 13, max: 1, dom: ['music'], icon: '🎸',
    if: p => A(p, 'music') >= 30,
    label: '음악', title: '밴드를 하자',
    text: '친구가 기타를 메고 와서 말했다. "같이 밴드 하자. 드럼이 없는데, 네가 연습실 한 칸만 구해 주면 돼."',
    choices: [
      { id: 'yes', label: '함께한다', intent: 'social',
        check: { base: 56, partial: 0.4, f: [['stat', 'social', 0.25], ['talent', 'music', 10], ['stat', 'creativity', 0.2]] },
        out: {
          success: { t: '합주실의 땀 냄새, 첫 공연의 박수. 친구들과 함께라서 더 빛났다.', log: '밴드 결성, 첫 공연', flag: 'band', hp: 14, st: { social: 3 }, fn: seq(H.friend(80, '밴드 동료'), disc('music')) },
          partial: { t: '합주는 즐거웠지만 멤버들이 하나둘 바빠져 흩어졌다.', flag: 'band', hp: 4, fn: H.friend(65, '밴드 동료') },
          fail: { t: '의견이 안 맞아 몇 번 만나다 흐지부지 끝났다.', hp: -3 }
        } },
      { id: 'no', label: '공부가 먼저다', intent: 'education', out: { t: '악기는 케이스 안에서 잠들었다.', eff: { study: 10 } } }
    ]
  });

  E.push({
    id: 'ar_busk', cat: 'arts', tier: 'choice', ages: [20, 40], w: 10, max: 1, dom: ['music'], icon: '🎤',
    if: p => A(p, 'music') >= 38 && (has(p, 'band') || p.major === 'music' || found(p, 'music')),
    label: '음악', title: '거리의 무대',
    text: '퇴근길 지하철역 앞 버스킹 공연을 보다 문득 생각했다. 나도 저기 설 수 있지 않을까.',
    choices: [
      { id: 'sing', label: '무대에 선다', intent: 'adventure',
        check: { base: 40, partial: 0.5, f: [['talent', 'music', 14], ['stat', 'social', 0.25], ['stat', 'mental', 0.3], ['flag', 'band', 8, '무대 경험']] },
        out: {
          success: { t: '지나가던 사람들이 걸음을 멈췄다. 영상이 퍼지며 작은 팬층이 생겼다.', log: '버스킹으로 이름을 알림', flag: 'busker', hp: 14, money: 300, achv: 3, st: { social: 2 } },
          partial: { t: '관객은 몇 명뿐이었지만, 한 사람이 끝까지 들어 줬다.', flag: 'busker', hp: 6 },
          fail: { t: '목이 잠기고 손이 떨렸다. 아무도 쳐다보지 않았다.', hp: -6, sr: 6 }
        } },
      { id: 'no', label: '관객으로 남는다', intent: 'stability', out: { t: '음악은 듣는 것도 충분히 좋다.', minor: true } }
    ]
  });

  E.push({
    id: 'ar_exhibit', cat: 'arts', tier: 'choice', ages: [22, 48], w: 10, max: 1, dom: ['art'], icon: '🖼️',
    if: p => A(p, 'art') >= 38 && (p.major === 'arts' || found(p, 'art') || jobIs(p, 'artist', 'designer')),
    label: '미술', title: '작은 전시',
    text: '단골 카페 사장님이 벽면을 내어 줄 테니 작품을 걸어 보지 않겠냐고 한다.',
    choices: [
      { id: 'show', label: '전시를 연다', intent: 'adventure',
        check: { base: 46, partial: 0.5, f: [['stat', 'creativity', 0.4], ['eff', 'art', 0.3], ['talent', 'art', 10], ['region', 'culture', 0.2]] },
        out: {
          success: { t: '그림 한 점이 팔렸다. 처음으로 내 작품에 값이 매겨진 날이었다.', log: '첫 개인 전시', flag: 'exhibited', money: 150, hp: 14, achv: 3 },
          partial: { t: '조용한 전시였다. 그래도 어떤 이는 한참 앞에 서 있었다.', flag: 'exhibited', hp: 5 },
          fail: { t: '액자값만 나갔다. 작품이 걸린 벽이 괜히 휑해 보였다.', money: -80, hp: -4 }
        } },
      { id: 'no', label: '아직 내보이기엔 부족하다', intent: 'stability', out: { t: '서랍 속 스케치가 한 장 더 늘었다.', minor: true } }
    ]
  });

  E.push({
    id: 'wr_submit', cat: 'arts', tier: 'choice', ages: [16, 42], w: 10, max: 1, dom: ['writing'], icon: '✒️',
    if: p => A(p, 'writing') >= 35,
    label: '글', title: '원고를 보낼까',
    text: '밤마다 쓰던 글이 서랍 속에 쌓여 간다. 마침 문학 공모전의 마감이 사흘 남았다.',
    choices: [
      { id: 'send', label: '원고를 보낸다', intent: 'adventure',
        check: { base: 24, partial: 0.5, f: [['stat', 'creativity', 0.4], ['talent', 'writing', 16], ['stat', 'intelligence', 0.15], ['eff', 'study', 0.15]] },
        out: {
          success: { t: '당선 전화를 받았다. 내 문장이 처음으로 책에 실렸다.', log: '문학 공모전 당선', flag: ['published', 'writer_kid'], hp: 16, achv: 5, money: 300, fn: disc('writing') },
          partial: { t: '최종심에서 탈락했지만 심사평에 내 이름이 적혀 있었다.', flag: 'writer_kid', hp: 6 },
          fail: { t: '소식은 오지 않았다. 그래도 완성한 글이 생겼다.', hp: -2, flag: 'writer_kid' }
        } },
      { id: 'no', label: '서랍에 도로 넣는다', intent: 'stability', out: { t: '아직은 나만의 이야기로 두기로 했다.', minor: true } }
    ]
  });

  E.push({
    id: 'wr_blog', cat: 'arts', tier: 'choice', ages: [22, 52], w: 8, max: 1, dom: ['writing'], icon: '💻',
    if: p => A(p, 'writing') >= 28 && p.age >= 22,
    label: '글', title: '글을 연재해 볼까',
    text: '일상을 틈틈이 적던 블로그에 이웃이 늘고 있다. 출판사 편집자에게서 "연재해 보시겠어요?"라는 쪽지가 왔다.',
    choices: [
      { id: 'yes', label: '연재를 시작한다', intent: 'career',
        check: { base: 44, partial: 0.5, f: [['talent', 'writing', 12], ['stat', 'creativity', 0.3], ['eff', 'work', 0.15], ['stat', 'mental', 0.2]] },
        out: {
          success: { t: '매주 마감에 쫓기지만 독자의 댓글이 힘이 된다. 부수입도 생겼다.', log: '글 연재 시작', flag: ['blogger', 'side_hustle'], money: 400, hp: 10, achv: 2, fn: disc('writing') },
          partial: { t: '꾸준히 쓰는 것이 이렇게 어려운 줄 몰랐다. 격주 연재로 조정했다.', flag: 'blogger', hp: 3 },
          fail: { t: '몇 회 연재하다 슬럼프가 와서 멈췄다.', hp: -3, sr: 6 }
        } },
      { id: 'no', label: '지금은 일에 집중한다', intent: 'career', out: { t: '글은 여전히 취미로 남았다.', eff: { work: 6 } } }
    ]
  });

  // ═════════════════════════ 과학 · 기술 · 게임 ═════════════════════════

  E.push({
    id: 'sc_olympiad', cat: 'study', tier: 'choice', ages: [13, 18], w: 13, max: 1, dom: ['science'], icon: '🧪',
    if: p => A(p, 'science') >= 32 && p.status === 'student',
    label: '학업', title: '과학·수학 경시대회',
    text: '담임 선생님이 교내 대표로 지역 경시대회에 나가 보라고 하신다. 어려운 문제를 붙잡고 있는 시간이 이상하게 즐겁다.',
    choices: [
      { id: 'go', label: '준비해서 나간다', intent: 'education',
        check: { base: 30, partial: 0.5, f: [['stat', 'intelligence', 0.5], ['eff', 'study', 0.4], ['talent', 'math', 14], ['eduEnv', 0.2], ['stress', 0.15]] },
        out: {
          success: { t: '금상! 선생님이 교무실 앞에 내 이름을 붙여 주셨다.', log: '경시대회 입상', flag: 'olympiad', achv: 5, hp: 12, eff: { study: 20 }, st: { intelligence: 3 }, fn: disc('math') },
          partial: { t: '입상은 못 했지만 같이 준비한 친구와 가까워졌다.', hp: 5, eff: { study: 10 }, fn: H.friend(72, '경시반 친구') },
          fail: { t: '문제를 절반도 못 풀었다. 세상은 넓다는 걸 배웠다.', hp: -3, eff: { study: 6 } }
        } },
      { id: 'no', label: '부담스러워 사양한다', intent: 'stability', out: { t: '내신에 집중하기로 했다.', eff: { study: 6 } } }
    ]
  });

  E.push({
    id: 'tc_coding', cat: 'study', tier: 'choice', ages: [12, 25], w: 12, max: 1, dom: ['tech'], icon: '👾',
    if: p => A(p, 'tech') >= 24 || has(p, 'gamer_dream'),
    label: '기술', title: '처음 짜 본 프로그램',
    text: p => has(p, 'gamer_dream') ? '게임만 하던 내가 직접 게임을 만들 수 있다는 걸 알았다. 코딩 캠프 안내문이 눈에 들어온다.' : '코딩 동아리 포스터가 붙었다. 컴퓨터가 내 말을 알아듣게 만드는 일이라니, 궁금하다.',
    choices: [
      { id: 'learn', label: '배워 본다', intent: 'education',
        check: { base: 58, partial: 0.4, f: [['stat', 'intelligence', 0.3], ['talent', 'math', 8], ['talent', 'mechanical', 8], ['region', 'edu', 0.15]] },
        out: {
          success: { t: '밤새 짠 코드가 처음으로 돌아갔다. 화면의 한 줄 "Hello"가 이렇게 벅찰 줄이야.', log: '코딩에 눈을 뜸', flag: 'coding_kid', st: { intelligence: 3 }, hp: 10, eff: { study: 14 }, fn: disc('math', 'mechanical') },
          partial: { t: '반쯤 따라가다 막혀서 쉬엄쉬엄 한다. 그래도 흥미는 남았다.', flag: 'coding_kid', eff: { study: 6 } },
          fail: { t: '에러 메시지에 질려 버렸다. 컴퓨터는 어렵다.', hp: -2 }
        } },
      { id: 'no', label: '게임이나 하는 게 낫다', intent: 'rest', out: { t: '재미있는 것은 만드는 것보다 노는 것이었다.', hp: 3 } }
    ]
  });

  E.push({
    id: 'tc_sideproject', cat: 'career', tier: 'choice', ages: [25, 48], w: 10, max: 1, dom: ['tech'], icon: '🛠️',
    if: p => (jobIs(p, 'developer', 'engineer') || has(p, 'coder') || has(p, 'coding_kid')) && p.age >= 25,
    label: '기술', title: '사이드 프로젝트',
    text: '퇴근 후 틈틈이 만든 서비스가 입소문을 타기 시작했다. 사용자가 천 명을 넘었다는 알림이 떴다.',
    choices: [
      { id: 'grow', label: '밤을 쪼개 키워 본다', intent: 'risk',
        check: { base: 36, partial: 0.5, f: [['stat', 'intelligence', 0.25], ['stat', 'mental', 0.3], ['stat', 'creativity', 0.2], ['talent', 'entrepreneur', 10], ['health', 0.2]] },
        out: {
          success: { t: '광고 수익이 월급만큼 들어오기 시작했다. 이력서에도 한 줄이 늘었다.', log: '사이드 프로젝트 성공', flag: ['coder', 'side_hustle'], money: 1200, hp: 12, achv: 4, perf: 6, sr: 8 },
          partial: { t: '용돈 벌이 정도지만 개발 실력이 부쩍 늘었다.', flag: 'coder', money: 200, perf: 3, sr: 6 },
          fail: { t: '체력이 먼저 바닥났다. 서비스는 서서히 사라졌다.', hp: -6, sr: 12, st: { health: -2 } }
        } },
      { id: 'hold', label: '여기까지 즐긴 걸로 만족한다', intent: 'stability', out: { t: '재미로 만든 걸로 충분했다.', flag: 'coder', hp: 3 } }
    ]
  });

  E.push({
    id: 'gm_stream', cat: 'career', tier: 'choice', ages: [18, 34], w: 18, max: 1, dom: ['tech'], icon: '🎥',
    if: p => has(p, 'gamer_dream') && !jobIs(p, 'creator'),
    label: '게임', title: '방송을 해 볼래?',
    text: '어릴 때부터 파고든 게임 실력이 아직 남아 있다. 친구가 "방송 한번 해봐, 너 말 잘하잖아"라며 마이크를 내밀었다.',
    choices: [
      { id: 'stream', label: '방송을 시작한다', intent: 'adventure',
        check: { base: 14, partial: 0.5, max: 55, f: [['stat', 'social', 0.35], ['stat', 'creativity', 0.2], ['talent', 'social', 10], ['flag', 'gamer_dream', 10, '게임 실력']] },
        out: {
          success: { t: '구독자가 천 명, 만 명으로 늘었다. 취미가 직업이 되는 순간이었다.', log: '크리에이터로 데뷔', job: 'creator', hp: 12, achv: 4, flag: ['found_calling', 'dream_job'] },
          partial: { t: '꾸준히 하지만 아직 부업 수준이다. 단골 시청자가 생겼다.', flag: 'side_hustle', money: 150, hp: 5 },
          fail: { t: '시청자는 늘 열 명 안팎이었다. 방송은 접었지만 즐거운 시간이었다.', hp: -3 }
        } },
      { id: 'no', label: '취미로만 남긴다', intent: 'stability', out: { t: '게임은 게임일 때 더 재미있다.', minor: true } }
    ]
  });

  // ═════════════════════════ 사업 · 장사 ═════════════════════════

  E.push({
    id: 'bz_lemonade', cat: 'money', tier: 'choice', ages: [10, 16], w: 14, max: 1, dom: ['business'], icon: '🍋',
    if: p => A(p, 'business') >= 18 || p.family.tags.indexOf('self_employed') >= 0,
    label: '장사', title: '학교 바자회 장사',
    text: '학교 바자회에서 반별로 부스를 열기로 했다. 가게 집 아이답게(혹은 타고난 감각 덕분에) 나는 어떻게 팔아야 할지 머릿속에 그림이 그려진다.',
    choices: [
      { id: 'lead', label: '앞장서서 판매를 이끈다', intent: 'career',
        check: { base: 46, partial: 0.5, f: [['talent', 'entrepreneur', 16], ['stat', 'social', 0.35], ['fn', p => p.family.tags.indexOf('self_employed') >= 0 ? { label: '장사하는 집안', v: 10 } : null]] },
        out: {
          success: { t: '우리 반 부스가 제일 먼저 완판됐다. "너 장사 소질 있다!" 선생님이 웃으셨다.', log: '바자회 완판', flag: 'lemonade', hp: 10, st: { social: 2 }, fn: disc('entrepreneur', 'leadership') },
          partial: { t: '절반쯤 팔았다. 팔아 보니 어떻게 해야 더 팔리는지 보이기 시작했다.', flag: 'lemonade', hp: 4 },
          fail: { t: '가격을 잘못 매겨 재고가 쌓였다. 친구들 앞에서 조금 머쓱했다.', hp: -3 }
        } },
      { id: 'help', label: '조용히 돕는다', intent: 'stability', out: { t: '맡은 일만 성실히 했다.', minor: true } }
    ]
  });

  E.push({
    id: 'bz_online', cat: 'money', tier: 'choice', ages: [22, 44], w: 10, max: 1, dom: ['business'], icon: '📦',
    if: p => A(p, 'business') >= 32 && p.age >= 22,
    label: '사업', title: '온라인 스토어',
    text: '퇴근 후 공급업체를 알아보다가, 작은 온라인 스토어를 열어 보기로 마음먹었다. 주문 알림 소리가 상상만 해도 달콤하다.',
    choices: [
      { id: 'open', label: '스토어를 연다', intent: 'risk',
        check: { base: 34, partial: 0.5, f: [['talent', 'entrepreneur', 14], ['stat', 'creativity', 0.2], ['stat', 'social', 0.2], ['assets', 0.3], ['flag', 'lemonade', 6, '어릴 적 장사 경험']] },
        out: {
          success: { t: '입소문이 나며 주문이 몰렸다. 포장 테이프 소리가 일상이 되었다.', log: '온라인 스토어 성공', flag: ['online_shop', 'side_hustle'], money: 1500, hp: 12, achv: 4, sr: 8 },
          partial: { t: '큰돈은 아니지만 매달 꾸준히 팔린다.', flag: 'online_shop', money: 300, sr: 4 },
          fail: { t: '재고만 쌓였다. 창고가 된 방을 보며 한숨을 쉬었다.', money: -800, hp: -6, sr: 8 }
        } },
      { id: 'no', label: '월급이 더 안전하다', intent: 'stability', out: { t: '한 달에 한 번 확실하게 들어오는 월급을 다시 확인했다.', minor: true } }
    ]
  });

  E.push({
    id: 'fb_family_biz', cat: 'family', tier: 'major', ages: [22, 42], w: 16, max: 1, dom: ['business'], icon: '🏪',
    if: p => (parentJob(p, 'selfemp', 'farmer') || p.family.tags.indexOf('self_employed') >= 0) && !jobIs(p, 'selfemp', 'farmer', 'ceo'),
    label: '가업', title: '"가게, 네가 이어 볼래?"',
    text: p => parentJob(p, 'farmer') ? '{parent}께서 몇 십 년 일군 밭을 이어 볼 생각이 없느냐고 물으셨다. 말씀은 담담했지만 눈빛은 간절했다.' : '{parent}께서 오랫동안 꾸려 온 가게를 이어 볼 생각이 없느냐고 물으셨다. 말씀은 담담했지만 눈빛은 간절했다.',
    choices: [
      { id: 'take', label: '가업을 이어받는다', intent: 'family',
        check: { base: 62, partial: 0.4, f: [['talent', 'entrepreneur', 10], ['stat', 'social', 0.2], ['rel', 'father', 0.1], ['rel', 'mother', 0.1], ['health', 0.15]] },
        out: {
          success: { t: '앞치마를 두르고 첫 손님을 맞았다. 어릴 적 어깨너머로 본 것들이 의외로 많이 쓸모 있었다.', log: '가업을 이어받음', quit: 'seeking', fn: p => { LG.Outcome.setJob(p, LG.Rel.parents(p).some(n => n.job === 'farmer') ? 'farmer' : 'selfemp', { perf: 55 }); return ''; }, flag: ['started_business', 'family_business'], rel: { parents: 15 }, hp: 4, money: 600 },
          partial: { t: '반쯤은 도우며 배우는 중이다. 부모님은 아직 현역이다.', flag: 'family_business', rel: { parents: 8 }, fn: p => { LG.Outcome.setJob(p, LG.Rel.parents(p).some(n => n.job === 'farmer') ? 'farmer' : 'selfemp', { perf: 45 }); return ''; } },
          fail: { t: '마음은 있었지만 몸이 따라 주지 않았다. 부모님도 더 권하지 못하셨다.', hp: -4, rel: { parents: -3 } }
        } },
      { id: 'no', label: '내 길을 가겠다고 말씀드린다', intent: 'independence', out: { t: '"그래, 네 인생이니까." 부모님은 한참 말이 없으셨다.', rel: { parents: -5 }, hp: -2, flag: 'refused_family_biz' } }
    ]
  });

  // ═════════════════════════ 돌봄 · 사람 ═════════════════════════

  E.push({
    id: 'cr_volunteer', cat: 'care', tier: 'choice', ages: [15, 30], w: 12, max: 1, dom: ['care'], icon: '🧡',
    if: p => A(p, 'care') >= 22 || (A(p, 'people') >= 40 && p.stats.mental >= 55),
    label: '봉사', title: '봉사활동',
    text: '복지관 게시판에 "방과 후 공부방 멘토 구함" 공고가 붙어 있다. 가볍게 시작하는 사람은 많은데 끝까지 하는 사람은 드물다고 한다.',
    choices: [
      { id: 'join', label: '꾸준히 나간다', intent: 'social',
        check: { base: 66, partial: 0.3, f: [['stat', 'mental', 0.2], ['stat', 'social', 0.2], ['stress', 0.2]] },
        out: {
          success: { t: '아이들이 이름을 외워서 불러 준다. 누군가에게 필요한 사람이 된다는 건 이런 느낌이구나.', log: '봉사활동을 꾸준히 함', flag: 'volunteer', hp: 10, st: { mental: 2, social: 2 }, sr: -5 },
          partial: { t: '시험 기간엔 빠지기도 했지만 마음은 따뜻했다.', flag: 'volunteer', hp: 4 },
          fail: { t: '일정이 겹쳐 몇 번 가지 못했다. 미안한 마음이 남았다.', hp: -2 }
        } },
      { id: 'no', label: '지금은 시간이 없다', intent: 'stability', out: { t: '언젠가 여유가 생기면 다시 생각해 보기로 했다.', minor: true } }
    ]
  });

  E.push({
    id: 'cr_counsel', cat: 'care', tier: 'choice', ages: [14, 32], w: 10, max: 1, dom: ['care', 'people'], icon: '🫂',
    if: p => (A(p, 'people') >= 38 || A(p, 'care') >= 28) && LG.Rel.all(p, 'friend').length > 0,
    label: '친구', title: '친구의 속마음',
    text: '{friend}가 늦은 밤 전화를 걸어 왔다. 한참을 말없이 있다가 "요즘 너무 힘들어"라고 했다.',
    choices: [
      { id: 'listen', label: '밤새 이야기를 들어 준다', intent: 'social',
        check: { base: 60, partial: 0.3, f: [['stat', 'social', 0.3], ['stat', 'mental', 0.25], ['stress', 0.2]] },
        out: {
          success: { t: '새벽이 되어서야 친구가 웃었다. "네가 있어서 다행이야."', log: '힘들어하는 친구 곁을 지킴', flag: 'counsel_friend', rel: { friends: 14 }, hp: 8, st: { mental: 2 } },
          partial: { t: '서툴게나마 곁에 있어 줬다. 친구는 조금 가벼워진 목소리로 전화를 끊었다.', rel: { friends: 6 } },
          fail: { t: '무슨 말을 해야 할지 몰라 어색한 위로만 건넸다. 마음에 걸린다.', rel: { friends: -2 }, hp: -3 }
        } },
      { id: 'later', label: '"내일 다시 얘기하자"고 한다', intent: 'rest', out: { t: '졸음에 못 이겨 전화를 끊었다. 다음 날 연락이 왔지만 마음 한편이 불편했다.', rel: { friends: -6 } } }
    ]
  });

  // ═════════════════════════ 자연 · 농촌 ═════════════════════════

  E.push({
    id: 'nt_farm_help', cat: 'nature', tier: 'choice', ages: [10, 17], w: 14, max: 1, dom: ['nature'], icon: '🌾',
    if: p => !p.urban || parentJob(p, 'farmer') || p.family.tags.indexOf('with_grandparents') >= 0,
    label: '고향', title: '농번기',
    text: '모내기철이 되자 온 동네가 바빠졌다. 방과 후 일손을 거들어 달라는 {parent}의 눈치가 보인다.',
    choices: [
      { id: 'help', label: '기꺼이 거든다', intent: 'family',
        out: { t: '진흙 속에서 하루를 보내니 온몸이 뻐근하다. 저녁에 먹은 새참이 평생 기억날 맛이었다.', log: '농사일을 거듦', flag: 'farm_helper', st: { physical: 2, mental: 2 }, rel: { parents: 8 }, eff: { work: 10, sport: 6 }, hp: 4 } },
      { id: 'study', label: '공부해야 한다고 말씀드린다', intent: 'education', out: { t: '"그래, 공부해라." 부모님은 한 번 더 말없이 호미를 드셨다.', eff: { study: 8 }, rel: { parents: -2 } } }
    ]
  });

  E.push({
    id: 'nt_return', cat: 'nature', tier: 'choice', ages: [35, 58], w: 10, max: 1, dom: ['nature'], icon: '🏡',
    if: p => (A(p, 'nature') >= 38 || (!p.urban && p.age >= 40)) && !jobIs(p, 'farmer') && !p.college && p.liveIn !== 'abroad',
    label: '삶의 방향', title: '귀농·귀촌의 유혹',
    text: p => p.urban ? '도시의 출퇴근에 지쳤다. 시골에 빈 땅이 나왔다는 이야기를 들었다. 흙과 함께 사는 삶은 어떨까.' : '고향의 빈 땅이 나왔다는 소식을 들었다. 돌아가면 어릴 적 풍경이 그대로일까.',
    choices: [
      { id: 'go', label: '귀농을 결심한다', intent: 'adventure',
        check: { base: 42, partial: 0.5, f: [['health', 0.3], ['stat', 'mental', 0.25], ['flag', 'farm_helper', 10, '농사 경험'], ['fn', p => parentJob(p, 'farmer') ? { label: '농사짓는 집안', v: 12 } : null], ['assets', 0.3]] },
        out: {
          success: { t: '새벽 닭 울음에 눈을 뜬다. 땀 흘린 만큼 거두는 삶. 몸은 고돼도 마음은 맑아졌다.', log: '귀농', quit: 'seeking', flag: ['returned_farm', 'found_calling'], hp: 14, sr: -14, st: { health: 3 }, fn: p => { LG.Outcome.setJob(p, 'farmer', { perf: 50 }); p.money -= 1500; return ''; } },
          partial: { t: '주말 농장 정도로 시작했다. 도시와 시골을 오가는 어정쩡한 삶이다.', flag: 'hiking', hp: 6, money: -400 },
          fail: { t: '첫해 농사는 서리와 태풍에 엉망이 되었다. 수업료치고는 비쌌다.', hp: -8, money: -1200, sr: 8 }
        } },
      { id: 'stay', label: '지금 사는 곳에서 버틴다', intent: 'stability', out: { t: '아직은 도시가 내 자리다. 대신 주말 등산을 늘렸다.', flag: 'hiking', hp: 3 } }
    ]
  });

  E.push({
    id: 'nt_hiking', cat: 'nature', tier: 'choice', ages: [30, 65], w: 8, max: 1, dom: ['nature', 'sports'], icon: '⛰️',
    if: p => (A(p, 'nature') >= 24 || A(p, 'sports') >= 30) && !has(p, 'hiking'),
    label: '취미', title: '산악회에 들어가 볼까',
    text: '직장 선배가 주말 산행에 같이 가자고 한다. "한 번만 가 보면 알아. 하산 후 막걸리가 끝내줘."',
    choices: [
      { id: 'join', label: '따라가 본다', intent: 'social',
        out: { t: '정상에서 본 풍경이 막혔던 가슴을 뚫어 줬다. 매달 산행이 이어지게 됐다.', log: '산악회 활동 시작', flag: ['hiking', 'exercise_habit'], sr: -10, hp: 8, st: { health: 3, physical: 2 }, fn: H.friend(70, '산악회 친구') } },
      { id: 'no', label: '주말은 쉬고 싶다', intent: 'rest', out: { t: '이불 속이 최고의 정상이다.', sr: -3 } }
    ]
  });

  E.push({
    id: 'ru_commute', cat: 'nature', tier: 'choice', ages: [13, 17], w: 14, max: 1, icon: '🚌',
    if: p => !p.urban && p.status === 'student',
    label: '시골', title: '하루 세 시간의 통학',
    text: '읍내 학교까지 버스로 왕복 세 시간이다. 막차를 놓치면 걸어서 집에 가야 한다.',
    choices: [
      { id: 'bus', label: '버스에서 공부한다', intent: 'education',
        check: { base: 45, partial: 0.5, f: [['stat', 'mental', 0.35], ['eff', 'study', 0.2]] },
        out: {
          success: { t: '흔들리는 버스 안에서 단어장을 넘겼다. 어느새 통학이 나만의 공부방이 됐다.', log: '통학 시간을 공부로 바꿈', eff: { study: 18 }, st: { mental: 2 }, hp: 4 },
          partial: { t: '졸음과 싸우며 버텼다. 그래도 창밖 풍경은 좋았다.', eff: { study: 8 }, sr: 5 },
          fail: { t: '피곤이 쌓여 성적이 떨어졌다.', eff: { study: -6 }, sr: 8, hp: -4 }
        } },
      { id: 'dorm', label: '읍내에서 자취(하숙)한다', intent: 'independence', if: p => p.family.tier >= 2,
        out: { t: '혼자 지내는 법을 일찍 배웠다. 시간은 생겼지만 집이 그립다.', home: 'rent', eff: { study: 10 }, rel: { parents: -4 }, st: { mental: 2 }, money: -100 } }
    ]
  });

  E.push({
    id: 'ru_move', cat: 'nature', tier: 'major', ages: [19, 28], w: 16, max: 1, icon: '🚉',
    if: p => !p.urban && !p.liveIn && (p.college || p.job) && ['seoul', 'gyeonggi'].indexOf(p.region) < 0,
    label: '상경', title: '서울행 기차',
    text: '지방에선 기회가 한정적이다. 서울에서 일하는 선배가 "올라오면 자리 알아봐 줄게"라고 했다.',
    choices: [
      { id: 'go', label: '서울로 올라간다', intent: 'adventure',
        check: { base: 56, partial: 0.4, f: [['stat', 'social', 0.2], ['assets', 0.3], ['stat', 'mental', 0.2]] },
        out: {
          success: { t: '캐리어를 끌고 낯선 역에 내렸다. 월세는 비쌌지만 기회는 훨씬 많았다.', log: '서울 상경', liveIn: 'seoul', home: 'rent', exp: 3, hp: 6, fn: p => { if (p.job) p.job.mul = Math.min(LG.Economy.maxMul(p.job.id, p), p.job.mul * 1.1); return ''; } },
          partial: { t: '고시원 같은 방에서 시작했다. 고단하지만 도시의 속도에 적응 중이다.', liveIn: 'seoul', home: 'rent', exp: 2, sr: 8 },
          fail: { t: '집 구하기부터 막혔다. 한 달 만에 고향으로 돌아왔다.', hp: -6, money: -300 }
        } },
      { id: 'stay', label: '고향에서 자리 잡는다', intent: 'stability', out: { t: '아는 얼굴이 있는 곳이 좋다. 가족과 가까이 지내기로 했다.', rel: { parents: 6 }, hp: 4 } }
    ]
  });

  // ═════════════════════════ 세계 · 언어 ═════════════════════════

  E.push({
    id: 'gl_camp', cat: 'global', tier: 'choice', ages: [17, 25], w: 10, max: 1, dom: ['global'], icon: '🗺️',
    if: p => A(p, 'global') >= 26 || p.family.tier >= 4,
    label: '세계', title: '어학연수',
    text: '영어 수업 시간에만 쓰던 말이 외국인 친구와 통했을 때의 짜릿함을 잊지 못한다. 방학 어학연수 모집 공고가 나왔다.',
    choices: [
      { id: 'go', label: '어학연수를 떠난다', intent: 'adventure',
        check: { base: 54, partial: 0.4, f: [['talent', 'language', 14], ['family', 0.5], ['stat', 'social', 0.3], ['assets', 0.2]] },
        out: {
          success: { t: '낯선 도시에서 보낸 반년. 이제 외국어가 두렵지 않다.', log: '어학연수', flag: 'lang_camp', money: -800, st: { social: 3, intelligence: 2 }, hp: 10, exp: 3, fn: disc('language') },
          partial: { t: '한국인 친구들과만 어울린 게 아쉽다. 그래도 많이 보고 왔다.', flag: 'lang_camp', money: -800, hp: 4, exp: 2 },
          fail: { t: '비용만 쓰고 적응하지 못했다. 한 달 만에 돌아왔다.', money: -500, hp: -5 }
        } },
      { id: 'no', label: '여건이 안 돼서 접는다', intent: 'stability', out: { t: '대신 온라인 회화 수업을 들었다.', eff: { study: 6 } } }
    ]
  });

  E.push({
    id: 'gl_wh', cat: 'global', tier: 'choice', ages: [19, 31], w: 9, max: 1, dom: ['global'], icon: '🧳',
    if: p => (A(p, 'global') >= 30 || p.stats.social >= 62) && p.liveIn !== 'abroad' && p.status !== 'military',
    label: '세계', title: '워킹홀리데이',
    text: '1년짜리 워킹홀리데이 비자가 나왔다. 일하고 여행하고, 돌아오면 무엇이 달라져 있을까.',
    choices: [
      { id: 'go', label: '비행기 표를 끊는다', intent: 'adventure',
        check: { base: 56, partial: 0.4, f: [['stat', 'social', 0.3], ['stat', 'mental', 0.3], ['talent', 'language', 10], ['health', 0.2]] },
        out: {
          success: { t: '농장에서 일하고, 새벽 해안을 달리고, 세계 각국 친구를 사귀었다. 사람이 달라져서 돌아왔다.', log: '워킹홀리데이', flag: 'working_holiday', money: 500, exp: 5, st: { social: 3, mental: 3 }, hp: 14 },
          partial: { t: '일과 여행을 병행하느라 바빴지만 값진 경험이었다.', flag: 'working_holiday', exp: 3, hp: 6 },
          fail: { t: '향수병과 일자리 문제로 몇 달 만에 돌아왔다.', money: -600, hp: -5 }
        } },
      { id: 'no', label: '지금 쌓는 경력이 더 중요하다', intent: 'career', out: { t: '여행은 휴가로 충분하다고 생각했다.', eff: { work: 6 } } }
    ]
  });

  // ═════════════════════════ 가정환경 ═════════════════════════

  E.push({
    id: 'fb_scholar', cat: 'family', tier: 'choice', ages: [17, 19], w: 22, max: 1, icon: '🏅',
    if: p => p.family.tier <= 2 && (has(p, 'studied_hard') || p.stats.intelligence >= 60 || has(p, 'olympiad')),
    label: '기회', title: '장학생 추천',
    text: '담임 선생님이 조용히 부르셨다. "집안 사정은 알고 있다. 장학재단 추천서를 써 줄 테니 도전해 볼래?"',
    choices: [
      { id: 'apply', label: '추천서를 받아 지원한다', intent: 'education',
        check: { base: 36, partial: 0.4, f: [['stat', 'intelligence', 0.35], ['eff', 'study', 0.35], ['flag', 'studied_hard', 10, '꾸준한 노력'], ['flag', 'olympiad', 8, '경시대회 입상'], ['stat', 'mental', 0.2]] },
        out: {
          success: { t: '장학생으로 선발됐다. 등록금 걱정이 한결 줄었다.', log: '장학생 선발', flag: 'scholarship', hp: 14, achv: 3, rel: { parents: 6 } },
          partial: { t: '반액 장학금을 받게 되었다. 큰 도움이 된다.', flag: 'scholarship', hp: 6 },
          fail: { t: '아쉽게 탈락했다. 선생님이 어깨를 두드려 주셨다.', hp: -5 }
        } },
      { id: 'no', label: '신세 지기 싫다', intent: 'independence', out: { t: '내 힘으로 해보고 싶었다.', eff: { work: 6 } } }
    ]
  });

  E.push({
    id: 'fb_expect', cat: 'family', tier: 'choice', ages: [16, 19], w: 16, max: 1, icon: '🥼',
    if: p => parentJob(p, 'doctor', 'lawyer') && p.track !== 'sports' && p.status === 'student',
    label: '기대', title: '"너도 의사가 돼야지"',
    text: '식탁에서 {parent}가 말씀하셨다. "우리 집은 대대로 전문직이다. 의대든 로스쿨이든 네가 준비해야 하지 않겠니."',
    choices: [
      { id: 'follow', label: '기대에 맞춰 공부한다', intent: 'education',
        out: { t: '내가 원하는 길인지 아직 잘 모르겠지만, 책상 앞에 앉았다.', eff: { study: 24 }, sr: 10, rel: { parents: 8 }, flag: 'studied_hard' } },
      { id: 'own', label: '내가 원하는 길을 말씀드린다', intent: 'independence',
        check: { base: 40, partial: 0, f: [['support', 0.3], ['stat', 'mental', 0.3], ['rel', 'father', 0.1], ['rel', 'mother', 0.1]] },
        out: {
          success: { t: '한참 침묵이 흐른 끝에 "네 인생이니 책임은 네가 져라"는 말을 들었다. 처음으로 어른 대접을 받은 기분이다.', log: '부모님 기대와 다른 길을 선택', hp: 10, st: { mental: 3 }, flag: 'own_path' },
          fail: { t: '"철없는 소리 하지 마라." 며칠째 집 안 공기가 얼어붙었다.', hp: -8, rel: { parents: -12 }, sr: 8 }
        } }
    ]
  });

  E.push({
    id: 'fb_remarry', cat: 'family', tier: 'choice', ages: [10, 25], w: 14, max: 1, icon: '👥',
    if: p => p.family.tags.indexOf('single_parent') >= 0 && !has(p, 'parent_remarried'),
    label: '가족', title: '새로운 사람',
    text: '{parent}가 저녁 식탁에서 어렵게 말을 꺼냈다. "엄마(아빠)가 만나는 사람이 있어. 한 번 인사만 해볼래?"',
    choices: [
      { id: 'meet', label: '열린 마음으로 만난다', intent: 'family',
        check: { base: 58, partial: 0.4, f: [['stat', 'mental', 0.2], ['stat', 'social', 0.2], ['support', 0.15]] },
        out: {
          success: { t: '어색했지만 따뜻한 사람이었다. 부모님의 웃음이 늘었다.', log: '부모님의 새 가족', flag: 'parent_remarried', rel: { parents: 8 }, hp: 8 },
          partial: { t: '아직은 서먹하다. 시간이 필요하다.', flag: 'parent_remarried', rel: { parents: 2 } },
          fail: { t: '그 사람을 받아들일 수 없었다. 부모님과 한동안 말을 하지 않았다.', rel: { parents: -10 }, hp: -6, sr: 8 }
        } },
      { id: 'cold', label: '"아직은 싫어요"라고 말한다', intent: 'independence', out: { t: '부모님은 더 말씀하지 않으셨다. 방문 틈으로 불빛이 새어 나왔다.', rel: { parents: -4 }, hp: -2 } }
    ]
  });

  E.push({
    id: 'fb_intern', cat: 'family', tier: 'choice', ages: [19, 27], w: 14, max: 1, icon: '🏢',
    if: p => p.family.tier >= 4 && (p.edu === 'college' || p.status === 'college') && !has(p, 'intern'),
    label: '인맥', title: '아버지 지인의 회사 인턴',
    text: '식사 자리에서 {parent}의 지인이 "우리 회사 인턴 하나 비는데, 해 볼 생각 있니?"라고 물었다.',
    choices: [
      { id: 'yes', label: '기회를 잡는다', intent: 'career',
        check: { base: 75, partial: 0.2, f: [['stat', 'social', 0.2], ['eff', 'work', 0.15]] },
        out: {
          success: { t: '배경 덕이라는 눈초리도 있지만, 실무에서 실력으로 보여 주기로 했다. 값진 경험이 됐다.', log: '인턴 경험', flag: 'intern', eff: { work: 22 }, st: { social: 2 }, hp: 4 },
          partial: { t: '단순 업무 위주였다. 그래도 사회생활의 맛을 봤다.', flag: 'intern', eff: { work: 12 } },
          fail: { t: '업무에 적응하지 못하고 한 달 만에 그만뒀다.', hp: -5 }
        } },
      { id: 'no', label: '내 힘으로 해 보겠다', intent: 'independence', out: { t: '"내 이름으로 붙고 싶다." 스스로 이력서를 쓰기 시작했다.', eff: { work: 8 }, st: { mental: 2 } } }
    ]
  });

  E.push({
    id: 'fb_family_debt', cat: 'family', tier: 'major', ages: [19, 32], w: 13, max: 1, icon: '📞',
    if: p => p.family.tier <= 2 && p.job && H.cash(p) >= 500,
    label: '가족', title: '집안의 빚',
    text: '{parent}가 전화로 겨우 입을 떼셨다. "미안한데 이번 달 이자가 모자라서… 아니다, 괜찮다."',
    choices: [
      { id: 'help', label: '월급에서 돕는다', intent: 'family',
        out: { t: '말없이 통장 이체 버튼을 눌렀다. 내 월급이 가족의 숨통이 되었다.', log: '가족의 빚을 도움', money: -800, rel: { parents: 14 }, flag: ['supporting_parents', 'helped_family'], hp: 2 } },
      { id: 'limit', label: '금액을 정해서 돕는다', intent: 'stability',
        out: { t: '"여기까지는 도울게요." 서운해하셨지만 이해해 주셨다.', money: -300, rel: { parents: 5 } } },
      { id: 'no', label: '내 생활이 먼저다', intent: 'independence', out: { t: '모른 척 하기가 쉽지 않았다. 며칠 동안 마음이 무거웠다.', rel: { parents: -12 }, sr: 8, hp: -4 } }
    ]
  });

  E.push({
    id: 'fb_grandparent', cat: 'family', tier: 'choice', ages: [14, 30], w: 12, max: 1, icon: '🧓',
    if: p => p.family.tags.indexOf('with_grandparents') >= 0 && LG.Rel.get(p, 'grandparent') && LG.Rel.get(p, 'grandparent').alive,
    label: '가족', title: '할머니·할아버지의 손',
    text: '어릴 때부터 곁에서 키워 주신 조부모님의 걸음이 느려졌다. 병원 예약일이 내 시험 날과 겹쳤다.',
    choices: [
      { id: 'go', label: '모시고 병원에 간다', intent: 'family',
        out: { t: '진료실 앞 긴 의자에서 손을 꼭 잡고 있었다. "우리 강아지 다 컸네." 그 한마디에 눈물이 났다.', log: '조부모님을 모시고 병원에', rel: { grandparent: 18, parents: 6 }, eff: { study: -6 }, hp: 6, st: { mental: 2 } } },
      { id: 'exam', label: '시험에 집중하고 가족에게 맡긴다', intent: 'education', out: { t: '마음이 쓰였지만 시험장에서 최선을 다했다.', eff: { study: 8 }, rel: { grandparent: -4 }, sr: 4 } }
    ]
  });

  // ═════════════════════════ 과거 선택의 메아리 ═════════════════════════

  E.push({
    id: 'cb_bully_scar', cat: 'health', tier: 'choice', ages: [16, 32], w: 18, max: 1, icon: '🌧️',
    if: p => has(p, 'bullied'),
    label: '지난 상처', title: '아직 남아 있는 기억',
    text: '어릴 적 따돌림당했던 기억이 문득문득 떠오른다. 비슷한 상황의 뉴스를 볼 때마다 가슴이 답답해진다.',
    choices: [
      { id: 'counsel', label: '전문 상담을 받아 본다', intent: 'health',
        check: { base: 56, partial: 0.4, f: [['stat', 'mental', 0.2], ['assets', 0.2], ['support', 0.15]] },
        out: {
          success: { t: '상담실에서 처음으로 그날의 이야기를 끝까지 했다. 가슴의 돌덩이가 작아졌다.', log: '상담으로 과거의 상처를 마주함', unflag: 'bullied', flag: 'healed', st: { mental: 5 }, hp: 10, sr: -12 },
          partial: { t: '아직 다 털어놓지 못했지만 한 걸음을 뗐다.', st: { mental: 2 }, sr: -5, money: -60 },
          fail: { t: '상담이 맞지 않았다. 다른 방법을 찾아야 한다.', money: -80, hp: -2 }
        } },
      { id: 'alone', label: '혼자 이겨 내 본다', intent: 'independence', out: { t: '말하지 않아도 시간이 해결해 주리라 믿었다. 아직은 그렇지 않다.', sr: 4, st: { mental: 1 } } }
    ]
  });

  E.push({
    id: 'cb_stood_up', cat: 'friend', tier: 'choice', ages: [24, 46], w: 16, max: 1, icon: '📱',
    if: p => has(p, 'stood_up'),
    label: '인연', title: '그때 그 친구',
    text: '낯선 번호로 문자가 왔다. "혹시 기억해? 그때 네가 괴롭힘 막아 줬던… 덕분에 학교를 계속 다닐 수 있었어."',
    choices: [
      { id: 'meet', label: '반갑게 만나러 간다', intent: 'social',
        out: { t: '십수 년 만에 마주 앉았다. 서로의 이야기가 쏟아졌다. 그때의 작은 용기가 누군가의 인생을 바꿨다는 사실이 뭉클했다.', log: '어릴 적 구해 준 친구와 재회', rel: { friends: 14 }, hp: 12, achv: 2, flag: 'kept_friends', fn: H.friend(82, '오랜 친구') } },
      { id: 'reply', label: '답장만 하고 만나지는 않는다', intent: 'stability', out: { t: '고맙다는 답장을 보냈다. 그걸로 충분한 것 같았다.', hp: 3 } }
    ]
  });

  E.push({
    id: 'cb_looked_away', cat: 'friend', tier: 'choice', ages: [27, 50], w: 12, max: 1, icon: '🥃',
    if: p => has(p, 'looked_away'),
    label: '동창회', title: '그날 못 본 척했던 친구',
    text: '동창회에서 어릴 적 따돌림을 당하던 친구를 마주쳤다. 그 친구는 담담하게 인사를 건넸다. 나는 그날 밤 아무 말도 하지 못했던 기억이 떠올랐다.',
    choices: [
      { id: 'sorry', label: '용기를 내어 사과한다', intent: 'social',
        check: { base: 60, partial: 0.4, f: [['stat', 'mental', 0.25], ['stat', 'social', 0.2]] },
        out: {
          success: { t: '"괜찮아, 그땐 다 어렸잖아." 그 한마디에 오래 묵은 마음의 짐이 내려갔다.', log: '오랜 사과', unflag: 'looked_away', hp: 10, st: { mental: 2 }, fn: H.friend(65, '동창') },
          partial: { t: '어색하게 사과했지만 서로 다른 얘기로 넘어갔다. 그래도 말은 꺼냈다.', unflag: 'looked_away', hp: 3 },
          fail: { t: '타이밍을 놓쳤다. 친구는 이미 자리를 떠난 뒤였다.', hp: -3 }
        } },
      { id: 'pass', label: '가볍게 인사만 한다', intent: 'stability', out: { t: '결국 아무 말도 하지 못했다. 집에 오는 길이 길었다.', hp: -3 } }
    ]
  });

  E.push({
    id: 'cb_teen_job', cat: 'career', tier: 'choice', ages: [19, 27], w: 18, max: 1, icon: '🧾',
    if: p => has(p, 'worked_teen') && !p.job && (p.status === 'seeking' || p.status === 'college' || p.status === 'student'),
    label: '인연', title: '"우리 가게로 와라"',
    text: '고등학생 때 일하던 가게 사장님이 연락을 주셨다. "그때 네가 제일 성실했어. 정직원 자리가 났는데 올 생각 있니?"',
    choices: [
      { id: 'yes', label: '기쁘게 받아들인다', intent: 'career',
        out: { t: '아는 사람들과 하는 일이라 적응이 빨랐다. 어릴 적 성실함이 이렇게 돌아왔다.', log: '예전 아르바이트 가게의 정직원이 됨', job: 'service', jobOpt: { perf: 62 }, flag: 'kept_friends', hp: 8, rel: { friends: 6 } } },
      { id: 'no', label: '더 넓은 길을 찾아보겠다고 말씀드린다', intent: 'adventure', out: { t: '"그래, 네가 가고 싶은 길로 가라." 사장님은 웃으며 응원해 주셨다.', hp: 4 } }
    ]
  });

  E.push({
    id: 'cb_rehab_path', cat: 'sports', tier: 'choice', ages: [19, 35], w: 18, max: 1, dom: ['sports'], icon: '💪',
    if: p => has(p, 'sports_injury') && (p.job === null || jobIs(p, 'service', 'parttime', 'coach')) && !has(p, 'retired_athlete_coach'),
    label: '다시 운동장으로', title: '재활 센터의 제안',
    text: '재활 때 만난 물리치료사가 말했다. "경험자가 환자들에게 필요해요. 선수 출신 트레이너를 찾고 있었는데, 생각 있으세요?"',
    choices: [
      { id: 'yes', label: '트레이너 과정을 밟는다', intent: 'career',
        check: { base: 62, partial: 0.4, f: [['flag', 'sp_rehab', 12, '재활 경험'], ['stat', 'social', 0.2], ['stat', 'mental', 0.2]] },
        out: {
          success: { t: '내가 겪은 고통이 누군가의 회복을 돕는 지식이 되었다. 회원이 "덕분에 다시 걸어요"라고 말했을 때 울컥했다.', log: '재활 트레이너로 새 출발', flag: ['retired_athlete_coach', 'found_calling'], job: 'coach', hp: 14, achv: 3 },
          partial: { t: '자격증 공부를 하며 보조 트레이너로 시작했다.', flag: 'retired_athlete_coach', job: 'coach', jobOpt: { mul: 0.75 }, hp: 5 },
          fail: { t: '자격시험에서 떨어졌다. 한 번 더 준비해야 한다.', hp: -4, sr: 6 }
        } },
      { id: 'no', label: '운동과는 거리를 둔다', intent: 'independence', out: { t: '운동을 보는 일은 아직 아프다. 다른 길을 찾기로 했다.', hp: -2 } }
    ]
  });

  E.push({
    id: 'cb_dream_back', cat: 'arts', tier: 'choice', ages: [28, 48], w: 14, max: 1, icon: '🌠',
    if: p => has(p, 'dream_deferred') && !has(p, 'found_calling'),
    label: '접어둔 꿈', title: '다시 꺼낸 꿈',
    text: '몇 년째 접어 둔 꿈이 서랍 속에서 자꾸 불러낸다. 오늘 퇴근길, 오래된 연습 노트를 다시 펼쳤다.',
    choices: [
      { id: 'again', label: '일과 병행하며 다시 도전한다', intent: 'adventure',
        check: { base: 30, partial: 0.55, f: [['stat', 'creativity', 0.3], ['stat', 'mental', 0.25], ['happy', 0.15], ['health', 0.2], ['ageOver', 40, 1]] },
        out: {
          success: { t: '밤마다 조금씩 쌓은 결과물이 마침내 빛을 봤다. 늦었지만 꿈이 현실이 되었다.', log: '접었던 꿈에 다시 도전해 성공', flag: ['found_calling', 'dream_job'], unflag: 'dream_deferred', hp: 16, achv: 5, money: 400 },
          partial: { t: '큰 성과는 없어도 다시 꿈을 향해 걷고 있다는 사실이 나를 살린다.', unflag: 'dream_deferred', flag: 'found_calling', hp: 8 },
          fail: { t: '체력과 시간의 벽이 높았다. 이번엔 후회 없이 내려놓을 수 있었다.', unflag: 'dream_deferred', hp: -2, sr: 4 }
        } },
      { id: 'no', label: '이젠 현실에 충실하자', intent: 'stability', out: { t: '노트를 덮고 서랍에 넣었다. 현실의 무게가 만만치 않다.', hp: -3 } }
    ]
  });

  E.push({
    id: 'cb_divorce_fear', cat: 'relationship', tier: 'choice', ages: [24, 40], w: 14, max: 1, icon: '💭',
    if: p => has(p, 'parents_divorced') && !!H.rel(p, 'partner') && !H.rel(p, 'spouse'),
    label: '마음의 그늘', title: '결혼이 무서운 이유',
    text: '{partner}가 결혼 이야기를 꺼낼 때마다 마음 한구석이 서늘해진다. 어릴 적 부모님이 갈라서던 날이 떠오르기 때문이다.',
    choices: [
      { id: 'talk', label: '솔직하게 털어놓는다', intent: 'love',
        check: { base: 56, partial: 0.4, f: [['rel', 'partner', 0.4], ['stat', 'mental', 0.2], ['stat', 'social', 0.15]] },
        out: {
          success: { t: '{partner}가 손을 꼭 잡아 줬다. "우리는 우리의 방식으로 하자." 두려움이 조금 가라앉았다.', log: '결혼에 대한 두려움을 나눔', rel: { partner: 14 }, hp: 8, st: { mental: 2 } },
          partial: { t: '이해받긴 했지만 고민은 그대로다.', rel: { partner: 5 } },
          fail: { t: '말을 꺼내자마자 눈물이 났다. 오히려 어색한 분위기가 흘렀다.', rel: { partner: -4 }, hp: -4 }
        } },
      { id: 'avoid', label: '화제를 돌린다', intent: 'stability', out: { t: '말하지 않으면 사라질 줄 알았다. 그렇지 않았다.', rel: { partner: -5 }, sr: 6 } }
    ]
  });

  E.push({
    id: 'cb_kid_arts', cat: 'child', tier: 'choice', ages: [36, 60], w: 14, max: 1, icon: '🎻',
    if: p => has(p, 'kid_arts') && kids(p).some(c => c.age >= 11 && c.age <= 19),
    child: p => kids(p).filter(c => c.age >= 11 && c.age <= 19).sort((a, b) => (b.plan === 'arts') - (a.plan === 'arts'))[0],
    label: '자녀', title: '{child}의 콩쿠르',
    text: '예체능을 지원해 준 {child}가 처음으로 큰 대회에 나가게 되었다. 레슨비가 만만치 않은 시점이다.',
    choices: [
      { id: 'support', label: '무리해서라도 뒷바라지한다', intent: 'family',
        check: { base: 48, partial: 0.5, f: [['assets', 0.3], ['rel', 'child', 0.2]] },
        out: {
          success: { t: '{child}가 무대 위에서 환하게 웃었다. 입상 소식에 온 가족이 얼싸안았다.', log: '자녀의 콩쿠르 입상', money: -400, rel: { children: 14 }, hp: 14 },
          partial: { t: '입상은 못 했지만 {child}는 값진 경험을 했다고 한다.', money: -400, rel: { children: 8 }, hp: 5 },
          fail: { t: '긴장한 {child}가 실수를 했다. 안아 주며 괜찮다고 했다.', money: -400, rel: { children: 6 }, hp: -2 }
        } },
      { id: 'limit', label: '지원 한도를 정해 이야기한다', intent: 'stability', out: { t: '현실적인 이야기를 나눴다. {child}는 속상해했지만 이해했다.', rel: { children: -3 } } }
    ]
  });

  E.push({
    id: 'cb_biz_retry', cat: 'money', tier: 'choice', ages: [32, 56], w: 14, max: 1, dom: ['business'], icon: '♻️',
    if: p => has(p, 'business_failed') && !jobIs(p, 'selfemp', 'ceo'),
    label: '재기', title: '다시 한 번 장사',
    text: '실패한 가게의 간판을 내린 지 몇 해. 작은 점포 자리가 났다. 이번엔 다를 수 있을까.',
    choices: [
      { id: 'again', label: '신중하게 재도전한다', intent: 'risk', if: p => p.money + LG.Invest.total(p) >= 1500,
        check: { base: 40, partial: 0.5, f: [['talent', 'entrepreneur', 12], ['stat', 'mental', 0.3], ['assets', 0.3], ['flag', 'business_failed', 8, '실패에서 배운 교훈']] },
        out: {
          success: { t: '지난 실패를 거울 삼아 철저히 준비했다. 이번엔 단골이 빠르게 늘었다.', log: '실패를 딛고 재창업 성공', job: 'selfemp', money: -1500, flag: 'started_business', unflag: 'business_failed', queue: [{ id: 'w_business_check', in: 3 }], hp: 14, achv: 4 },
          partial: { t: '작게 다시 시작했다. 아직은 빠듯하지만 희망이 있다.', job: 'selfemp', jobOpt: { mul: 0.7 }, money: -1200, flag: 'started_business', unflag: 'business_failed', queue: [{ id: 'w_business_check', in: 2 }] },
          fail: { t: '또다시 문을 닫았다. 이번 실패는 더 아프다.', money: -1500, hp: -12, sr: 12 }
        } },
      { id: 'no', label: '더 이상 사업은 하지 않는다', intent: 'stability', out: { t: '월급쟁이의 안정이 이렇게 소중한 줄 몰랐다.', unflag: 'business_failed', hp: 2 } }
    ]
  });
})(window.LG = window.LG || {});
