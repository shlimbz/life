/* 이벤트 — 어두운 쪽의 삶
   실제 인생은 좋고 무난한 일만 있지 않다. 따돌림 · 폭력 · 범죄 · 사고 · 중독 · 부당한 일이
   환경(가정 형편·불화·지역)과 성격, 그리고 이전 선택에 따라 '확률적으로' 찾아온다.
   피해자가 되기도, 가해에 가담하기도 하고, 그 기억은 flag로 남아 나중에 다시 돌아온다.
   모든 이벤트는 cat 'hardship' 으로 묶여 있어 한꺼번에 몰리지 않는다(recency). */
(function (LG) {
  const E = LG.DATA.events;
  const H = LG.EH, has = H.has, disc = H.disc;
  const S = H.S;
  const tr = H.tr;
  const poor = H.poor;
  const conflict = p => p.family.tags.indexOf('conflict') >= 0 || p.family.tags.indexOf('divorced_parents') >= 0 || has(p, 'parents_divorced');
  const jobIs = H.jobIs;
  const auto = H.pusher({ tier: 'auto', cat: 'hardship' });
  const ch = H.pusher({ tier: 'choice', cat: 'hardship', label: '시련' });
  const jp = m => p => { p.family.tier = Math.max(1, p.family.tier - m); return ''; };

  // ═════════════════════════ 학창 시절 ═════════════════════════

  ch({
    id: 'd_bullied', risk: 0.5, ages: [9, 16], w: p => 3.2 + (tr(p, 'introvert') ? 2 : 0) + (p.stats.social < 45 ? 2.2 : 0) + (p.stats.physical < 42 ? 1.2 : 0) + (has(p, 'parents_divorced') ? 1 : 0) + (poor(p) ? 1 : 0) + (has(p, 'transferred') ? 1.5 : 0), cd: 4, max: 2, icon: '😞',
    if: p => !has(p, 'bullied'),
    title: '따돌림', text: p => p.age <= 12 ? '어느 날부터 같이 놀던 아이들이 나를 피하기 시작했다. 급식실에서도 내 옆자리만 비어 있다.' : '단톡방에서 내 이름만 빼고 대화가 이어지는 걸 알게 되었다. 복도에서 마주치면 속닥거리며 웃는다.',
    choices: [
      { id: 'tell', label: '부모님·선생님께 털어놓는다', intent: 'family',
        check: { base: 52, partial: 0.4, f: [['support', 0.3], ['rel', 'mother', 0.1], ['stat', 'mental', 0.15], ['fn', p => has(p, 'parents_divorced') ? { label: '바쁜 보호자', v: -6 } : null]] },
        out: {
          success: { t: '어른들이 움직였다. 한바탕 소란 끝에 괴롭힘이 멈췄다. 숨통이 트이는 기분이었다.', log: '따돌림을 털어놓고 도움을 받음', hp: 2, sr: -6, flag: 'bullied_helped', rel: { parents: 5 } },
          partial: { t: '"애들이 다 그렇지"라며 가볍게 넘겨졌다. 조금 나아졌지만 완전히 끝난 건 아니다.', flag: 'bullied', hp: -5, sr: 8 },
          fail: { t: '이야기를 꺼낸 것이 오히려 더 큰 놀림감이 됐다. 아무도 내 편이 아니라는 생각이 들었다.', log: '따돌림이 더 심해짐', flag: 'bullied', hp: -14, sr: 18, st: { mental: -4 } }
        } },
      { id: 'endure', label: '혼자 버틴다', intent: 'stability',
        check: { base: 36, partial: 0.5, f: [['stat', 'mental', 0.4], ['trait', 'careful', 4]] },
        out: {
          success: { t: '시간이 흘러 아이들의 관심이 다른 데로 옮겨 갔다. 그 시간을 버틴 것이 나를 조금 단단하게 했다.', log: '따돌림을 혼자 견뎌 냄', flag: 'bullied', st: { mental: 2 }, hp: -4, sr: 6 },
          partial: { t: '학교 가는 길이 매일 무거웠다. 점점 말수가 줄어들었다.', log: '따돌림에 위축됨', flag: 'bullied', hp: -10, sr: 14, st: { social: -3, mental: -2 } },
          fail: { t: '가슴이 답답하고 밥이 넘어가지 않는다. 학교 가는 아침이 두려워졌다.', log: '따돌림으로 마음의 병을 얻음', flag: ['bullied', 'school_refusal'], hp: -18, sr: 22, st: { mental: -6, health: -3, social: -4 } }
        } },
      { id: 'fight', label: '맞서서 따진다', intent: 'risk',
        check: { base: 30, partial: 0.4, f: [['stat', 'physical', 0.3], ['stat', 'social', 0.2], ['trait', 'competitive', 6]] },
        out: {
          success: { t: '용기를 내 맞서자 아이들이 오히려 머쓱해했다. 그날 이후 아무도 쉽게 건드리지 않았다.', log: '괴롭힘에 맞서 이겨 냄', flag: ['bullied', 'fought_back'], st: { mental: 4 }, hp: 6 },
          partial: { t: '말다툼이 커져 선생님께 불려갔다. 양쪽 다 혼이 났다.', flag: 'bullied', hp: -4, sr: 8 },
          fail: { t: '몸싸움이 났고 내가 더 크게 다쳤다. 오히려 내가 문제아 취급을 받았다.', log: '맞서다 크게 다침', flag: ['bullied', 'school_fight'], st: { health: -3 }, hp: -14, sr: 16 }
        } },
      { id: 'transfer', label: '전학을 알아본다', intent: 'independence', if: p => p.family.tier >= 2 || p.urban,
        out: { t: '새 학교에서는 아무도 나를 모른다. 처음엔 어색했지만 숨을 쉴 수 있었다.', log: '따돌림을 피해 전학', flag: ['bullied', 'transferred'], hp: 2, sr: -2, money: -200, st: { social: -1 } } }
    ]
  });

  ch({
    id: 'd_join_bully', risk: 0.4, ages: [10, 17], w: p => 2.6 + (tr(p, 'impulsive') ? 1.6 : 0) + (tr(p, 'competitive') ? 1 : 0) + (conflict(p) ? 1.2 : 0) + (p.stats.social > 62 ? 1.2 : 0) + (has(p, 'busy_parents') ? 0.6 : 0), cd: 5, max: 1, icon: '😶',
    if: p => !has(p, 'bullied'),
    title: '무리의 분위기', text: '친해진 무리가 한 아이를 대놓고 놀리기 시작했다. "너도 한마디 해 봐." 모두의 눈이 나를 향한다. 웃지 않으면 다음은 내 차례가 될 것 같다.',
    choices: [
      { id: 'join', label: '분위기에 맞춰 같이 한다', intent: 'social',
        check: { base: 56, partial: 0.4, f: [['region', 'community', 0.2], ['noflag', 'volunteer', 4, ''], ['fn', p => p.stats.mental > 65 ? { label: '양심', v: -8 } : null]] },
        out: {
          success: { t: '그 순간엔 아무 일도 없었다. 무리 안에서 내 자리가 단단해진 느낌이었다. 다만 그 아이의 눈빛이 오래 잊히지 않았다.', log: '친구들과 함께 한 아이를 놀림', flag: 'bully_joined', st: { social: 2 }, hp: -2 },
          partial: { t: '그 아이가 울음을 터뜨렸다. 선생님께 불려 가 부모님이 학교에 오셨다.', log: '학교폭력 주의 처분', flag: ['bully_joined', 'school_violence_record'], hp: -10, sr: 16, rel: { parents: -8 } },
          fail: { t: '일이 커져 학교폭력 심의가 열렸다. 기록이 남았고, 집안이 발칵 뒤집혔다.', log: '학교폭력 처분 기록이 남음', flag: ['bully_joined', 'school_violence_record', 'juvenile_record'], hp: -16, sr: 22, rel: { parents: -12 }, money: -300 }
        } },
      { id: 'refuse', label: '"난 안 할래." 하고 빠진다', intent: 'stability',
        check: { base: 50, partial: 0.4, f: [['stat', 'mental', 0.3], ['stat', 'social', 0.15]] },
        out: {
          success: { t: '어색한 침묵이 흘렀지만 다들 금세 다른 이야기를 했다. 그 아이가 나에게 작게 눈인사를 했다.', log: '무리의 괴롭힘에 가담하지 않음', flag: 'refused_bully', st: { mental: 3 }, hp: 4 },
          partial: { t: '무리와 서먹해졌다. 점심을 혼자 먹는 날이 늘었다.', flag: 'refused_bully', hp: -4, sr: 8, st: { social: -2 } },
          fail: { t: '"의리 없다"며 무리가 나를 밀어냈다. 다음 표적은 내가 되었다.', log: '무리에서 밀려나 표적이 됨', flag: ['refused_bully', 'bullied'], hp: -12, sr: 16 }
        } },
      { id: 'tell', label: '선생님께 조용히 알린다', intent: 'stability',
        out: { t: '선생님이 조용히 개입해 주셨다. 누가 말했는지는 끝내 밝혀지지 않았다.', log: '괴롭힘을 어른에게 알림', flag: 'refused_bully', st: { mental: 2 }, hp: 3 } }
    ]
  });

  ch({
    id: 'd_cyber', risk: 0.2, ages: [12, 22], w: p => 2.4 + (p.stats.social < 50 ? 1 : 0) + (p.age >= 15 ? 1 : 0), cd: 6, max: 2, icon: '📱',
    title: '온라인 괴롭힘', text: p => p.age <= 17 ? '내 사진에 악의적인 합성과 조롱 댓글이 달려 학교에 퍼졌다. 누가 시작했는지도 모르겠다.' : 'SNS에 나에 대한 근거 없는 소문과 조롱 글이 올라왔다. 알림이 계속 울린다.',
    choices: [
      { id: 'report', label: '증거를 모아 신고한다', intent: 'stability',
        check: { base: 52, partial: 0.4, f: [['stat', 'intelligence', 0.2], ['support', 0.2], ['trait', 'careful', 5]] },
        out: {
          success: { t: '캡처와 기록을 모아 신고했고, 게시물이 삭제되었다. 가해자는 처벌을 받았다.', log: '온라인 괴롭힘을 신고해 해결', flag: 'reported_cyber', hp: 3, sr: -2, st: { mental: 2 } },
          partial: { t: '게시물은 지워졌지만 사람들의 시선은 한동안 남았다.', hp: -5, sr: 10 },
          fail: { t: '신고는 접수만 되고 흐지부지됐다. 그 사이 소문은 더 퍼졌다.', hp: -11, sr: 16 }
        } },
      { id: 'quit', label: '계정을 닫고 한동안 피한다', intent: 'rest',
        out: { t: '휴대폰을 내려놓았다. 세상이 조용해졌지만 마음 한구석은 계속 불안하다.', log: '온라인 괴롭힘을 피해 SNS를 끊음', hp: -3, sr: 4, st: { social: -2 } } },
      { id: 'answer', label: '맞받아쳐서 해명한다', intent: 'risk',
        check: { base: 28, partial: 0.4, f: [['stat', 'social', 0.2], ['trait', 'impulsive', -6]] },
        out: {
          success: { t: '차분한 해명이 오히려 공감을 얻었다. 몇몇은 사과까지 해 왔다.', hp: 4, st: { social: 2 } },
          partial: { t: '논쟁이 길어졌고 지쳐서 접었다.', hp: -6, sr: 10 },
          fail: { t: '해명하려던 글이 캡처되어 더 큰 조롱거리가 되었다.', log: '온라인에서 크게 조롱당함', hp: -14, sr: 18, st: { mental: -3 } }
        } }
    ]
  });

  ch({
    id: 'd_home_violence', risk: 1, ages: [7, 17], w: p => (conflict(p) ? 6 : 0) + (poor(p) && has(p, 'job_risk') ? 3 : 0) + (poor(p) ? 1.2 : 0.2), cd: 7, max: 1, icon: '🌩️',
    if: p => conflict(p) || poor(p),
    title: '무너지는 집', text: '밤마다 안방에서 고성이 오가고, 오늘은 무언가 깨지는 소리가 났다. 이불 속에서 귀를 막았지만 소리는 멈추지 않았다.',
    choices: [
      { id: 'friend', label: '믿을 만한 친구 집으로 피한다', intent: 'independence',
        out: { t: '친구네 가족이 따뜻하게 맞아 주었다. 거기서 라면을 끓여 먹으며 오랜만에 웃었다.', log: '불안한 밤을 친구 집에서 보냄', hp: 3, sr: -2, flag: 'home_unrest', rel: { friends: 8 } } },
      { id: 'teacher', label: '담임 선생님께 도움을 청한다', intent: 'stability',
        check: { base: 55, partial: 0.4, f: [['region', 'community', 0.2], ['stat', 'mental', 0.2]] },
        out: {
          success: { t: '선생님이 상담센터와 연결해 주셨다. 어른의 도움을 처음으로 받아 봤다.', log: '가정 문제로 도움을 받음', flag: ['home_unrest', 'counseled'], hp: 4, sr: -4, st: { mental: 2 } },
          partial: { t: '선생님이 걱정해 주셨지만 할 수 있는 일은 많지 않았다.', flag: 'home_unrest', hp: -2, sr: 6 },
          fail: { t: '집안 사정이 소문났다. 부모님은 "왜 밖에서 말하고 다니냐"며 더 화를 냈다.', flag: 'home_unrest', hp: -12, sr: 16, rel: { parents: -10 } }
        } },
      { id: 'endure', label: '조용히 숨죽이고 지낸다', intent: 'stability',
        out: { t: '눈치 보는 법을 일찍 배웠다. 집은 편한 곳이 아니었다.', log: '불안한 집에서 눈치를 보며 자람', flag: 'home_unrest', hp: -8, sr: 14, st: { mental: -2 } } }
    ]
  });

  ch({
    id: 'd_delinquent', risk: 0.9, ages: [14, 19], w: p => 3 + (conflict(p) ? 1.5 : 0) + (tr(p, 'impulsive') ? 2 : 0) + (has(p, 'home_unrest') ? 1.4 : 0) + (has(p, 'bullied') ? 0.8 : 0) + (has(p, 'busy_parents') ? 0.6 : 0) + (p.stats.mental < 45 ? 0.8 : 0) - (has(p, 'kid_study') ? 0.8 : 0), cd: 4, max: 2, icon: '🚬',
    title: '나쁜 친구들', text: '동네 선배와 어울리는 아이들이 다가왔다. "오늘 밤 모여서 놀자. 담배도 있고, 슈퍼 앞에서 뭐 좀 가져올 거야." 다들 아무렇지 않은 얼굴이다.',
    choices: [
      { id: 'go', label: '따라간다', intent: 'risk',
        check: { base: 44, partial: 0.5, f: [['stat', 'social', 0.1], ['trait', 'careful', 6], ['trait', 'impulsive', -8], ['region', 'community', 0.15]] },
        out: {
          success: { t: '별일 없이 지나갔다. 가슴이 두근거렸지만 다음 날엔 아무 일도 없었다.', log: '비행 친구들과 어울림', flag: 'bad_company', hp: 1, st: { social: 1 } },
          partial: { t: '경비원에게 걸려 부모님이 불려 오셨다. 호되게 혼났다.', log: '비행으로 부모님이 불려 옴', flag: 'bad_company', hp: -10, sr: 14, rel: { parents: -8 } },
          fail: { t: '경찰서까지 가게 되었다. 소년부 송치까지 거론되는 큰 일이 되었다.', log: '비행으로 경찰 조사를 받음', flag: ['bad_company', 'juvenile_record'], hp: -18, sr: 22, rel: { parents: -14 }, money: -300, queue: [{ id: 'd_police', in: 0 }] }
        } },
      { id: 'no', label: '핑계를 대고 빠진다', intent: 'stability',
        out: { t: '"오늘은 학원 가야 해서." 어색하게 웃으며 돌아섰다. 다음 날 그 애들이 경찰에 불려 갔다는 소문을 들었다.', log: '나쁜 유혹을 피함', flag: 'avoided_bad_company', st: { mental: 1 }, hp: 2 } },
      { id: 'tell', label: '부모님께 이야기한다', intent: 'family', if: p => !conflict(p),
        out: { t: '부모님이 놀랐지만 차분히 들어 주셨다. 그날 이후 부모님이 나의 하루를 더 챙기기 시작했다.', log: '위험한 유혹을 부모님께 털어놓음', flag: 'avoided_bad_company', rel: { parents: 6 }, hp: 1 } }
    ]
  });

  ch({
    id: 'd_police', queued: true, ages: [14, 40], icon: '🚔',
    title: '조사받던 날', text: '경찰서 복도 의자에 앉아 있다. 부모님이 오시는 시간이 영원처럼 길다. 앞으로의 일이 한꺼번에 떠오른다.',
    choices: [
      { id: 'honest', label: '있는 그대로 인정하고 반성한다', intent: 'stability',
        check: { base: 62, partial: 0.4, f: [['stat', 'mental', 0.2], ['rel', 'mother', 0.1]] },
        out: {
          success: { t: '반성문과 상담으로 처분이 경미하게 끝났다. 어른들은 "다시 시작할 기회"라고 했다.', log: '잘못을 인정하고 반성해 마무리', flag: 'turned_around', st: { mental: 3 }, hp: 0, sr: 4 },
          partial: { t: '보호관찰 처분이 내려졌다. 한 해 동안 조심스럽게 지내야 한다.', log: '보호관찰 처분', flag: 'probation', hp: -8, sr: 12 },
          fail: { t: '합의금과 처분으로 집안이 휘청였다. 낙인이 쉽게 사라질 것 같지 않다.', log: '큰 처분을 받음', flag: 'probation', hp: -14, sr: 18, money: -400, fn: jp(1) }
        } },
      { id: 'blame', label: '친구들 탓으로 돌린다', intent: 'risk',
        out: { t: '책임을 돌리려 했지만 이미 다 드러난 일이었다. 신뢰까지 잃었다.', log: '책임을 회피하다 신뢰를 잃음', flag: 'probation', hp: -12, sr: 16, rel: { parents: -8, friends: -10 } } }
    ]
  });

  ch({
    id: 'd_school_fight', risk: 0.6, ages: [13, 18], w: p => 2.2 + (tr(p, 'impulsive') ? 1.8 : 0) + (tr(p, 'competitive') ? 1.4 : 0) + (A_(p, 'sports') >= 35 ? 1 : 0), cd: 5, max: 1, icon: '👊',
    title: '복도의 시비', text: '다른 반 아이가 내 가족을 입에 올리며 시비를 걸어 왔다. 주위에 구경꾼이 몰려들었다. 주먹이 먼저 나갈 것 같다.',
    choices: [
      { id: 'hit', label: '참지 않고 먼저 친다', intent: 'risk',
        check: { base: 40, partial: 0.4, f: [['stat', 'physical', 0.35], ['trait', 'impulsive', 3]] },
        out: {
          success: { t: '한 방에 상대가 물러났다. 다만 선생님이 보고 계셨다. 징계는 가벼웠다.', log: '교내 폭력으로 징계', flag: 'school_fight', hp: -4, sr: 8 },
          partial: { t: '서로 크게 다쳤다. 양쪽 부모님이 학교에 오셨다.', log: '교내 싸움으로 학교폭력 처분', flag: ['school_fight', 'school_violence_record'], hp: -12, sr: 16, rel: { parents: -6 }, money: -150 },
          fail: { t: '상대가 크게 다쳤다. 합의금과 처분이 남았다. 마음이 한동안 무거웠다.', log: '싸움으로 상대가 크게 다침', flag: ['school_fight', 'school_violence_record', 'juvenile_record'], hp: -18, sr: 22, rel: { parents: -12 }, money: -500, queue: [{ id: 'd_police', in: 0 }] }
        } },
      { id: 'walk', label: '눈을 피하고 자리를 뜬다', intent: 'stability',
        out: { t: '자존심은 상했지만 주먹은 쓰지 않았다. 나중에 보니 그게 맞는 선택이었다.', log: '싸움을 피함', st: { mental: 2 }, hp: 0 } },
      { id: 'teacher', label: '선생님을 불러온다', intent: 'stability',
        out: { t: '선생님이 개입해 사건은 마무리되었다. 아이들은 "고자질"이라 수군댔지만 나는 괜찮았다.', hp: 1, st: { social: -1, mental: 1 } } }
    ]
  });
  function A_(p, d) { return LG.Aff.get(p, d); }

  ch({
    id: 'd_game_addict', risk: 0.2, ages: [12, 19], w: p => 2.4 + (has(p, 'gamer_dream') ? 2.2 : 0) + (tr(p, 'introvert') ? 1 : 0) + (has(p, 'bullied') ? 1.2 : 0) + (conflict(p) ? 0.8 : 0) + (has(p, 'busy_parents') ? 1 : 0) + (has(p, 'home_unrest') ? 1 : 0), cd: 6, max: 1, icon: '🎮',
    title: '밤새는 화면', text: '게임 속에서는 모두가 나를 인정해 준다. 밤을 새우고 학교에서 졸다 혼나는 날이 늘었다. 성적표가 점점 무서워진다.',
    choices: [
      { id: 'cut', label: '스스로 시간을 정하고 끊는다', intent: 'stability',
        check: { base: 42, partial: 0.5, f: [['stat', 'mental', 0.35], ['eff', 'study', 0.15], ['trait', 'impulsive', -8]] },
        out: {
          success: { t: '시간표를 짜고 지켰다. 게임은 이제 취미일 뿐이다.', log: '게임 과몰입에서 벗어남', flag: 'game_balanced', st: { mental: 3 }, hp: 4 },
          partial: { t: '끊었다 시작했다를 반복한다. 반쯤은 이겨 낸 셈이다.', hp: -3, sr: 6 },
          fail: { t: '의지만으로는 되지 않았다. 학교를 빠지는 날이 늘어났다.', log: '게임 중독으로 학업이 무너짐', flag: 'game_addict', hp: -10, sr: 12, eff: { study: -10 }, st: { intelligence: -2 } }
        } },
      { id: 'talk', label: '부모님·상담센터의 도움을 받는다', intent: 'family',
        out: { t: '처음엔 창피했지만 상담이 도움이 됐다. 부모님과 컴퓨터 사용 규칙을 정했다.', log: '상담으로 게임 과몰입을 다스림', flag: 'game_balanced', hp: 2, sr: -2, rel: { parents: 4 }, money: -100 } },
      { id: 'dive', label: '"게임이 내 길"이라며 몰입한다', intent: 'adventure',
        out: { t: '밤을 새워 랭킹을 올렸다. 학교 성적은 곤두박질쳤지만 게임 속에서는 최고가 되었다.', log: '게임에 올인한 청소년기', flag: ['gamer_dream', 'game_addict'], eff: { study: -12 }, hp: 4, sr: 6 } }
    ]
  });

  ch({
    id: 'd_wage_theft', risk: 0.8, ages: [16, 24], w: p => 5 + (poor(p) ? 2 : 0), cd: 6, max: 1, icon: '🧾',
    if: p => p.age <= 26 && (has(p, 'teen_job') || has(p, 'worked_teen') || (p.job && p.job.id === 'parttime') || p.status === 'seeking'),
    title: '못 받은 월급', text: '한 달을 꼬박 일했는데 사장님이 "다음 달에 같이 줄게"만 반복한다. 계약서도 쓰지 않았다. 메시지는 읽고도 답이 없다.',
    choices: [
      { id: 'labor', label: '노동청에 진정을 넣는다', intent: 'stability',
        check: { base: 55, partial: 0.4, f: [['stat', 'intelligence', 0.2], ['trait', 'careful', 6]] },
        out: {
          success: { t: '진정서를 내고 한 달 만에 밀린 임금을 받았다. 알아 두니 큰 힘이 된다는 걸 알았다.', log: '임금체불을 신고해 받아 냄', money: 120, st: { mental: 2 }, hp: 3 },
          partial: { t: '절차가 복잡했지만 일부만 받았다.', money: 60, hp: -2, sr: 6 },
          fail: { t: '사장이 잠적했다. 받을 방법이 없다. 세상의 쓴맛을 봤다.', log: '임금을 떼임', money: 0, hp: -8, sr: 10 }
        } },
      { id: 'let', label: '그냥 포기한다', intent: 'rest', out: { t: '귀찮은 일에 휘말리기 싫었다. 한동안 그 가게 앞을 지날 때마다 속이 쓰렸다.', hp: -5, sr: 6 } },
      { id: 'confront', label: '직접 찾아가 따진다', intent: 'risk',
        check: { base: 36, partial: 0.4, f: [['stat', 'social', 0.25]] },
        out: {
          success: { t: '끈질기게 찾아가 받아 냈다. 사장이 혀를 내둘렀다.', money: 100, hp: 4 },
          partial: { t: '반만 받고 합의했다.', money: 50, sr: 6 },
          fail: { t: '큰소리만 오갔고 한 푼도 받지 못했다.', hp: -8, sr: 12 }
        } }
    ]
  });

  // ═════════════════════════ 어른의 세계 ═════════════════════════

  auto({
    id: 'd_crime_victim', risk: 0.8, ages: [15, 82], w: 1, rate: p => 0.0028 + (p.urban ? 0.0012 : 0) + (poor(p) ? 0.0006 : 0) + (p.gender === 'F' && p.age < 40 ? 0.0008 : 0), cd: 14, max: 2, icon: '🚨',
    check: { base: 56, partial: 0.5, f: [['stat', 'physical', 0.2], ['trait', 'careful', 6], ['fn', p => p.urban ? { label: '붐비는 거리', v: -4 } : { label: '조용한 동네', v: 4 }]] },
    out: {
      success: { t: '늦은 밤 낯선 사람이 따라붙었지만 큰길로 빠져나와 위기를 모면했다. 심장이 한참 뛰었다.', st: { mental: -1 }, sr: 8 },
      partial: { t: '소매치기를 당해 지갑과 휴대폰을 잃었다. 카드 정지와 재발급에 반나절을 썼다.', log: '소매치기 피해', money: -80, sr: 8, hp: -4 },
      fail: { t: '밤길에 폭행과 강도를 당했다. 몸의 상처보다 마음의 충격이 컸다. 한동안 밤길이 무서웠다.', log: '범죄 피해를 당함', major: true, st: { health: -8, mental: -4 }, money: -200, hp: -16, sr: 20, flag: 'crime_victim', queue: [{ id: 'd_after_crime', in: 0 }] }
    }
  });

  ch({
    id: 'd_after_crime', queued: true, ages: [15, 85], icon: '🫂',
    title: '사건 이후', text: '몸은 회복되어 가는데 마음이 따라오지 못한다. 밤마다 그 순간이 떠오르고, 낯선 발소리에도 몸이 굳는다.',
    choices: [
      { id: 'therapy', label: '상담과 치료를 받는다', intent: 'health',
        out: { t: '전문가의 도움을 받으며 조금씩 일상을 되찾았다. 도움을 청하는 것도 용기라는 걸 배웠다.', log: '심리 치료로 회복', flag: 'counseled', hp: 6, sr: -8, st: { mental: 3 }, money: -150 } },
      { id: 'report', label: '끝까지 신고하고 법적 절차를 밟는다', intent: 'stability',
        check: { base: 48, partial: 0.4, f: [['support', 0.25], ['stat', 'mental', 0.3]] },
        out: {
          success: { t: '범인이 붙잡혀 처벌을 받았다. 길었지만 마침표를 찍은 기분이다.', log: '범인을 잡고 마무리', hp: 8, sr: -4, st: { mental: 3 } },
          partial: { t: '절차는 느렸고 결과는 아쉬웠다. 그래도 끝까지 해냈다는 사실이 남았다.', hp: 1, sr: 6 },
          fail: { t: '증거가 부족해 사건이 종결되었다. 허탈함이 오래 갔다.', hp: -8, sr: 12 }
        } },
      { id: 'avoid', label: '잊으려 애쓴다', intent: 'rest',
        out: { t: '아무 일 없었던 척 일상으로 돌아갔다. 가끔 이유 없이 숨이 막힌다.', log: '충격을 안고 지냄', hp: -6, sr: 10, st: { mental: -2 } } }
    ]
  });

  ch({
    id: 'd_phone_scam', risk: 0.2, ages: [20, 82], w: p => 0.8 + (p.age >= 55 ? 1.6 : 0) + (p.age < 30 ? 0.4 : 0) + (p.stats.intelligence < 45 ? 0.4 : 0), cd: 10, max: 2, icon: '☎️',
    title: '수상한 전화', text: p => p.age >= 55 ? '검찰청 수사관이라는 사람이 전화를 걸어 왔다. "계좌가 범죄에 연루됐으니 안전계좌로 이체하세요." 목소리가 너무 다급하다.' : '"저, 엄마야. 휴대폰 고장 나서 친구 폰으로 문자해. 급하게 돈이 필요한데…" 낯선 번호로 문자가 왔다.',
    choices: [
      { id: 'hangup', label: '일단 끊고 직접 확인한다', intent: 'stability',
        check: { base: 68, partial: 0.4, f: [['trait', 'careful', 10], ['stat', 'intelligence', 0.2], ['fn', p => p.age >= 65 ? { label: '고령', v: -8 } : null]] },
        out: {
          success: { t: '직접 전화해 보니 가족은 멀쩡했다. 보이스피싱이었다. 가슴을 쓸어내렸다.', log: '보이스피싱을 알아채고 막음', hp: 3 },
          partial: { t: '끊긴 했지만 개인정보가 일부 새어 나간 것 같다. 한동안 불안하다.', sr: 6, money: -20 },
          fail: { t: '확인하기도 전에 이미 송금을 하고 말았다. 바로 신고했지만 일부만 돌려받았다.', log: '보이스피싱 피해', money: -600, hp: -10, sr: 14 }
        } },
      { id: 'pay', label: '시키는 대로 한다', intent: 'risk',
        check: { base: 25, partial: 0.3, f: [['trait', 'careful', 8], ['stat', 'intelligence', 0.15]] },
        out: {
          success: { t: '막판에 은행 직원이 이상하다며 송금을 막아 주었다. 간신히 피했다.', log: '은행 직원 덕에 사기를 피함', hp: 2 },
          partial: { t: '반쯤 이체하다 정신이 번쩍 들어 멈췄다.', money: -300, hp: -6, sr: 10 },
          fail: { t: '모아 둔 돈 대부분이 사라졌다. 수치심과 분노에 한동안 잠을 이루지 못했다.', log: '보이스피싱으로 큰돈을 잃음', major: true, money: -1800, hp: -16, sr: 20, st: { mental: -2 } }
        } }
    ]
  });

  ch({
    id: 'd_stalker', risk: 0.2, ages: [18, 42], w: p => 0.6 + (p.gender === 'F' ? 0.8 : 0) + (has(p, 'had_breakup') ? 0.8 : 0), cd: 10, max: 1, icon: '👁️',
    if: p => has(p, 'had_breakup') || has(p, 'dating') || p.age >= 18,
    title: '집 앞의 그림자', text: '헤어진 뒤로도(혹은 한 번 호감을 거절한 뒤로도) 그 사람이 집 앞에서 기다리고, 하루에도 수십 통씩 연락해 온다. 이젠 퇴근길까지 따라온다.',
    choices: [
      { id: 'police', label: '스토킹으로 신고한다', intent: 'stability',
        check: { base: 56, partial: 0.4, f: [['support', 0.2], ['region', 'community', 0.15], ['trait', 'careful', 4]] },
        out: {
          success: { t: '접근금지 조치가 내려졌고, 그 사람은 더 이상 나타나지 않았다.', log: '스토킹을 신고해 접근금지 조치', hp: 4, sr: -4, st: { mental: 2 } },
          partial: { t: '경고 조치에 그쳤다. 한동안 불안한 마음으로 지냈다.', hp: -4, sr: 10 },
          fail: { t: '신고 이후 보복성 연락이 이어졌다. 결국 이사를 결심했다.', log: '스토킹 때문에 이사', hp: -12, sr: 18, money: -300, fn: p => { p.flags.moved_stalk = p.age; return ''; } }
        } },
      { id: 'move', label: '번호를 바꾸고 이사한다', intent: 'independence',
        out: { t: '모든 연락처를 정리하고 이사했다. 돈은 들었지만 숨통이 트였다.', log: '스토킹을 피해 이사', money: -250, hp: 2, sr: -2 } },
      { id: 'talk', label: '직접 만나 담판을 짓는다', intent: 'risk',
        check: { base: 24, partial: 0.4, f: [['stat', 'mental', 0.3]] },
        out: {
          success: { t: '단호하게 선을 그었다. 의외로 그 사람이 물러났다.', hp: 4 },
          partial: { t: '대화는 평행선이었다. 상황은 그대로다.', hp: -6, sr: 10 },
          fail: { t: '감정이 폭발해 위협까지 받았다. 곧바로 경찰에 신고할 수밖에 없었다.', log: '위협을 받고 신고', hp: -14, sr: 20, st: { mental: -3 } }
        } }
    ]
  });

  ch({
    id: 'd_dating_violence', risk: 0.7, ages: [19, 46], w: p => 2 + (has(p, 'home_unrest') ? 1.6 : 0) + (has(p, 'bullied') ? 0.8 : 0) + (p.stats.mental < 45 ? 1 : 0), cd: 10, max: 1, icon: '🥀',
    if: p => !!H.rel(p, 'partner') || !!H.rel(p, 'spouse'),
    title: '통제와 폭력', text: '사랑이라는 이름으로 휴대폰을 뒤지고, 친구를 못 만나게 하고, 화가 나면 물건을 던진다. 어제는 팔목을 세게 쥐었다. 멍이 아직 안 지워졌다.',
    choices: [
      { id: 'leave', label: '관계를 끊고 도움을 청한다', intent: 'independence',
        check: { base: 54, partial: 0.4, f: [['support', 0.25], ['stat', 'mental', 0.25], ['assets', 0.15]] },
        out: {
          success: { t: '힘들었지만 결국 끊어 냈다. 주변의 도움으로 안전하게 빠져나왔다. 비로소 숨이 쉬어졌다.', log: '폭력적인 관계를 끊어 냄', hp: 8, sr: -6, st: { mental: 3 }, fn: p => { if (H.rel(p, 'spouse')) LG.Rel.divorce(p); else LG.Rel.breakup(p); return ''; } },
          partial: { t: '정리하려 했지만 그 사람이 매달리고 협박해 시간이 오래 걸렸다.', log: '폭력적인 관계에서 힘겹게 벗어남', hp: -6, sr: 14, fn: p => { if (H.rel(p, 'spouse')) LG.Rel.divorce(p); else LG.Rel.breakup(p); return ''; } },
          fail: { t: '말을 꺼내자마자 상황이 더 나빠졌다. 몸도 마음도 크게 다쳤다.', log: '관계 정리 중 폭행을 당함', major: true, st: { health: -6, mental: -4 }, hp: -16, sr: 20, flag: 'crime_victim' }
        } },
      { id: 'stay', label: '"내가 잘하면 달라질 거야" 참고 지낸다', intent: 'stability',
        out: { t: '사과와 폭력의 반복 속에서 점점 작아졌다. 나를 지키는 법을 잊어 갔다.', log: '폭력적인 관계를 참고 이어 감', hp: -14, sr: 18, st: { mental: -3 }, rel: { friends: -8 } } },
      { id: 'friends', label: '가까운 사람들에게 털어놓는다', intent: 'family',
        out: { t: '친구들이 내 편이 되어 주었다. 혼자가 아니라는 걸 깨닫자 용기가 생겼다.', log: '주변에 알리고 도움을 구함', hp: 3, sr: -2, rel: { friends: 6 }, st: { mental: 1 } } }
    ]
  });

  ch({
    id: 'd_drunk_drive', risk: 0.4, ages: [24, 62], w: p => 0.9 + (tr(p, 'impulsive') ? 1.2 : 0) + (p.stress > 60 ? 0.5 : 0) + (p.urban ? 0 : 0.6), cd: 8, max: 1, icon: '🍺',
    if: p => p.age >= 24,
    title: '술자리 뒤 운전대', text: '회식이 길어졌다. 막차는 끊겼고 대리기사도 안 잡힌다. 맥주 두어 잔 정도는 괜찮을 것 같은데… 차 열쇠가 손에 쥐어져 있다.',
    choices: [
      { id: 'taxi', label: '차는 두고 택시로 간다', intent: 'stability', out: { t: '내일 아침 차를 찾으러 오는 게 번거로웠지만 마음은 편했다.', hp: 1, money: -5 } },
      { id: 'drive', label: '조심조심 운전한다', intent: 'risk',
        check: { base: 70, partial: 0.4, f: [['trait', 'careful', 6], ['trait', 'impulsive', -6]] },
        out: {
          success: { t: '무사히 집에 도착했다. 다음 날 아침 문득 소름이 돋았다.', hp: -1, sr: 4 },
          partial: { t: '음주 단속에 걸렸다. 면허정지와 벌금이 나왔다.', log: '음주운전 적발', flag: 'dui', hp: -10, sr: 14, money: -300, rel: { family: -4 } },
          fail: { t: '졸음운전 끝에 가드레일을 들이받았다. 크게 다치지 않은 것이 기적이었다. 면허는 취소되었다.', log: '음주운전 사고', major: true, flag: 'dui', st: { health: -8 }, hp: -16, sr: 20, money: -1200, rel: { family: -8 } }
        } }
    ]
  });

  ch({
    id: 'd_workplace_harass', risk: 0.3, ages: [22, 56], w: p => p.job ? 2.2 + (p.job.id === 'parttime' || p.job.id === 'service' ? 1 : 0) + (tr(p, 'introvert') ? 0.6 : 0) : 0, cd: 7, max: 2, icon: '🧯',
    if: p => !!p.job,
    title: '직장 내 괴롭힘', text: '새로 온 팀장이 회의마다 나를 공개적으로 깎아내리고, 일을 몰아주면서 성과는 가져간다. 메신저 읽씹, 점심 따돌림까지 이어지고 있다.',
    choices: [
      { id: 'report', label: '증거를 모아 정식으로 신고한다', intent: 'stability',
        check: { base: 46, partial: 0.4, f: [['trait', 'careful', 6], ['stat', 'mental', 0.25], ['perf', 0.15]] },
        out: {
          success: { t: '녹취와 메신저 기록을 모아 신고했다. 조사 끝에 팀장은 징계를 받았다. 사무실 공기가 달라졌다.', log: '직장 내 괴롭힘을 신고해 해결', hp: 8, sr: -6, st: { mental: 3 }, perf: 5 },
          partial: { t: '징계는 가벼웠고 한동안 어색한 사이가 이어졌다.', hp: -2, sr: 8 },
          fail: { t: '신고가 오히려 불이익으로 돌아왔다. 눈치가 더 심해졌다.', log: '신고했다가 보복성 인사를 받음', hp: -14, sr: 18, perf: -8 }
        } },
      { id: 'endure', label: '이를 악물고 버틴다', intent: 'stability',
        out: { t: '출근길 지하철에서 숨이 막혔다. 점점 일이 무서워졌다.', log: '직장 내 괴롭힘을 참고 견딤', hp: -10, sr: 16, st: { mental: -2 }, perf: -4 } },
      { id: 'leave', label: '이직·퇴사를 결정한다', intent: 'independence',
        out: { t: '명함을 내려놓고 사무실을 나왔다. 불안했지만 오랜만에 숨이 쉬어졌다.', log: '괴롭힘을 견디다 퇴사', hp: 2, sr: -4, fn: p => { LG.Outcome.quitJob(p, 'seeking'); return ''; } } }
    ]
  });

  auto({
    id: 'd_work_accident', risk: 0.6, ages: [20, 62], w: 1, rate: p => jobIs(p, 'factory', 'technician', 'driver', 'farmer', 'engineer', 'cook') ? 0.007 : (jobIs(p, 'parttime', 'service') ? 0.0015 : 0), cd: 10, max: 2, icon: '🦺',
    if: p => !!p.job,
    check: { base: 66, partial: 0.5, f: [['trait', 'careful', 6], ['health', 0.15], ['perf', 0.1]] },
    out: {
      success: { t: '작업 중 아찔한 사고가 날 뻔했다. 동료 덕에 무사했다. 그날 이후 안전수칙을 더 꼼꼼히 챙긴다.', sr: 6 },
      partial: { t: '작업 중 손을 다쳐 몇 주간 쉬었다. 산재 처리가 번거로웠다.', log: '작업 중 부상', st: { health: -6 }, money: -100, sr: 8 },
      fail: { t: '큰 산업재해를 당했다. 몇 달을 병원에서 보냈고, 몸은 예전 같지 않다.', log: '산업재해', major: true, st: { health: -14, physical: -5 }, money: -500, hp: -14, sr: 16, flag: 'injured' }
    }
  });

  ch({
    id: 'd_gambling', risk: 0.3, ages: [21, 56], w: p => 1.3 + (tr(p, 'impulsive') ? 2 : 0) + (H.cash(p) > 800 ? 0.5 : 0) + (p.stress > 55 ? 0.8 : 0) + (has(p, 'gambler') ? 1 : 0), cd: 8, max: 1, icon: '🎲',
    if: p => p.age >= 21 && H.cash(p) >= 100,
    title: '손쉬운 한 방', text: '직장 동료가 합법이라며 스포츠 베팅(혹은 불법 사이트) 이야기를 꺼냈다. "첫 달에 200 땄어." 휴대폰 화면에 화려한 배당표가 번쩍인다.',
    choices: [
      { id: 'try', label: '소액으로만 해 본다', intent: 'risk',
        check: { base: 38, partial: 0.5, f: [['trait', 'careful', 8], ['trait', 'impulsive', -12], ['stat', 'mental', 0.2]] },
        out: {
          success: { t: '조금 따고 바로 손을 뗐다. 다음에는 안 하겠다고 다짐했다.', log: '소액 도박 후 손을 뗌', money: 60, flag: 'gambler', hp: 2 },
          partial: { t: '조금 잃고 정신이 들어 그만뒀다.', log: '소액 도박으로 손실', money: -120, flag: 'gambler', hp: -3, sr: 6 },
          fail: { t: '잃은 돈을 되찾으려고 점점 판돈이 커졌다. 어느새 통장이 비어 갔다.', log: '도박에 빠짐', flag: ['gambler', 'gambling_debt'], money: -800, hp: -12, sr: 18, queue: [{ id: 'd_gambling_debt', in: 1 }] }
        } },
      { id: 'no', label: '"난 안 해." 단호하게 거절한다', intent: 'stability', out: { t: '몇 달 뒤 그 동료가 빚에 시달린다는 소문을 들었다. 거절하길 잘했다.', st: { mental: 1 }, hp: 1 } }
    ]
  });

  ch({
    id: 'd_gambling_debt', queued: true, ages: [21, 62], icon: '⛓️',
    title: '도박 빚', text: '대출 알림이 하루에도 여러 번 온다. 가족 몰래 돈을 빌렸고, 이자는 눈덩이처럼 불어났다. 이제는 어디서부터 어떻게 풀어야 할지 모르겠다.',
    choices: [
      { id: 'confess', label: '가족에게 고백하고 상담·회생 절차를 밟는다', intent: 'family',
        out: { t: '무릎 꿇고 사실을 털어놨다. 가족은 화냈지만 끝내 곁을 지켜 주었다. 개인회생과 도박중독 상담을 받았다.', log: '가족에게 고백하고 도박을 끊음', unflag: 'gambling_debt', hp: -4, sr: -2, debt: 800, debtKind: 'family', rel: { family: -4 }, flag: 'turned_around', st: { mental: 2 }, fn: p => { const x = LG.Loans.amount(p, 'private') + LG.Loans.amount(p, 'credit'); if (x) { LG.Loans.pay(p, x, ['private', 'credit']); LG.Loans.add(p, 'family', x); return `대부업·카드 빚 ${LG.U.money(x)}원을 가족이 먼저 갚아 주었다. 이제 가족에게 천천히 갚아 나간다.`; } return ''; } } },
      { id: 'borrow', label: '다른 곳에서 빌려 막는다', intent: 'risk',
        check: { base: 22, partial: 0.3, f: [['trait', 'careful', 5]] },
        out: {
          success: { t: '운 좋게 한 번에 정리되었다. 다신 안 하겠다고 맹세했다.', unflag: 'gambling_debt', hp: 2, sr: -2 },
          partial: { t: '돌려막기로 한 해를 버텼다. 마음은 지옥이다.', debt: 1500, debtKind: 'private', sr: 18, hp: -12 },
          fail: { t: '이자가 이자를 낳았다. 신용불량자가 되었고 직장에도 소문이 퍼졌다.', log: '도박 빚으로 신용불량', major: true, debt: 3500, debtKind: 'private', hp: -20, sr: 24, perf: -12, rel: { family: -10 } }
        } }
    ]
  });

  ch({
    id: 'd_drinking', risk: 0.7, ages: [28, 66], w: p => 1.2 + (p.stress > 60 ? 2 : 0) + (has(p, 'divorced') ? 1.2 : 0) + (has(p, 'burnout') ? 1 : 0) + (has(p, 'crime_victim') ? 1 : 0) + (has(p, 'home_unrest') ? 0.8 : 0), cd: 9, max: 1, icon: '🍶',
    if: p => p.stress > 45,
    title: '습관이 된 한 잔', text: '퇴근길 편의점에서 맥주 한 캔이 두 캔, 세 캔이 되었다. 주말엔 낮부터 마신다. 어느 날 아침, 손이 미세하게 떨리는 걸 알았다.',
    choices: [
      { id: 'quit', label: '병원·모임의 도움으로 끊는다', intent: 'health',
        check: { base: 46, partial: 0.5, f: [['stat', 'mental', 0.3], ['support', 0.3], ['rel', 'spouse', 0.1]] },
        out: {
          success: { t: '금주 모임에 나가기 시작했다. 아침이 선명해졌다. 하루하루가 새로웠다.', log: '술을 끊고 새 삶을 시작', flag: 'sober', st: { health: 4, mental: 3 }, hp: 8, sr: -8, money: -50 },
          partial: { t: '끊었다 이어지기를 반복한다. 그래도 방향은 잡았다.', hp: -2, sr: 6 },
          fail: { t: '의지만으로는 되지 않았다. 간 수치가 나빠졌고 가족과의 관계도 악화되었다.', log: '알코올 문제가 심해짐', flag: 'alcoholic', st: { health: -8 }, hp: -12, sr: 14, rel: { family: -8 }, perf: -6 }
        } },
      { id: 'cut', label: '스스로 양을 줄여 본다', intent: 'stability',
        check: { base: 34, partial: 0.5, f: [['stat', 'mental', 0.3], ['trait', 'careful', 6]] },
        out: {
          success: { t: '습관을 바꿨다. 술 대신 운동을 시작했다.', st: { health: 2 }, hp: 4 },
          partial: { t: '조금 줄었지만 여전히 위험한 선이다.', hp: -3, sr: 6 },
          fail: { t: '줄인다는 말뿐이었다. 상태가 더 나빠졌다.', flag: 'alcoholic', st: { health: -6 }, hp: -10, sr: 12 }
        } },
      { id: 'ignore', label: '"이 정도는 다들 마셔." 넘긴다', intent: 'rest',
        out: { t: '술이 유일한 위안이 되었다. 건강검진 결과표가 점점 두려워진다.', flag: 'alcoholic', st: { health: -5 }, hp: -6, sr: 8 } }
    ]
  });

  ch({
    id: 'd_loan_shark', risk: 1, ages: [22, 52], w: p => (p.debt > 3000 || p.money < -300 ? 2.8 : 0) + (poor(p) && H.cash(p) < 300 ? 1 : 0), cd: 9, max: 1, icon: '💸',
    if: p => p.debt > 2500 || H.cash(p) < 200,
    title: '급전의 유혹', text: '카드값과 월세가 겹쳐 당장 돈이 모자란다. 문자로 "당일 대출·무심사·신용불량 OK"라는 광고가 쉴 새 없이 온다. 은행은 문턱이 높다.',
    choices: [
      { id: 'family', label: '가족·지인에게 어렵게 부탁한다', intent: 'family',
        out: { t: '체면은 구겨졌지만 가족이 돈을 빌려줬다. "다음엔 먼저 말해." 따뜻한 한마디가 오래 남았다.', log: '가족에게 도움을 받음', debt: 500, debtKind: 'family', rel: { family: 2 }, hp: 1, sr: -2 } },
      { id: 'official', label: '서민금융·햇살론을 알아본다', intent: 'stability',
        check: { base: 56, partial: 0.4, f: [['stat', 'intelligence', 0.2], ['trait', 'careful', 5]] },
        out: {
          success: { t: '정부 서민금융으로 낮은 금리의 대출을 받았다. 한숨 돌렸다.', log: '서민금융으로 위기 넘김', debt: 600, debtKind: 'biz', hp: 2 },
          partial: { t: '한도가 낮아 일부만 해결되었다.', debt: 400, debtKind: 'biz', sr: 6 },
          fail: { t: '심사에서 탈락했다. 시간만 허비했다.', sr: 12, hp: -4 }
        } },
      { id: 'shark', label: '당일 대출을 받는다', intent: 'risk',
        check: { base: 24, partial: 0.3, f: [['trait', 'careful', 6]] },
        out: {
          success: { t: '합법 업체였고 다행히 빨리 갚았다. 식은땀을 흘렸다.', debt: 300, debtKind: 'private', sr: 4 },
          partial: { t: '이자가 상상 이상이었다. 갚느라 허덕인다.', debt: 900, debtKind: 'private', sr: 12, hp: -6 },
          fail: { t: '불법 사채였다. 협박 전화와 직장 문자까지 오기 시작했다. 인생이 무너지는 소리가 났다.', log: '불법 사채에 빠짐', major: true, debt: 3000, debtKind: 'private', hp: -18, sr: 24, perf: -10, flag: 'loan_shark' }
        } }
    ]
  });

  ch({
    id: 'd_depression', risk: 0.6, ages: [15, 68], w: p => 1 + (p.stress > 65 ? 3 : 0) + (p.happy < 35 ? 2.5 : 0) + (has(p, 'bullied') ? 1 : 0) + (has(p, 'crime_victim') ? 1.4 : 0) + (has(p, 'divorced') ? 1.2 : 0), cd: 10, max: 2, icon: '🌧️',
    if: p => p.stress > 55 || p.happy < 40,
    title: '아무것도 하기 싫은 날들', text: '이유를 딱히 꼽을 수 없는데 모든 것이 무겁다. 씻는 것도, 밥을 먹는 것도, 답장을 하는 것도 버겁다. 몇 주째 이렇다.',
    choices: [
      { id: 'clinic', label: '정신건강의학과를 찾는다', intent: 'health',
        out: { t: '진료실에 들어가기까지 한 시간이 걸렸다. 의사는 "충분히 나아질 수 있어요"라고 말했다. 약과 상담이 조금씩 효과를 냈다.', log: '우울증 치료를 시작', flag: 'counseled', hp: 6, sr: -10, st: { mental: 3 }, money: -120 } },
      { id: 'talk', label: '가까운 사람에게 털어놓는다', intent: 'family',
        check: { base: 55, partial: 0.4, f: [['support', 0.3], ['rel', 'friend', 0.1]] },
        out: {
          success: { t: '울면서 털어놓았다. 상대는 아무 말 없이 내 손을 잡아 주었다. 그것만으로도 한결 가벼워졌다.', hp: 6, sr: -6, rel: { friends: 4 } },
          partial: { t: '"기운 내"라는 말만 돌아왔다. 그래도 말을 꺼낸 건 처음이었다.', hp: 1, sr: 2 },
          fail: { t: '"의지가 약해서 그래"라는 말이 상처가 되었다.', hp: -8, sr: 10 }
        } },
      { id: 'alone', label: '혼자 이겨 내려 한다', intent: 'rest',
        check: { base: 28, partial: 0.5, f: [['stat', 'mental', 0.4], ['eff', 'sport', 0.1]] },
        out: {
          success: { t: '규칙적인 산책과 수면으로 천천히 나아졌다.', st: { mental: 2 }, hp: 4, sr: -6 },
          partial: { t: '나아졌다 나빠졌다를 반복한다.', hp: -4, sr: 8 },
          fail: { t: '몇 달을 더 어둠 속에서 지냈다. 일상이 멈춘 듯했다.', log: '우울의 늪에서 오래 헤맴', st: { mental: -4, health: -3 }, hp: -16, sr: 18, perf: -8 }
        } }
    ]
  });

  // ═════════════════════════ 과거가 돌아오다 ═════════════════════════

  ch({
    id: 'cb_bully_guilt', ages: [24, 55], w: 20, max: 1, icon: '🕰️',
    if: p => has(p, 'bully_joined'),
    title: '그때 그 아이', text: '동창회 단체방에 그때 그 아이의 소식이 올라왔다. 고등학교 때 우리가 괴롭히던 그 아이다. 지금은 잘 지낸다지만, 그 눈빛이 아직도 기억난다.',
    choices: [
      { id: 'sorry', label: '용기를 내어 사과 메시지를 보낸다', intent: 'family',
        check: { base: 42, partial: 0.5, f: [['stat', 'mental', 0.2], ['stat', 'social', 0.15]] },
        out: {
          success: { t: '한참 뒤 답장이 왔다. "사과해 줘서 고마워요. 이제는 괜찮아요." 눈물이 핑 돌았다.', log: '오랜 사과를 전하고 용서받음', hp: 12, sr: -8, st: { mental: 3 } },
          partial: { t: '읽음 표시만 떴다. 그래도 사과했다는 사실이 마음을 조금 풀어 주었다.', hp: 4 },
          fail: { t: '"이제 와서 뭘…" 차가운 답이 돌아왔다. 상처는 쉽게 사라지지 않는다는 걸 깨달았다.', hp: -6, sr: 8 }
        } },
      { id: 'forget', label: '그냥 모른 척한다', intent: 'rest', out: { t: '오래 묻어 둔 일이다. 하지만 마음 한구석은 계속 무겁다.', hp: -4, sr: 4 } }
    ]
  });

  ch({
    id: 'cb_record_hurdle', ages: [20, 32], w: 22, max: 1, icon: '🗂️',
    if: p => (has(p, 'juvenile_record') || has(p, 'school_violence_record') || has(p, 'probation')) && p.age >= 20 && (p.status === 'seeking' || p.job),
    title: '지워지지 않는 기록', text: '면접장에서 "학창 시절 징계나 처분 이력이 있느냐"는 질문을 받았다. 나이가 들어도 그날의 일이 따라다닌다.',
    choices: [
      { id: 'honest', label: '솔직하게 말하고 달라진 모습을 보여 준다', intent: 'stability',
        check: { base: 42, partial: 0.5, f: [['flag', 'turned_around', 12, '반성하고 달라짐'], ['stat', 'social', 0.2], ['stat', 'mental', 0.2]] },
        out: {
          success: { t: '진솔한 태도에 면접관이 고개를 끄덕였다. 기회를 얻었다.', log: '과거를 솔직히 밝히고 기회를 얻음', hp: 6, perf: 4, st: { mental: 2 } },
          partial: { t: '결과는 보류였다. 그래도 정직하게 말한 것은 후회되지 않는다.', hp: -1 },
          fail: { t: '결과는 불합격이었다. 과거의 일이 발목을 잡았다.', log: '과거 기록 때문에 탈락', hp: -10, sr: 12 }
        } },
      { id: 'hide', label: '말하지 않고 넘어간다', intent: 'risk',
        check: { base: 45, partial: 0.3, f: [['trait', 'careful', 4]] },
        out: {
          success: { t: '질문이 형식적이었다. 별일 없이 지나갔다. 마음은 계속 불안하다.', sr: 6 },
          partial: { t: '합격은 했지만 늘 들킬까 불안하다.', sr: 10, hp: -3 },
          fail: { t: '나중에 사실이 알려져 신뢰를 잃고 말았다.', log: '숨긴 과거가 드러남', hp: -12, sr: 16, perf: -10 }
        } }
    ]
  });
})(window.LG = window.LG || {});
