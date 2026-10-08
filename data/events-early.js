/* 이벤트 — 유년기 · 청소년기 · 입시
   구조: { id, cat, tier, ages, milestone, w, cd, if, label, title, text, icon, choices:[{ id, label, intent, if, check:{base, f, partial}, out:{success, partial, fail} }] }
   새 이벤트는 이 배열에 push 하기만 하면 엔진이 자동으로 인식한다. */
(function (LG) {
  LG.DATA = LG.DATA || {};
  const E = LG.DATA.events = LG.DATA.events || [];

  // ── 공용 헬퍼 (다른 이벤트 파일에서도 LG.EH로 사용) ──
  const has = (p, f) => Object.prototype.hasOwnProperty.call(p.flags, f);
  const tal = (p, t) => p.talents.indexOf(t) >= 0;
  const found = (p, t) => p.found.indexOf(t) >= 0;
  const H = LG.EH = {
    has, tal, found,
    rel: (p, r) => LG.Rel.get(p, r),
    kids: p => LG.Rel.all(p, 'child'),
    single: p => !LG.Rel.get(p, 'partner') && !LG.Rel.get(p, 'spouse'),
    // 아직 발견하지 못한 재능 중 목록에 있는 것을 발견
    disc: (...ts) => p => {
      const t = ts.find(x => tal(p, x) && !found(p, x));
      if (!t) return '';
      p.found.push(t);
      return `✨ ${LG.DATA.talents[t].name}에 재능이 있다는 걸 알게 되었다.`;
    },
    friend: (rel, note) => p => { LG.Rel.addFriend(p, rel, note); return ''; },
    lover: o => p => { LG.Rel.makeLoveInterest(p, o); LG.State.flag(p, 'dating'); return ''; },
    seq: (...fns) => (p, ctx) => fns.map(f => f(p, ctx)).filter(x => typeof x === 'string' && x).join(' '),
    mulJob: m => p => { if (p.job) p.job.mul = Math.min(LG.Economy.maxMul(p.job.id), Math.round(p.job.mul * m * 1000) / 1000); return ''; },
    college: (years, kind) => p => { p.status = 'college'; p.college = { end: p.age + years, kind: kind || 'univ' }; if (LG.State.regionAttr(p, 'edu') < 70 && kind !== 'night') p.home = 'rent'; return ''; },
    tierDown: p => { p.family.tier = Math.max(1, p.family.tier - 1); return ''; },
    parentsDivorce: p => {
      const f = LG.Rel.get(p, 'father'), m = LG.Rel.get(p, 'mother');
      if (!f || !m) return '';
      const away = LG.RNG.chance(p, 0.7) ? f : m;
      away.rel = Math.max(10, away.rel - 25); away.support = Math.max(5, (away.support || 50) - 30); away.note = '따로 삶';
      p.family.tags = p.family.tags.filter(t => t !== 'conflict').concat('divorced_parents');
      p.family.tier = Math.max(1, p.family.tier - 1);
      LG.State.flag(p, 'parents_divorced');
      return '';
    },
    // 재능/노력 중 가장 강한 분야
    bestTalentFactor: p => {
      const t = p.talents.find(x => ['art', 'music', 'sport', 'math', 'writing', 'language'].indexOf(x) >= 0);
      return t ? { label: '타고난 재능', v: 20 } : null;
    }
  };
  const disc = H.disc, seq = H.seq;

  // ───────────────────────── 유년기 ─────────────────────────

  E.push({
    id: 'c_activity', cat: 'childhood', tier: 'major', ages: [8, 8], milestone: true, icon: '🎒',
    label: '어린 시절', title: '방과 후 시간',
    text: '학교가 끝났다. 친구들은 저마다 어디론가 흩어진다. 나는 무엇을 하며 시간을 보낼까?',
    choices: [
      { id: 'study', label: '학원에 다니며 공부한다', intent: 'education',
        check: { base: 52, partial: 0.5, f: [['family', 0.6], ['region', 'edu', 0.25], ['stat', 'intelligence', 0.25], ['support', 0.2]] },
        out: {
          success: { t: '공부하는 습관이 몸에 붙었다. 받아쓰기 100점을 받아 왔다.', log: '학원에 다니며 공부 습관을 들임', eff: { study: 32 }, st: { intelligence: 3 }, fn: disc('math', 'language', 'writing') },
          partial: { t: '학원은 다니지만 마음은 놀이터에 가 있다.', eff: { study: 16 }, sr: 6 },
          fail: { t: '학원비가 부담스러워 몇 달 만에 그만뒀다.', log: '형편 때문에 학원을 그만둠', eff: { study: 8 }, hp: -4 }
        } },
      { id: 'sport', label: '태권도·축구 교실에 다닌다', intent: 'health',
        check: { base: 62, partial: 0.5, f: [['stat', 'physical', 0.35], ['talent', 'sport', 14], ['family', 0.3]] },
        out: {
          success: { t: '땀 흘리는 게 즐겁다. 관장님이 소질이 있다고 하셨다.', log: '운동을 시작함', eff: { sport: 32 }, st: { physical: 5, health: 3 }, fn: disc('sport') },
          partial: { t: '친구들 따라 다니는 정도. 그래도 체력은 좋아졌다.', eff: { sport: 16 }, st: { health: 2 } },
          fail: { t: '첫날부터 넘어져 무릎이 까졌다. 운동은 나랑 안 맞나 보다.', eff: { sport: 6 }, hp: -3 }
        } },
      { id: 'art', label: '그림이나 피아노를 배운다', intent: 'hobby',
        check: { base: 55, partial: 0.5, f: [['stat', 'creativity', 0.35], ['talent', 'art', 12], ['talent', 'music', 12], ['family', 0.45], ['region', 'culture', 0.15]] },
        out: {
          success: { t: '시간 가는 줄 모르고 몰두했다. 학원 선생님이 대회에 나가 보자고 하셨다.', log: '그림·음악을 배우기 시작함', eff: { art: 32 }, st: { creativity: 5 }, fn: disc('art', 'music') },
          partial: { t: '재미는 있지만 연습은 늘 귀찮다.', eff: { art: 16 }, st: { creativity: 2 } },
          fail: { t: '레슨비가 만만치 않았다. 결국 집에서 혼자 끄적이게 됐다.', eff: { art: 8 } }
        } },
      { id: 'play', label: '동네 친구들과 실컷 논다', intent: 'social',
        out: { t: '해가 질 때까지 골목을 뛰어다녔다. 친구가 많아졌다.', log: '동네 친구들과 뛰어놀며 자람', st: { social: 5, physical: 2 }, hp: 8, eff: { social: 22 }, flag: 'played_outside', fn: seq(H.friend(72, '동네 친구'), disc('social', 'leadership')) } }
    ]
  });

  E.push({
    id: 'c_newkid', cat: 'friend', tier: 'choice', ages: [6, 11], w: 10, icon: '🧒',
    label: '친구', title: '전학 온 아이',
    text: '반에 전학 온 아이가 쉬는 시간마다 혼자 창밖만 보고 있다.',
    choices: [
      { id: 'talk', label: '먼저 말을 건다', intent: 'social',
        check: { base: 55, partial: 0.5, f: [['stat', 'social', 0.45], ['trait', 'introvert', -8]] },
        out: {
          success: { t: '"너 이 게임 알아?" 그날부터 우리는 단짝이 되었다.', log: '전학생과 단짝 친구가 됨', hp: 8, st: { social: 3 }, fn: H.friend(80, '어릴 적 단짝') },
          partial: { t: '어색하게 몇 마디 나눴다. 그래도 인사는 하는 사이가 됐다.', st: { social: 2 } },
          fail: { t: '말을 걸었지만 대답이 없었다. 조금 민망했다.', hp: -2, st: { mental: 2 } }
        } },
      { id: 'skip', label: '원래 친구들과 논다', intent: 'rest', out: { t: '평소처럼 친구들과 놀았다. 그 아이는 다음 학기에 또 전학을 갔다.', minor: true } }
    ]
  });

  E.push({
    id: 'c_talent', cat: 'childhood', tier: 'choice', ages: [9, 12], icon: '🌟',
    w: p => p.talents.some(t => !found(p, t)) ? 20 : 4,
    label: '발견', title: '선생님의 한마디',
    text: p => {
      const t = p.talents.find(x => !found(p, x));
      return (t ? LG.DATA.talents[t].hint + ' ' : '') + '담임 선생님이 이번 교내 대회에 나가 보라고 권하셨다.';
    },
    choices: [
      { id: 'go', label: '대회에 나가 본다', intent: 'education',
        check: { base: 32, partial: 0.5, f: [['fn', H.bestTalentFactor], ['eff', 'study', 0.2], ['eff', 'art', 0.2], ['eff', 'sport', 0.2], ['stat', 'mental', 0.2]] },
        out: {
          success: { t: '상을 받았다! 단상 위에서 다리가 후들거렸다.', log: '교내 대회 수상', achv: 3, hp: 10, st: { mental: 3 }, flag: 'child_award', fn: disc('art', 'music', 'sport', 'math', 'writing', 'language', 'leadership', 'mechanical', 'social', 'entrepreneur') },
          partial: { t: '입상은 못 했지만, 해 보니 재미있었다.', hp: 3, fn: disc('art', 'music', 'sport', 'math', 'writing', 'language', 'leadership', 'mechanical', 'social', 'entrepreneur') },
          fail: { t: '너무 긴장해서 준비한 걸 하나도 못 보여줬다.', hp: -5, st: { mental: 2 } }
        } },
      { id: 'no', label: '그냥 좋아하는 걸로 둔다', intent: 'hobby',
        out: { t: '상보다 즐거운 게 중요했다.', hp: 3, flag: 'hobby_kid', fn: disc('art', 'music', 'sport', 'math', 'writing', 'language', 'leadership', 'mechanical', 'social', 'entrepreneur') } }
    ]
  });

  E.push({
    id: 'c_bully', cat: 'social', tier: 'choice', ages: [10, 14], w: 8, icon: '🛑',
    label: '학교', title: '괴롭힘을 목격했다',
    text: '같은 반 아이가 몇몇에게 둘러싸여 놀림을 당하고 있다. 다들 못 본 척한다.',
    choices: [
      { id: 'stop', label: '직접 막아선다', intent: 'social',
        check: { base: 42, partial: 0.5, f: [['stat', 'physical', 0.25], ['stat', 'social', 0.25], ['stat', 'mental', 0.3]] },
        out: {
          success: { t: '"그만해." 아이들이 머쓱하게 물러났다. 그 친구와 가까워졌다.', log: '괴롭힘을 막아섬', st: { mental: 5 }, flag: 'stood_up', fn: H.friend(82, '지켜준 친구') },
          partial: { t: '말리다 같이 휘말렸지만 결국 선생님이 알게 되었다.', st: { mental: 3 }, hp: -3 },
          fail: { t: '이번엔 내가 표적이 되었다. 한동안 학교 가기가 싫었다.', log: '괴롭힘의 표적이 됨', hp: -12, sr: 15, flag: 'bullied', st: { mental: 2 } }
        } },
      { id: 'teacher', label: '선생님께 알린다', intent: 'stability',
        check: { base: 58, partial: 0.3, f: [['region', 'community', 0.2]] },
        out: {
          success: { t: '선생님이 조용히 해결해 주셨다.', hp: 2 },
          partial: { t: '잠깐 조용해졌지만 완전히 끝나진 않았다.' },
          fail: { t: '"고자질쟁이"라는 말이 돌았다.', st: { social: -3 }, hp: -4 }
        } },
      { id: 'ignore', label: '모른 척한다', intent: 'stability', out: { t: '못 본 척 지나쳤다. 그날 밤 마음이 계속 불편했다.', hp: -3, flag: 'looked_away' } }
    ]
  });

  E.push({
    id: 'c_pet', cat: 'family', tier: 'choice', ages: [6, 12], w: 6, icon: '🐶',
    label: '가족', title: '강아지를 키우고 싶어',
    text: '친구네 강아지를 보고 온 뒤로 머릿속이 강아지 생각뿐이다.',
    choices: [
      { id: 'beg', label: '부모님을 조른다', intent: 'family',
        check: { base: 38, partial: 0, f: [['family', 0.5], ['support', 0.35], ['fn', p => !p.urban ? { label: '마당 있는 집', v: 15 } : null]] },
        out: {
          success: { t: '강아지 "콩이"가 가족이 되었다. 매일 아침이 신난다.', log: '반려견 콩이가 가족이 됨', flag: 'pet', hp: 12, rel: { parents: 3 }, st: { mental: 2 } },
          fail: { t: '"누가 산책시킬 건데?" 안 된다는 대답만 돌아왔다.', hp: -4 }
        } },
      { id: 'no', label: '꾹 참는다', intent: 'stability', out: { t: '대신 강아지 인형을 끌어안고 잤다.', minor: true } }
    ]
  });

  E.push({
    id: 'c_parents_fight', cat: 'family', tier: 'major', ages: [6, 15], w: 16, icon: '🌧️',
    if: p => p.family.tags.indexOf('conflict') >= 0 && LG.Rel.get(p, 'father') && LG.Rel.get(p, 'mother'),
    label: '가족의 위기', title: '부모님의 다툼',
    text: '밤마다 거실에서 부모님의 목소리가 높아진다. 문틈으로 새어 드는 불빛이 무섭다.',
    choices: [
      { id: 'bridge', label: '부모님을 웃게 만들어 본다', intent: 'family',
        check: { base: 30, partial: 0.45, f: [['stat', 'social', 0.3], ['fn', p => ({ label: '부모님과의 관계', v: (LG.Rel.parents(p).reduce((a, n) => a + n.rel, 0) / Math.max(1, LG.Rel.parents(p).length) - 60) * 0.4 })]] },
        out: {
          success: { t: '서툰 편지와 재롱에 부모님이 다시 웃기 시작했다. 다툼이 줄었다.', log: '부모님 사이를 이어줌', rel: { parents: 6 }, fn: p => { p.family.tags = p.family.tags.filter(t => t !== 'conflict'); return ''; } },
          partial: { t: '잠깐은 조용해졌다. 하지만 공기는 여전히 차갑다.', sr: 8 },
          fail: { t: '결국 부모님은 따로 살기로 하셨다. 내 탓인 것만 같았다.', log: '부모님의 이혼', sr: 18, hp: -15, st: { mental: -2 }, fn: H.parentsDivorce }
        } },
      { id: 'hide', label: '이어폰을 끼고 방에 숨는다', intent: 'rest',
        out: { t: '음악 소리를 키웠다. 빨리 어른이 되고 싶었다.', st: { mental: 2 }, hp: -6, sr: 6 } }
    ]
  });

  E.push({
    id: 'c_president', cat: 'social', tier: 'choice', ages: [10, 12], w: 6, icon: '🗳️',
    label: '학교', title: '반장 선거',
    text: '반장 선거 날이다. 친구들이 나가 보라고 부추긴다.',
    choices: [
      { id: 'run', label: '반장 선거에 나간다', intent: 'social',
        check: { base: 34, partial: 0.5, f: [['stat', 'social', 0.45], ['talent', 'leadership', 15], ['trait', 'extrovert', 7]] },
        out: {
          success: { t: '반장이 되었다! 엄마가 피자를 쏘셨다.', log: '반장 당선', achv: 2, st: { social: 3 }, hp: 8, flag: 'class_pres', fn: disc('leadership') },
          partial: { t: '부반장이 되었다. 나쁘지 않다.', st: { social: 2 }, hp: 3 },
          fail: { t: '두 표 차이로 떨어졌다. 집에 와서 이불을 걷어찼다.', hp: -5, st: { mental: 2 } }
        } },
      { id: 'no', label: '나서지 않는다', intent: 'stability', out: { t: '조용히 박수를 쳤다.', minor: true } }
    ]
  });

  // ───────────────────────── 청소년기 ─────────────────────────

  E.push({
    id: 't_middle', cat: 'education', tier: 'major', ages: [13, 13], milestone: true, icon: '🏫',
    label: '청소년기', title: '중학생이 되었다',
    text: '새 교복, 새 친구들. 중학교 3년을 어디에 쏟을까?',
    choices: [
      { id: 'study', label: '공부에 집중한다', intent: 'education',
        check: { base: 50, partial: 0.5, f: [['stat', 'intelligence', 0.35], ['eduEnv', 0.3], ['eff', 'study', 0.25], ['stress', 0.2]] },
        out: {
          success: { t: '전교 등수가 눈에 띄게 올랐다. 공부하는 맛을 알았다.', log: '중학교 때 공부에 몰두함', eff: { study: 36 }, st: { intelligence: 3 }, flag: 'studied_hard', fn: disc('math', 'language') },
          partial: { t: '성적은 조금씩 오르는 중이다.', eff: { study: 22 } },
          fail: { t: '열심히 했는데 성적은 제자리다. 방법이 틀린 걸까.', eff: { study: 16 }, sr: 8 }
        } },
      { id: 'club', label: '운동부·동아리에 빠진다', intent: 'hobby',
        check: { base: 60, partial: 0.5, f: [['stat', 'physical', 0.2], ['stat', 'creativity', 0.2], ['stat', 'social', 0.15]] },
        out: {
          success: { t: '동아리방이 제2의 집이 됐다. 평생 갈 친구들을 만났다.', log: '동아리 활동에 빠짐', eff: { sport: 18, art: 18, social: 12 }, hp: 8, fn: seq(H.friend(70, '동아리 친구'), disc('sport', 'music', 'art', 'leadership', 'mechanical')) },
          partial: { t: '재미있지만 성적표를 보면 마음이 무겁다.', eff: { sport: 10, art: 10 }, hp: 4 },
          fail: { t: '선배들과 잘 맞지 않아 그만뒀다.', hp: -4 }
        } },
      { id: 'friends', label: '친구들과 어울려 논다', intent: 'social',
        out: { t: 'PC방, 노래방, 떡볶이집. 웃음이 끊이지 않던 시절.', log: '친구들과 어울려 놀던 중학 시절', st: { social: 5 }, hp: 8, eff: { social: 25, study: -8 }, fn: H.friend(68, '중학교 친구') } },
      { id: 'help', label: '집안일과 동생을 돌본다', intent: 'family', if: p => p.family.tier <= 2 || p.family.tags.indexOf('single_parent') >= 0 || p.family.tags.indexOf('big_family') >= 0,
        out: { t: '학교가 끝나면 장을 보고 저녁을 차렸다. 철이 일찍 들었다.', log: '집안일을 도우며 자람', rel: { parents: 10, siblings: 8 }, st: { mental: 5 }, eff: { work: 15, study: -5 }, flag: 'helped_family' } }
    ]
  });

  E.push({
    id: 't_exam', cat: 'education', tier: 'choice', ages: [13, 18], w: 8, cd: 3, icon: '📝',
    if: p => p.status === 'student',
    label: '시험', title: '시험 전날 밤',
    text: '내일은 중요한 시험이다. 아직 범위의 절반도 못 봤다.',
    choices: [
      { id: 'cram', label: '밤을 새운다', intent: 'education',
        check: { base: 45, partial: 0.5, f: [['stat', 'intelligence', 0.4], ['eff', 'study', 0.3], ['stat', 'health', 0.15]] },
        out: {
          success: { t: '벼락치기가 통했다! 예상보다 좋은 점수.', st: { intelligence: 1 }, hp: 5, eff: { study: 6 } },
          partial: { t: '평균은 했다. 다신 이러지 말자고 다짐했다.', sr: 4 },
          fail: { t: '시험 중에 꾸벅꾸벅 졸았다.', hp: -6, sr: 6 }
        } },
      { id: 'steady', label: '하던 만큼만 하고 잔다', intent: 'health',
        check: { base: 50, partial: 0.5, f: [['eff', 'study', 0.55], ['stat', 'intelligence', 0.25]] },
        out: {
          success: { t: '평소에 해 둔 게 빛을 봤다.', hp: 6, eff: { study: 8 } },
          partial: { t: '그럭저럭. 컨디션은 좋았다.', hp: 2 },
          fail: { t: '평소 준비가 부족했다는 걸 깨달았다.', hp: -4, eff: { study: 6 } }
        } },
      { id: 'game', label: '포기하고 게임한다', intent: 'rest', out: { t: '모르겠다. 내일의 나에게 맡긴다.', hp: 4, eff: { study: -8 }, flag: 'gave_up_once' } }
    ]
  });

  E.push({
    id: 't_parttime', cat: 'money', tier: 'choice', ages: [15, 18], w: p => p.family.tier <= 2 ? 12 : 5, icon: '🏪',
    if: p => p.status === 'student' && !has(p, 'teen_job'),
    label: '아르바이트', title: '아르바이트 제안',
    text: '동네 편의점 사장님이 주말 아르바이트를 해 보지 않겠냐고 한다.',
    choices: [
      { id: 'work', label: '해 본다', intent: 'money',
        check: { base: 66, partial: 0, f: [['stat', 'social', 0.2], ['ageUnder', 16, 8]] },
        out: {
          success: { t: '첫 월급으로 부모님께 내복을 사 드렸다.', log: '첫 아르바이트', money: 250, eff: { work: 22, study: -8 }, flag: ['teen_job', 'worked_teen'], st: { social: 2 }, rel: { parents: 4 } },
          fail: { t: '실수가 잦다는 이유로 일주일 만에 잘렸다.', hp: -4, st: { mental: 2 } }
        } },
      { id: 'study', label: '공부에 집중한다', intent: 'education', out: { t: '지금은 공부할 때라고 생각했다.', eff: { study: 10 } } }
    ]
  });

  E.push({
    id: 't_crush', cat: 'relationship', tier: 'choice', ages: [14, 18], w: 9, icon: '💌',
    if: p => !has(p, 'first_love'),
    label: '첫사랑', title: '자꾸 눈이 간다',
    text: '같은 반 그 아이에게 자꾸 눈이 간다. 이 마음을 전해야 할까?',
    choices: [
      { id: 'confess', label: '고백한다', intent: 'love',
        check: { base: 35, partial: 0.5, f: [['stat', 'social', 0.4], ['trait', 'extrovert', 6], ['stat', 'creativity', 0.1]] },
        out: {
          success: { t: '그 아이도 같은 마음이었다! 풋풋한 첫 연애가 시작됐다.', log: '첫사랑과 사귐', hp: 14, flag: 'first_love', fn: p => { const n = LG.Rel.makeLoveInterest(p, { role: 'ex' }); n.note = '첫사랑'; return ''; } },
          partial: { t: '"우리 그냥 친구로 지내자." 그래도 어색해지진 않았다.', hp: -2, flag: 'first_love', fn: H.friend(60, '친구로 남은 첫사랑') },
          fail: { t: '거절당했다. 다음 날 학교 가는 길이 천리 같았다.', log: '첫 고백, 거절', hp: -10, st: { mental: 3 }, flag: 'first_love' }
        } },
      { id: 'keep', label: '마음속에만 간직한다', intent: 'stability', out: { t: '말하지 못한 마음은 오래도록 남았다.', flag: ['first_love', 'unspoken_love'], hp: -2 } }
    ]
  });

  E.push({
    id: 't_highschool', cat: 'education', tier: 'major', ages: [15, 15], milestone: true, icon: '🧭',
    label: '진로', title: '어떤 고등학교에 갈까',
    text: '중3 겨울. 담임 선생님과 진로 상담을 했다. 어떤 고등학교로 갈지 정해야 한다.',
    choices: [
      { id: 'academic', label: '인문계 고등학교 (대학 준비)', intent: 'education',
        out: { t: '대입을 향한 3년이 시작된다.', track: 'academic', log: '인문계 고등학교 진학 결정' } },
      { id: 'vocational', label: '특성화고 (기술·취업)', intent: 'career',
        out: { t: '빨리 기술을 배워 사회에 나가기로 했다.', track: 'vocational', flag: 'vocational', eff: { work: 20 }, log: '특성화고 진학 결정', fn: disc('mechanical') } },
      { id: 'arts', label: '예술고 입시에 도전한다', intent: 'hobby', if: p => p.stats.creativity >= 55 || found(p, 'art') || found(p, 'music') || p.effort.art >= 15,
        check: { base: 30, partial: 0, f: [['stat', 'creativity', 0.45], ['eff', 'art', 0.5], ['talent', 'art', 12], ['talent', 'music', 12], ['family', 0.6], ['region', 'culture', 0.2]] },
        out: {
          success: { t: '실기 시험에 합격했다! 예술고 교복을 입게 됐다.', track: 'arts', flag: 'arts_hs', achv: 3, hp: 10, log: '예술고 합격' },
          fail: { t: '실기에서 떨어졌다. 일반고에 진학한다.', track: 'academic', hp: -8, log: '예술고 낙방' }
        } },
      { id: 'sports', label: '체육 특기생에 도전한다', intent: 'adventure', if: p => p.stats.physical >= 60 || found(p, 'sport') || p.effort.sport >= 15,
        check: { base: 30, partial: 0, f: [['stat', 'physical', 0.55], ['eff', 'sport', 0.5], ['talent', 'sport', 15]] },
        out: {
          success: { t: '체육 특기생으로 선발됐다. 새벽 훈련이 시작된다.', track: 'sports', flag: 'sports_hs', eff: { sport: 20 }, log: '체육 특기생 선발' },
          fail: { t: '선발전에서 떨어졌다. 일반고에 진학한다.', track: 'academic', hp: -8 }
        } }
    ]
  });

  E.push({
    id: 't_scout', cat: 'opportunity', tier: 'major', ages: [16, 18], w: 30, icon: '🏟️', max: 1,
    if: p => p.track === 'sports' || (found(p, 'sport') && p.effort.sport >= 20),
    label: '기회', title: '스카우트 제의',
    text: '실업팀 코치가 경기를 보러 왔다. 진지하게 선수의 길을 생각해 보라고 한다.',
    choices: [
      { id: 'go', label: '선수의 길을 걷는다', intent: 'adventure',
        check: { base: 30, partial: 0.5, f: [['stat', 'physical', 0.5], ['eff', 'sport', 0.45], ['talent', 'sport', 18], ['health', 0.3]] },
        out: {
          success: { t: '본격적인 선수 생활이 시작됐다. 꿈에 한 발 다가섰다.', log: '선수의 길을 선택', flag: 'athlete_path', eff: { sport: 30 }, st: { physical: 4 } },
          partial: { t: '2군에서 시작한다. 갈 길이 멀다.', flag: 'athlete_path', eff: { sport: 20 } },
          fail: { t: '훈련 중 무릎을 다쳤다. 꿈을 잠시 내려놓았다.', log: '부상으로 선수의 꿈을 접음', st: { health: -6 }, hp: -10, flag: 'sports_injury' }
        } },
      { id: 'both', label: '공부와 병행한다', intent: 'stability', out: { t: '운동은 취미로, 공부는 본업으로.', eff: { sport: 8, study: 10 } } }
    ]
  });

  E.push({
    id: 't_stress', cat: 'health', tier: 'choice', ages: [16, 18], w: p => 4 + Math.max(0, p.stress - 35) / 2, icon: '😮‍💨',
    if: p => p.track !== 'vocational' && p.status === 'student',
    label: '마음', title: '입시 스트레스',
    text: '밤 12시, 독서실. 문제집을 펼쳤는데 숨이 턱 막힌다.',
    choices: [
      { id: 'rest', label: '잠시 쉬어 간다', intent: 'health', out: { t: '한강에서 바람을 쐬었다. 조금 숨이 쉬어졌다.', sr: -20, hp: 6, eff: { study: -6 } } },
      { id: 'push', label: '이를 악물고 버틴다', intent: 'education',
        check: { base: 48, partial: 0.4, f: [['stat', 'mental', 0.45], ['health', 0.2]] },
        out: {
          success: { t: '버텨냈다. 성적이 오르기 시작했다.', log: '입시를 악착같이 버팀', eff: { study: 26 }, flag: 'studied_hard', st: { intelligence: 2 }, sr: 5 },
          partial: { t: '버티긴 했다. 웃음이 줄었다.', eff: { study: 14 }, sr: 8, hp: -4 },
          fail: { t: '몸이 먼저 무너졌다. 2주를 앓아누웠다.', st: { health: -6 }, sr: 10, eff: { study: 4 } }
        } },
      { id: 'talk', label: '부모님께 털어놓는다', intent: 'family',
        check: { base: 50, partial: 0, f: [['support', 0.55]] },
        out: {
          success: { t: '"괜찮다, 네 인생이다." 그 한마디에 울컥했다.', sr: -16, rel: { parents: 8 } },
          fail: { t: '"다들 그렇게 해." 더는 말하지 않기로 했다.', sr: 5, rel: { parents: -7 } }
        } }
    ]
  });

  E.push({
    id: 't_family_crisis', cat: 'crisis', tier: 'major', ages: [12, 18], icon: '📉', max: 1,
    w: p => p.family.tags.indexOf('job_risk') >= 0 ? 20 : p.family.tier <= 3 ? 3 : 1,
    if: p => LG.Rel.parents(p).some(n => n.job && n.job !== 'homemaker' && n.role !== 'grandparent'),
    label: '가족의 위기', title: '{parent}의 실직',
    text: '다니던 회사가 어려워져 갑자기 일을 그만두게 되셨다. 집안 공기가 무겁다. 당신의 선택과 관계없이 찾아온 일이다.',
    choices: [
      { id: 'help', label: '아르바이트로 집을 돕는다', intent: 'family',
        out: { t: '방과 후엔 일을 했다. 일찍 어른이 된 기분이다.', log: '부모님 실직, 아르바이트로 집을 도움', rel: { parents: 12 }, eff: { work: 22, study: -12 }, flag: ['helped_family', 'worked_teen', 'teen_job'], st: { mental: 4 }, fn: H.tierDown } },
      { id: 'study', label: '더 열심히 공부해서 보답한다', intent: 'education',
        check: { base: 45, partial: 0.4, f: [['stat', 'mental', 0.4], ['stat', 'intelligence', 0.3]] },
        out: {
          success: { t: '이를 악물었다. 성적이 오히려 올랐다.', log: '어려운 형편 속 공부에 매달림', eff: { study: 26 }, flag: 'studied_hard', fn: H.tierDown },
          partial: { t: '집중이 잘 안 됐지만 버텼다.', eff: { study: 12 }, sr: 8, fn: H.tierDown },
          fail: { t: '걱정에 공부가 손에 잡히지 않았다. 성적이 떨어졌다.', sr: 12, eff: { study: -6 }, fn: H.tierDown }
        } }
    ]
  });

  E.push({
    id: 't_game', cat: 'hobby', tier: 'choice', ages: [12, 17], w: 6, icon: '🎮', max: 1,
    label: '취미', title: '"한 판만 더"',
    text: '새벽 3시. 게임 랭킹이 오르는 게 공부보다 훨씬 재미있다.',
    choices: [
      { id: 'quit', label: '마음을 다잡고 끊는다', intent: 'education',
        check: { base: 45, partial: 0, f: [['stat', 'mental', 0.45], ['trait', 'impulsive', -10], ['support', 0.2]] },
        out: { success: { t: '계정을 지웠다. 시간이 두 배로 늘어난 것 같다.', eff: { study: 12 }, st: { mental: 2 } }, fail: { t: '삭제한 게임을 다시 깔았다.', eff: { study: -10 } } } },
      { id: 'pro', label: '프로게이머를 꿈꾼다', intent: 'adventure',
        check: { base: 8, partial: 0.5, max: 35, f: [['stat', 'intelligence', 0.15], ['stat', 'physical', 0.1], ['stat', 'mental', 0.15]] },
        out: {
          success: { t: '서버 랭킹 10위 안에 들었다. 방송 제안까지 왔다.', log: '게임 랭커가 됨', flag: 'gamer_dream', hp: 10, eff: { study: -15 } },
          partial: { t: '꽤 잘하지만, 프로의 벽은 높다는 걸 알았다.', eff: { study: -10 } },
          fail: { t: '현실의 벽은 높았다. 시간만 흘렀다.', eff: { study: -15 }, sr: 6 }
        } },
      { id: 'enjoy', label: '적당히 즐긴다', intent: 'rest', out: { t: '주말에만 하기로 했다. 그럭저럭 지켜졌다.', hp: 4 } }
    ]
  });

  // ───────────────────────── 졸업과 입시 ─────────────────────────

  E.push({
    id: 't_csat', cat: 'education', tier: 'major', ages: [19, 19], milestone: true, prio: 10, icon: '🎓',
    if: p => p.edu === 'high' && p.status === 'student',
    label: '인생의 갈림길', title: '고등학교 졸업',
    text: p => p.track === 'vocational' ? '졸업장을 받았다. 친구들은 취업을 하거나 대학에 간다. 나는?' : '수능이 끝났다. 성적표를 받아 든 손이 떨린다. 이제 어디로 갈 것인가?',
    wait: '합격자 발표를 기다리는 중',
    choices: [
      { id: 'univ', label: '대학에 진학한다', intent: 'education',
        check: { base: 40, partial: 0.5, f: [
          ['stat', 'intelligence', 0.42], ['eff', 'study', 0.3], ['flag', 'studied_hard', 10, '학창 시절의 노력'], ['eduEnv', 0.35],
          ['family', 0.45], ['support', 0.15], ['stress', 0.15], ['flag', 'vocational', -12, '특성화고 교육과정'], ['flag', 'helped_family', -4, '집안일로 줄어든 공부 시간']] },
        out: {
          success: { t: '원하던 대학에 합격했다! 합격 문자를 몇 번이고 다시 봤다.', log: '대학 합격', hp: 12, achv: 4, flag: 'college', fn: H.college(4), next: 'u_major' },
          partial: { t: '원하던 곳은 아니지만, 대학에 붙었다.', log: '대학 진학 (목표보다 낮은 학교)', hp: 3, achv: 2, flag: ['college', 'lower_college'], fn: H.college(4), next: 'u_major' },
          fail: { t: p => p.family.tier <= 2 ? '성적도, 형편도 따라주지 않았다. 불합격 통지를 받았다.' : '불합격. 모든 게 끝난 것만 같았다.', log: '대학 진학 실패', hp: -12, sr: 12, flag: 'college_failed', status: 'seeking', next: 'u_after_fail' }
        } },
      { id: 'work', label: '바로 취업한다', intent: 'career',
        out: { t: '남들보다 먼저 사회에 나가기로 했다.', log: '대학 대신 사회로', status: 'seeking', flag: 'no_college', next: 'w_first_job' } },
      { id: 'retake', label: '1년 더 준비한다 (재수)', intent: 'education', if: p => p.track !== 'vocational',
        out: { t: '한 해만 더. 독서실 생활이 다시 시작됐다.', log: '재수 결심', status: 'retake', eff: { study: 22 }, sr: 10, queue: [{ id: 't_retry', in: 1 }] } },
      { id: 'pro', label: '프로 입단에 도전한다', intent: 'adventure', if: p => has(p, 'athlete_path'),
        check: { base: 35, partial: 0, f: [['stat', 'physical', 0.55], ['eff', 'sport', 0.4], ['talent', 'sport', 15], ['health', 0.2]] },
        out: {
          success: { t: '드래프트에서 이름이 불렸다! 프로 선수가 되었다.', log: '프로 선수 입단', job: 'athlete', achv: 10, hp: 15, flag: 'dream_job' },
          fail: { t: '드래프트에서 끝내 이름이 불리지 않았다.', log: '프로 입단 실패', hp: -14, status: 'seeking', next: 'u_after_fail' }
        } },
      { id: 'arts', label: '예술대학에 도전한다', intent: 'hobby', if: p => p.track === 'arts' || p.effort.art >= 25,
        check: { base: 38, partial: 0, f: [['stat', 'creativity', 0.45], ['eff', 'art', 0.4], ['talent', 'art', 10], ['talent', 'music', 10], ['family', 0.4]] },
        out: {
          success: { t: '예술대학에 합격했다! 작업실 냄새가 좋다.', log: '예술대학 합격', major: 'arts', flag: 'college', achv: 4, hp: 12, fn: H.college(4) },
          fail: { t: '실기에서 떨어졌다.', log: '예술대학 낙방', hp: -10, status: 'seeking', next: 'u_after_fail' }
        } }
    ]
  });

  E.push({
    id: 'u_after_fail', cat: 'education', tier: 'major', queued: true, icon: '🚪',
    label: '다음 걸음', title: '다른 길',
    text: '계획대로 되지 않았다. 하지만 인생이 끝난 건 아니다. 이제 어떻게 할까?',
    choices: [
      { id: 'retake', label: '재수한다', intent: 'education', if: p => p.family.tier >= 2 && LG.State.supportScore(p) >= 40 && !has(p, 'athlete_path'),
        out: { t: '다시 한 번. 이번엔 다를 것이다.', log: '재수 결심', status: 'retake', eff: { study: 22 }, sr: 8, queue: [{ id: 't_retry', in: 1 }] } },
      { id: 'skill', label: '직업학교에서 기술을 배운다', intent: 'career',
        check: { base: 58, partial: 0, f: [['stat', 'creativity', 0.15], ['talent', 'mechanical', 15], ['eff', 'work', 0.2]] },
        out: {
          success: { t: '1년간 기술을 배워 자격증을 땄다.', log: '기술 자격증 취득', flag: ['certified', 'no_college'], eff: { work: 25 }, status: 'seeking', next: 'w_first_job', fn: disc('mechanical') },
          fail: { t: '적성에 맞지 않았다. 일단 일부터 구하기로 했다.', flag: 'no_college', status: 'seeking', next: 'w_first_job' }
        } },
      { id: 'work', label: '바로 일을 시작한다', intent: 'career',
        out: { t: '돈을 벌면서 길을 찾기로 했다.', log: '일을 시작하기로 함', flag: 'no_college', status: 'seeking', next: 'w_first_job' } }
    ]
  });

  E.push({
    id: 't_retry', cat: 'education', tier: 'auto', queued: true, icon: '📮',
    check: { base: 42, f: [['stat', 'intelligence', 0.42], ['eff', 'study', 0.35], ['stat', 'mental', 0.25], ['family', 0.3]] },
    out: {
      success: { t: '재수 끝에 대학에 합격했다! 1년이 헛되지 않았다.', log: '재수 끝에 대학 합격', major: true, hp: 16, achv: 4, flag: ['college', 'retake_success'], fn: H.college(4), next: 'u_major' },
      fail: { t: '또 떨어졌다. 대학은 내 길이 아닌가 보다.', log: '재수 실패', major: true, hp: -12, flag: 'no_college', status: 'seeking', next: 'w_first_job' }
    }
  });

  E.push({
    id: 'u_major', cat: 'education', tier: 'major', queued: true, icon: '📚',
    label: '대학', title: '전공 선택',
    text: '어떤 공부를 할까? 이 선택이 첫 직장의 문을 결정할지도 모른다.',
    choices: [
      { id: 'it', label: '공학·컴퓨터', intent: 'career', out: { t: '코드와 수식의 세계로.', major: 'it', log: '공학·컴퓨터 전공', fn: disc('math', 'mechanical') } },
      { id: 'biz', label: '경영·인문사회', intent: 'social', out: { t: '사람과 사회를 공부하기로 했다.', major: 'biz', log: '경영·인문사회 전공', fn: disc('language', 'writing', 'leadership', 'entrepreneur') } },
      { id: 'med', label: '의대·간호대에 도전', intent: 'career',
        check: { base: 10, partial: 0.6, max: 70, f: [['stat', 'intelligence', 0.65], ['eff', 'study', 0.4], ['flag', 'studied_hard', 10, '학창 시절의 노력'], ['eduEnv', 0.3], ['flag', 'lower_college', -15, '입시 결과']] },
        out: {
          success: { t: '의대에 합격했다! 길고 긴 공부가 시작된다.', log: '의대 진학', major: 'med', achv: 8, hp: 10, fn: H.college(8, 'med') },
          partial: { t: '의대는 못 갔지만 간호학과에 들어갔다.', log: '간호학과 진학', major: 'nursing' },
          fail: { t: '의대의 벽은 높았다. 생명과학과로 진학했다.', log: '자연과학 전공', major: 'sci', hp: -4 }
        } },
      { id: 'edu', label: '교대·사범대에 도전', intent: 'stability',
        check: { base: 40, partial: 0, f: [['stat', 'intelligence', 0.4], ['eff', 'study', 0.3]] },
        out: {
          success: { t: '선생님이 되는 길에 들어섰다.', log: '사범대 진학', major: 'edu' },
          fail: { t: '교대는 떨어졌다. 인문대에 진학했다.', major: 'biz', hp: -3 }
        } },
      { id: 'arts', label: '예술·디자인', intent: 'hobby',
        check: { base: 48, partial: 0, f: [['stat', 'creativity', 0.4], ['eff', 'art', 0.3], ['talent', 'art', 10], ['talent', 'music', 10]] },
        out: {
          success: { t: '실기 전형에 붙었다. 하고 싶은 걸 공부한다.', log: '예술·디자인 전공', major: 'arts', fn: disc('art', 'music') },
          fail: { t: '실기 전형에서 떨어져 경영학과로 진학했다.', major: 'biz' }
        } }
    ]
  });
})(window.LG = window.LG || {});
