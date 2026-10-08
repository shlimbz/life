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
    { age: 45, if: p => S().has(p, 'emigrated'), t: '낯선 나라에서 버틴 시간들이 이제는 나의 일부가 되었다.' }
  ];

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
      const gift = { 1: 0, 2: 100, 3: 400, 4: 1500, 5: 4000 }[p.family.tier] * U().clamp(S().supportScore(p) / 60, 0.4, 1.3);
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
          lines.push({ t: '변호사 시험에 떨어졌다. 법학 학위만 남았다.', icon: '📕', major: true });
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
    S().addStat(p, 'intelligence', E.study * g - (a > 60 ? 0.3 : 0));
    S().addStat(p, 'physical', E.sport * g + (a < 18 ? 0.4 : a > 35 ? -0.5 : 0));
    S().addStat(p, 'creativity', E.art * g);
    S().addStat(p, 'social', E.social * g);
    S().addStat(p, 'mental', (E.work + E.health) * g * 0.4);

    // 기분: 매년 '기준점' 쪽으로 천천히 수렴 (이벤트 효과는 단기, 플래그·관계는 장기)
    let target = 52;
    p.traits.forEach(t => { target += LG.DATA.traits[t].mood || 0; });
    target += (S().relScore(p) - 50) * 0.3;
    target += (p.stats.health - 60) * 0.15;
    target -= Math.max(0, p.stress - 35) * 0.35;
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
