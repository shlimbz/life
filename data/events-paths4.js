/* 이벤트 — 분야별 삶의 길 ③  돌봄·봉사 / 자연·농촌 / 세계·언어 */
(function (LG) {
  const E = LG.DATA.events;
  const H = LG.EH, has = H.has, disc = H.disc;
  const A = H.A;
  const jobIs = H.jobIs;
  const S = H.S;
  const ch = H.pusher({ tier: 'choice', w: 12, max: 1 });

  // ═════════════════════════ 돌봄 · 봉사 ═════════════════════════

  ch({
    id: 'cr_stray', cat: 'care', ages: [7, 13], dom: ['care'], icon: '🐈', label: '돌봄',
    if: p => A(p, 'care') >= 10 || !p.urban || has(p, 'pet'),
    title: '골목의 길고양이', text: '매일 학교 가는 골목에 야윈 길고양이 한 마리가 앉아 있다. 비가 오는 날에도 같은 자리에 있다.',
    choices: [
      { id: 'feed', label: '매일 몰래 먹이를 챙겨 준다', intent: 'family',
        check: { base: 54, partial: 0.4, f: [['stat', 'mental', 0.15], ['family', 0.2]] },
        out: {
          success: { t: '고양이가 꼬리를 세우고 다가오기 시작했다. 누군가를 돌본다는 기쁨을 처음 느꼈다.', log: '길고양이를 돌봄', flag: 'caregiver_kid', eff: { social: 4 }, st: { mental: 2 }, hp: 10 },
          partial: { t: '이웃 어른께 "먹이를 주면 안 된다"는 말을 듣고 살짝 눈치를 보며 줬다.', flag: 'caregiver_kid', hp: 4 },
          fail: { t: '어느 날 고양이가 보이지 않았다. 마음이 아팠다.', hp: -5 }
        } },
      { id: 'adopt', label: '집에 데려가자고 부모님을 설득한다', intent: 'family',
        check: { base: 36, partial: 0.3, f: [['family', 0.4], ['support', 0.3], ['rel', 'mother', 0.1]] },
        out: {
          success: { t: '며칠을 졸라 허락을 받았다. 새로운 가족이 생겼다.', log: '고양이를 입양', flag: ['caregiver_kid', 'pet'], hp: 14, rel: { parents: 2 } },
          fail: { t: '"안 돼." 단호한 대답에 눈물이 났다.', hp: -5 }
        } },
      { id: 'pass', label: '안쓰럽지만 지나친다', intent: 'rest', out: { t: '마음이 불편했지만 발길을 돌렸다.', hp: -1 } }
    ]
  });

  ch({
    id: 'cr_hospital_vol', cat: 'care', ages: [15, 19], dom: ['care'], icon: '🏥', label: '돌봄',
    if: p => A(p, 'care') >= 14 || has(p, 'caregiver_kid') || has(p, 'volunteer') || has(p, 'stood_up') || p.stats.mental >= 66,
    title: '병원 봉사 체험', text: '학교에서 지역 병원·복지관 봉사 프로그램 신청을 받는다. 봉사 시간도 챙길 수 있지만, 아픈 사람들을 가까이 마주하는 일이다.',
    choices: [
      { id: 'join', label: '병원·복지관에서 봉사한다', intent: 'social',
        check: { base: 58, partial: 0.4, f: [['stat', 'mental', 0.3], ['stat', 'social', 0.15]] },
        out: {
          success: { t: '할머니의 손을 잡아 드렸더니 "고맙다"며 눈물을 흘리셨다. 이 일이 내 길일지도 모른다는 생각이 들었다.', log: '병원·복지관 봉사', flag: ['volunteer', 'hospital_vol'], eff: { social: 6 }, st: { mental: 2 }, hp: 12 },
          partial: { t: '힘든 장면에 놀랐지만 끝까지 버텼다. 값진 경험이었다.', flag: 'volunteer', hp: 5, st: { mental: 1 } },
          fail: { t: '너무 힘들어 도중에 나왔다. 나는 이런 일이 안 맞는 걸까.', hp: -5, sr: 8 }
        } },
      { id: 'hours', label: '봉사 시간만 채운다', intent: 'stability', out: { t: '시간만 채우고 돌아왔다.', hp: 0 } },
      { id: 'no', label: '입시가 급해 포기한다', intent: 'education', out: { t: '지금은 책상 앞이 먼저다.', eff: { study: 5 } } }
    ]
  });

  ch({
    id: 'cr_first_night', cat: 'care', ages: [21, 31], dom: ['care'], icon: '🌙', label: '돌봄', w: 16,
    if: p => jobIs(p, 'nurse', 'doctor', 'socialworker') || ['nursing', 'med', 'welfare'].indexOf(p.major) >= 0,
    title: '첫 야간 근무', text: '새벽 세 시, 병동의 불이 하나둘 꺼진다. 곁에 있던 선배도 다른 환자에게 가 버렸다. 그때 한 환자의 상태가 급격히 나빠졌다.',
    choices: [
      { id: 'act', label: '배운 대로 침착하게 대응한다', intent: 'career',
        check: { base: 50, partial: 0.5, f: [['stat', 'mental', 0.35], ['stat', 'intelligence', 0.2], ['perf', 0.15], ['eff', 'study', 0.1]] },
        out: {
          success: { t: '재빠른 판단 덕에 환자가 위기를 넘겼다. 선배가 "잘했다"며 어깨를 두드렸다. 처음으로 이 일이 내 일이라는 확신이 들었다.', log: '첫 야간 근무에서 환자를 살림', major: true, perf: 8, achv: 3, hp: 12, st: { mental: 3 } },
          partial: { t: '서툴렀지만 선배가 도착해 수습했다. 많이 배웠다.', perf: 2, sr: 10, hp: 1 },
          fail: { t: '당황해서 아무것도 하지 못했다. 환자는 다행히 회복했지만 자책이 오래 갔다.', hp: -10, sr: 16, perf: -3 }
        } },
      { id: 'call', label: '바로 선배·당직의를 호출한다', intent: 'stability', out: { t: '혼자 판단하지 않고 즉시 알렸다. 그것도 중요한 능력이라는 말을 들었다.', perf: 3, hp: 3 } }
    ]
  });

  ch({
    id: 'cr_burnout', cat: 'care', ages: [29, 56], dom: ['care'], icon: '🕯️', label: '돌봄', w: 15, cd: 8, max: 2,
    if: p => jobIs(p, 'nurse', 'doctor', 'socialworker', 'teacher') && p.job.years >= 5,
    title: '감정이 닳는다는 것', text: '환자와 보호자, 아이들, 민원인…. 하루 종일 다른 사람의 감정을 받아 내다 보니 정작 내 감정이 무뎌진 것 같다. 쉬는 날에도 전화가 울릴까 불안하다.',
    choices: [
      { id: 'rest', label: '휴직·휴가를 내고 몸과 마음을 챙긴다', intent: 'rest',
        out: { t: '한 달을 쉬었다. 처음엔 죄책감이 들었지만 회복하자 다시 사람을 볼 힘이 생겼다.', log: '번아웃으로 휴직 후 복귀', hp: 10, sr: -14, st: { mental: 2 }, money: -250 } },
      { id: 'talk', label: '동료들과 상담 모임을 만든다', intent: 'social',
        check: { base: 52, partial: 0.4, f: [['stat', 'social', 0.25], ['region', 'community', 0.15]] },
        out: {
          success: { t: '서로의 이야기를 나누며 위로받았다. 이 모임이 직장의 버팀목이 되었다.', log: '동료 상담 모임을 꾸림', hp: 9, sr: -8, st: { social: 2 }, rel: { friends: 3 } },
          partial: { t: '모임은 이어지지만 근본적인 피로는 남아 있다.', hp: 2, sr: -2 },
          fail: { t: '다들 바빠서 모임이 흐지부지됐다. 홀로 버티는 시간이 길어졌다.', hp: -4, sr: 8 }
        } },
      { id: 'push', label: '"다들 그래." 계속 버틴다', intent: 'stability', out: { t: '밥도 거르며 일했다. 몸이 먼저 신호를 보냈다.', hp: -10, sr: 16, st: { health: -4 }, perf: -3 } },
      { id: 'leave', label: '이 길을 떠나 다른 일을 찾는다', intent: 'independence', out: { t: '오래 걸은 길이었지만, 놓고 나니 숨이 쉬어졌다.', log: '돌봄 직군을 떠남', hp: 4, sr: -8, fn: p => { LG.Outcome.quitJob(p, 'seeking'); return ''; } } }
    ]
  });

  ch({
    id: 'cr_hospice', cat: 'care', ages: [54, 80], dom: ['care'], icon: '🕊️', label: '돌봄',
    if: p => A(p, 'care') >= 24 || has(p, 'volunteer') || has(p, 'hospital_vol') || jobIs(p, 'nurse', 'doctor', 'socialworker') || p.job == null && p.age >= 60,
    title: '곁을 지키는 일', text: '동네 호스피스 병동에서 말벗 자원봉사자를 구한다. 마지막 시간을 지내는 이들의 곁에 앉아 이야기를 들어 주는 일이다.',
    choices: [
      { id: 'vol', label: '일주일에 한 번 봉사하러 간다', intent: 'hobby',
        check: { base: 60, partial: 0.4, f: [['stat', 'mental', 0.3]] },
        out: {
          success: { t: '한 어르신이 "당신 덕에 오늘이 덜 외로웠소"라고 말씀하셨다. 내 삶의 무게도 가벼워졌다.', log: '호스피스 자원봉사', flag: 'volunteer', hp: 14, sr: -6, rel: { friends: 3 }, st: { mental: 2 } },
          partial: { t: '쉽지 않은 시간들이었지만 많은 것을 배웠다.', flag: 'volunteer', hp: 5, sr: 4 },
          fail: { t: '감정이 너무 무거워 몇 번 나가다 그만두었다.', hp: -3, sr: 8 }
        } },
      { id: 'donate', label: '후원금을 보낸다', intent: 'stability', out: { t: '조용히 후원을 시작했다. 작은 마음이지만 의미가 있다.', money: -50, hp: 4 } },
      { id: 'no', label: '내 몸 하나 건사하기도 벅차다', intent: 'rest', out: { t: '지금은 내 일상에 집중하기로 했다.', hp: 0 } }
    ]
  });

  // ═════════════════════════ 자연 · 농촌 ═════════════════════════

  ch({
    id: 'nt_garden', cat: 'nature', ages: [7, 12], dom: ['nature'], icon: '🥕', label: '자연',
    if: p => A(p, 'nature') >= 12 || !p.urban,
    title: '텃밭에서 자라는 것들', text: p => !p.urban ? '할머니(부모님) 텃밭에서 씨를 뿌리고 물을 주었다. 며칠 지나니 작은 싹이 올라왔다.' : '학교 옥상 텃밭 체험에서 방울토마토 모종을 심었다. 매일 물을 줄 사람이 필요하다.',
    choices: [
      { id: 'tend', label: '매일 물을 주고 관찰일기를 쓴다', intent: 'hobby',
        check: { base: 62, partial: 0.4, f: [['trait', 'careful', 5], ['stat', 'mental', 0.1]] },
        out: {
          success: { t: '한 달 뒤 빨갛게 익은 토마토를 땄다. 직접 키운 걸 먹는 기쁨이 컸다.', log: '텃밭 가꾸기', flag: ['farm_helper', 'garden_kid'], st: { health: 1, mental: 1 }, hp: 10 },
          partial: { t: '반은 시들었지만 몇 개는 열렸다. 키우는 일이 쉽지 않다는 걸 배웠다.', flag: 'garden_kid', hp: 5 },
          fail: { t: '물 주기를 깜빡해 다 말라 버렸다.', hp: -3 }
        } },
      { id: 'play', label: '흙장난이 재밌어서 놀기만 한다', intent: 'rest', out: { t: '흙 묻은 손으로 뛰어다녔다. 이것도 즐거운 기억이다.', hp: 5 } }
    ]
  });

  ch({
    id: 'nt_agri_hs', cat: 'nature', ages: [15, 18], dom: ['nature'], icon: '🚜', label: '자연', w: 14,
    if: p => A(p, 'nature') >= 28 && (has(p, 'farm_helper') || !p.urban || parentJobIs(p, 'farmer')),
    title: '농업계 고교와 후계농', text: '농업계 특성화고와 한국농수산대학 후계농 과정을 소개받았다. 농사를 이어받을지, 입시 쪽으로 갈지 정해야 한다.',
    choices: [
      { id: 'agri', label: '농업계 진학을 준비한다', intent: 'career',
        check: { base: 52, partial: 0.4, f: [['eff', 'work', 0.2], ['stat', 'physical', 0.2], ['family', 0.2]] },
        out: {
          success: { t: '실습과 자격증 준비 끝에 후계농 과정에 합격했다. 흙에서 시작하는 새 길이다.', log: '농업 계열 진학', flag: ['agri_path', 'vocational'], track: 'vocational', hp: 8, eff: { work: 10 } },
          partial: { t: '농업 쪽 진로를 천천히 준비하기로 했다.', flag: 'agri_path', hp: 3 },
          fail: { t: '부모님이 극구 반대하셨다. 일반 대입으로 방향을 돌렸다.', hp: -6 }
        } },
      { id: 'help', label: '방학마다 농사일을 도우며 경험만 쌓는다', intent: 'family', out: { t: '여름 방학마다 비닐하우스에서 땀을 흘렸다. 새벽 공기가 그리울 때가 있다.', flag: 'farm_helper', eff: { work: 6 }, st: { physical: 2 }, hp: 4, rel: { parents: 4 } } },
      { id: 'out', label: '농촌을 떠나 도시 학교로 가고 싶다', intent: 'independence', out: { t: '"여긴 내가 있을 곳이 아니야."라는 마음이 커졌다.', hp: 1 } }
    ]
  });
  function parentJobIs(p, ...ids) { return LG.Rel.parents(p).some(n => ids.indexOf(n.job) >= 0); }

  ch({
    id: 'nt_young_farmer', cat: 'nature', ages: [22, 38], dom: ['nature'], icon: '🌱', label: '자연', w: 14,
    if: p => A(p, 'nature') >= 30 && (p.major === 'agri' || has(p, 'agri_path') || has(p, 'returned_farm') || jobIs(p, 'farmer')),
    title: '청년농업인 지원사업', text: '청년 농업인 영농정착지원금과 스마트팜 임대 사업 공고가 올라왔다. 땅과 시설 비용이 걸림돌이지만 기회는 지금뿐이다.',
    choices: [
      { id: 'smart', label: '스마트팜 사업에 지원한다', intent: 'adventure',
        check: { base: 34, partial: 0.5, f: [['stat', 'intelligence', 0.25], ['assets', 0.2], ['eff', 'work', 0.2], ['flag', 'agri_path', 6, '농업 전공·경험']] },
        out: {
          success: { t: '선정되었다! 첨단 시설에서 딸기를 키우며 수확량이 쑥쑥 늘었다.', log: '스마트팜 청년 농업인', major: true, flag: 'smart_farm', job: 'farmer', money: 800, debt: 1500, achv: 4, hp: 12 },
          partial: { t: '탈락했지만 정착지원금은 받게 되었다. 작게 시작하기로 했다.', flag: 'returned_farm', money: 300, hp: 4 },
          fail: { t: '서류에서 탈락했다. 농지를 구하는 길이 쉽지 않다.', hp: -5, sr: 6 }
        } },
      { id: 'rent', label: '임대농지에서 작게 시작한다', intent: 'stability',
        out: { t: '작은 밭 하나를 빌려 직접 채소를 키워 팔았다. 큰돈은 안 되지만 흙과 사는 삶이 좋다.', log: '임대농지에서 영농 시작', flag: 'returned_farm', money: 100, hp: 8, st: { health: 1 } } },
      { id: 'city', label: '도시 직장에 남는다', intent: 'career', out: { t: '농촌의 삶은 로망으로 남겨 두기로 했다.', hp: -1 } }
    ]
  });

  ch({
    id: 'nt_climate', cat: 'nature', ages: [30, 62], dom: ['nature'], icon: '🌧️', label: '자연', w: 15, cd: 9, max: 2,
    if: p => jobIs(p, 'farmer') || has(p, 'smart_farm') || has(p, 'returned_farm'),
    title: '이상기후의 해', text: '올해는 냉해와 폭우가 연달아 덮쳤다. 한 해 농사가 걸린 시기에 수확량이 크게 떨어질 것이라는 예보가 나왔다.',
    choices: [
      { id: 'insure', label: '농작물 재해보험으로 대응한다', intent: 'stability',
        check: { base: 60, partial: 0.4, f: [['stat', 'intelligence', 0.15], ['region', 'community', 0.15]] },
        out: {
          success: { t: '보험금으로 손실의 상당 부분을 막았다. 미리 가입해 둔 것이 큰 힘이 됐다.', money: 300, hp: 2 },
          partial: { t: '보험금은 일부만 나왔다. 그래도 버틸 수 있다.', money: 100, sr: 8 },
          fail: { t: '보상 기준에서 제외돼 피해를 고스란히 떠안았다.', money: -500, hp: -8, sr: 14 }
        } },
      { id: 'adapt', label: '작물과 재배 방식을 바꿔 대응한다', intent: 'adventure',
        check: { base: 40, partial: 0.5, f: [['stat', 'intelligence', 0.25], ['eff', 'work', 0.2]] },
        out: {
          success: { t: '내한성 품종과 시설 보강으로 피해를 최소화했다. 이웃들이 방법을 물으러 왔다.', log: '이상기후에 재배 방식을 바꿔 대응', money: 400, perf: 4, hp: 8 },
          partial: { t: '절반만 건졌다. 내년 준비에 더 신경 써야겠다.', money: 50, sr: 10 },
          fail: { t: '새 방법이 맞지 않아 오히려 손해를 봤다.', money: -400, hp: -8, sr: 14 }
        } },
      { id: 'quit', label: '농사를 접고 다른 일을 찾는다', intent: 'independence', out: { t: '땅은 그대로 두고 도시로 일자리를 구하러 떠났다.', log: '이상기후에 농사를 접음', hp: -4, sr: 4, fn: p => { LG.Outcome.quitJob(p, 'seeking'); return ''; } } }
    ]
  });

  ch({
    id: 'nt_second_home', cat: 'nature', ages: [52, 76], dom: ['nature'], icon: '🏡', label: '자연',
    if: p => A(p, 'nature') >= 24 || has(p, 'hiking') || has(p, 'returned_farm') || p.urban === false,
    title: '귀촌의 꿈', text: '정년이 가까워지니 도시가 숨 막힌다. 시골 빈집과 작은 땅이 헐값에 나왔다는 소식이 들려왔다.',
    choices: [
      { id: 'move', label: '귀촌해 텃밭을 가꾼다', intent: 'independence',
        check: { base: 52, partial: 0.4, f: [['assets', 0.2], ['rel', 'spouse', 0.15], ['region', 'medical', -0.05]] },
        out: {
          success: { t: '아침마다 새소리에 눈을 뜬다. 이웃들과 막걸리 한 잔 나누는 저녁이 좋다.', log: '시골로 귀촌', flag: 'rural_retire', hp: 14, sr: -10, money: -600, fn: p => { p.urban = false; return ''; } },
          partial: { t: '불편한 점은 많지만 마음은 한결 편하다.', flag: 'rural_retire', hp: 7, sr: -5, money: -600 },
          fail: { t: '의료와 교통이 불편해 고민이 많아졌다. 결국 다시 도시로 돌아왔다.', hp: -6, money: -800 }
        } },
      { id: 'weekend', label: '주말 농장으로 만족한다', intent: 'hobby', out: { t: '주말마다 시골 밭에서 땀을 흘린다. 월요일이 덜 무겁다.', hp: 7, sr: -4, money: -100 } },
      { id: 'stay', label: '도시 생활이 편하다', intent: 'stability', out: { t: '병원과 마트가 가까운 지금 집이 제일이다.', hp: 1 } }
    ]
  });

  // ═════════════════════════ 세계 · 언어 ═════════════════════════

  ch({
    id: 'gl_pals', cat: 'global', ages: [9, 14], dom: ['global'], icon: '✉️', label: '세계',
    if: p => A(p, 'global') >= 14 || p.family.tier >= 4,
    title: '낯선 나라의 친구', text: '영어 시간에 외국 친구와 편지를 주고받는 프로그램을 시작했다. 서툰 영어로 쓴 첫 문장이 떨린다.',
    choices: [
      { id: 'write', label: '꾸준히 편지·메시지를 주고받는다', intent: 'social',
        check: { base: 56, partial: 0.4, f: [['talent', 'language', 10], ['eff', 'study', 0.15]] },
        out: {
          success: { t: '친구와 서로의 나라 이야기를 나누었다. 세계가 한 뼘 넓어졌다.', log: '해외 펜팔 친구', flag: ['pen_pal', 'lang_camp'], eff: { study: 5 }, st: { intelligence: 1, social: 1 }, hp: 8, fn: disc('language') },
          partial: { t: '몇 번 주고받다 뜸해졌지만 영어에 대한 흥미가 생겼다.', flag: 'pen_pal', hp: 3 },
          fail: { t: '답장이 오지 않아 서운했다.', hp: -2 }
        } },
      { id: 'cartoon', label: '영어 만화·영상으로 접한다', intent: 'hobby', out: { t: '자막 없이 영상을 보려다 보니 영어가 늘었다.', eff: { study: 4 }, hp: 4 } },
      { id: 'pass', label: '영어는 숙제만 한다', intent: 'rest', out: { t: '영어는 점수로만 남았다.', hp: 0 } }
    ]
  });

  ch({
    id: 'gl_exam', cat: 'global', ages: [15, 19], dom: ['global'], icon: '🌐', label: '세계', w: 13,
    if: p => A(p, 'global') >= 18 && (p.track === 'academic' || p.track == null),
    title: '외국어와 해외 진학', text: '외국어고·국제학교 입학 설명회, 그리고 해외 대학 진학 이야기가 솔솔 들린다. 어학 시험 점수가 곧 선택지를 넓혀 준다.',
    choices: [
      { id: 'foreign', label: '외고·어학 특기로 입시를 준비한다', intent: 'education',
        check: { base: 36, partial: 0.5, f: [['talent', 'language', 14], ['stat', 'intelligence', 0.3], ['eff', 'study', 0.3], ['eduEnv', 0.2], ['flag', 'pen_pal', 6, '외국어 경험']] },
        out: {
          success: { t: '어학 성적과 면접이 높은 평가를 받았다. 외국어를 중심으로 한 진학 길이 열렸다.', log: '어학 특기로 진학 길을 엶', flag: 'lang_track', eff: { study: 14 }, st: { intelligence: 3 }, hp: 10, achv: 3 },
          partial: { t: '아슬아슬하게 기준에 못 미쳤다. 일반 입시로 병행한다.', flag: 'lang_camp', eff: { study: 8 }, hp: 0 },
          fail: { t: '압박감이 컸다. 한 번 크게 흔들렸지만 다시 일어섰다.', hp: -8, sr: 12 }
        } },
      { id: 'camp', label: '방학 어학연수를 다녀온다', intent: 'adventure', if: p => p.family.tier >= 3,
        out: { t: '낯선 도시에서 한 달을 보냈다. 밥 주문 하나가 큰 도전이던 날들이 지금은 추억이 되었다.', log: '방학 어학연수', flag: ['lang_camp', 'abroad_exp'], eff: { study: 8 }, st: { social: 2 }, hp: 10, money: -400 } },
      { id: 'self', label: '혼자 영상·앱으로 공부한다', intent: 'independence', out: { t: '비용은 거의 안 들지만 꾸준히 하기가 어렵다. 그래도 조금씩 늘고 있다.', eff: { study: 6 }, hp: 2 } }
    ]
  });

  ch({
    id: 'gl_job_abroad', cat: 'global', ages: [23, 34], dom: ['global'], icon: '🛫', label: '세계', w: 14,
    if: p => A(p, 'global') >= 24 && (p.major === 'lang' || has(p, 'lang_track') || has(p, 'working_holiday') || has(p, 'abroad_exp') || jobIs(p, 'translator')),
    title: '해외 일자리 제안', text: '해외 지사에서 일하는 선배가 "우리 쪽에 자리가 났다"며 연락을 줬다. 낯선 나라에서 새 삶을 시작할 기회지만, 가족과 친구는 멀어진다.',
    choices: [
      { id: 'go', label: '짐을 싸서 떠난다', intent: 'adventure',
        check: { base: 42, partial: 0.5, f: [['talent', 'language', 12], ['stat', 'social', 0.2], ['stat', 'mental', 0.2], ['flag', 'working_holiday', 6, '해외 경험'], ['assets', 0.1]] },
        out: {
          success: { t: '낯선 도시의 아침 공기가 설레었다. 동료들과 친해지며 새로운 정체성을 찾아갔다.', log: '해외 취업', major: true, flag: ['abroad_work', 'emigrated'], money: 500, hp: 14, achv: 4, st: { social: 2 }, rel: { family: -3 } },
          partial: { t: '문화 차이에 많이 부딪혔지만 일 년을 버텨 냈다.', log: '해외 근무에서 분투', flag: 'abroad_work', money: 200, hp: 3, sr: 12 },
          fail: { t: '외로움과 비자 문제로 지쳐 귀국했다. 돌아와서도 한참 어리둥절했다.', hp: -10, sr: 16, money: -300 }
        } },
      { id: 'stay', label: '가까운 사람들 곁에 남는다', intent: 'family', out: { t: '아쉬움이 남지만 곁에 사람들이 있다는 사실이 든든했다.', rel: { family: 4, friends: 3 }, hp: 1 } },
      { id: 'remote', label: '원격으로 해외 업무를 맡는다', intent: 'career', out: { t: '시차에 시달리지만 국내에 머물며 해외 일을 했다.', eff: { work: 6 }, money: 150, sr: 8 } }
    ]
  });

  ch({
    id: 'gl_expat', cat: 'global', ages: [34, 52], dom: ['global'], icon: '🧳', label: '세계', w: 12,
    if: p => A(p, 'global') >= 30 && !!p.job && (p.job.years >= 5) && p.family.tier >= 2,
    title: '주재원 발령', text: '회사에서 해외 주재원 파견을 제안했다. 급여와 주거 수당은 파격적이지만 가족의 생활이 크게 바뀐다. 아이 교육 문제도 고민이다.',
    choices: [
      { id: 'family', label: '가족과 함께 떠난다', intent: 'family',
        check: { base: 56, partial: 0.5, f: [['rel', 'spouse', 0.2], ['stat', 'mental', 0.2], ['talent', 'language', 6]] },
        out: {
          success: { t: '새로운 나라에서 가족이 더 단단해졌다. 아이들은 두 개의 언어를 쓰며 자란다.', log: '가족과 함께 해외 주재', major: true, flag: 'expat', money: 1500, hp: 10, rel: { spouse: 4, children: 4 } },
          partial: { t: '적응은 쉽지 않았지만 몇 년 뒤 소중한 경험이 되었다.', flag: 'expat', money: 1000, sr: 12, hp: 2 },
          fail: { t: '배우자가 적응하지 못해 갈등이 커졌다. 결국 조기 귀국했다.', hp: -10, sr: 16, rel: { spouse: -8 } }
        } },
      { id: 'alone', label: '혼자 떠난다 (기러기)', intent: 'career', out: { t: '매일 영상통화로 가족 얼굴을 본다. 돈은 모이지만 마음은 외롭다.', money: 1800, hp: -6, sr: 12, rel: { family: -6 } } },
      { id: 'decline', label: '거절한다', intent: 'stability', out: { t: '가족의 일상이 우선이었다. 승진에 불이익이 있을지 모르지만 후회는 없다.', perf: -4, rel: { family: 5 }, hp: 1 } }
    ]
  });

  ch({
    id: 'gl_travel_late', cat: 'global', ages: [55, 80], dom: ['global'], icon: '🌍', label: '세계',
    if: p => A(p, 'global') >= 22 || has(p, 'abroad_work') || has(p, 'working_holiday') || has(p, 'expat') || (p.family.tier >= 4 && p.age >= 58),
    title: '버킷리스트: 세계 일주', text: '시간과 여유가 생겼다. 평생 가고 싶던 나라들의 사진을 오랫동안 모아 왔다. 이제 정말 떠날 수 있다.',
    choices: [
      { id: 'tour', label: '긴 여행을 떠난다', intent: 'adventure',
        check: { base: 62, partial: 0.4, f: [['health', 0.3], ['assets', 0.2], ['talent', 'language', 6]] },
        out: {
          success: { t: '몇 달간의 여행에서 만난 풍경과 사람들이 마음에 오래 남았다. 돌아와서도 매일 사진을 들여다본다.', log: '인생 후반의 긴 여행', hp: 16, sr: -10, money: -800, st: { mental: 2 } },
          partial: { t: '몸이 예전 같지 않아 일정이 줄었지만 알찬 여행이었다.', hp: 8, money: -600 },
          fail: { t: '여행 중 건강이 나빠져 일찍 돌아왔다. 아쉽지만 그 시간들은 소중했다.', hp: -4, money: -700, st: { health: -4 } }
        } },
      { id: 'near', label: '국내·가까운 나라를 나눠서 다닌다', intent: 'hobby', out: { t: '부담 없이 한 달에 한 번씩 떠난다. 삶에 리듬이 생겼다.', hp: 9, money: -250 } },
      { id: 'home', label: '영상으로 세계를 본다', intent: 'rest', out: { t: '소파에 앉아 다큐멘터리로 세계를 둘러본다. 이것도 나쁘지 않다.', hp: 3 } }
    ]
  });
})(window.LG = window.LG || {});
