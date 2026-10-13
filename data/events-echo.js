/* 이벤트 — 과거의 메아리: 예전에 한 선택이 몇 년, 몇십 년 뒤 다시 돌아온다.
   각 이벤트는 특정 '기억 플래그'가 있어야 나오고, 그 기억이 선택지와 확률을 바꾼다.
   (tools/check.js 가 '설정만 되고 어디서도 안 읽히는 플래그'를 잡아낸다) */
(function (LG) {
  const E = LG.DATA.events;
  const H = LG.EH, has = H.has, anyFlag = H.anyFlag;
  const S = H.S;
  const kidsAt = H.kidsAt;
  const ch = H.pusher({ tier: 'choice', w: 16, max: 1, cat: 'echo', label: '그때의 나' });

  // ───── 학창 시절의 기억 → 내 아이의 학교 문제 ─────
  const SCHOOL_MEM = ['bullied_helped', 'refused_bully', 'fought_back', 'school_fight', 'school_refusal', 'reported_cyber', 'bad_company', 'avoided_bad_company', 'class_pres', 'stood_up', 'hobby_kid', 'game_balanced', 'game_addict'];
  ch({
    id: 'ec_kid_school', ages: [32, 60], w: 22, icon: '🏫',
    if: p => kidsAt(p, 8, 16).length > 0 && anyFlag(p, SCHOOL_MEM),
    child: p => kidsAt(p, 8, 16)[0],
    title: '아이의 학교', text: p => `{child}이(가) 요즘 학교 얘기를 하지 않는다. 담임 선생님에게서 "친구들과 문제가 있는 것 같다"는 연락이 왔다. ${has(p, 'school_refusal') ? '학교에 가기 싫던 그 아침들이 떠올랐다.' : has(p, 'fought_back') || has(p, 'school_fight') ? '주먹을 쥐었던 그날의 내가 떠올랐다.' : '내가 그 나이였을 때가 생각났다.'}`,
    choices: [
      { id: 'talk', label: '내가 겪은 이야기를 솔직하게 들려준다', intent: 'family',
        if: p => anyFlag(p, ['school_refusal', 'bullied_helped', 'refused_bully', 'fought_back', 'school_fight', 'stood_up']),
        out: { t: '"엄마(아빠)도 그랬어?" 아이의 눈이 동그래졌다. 그날 밤 처음으로 아이가 먼저 이야기를 꺼냈다.', log: '내 학창 시절 이야기로 아이를 다독임', rel: { children: 10 }, hp: 8, sr: -4 } },
      { id: 'school', label: '학교에 찾아가 정식으로 문제를 제기한다', intent: 'risk',
        check: { base: 42, partial: 0.4, f: [['flag', 'reported_cyber', 10, '신고해 본 경험'], ['flag', 'stood_up', 10, '부당함에 맞서 본 경험'], ['flag', 'fought_back', 6, '맞서 본 경험'], ['flag', 'class_pres', 5, '앞에 서 본 경험'], ['stat', 'social', 0.2], ['stat', 'mental', 0.2]] },
        out: {
          success: { t: '학교폭력위원회가 열렸고, 가해 학생 쪽의 사과를 받았다. 아이가 다시 웃기 시작했다.', log: '아이의 학교 문제를 해결', rel: { children: 8 }, hp: 8, sr: 6 },
          partial: { t: '절차는 지지부진했지만 담임이 아이를 더 챙기게 됐다.', rel: { children: 4 }, sr: 8 },
          fail: { t: '오히려 아이가 더 곤란해졌다. "왜 학교에 왔어"라는 말이 아팠다.', rel: { children: -6 }, hp: -8, sr: 12 }
        } },
      { id: 'hobby', label: '학교 밖에서 숨 쉴 곳을 만들어 준다', intent: 'hobby',
        if: p => anyFlag(p, ['hobby_kid', 'game_balanced', 'avoided_bad_company']),
        out: { t: '나도 그랬듯, 학교가 전부는 아니었다. 운동과 동아리를 같이 알아봤다. 아이에게 다른 친구들이 생겼다.', log: '아이에게 학교 밖 세계를 열어 줌', rel: { children: 7 }, hp: 6, money: -150 } },
      { id: 'wait', label: '스스로 이겨 내길 지켜본다', intent: 'stability',
        out: { t: '말없이 지켜봤다. 시간이 지나 괜찮아졌지만, 그때 아이가 얼마나 외로웠는지는 나중에야 알았다.', rel: { children: -3 }, hp: -2 } }
    ]
  });

  // ───── 맞서 본 사람 → 직장 내 괴롭힘 앞에서 ─────
  ch({
    id: 'ec_injustice', ages: [24, 58], w: 14, icon: '⚖️', label: '직장',
    if: p => !!p.job && p.job.id !== 'homemaker',
    title: '직장 내 괴롭힘', text: p => `팀장이 막내 동료에게 매일같이 폭언을 퍼붓는다. 다들 못 본 척한다. ${anyFlag(p, ['fought_back', 'refused_bully', 'reported_cyber']) ? '학창 시절, 그때도 이런 장면 앞에 서 있었다.' : has(p, 'bullied_helped') ? '누군가 나를 도와줬던 그때가 생각났다.' : '나도 모른 척해야 할까.'}`,
    choices: [
      { id: 'report', label: '증거를 모아 정식으로 신고한다', intent: 'risk',
        check: { base: 30, partial: 0.4, f: [['flag', 'fought_back', 10, '맞서 본 경험'], ['flag', 'refused_bully', 8, '괴롭힘을 거부한 경험'], ['flag', 'reported_cyber', 8, '신고해 본 경험'], ['flag', 'school_fight', 3, '물러서지 않는 성격'], ['stat', 'mental', 0.25], ['fn', p => p.job ? { label: '직장 내 입지', v: (p.job.perf - 50) * 0.2 } : null]] },
        out: {
          success: { t: '조사 끝에 팀장이 징계를 받았다. 막내 동료가 조용히 "고맙다"는 메시지를 보냈다.', log: '직장 내 괴롭힘을 신고해 바로잡음', major: true, flag: 'stood_up', hp: 12, achv: 3, rel: { friends: 6 } },
          partial: { t: '팀장은 다른 부서로 옮겼다. 회사는 조용히 덮었지만 막내는 숨을 돌렸다.', flag: 'stood_up', hp: 4, sr: 8 },
          fail: { t: '신고는 흐지부지됐고 나만 "유난 떠는 사람"이 되었다. 평가가 떨어졌다.', flag: 'stood_up', hp: -10, sr: 16, perf: -10 }
        } },
      { id: 'side', label: '동료 곁에 서서 함께 버텨 준다', intent: 'social', if: p => anyFlag(p, ['bullied_helped', 'refused_bully']),
        out: { t: '점심을 같이 먹고, 퇴근길을 같이 걸었다. 누군가 곁에 있다는 게 얼마나 큰지 나는 알고 있었다.', log: '괴롭힘당하는 동료의 곁을 지킴', rel: { friends: 8 }, hp: 6, sr: 4 } },
      { id: 'leave', label: '이런 회사는 떠난다', intent: 'independence', out: { t: '이직을 준비했다. 다음 회사는 면접 때 분위기부터 봤다.', flag: 'job_changed', sr: 6, hp: 2 } },
      { id: 'ignore', label: '못 본 척한다', intent: 'stability', out: { t: '나라도 살아야 했다. 하지만 그 장면이 오래 마음에 걸렸다.', hp: -6, sr: 6 } }
    ]
  });

  // ───── 옛 무리의 연락 ─────
  ch({
    id: 'ec_old_crew', ages: [22, 48], w: 14, icon: '📱',
    if: p => anyFlag(p, ['bad_company', 'school_fight', 'game_addict', 'avoided_bad_company']),
    title: '옛 친구의 연락', text: '학창 시절 어울리던 무리 중 한 명에게서 연락이 왔다. "좋은 건이 있다. 너만 끼워 줄게." 목소리가 그때 그대로다.',
    choices: [
      { id: 'no', label: '단호하게 끊는다', intent: 'stability',
        check: { base: 60, partial: 0, f: [['flag', 'avoided_bad_company', 14, '예전에도 거리를 뒀다'], ['flag', 'bad_company', -12, '오래된 인연'], ['stat', 'mental', 0.3]] },
        out: { success: { t: '"됐어." 전화를 끊고 번호를 지웠다. 몇 달 뒤 그 무리가 사기로 붙잡혔다는 소식을 들었다.', log: '옛 무리의 유혹을 끊어 냄', hp: 6, st: { mental: 2 } }, fail: { t: '거절은 했지만 며칠 동안 그 제안이 머릿속을 맴돌았다.', sr: 6 } } },
      { id: 'meet', label: '얼굴만 보러 나간다', intent: 'risk',
        check: { base: 40, partial: 0.3, f: [['stat', 'mental', 0.3], ['flag', 'sober', 6, '절제력'], ['flag', 'bad_company', -8, '그때의 버릇']] },
        out: {
          success: { t: '술 한잔 하며 옛날 얘기만 하고 돌아왔다. 다들 나이를 먹었다.', hp: 2, rel: { friends: 2 } },
          partial: { t: '"좋은 건"에 조금 넣었다가 고스란히 날렸다. 수업료라고 생각하기로 했다.', money: -500, hp: -4 },
          fail: { t: '불법 도박판이었다. 정신을 차려 보니 빚이 생겨 있었다.', log: '옛 무리와 엮여 빚을 짐', debt: 1500, debtKind: 'private', hp: -12, sr: 16, flag: 'gambling_debt' }
        } }
    ]
  });

  // ───── 술과의 싸움 ─────
  ch({
    id: 'ec_drink', ages: [28, 78], w: 16, cd: 10, max: 2, icon: '🍶',
    if: p => anyFlag(p, ['alcoholic', 'sober', 'rehab', 'dui']),
    title: '다시 잔 앞에서', text: p => `오랜만에 모인 자리, 누군가 잔을 채운다. "한 잔만 해." ${has(p, 'sober') ? '끊은 지 꽤 되었는데, 손이 먼저 반응한다.' : has(p, 'dui') ? '면허가 취소되던 그날 밤이 스쳐 갔다.' : '오늘 하루가 너무 길었다.'}`,
    choices: [
      { id: 'refuse', label: '"저는 됐어요" 사이다를 든다', intent: 'health',
        check: { base: 50, partial: 0.3, f: [['flag', 'sober', 16, '지켜 온 금주'], ['flag', 'rehab', 8, '치료 경험'], ['flag', 'alcoholic', -14, '오래된 습관'], ['stat', 'mental', 0.3], ['stress', 0.3]] },
        out: {
          success: { t: '끝까지 사이다를 마셨다. 집에 가는 길, 스스로가 조금 자랑스러웠다.', log: '술의 유혹을 이겨 냄', flag: 'sober', hp: 8, st: { health: 2 } },
          partial: { t: '한 잔만 마시고 멈췄다. 그다음 잔은 거절했다.', hp: 1 },
          fail: { t: '한 잔이 두 잔이 되고, 기억이 끊겼다. 다음 날 아침, 거울 속 내가 낯설었다.', log: '다시 술에 무너짐', flag: 'alcoholic', unflag: 'sober', hp: -12, sr: 12, st: { health: -5 }, rel: { family: -5 } }
        } },
      { id: 'leave', label: '일찍 자리를 뜬다', intent: 'stability', out: { t: '핑계를 대고 먼저 나왔다. 밤공기가 시원했다.', hp: 3, rel: { friends: -2 } } },
      { id: 'drink', label: '오늘만 마신다', intent: 'rest', out: { t: '오늘만이라는 말이 몇 번째인지 모르겠다.', flag: 'alcoholic', hp: 2, st: { health: -4 }, sr: -4 } }
    ]
  });

  // ───── 폭락장의 기억 ─────
  ch({
    id: 'ec_market', ages: [28, 78], w: 15, cd: 12, max: 2, icon: '📉', label: '돈',
    if: p => anyFlag(p, ['panic_sold', 'buy_the_dip', 'diamond_hands', 'crypto_fomo_done', 'gambling_debt']) && p.inv && (p.inv.stock + p.inv.crypto) >= 300,
    title: '또다시 폭락장', text: p => `시장이 무너지고 있다. 계좌가 하루에 몇 퍼센트씩 녹는다. ${has(p, 'panic_sold') ? '그때 바닥에서 던졌던 기억이 손을 떨리게 한다.' : has(p, 'buy_the_dip') ? '그때는 이럴 때 샀다. 이번에도 그럴 수 있을까.' : has(p, 'diamond_hands') ? '그때도 버텼다. 버틴 끝은 나쁘지 않았다.' : '숫자가 무섭다.'}`,
    choices: [
      { id: 'hold', label: '아무것도 하지 않고 버틴다', intent: 'stability',
        check: { base: 50, partial: 0.3, f: [['flag', 'diamond_hands', 12, '버텨 본 경험'], ['flag', 'panic_sold', -8, '그때의 공포'], ['stat', 'mental', 0.3]] },
        out: { success: { t: '앱을 지우고 일상에 집중했다. 1년 뒤, 계좌는 원래 자리로 돌아와 있었다.', flag: 'diamond_hands', hp: 6, fn: p => { p.inv.stock = Math.round(p.inv.stock * 1.12); return ''; } },
          fail: { t: '버티긴 했지만 매일 밤 잠을 설쳤다.', sr: 12, hp: -6 } } },
      { id: 'buy', label: '오히려 더 산다', intent: 'risk',
        check: { base: 42, partial: 0.4, f: [['flag', 'buy_the_dip', 12, '바닥에서 사 본 경험'], ['flag', 'crypto_fomo_done', -4, '조급함'], ['stat', 'intelligence', 0.2]] },
        out: { success: { t: '공포 속에 산 주식이 몇 년 뒤 효자가 되었다.', log: '폭락장에서 과감히 매수', flag: 'buy_the_dip', hp: 8, fn: p => { const a = Math.min(Math.max(0, p.money), 1500); p.money -= a; p.inv.stock += Math.round(a * 1.5); return ''; } },
          partial: { t: '바닥인 줄 알았는데 지하실이 있었다. 그래도 길게 보기로 했다.', sr: 8 },
          fail: { t: '물타기가 물에 빠졌다. 손실이 두 배가 되었다.', hp: -10, sr: 14, fn: p => { p.inv.stock = Math.round(p.inv.stock * 0.75); return ''; } } } },
      { id: 'sell', label: '더 떨어지기 전에 판다', intent: 'money', out: { t: '모두 팔고 나니 마음은 편했다. 몇 달 뒤 시장은 다시 올랐다.', flag: 'panic_sold', hp: 1, sr: -6, fn: p => { p.money += Math.round(p.inv.stock * 0.8 + p.inv.crypto * 0.7); p.inv.stock = 0; p.inv.crypto = 0; return ''; } } }
    ]
  });

  // ───── 다시 장사? ─────
  ch({
    id: 'ec_business_again', ages: [34, 66], w: 14, icon: '🏪', label: '일',
    if: p => anyFlag(p, ['bz_failed', 'closed_business', 'sold_business', 'business_succession', 'family_business', 'refused_family_biz', 'farm_helper_biz']),
    title: '다시, 내 가게', text: p => has(p, 'bz_failed') || has(p, 'closed_business') ? '가게 문을 닫던 날의 셔터 소리가 아직도 귀에 남아 있다. 그런데 요즘 다시 가게 자리를 보러 다니는 나를 발견한다.' : has(p, 'refused_family_biz') ? '물려받지 않겠다던 부모님의 가게. 이제 와서야 그 가게가 어떤 의미였는지 알 것 같다.' : '장사를 해 본 감각이 다시 꿈틀거린다. 이번에는 더 잘할 수 있을 것 같다.',
    choices: [
      { id: 'open', label: '이번엔 제대로 다시 연다', intent: 'risk',
        check: { base: 30, partial: 0.4, f: [['flag', 'bz_failed', 8, '실패에서 배운 것'], ['flag', 'closed_business', 6, '폐업 경험'], ['flag', 'sold_business', 10, '사업을 키워 판 경험'], ['flag', 'business_succession', 8, '가업 경험'], ['flag', 'family_business', 6, '가게에서 자람'], ['flag', 'farm_helper_biz', 4, '어릴 적 장사 경험'], ['talent', 'entrepreneur', 12], ['assets', 0.3]] },
        out: {
          success: { t: '두 번째 가게는 달랐다. 실수할 자리를 미리 알고 있었다. 단골이 생기기 시작했다.', log: '두 번째 창업 성공', major: true, achv: 6, hp: 12, money: 1500, flag: 'sold_business' },
          partial: { t: '크게 벌지는 못하지만 버틸 만하다. 내 이름을 건 가게가 있다는 게 좋다.', achv: 2, hp: 4, sr: 10 },
          fail: { t: '같은 실수를 반복했다. 두 번째 폐업은 첫 번째보다 아팠다.', log: '두 번째 폐업', flag: 'closed_business', money: -2500, hp: -14, sr: 18 }
        } },
      { id: 'parents', label: '부모님 가게를 다시 맡아 본다', intent: 'family', if: p => anyFlag(p, ['refused_family_biz', 'family_business']) && LG.Rel.parents(p).length > 0,
        out: { t: '부모님의 굽은 등을 보며 앞치마를 맸다. "이제 와서 뭘…" 하시면서도 웃으셨다.', log: '부모님 가게를 이어받음', flag: 'business_succession', rel: { parents: 12 }, hp: 8, perf: -6 } },
      { id: 'no', label: '그 시절은 그 시절로 둔다', intent: 'stability', out: { t: '가게 앞을 지나며 잠깐 멈췄다가 다시 걸었다.', hp: 1 } }
    ]
  });

  // ───── 그때 못 이룬 것 ─────
  const DREAM = {
    bar_failed: '변호사 시험에 떨어지던 날', college_failed: '대학 입시에 떨어지던 날', gave_up_once: '한 번 포기했던 그 꿈',
    civil_quit: '공무원을 그만두던 날', contract_teacher: '기간제 교사로 떠돌던 시절', retired_athlete: '선수 생활을 마감하던 날', own_path: '남들과 다른 길을 고집하던 시절'
  };
  ch({
    id: 'ec_second_chance', ages: [28, 56], w: 15, icon: '🔁',
    if: p => anyFlag(p, ['bar_failed', 'college_failed', 'gave_up_once', 'civil_quit', 'contract_teacher', 'retired_athlete', 'own_path']),
    title: '그때 못 이룬 것', text: p => { const k = Object.keys(DREAM).find(f => has(p, f)); return `${DREAM[k]}이 문득 떠올랐다. 지금이라도 다시 해 볼 수 있을까? 나이와 책임이 마음을 붙잡는다.`; },
    choices: [
      { id: 'retry', label: '다시 도전한다', intent: 'education',
        check: { base: 24, partial: 0.4, f: [['eff', 'study', 0.3], ['stat', 'intelligence', 0.25], ['stat', 'mental', 0.25], ['ageOver', 40, 1.5], ['flag', 'own_path', 6, '꺾이지 않는 고집'], ['assets', 0.2]] },
        out: {
          success: { t: '몇 년을 다시 매달렸다. 이번에는 이름이 있었다. 늦었지만, 결코 늦지 않았다.', log: '못 이룬 꿈에 다시 도전해 이룸', major: true, flag: 'second_act', achv: 10, hp: 16 },
          partial: { t: '완전히 이루지는 못했지만, 다시 해 봤다는 사실이 오래된 응어리를 풀어 줬다.', hp: 8, achv: 2, money: -400 },
          fail: { t: '또 한 번 떨어졌다. 이번에는 웃으며 받아들일 수 있었다.', hp: -4, money: -400, st: { mental: 2 } }
        } },
      { id: 'teach', label: '같은 길을 걷는 후배들을 돕는다', intent: 'social', out: { t: '내가 넘지 못한 벽 앞에 선 사람들에게 길을 알려 줬다. 그들의 합격 소식이 내 일처럼 기뻤다.', flag: 'mentor_given', hp: 8, rel: { friends: 4 } } },
      { id: 'let', label: '그때의 나를 놓아준다', intent: 'stability', out: { t: '그 시절의 나에게 수고했다고 말해 주었다.', hp: 4, sr: -4 } }
    ]
  });

  // ───── 과거가 발목을 잡는다 ─────
  ch({
    id: 'ec_skeleton', ages: [34, 66], w: 13, icon: '🗂️', label: '과거',
    if: p => anyFlag(p, ['research_misconduct', 'dui', 'loan_shark', 'school_fight']) && (!!p.job || p.age >= 50),
    title: '지워지지 않는 기록', text: p => `승진(혹은 새로운 자리) 심사 과정에서 오래전 일이 다시 거론됐다. ${has(p, 'research_misconduct') ? '연구 부정 의혹.' : has(p, 'dui') ? '음주운전 기록.' : has(p, 'loan_shark') ? '사채에 시달리던 시절의 소송 기록.' : '학창 시절 폭력 사건.'} 다 지난 일이라고 생각했다.`,
    choices: [
      { id: 'admit', label: '숨기지 않고 인정한다', intent: 'stability',
        check: { base: 40, partial: 0.4, f: [['flag', 'sober', 10, '달라진 삶'], ['flag', 'rehab', 8, '스스로 바로잡은 기록'], ['flag', 'turned_around', 8, '새 출발'], ['stat', 'mental', 0.25], ['fn', p => p.job ? { label: '쌓아 온 평판', v: (p.job.perf - 50) * 0.25 } : null]] },
        out: {
          success: { t: '"그 뒤로 어떻게 살아왔는지 봤습니다." 심사위원의 말에 눈시울이 붉어졌다.', log: '과거를 인정하고 신뢰를 얻음', hp: 10, achv: 3, perf: 6 },
          fail: { t: '솔직함은 통하지 않았다. 자리는 다른 사람에게 갔다.', hp: -8, sr: 10, perf: -6 }
        } },
      { id: 'hide', label: '부인하고 버틴다', intent: 'risk',
        check: { base: 34, partial: 0, f: [['stat', 'social', 0.2], ['fn', p => ({ label: '운', v: p.luck * 2 })]] },
        out: { success: { t: '흐지부지 넘어갔다. 하지만 마음 한구석이 계속 불편했다.', sr: 10 },
          fail: { t: '거짓말이 드러나면서 일이 훨씬 커졌다.', log: '과거를 숨기다 들통남', major: true, hp: -16, sr: 20, perf: -16, rel: { friends: -6 } } } },
      { id: 'step', label: '스스로 물러난다', intent: 'family', out: { t: '자리를 내려놓았다. 가족이 "잘했다"고 말해 주었다.', hp: 0, rel: { family: 6 }, perf: -4 } }
    ]
  });

  // ───── 번아웃 ─────
  ch({
    id: 'ec_burnout', ages: [26, 58], w: p => 8 + (p.stress > 65 ? 14 : 0) + (has(p, 'burnout_scar') ? 6 : 0) + (has(p, 'promoted') ? 3 : 0), cd: 12, max: 2, icon: '🕯️', label: '일',
    if: p => !!p.job && (p.stress > 55 || anyFlag(p, ['burnout_scar', 'promoted', 'job_changed', 'workaholic'])),
    title: '번아웃', text: p => `아침에 눈을 떴는데 몸이 일어나지 않는다. 출근 버스에서 이유 없이 눈물이 났다. ${has(p, 'burnout_scar') ? '전에도 한 번 이랬다. 이번엔 신호를 알아챘다.' : has(p, 'promoted') ? '승진하고 나서부터 숨 쉴 틈이 없었다.' : '그냥 지친 거라고 생각했다.'}`,
    choices: [
      { id: 'leave', label: '휴직하고 쉰다', intent: 'health',
        out: { t: '석 달을 쉬었다. 처음엔 불안했지만, 점점 잠이 깊어졌다.', log: '번아웃으로 휴직', flag: 'burnout_scar', money: -600, sr: -24, hp: 8, perf: -6, st: { health: 3, mental: 2 } } },
      { id: 'counsel', label: '상담을 받으며 일을 줄인다', intent: 'health',
        check: { base: 50, partial: 0.4, f: [['flag', 'burnout_scar', 10, '전에 겪어 본 경험'], ['flag', 'work_life', 10, '일과 삶의 경계'], ['stat', 'mental', 0.3]] },
        out: { success: { t: '매주 상담을 받고 야근을 끊었다. 회사는 생각보다 잘 돌아갔다.', flag: 'work_life', sr: -16, hp: 8 },
          fail: { t: '줄이려 했지만 일이 줄지 않았다.', flag: 'burnout', sr: 6, hp: -4 } } },
      { id: 'push', label: '이 고비만 넘기면 된다', intent: 'career',
        check: { base: 34, partial: 0.3, f: [['health', 0.3], ['stat', 'mental', 0.3], ['flag', 'burnout_scar', -8, '이미 한 번 무너진 몸']] },
        out: { success: { t: '버텼다. 프로젝트는 성공했지만, 거울 속 내 얼굴이 많이 늙었다.', achv: 4, perf: 8, st: { health: -4 }, sr: 8 },
          fail: { t: '결국 쓰러졌다. 응급실 천장을 보며 무엇을 위해 이렇게 달렸나 생각했다.', log: '번아웃으로 쓰러짐', major: true, flag: ['burnout', 'burnout_scar'], st: { health: -10 }, hp: -14, sr: 10, perf: -10 } } }
    ]
  });

  // ───── 내가 받은 것을 돌려줄 때 ─────
  ch({
    id: 'ec_mentor', ages: [38, 66], w: 14, icon: '🌱',
    if: p => anyFlag(p, ['mentor', 'promoted', 'second_act', 'famous', 'class_pres', 'mentor_given']),
    title: '후배가 찾아왔다', text: p => has(p, 'mentor') ? '그분이 나에게 해 줬던 것처럼, 이번엔 한 후배가 나를 찾아왔다. "어떻게 하면 선배처럼 될 수 있을까요?"' : has(p, 'famous') ? '내 작품을 보고 이 길에 들어섰다는 젊은이가 찾아왔다.' : '고민 많은 후배가 저녁을 사 달라며 찾아왔다. 이야기가 길어질 것 같다.',
    choices: [
      { id: 'mentor', label: '시간을 내서 꾸준히 이끌어 준다', intent: 'social',
        out: { t: '한 달에 한 번, 몇 년을 만났다. 후배가 자리를 잡던 날 나보다 그가 더 많이 울었다.', log: '후배의 멘토가 되어 줌', flag: 'mentor_given', achv: 4, hp: 10, rel: { friends: 8 } } },
      { id: 'once', label: '그날 밤 진심으로 조언해 준다', intent: 'social', out: { t: '내가 넘어졌던 자리들을 이야기해 줬다. 후배가 고개를 끄덕였다.', hp: 5, rel: { friends: 3 } } },
      { id: 'busy', label: '지금은 내 일로도 벅차다', intent: 'career', out: { t: '미안하다는 말과 함께 돌려보냈다.', perf: 2, hp: -2 } }
    ]
  });

  // ───── 옛 부상 ─────
  ch({
    id: 'ec_old_injury', ages: [35, 78], w: 12, icon: '🦴', label: '몸',
    if: p => anyFlag(p, ['injured', 'retired_athlete', 'healed']),
    title: '옛 상처', text: p => has(p, 'retired_athlete') ? '선수 시절 혹사한 무릎이 다시 말썽이다. 비 오는 날이면 먼저 안다.' : '오래전 다친 곳이 다시 아프기 시작했다. 다 나은 줄 알았다.',
    choices: [
      { id: 'surgery', label: '제대로 수술받는다', intent: 'health',
        check: { base: 60, partial: 0.4, f: [['health', 0.3], ['flag', 'healed', 8, '회복해 본 경험'], ['region', 'medical', 0.2]] },
        out: { success: { t: '수술과 재활 끝에 다시 걸음이 가벼워졌다.', flag: 'healed', money: -500, st: { health: 4 }, hp: 6 }, partial: { t: '조금 나아졌다. 완전하지는 않다.', money: -500, hp: 1 }, fail: { t: '수술 후에도 통증이 남았다.', money: -500, hp: -6, st: { health: -3 } } } },
      { id: 'live', label: '달래 가며 산다', intent: 'stability', out: { t: '무리하지 않는 법을 배웠다. 아픈 날은 쉬어 간다.', hp: 0, st: { health: -1 } } }
    ]
  });

  // ───── 말하지 못한 마음, 그리고 동창회 ─────
  ch({
    id: 'ec_classmates', ages: [32, 66], w: 13, icon: '🥂',
    if: p => anyFlag(p, ['unspoken_love', 'class_pres', 'reunion', 'late_love', 'first_love']),
    who: p => p.firstLoveId != null ? p.people.find(x => x.id === p.firstLoveId) : null,
    title: '동창회', text: p => has(p, 'unspoken_love') ? `20년 만의 동창회. 문이 열리고, ${p.firstLoveId != null ? '{who}' : '그 사람'}이(가) 들어왔다. 끝내 말하지 못했던 첫사랑.` : has(p, 'class_pres') ? '반장이던 나에게 동창회 연락이 왔다. "네가 모아야 다 모이지."' : '오랜만에 동창회 소식이 왔다. 다들 어떻게 살고 있을까.',
    choices: [
      { id: 'confess', label: '이번엔 그때 마음을 말한다', intent: 'love', if: p => has(p, 'unspoken_love') && H.single(p) && (p.firstLoveId == null || p.people.some(x => x.id === p.firstLoveId && x.alive)),
        check: { base: 30, partial: 0.4, f: [['stat', 'social', 0.3], ['flag', 'late_love', 6, '늦게라도 사랑해 본 용기']] },
        out: {
          success: { t: '"나도 그랬어." 그 한마디에 20년이 접혔다.', log: '첫사랑과 다시 만남', major: true, unflag: 'unspoken_love', flag: 'reunion', hp: 18, fn: p => { let n = p.firstLoveId != null ? p.people.find(x => x.id === p.firstLoveId && x.alive) : null; if (!n) { n = LG.Rel.makeLoveInterest(p, { role: 'crush' }); n.note = '첫사랑'; p.firstLoveId = n.id; } LG.Rel.revive(p, n, 72); return ''; } },
          partial: { t: '웃으며 "그때 그랬구나" 하고 말았다. 그래도 속이 후련했다.', unflag: 'unspoken_love', hp: 8 },
          fail: { t: '그 사람에게는 이미 가족이 있었다. 말하지 않는 편이 나았을까.', unflag: 'unspoken_love', hp: -4 }
        } },
      { id: 'memory', label: '추억만 꺼내 놓고 웃는다', intent: 'social', out: { t: '그때 그 노래를 다 같이 불렀다. 우리는 늙었지만 이 밤만큼은 열일곱이었다.', log: '동창회에서 옛 친구들과 재회', hp: 10, rel: { friends: 8 } } },
      { id: 'host', label: '앞장서서 모임을 꾸린다', intent: 'social', if: p => has(p, 'class_pres'),
        out: { t: '단톡방을 만들고 장소를 잡았다. 그날 이후 매년 모이기로 했다.', hp: 8, rel: { friends: 10 } } },
      { id: 'skip', label: '가지 않는다', intent: 'rest', out: { t: '단체 사진만 나중에 받아 봤다. 다들 많이 변했다.', hp: 0 } }
    ]
  });

  // ───── 부모님 기일 ─────
  ch({
    id: 'ec_memorial', ages: [35, 88], w: 12, cd: 15, max: 2, icon: '🕯️', label: '가족',
    if: p => has(p, 'parent_lost'),
    title: '부모님 기일', text: '부모님 기일이 돌아왔다. 형제들 사이에 누가 제사를 모실지, 성묘는 언제 갈지 이야기가 오간다.',
    choices: [
      { id: 'host', label: '내가 모시겠다고 한다', intent: 'family', out: { t: '부엌에서 어머니가 하시던 대로 전을 부쳤다. 맛이 똑같지는 않았지만 형제들이 웃었다.', log: '부모님 제사를 모심', rel: { siblings: 8, family: 4 }, hp: 6, money: -100, sr: 4 } },
      { id: 'visit', label: '조용히 산소에만 다녀온다', intent: 'rest', out: { t: '산소 앞에서 근황을 이야기했다. 대답은 없었지만 마음이 가벼워졌다.', hp: 6 } },
      { id: 'skip', label: '바빠서 이번엔 못 간다', intent: 'career', out: { t: '사진으로만 인사를 대신했다. 형제의 서운한 목소리가 귀에 남았다.', rel: { siblings: -6 }, hp: -3 } }
    ]
  });

  // ───── 비혼과 아이 없는 삶 ─────
  ch({
    id: 'ec_single_life', ages: [32, 46], w: 12, icon: '🏡',
    if: p => H.single(p) && !has(p, 'married') && !has(p, 'childfree_single') && LG.Rel.all(p, 'child').length === 0,
    title: '나 혼자 산다', text: p => `명절마다 "결혼은 언제 하니"라는 질문이 돌아온다. ${has(p, 'independent_life') || has(p, 'traveled_young') ? '혼자 사는 삶이 이제는 꽤 익숙하고 좋다.' : '혼자인 게 싫지는 않은데, 가끔 불안하다.'}`,
    choices: [
      { id: 'single', label: '비혼으로 살겠다고 선언한다', intent: 'independence',
        out: { t: '"저는 혼자서도 잘 살아요." 처음엔 어색해하던 가족도 결국 받아들였다.', log: '비혼을 선택함', flag: ['childfree_single', 'independent_life'], hp: 8, rel: { parents: -3 } } },
      { id: 'open', label: '좋은 사람을 만나면 그때 생각한다', intent: 'love', out: { t: '조급해하지 않기로 했다. 대신 소개팅 제안을 거절하지 않기로 했다.', hp: 2 } },
      { id: 'kid', label: '아이 없이 둘이 사는 삶도 괜찮다고 정한다', intent: 'love', out: { t: '결혼을 하더라도 아이 없이 사는 삶을 떠올려 봤다. 생각보다 편안했다.', flag: 'kid_free', hp: 3 } }
    ]
  });

  // ───── 노년, 자녀와의 거리 ─────
  ch({
    id: 'ec_kids_bond', ages: [58, 88], w: 14, icon: '📞', label: '가족',
    if: p => LG.Rel.all(p, 'child').some(c => c.alive && c.age >= 25) || anyFlag(p, ['kid_free', 'childfree_single']),
    child: p => LG.Rel.all(p, 'child').filter(c => c.alive && c.age >= 25).sort((a, b) => a.rel - b.rel)[0],
    title: p => LG.Rel.all(p, 'child').some(c => c.alive) ? '다 큰 자식' : '아이 없는 노후',
    text: p => {
      if (!LG.Rel.all(p, 'child').some(c => c.alive)) return `아이 없이 나이 들어 간다. ${has(p, 'independent_life') ? '스스로 선택한 삶이니 후회는 없다. 다만 병원 보호자 칸이 비어 있을 때 조금 쓸쓸하다.' : '친구들의 손주 사진이 단톡방에 올라온다.'}`;
      return `{child}에게서 연락이 뜸하다. ${has(p, 'supported_kids') ? '그렇게 다 해 줬는데 서운한 마음이 든다.' : has(p, 'married_young') ? '일찍 낳아 함께 자란 아이라 친구 같았는데.' : has(p, 'single_parent') || has(p, 'unwed_parent') ? '혼자 키우며 버텨 온 세월이 스쳐 간다.' : '다들 바쁘게 사는 거겠지.'}`;
    },
    choices: [
      { id: 'call', label: '먼저 전화해 안부를 묻는다', intent: 'family', if: p => LG.Rel.all(p, 'child').some(c => c.alive),
        out: { t: '"바빴어, 미안해." 아이의 목소리가 반가웠다. 다음 주에 밥 먹기로 했다.', rel: { children: 8 }, hp: 8 } },
      { id: 'own', label: '내 삶은 내가 채운다', intent: 'independence', out: { t: '배우고 싶던 것을 등록하고, 친구들과 약속을 잡았다. 기다리는 대신 살기로 했다.', hp: 8, rel: { friends: 4 }, st: { mental: 2 } } },
      { id: 'friends', label: '같은 처지의 친구들과 서로를 챙긴다', intent: 'social', if: p => anyFlag(p, ['kid_free', 'childfree_single']) || !LG.Rel.all(p, 'child').some(c => c.alive),
        out: { t: '혼자 사는 친구 넷이서 서로의 비상연락처가 되어 주기로 했다. 든든했다.', hp: 10, rel: { friends: 10 } } },
      { id: 'sulk', label: '서운해도 내색하지 않는다', intent: 'stability', out: { t: '서운한 마음을 삼켰다. 명절에 얼굴을 보면 그걸로 됐다.', hp: -3 } }
    ]
  });

  // ───── 젊을 때의 경험이 다시 기회로 ─────
  ch({
    id: 'ec_abroad_call', ages: [26, 50], w: 12, icon: '✈️', label: '세계',
    if: p => anyFlag(p, ['katusa', 'traveled_young', 'exchange', 'working_holiday']) && !!p.job && p.liveIn !== 'abroad',
    title: '영어 되는 사람?', text: p => `회사에 해외 바이어가 왔는데 통역할 사람이 없다. ${has(p, 'katusa') ? '카투사에서 2년 버틴 영어가 입 밖으로 나올까.' : has(p, 'traveled_young') ? '배낭 하나로 세계를 돌던 그 배짱이 아직 남아 있을까.' : '그때 해외에서 지낸 시간이 떠올랐다.'}`,
    choices: [
      { id: 'step', label: '손을 든다', intent: 'career',
        check: { base: 40, partial: 0.4, f: [['flag', 'katusa', 12, '카투사 경험'], ['flag', 'exchange', 10, '교환학생 경험'], ['flag', 'working_holiday', 8, '해외 체류'], ['flag', 'traveled_young', 6, '배낭여행 경험'], ['talent', 'language', 12]] },
        out: { success: { t: '미팅이 성공적으로 끝났다. 다음 날부터 해외 업무가 내게 오기 시작했다.', log: '해외 업무를 맡게 됨', perf: 10, achv: 3, hp: 8, fn: H.mulJob(1.06) },
          fail: { t: '말이 꼬였다. 바이어의 표정이 굳어 갔다.', perf: -4, hp: -6, sr: 8 } } },
      { id: 'pass', label: '조용히 있는다', intent: 'stability', out: { t: '다른 동료가 나섰다. 괜히 아쉬웠다.', hp: -1 } }
    ]
  });
})(window.LG = window.LG || {});
