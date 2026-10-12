/* 직업 데이터
   income: 초봉(만원/년) growth: 연 상승률 stab: 안정성 stress: 업무 스트레스(0~100)
   status: 사회적 지위 hp: 연간 건강 영향 wlb: 일-삶 균형 edu: 최소 학력
   vary: 소득 변동성(0이면 고정) achv: 연간 성취 포인트 */
(function (LG) {
  LG.DATA = LG.DATA || {};
  LG.DATA.jobs = {
    office_big:  { name: '대기업 회사원', icon: '🏢', income: 4800, growth: 0.045, stab: 70, stress: 66, status: 70, hp: -0.4, wlb: 38, edu: 'college', vary: 0, achv: 1.2 },
    office_small:{ name: '중소기업 회사원', icon: '💼', income: 3000, growth: 0.03, stab: 52, stress: 55, status: 48, hp: -0.2, wlb: 48, edu: 'high', vary: 0, achv: 0.8 },
    civil:       { name: '공무원', icon: '🏛️', income: 3000, growth: 0.032, stab: 95, stress: 42, status: 62, hp: 0, wlb: 70, edu: 'high', vary: 0, achv: 0.8 },
    teacher:     { name: '교사', icon: '🍎', income: 3300, growth: 0.032, stab: 92, stress: 52, status: 66, hp: 0, wlb: 64, edu: 'college', vary: 0, achv: 1 },
    developer:   { name: '개발자', icon: '💻', income: 4200, growth: 0.05, stab: 58, stress: 60, status: 62, hp: -0.3, wlb: 50, edu: 'high', vary: 0.05, achv: 1.1 },
    designer:    { name: '디자이너', icon: '🎨', income: 3100, growth: 0.035, stab: 50, stress: 56, status: 56, hp: -0.2, wlb: 50, edu: 'high', vary: 0.05, achv: 1 },
    nurse:       { name: '간호사', icon: '🩺', income: 3600, growth: 0.03, stab: 82, stress: 76, status: 62, hp: -0.5, wlb: 34, edu: 'college', vary: 0, achv: 1.1 },
    doctor:      { name: '의사', icon: '⚕️', income: 7500, growth: 0.05, stab: 90, stress: 78, status: 90, hp: -0.4, wlb: 28, edu: 'college', vary: 0, achv: 1.6 },
    researcher:  { name: '연구원', icon: '🔬', income: 4200, growth: 0.035, stab: 70, stress: 56, status: 70, hp: -0.1, wlb: 56, edu: 'grad', vary: 0, achv: 1.4 },
    lawyer:      { name: '변호사', icon: '⚖️', income: 6200, growth: 0.05, stab: 72, stress: 80, status: 86, hp: -0.5, wlb: 28, edu: 'college', vary: 0.1, achv: 1.5 },
    cook:        { name: '요리사', icon: '🍳', income: 2700, growth: 0.035, stab: 46, stress: 64, status: 44, hp: -0.3, wlb: 34, edu: 'none', vary: 0.05, achv: 1 },
    service:     { name: '서비스직', icon: '🛎️', income: 2500, growth: 0.015, stab: 40, stress: 58, status: 34, hp: -0.2, wlb: 44, edu: 'none', vary: 0, achv: 0.5 },
    factory:     { name: '생산직', icon: '🏭', income: 3300, growth: 0.025, stab: 62, stress: 50, status: 40, hp: -0.4, wlb: 50, edu: 'none', vary: 0, achv: 0.6 },
    technician:  { name: '기술직', icon: '🔧', income: 3300, growth: 0.032, stab: 66, stress: 46, status: 50, hp: -0.3, wlb: 56, edu: 'none', vary: 0.05, achv: 1 },
    selfemp:     { name: '자영업자', icon: '🏪', income: 3600, growth: 0.02, stab: 30, stress: 70, status: 50, hp: -0.4, wlb: 30, edu: 'none', vary: 0.35, achv: 1.2 },
    freelancer:  { name: '프리랜서', icon: '🧑‍💻', income: 3000, growth: 0.03, stab: 28, stress: 50, status: 50, hp: -0.1, wlb: 62, edu: 'none', vary: 0.3, achv: 1 },
    artist:      { name: '예술가', icon: '🖌️', income: 1900, growth: 0.03, stab: 18, stress: 48, status: 52, hp: 0, wlb: 70, edu: 'none', vary: 0.5, achv: 1.4 },
    musician:    { name: '음악가', icon: '🎵', income: 2000, growth: 0.03, stab: 18, stress: 50, status: 54, hp: 0, wlb: 66, edu: 'none', vary: 0.5, achv: 1.4 },
    writer:      { name: '작가', icon: '✒️', income: 1800, growth: 0.03, stab: 20, stress: 46, status: 54, hp: 0, wlb: 70, edu: 'none', vary: 0.5, achv: 1.4 },
    athlete:     { name: '운동선수', icon: '🏅', income: 3800, growth: 0.06, stab: 26, stress: 70, status: 66, hp: 0.4, wlb: 40, edu: 'none', vary: 0.35, achv: 1.8 },
    coach:       { name: '코치·트레이너', icon: '🏋️', income: 3000, growth: 0.03, stab: 50, stress: 44, status: 50, hp: 0.4, wlb: 56, edu: 'none', vary: 0.1, achv: 1 },
    creator:     { name: '크리에이터', icon: '📹', income: 2200, growth: 0.06, stab: 16, stress: 60, status: 58, hp: -0.2, wlb: 50, edu: 'none', vary: 0.7, achv: 1.3 },
    ceo:         { name: '사업가', icon: '📈', income: 5000, growth: 0.03, stab: 30, stress: 78, status: 82, hp: -0.5, wlb: 24, edu: 'none', vary: 0.45, achv: 2 },
    farmer:      { name: '농업인', icon: '🌾', income: 2600, growth: 0.02, stab: 50, stress: 40, status: 42, hp: 0.2, wlb: 50, edu: 'none', vary: 0.25, achv: 0.8 },
    driver:      { name: '운전기사', icon: '🚚', income: 3000, growth: 0.015, stab: 50, stress: 52, status: 36, hp: -0.4, wlb: 40, edu: 'none', vary: 0.05, achv: 0.5 },
    socialworker:{ name: '사회복지사', icon: '🤝', income: 2800, growth: 0.03, stab: 70, stress: 62, status: 50, hp: -0.2, wlb: 48, edu: 'college', vary: 0, achv: 1 },
    translator:  { name: '통번역가', icon: '🌐', income: 3300, growth: 0.035, stab: 40, stress: 52, status: 58, hp: -0.1, wlb: 58, edu: 'college', vary: 0.2, achv: 1.1 },
    engineer:    { name: '엔지니어', icon: '🛠️', income: 4000, growth: 0.04, stab: 66, stress: 56, status: 60, hp: -0.2, wlb: 50, edu: 'college', vary: 0, achv: 1.1 },
    parttime:    { name: '아르바이트', icon: '🧾', income: 1700, growth: 0.01, stab: 15, stress: 48, status: 24, hp: -0.1, wlb: 50, edu: 'none', vary: 0.1, achv: 0.2 },
    idol:        { name: '아이돌', icon: '🎤', income: 2200, growth: 0.06, stab: 10, stress: 84, status: 74, hp: -0.4, wlb: 18, edu: 'none', vary: 0.8, achv: 2.2 },
    entertainer: { name: '연예인', icon: '🎬', income: 2600, growth: 0.05, stab: 14, stress: 72, status: 76, hp: -0.2, wlb: 34, edu: 'none', vary: 0.75, achv: 2 },
    homemaker:   { name: '전업주부', icon: '🏠', income: 0, growth: 0, stab: 80, stress: 45, status: 40, hp: 0, wlb: 50, edu: 'none', vary: 0, achv: 0.6 }
  };

  // 부모 직업 풀 (가정 형편 단계별)
  LG.DATA.parentJobs = {
    1: { service: 4, factory: 3, driver: 3, parttime: 3, farmer: 2, selfemp: 1, homemaker: 1 },
    2: { factory: 4, service: 3, driver: 2, office_small: 3, selfemp: 3, farmer: 2, technician: 2, homemaker: 2 },
    3: { office_small: 5, civil: 3, teacher: 2, technician: 3, selfemp: 3, nurse: 1, factory: 2, homemaker: 3 },
    4: { office_big: 4, civil: 3, teacher: 3, developer: 2, nurse: 2, researcher: 1, selfemp: 2, homemaker: 3 },
    5: { doctor: 3, lawyer: 2, ceo: 4, office_big: 3, researcher: 1, homemaker: 3 }
  };
})(window.LG = window.LG || {});
