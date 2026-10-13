/* LifeCycle — 학교·대학·군대·경력·은퇴 등 '시간이 흐르면 저절로 일어나는 일'과
   노력의 누적, 기분과 평균값 갱신, 과거 선택을 돌아보는 회고 메시지 */
(function (LG) {
  'use strict';
  const U = () => LG.U, S = () => LG.State, R = () => LG.RNG;

  // 과거 선택과 현재를 연결해 주는 회고 (플레이어가 '내 선택 때문'이라 느끼도록)
  const REFLECTIONS = [
    { age: 31, if: p => S().has(p, 'studied_hard') && (p.edu === 'college' || p.edu === 'grad') && p.job, t: '학창 시절 꾸준히 했던 공부가 지금 커리어의 바탕이 되었다.' },
    { age: 33, if: p => S().has(p, 'worked_teen') && p.job, t: '일찍 사회에 나와 부딪혔던 경험이 이제는 누구보다 단단한 경력이 되었다.' },
    { age: 36, if: p => S().has(p, 'no_college') && S().has(p, 'certified'), t: '대학 대신 쌓은 기술과 자격증이 지금 밥벌이를 든든히 받쳐 준다.' },
    { age: 47, if: p => S().has(p, 'exercise_habit'), t: '젊을 때 들인 운동 습관 덕분에 또래보다 체력이 좋다는 말을 듣는다.' },
    { age: 50, if: p => S().has(p, 'smoker'), t: '젊을 때 피운 담배가 이제 와서 청구서를 보내기 시작했다.' },
    { age: 55, if: p => S().has(p, 'family_time') && LG.Rel.all(p, 'child').length, t: '아이들과 보낸 저녁 시간들이 지금의 끈끈한 관계를 만들었다.' },
    { age: 55, if: p => S().has(p, 'workaholic') && LG.Rel.all(p, 'child').length, t: '일에 쏟은 시간만큼, 아이들과는 어딘가 서먹해졌다.' },
    { age: 62, if: p => S().has(p, 'saved_early'), t: '20~30대에 아껴 모은 돈이 노후의 여유가 되었다.' },
    { age: 64, if: p => S().has(p, 'kept_friends') && LG.Rel.all(p, 'friend').length >= 2, t: '꾸준히 연락해 온 친구들이 있어서, 나이 드는 게 덜 외롭다.' },
    { age: 40, if: p => S().has(p, 'retake_success'), t: '그때 한 해 더 버텼던 선택이 인생의 방향을 바꿨다.' },
    { age: 62, if: p => S().has(p, 'mortgage_done'), t: '30년 가까이 갚아 온 집 대출이 끝난 집. 벽지 얼룩 하나까지 온전히 내 것이다.' },
    { age: 45, if: p => S().has(p, 'emigrated'), t: '낯선 나라에서 버틴 시간들이 이제는 나의 일부가 되었다.' }
  ];

  // 나이와 지금의 생활이 능력치를 조금씩 움직인다 (관리하지 않으면 줄고, 사는 모습대로 자란다)
  const THINK_JOBS = ['developer', 'researcher', 'doctor', 'lawyer', 'teacher', 'engineer', 'translator', 'writer', 'ceo'];
  const PEOPLE_JOBS = ['service', 'teacher', 'nurse', 'socialworker', 'entertainer', 'idol', 'creator', 'selfemp', 'cook', 'coach', 'ceo', 'doctor'];
  const MAKE_JOBS = ['designer', 'artist', 'musician', 'writer', 'creator', 'cook', 'idol', 'entertainer'];
  const BODY_JOBS = ['athlete', 'coach', 'farmer', 'factory', 'technician', 'driver', 'idol'];
  function drift(p, a) {
    const job = p.job ? p.job.id : null, E = p.effort;
    const st = LG.Style && LG.Style.active(p) ? LG.Style.key(p) : null;
    // 노력은 습관이 되지 않으면 조금씩 옅어진다 (성인 이후)
    if (a >= 22) ['study', 'sport', 'art', 'social', 'health'].forEach(k => { E[k] = Math.max(0, (E[k] || 0) * 0.94); });
    const add = (k, d) => { if (d) S().addStat(p, k, Math.round(d * 100) / 100); };
    // 학습능력: 40대 중반부터 천천히, 60대부터 더 빨리 준다 — 머리를 쓰는 일·공부 습관이 늦춘다
    let iq = a < 25 ? 0 : a < 45 ? -0.1 : a < 60 ? -0.35 : a < 75 ? -0.6 : -0.9;
    if (job && THINK_JOBS.indexOf(job) >= 0) iq += 0.35;
    if (S().has(p, 'lifelong_learner') || st === 'growth') iq += 0.3;
    if (E.study >= 20) iq += 0.2;
    add('intelligence', iq);
    // 운동능력: 30대부터 줄기 시작해 50·65세 이후 가팔라진다 — 운동 습관·몸 쓰는 일이 늦춘다
    let ph = a < 30 ? 0 : a < 50 ? -0.4 : a < 65 ? -0.75 : -1.1;
    if (S().has(p, 'exercise_habit')) ph += 0.45;
    if (st === 'health') ph += 0.3;
    if (job && BODY_JOBS.indexOf(job) >= 0) ph += 0.25;
    if (p.stats.health < 40) ph -= 0.3;
    add('physical', ph);
    // 사교성: 연애·결혼·친구·동료·이웃과 부대낄수록 늘고, 고립되면 줄어든다
    let so = 0;
    const friends = LG.Rel.all(p, 'friend').length;
    if (LG.Rel.get(p, 'partner') || LG.Rel.get(p, 'spouse')) so += 0.25;
    so += Math.min(3, friends) * 0.1;
    if (job) so += PEOPLE_JOBS.indexOf(job) >= 0 ? 0.35 : 0.15;   // 직장 동료
    if (a >= 7 && a < 19) so += 0.2;                               // 학교 친구들
    if (p.status === 'college') so += 0.25;
    if (LG.Rel.all(p, 'child').some(c => c.age >= 3 && c.age <= 15)) so += 0.15;   // 학부모 모임 · 이웃
    if (S().has(p, 'volunteer') || S().has(p, 'kept_friends')) so += 0.15;
    if (a >= 20 && !job && !friends && !LG.Rel.get(p, 'partner') && !LG.Rel.get(p, 'spouse')) so -= 0.5;
    if (p.status === 'recluse') so -= 1;
    if (a >= 75) so -= 0.2;
    if (so > 0) so *= U().clamp((100 - p.stats.social) / 55, 0.1, 1);   // 이미 사교적이면 더 오르기 어렵다
    add('social', so);
    // 정신력: 살아온 시간과 견뎌 낸 일만큼 단단해진다 — 오래 불행하면 깎인다
    let me = a >= 18 && a < 60 ? 0.12 : 0;
    if (p.stress >= 75) me += 0.1;            // 버티는 경험
    if (p.happy < 25) me -= 0.35;
    if (S().has(p, 'counseled')) me += 0.15;
    add('mental', me);
    // 창의력: 만들고 표현하는 생활에서 자라고, 쓰지 않으면 노년에 조금씩 준다
    let cr = 0;
    if (job && MAKE_JOBS.indexOf(job) >= 0) cr += 0.35;
    if (S().has(p, 'hobby')) cr += 0.2;
    if (a >= 60 && !S().has(p, 'hobby') && !(job && MAKE_JOBS.indexOf(job) >= 0)) cr -= 0.2;
    add('creativity', cr);
  }

  function yearly(p) {
    const lines = [];
    const a = p.age;

    // 학교
    if (a === 3) lines.push({ t: '어린이집에 다니기 시작했다.', icon: '🧸' });
    if (a === 7) { p.edu = 'elem'; p.status = 'student'; lines.push({ t: '초등학교에 입학했다. 커다란 책가방이 어색하다.', icon: '🎒', major: true }); }
    if (a === 13) { p.edu = 'middle'; lines.push({ t: '중학교에 입학했다. 교복이 아직 크다.', icon: '🏫' }); }
    if (a === 16) {
      p.edu = 'high';
      const tr = { academic: '인문계 고등학교', vocational: '특성화고', arts: '예술고', sports: '체육 특기생으로 고등학교' }[p.track] || '고등학교';
      lines.push({ t: `${tr}에 입학했다.`, icon: '🏫', major: true });
    }
    if (a === 19 && S().has(p, 'hs_grad_pending')) { /* t_csat 이벤트가 처리 */ }

    // 성인이 되면 부모님이 형편껏 보태 주신다
    if (a === 20 && !S().has(p, 'seed_money')) {
      S().flag(p, 'seed_money');
      const gift = { 1: 0, 2: 50, 3: 200, 4: 800, 5: 3500 }[p.family.tier] * U().clamp(S().supportScore(p) / 60, 0.4, 1.3) * LG.Birth.giftMul(p);
      if (gift >= 100) { p.money += Math.round(gift / 10) * 10; lines.push({ t: `부모님이 사회 초년생 통장에 ${U().money(gift)}원을 넣어 주셨다.`, icon: '🎁' }); }
    }

    // 대학/대학원 졸업
    if (p.college && a >= p.college.end && p.status !== 'military') {
      const kind = p.college.kind;
      p.college = null;
      if (kind === 'med') {
        p.edu = 'college';
        LG.Outcome.setJob(p, 'doctor', { perf: 55 });
        lines.push({ t: '긴 수련 끝에 의사 면허를 받았다. 흰 가운이 무겁다.', icon: '⚕️', major: true });
        p.achv += 12;
      } else if (kind === 'grad') {
        p.edu = 'grad'; p.status = 'seeking';
        lines.push({ t: '대학원 학위를 받았다.', icon: '🎓', major: true });
        p.achv += 8;
      } else if (kind === 'law') {
        p.edu = 'college';
        if (R().chance(p, U().clamp(0.35 + (p.stats.intelligence - 55) * 0.012 + p.effort.study * 0.006, 0.12, 0.85))) {
          LG.Outcome.setJob(p, 'lawyer', { perf: 50 });
          lines.push({ t: '로스쿨을 마치고 변호사 시험에 합격했다!', icon: '⚖️', major: true });
          p.achv += 12;
        } else {
          p.status = 'seeking'; S().flag(p, 'bar_failed');
          lines.push({ t: '변호사 시험에 떨어졌다. 법학 학위만 남았다.', icon: '📕', major: true, fx: '행복 -10' });
          S().addStat(p, 'happy', -10);
        }
      } else {
        p.edu = 'college'; p.status = 'seeking';
        lines.push({ t: kind === 'night' ? '일과 공부를 병행한 끝에 학위를 받았다.' : '대학을 졸업했다. 학사모를 던졌다.', icon: '🎓', major: true });
        p.achv += kind === 'night' ? 8 : 5;
      }
      if (p.job) p.status = 'working';
    }

    // 군 복무
    if (p.status === 'military' && a >= p.militaryUntil) {
      p.status = p.afterMilitary || 'seeking';
      p.home = p.afterMilitaryHome || 'parents';
      if (p.afterJob) { p.job = p.afterJob; p.afterJob = null; p.status = 'working'; }
      lines.push({ t: '전역했다. 바깥 공기가 다르게 느껴진다.', icon: '🎖️', major: true });
    }

    // 직업
    if (p.job) {
      const J = LG.DATA.jobs[p.job.id];
      p.job.years++;
      let dp = p.effort.work * 0.07 + (p.stats.intelligence - 50) * 0.03 + (p.stats.mental - 50) * 0.02
        - Math.max(0, p.stress - 72) * 0.12 + R().float(p, -4, 4) - (p.job.perf - 50) * 0.05;
      if (S().has(p, 'workaholic')) dp += 1.5;
      p.job.perf = U().clamp(p.job.perf + dp, 0, 100);
      const target = J.stress * 0.85 + (S().has(p, 'workaholic') ? 12 : 0) + (S().hasTrait(p, 'competitive') ? 5 : 0);
      p.stress = U().clamp(p.stress + (target - p.stress) * 0.25, 0, 100);
      p.achv += J.achv * (0.6 + p.job.perf / 120);

      // 운동선수 은퇴
      if (p.job.id === 'athlete' && a >= 31 + Math.round(p.stats.physical / 25)) {
        LG.Outcome.quitJob(p, 'seeking');
        if (R().chance(p, 0.65)) { LG.Outcome.setJob(p, 'coach', { perf: 60 }); lines.push({ t: '선수 생활을 마무리하고 지도자의 길로 들어섰다.', icon: '🏋️', major: true }); }
        else lines.push({ t: '현역에서 은퇴했다. 운동 말고 할 줄 아는 게 뭘까.', icon: '🏅', major: true });
      }
      // 너무 늦게까지 일하면 자동 은퇴
      const limit = ['selfemp', 'artist', 'writer', 'musician', 'farmer', 'ceo', 'freelancer'].indexOf(p.job ? p.job.id : '') >= 0 ? 76 : 70;
      if (p.job && a >= limit) {
        LG.Outcome.quitJob(p, 'retired');
        lines.push({ t: '더는 일을 이어가기 어려워 일을 내려놓았다.', icon: '🌅', major: true });
      }
    } else if (a >= 65 && ['seeking', 'unemployed', 'idle'].indexOf(p.status) >= 0) {
      p.status = 'retired';   // 65세가 넘으면 구직 중이 아니라 은퇴한 것으로 본다 (연금을 받는다)
    } else if (a >= 19) {
      const base = p.status === 'seeking' || p.status === 'unemployed' ? 52 : p.status === 'retired' ? 22 : p.status === 'college' ? 40 : 35;
      p.stress = U().clamp(p.stress + (base - p.stress) * 0.3, 0, 100);
      if (p.status === 'seeking' && a >= 20) S().addStat(p, 'happy', -2);
    } else {
      const base = a >= 16 ? 42 : a >= 13 ? 30 : 15;
      p.stress = U().clamp(p.stress + (base + (p.family.tier >= 4 && p.urban ? 8 : 0) - p.stress) * 0.3, 0, 100);
    }

    // 노력의 누적 → 능력 (나이가 어릴수록 크게)
    const g = a < 13 ? 0.06 : a < 20 ? 0.055 : a < 35 ? 0.035 : 0.02;
    const E = p.effort;
    S().addStat(p, 'intelligence', E.study * g);
    S().addStat(p, 'physical', E.sport * g + (a < 18 ? 0.4 : 0));
    S().addStat(p, 'creativity', E.art * g);
    S().addStat(p, 'social', E.social * g);
    S().addStat(p, 'mental', (E.work + E.health) * g * 0.4);
    drift(p, a);

    if (LG.Style) p.stress = U().clamp(p.stress + LG.Style.stressShift(p) * 0.35, 0, 100); // 삶의 방식이 만드는 긴장/여유

    // 기분: 매년 '기준점' 쪽으로 천천히 수렴 (이벤트 효과는 단기, 플래그·관계는 장기)
    let target = 52;
    p.traits.forEach(t => { target += LG.DATA.traits[t].mood || 0; });
    target += (S().relScore(p) - 50) * 0.3;
    target += (p.stats.health - 60) * 0.15;
    target -= Math.max(0, p.stress - 35) * 0.35;
    if (LG.Style) target += LG.Style.moodShift(p);
    if (a >= 22) {
      const nw = S().netWorth(p);
      target += nw < 0 ? -8 : Math.min(8, Math.log10(1 + nw / 1000) * 5) - 2;
      if (p.status === 'seeking' || p.status === 'unemployed') target -= 6;
    }
    ['hobby', 'pet', 'volunteer', 'found_calling'].forEach(f => { if (S().has(p, f)) target += 3; });
    if (p.job) { const J = LG.DATA.jobs[p.job.id]; target += (J.wlb - 50) * 0.08; if (S().has(p, 'dream_job')) target += 5; }
    p.happy = U().clamp(p.happy + (target - p.happy) * 0.22 + R().float(p, -2, 2), 0, 100);

    // 회고
    REFLECTIONS.forEach((r, i) => {
      if (r.age === a && !p.done['refl' + i] && r.if(p)) { p.done['refl' + i] = 1; lines.push({ t: r.t, icon: '💭', reflect: true }); }
    });

    // 평생 평균
    const av = p.avg;
    av.n++;
    av.health += (p.stats.health - av.health) / av.n;
    av.happy += (p.happy - av.happy) / av.n;
    av.rel += (S().relScore(p) - av.rel) / av.n;
    return lines;
  }

  LG.Life = { yearly, REFLECTIONS };
})(window.LG = window.LG || {});
