/* 이벤트 — 공부 → 대학 → 취업 말고도 인생은 많다
   아이돌 연습생 · 개그맨/배우 · 인터넷 방송인 · 은둔 · 돈 많은 백수 · 건물주 · 영재 조기유학/조기진학 · 천재 조기 창업
   (대부분 확률이 낮고, 재능·환경·과거 선택이 맞아야 문이 열린다. 성공해도 그 뒤의 갈림길이 이어진다) */
(function (LG) {
  const H = LG.EH, has = H.has, A = H.A;
  const S = H.S;
  const ch = H.pusher({ tier: 'choice', cat: 'altpath', label: '다른 길', w: 12, max: 1 });
  const gradeOf = (p, t) => (p.tgrade || {})[t] || 'common';
  const shining = (p, ts) => ts.find(t => p.found.indexOf(t) >= 0 && gradeOf(p, t) !== 'common' && !(p.blocked && p.blocked[t] != null));
  const genius = (p, ts) => ts.find(t => p.found.indexOf(t) >= 0 && gradeOf(p, t) === 'genius');
  const M = v => LG.U.money(v);

  // ═════════════ 아이돌 ═════════════
  ch({
    id: 'al_idol_cast', ages: [12, 17], w: p => 6 + (p.stats.social >= 60 ? 6 : 0) + (shining(p, ['music', 'sport', 'social']) ? 10 : 0), icon: '🎤', label: '꿈',
    if: p => p.status === 'student' && (p.stats.social >= 55 || A(p, 'music') >= 25 || p.talents.indexOf('music') >= 0 || p.stats.physical >= 62),
    title: '길거리 캐스팅', text: '학원 앞에서 명함을 받았다. 이름만 들어도 아는 기획사다. "오디션 한번 보러 올래요? 연습생은 3년, 데뷔하는 건 백 명 중 몇 명이에요."',
    choices: [
      { id: 'go', label: '연습생이 된다', intent: 'risk',
        check: { base: 30, partial: 0.4, f: [['stat', 'social', 0.25], ['stat', 'physical', 0.2], ['stat', 'creativity', 0.15], ['talent', 'music', 14], ['support', 0.15]] },
        out: {
          success: { t: '합격. 학교가 끝나면 연습실로 간다. 새벽까지 거울 앞에서 같은 동작을 수천 번 반복한다.', log: '기획사 연습생이 됨', major: true, flag: 'trainee', eff: { art: 20, sport: 10 }, sr: 14, hp: 8, queue: [{ id: 'al_idol_debut', in: 3 }] },
          partial: { t: '작은 기획사에 들어갔다. 연습실은 좁고 선배들은 지쳐 보인다.', log: '작은 기획사 연습생', flag: ['trainee', 'small_agency'], eff: { art: 12 }, sr: 12, queue: [{ id: 'al_idol_debut', in: 3 }] },
          fail: { t: '오디션에서 떨어졌다. "다음 기회에"라는 말이 오래 귀에 맴돌았다.', hp: -6 }
        } },
      { id: 'parents', label: '부모님께 먼저 여쭤본다', intent: 'family',
        check: { base: 40, partial: 0, f: [['support', 0.35], ['family', 0.3]] },
        out: { success: { t: '"네가 정말 원한다면." 부모님이 계약서를 같이 읽어 주셨다.', log: '부모님의 응원으로 연습생이 됨', flag: 'trainee', rel: { parents: 6 }, eff: { art: 14 }, queue: [{ id: 'al_idol_debut', in: 3 }] },
          fail: { t: '"공부나 해." 명함은 서랍 속에 들어갔다. 가끔 꺼내 본다.', rel: { parents: -4 }, hp: -4, flag: 'gave_up_once' } } },
      { id: 'no', label: '공부를 계속한다', intent: 'education', out: { t: '평범한 길을 택했다. 그래도 노래방에서는 늘 마이크를 놓지 않는다.', eff: { study: 6 } } }
    ]
  });

  ch({
    id: 'al_idol_debut', queued: true, tier: 'major', icon: '🌟', label: '꿈',
    if: p => has(p, 'trainee') && p.age >= 15,
    title: '데뷔조 최종 평가', text: p => `연습생 ${p.age - (p.flags.trainee || p.age)}년 차. 데뷔조 최종 평가 날이다. 같이 연습한 친구들 중 무대에 서는 건 다섯 명뿐이다.`,
    choices: [
      { id: 'all', label: '모든 걸 쏟아붓는다', intent: 'risk',
        check: { base: 14, partial: 0.5, f: [['eff', 'art', 0.3], ['stat', 'mental', 0.25], ['stat', 'social', 0.15], ['talent', 'music', 16], ['flag', 'small_agency', -6, '작은 기획사'], ['fn', p => gradeOf(p, 'music') === 'genius' ? { label: '타고난 천재성', v: 25 } : null]] },
        out: {
          success: { t: '데뷔가 확정됐다. 첫 음악방송 무대, 조명이 너무 밝아 객석이 보이지 않았다.', log: '아이돌 데뷔', major: true, achv: 10, hp: 18, sr: 10, unflag: 'trainee', flag: 'idol_debut', fn: p => { LG.Outcome.setJob(p, 'idol', { mul: has(p, 'small_agency') ? 0.6 : 1 }); p.queue.push({ id: 'al_idol_peak', at: p.age + 3 }); return ''; } },
          partial: { t: '데뷔는 했지만 아무도 우리를 모른다. 행사장 무대가 전부다.', log: '무명 아이돌로 데뷔', unflag: 'trainee', flag: 'idol_debut', sr: 14, fn: p => { LG.Outcome.setJob(p, 'idol', { mul: 0.4 }); p.queue.push({ id: 'al_idol_peak', at: p.age + 3 }); return ''; } },
          fail: { t: '데뷔조에서 빠졌다. 몇 년의 시간이 한 줄의 문자로 끝났다. 다시 교과서를 폈다.', log: '연습생 생활을 마침', major: true, unflag: 'trainee', flag: ['ex_trainee', 'gave_up_once'], hp: -14, sr: 16, eff: { study: -10 } }
        } },
      { id: 'quit', label: '스스로 그만두고 학업으로 돌아간다', intent: 'stability', out: { t: '연습실 키를 반납했다. 아쉽지만 후회는 없다.', unflag: 'trainee', flag: 'ex_trainee', hp: -1, eff: { study: 8 } } }
    ]
  });

  ch({
    id: 'al_idol_peak', queued: true, tier: 'major', icon: '📈', label: '무대',
    if: p => !!p.job && p.job.id === 'idol',
    title: '데뷔 3년 차', text: p => p.job.mul >= 1 ? '음원 차트 1위. 팬미팅 티켓이 1분 만에 매진됐다. 하지만 하루 세 시간 자는 날들이 이어진다.' : '여전히 무명이다. 멤버 중 한 명이 탈퇴를 고민한다는 이야기가 들린다.',
    choices: [
      { id: 'push', label: '쉬지 않고 활동을 이어 간다', intent: 'career',
        check: { base: 34, partial: 0.4, f: [['stat', 'mental', 0.3], ['health', 0.25], ['fn', p => ({ label: '지금의 인기', v: (p.job.mul - 1) * 15 })]] },
        out: { success: { t: '해외 투어까지 이어졌다. 이름만 대면 아는 그룹이 됐다.', log: '정상에 오른 아이돌', major: true, achv: 14, hp: 10, flag: 'famous', fn: H.mulJob(3) },
          fail: { t: '무대 위에서 쓰러졌다. 공황장애 진단을 받고 활동을 중단했다.', log: '활동 중 쓰러짐', st: { health: -10, mental: -6 }, hp: -16, sr: 20, fn: H.mulJob(0.6) } } },
      { id: 'solo', label: '연기·예능으로 영역을 넓힌다', intent: 'adventure',
        check: { base: 40, partial: 0.4, f: [['stat', 'social', 0.3], ['stat', 'creativity', 0.2]] },
        out: { success: { t: '드라마 조연으로 얼굴을 알렸다. 아이돌 출신 배우라는 수식어가 붙었다.', log: '배우로 전향', achv: 8, fn: p => { LG.Outcome.setJob(p, 'entertainer', { mul: Math.max(1, p.job.mul) }); return ''; } },
          fail: { t: '연기력 논란이 따라붙었다. 다시 무대로 돌아갔다.', hp: -8, sr: 10 } } },
      { id: 'leave', label: '계약을 끝내고 평범한 삶으로', intent: 'stability', out: { t: '마지막 콘서트에서 팬들에게 인사했다. 이제 나를 아는 사람이 적은 곳에서 산다.', log: '아이돌 은퇴', quit: true, hp: 4, sr: -16, flag: 'ex_idol' } }
    ]
  });

  // ═════════════ 개그맨 · 배우 ═════════════
  ch({
    id: 'al_showbiz', ages: [19, 32], w: p => 5 + (p.stats.social >= 65 ? 6 : 0) + (p.stats.creativity >= 65 ? 5 : 0) + (has(p, 'ex_trainee') || has(p, 'ex_idol') ? 8 : 0), icon: '🎭', label: '꿈',
    if: p => p.liveIn !== 'abroad' && p.status !== 'military' && (!p.job || p.job.years <= 3) && (p.stats.social >= 58 || p.stats.creativity >= 60 || has(p, 'ex_trainee') || A(p, 'people') >= 40),
    title: '무대에 서고 싶다', text: '방송사 개그맨 공채 공고와 드라마 오디션 공고가 동시에 눈에 들어왔다. 친구들은 "너 진짜 웃기잖아"라고 한다. 안정적인 길과는 거리가 멀다.',
    choices: [
      { id: 'comedy', label: '개그맨 공채에 도전한다', intent: 'risk',
        check: { base: 12, partial: 0.5, f: [['stat', 'social', 0.3], ['stat', 'creativity', 0.3], ['trait', 'extrovert', 8], ['fn', p => ({ label: '재수(경험)', v: (p.done.al_showbiz || 0) * 4 })]] },
        out: { success: { t: '공채 합격. 첫 녹화에서 관객이 웃음을 터뜨리는 순간, 이게 내 길이라는 걸 알았다.', log: '개그맨 공채 합격', major: true, achv: 8, hp: 16, flag: 'comedian', fn: p => { LG.Outcome.setJob(p, 'entertainer', { mul: 0.7 }); p.queue.push({ id: 'al_fame', at: p.age + 4 }); return ''; } },
          partial: { t: '최종에서 떨어졌다. 대신 대학로 소극장에서 공연을 시작했다.', log: '소극장 무대에 섬', flag: 'stage_actor', fn: p => { if (!p.job) LG.Outcome.setJob(p, 'parttime'); return ''; } },
          fail: { t: '1차에서 떨어졌다. 웃기는 것과 웃기는 걸 업으로 하는 건 달랐다.', hp: -8 } } },
      { id: 'actor', label: '배우 오디션을 본다', intent: 'risk',
        check: { base: 10, partial: 0.5, f: [['stat', 'creativity', 0.3], ['stat', 'mental', 0.2], ['stat', 'social', 0.2], ['flag', 'ex_trainee', 6, '연습생 경험']] },
        out: { success: { t: '단역으로 시작했다. 대사 한 줄을 백 번 연습했다. 감독이 이름을 기억해 줬다.', log: '배우로 데뷔', major: true, achv: 6, hp: 14, fn: p => { LG.Outcome.setJob(p, 'entertainer', { mul: 0.5 }); p.queue.push({ id: 'al_fame', at: p.age + 5 }); return ''; } },
          fail: { t: '오디션만 스무 번. 연락은 오지 않았다.', hp: -8, sr: 8 } } },
      { id: 'no', label: '취미로만 남긴다', intent: 'stability', out: { t: '회식 자리의 스타로 만족하기로 했다.', rel: { friends: 4 } } }
    ]
  });

  ch({
    id: 'al_fame', queued: true, tier: 'major', icon: '📺', label: '방송',
    if: p => !!p.job && p.job.id === 'entertainer',
    title: '뜰 것인가, 잊힐 것인가', text: '예능 프로그램에서 고정 출연 제안이 왔다. 대신 사생활이 카메라에 노출되고, 한 번의 말실수가 모든 걸 무너뜨릴 수 있다.',
    choices: [
      { id: 'yes', label: '출연한다', intent: 'career',
        check: { base: 30, partial: 0.4, f: [['stat', 'social', 0.3], ['stat', 'creativity', 0.2], ['stat', 'mental', 0.2]] },
        out: { success: { t: '캐릭터가 대박이 났다. 광고가 줄을 잇는다. 길을 걸으면 사람들이 알아본다.', log: '예능 대박으로 스타가 됨', major: true, achv: 14, hp: 12, flag: 'famous', fn: H.mulJob(4) },
          partial: { t: '반응은 미지근했다. 그래도 얼굴은 조금 알렸다.', fn: H.mulJob(1.4) },
          fail: { t: '방송에서 한 말이 논란이 됐다. 하차하고 한동안 숨어 지냈다.', log: '방송 논란으로 하차', hp: -16, sr: 20, fn: H.mulJob(0.5) } } },
      { id: 'no', label: '연기·무대에만 집중한다', intent: 'stability', out: { t: '조용히 내 일을 했다. 큰돈은 없어도 오래 할 수 있는 길이다.', fn: H.mulJob(1.1), achv: 3 } }
    ]
  });

  // ═════════════ 인터넷 방송인 ═════════════
  ch({
    id: 'al_stream', ages: [17, 42], w: p => 6 + (has(p, 'gamer_dream') || has(p, 'game_addict') ? 8 : 0) + (p.status === 'seeking' ? 5 : 0) + (p.stats.social >= 62 ? 4 : 0), icon: '🎥', label: '방송',
    if: p => (!p.job || p.job.id !== 'creator') && p.status !== 'military' && (A(p, 'tech') >= 20 || p.stats.creativity >= 58 || p.stats.social >= 60 || has(p, 'gamer_dream') || has(p, 'game_addict')),
    title: '방송 한번 켜 볼까', text: '게임하는 화면, 요리하는 손, 수다 떠는 얼굴. 그냥 켜 놓기만 해도 구독자가 생긴다는 사람이 있다. 카메라는 십만 원이면 산다.',
    choices: [
      { id: 'full', label: '전업 방송인이 된다', intent: 'risk',
        check: { base: 14, partial: 0.5, f: [['stat', 'creativity', 0.3], ['stat', 'social', 0.3], ['flag', 'gamer_dream', 8, '게임 실력'], ['eff', 'work', 0.15]] },
        out: { success: { t: '첫 달에 구독자 만 명. 후원 알림 소리가 끊이지 않는 밤도 있다.', log: '인터넷 방송인으로 성공', major: true, achv: 8, hp: 14, quit: 'seeking', fn: p => { LG.Outcome.setJob(p, 'creator', { mul: 1.2 }); p.queue.push({ id: 'al_stream_check', at: p.age + 2 }); return ''; } },
          partial: { t: '시청자 열 명. 그래도 매일 켠다. 이 열 명이 소중하다.', log: '전업 방송 시작', quit: 'seeking', fn: p => { LG.Outcome.setJob(p, 'creator', { mul: 0.4 }); p.queue.push({ id: 'al_stream_check', at: p.age + 2 }); return ''; } },
          fail: { t: '석 달 동안 시청자가 거의 없었다. 장비는 중고로 팔았다.', money: -150, hp: -6 } } },
      { id: 'side', label: '퇴근 후 부업으로', intent: 'hobby', out: { t: '주말마다 영상을 올린다. 용돈벌이 정도지만 재미있다.', money: 200, hp: 4, eff: { art: 6 } } },
      { id: 'no', label: '보는 쪽이 편하다', intent: 'rest', out: { t: '오늘도 남의 방송을 보며 잠들었다.', hp: 0 } }
    ]
  });

  ch({
    id: 'al_stream_check', queued: true, tier: 'major', icon: '📊', label: '방송',
    if: p => !!p.job && p.job.id === 'creator',
    title: '방송 2년 차', text: p => p.job.mul >= 1 ? '구독자 30만. 하지만 악플과 조회수 압박에 하루도 쉬지 못한다.' : '구독자는 제자리다. 매일 밤 "이게 맞나" 생각한다.',
    choices: [
      { id: 'brand', label: '팀을 꾸려 채널을 키운다', intent: 'career',
        check: { base: 30, partial: 0.4, f: [['stat', 'creativity', 0.3], ['stat', 'mental', 0.2], ['fn', p => ({ label: '지금의 채널', v: (p.job.mul - 1) * 15 })]] },
        out: { success: { t: '구독자 100만. 실버 버튼 옆에 골드 버튼이 놓였다.', log: '구독자 100만 달성', major: true, achv: 12, flag: 'famous', fn: H.mulJob(3) },
          fail: { t: '무리한 콘텐츠가 논란이 됐다. 사과 영상을 찍었다.', hp: -12, sr: 16, fn: H.mulJob(0.5) } } },
      { id: 'rest', label: '건강을 위해 업로드를 줄인다', intent: 'health', out: { t: '일주일에 두 번만 올리기로 했다. 숫자는 줄었지만 잠은 늘었다.', sr: -12, fn: H.mulJob(0.8) } },
      { id: 'quit', label: '방송을 접고 회사에 들어간다', intent: 'stability', out: { t: '마지막 방송에서 고맙다고 인사했다. 편집 실력 덕분에 영상 회사에 취업했다.', log: '방송을 접고 취업', fn: p => { LG.Outcome.setJob(p, 'designer'); return ''; } } }
    ]
  });

  // ═════════════ 은둔 ═════════════
  ch({
    id: 'al_recluse', ages: [20, 40], w: p => 4 + (p.stats.mental < 40 ? 8 : 0) + (p.stats.social < 40 ? 6 : 0) + ((p.seekTries || 0) >= 3 ? 10 : 0), max: 2, cd: 4, icon: '🚪', label: '마음',
    if: p => !p.job && (p.status === 'seeking' || p.status === 'idle') && (p.seekTries || 0) >= 2 && !has(p, 'recluse_now'),
    title: '방문을 닫다', text: '이력서를 넣고 떨어지기를 몇 번이나 반복했다. 어느 날부터 방 밖으로 나가는 게 무서워졌다. 낮과 밤이 바뀌었다.',
    choices: [
      { id: 'shut', label: '아무도 만나지 않는다', intent: 'rest',
        out: { t: '방 안에서 몇 달이 지나갔다. 창문 너머 계절이 바뀌는 것만 알았다.', log: '방에 틀어박힘', major: true, flag: 'recluse_now', status: 'recluse', hp: -12, st: { social: -8, mental: -4 }, rel: { parents: -8, friends: -12 }, queue: [{ id: 'al_recluse_out', in: 2 }] } },
      { id: 'online', label: '온라인에서만 사람을 만난다', intent: 'hobby', out: { t: '게임 속 길드원들이 유일한 친구다. 그래도 누군가와 이야기는 한다.', flag: 'recluse_now', status: 'recluse', hp: -4, st: { social: -3 }, queue: [{ id: 'al_recluse_out', in: 2 }] } },
      { id: 'reach', label: '용기를 내 상담센터에 전화한다', intent: 'health', out: { t: '"전화해 줘서 고마워요." 그 한마디에 눈물이 났다. 매주 한 번 밖에 나가기로 약속했다.', log: '은둔의 문턱에서 도움을 청함', sr: -12, hp: 6, st: { mental: 3 } } }
    ]
  });

  ch({
    id: 'al_recluse_out', queued: true, tier: 'major', icon: '🌤️', label: '마음',
    if: p => has(p, 'recluse_now'),
    title: '문밖으로', text: p => `방에 틀어박힌 지 ${p.age - (p.flags.recluse_now || p.age)}년. ${LG.Rel.parents(p).length ? '{parent}가 방문 앞에 밥상을 두고 간다. 오늘은 쪽지가 함께 있었다. "천천히 나와도 돼."' : '통장 잔고가 바닥을 보인다.'}`,
    choices: [
      { id: 'step', label: '편의점까지만 나가 본다', intent: 'health',
        check: { base: 45, partial: 0.4, f: [['support', 0.3], ['stat', 'mental', 0.3], ['rel', 'mother', 0.15]] },
        out: { success: { t: '편의점, 동네 공원, 도서관. 한 걸음씩 멀리 갔다. 반년 뒤 작은 일자리를 구했다.', log: '은둔을 끝내고 다시 세상으로', major: true, unflag: 'recluse_now', flag: 'turned_around', hp: 14, st: { mental: 4 }, fn: p => { p.status = 'seeking'; LG.Outcome.setJob(p, 'parttime'); return ''; } },
          fail: { t: '현관 앞에서 숨이 막혀 돌아왔다. 그래도 문고리까지는 잡아 봤다.', hp: -2, queue: [{ id: 'al_recluse_out', in: 2 }] } } },
      { id: 'stay', label: '아직은 아니다', intent: 'rest', out: { t: '하루가 또 지나갔다.', hp: -6, st: { health: -3 }, queue: [{ id: 'al_recluse_out', in: 3 }] } }
    ]
  });

  // ═════════════ 돈 많은 백수 ═════════════
  ch({
    id: 'al_rich_idle', ages: [25, 58], w: 30, icon: '🛋️', label: '돈',
    if: p => !!p.job && S().netWorth(p) >= 200000 && !has(p, 'rich_idle') && p.status === 'working',
    title: '이제 일 안 해도 되는데?', text: p => `순자산이 ${M(S().netWorth(p))}원. ${p.done.a_lottery ? '복권 당첨이 인생을 바꿔 놓았다.' : '계산해 보니 평생 일하지 않아도 굶지는 않는다.'} 아침마다 출근길에 이 생각이 든다.`,
    choices: [
      { id: 'quit', label: '사표를 내고 하고 싶은 것만 한다', intent: 'rest',
        out: { t: '사직서를 내던 날 하늘이 유난히 파랬다. 오늘부터 나는 돈 많은 백수다.', log: '돈 많은 백수가 됨', major: true, quit: 'idle', flag: 'rich_idle', hp: 14, sr: -24, queue: [{ id: 'al_idle_life', in: 3 }] } },
      { id: 'half', label: '일은 줄이고 여유를 늘린다', intent: 'health', out: { t: '주 3일만 일하기로 했다. 남는 시간엔 배우고 싶던 걸 배운다.', hp: 8, sr: -10, perf: -6, fn: H.mulJob(0.7) } },
      { id: 'keep', label: '일이 곧 나다, 계속한다', intent: 'career', out: { t: '돈 때문이 아니라 재미로 일하니 오히려 더 잘 된다.', achv: 3, hp: 3 } }
    ]
  });

  ch({
    id: 'al_idle_life', queued: true, tier: 'choice', icon: '🏝️', label: '백수의 삶',
    if: p => has(p, 'rich_idle') && !p.job,
    title: '백수 3년 차', text: '골프, 여행, 맛집. 처음 1년은 천국이었다. 요즘은 가끔 "나는 뭘 하는 사람이지?"라는 생각이 든다. 주변엔 돈을 노리고 접근하는 사람도 늘었다.',
    choices: [
      { id: 'give', label: '재단을 만들어 의미 있는 일에 쓴다', intent: 'social', out: { t: '장학 재단을 세웠다. 아이들의 편지를 받는 날이 제일 좋다.', log: '장학 재단 설립', flag: 'donor', achv: 8, hp: 12, money: -5000 } },
      { id: 'invest', label: '지인이 권한 투자처에 큰돈을 넣는다', intent: 'risk',
        check: { base: 30, partial: 0, f: [['stat', 'intelligence', 0.25], ['flag', 'investor', 8, '투자 경험']] },
        out: { success: { t: '운 좋게 대박이 났다. 돈이 돈을 번다는 말을 실감했다.', money: 8000, hp: 6 },
          fail: { t: '사기였다. 지인은 사라졌고, 재산의 절반이 날아갔다.', log: '투자 사기로 재산 절반을 잃음', major: true, hp: -18, sr: 20, fn: p => { p.money = Math.round(p.money * 0.5); if (p.inv) LG.Invest.KEYS.forEach(k => { p.inv[k] = Math.round((p.inv[k] || 0) * 0.5); }); return ''; } } } },
      { id: 'enjoy', label: '눈치 보지 않고 즐긴다', intent: 'rest', out: { t: '세계 일주를 두 번 했다. 사진첩이 열 권이 넘는다.', exp: 10, hp: 8, money: -3000 } },
      { id: 'work', label: '다시 일을 찾는다', intent: 'career', out: { t: '작은 회사를 차려 다시 출근한다. 할 일이 있다는 게 이렇게 좋을 줄이야.', unflag: 'rich_idle', fn: p => { LG.Outcome.setJob(p, 'ceo', { mul: 0.6 }); p.queue.push({ id: 'w_business_check', at: p.age + 3 }); return ''; } } }
    ]
  });

  // ═════════════ 건물주 ═════════════
  ch({
    id: 'al_building', ages: [27, 55], w: p => p.family.ext > 0 ? 40 : 14, icon: '🏢', label: '집안',
    if: p => (p.family.tier >= 5 || p.family.ext > 0) && LG.Rel.parents(p).length > 0 && !p.bldg && p.liveIn !== 'abroad',
    title: '건물을 물려주시겠단다', text: p => `{parent}가 부르셨다. "세금 문제도 있고, 미리 넘겨 두려고 한다." ${p.family.ext > 0 ? '강남의 빌딩 한 채' : '역세권 상가 건물'}의 등기 서류가 탁자 위에 놓여 있었다.`,
    choices: [
      { id: 'landlord', label: '받아서 건물주로 산다 (일은 그만둔다)', intent: 'rest',
        out: { t: '', log: '건물을 증여받아 건물주가 됨', major: true, hp: 12, rel: { parents: 6 }, flag: 'landlord', fn: p => { const v = p.family.ext > 0 ? 300000 : 120000; const tax = Math.round(v * 0.32); p.bldg = { value: v, yield: 0.032, label: p.family.ext > 0 ? '강남 빌딩' : '상가 건물' }; LG.Loans.add(p, 'biz', Math.round(tax * 0.5), { term: 10 }); p.money -= Math.round(tax * 0.5); if (p.job) LG.Outcome.quitJob(p, 'idle'); else p.status = 'idle'; return `증여세 ${M(tax)}원을 내고(절반은 대출) 등기를 넘겨받았다. 매달 월세가 들어온다.`; } } },
      { id: 'both', label: '받되, 내 일은 계속한다', intent: 'career',
        out: { t: '', log: '건물을 증여받음', hp: 8, rel: { parents: 4 }, flag: 'landlord', fn: p => { const v = p.family.ext > 0 ? 300000 : 120000; const tax = Math.round(v * 0.32); p.bldg = { value: v, yield: 0.032, label: p.family.ext > 0 ? '강남 빌딩' : '상가 건물' }; LG.Loans.add(p, 'biz', Math.round(tax * 0.5), { term: 10 }); p.money -= Math.round(tax * 0.5); return '월세는 통장에 차곡차곡 쌓인다. 출근은 여전히 한다.'; } } },
      { id: 'refuse', label: '사양하고 내 힘으로 살겠다', intent: 'independence', out: { t: '"제 힘으로 해 보고 싶어요." {parent}가 한참 나를 바라보다 웃으셨다.', rel: { parents: 2 }, st: { mental: 3 }, hp: 4 } }
    ]
  });

  ch({
    id: 'al_bldg_trouble', ages: [30, 85], w: 12, cd: 8, max: 2, icon: '🏚️', label: '건물',
    if: p => !!p.bldg,
    title: '건물주도 고민은 있다', text: p => `${p.bldg.label}의 1층 가게가 나간 지 반년째 비어 있다. 임차인들은 월세를 깎아 달라고 하고, 건물은 리모델링이 필요하다.`,
    choices: [
      { id: 'cut', label: '월세를 낮춰 상생한다', intent: 'social', out: { t: '임차인들이 고맙다며 떡을 돌렸다. 수익은 줄었지만 공실이 사라졌다.', hp: 6, rel: { friends: 4 }, fn: p => { p.bldg.yield = Math.max(0.022, p.bldg.yield - 0.004); return ''; } } },
      { id: 'remodel', label: '대출로 리모델링해 가치를 올린다', intent: 'risk',
        check: { base: 55, partial: 0, f: [['stat', 'intelligence', 0.2], ['region', 'job', 0.2]] },
        out: { success: { t: '새 단장 후 유명 브랜드가 입점했다. 건물값이 올랐다.', fn: p => { LG.Loans.add(p, 'biz', 8000, { term: 10 }); p.bldg.value = Math.round(p.bldg.value * 1.18); p.bldg.yield += 0.003; return ''; } },
          fail: { t: '공사비만 들고 공실은 그대로다.', sr: 12, fn: p => { LG.Loans.add(p, 'biz', 8000, { term: 10 }); return ''; } } } },
      { id: 'sell', label: '팔고 현금으로 바꾼다', intent: 'money', out: { t: '', log: '건물을 매각', fn: p => { const v = Math.round(p.bldg.value * 0.95); p.money += v; p.bldg = null; return `${M(v)}원에 건물을 넘겼다. 신경 쓸 일은 줄었다.`; } } }
    ]
  });

  // ═════════════ 영재: 조기유학 · 조기진학 ═════════════
  ch({
    id: 'al_prodigy_abroad', ages: [8, 14], w: 40, icon: '🎻', label: '영재',
    if: p => !!shining(p, ['music', 'art', 'sport']),
    title: p => `${LG.DATA.talents[shining(p, ['music', 'art', 'sport'])].name} 영재`, text: p => { const t = shining(p, ['music', 'art', 'sport']); return `${gradeOf(p, t) === 'genius' ? '해외 유명 음악원·아카데미에서' : '국내 영재교육원에서'} 연락이 왔다. ${LG.DATA.talents[t].name} 재능을 제대로 키워 보자고 한다. ${p.family.tier <= 2 && p.family.ext <= 0 ? '학비와 체류비는 집안 형편으로는 꿈도 못 꿀 금액이다.' : ''}`; },
    choices: [
      { id: 'abroad', label: '어린 나이에 해외 유학을 떠난다', intent: 'adventure', if: p => gradeOf(p, shining(p, ['music', 'art', 'sport'])) === 'genius' || p.family.tier >= 4 || p.family.ext > 0,
        check: { base: 40, partial: 0.4, f: [['fn', p => ({ label: '재능의 등급', v: gradeOf(p, shining(p, ['music', 'art', 'sport'])) === 'genius' ? 30 : 10 })], ['stat', 'mental', 0.25], ['support', 0.2]] },
        out: { success: { t: '낯선 나라의 연습실에서 매일 여덟 시간을 보냈다. 선생님이 "이 아이는 세계 무대에 설 것"이라고 했다.', log: '영재 조기유학', major: true, flag: ['prodigy_trained', 'early_abroad', 'abroad_exp', 'talent_funded'], eff: { art: 30, sport: 20 }, achv: 6, rel: { parents: -4, friends: -10 }, queue: [{ id: 'al_prodigy_stage', in: 6 }] },
          fail: { t: '외로움을 견디지 못했다. 1년 만에 돌아왔다. 악기 케이스를 한동안 열지 않았다.', hp: -12, sr: 16, flag: 'early_abroad' } } },
      { id: 'local', label: '국내 영재교육원에서 키운다', intent: 'education',
        out: { t: '주말마다 영재교육원에 다닌다. 같은 재능을 가진 친구들을 처음 만났다.', log: '영재교육원 입학', flag: ['prodigy_trained', 'talent_funded'], eff: { art: 18, sport: 12 }, achv: 3, queue: [{ id: 'al_prodigy_stage', in: 7 }] } },
      { id: 'normal', label: '평범한 어린 시절을 지켜 준다', intent: 'family', out: { t: '"재능보다 행복이 먼저야." 부모님은 나를 평범한 아이로 키우기로 했다.', rel: { parents: 6, friends: 4 }, hp: 4 } }
    ]
  });

  ch({
    id: 'al_prodigy_stage', queued: true, tier: 'major', icon: '🏆', label: '영재',
    if: p => has(p, 'prodigy_trained') && !!shining(p, ['music', 'art', 'sport']),
    title: '국제 무대', text: p => { const t = shining(p, ['music', 'art', 'sport']); return t === 'music' ? '세계적인 국제 콩쿠르 결선 무대. 객석에 심사위원들이 앉아 있다.' : t === 'art' ? '해외 유명 갤러리에서 최연소 개인전을 열자는 제안이 왔다.' : '국가대표 선발전. 최연소 출전이다.'; },
    choices: [
      { id: 'go', label: '모든 것을 건다', intent: 'risk',
        check: { base: 24, partial: 0.4, f: [['fn', p => ({ label: '재능의 등급', v: gradeOf(p, shining(p, ['music', 'art', 'sport'])) === 'genius' ? 40 : 14 })], ['eff', 'art', 0.2], ['eff', 'sport', 0.2], ['stat', 'mental', 0.25]] },
        out: { success: { t: '', log: '세계 무대에서 이름을 알림', major: true, achv: 20, hp: 18, flag: ['famous', 'world_stage'], fn: p => { const t = shining(p, ['music', 'art', 'sport']); const job = t === 'music' ? 'musician' : t === 'art' ? 'artist' : 'athlete'; LG.Outcome.setJob(p, job, { mul: 3 }); return t === 'music' ? '우승. 시상대 위에서 국기가 올라갔다. 다음 날 아침 모든 신문 1면에 얼굴이 실렸다.' : t === 'art' ? '전시는 매진됐다. 세계적인 미술관이 작품을 소장하겠다고 했다.' : '최연소 국가대표. 그리고 첫 국제 대회 금메달.'; } },
          partial: { t: '입상했다. 세계 무대의 문턱을 넘었다.', log: '국제 무대 입상', achv: 10, hp: 8, flag: 'world_stage' },
          fail: { t: '긴장 끝에 실수를 했다. 무대 뒤에서 한참을 울었다. 그래도 다음이 있다.', hp: -12, sr: 16 } } },
      { id: 'study', label: '아직은 배움에 집중한다', intent: 'education', out: { t: '서두르지 않기로 했다. 무대는 언제든 다시 온다.', eff: { art: 10 }, st: { mental: 2 } } }
    ]
  });

  ch({
    id: 'al_early_college', ages: [12, 16], w: 40, icon: '🧮', label: '영재',
    if: p => p.status === 'student' && !!shining(p, ['math', 'language', 'writing']) && (gradeOf(p, shining(p, ['math', 'language', 'writing'])) === 'genius' || p.stats.intelligence >= 82),
    title: '조기 진학 제안', text: p => `영재학교 선생님이 말했다. "이 아이는 고등학교 과정을 기다릴 필요가 없습니다. ${p.age}살이지만 대학 수업을 들을 수 있어요." 과학고·영재학교를 건너뛰고 대학에 바로 들어가는 길이다.`,
    choices: [
      { id: 'go', label: '조기 입학한다', intent: 'education',
        check: { base: 50, partial: 0.3, f: [['stat', 'intelligence', 0.4], ['eff', 'study', 0.2], ['stat', 'mental', 0.2]] },
        out: { success: { t: '', log: '최연소 대학 입학', major: true, achv: 10, hp: 10, flag: ['early_college', 'college'], rel: { friends: -10 }, st: { social: -3 }, fn: p => { p.edu = 'high'; p.status = 'college'; p.major = shining(p, ['math', 'language', 'writing']) === 'math' ? 'sci' : 'lang'; p.college = { end: p.age + 4, kind: 'univ' }; p.queue.push({ id: 'al_young_phd', at: p.age + 4 }); return `${p.age}살, 대학 신입생. 동기들은 나를 "꼬마 박사"라고 불렀다. 강의실에서는 어른이고, 쉬는 시간에는 혼자였다.`; } },
          fail: { t: '입학은 했지만 어린 나이에 대학 생활은 버거웠다. 한 학기 만에 학교로 돌아왔다.', hp: -10, sr: 12 } } },
      { id: 'normal', label: '또래와 함께 자라는 게 먼저다', intent: 'family', out: { t: '친구들과 같은 교복을 입기로 했다. 남는 시간엔 혼자 대학 강의를 듣는다.', eff: { study: 10 }, rel: { friends: 6 } } }
    ]
  });

  ch({
    id: 'al_young_phd', queued: true, tier: 'major', icon: '🎓', label: '영재',
    if: p => has(p, 'early_college'),
    title: '스무 살 무렵의 갈림길', text: p => `${p.age}살에 학위를 받았다. 해외 대학원 교수들이 연락을 해 온다. 한편으로는 실리콘밸리 창업 이야기도 들린다.`,
    choices: [
      { id: 'phd', label: '해외 박사 과정에 간다', intent: 'education', out: { t: '최연소 박사 과정생. 논문이 국제 학술지에 실렸다.', log: '최연소 박사 과정', achv: 12, flag: ['study_abroad', 'grad_school'], fn: p => { p.status = 'college'; p.college = { end: p.age + 4, kind: 'grad' }; p.liveIn = 'abroad'; p.home = 'abroad'; p.queue.push({ id: 'gl_after_study', at: p.age + 4 }); return ''; } } },
      { id: 'startup', label: '바로 창업한다', intent: 'risk', out: { t: '기숙사 방에서 회사를 시작했다.', log: '스무 살 창업', flag: 'genius_founder', fn: p => { LG.Outcome.setJob(p, 'ceo', { mul: 0.7 }); p.queue.push({ id: 'w_business_check', at: p.age + 3 }); return ''; } } },
      { id: 'job', label: '연구소에 들어간다', intent: 'stability', out: { t: '국책 연구소가 나를 데려갔다.', fn: p => { LG.Outcome.setJob(p, 'researcher', { mul: 1.3 }); return ''; } } }
    ]
  });

  // ═════════════ 천재의 조기 창업 ═════════════
  ch({
    id: 'al_genius_startup', ages: [17, 30], w: 30, icon: '🚀', label: '창업',
    if: p => !has(p, 'genius_founder') && p.status !== 'military' && (!!genius(p, ['math', 'entrepreneur', 'mechanical']) || (!!shining(p, ['math', 'entrepreneur', 'mechanical']) && A(p, 'tech') >= 40)),
    title: '세상을 바꿀 아이디어', text: '밤새 만든 프로그램을 친구들이 쓰기 시작했다. 한 달 만에 사용자가 만 명이 넘었다. 투자자가 "학교를 그만두고 회사로 만들자"고 한다.',
    choices: [
      { id: 'drop', label: '학업·직장을 그만두고 올인한다', intent: 'risk',
        check: { base: 30, partial: 0.4, f: [['fn', p => genius(p, ['math', 'entrepreneur', 'mechanical']) ? { label: '천재적 재능', v: 25 } : { label: '뛰어난 재능', v: 10 }], ['stat', 'creativity', 0.25], ['stat', 'mental', 0.2], ['assets', 0.1]] },
        out: { success: { t: '투자를 받았다. 차고에서 시작한 회사에 직원이 생겼다. 세상이 내 아이디어를 쓰기 시작했다.', log: '천재 창업가의 첫 투자 유치', major: true, achv: 10, hp: 14, flag: ['genius_founder', 'started_business'], fn: p => { p.college = null; LG.Outcome.setJob(p, 'ceo', { mul: 1.4 }); p.queue.push({ id: 'w_business_check', at: p.age + 2 }); return ''; } },
          partial: { t: '회사는 만들었지만 돈이 빠르게 줄어든다. 버텨야 한다.', log: '조기 창업', flag: ['genius_founder', 'started_business'], fn: p => { p.college = null; LG.Outcome.setJob(p, 'ceo', { mul: 0.6 }); p.queue.push({ id: 'w_business_check', at: p.age + 2 }); return ''; } },
          fail: { t: '더 큰 회사가 비슷한 서비스를 내놓았다. 6개월 만에 접었다. 그래도 배운 게 많다.', log: '첫 창업 실패', flag: ['business_failed', 'gave_up_once'], debt: 1500, debtKind: 'biz', hp: -10 } } },
      { id: 'sell', label: '아이디어를 회사에 판다', intent: 'money', out: { t: '대기업이 서비스를 사 갔다. 스무 살 남짓에 목돈이 생겼다.', log: '아이디어를 매각', money: 15000, achv: 6, hp: 10 } },
      { id: 'later', label: '학업을 마치고 생각한다', intent: 'education', out: { t: '서두르지 않기로 했다. 아이디어는 노트에 고이 적어 두었다.', eff: { study: 8 } } }
    ]
  });
})(window.LG = window.LG || {});
