/* 이벤트 — 질병 진단과 치료 선택 (발생은 js/disease.js 가 한국 통계 기반으로 결정해 예약한다)
   암 · 심근경색 · 뇌졸중 · 폐렴(노년) · 고혈압/당뇨 · 실손보험 */
(function (LG) {
  const H = LG.EH, has = H.has;
  const S = H.S;
  const D = () => LG.Disease;
  const ch = H.pusher({ tier: 'major', cat: 'health', label: '건강', max: 99 });
  const C = p => D().CANCERS[p.dz.cancer.type];
  const pay = base => p => { const c = D().medCost(p, base); p.money -= c; return c > 0 ? `병원비 ${LG.U.money(c)}원${has(p, 'insured') ? '(보험 처리 후)' : ''}이 들었다.` : ''; };
  // 적극 치료 시 완치(관해) 가능성: 5년 생존율 × 발견 시기
  const cure = p => { const c = C(p), e = p.dz.cancer.early; return Math.round(Math.min(97, c.surv * 100 * (e ? 1.08 : 0.62))); };
  const setCancer = st => p => { p.dz.cancer.status = st; p.dz.cancer.since = p.age; if (st === 'terminal') S().flag(p, 'cancer'); return ''; };

  // ───── 암 ─────
  ch({
    id: 'hl_cancer', queued: true, icon: '🎗️',
    if: p => !!(p.dz && p.dz.cancer && p.dz.cancer.status === 'dx'),
    title: p => `${C(p).name} 진단`,
    text: p => { const c = C(p), e = p.dz.cancer.early; return `${e ? '건강검진에서' : '몸이 계속 이상해 찾아간 병원에서'} ${c.name}을(를) 진단받았다. ${e ? '다행히 초기라고 한다.' : '이미 꽤 진행된 상태라고 한다.'} 의사는 적극적으로 치료하면 완치 가능성이 ${cure(p)}% 정도라고 했다. ${has(p, 'insured') ? '보험이 있어 병원비 걱정은 조금 덜하다.' : '병원비부터 걱정이 앞선다.'}`; },
    wait: '검사 결과를 기다리는 중',
    choices: [
      { id: 'treat', label: '수술·항암 등 적극적으로 치료한다', intent: 'health',
        check: { base: 0, partial: 0.35, f: [['fn', p => ({ label: `${C(p).name} ${p.dz.cancer.early ? '초기' : '진행기'}`, v: cure(p) })], ['ageOver', 68, 0.8], ['health', 0.2], ['region', 'medical', 0.15], ['flag', 'exercise_habit', 4, '평소 체력'], ['flag', 'smoker', -4, '흡연']] },
        out: {
          success: { t: '', log: p => `${C(p).name}을(를) 이겨 냄`, major: true, st: { health: -8 }, hp: 4, sr: 10, fn: H.seq(setCancer('remission'), pay(2000), p => `긴 치료가 끝났다. 이제 5년을 지켜보면 된다. 머리카락이 다시 자라기 시작했다.`) },
          partial: { t: '', log: p => `${C(p).name}과 함께 살아가기로 함`, st: { health: -16 }, hp: -6, sr: 14, fn: H.seq(setCancer('partial'), pay(2600), p => '완치는 어렵지만 관리하며 살 수 있다고 한다. 정기적으로 병원에 다니는 삶이 시작됐다.') },
          fail: { t: '', log: p => `${C(p).name} 치료가 듣지 않음`, major: true, st: { health: -28 }, hp: -14, sr: 16, fn: H.seq(setCancer('terminal'), pay(3200), p => '치료가 잘 듣지 않는다. 남은 시간을 어떻게 쓸지 생각하게 됐다.') }
        } },
      { id: 'gentle', label: '무리한 치료 대신 일상을 지킨다', intent: 'rest',
        out: { t: '', log: '치료 대신 일상을 지키기로 함', hp: 6, exp: 4, rel: { family: 8 }, st: { health: -10 }, fn: H.seq(setCancer('untreated'), pay(300), p => C(p).surv >= 0.9 && p.dz.cancer.early ? '진행이 느린 암이라 지켜보며 관리하기로 했다. 정기 검사만 빠짐없이 받는다.' : C(p).surv >= 0.9 ? '큰 수술 대신 약과 정기 검사로 버텨 보기로 했다. 진행이 느린 암이라지만 이미 퍼진 곳이 마음에 걸린다.' : '병원보다 가족 곁을 택했다. 하루하루가 소중하다.') } },
      { id: 'alt', label: '민간요법·대체요법에 기대 본다', intent: 'risk',
        check: { base: 10, partial: 0.3, f: [['fn', p => ({ label: '암의 종류', v: C(p).surv >= 0.9 ? 20 : 0 })]] },
        out: {
          success: { t: '운이 좋았다. 검사 수치가 기적처럼 좋아졌다. 의사도 고개를 갸웃했다.', st: { health: -6 }, money: -800, fn: setCancer('remission') },
          fail: { t: '비싼 약초와 기도원에 돈만 쓰고 병은 더 깊어졌다. 결국 병원으로 돌아갔다.', log: '대체요법에 기댔다가 병을 키움', money: -1500, st: { health: -18 }, hp: -10, fn: setCancer('terminal') }
        } }
    ]
  });

  // ───── 심근경색·협심증 ─────
  ch({
    id: 'hl_heart', queued: true, icon: '🫀',
    if: p => !!(p.dz && p.dz.heart && p.dz.heart.status === 'dx'),
    title: '가슴을 쥐어짜는 통증', text: p => `${p.job ? '회의 도중' : '아침 산책 중'} 가슴이 조여 오며 식은땀이 났다. 응급실에서 "심근경색이 올 뻔했다"는 말을 들었다. ${has(p, 'smoker') ? '의사는 담배부터 끊으라고 했다.' : ''}`,
    choices: [
      { id: 'stent', label: '시술받고 생활을 완전히 바꾼다', intent: 'health',
        check: { base: 62, partial: 0.4, f: [['region', 'medical', 0.25], ['stat', 'mental', 0.25], ['flag', 'exercise_habit', 8, '운동 습관'], ['flag', 'smoker', -8, '흡연'], ['ageOver', 70, 0.6]] },
        out: {
          success: { t: '', log: '심장 시술 후 생활을 바꿈', st: { health: -4 }, eff: { health: 30 }, unflag: ['smoker', 'drinker'], sr: -10, fn: H.seq(p => { p.dz.heart.status = 'managed'; return ''; }, pay(900), p => '스텐트를 넣고 담배와 술을 끊었다. 매일 걷는다. 심장이 두 번째 기회를 줬다.') },
          partial: { t: '', st: { health: -10 }, fn: H.seq(p => { p.dz.heart.status = 'damaged'; return ''; }, pay(900), p => '시술은 잘 됐지만 생활을 바꾸는 게 생각보다 어렵다.') },
          fail: { t: '', log: '심장이 많이 상함', st: { health: -18 }, hp: -8, fn: H.seq(p => { p.dz.heart.status = 'damaged'; S().flag(p, 'chronic'); return ''; }, pay(1400), p => '심장 근육이 이미 많이 상했다. 평생 약을 먹어야 한다.') }
        } },
      { id: 'meds', label: '약만 받아 먹으며 버틴다', intent: 'career', out: { t: '', st: { health: -8 }, fn: H.seq(p => { p.dz.heart.status = 'damaged'; return ''; }, pay(300), p => '바빠서 시술은 미뤘다. 가슴 통증이 가끔 찾아온다.') } }
    ]
  });

  // ───── 뇌졸중 ─────
  ch({
    id: 'hl_stroke', queued: true, icon: '🧠',
    if: p => !!(p.dz && p.dz.stroke && p.dz.stroke.status === 'dx'),
    title: '뇌졸중', text: p => `갑자기 한쪽 팔에 힘이 빠지고 말이 어눌해졌다. ${LG.Rel.get(p, 'spouse') ? '{spouse}이(가)' : '옆에 있던 사람이'} 바로 119를 불렀다. 골든타임 안에 병원에 도착했다.`,
    choices: [
      { id: 'rehab', label: '재활에 모든 것을 건다', intent: 'health',
        check: { base: 46, partial: 0.4, f: [['health', 0.3], ['stat', 'mental', 0.3], ['region', 'medical', 0.2], ['rel', 'spouse', 0.15], ['ageOver', 72, 0.8], ['flag', 'hypertension', -6, '고혈압']] },
        out: {
          success: { t: '', log: '뇌졸중을 딛고 일어섬', st: { health: -8 }, sr: 8, fn: H.seq(p => { p.dz.stroke.status = 'mild'; return ''; }, pay(1200), p => '1년의 재활 끝에 다시 혼자 걷고, 말하고, 글씨를 쓴다.') },
          partial: { t: '', st: { health: -14 }, hp: -6, fn: H.seq(p => { p.dz.stroke.status = 'mild'; return ''; }, pay(1500), p => '많이 회복했지만 한쪽 손이 예전 같지 않다.') },
          fail: { t: '', log: '뇌졸중 후유증', major: true, st: { health: -24 }, hp: -14, rel: { family: 4 }, fn: H.seq(p => { p.dz.stroke.status = 'disabled'; if (p.job) LG.Outcome.quitJob(p, p.age >= 58 ? 'retired' : 'seeking'); return ''; }, pay(2000), p => '후유증이 남았다. 가족의 도움 없이는 하루를 보내기 어렵다.') }
        } },
      { id: 'care', label: '요양병원에서 치료와 간병을 받는다', intent: 'stability', out: { t: '', st: { health: -14 }, hp: -6, fn: H.seq(p => { p.dz.stroke.status = 'disabled'; return ''; }, pay(2400), p => '전문 간병을 받으며 천천히 회복 중이다. 가족의 부담은 덜었지만 병원비가 무겁다.') } }
    ]
  });

  // ───── 폐렴 (노년의 3대 사망원인) ─────
  ch({
    id: 'hl_pneumo', queued: true, icon: '🫁', tier: 'choice',
    title: '폐렴', text: '감기인 줄 알았는데 열이 내리지 않는다. 숨이 차다. 의사는 "이 나이엔 폐렴이 가장 무섭다"고 했다.',
    choices: [
      { id: 'hospital', label: '바로 입원해서 치료한다', intent: 'health',
        check: { base: 92, partial: 0, f: [['ageOver', 80, 1.4], ['health', 0.35], ['region', 'medical', 0.15], ['flag', 'smoker', -8, '흡연']] },
        out: { success: { t: '2주 입원 끝에 퇴원했다. 독감·폐렴구균 예방접종을 꼭 챙기기로 했다.', st: { health: -6 }, fn: pay(250) },
          fail: { t: '', st: { health: -20 }, fn: H.seq(pay(400), p => { (p.dz = p.dz || {}).fatal = '폐렴으로'; return '치료를 받았지만 기력이 많이 떨어졌다. 가족들이 하나둘 병실에 모였다.'; }) } } },
      { id: 'home', label: '집에서 약 먹으며 버틴다', intent: 'rest',
        check: { base: 62, partial: 0, f: [['ageOver', 78, 2.2], ['health', 0.4]] },
        out: { success: { t: '며칠 앓고 나니 열이 내렸다. 운이 좋았다.', st: { health: -10 } },
          fail: { t: '', st: { health: -24 }, fn: p => { (p.dz = p.dz || {}).fatal = '폐렴으로'; return '버티다 응급실에 실려 갔다. 너무 늦었다.'; } } } }
    ]
  });

  // ───── 고혈압·당뇨 (만성질환) ─────
  ch({
    id: 'hl_chronic', queued: true, icon: '🩺', tier: 'choice',
    if: p => !has(p, 'hypertension') || !has(p, 'diabetes'),
    title: p => !has(p, 'hypertension') ? '고혈압 진단' : '당뇨 진단',
    text: p => !has(p, 'hypertension') ? '혈압이 160을 넘었다. "이제부터 평생 관리하셔야 합니다." 고혈압은 심장과 뇌를 조용히 갉아먹는다고 한다.' : '공복혈당이 높게 나왔다. 당뇨라고 한다. 식단과 운동, 그리고 약.',
    choices: [
      { id: 'manage', label: '약과 운동, 식단으로 철저히 관리한다', intent: 'health',
        check: { base: 50, partial: 0.4, f: [['stat', 'mental', 0.3], ['flag', 'exercise_habit', 12, '운동 습관'], ['stress', 0.2]] },
        out: { success: { t: '수치가 정상 범위로 돌아왔다. 관리하는 몸이 오히려 더 건강해졌다.', eff: { health: 25 }, st: { health: 3 }, fn: p => { if (!has(p, 'hypertension')) { S().flag(p, 'hypertension'); S().flag(p, 'bp_managed'); } else { S().flag(p, 'diabetes'); S().flag(p, 'dm_managed'); } return ''; } },
          fail: { t: '처음 몇 달은 잘하다가 흐지부지됐다. 약만 겨우 먹는다.', fn: p => { S().flag(p, !has(p, 'hypertension') ? 'hypertension' : 'diabetes'); return ''; } } } },
      { id: 'ignore', label: '아직 젊다며 대수롭지 않게 넘긴다', intent: 'rest', out: { t: '약봉지는 서랍에 들어갔다.', st: { health: -2 }, fn: p => { S().flag(p, !has(p, 'hypertension') ? 'hypertension' : 'diabetes'); return ''; } } }
    ]
  });

  // ───── 실손보험 ─────
  ch({
    id: 'm_insurance', tier: 'choice', ages: [22, 45], w: 14, max: 1, icon: '📄', cat: 'money', label: '돈',
    if: p => !!p.job && !has(p, 'insured') && !has(p, 'no_insurance'),
    title: '보험 하나는 있어야지', text: p => `${LG.Rel.parents(p).length ? '{parent}가' : '직장 선배가'} "아프면 다 돈이다. 실손보험 하나는 들어 둬라"고 하신다. 매달 나가는 돈이 아깝기도 하다.`,
    choices: [
      { id: 'full', label: '실손에 암보험까지 든든하게 든다', intent: 'stability', out: { t: '매달 20만 원 가까이 나간다. 대신 마음 한구석이 든든하다.', flag: ['insured', 'cancer_insured'], hp: 2 } },
      { id: 'basic', label: '실손보험만 든다', intent: 'stability', out: { t: '꼭 필요한 것만 들었다. 한 달에 커피 몇 잔 값이다.', flag: 'insured', hp: 1 } },
      { id: 'no', label: '그 돈으로 저축한다', intent: 'money', out: { t: '아플 때 쓰려고 따로 모으기로 했다. 아프지 않기를 바라면서.', flag: 'no_insurance' } }
    ]
  });

  // ───── 큰 사고 뒤의 회복 ─────
  ch({
    id: 'hl_accident', queued: true, icon: '🩼', tier: 'choice',
    title: '사고 이후', text: p => `퇴원은 했지만 몸이 예전 같지 않다. ${p.job ? '회사에서는 언제 복귀하냐고 묻는다.' : '재활 병원 상담 예약이 잡혀 있다.'} ${has(p, 'insured') ? '보험금 청구 서류가 책상 위에 쌓여 있다.' : '병원비 영수증이 쌓여 간다.'}`,
    choices: [
      { id: 'rehab', label: '재활에 시간을 쏟는다', intent: 'health',
        check: { base: 55, partial: 0.4, f: [['stat', 'mental', 0.3], ['health', 0.2], ['stat', 'physical', 0.2], ['region', 'medical', 0.15]] },
        out: { success: { t: '반년의 재활 끝에 다시 뛸 수 있게 됐다.', log: '사고를 딛고 회복', st: { health: 12, physical: 3 }, perf: -6, money: -200, hp: 8, flag: 'healed' },
          partial: { t: '많이 좋아졌지만 비 오는 날이면 수술 자리가 쑤신다.', st: { health: 6 }, perf: -4, money: -200 },
          fail: { t: '재활이 더뎠다. 오래 서 있기가 힘든 몸이 됐다.', st: { health: -4, physical: -4 }, hp: -8, money: -200 } } },
      { id: 'back', label: '빨리 복귀해 일상을 되찾는다', intent: 'career', if: p => !!p.job,
        out: { t: '목발을 짚고 출근했다. 일은 놓치지 않았지만 몸은 더디게 낫는다.', perf: 4, st: { health: -4 }, sr: 8 } },
      { id: 'claim', label: '보험·합의금을 꼼꼼히 챙긴다', intent: 'money',
        check: { base: 50, partial: 0.4, f: [['flag', 'insured', 25, '보험 가입'], ['stat', 'intelligence', 0.2]] },
        out: { success: { t: '보험금과 합의금으로 병원비를 대부분 돌려받았다.', money: 1200, sr: 4 },
          partial: { t: '일부만 받았다. 서류 싸움에 지쳤다.', money: 400, sr: 10 },
          fail: { t: '가해자 측이 버텼다. 소송까지 갈지 고민 중이다.', sr: 14, hp: -4 } } }
    ]
  });
})(window.LG = window.LG || {});
