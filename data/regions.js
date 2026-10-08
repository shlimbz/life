/* 지역 데이터 — 능력치 차이가 아니라 '기회와 비용'의 차이로 표현한다.
   edu: 교육·학원 접근성 / job: 일자리 / rent: 연 주거비(만원) / living: 생활비 지수
   culture, medical, community(공동체), mobility(교통·이동성) : 0~100
   wealth: 가정 형편 분포 편향 / urban: 도시 비율 / pop: 출생 가중치 */
(function (LG) {
  LG.DATA = LG.DATA || {};
  LG.DATA.regions = {
    seoul:     { name: '서울', short: '서울', pop: 18, edu: 92, job: 95, rent: 1150, living: 1.3, culture: 95, medical: 95, community: 38, mobility: 92, wealth: 0.55, urban: 1.0,
      cities: ['강남구', '노원구', '관악구', '마포구', '은평구', '송파구', '구로구', '중랑구', '양천구', '강서구'], rural: [] },
    gyeonggi:  { name: '경기도', short: '경기', pop: 26, edu: 78, job: 82, rent: 800, living: 1.15, culture: 72, medical: 80, community: 48, mobility: 74, wealth: 0.25, urban: 0.9,
      cities: ['수원', '성남', '고양', '용인', '부천', '안산', '화성', '의정부', '평택'], rural: ['양평', '가평', '연천', '여주'] },
    incheon:   { name: '인천', short: '인천', pop: 6, edu: 70, job: 74, rent: 700, living: 1.1, culture: 68, medical: 75, community: 52, mobility: 74, wealth: 0.05, urban: 0.92,
      cities: ['남동구', '부평구', '연수구', '서구', '미추홀구'], rural: ['강화', '옹진'] },
    busan:     { name: '부산', short: '부산', pop: 6.5, edu: 72, job: 66, rent: 620, living: 1.05, culture: 78, medical: 82, community: 58, mobility: 70, wealth: 0, urban: 0.96,
      cities: ['해운대구', '부산진구', '사하구', '동래구', '북구', '수영구'], rural: ['기장'] },
    daegu:     { name: '대구', short: '대구', pop: 4.5, edu: 76, job: 58, rent: 560, living: 1.0, culture: 68, medical: 80, community: 60, mobility: 64, wealth: -0.05, urban: 0.95,
      cities: ['수성구', '달서구', '북구', '동구'], rural: ['군위', '달성'] },
    gwangju:   { name: '광주', short: '광주', pop: 2.8, edu: 76, job: 54, rent: 500, living: 0.98, culture: 66, medical: 76, community: 66, mobility: 60, wealth: -0.1, urban: 0.97,
      cities: ['북구', '광산구', '서구', '남구'], rural: [] },
    daejeon:   { name: '대전', short: '대전', pop: 2.8, edu: 77, job: 62, rent: 520, living: 1.0, culture: 64, medical: 80, community: 60, mobility: 70, wealth: 0.05, urban: 0.97,
      cities: ['유성구', '서구', '중구', '대덕구'], rural: [] },
    ulsan:     { name: '울산', short: '울산', pop: 2.2, edu: 64, job: 70, rent: 560, living: 1.05, culture: 52, medical: 68, community: 58, mobility: 56, wealth: 0.3, urban: 0.9,
      cities: ['남구', '중구', '동구', '북구'], rural: ['울주'] },
    sejong:    { name: '세종', short: '세종', pop: 0.8, edu: 78, job: 60, rent: 640, living: 1.05, culture: 48, medical: 60, community: 56, mobility: 60, wealth: 0.4, urban: 0.88,
      cities: ['새롬동', '도담동', '보람동'], rural: ['조치원', '연기면'] },
    gangwon:   { name: '강원도', short: '강원', pop: 3, edu: 52, job: 42, rent: 360, living: 0.9, culture: 46, medical: 55, community: 74, mobility: 40, wealth: -0.3, urban: 0.62,
      cities: ['춘천', '원주', '강릉'], rural: ['평창', '정선', '홍천', '양구'] },
    chungbuk:  { name: '충청북도', short: '충북', pop: 3.2, edu: 56, job: 52, rent: 380, living: 0.9, culture: 46, medical: 60, community: 72, mobility: 52, wealth: -0.15, urban: 0.66,
      cities: ['청주', '충주', '제천'], rural: ['괴산', '보은', '옥천'] },
    chungnam:  { name: '충청남도', short: '충남', pop: 4.2, edu: 56, job: 60, rent: 400, living: 0.92, culture: 46, medical: 58, community: 72, mobility: 52, wealth: -0.05, urban: 0.66,
      cities: ['천안', '아산', '서산', '공주'], rural: ['예산', '청양', '부여', '태안'] },
    jeonbuk:   { name: '전라북도', short: '전북', pop: 3.4, edu: 56, job: 42, rent: 350, living: 0.88, culture: 52, medical: 60, community: 76, mobility: 46, wealth: -0.4, urban: 0.66,
      cities: ['전주', '익산', '군산'], rural: ['남원', '김제', '고창', '임실'] },
    jeonnam:   { name: '전라남도', short: '전남', pop: 3.4, edu: 50, job: 46, rent: 320, living: 0.86, culture: 42, medical: 50, community: 80, mobility: 38, wealth: -0.4, urban: 0.52,
      cities: ['순천', '여수', '목포', '광양'], rural: ['해남', '보성', '고흥', '진도', '담양'] },
    gyeongbuk: { name: '경상북도', short: '경북', pop: 5, edu: 52, job: 52, rent: 340, living: 0.88, culture: 44, medical: 52, community: 76, mobility: 44, wealth: -0.25, urban: 0.58,
      cities: ['포항', '구미', '경주', '안동'], rural: ['영주', '상주', '청송', '의성'] },
    gyeongnam: { name: '경상남도', short: '경남', pop: 6.4, edu: 58, job: 58, rent: 420, living: 0.92, culture: 50, medical: 62, community: 70, mobility: 50, wealth: -0.1, urban: 0.72,
      cities: ['창원', '김해', '진주', '양산', '거제'], rural: ['통영', '하동', '남해', '합천'] },
    jeju:      { name: '제주도', short: '제주', pop: 1.3, edu: 55, job: 46, rent: 560, living: 1.0, culture: 56, medical: 56, community: 70, mobility: 30, wealth: -0.1, urban: 0.72,
      cities: ['제주시', '서귀포시'], rural: ['애월', '구좌', '표선', '한림'] },
    // 이민 후 거주지 (출생지로는 뽑히지 않음)
    abroad:    { name: '해외', short: '해외', pop: 0, edu: 80, job: 66, rent: 950, living: 1.12, culture: 72, medical: 72, community: 30, mobility: 60, wealth: 0, urban: 1,
      cities: ['해외'], rural: [] }
  };
})(window.LG = window.LG || {});
