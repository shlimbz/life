/* 이벤트 — 분야별 삶의 길 ①  미술·디자인 / 음악 / 글
   어린 시절 → 청소년 → 청년 → 중년 → 노년까지, 지금껏 걸어온 길(재능 · 노력 · 진로 · 과거의 선택)에 따라
   같은 분야의 이야기가 이어진다. dom 태그가 달려 있어 해당 성향이 높을수록 더 자주 나온다. */
(function (LG) {
  const E = LG.DATA.events;
  const H = LG.EH, has = H.has, disc = H.disc;
  const A = (p, d) => LG.Aff.get(p, d);
  const jobIs = (p, ...ids) => !!p.job && ids.indexOf(p.job.id) >= 0;
  const S = () => LG.State;
  const ch = o => E.push(Object.assign({ tier: 'choice', w: 12, max: 1 }, o));
  const money = p => p.money + (p.inv ? LG.Invest.total(p) : 0);

  // ═════════════════════════ 미술 · 디자인 ═════════════════════════

  ch({
    id: 'ar_kid_drawing', cat: 'art', ages: [7, 12], dom: ['art'], icon: '🖍️', label: '미술',
    if: p => A(p, 'art') >= 16 || has(p, 'kid_art'),
    title: '벽을 가득 채운 그림', text: '공책마다, 심지어 집 벽지에도 그림이 가득하다. 선생님이 "이 아이는 그림에 소질이 있어요"라고 하셨다고 {parent}가 전해 주었다.',
    choices: [
      { id: 'academy', label: '미술학원에 다니게 해 달라고 한다', intent: 'hobby',
        check: { base: 54, partial: 0.4, f: [['family', 0.5], ['support', 0.3], ['talent', 'art', 8]] },
        out: {
          success: { t: '작은 미술학원에서 색과 선을 제대로 배우기 시작했다. 매주 그림이 늘었다.', log: '미술학원에 다니기 시작', flag: 'art_academy', eff: { art: 14 }, st: { creativity: 3 }, hp: 8, fn: disc('art') },
          partial: { t: '형편이 빠듯해 한 학기만 다녔다. 그래도 배운 게 남았다.', eff: { art: 6 }, hp: 3 },
          fail: { t: '"그림으로 먹고살 수 있겠니?" 학원은 보내 주지 않았다.', hp: -4 }
        } },
      { id: 'self', label: '집에서 혼자 계속 그린다', intent: 'independence', out: { t: '스케치북이 한 권, 두 권 쌓여 간다. 그림은 나만의 세계다.', eff: { art: 8 }, hp: 4, fn: disc('art') } },
      { id: 'skip', label: '친구들이랑 노는 게 더 좋다', intent: 'social', out: { t: '그림은 취미로 남기기로 했다.', hp: 2 } }
    ]
  });

  ch({
    id: 'ar_portfolio', cat: 'art', ages: [16, 19], dom: ['art'], icon: '📐', label: '미술',
    if: p => p.track === 'arts' || has(p, 'arts_hs') || (A(p, 'art') >= 34 && p.track === 'academic'),
    title: '포트폴리오와 입시', text: '입시 철이다. 실기 학원 선생님은 "지금부터가 진짜"라고 하신다. 석고 데생과 포트폴리오가 방 안을 가득 채웠다.',
    choices: [
      { id: 'all', label: '실기에 모든 걸 건다', intent: 'adventure',
        check: { base: 36, partial: 0.5, f: [['stat', 'creativity', 0.4], ['eff', 'art', 0.4], ['talent', 'art', 14], ['family', 0.2]] },
        out: {
          success: { t: '포트폴리오가 교수님의 눈에 들었다. 꿈에 그리던 미대에 합격했다!', log: '미술 실기로 대학 합격', flag: ['art_portfolio', 'art_admit'], st: { creativity: 4 }, achv: 4, hp: 14 },
          partial: { t: '원하는 학교는 아니지만 디자인 계열에 합격했다.', log: '디자인 계열 합격', flag: 'art_portfolio', hp: 5 },
          fail: { t: '실기에서 아쉽게 낙방했다. 재수를 해야 할지 고민이다.', flag: 'art_portfolio', hp: -12, sr: 14 }
        } },
      { id: 'both', label: '디자인·시각 계열 학과를 넓게 지원한다', intent: 'stability', out: { t: '미대만 고집하지 않고 시각디자인·영상 등을 폭넓게 노렸다.', flag: 'art_portfolio', eff: { art: 6 }, hp: 3 } },
      { id: 'drop', label: '입시 미술은 접고 일반 대입으로 돌린다', intent: 'education', out: { t: '그림은 취미로. 책상 앞에 앉는 시간이 늘었다.', eff: { study: 8 }, hp: -3 } }
    ]
  });

  ch({
    id: 'ar_internship', cat: 'art', ages: [21, 28], dom: ['art'], icon: '🎞️', label: '미술',
    if: p => A(p, 'art') >= 34 && (p.major === 'arts' || has(p, 'art_portfolio') || jobIs(p, 'designer', 'artist')),
    title: '열정페이 제안', text: '유명 디자인 스튜디오에서 인턴을 구한단다. "경력에 큰 도움이 될 거예요. 대신 급여는 교통비 정도예요."',
    choices: [
      { id: 'take', label: '배운다는 마음으로 합류한다', intent: 'career',
        check: { base: 55, partial: 0.5, f: [['stat', 'creativity', 0.3], ['eff', 'art', 0.3], ['trait', 'competitive', 3]] },
        out: {
          success: { t: '밤샘 작업 끝에 내 작업물이 실제 프로젝트에 쓰였다. 포트폴리오가 확 두꺼워졌다.', log: '스튜디오 인턴으로 실력 인정', flag: 'studio_intern', eff: { art: 14 }, st: { creativity: 3 }, hp: 8, sr: 8, money: -100 },
          partial: { t: '허드렛일이 많았지만 현장의 감각은 얻었다.', eff: { art: 6 }, sr: 10, money: -100 },
          fail: { t: '밤샘과 무시에 지쳐 중도에 나왔다. 자존감만 깎였다.', hp: -8, sr: 14, money: -100 }
        } },
      { id: 'pay', label: '제대로 된 급여를 주는 곳을 찾는다', intent: 'stability', out: { t: '일을 하며 돈을 버는 쪽을 택했다. 작업은 퇴근 후에 이어 간다.', eff: { work: 6 }, hp: 2 } }
    ]
  });

  ch({
    id: 'ar_client', cat: 'art', ages: [27, 52], dom: ['art'], icon: '🧑‍🎨', label: '미술', w: 14, cd: 8, max: 2,
    if: p => jobIs(p, 'designer', 'artist', 'freelancer', 'creator') && A(p, 'art') >= 25,
    title: '"조금만 더 화사하게요"', text: '클라이언트가 열 번째 수정을 요청했다. "처음 시안이 더 좋았는데 다시 돌려주세요." 계약서에 수정 횟수 제한은 없다.',
    choices: [
      { id: 'hold', label: '작업의 가치를 설명하고 단가를 다시 협상한다', intent: 'career',
        check: { base: 46, partial: 0.5, f: [['stat', 'social', 0.25], ['perf', 0.2], ['stat', 'creativity', 0.2]] },
        out: {
          success: { t: '단호하지만 정중하게 선을 그었다. 클라이언트도 존중해 주었고 단가가 올랐다.', log: '작업 단가를 지켜 냄', money: 300, perf: 4, hp: 6 },
          partial: { t: '절충안으로 마무리했다. 서로 조금씩 양보했다.', money: 100, hp: 1 },
          fail: { t: '관계가 틀어지고 일이 끊겼다. 다음 달이 막막하다.', money: -200, hp: -8, sr: 12 }
        } },
      { id: 'give', label: '시키는 대로 계속 고친다', intent: 'stability', out: { t: '결국 마음에 안 드는 결과물이 나왔다. 이름을 걸기가 부끄럽다.', hp: -6, sr: 12, perf: -4 } },
      { id: 'own', label: '내 이름의 작업(굿즈·전시)을 시작한다', intent: 'adventure',
        check: { base: 32, partial: 0.5, f: [['stat', 'creativity', 0.35], ['flag', 'online_shop', 8, '온라인 판매 경험'], ['assets', 0.15]] },
        out: {
          success: { t: '내 이름을 건 작업이 팬을 만들었다. 의뢰보다 즐겁고 수입도 나쁘지 않다.', log: '자기 작업으로 독립', flag: 'own_work', money: 400, hp: 12, perf: 4 },
          partial: { t: '아직 큰돈은 안 되지만 팬이 한두 명씩 생겨난다.', flag: 'own_work', hp: 5 },
          fail: { t: '재고만 쌓였다. 의뢰로 돌아와야 했다.', money: -400, hp: -6 }
        } }
    ]
  });

  ch({
    id: 'ar_late_studio', cat: 'art', ages: [52, 76], dom: ['art'], icon: '🏺', label: '미술',
    if: p => A(p, 'art') >= 28 || has(p, 'kid_art') || has(p, 'exhibited'),
    title: '접어 둔 붓', text: p => '퇴직 후 시간이 생겼다. 서랍 속에는 ' + (has(p, 'exhibited') ? '예전 전시 도록' : '먼지 쌓인 스케치북') + '이 그대로 있다. 동네 문화센터에 회화반이 새로 열린다고 한다.',
    choices: [
      { id: 'class', label: '다시 붓을 잡고 수업을 듣는다', intent: 'hobby',
        out: { t: '수업에서 새 친구들을 사귀었다. 서툰 그림에도 박수를 받았다. 요즘 가장 설레는 시간이다.', log: '노년에 다시 그림을 시작', flag: 'late_artist', hp: 12, sr: -6, st: { mental: 2 }, money: -50, rel: { friends: 3 } } },
      { id: 'show', label: '작은 전시회를 열어 본다', intent: 'adventure', if: p => A(p, 'art') >= 40,
        check: { base: 56, partial: 0.4, f: [['stat', 'creativity', 0.2], ['region', 'community', 0.2]] },
        out: {
          success: { t: '동네 카페 벽에 건 그림들이 사람들의 발길을 붙잡았다. 가족이 모두 와 주었다.', log: '노년의 첫 개인전', hp: 14, achv: 3, rel: { family: 5 } },
          partial: { t: '조촐했지만 마음은 꽉 찼다.', hp: 6 },
          fail: { t: '찾는 사람이 없어 조금 쓸쓸했다. 그래도 그림은 좋다.', hp: -2 }
        } },
      { id: 'rest', label: '그냥 쉬는 게 좋다', intent: 'rest', out: { t: '붓 대신 낮잠을 택했다.', hp: 2 } }
    ]
  });

  // ═════════════════════════ 음악 ═════════════════════════

  ch({
    id: 'mu_lessons', cat: 'music', ages: [6, 12], dom: ['music'], icon: '🎹', label: '음악',
    if: p => A(p, 'music') >= 15 || has(p, 'kid_art'),
    title: '건반 위의 손가락', text: '친구네 집에서 피아노를 처음 쳐 봤는데 도(C)음이 이렇게 예쁜 줄 몰랐다. 집에 오자마자 책상 위에서 손가락으로 건반을 치고 있다.',
    choices: [
      { id: 'learn', label: '피아노·악기를 배우고 싶다고 말한다', intent: 'hobby',
        check: { base: 52, partial: 0.4, f: [['family', 0.45], ['support', 0.3], ['talent', 'music', 8]] },
        out: {
          success: { t: '작은 학원에 다니기 시작했다. 한 곡 한 곡 완성할 때마다 가슴이 부풀었다.', log: '악기를 배우기 시작', flag: 'music_lessons', eff: { art: 12 }, st: { creativity: 2 }, hp: 8, fn: disc('music') },
          partial: { t: '중고 키보드로 독학을 시작했다. 느리지만 즐겁다.', flag: 'music_lessons', eff: { art: 6 }, hp: 4 },
          fail: { t: '"소음이다, 공부나 해라." 악기는 뒤로 밀렸다.', hp: -4 }
        } },
      { id: 'sing', label: '교회·학교 합창단에 들어간다', intent: 'social', out: { t: '노래를 부르며 아이들과 어울리는 시간이 즐겁다.', flag: 'chorus', eff: { art: 6 }, hp: 6, rel: { friends: 2 } } },
      { id: 'no', label: '그냥 듣는 게 좋다', intent: 'rest', out: { t: '음악은 귀로만 즐기기로 했다.', hp: 1 } }
    ]
  });

  ch({
    id: 'mu_audition', cat: 'music', ages: [15, 22], dom: ['music'], icon: '🎤', label: '음악', w: 16,
    if: p => A(p, 'music') >= 30 && (has(p, 'band') || has(p, 'music_lessons') || has(p, 'busker') || p.track === 'arts' || p.major === 'music'),
    title: '오디션 공고', text: '연습실 벽에 붙은 오디션 공고가 눈에 들어왔다. 주변에서는 "너라면 한번 해 봐"라고 하고, 부모님은 불안해하신다.',
    choices: [
      { id: 'go', label: '오디션에 도전한다', intent: 'adventure',
        check: { base: 24, partial: 0.5, f: [['talent', 'music', 16], ['eff', 'art', 0.35], ['stat', 'mental', 0.2], ['flag', 'busker', 6, '무대 경험'], ['flag', 'band', 6, '밴드 경험']] },
        out: {
          success: { t: '합격이다! 연습생 계약서에 도장을 찍었다. 지금부터 진짜 시작이다.', log: '기획사 연습생 합격', major: true, flag: 'trainee', hp: 16, achv: 4, sr: 6 },
          partial: { t: '최종까지 올라갔지만 아쉽게 탈락했다. 심사위원이 "다음에 다시 보자"고 했다.', log: '오디션 최종 탈락', hp: 3, st: { mental: 2 } },
          fail: { t: '긴장해서 목소리가 갈라졌다. 오래도록 그 장면이 떠올랐다.', hp: -8, sr: 8 }
        } },
      { id: 'univ', label: '실용음악·음대 입시를 준비한다', intent: 'education', out: { t: '무대 대신 입시 레슨실로. 한 길을 꾸준히 가기로 했다.', flag: 'music_prep', eff: { art: 14 }, hp: 3 } },
      { id: 'hobby', label: '취미로 남겨 두기로 한다', intent: 'stability', out: { t: '노래는 노래방에서, 연주는 방 안에서.', hp: 0 } }
    ]
  });

  ch({
    id: 'mu_gig', cat: 'music', ages: [20, 33], dom: ['music'], icon: '🎸', label: '음악', w: 14, cd: 5, max: 2,
    if: p => A(p, 'music') >= 32 && (has(p, 'band') || has(p, 'busker') || has(p, 'trainee') || jobIs(p, 'musician') || p.major === 'music'),
    title: '작은 공연장의 밤', text: '홍대의 작은 공연장에서 공연 제안이 왔다. "객석은 열 명 남짓이지만 음반 관계자가 올지도 몰라요."',
    choices: [
      { id: 'play', label: '모든 걸 쏟아 연주한다', intent: 'adventure',
        check: { base: 42, partial: 0.5, f: [['talent', 'music', 12], ['eff', 'art', 0.3], ['stat', 'mental', 0.2], ['stat', 'social', 0.15]] },
        out: {
          success: { t: '마지막 곡이 끝나자 박수가 터졌다. 한 레이블에서 연락이 왔다.', log: '공연 후 레이블 제안', major: true, flag: ['music_award', 'indie_deal'], hp: 14, achv: 4, money: 200 },
          partial: { t: '관객 몇몇이 팬이 되었다. 인스타 팔로워가 조금 늘었다.', hp: 7, achv: 1, money: 30 },
          fail: { t: '음향 사고로 공연을 망쳤다. 며칠을 이불 속에서 보냈다.', hp: -8, sr: 12 }
        } },
      { id: 'release', label: '직접 음원을 만들어 올린다', intent: 'career',
        check: { base: 34, partial: 0.5, f: [['talent', 'music', 10], ['flag', 'coder', 4, '기술 감각'], ['assets', 0.1]] },
        out: {
          success: { t: '스트리밍에서 우연히 알고리즘을 타 조회수가 터졌다. 내 노래를 따라 부르는 사람들이 생겼다.', log: '자작곡이 알려짐', major: true, flag: 'indie_deal', hp: 14, achv: 4, money: 300 },
          partial: { t: '조금씩 듣는 사람이 늘어난다. 꾸준히 해 보기로 했다.', hp: 6, money: 20 },
          fail: { t: '재생 수는 두 자릿수. 그래도 내 목소리가 세상에 있다.', hp: 1, money: -100 }
        } },
      { id: 'pass', label: '현실이 먼저다. 접는다', intent: 'stability', out: { t: '악기를 케이스에 넣었다. 케이스가 유난히 가볍게 느껴졌다.', hp: -6 } }
    ]
  });

  ch({
    id: 'mu_teach', cat: 'music', ages: [30, 52], dom: ['music'], icon: '🎼', label: '음악', w: 14,
    if: p => A(p, 'music') >= 34 && (jobIs(p, 'musician') || p.major === 'music' || has(p, 'indie_deal') || has(p, 'trainee')),
    title: '무대냐, 레슨이냐', text: '연주 수입은 불규칙하다. 학원 원장이 "레슨 강사 자리를 맡아 달라"고 제안했다. 꾸준한 수입이지만 무대는 줄어들 것이다.',
    choices: [
      { id: 'teach', label: '레슨 강사를 맡는다', intent: 'stability', out: { t: '제자가 처음으로 한 곡을 완성했을 때 눈물이 찡했다. 가르치는 기쁨을 알게 되었다.', log: '음악 레슨 강사가 됨', flag: 'music_teacher', money: 500, hp: 8, st: { social: 2 } } },
      { id: 'stage', label: '불안정하지만 무대를 지킨다', intent: 'adventure',
        check: { base: 42, partial: 0.5, f: [['talent', 'music', 10], ['assets', 0.2], ['support', 0.2]] },
        out: {
          success: { t: '꾸준히 무대에 선 덕에 팬층이 단단해졌다. 가끔 큰 행사에도 불려 간다.', log: '꾸준한 활동으로 입지를 굳힘', hp: 10, achv: 3, money: 400 },
          partial: { t: '살림은 빠듯하지만 노래하는 삶을 이어 간다.', hp: 4, money: -100 },
          fail: { t: '수입이 끊겨 부업을 뛰어야 했다. 연주할 시간이 줄었다.', hp: -8, sr: 12, money: -300 }
        } }
    ]
  });

  ch({
    id: 'mu_choir', cat: 'music', ages: [50, 78], dom: ['music'], icon: '🎶', label: '음악',
    if: p => A(p, 'music') >= 25 || has(p, 'chorus') || has(p, 'band') || has(p, 'music_lessons'),
    title: '다시 울리는 소리', text: '동네 주민 합창단이 단원을 모집한다. 먼지 쌓인 악기를 꺼내 볼까 하는 마음도 든다.',
    choices: [
      { id: 'join', label: '합창단·동호회에 가입한다', intent: 'hobby',
        out: { t: '매주 목요일 연습이 기다려진다. 나이도 직업도 다른 사람들과 화음을 맞추는 시간이 소중하다.', log: '노년에 합창단 활동', flag: 'late_music', hp: 12, sr: -6, rel: { friends: 4 }, st: { mental: 2 } } },
      { id: 'solo', label: '혼자 악기를 다시 연습한다', intent: 'independence', out: { t: '손가락은 굳었지만 소리는 여전히 아름답다. 하루가 음악으로 채워졌다.', hp: 7, sr: -3 } },
      { id: 'pass', label: '듣는 것으로 만족한다', intent: 'rest', out: { t: '라디오에서 흘러나오는 음악을 들으며 하루를 보냈다.', hp: 2 } }
    ]
  });

  // ═════════════════════════ 글 · 인문 ═════════════════════════

  ch({
    id: 'wr_contest', cat: 'writing', ages: [8, 13], dom: ['writing'], icon: '📖', label: '글',
    if: p => A(p, 'writing') >= 14 || has(p, 'kid_study'),
    title: '글짓기 대회', text: '담임 선생님이 내 일기를 읽고 "백일장에 나가 보라"고 하셨다. 글 쓰는 건 좋은데 사람들 앞에서 읽는다니 떨린다.',
    choices: [
      { id: 'go', label: '백일장에 나간다', intent: 'adventure',
        check: { base: 44, partial: 0.5, f: [['stat', 'creativity', 0.35], ['talent', 'writing', 12], ['eff', 'study', 0.15]] },
        out: {
          success: { t: '내 글이 장려상으로 뽑혀 교내에 걸렸다. 글로 칭찬받은 건 처음이다.', log: '백일장 입상', flag: 'writer_kid', eff: { study: 6 }, hp: 10, achv: 1, fn: disc('writing') },
          partial: { t: '입상은 못 했지만 쓰는 즐거움을 알았다.', flag: 'writer_kid', hp: 4 },
          fail: { t: '긴장해서 마감 직전에 겨우 냈다. 그래도 경험이다.', hp: -2 }
        } },
      { id: 'diary', label: '대회는 싫지만 일기는 계속 쓴다', intent: 'independence', out: { t: '비밀일기장이 빼곡히 차간다. 글은 나만의 피난처다.', flag: 'writer_kid', hp: 5, fn: disc('writing') } },
      { id: 'skip', label: '다른 일이 더 재밌다', intent: 'social', out: { t: '글쓰기는 숙제로 충분하다.', hp: 0 } }
    ]
  });

  ch({
    id: 'wr_club', cat: 'writing', ages: [14, 19], dom: ['writing'], icon: '🖋️', label: '글',
    if: p => A(p, 'writing') >= 26 || has(p, 'writer_kid') || has(p, 'blogger'),
    title: '문학 동아리', text: '교내 문예 동아리 부장 선배가 "글 쓰는 사람이 부족해. 같이 해 보자"며 가입 신청서를 내밀었다. 입시와 글쓰기 사이에서 고민이 된다.',
    choices: [
      { id: 'join', label: '동아리에 가입해 시와 소설을 쓴다', intent: 'hobby',
        out: { t: '합평회에서 서로의 글을 읽고 얼굴을 붉혔다. 쓰는 사람들 곁에서 한층 성장했다.', log: '문예 동아리 활동', flag: ['writer_kid', 'lit_club'], eff: { study: 4 }, st: { creativity: 3, social: 2 }, hp: 8, fn: disc('writing') } },
      { id: 'later', label: '입시가 먼저다. 글은 나중에', intent: 'education', out: { t: '글쓰기 노트는 서랍 속으로 들어갔다.', eff: { study: 8 }, hp: -2 } },
      { id: 'online', label: '온라인에 몰래 연재해 본다', intent: 'risk',
        check: { base: 40, partial: 0.4, f: [['stat', 'creativity', 0.3], ['talent', 'writing', 10]] },
        out: {
          success: { t: '익명으로 올린 연재물에 댓글이 쌓였다. "다음 화 언제 올라와요?" 그 한 줄에 날아갈 듯했다.', log: '웹소설·블로그 연재로 독자를 얻음', flag: ['writer_kid', 'blogger'], hp: 12, st: { creativity: 3 } },
          partial: { t: '조회수는 낮지만 쓰는 재미는 확실하다.', flag: 'blogger', hp: 5 },
          fail: { t: '악플 한 줄에 쓰던 글을 접었다.', hp: -8, sr: 8 }
        } }
    ]
  });

  ch({
    id: 'wr_campus', cat: 'writing', ages: [19, 27], dom: ['writing'], icon: '📰', label: '글', w: 12,
    if: p => A(p, 'writing') >= 28 && (p.status === 'college' || !!p.major || has(p, 'lit_club')),
    title: '신춘문예와 공모전', text: '대학 신문사에서 수습기자를 모집하는가 하면, 문예지 신인상 공모도 열렸다. 마감은 한 달 뒤다.',
    choices: [
      { id: 'submit', label: '공모전에 원고를 보낸다', intent: 'adventure',
        check: { base: 24, partial: 0.5, f: [['stat', 'creativity', 0.4], ['talent', 'writing', 16], ['flag', 'writer_kid', 6, '글쓰기 경험'], ['flag', 'lit_club', 6, '합평 경험']] },
        out: {
          success: { t: '"당선" 두 글자가 휴대폰에 찍혔다. 지면에 실린 내 이름이 낯설고 뭉클했다.', log: '문예 공모전 당선', major: true, flag: ['published', 'writer_kid'], hp: 16, achv: 5, money: 200 },
          partial: { t: '예심까지 올라갔다. 심사평에 "가능성이 보인다"고 적혀 있었다.', flag: 'writer_kid', hp: 6, achv: 1 },
          fail: { t: '연락이 없다. 며칠은 아프게 기다렸다.', hp: -5 }
        } },
      { id: 'press', label: '학보사 기자로 활동한다', intent: 'career', out: { t: '마감과 취재를 반복하며 글이 단단해졌다. 사회를 보는 눈도 넓어졌다.', log: '학보사 기자 활동', flag: 'campus_press', eff: { social: 6, study: 4 }, st: { social: 2 }, hp: 5 } },
      { id: 'no', label: '학업·취업이 우선', intent: 'stability', out: { t: '지금은 스펙부터. 글쓰기는 잠시 접는다.', eff: { study: 6 } } }
    ]
  });

  ch({
    id: 'wr_book', cat: 'writing', ages: [29, 56], dom: ['writing'], icon: '📚', label: '글', w: 14,
    if: p => has(p, 'published') || has(p, 'blogger') || jobIs(p, 'writer') || (A(p, 'writing') >= 45),
    title: '책을 내자는 제안', text: '블로그(혹은 지면)의 글을 읽은 출판사 편집자가 연락을 해 왔다. "에세이로 묶어 보면 어떨까요? 계약금은 많지 않지만요."',
    choices: [
      { id: 'sign', label: '계약하고 책을 쓴다', intent: 'career',
        check: { base: 46, partial: 0.5, f: [['stat', 'creativity', 0.3], ['talent', 'writing', 12], ['eff', 'work', 0.1], ['stress', 0.2]] },
        out: {
          success: { t: '서점 매대에 내 책이 놓였다. 작은 사인회에서 독자가 "덕분에 위로받았어요"라고 말했다.', log: '첫 책 출간', major: true, flag: 'author', hp: 16, achv: 6, money: 400 },
          partial: { t: '책은 나왔지만 판매는 조용했다. 그래도 내 이름이 새겨진 책을 품에 안았다.', log: '첫 책 출간(조용한 반응)', flag: 'author', hp: 8, achv: 3, money: 100 },
          fail: { t: '원고 수정이 끝없이 이어지다 출간이 무산되었다. 허탈감이 컸다.', hp: -10, sr: 14 }
        } },
      { id: 'self', label: '독립출판으로 직접 펴낸다', intent: 'adventure',
        check: { base: 36, partial: 0.5, f: [['assets', 0.15], ['stat', 'creativity', 0.25], ['flag', 'online_shop', 6, '판매 경험']] },
        out: {
          success: { t: '독립서점 몇 곳에 입고되며 입소문을 탔다. 작지만 단단한 독자층이 생겼다.', log: '독립출판으로 책을 냄', flag: 'author', hp: 12, achv: 4, money: 150 },
          partial: { t: '손익은 겨우 맞췄다. 내 손으로 만든 책이 소중하다.', flag: 'author', hp: 7 },
          fail: { t: '재고가 방 한쪽을 차지했다. 그래도 후회는 없다.', hp: -3, money: -300 }
        } },
      { id: 'no', label: '글은 부업으로 두기로 한다', intent: 'stability', out: { t: '생업에 집중하기로 했다. 블로그는 계속 쓰기로 했다.', hp: 0 } }
    ]
  });

  ch({
    id: 'wr_memoir', cat: 'writing', ages: [55, 82], dom: ['writing'], icon: '📝', label: '글',
    if: p => p.age >= 55,
    title: '내 이야기 쓰기', text: p => '손주(혹은 가까운 사람)가 "할머니·할아버지의 어릴 적 이야기를 듣고 싶어요"라고 했다. 살아온 ' + (p.age - 20) + '여 년을 글로 남겨 볼까.',
    choices: [
      { id: 'write', label: '자서전·회고록을 쓴다', intent: 'hobby',
        out: { t: '기억을 하나씩 꺼내 적다 보니 잊고 있던 얼굴과 웃음이 되살아났다. 쓰면서 많이 울고 웃었다.', log: '살아온 이야기를 글로 남김', flag: 'memoir', hp: 12, sr: -6, rel: { family: 4 }, st: { mental: 2 } } },
      { id: 'tell', label: '말로 들려주고 녹음해 둔다', intent: 'family', out: { t: '저녁마다 이야기를 들려주었다. 아이들의 눈이 반짝였다.', hp: 8, rel: { family: 5 } } },
      { id: 'no', label: '"내 이야기가 뭐 대단하다고" 웃어넘긴다', intent: 'rest', out: { t: '손사래를 쳤지만 마음은 따뜻해졌다.', hp: 1 } }
    ]
  });
})(window.LG = window.LG || {});
