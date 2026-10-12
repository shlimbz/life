/* 선천적 재능 — 출생 시 0~2개, 처음엔 숨겨져 있고 이벤트로 '발견'된다.
   재능은 확률 보정일 뿐, 노력·환경 없이는 결과를 보장하지 않는다. */
(function (LG) {
  LG.DATA = LG.DATA || {};
  LG.DATA.talents = {
    sport:        { name: '운동', icon: '⚽', boost: { physical: 14 }, hint: '몸을 쓰는 일이라면 남들보다 빨리 익혔다.', sign: '운동회에서 상급생들을 제치고 혼자 멀찍이 달렸다. 체육 선생님이 "저 아이는 물건이다"라며 오래 지켜보셨다.' },
    music:        { name: '음악', icon: '🎹', boost: { creativity: 8 }, hint: '한 번 들은 멜로디를 바로 따라 불렀다.', sign: '한 번 들은 곡을 악보 없이 그대로 쳤다. 피아노 선생님이 레슨 노트에 느낌표를 세 개나 적었다.' },
    art:          { name: '미술', icon: '🎨', boost: { creativity: 12 }, hint: '연습장 귀퉁이 낙서가 유난히 그럴듯했다.', sign: '그림 대회에서 어른들이 내 작품 앞에서 한참 걸음을 멈췄다. 초등학생 그림 같지 않다고 했다.' },
    math:         { name: '수학', icon: '📐', boost: { intelligence: 10 }, hint: '숫자 퍼즐 앞에서 눈이 반짝였다.', sign: '수학 문제를 혼자 다 풀고 심심해했다. 선생님이 따로 어려운 문제지를 만들어 주셨다.' },
    language:     { name: '언어', icon: '🗣️', boost: { intelligence: 5, social: 4 }, hint: '외국어 단어가 귀에 쏙쏙 들어왔다.', sign: '한 번 들은 외국어 노래를 뜻까지 이해하며 따라 불렀다. 외국인 관광객과도 막힘없이 이야기했다.' },
    leadership:   { name: '리더십', icon: '🧭', boost: { social: 8, mental: 4 }, hint: '모둠 활동을 하면 어느새 앞에 서 있었다.', sign: '어느새 반 아이들이 내 말을 따라 움직이고 있었다. 담임 선생님이 "벌써 반장감"이라고 했다.' },
    social:       { name: '친화력', icon: '🤝', boost: { social: 12 }, hint: '처음 보는 사람과도 금방 친해졌다.', sign: '처음 보는 아이도, 낯선 어른도 나와 이야기하면 금세 웃었다. 동네에서는 "인사성 밝은 애"로 유명했다.' },
    mechanical:   { name: '손재주', icon: '🔧', boost: { creativity: 4, physical: 4 }, hint: '고장 난 장난감을 뚝딱 고쳐 놓았다.', sign: '고장 난 라디오를 분해해 다시 조립했는데 소리가 더 잘 났다. 아버지가 공구함을 내주셨다.' },
    writing:      { name: '글쓰기', icon: '✍️', boost: { creativity: 8, intelligence: 3 }, hint: '일기장을 읽은 선생님이 오래 칭찬했다.', sign: '백일장에서 쓴 글이 신문에 실렸다. 어른들이 누가 대신 써 준 거냐고 물었다.' },
    entrepreneur: { name: '장사 감각', icon: '💡', boost: { social: 4, mental: 4 }, hint: '학교 바자회에서 혼자 물건을 다 팔았다.', sign: '쉬는 시간에 학용품을 사고팔며 학급 경제를 만들었다. 선생님은 압수하면서도 웃으셨다.' }
  };
})(window.LG = window.LG || {});
