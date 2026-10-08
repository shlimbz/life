# 대한민국 인생게임 — 설계 문서 (V1)

> **"태어나는 것은 랜덤, 살아가는 것은 선택, 결과는 현실과 운이 결정하는 대한민국 인생 시뮬레이션."**

---

## 1. 전체 게임 시스템 구조

```
┌─────────────┐   ┌──────────────┐   ┌──────────────────────────────────────┐
│ BirthGen    │──▶│ PlayerState  │◀──│ 1년 단위 시스템 (매년 자동)            │
│ (birth.js)  │   │ (state.js)   │   │  Life(학교·군대·은퇴) / Economy / Health │
└─────────────┘   └──────┬───────┘   │  Relationship(NPC 노화·사망·연애 유지)  │
                         │           └──────────────────────────────────────┘
                         ▼
                 ┌──────────────┐  조건 필터 → 가중치 → 선택
                 │ EventSystem  │──────────────────────────┐
                 │(event-engine)│                          ▼
                 └──────┬───────┘                 ┌─────────────────┐
                        │ choice                  │ 자동 이벤트/잡담 │ → Timeline
                        ▼                         └─────────────────┘
   ChoiceSystem ─▶ ProbabilitySystem ─▶ RNG(seed) ─▶ OutcomeSystem ─▶ Timeline
   (선택지·의도)   (요인 합산·성공/부분/실패)        (스탯·돈·관계·플래그·예약이벤트)
```

| 시스템 | 파일 | 역할 |
|---|---|---|
| A. PlayerState | `js/state.js` | 모든 게임 상태의 단일 객체. 저장/복원 단위 |
| B. BirthGenerator | `js/birth.js` | 성별 외 모든 출생 조건 랜덤 생성, 장단점 서술 |
| C. EventSystem | `js/event-engine.js` | 나이·조건·플래그·쿨다운으로 이벤트 필터, 가중치 선택, 예약 이벤트 |
| D. ChoiceSystem | `js/event-engine.js` | 선택지 노출 조건, 의도(intent) 기록, 가능성 라벨 |
| E. ProbabilitySystem | `js/probability.js` | 기본확률 + 요인(능력/환경/경제/관계/과거/재능/노력/건강/성격) + 숨은 운 |
| F. OutcomeSystem | `js/outcome.js` | 결과 효과 적용(스탯·돈·관계·플래그·직업·학력·예약), 변화량 계산 |
| G. RelationshipSystem | `js/relationship.js` | NPC 생성, 관계 표류, 연인/배우자/자녀/부모 생애 |
| H. EconomySystem | `js/economy.js` | 연간 수입 − 생활비 − 주거비 − 교육비 − 대출 + 이자/연금 |
| I. HealthSystem | `js/health.js` | 연간 건강 변화(나이·습관·스트레스·지역 의료), 사망 위험(곰페르츠) |
| J. TimelineSystem | `js/timeline.js` | 인생 기록, 연표, 엔딩 요약/한 줄 평 |

---

## 2. PlayerState (요약)

```json
{
  "v": 1, "seed": "k3x9qa", "rngState": 123456789,
  "gender": "M", "name": "김민준", "birthYear": 2001, "age": 27, "year": 2028, "alive": true,
  "region": "busan", "urban": true, "town": "해운대구",
  "family": { "structure": "both", "tier": 3, "tags": ["dual_income"], "home": "아파트", "eduEnv": 58 },
  "stats": { "health": 74, "intelligence": 61, "social": 70, "physical": 48, "creativity": 55, "mental": 62 },
  "talents": ["music"], "found": ["music"], "traits": ["extrovert", "impulsive", "optimist"],
  "luck": 2, "luckLog": { "good": 3, "bad": 1 },
  "effort": { "study": 20, "sport": 5, "art": 40, "work": 30, "health": 10, "social": 15 },
  "happy": 71, "stress": 44,
  "money": 4200, "debt": 1200, "house": null, "home": "rent",
  "edu": "college", "major": "it", "status": "working",
  "job": { "id": "developer", "years": 3, "perf": 62, "mul": 1.05 },
  "people": [{ "id": 1, "role": "mother", "name": "이미영", "age": 58, "job": "office_small",
               "personality": "다정함", "income": 2800, "health": 70, "rel": 82, "support": 74, "alive": true }],
  "flags": { "college": 19, "dating": 26 }, "done": {}, "cool": {}, "queue": [],
  "intents": { "career": 4, "love": 2 },
  "history": [{ "age": 0, "year": 2001, "t": "부산 해운대구의 한 가정에서 태어났다", "k": "birth" }],
  "pending": null
}
```
돈 단위는 **만원**. `money`는 현금, 순자산 = money + house.value − debt.

---

## 3. 출생 생성 규칙

1. 성별(플레이어 선택) → 2. 출생연도(1988~2010) → 3. 지역(인구 가중치 17개 시·도)
4. 도시/농촌(지역 도시화율) → 5. 가족 형태(양부모 68 / 편모 9 / 편부 4 / 조부모 동거 10 / 다자녀 등 태그)
6. 가정 형편 1~5단계 (지역 편향 + 정규분포; 서울=부자 같은 고정 공식은 없음)
7. 부모 NPC(나이·직업·소득·학력·건강·성격·지원성향) → 8. 형제(0~3)
9. 주거환경 → 10. 교육환경(지역 교육접근성 + 형편 + 부모 학력)
11. 초기 건강 → 12. 능력치 6종(평균 50, σ15) → 13. 재능 0~2개(숨김, 발견 이벤트)
14. 성격 3축(사교/결정/전망/추진력/관계 중 3개 축) → 15. 숨은 운(−4~+4)

**환경 ≠ 난이도**: 출생 화면에서 지역·형편별 장점과 단점을 반드시 함께 표시.
고소득/수도권은 교육·취업 보정이 있지만 높은 주거비·생활비·경쟁 스트레스를 받는다.
지방/농촌은 공동체·낮은 생활비·가족 관계 보정이 있지만 기회 접근성이 낮다.

---

## 4. 확률 계산 규칙

```
성공% = clamp( base + Σ요인 + 성격(의도별) + 숨은운 , min 5, max 92 )
부분성공% = (100 − 성공%) × partialShare   // 신중함↑, 모험·충동↓ (큰 성공/큰 실패)
실패% = 나머지
```
요인 종류: `stat`(능력, 50 기준) · `eff`(누적 노력) · `family`(집안 형편) · `support`(부모 지원) ·
`assets`(본인 자산) · `region`(지역 특성) · `talent` · `trait` · `flag`(과거 선택) ·
`stress` · `health` · `edu` · `ageOver` · `rel`(관계) · `perf`(업무 성과) · `fn`(커스텀)

- 정확한 수치는 숨기고 **가능성 낮음 / 쉽지 않음 / 보통 / 높음 / 매우 유리함**으로 표시.
- "조건 보기"를 누르면 상위 요인을 ▲▼로만 보여줌.
- 결과 화면에서 **도움이 된 것 / 걸림돌**을 보여줘 "내 선택 때문"이 느껴지게 함.
- 운 기록: 낮은 확률 성공 = 행운, 높은 확률 실패 = 불운 → 엔딩 문구.

---

## 5. 이벤트 구조

```js
{
  id: "t_csat", cat: "education", tier: "major",      // auto | choice | major
  ages: [19, 19], milestone: true,                    // milestone = 조건 맞으면 우선 발생
  w: 10 | (p) => number, cd: 3,                       // 가중치 / 쿨다운(년)
  if: (p) => p.edu === "high",                         // 발생 조건
  label: "인생의 갈림길", title: "고등학교 졸업", text: "..." | (p) => "...",
  choices: [{
    id: "college", label: "대학에 도전한다", intent: "education",
    if: (p) => true,                                  // 선택지 노출 조건
    check: { base: 40, partial: .5, f: [["stat","intelligence",.5],["eff","study",.35],["family",.6]] },
    out: {
      success: { t: "합격!", log: "대학 합격", edu: "college", flag: "college", next: "u_major" },
      partial: { t: "...", queue: [{ id: "t_retry", in: 1 }] },
      fail:    { t: "...", status: "seeking", flag: "no_college" }
    }
  }]
}
```
결과 효과 키: `st, hp, sr, money, debt, eff, rel, flag, unflag, edu, status, job, home, achv, exp, queue, next, fn`.

---

## 6. 모바일 화면 구조 (390×844 기준)

```
타이틀(성별 선택) → 출생 공개(순차 연출) → 플레이 화면 ⇄ 이벤트 오버레이 → 사망 연출 → 결과 카드
플레이 화면:
 ┌ 헤더: 나이(대형) · 연도 · 인생 진행바 · 속도/일시정지
 ├ 현재 상황 카드: 최근 사건 · 💼직업 🏠집 ❤️관계
 ├ 인생 피드(매년 작은 사건이 흘러감)
 ├ 상태 바: 💰순자산 ❤️건강 😊행복 🤝관계
 └ 하단 탭: 인생 · 사람 · 상태 · 기록 (바텀시트, 열면 시간 일시정지)
```
배경색은 인생 단계(새벽→아침→한낮→노을→밤)에 따라 변한다.

---

## 7. 게임 루프

```
tick(): 1년 경과
  Life.yearly → Economy.yearly → Relationship.yearly → Health.yearly → 기분/평균 갱신
  사망 판정 → (사망) 엔딩
  EventSystem.pick:  예약 이벤트 > 마일스톤 > 확률적 선택 이벤트(나이대별 빈도) + 자동 이벤트 + 잡담
  선택 이벤트 → 시간 정지 → 플레이어 선택 → 확률 계산 → RNG → 결과 적용 → 연표 기록 → 재개
  자동 저장(localStorage)
```
나이대별 진행 속도(ms/년, 1배속): 0~5: 500 · 6~12: 750 · 13~18: 950 · 19~29: 1150 · 30~69: 900 · 70+: 800 (1×·2×·3× 전환)
선택 이벤트 연간 확률: 6~12: 22% · 13~18: 36% · 19~34: 50% · 35~49: 38% · 50~64: 28% · 65+: 22% (+마일스톤)
→ 한 판 평균 25~32회 선택, 8~13분.

---

## 8. V1 이벤트 목록 (선택 이벤트 70개 + 자동 이벤트 23개)

- **유년기**: 방과후 활동(마일스톤), 전학생, 재능 발견, 괴롭힘 목격, 반려동물, 부모님 다툼, 학급 회장
- **청소년기**: 중학교 방향(마일스톤), 시험, 동아리, 아르바이트, 첫사랑 고백, 고교 진로(마일스톤), 스카우트, 입시 스트레스, 집안 위기, 게임 중독, 수능/졸업(마일스톤), 재수 결과
- **20대**: 전공 선택, 대학 생활, 군 입대(남), 교환학생, 첫 취업(마일스톤·반복), 대학원, 야간대학, 자격증, 독립, 소개팅/고백, 술자리, 은인
- **경력**: 번아웃, 승진, 이직 제안, 해외 근무, 친구 창업, 구조조정, 자영업, 부업, 사업 결과, 바이럴, 은퇴(마일스톤)
- **관계/가정**: 프러포즈, 연인 갈등, 부부 갈등, 이혼, 늦은 인연, 옛 인연 재회, 출산 계획, 자녀 교육, 자녀 독립 지원, 형제 돈 문제, 부모 간병
- **돈/주거**: 내 집 마련, 투자, 지인 투자 권유, 빚 위기, 이주, 해외 이민
- **건강**: 운동 습관, 건강검진 이상, 큰 병, 마음의 병, 사고
- **노년**: 노후 생활, 재산 정리, 옛 친구, 긴 여행, 새 취미
- **희귀**: 복권, 뜻밖의 상속, 인생의 은인, 유명해짐

---

## 9. 프로젝트 폴더 구조

```
index.html  style.css  manifest.webmanifest  icon.svg  README.md  DESIGN.md
data/  names.js regions.js jobs.js talents.js traits.js flavor.js endings.js
       events-early.js events-adult.js events-later.js
js/    rng.js state.js birth.js probability.js outcome.js relationship.js economy.js
       health.js life.js timeline.js event-engine.js storage.js ui.js game.js
tools/ simulate.js   (Node로 수백 판 자동 플레이 → 밸런스 리포트)
```
모든 스크립트는 일반 `<script>`(모듈 아님)로 로드 → 빌드 없이 GitHub Pages / Vercel 정적 배포, `file://`로도 실행 가능.
