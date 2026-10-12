# 대한민국 인생게임

> 태어나는 것은 랜덤, 살아가는 것은 선택, 결과는 현실과 운이 결정하는 대한민국 인생 시뮬레이션.

성별만 고르면 나머지(지역·가정 형편·부모·형제·능력·재능·성격)는 모두 랜덤으로 정해집니다.
0세부터 죽을 때까지 한 사람의 인생이 8~10분 만에 빠르게 흘러가고, 중요한 순간마다 직접 선택합니다.
선택은 결과를 보장하지 않습니다. 능력·노력·환경·관계·과거 선택·성격·운이 합쳐져 성공 / 부분 성공 / 실패가 결정됩니다.

- 빌드 없음 · 프레임워크 없음 · 백엔드 없음 (HTML + CSS + Vanilla JS)
- 모바일 세로 화면 기준 (390×844), 360~430px 폭 대응, safe-area 지원
- LocalStorage 자동 저장 → 새로고침해도 이어하기
- Seed 기반 RNG → 같은 인생 코드 + 같은 선택 = 같은 인생

## 실행

`index.html`을 브라우저로 열면 바로 실행됩니다. 로컬 서버로 띄우려면:

```bash
npx serve .        # 또는
python3 -m http.server 8000
```

특정 출발점으로 시작: `index.html?seed=abc123`

## 배포

**GitHub Pages**
1. 이 폴더를 저장소 루트로 push
2. Settings → Pages → Source: `Deploy from a branch` → Branch `main` / `(root)`
3. `https://<계정>.github.io/<저장소>/` 에서 플레이

**Vercel**
1. vercel.com → Add New Project → GitHub 저장소 Import
2. Framework Preset: `Other`, Build Command 비움, Output Directory `.`
3. Deploy

> 글꼴(Pretendard)은 jsDelivr CDN에서 불러오며, 실패하면 시스템 글꼴로 대체됩니다.

## 구조

```
index.html  style.css  manifest.webmanifest  icon.svg
data/   names · regions · jobs · talents · traits · flavor · endings
        events-early(유년·청소년·입시) · events-adult(20대~중년) · events-later(노년·자동·희귀)
js/     rng · state · relationship · birth · probability · outcome · economy · health
        life · timeline · event-engine · storage · game(순수 로직) · ui(화면)
        + events-paths(진로·환경 연결 이벤트) · events-money(자산관리) · flavor-more
        + events-paths2~4(미술·음악·글·과학·IT·창업·돌봄·농촌·해외 분야별 인생 경로) · events-dark(시련·범죄·사고·중독)
        + js/affinity(성향 계산) · js/invest(예적금·주식·코인)
tools/  simulate.js   ← 밸런스 시뮬레이터
DESIGN.md             ← 시스템 설계 문서
```

`game.js`까지는 DOM을 쓰지 않아서 Node에서도 그대로 돌아갑니다.

## 연관성 시스템 (출생 환경 · 현재 상태 · 과거 선택)

`LG.Aff`가 재능·노력·진로·전공·직업·부모 직업·지역·과거 flag에서 11개 분야(운동, 미술, 음악, 글, 과학, IT, 사업, 사람, 돌봄, 자연, 세계)의 성향 점수를 계산합니다.
- 이벤트 `dom: ['sports']` → 해당 성향이 높을수록 자주 등장
- 선택지 `rank`(숫자/함수) + 이벤트 `maxShow` → 관련 높은 선택지만 추려서 표시, `must`는 항상 표시
- 같은 분류 이벤트는 최근에 나왔으면 가중치가 떨어져 반복을 줄입니다.

## 시련 이벤트 (events-dark.js)

따돌림(피해/가담), 학교폭력, 비행, 가정 불화, 사이버 괴롭힘, 범죄 피해, 보이스피싱, 스토킹·데이트 폭력, 음주운전, 직장 내 괴롭힘, 산업재해, 도박·사채, 음주 문제, 우울 등이 환경·성격·과거 선택에 따라 확률적으로 발생합니다.
해마다 낮은 확률로 굴려야 하는 사건은 자동 이벤트에 `rate`(연 확률)를 주면 됩니다. 가해에 가담한 기억(`bully_joined`), 처분 기록(`juvenile_record`) 등은 flag로 남아 나중에 다시 돌아옵니다.
시련 이벤트에 `risk`(0~1)를 주면 자란 집(형편·불화·보호자)과 지금의 살림(자산·실직)에 따라 확률이 최대 약 2.4배↑ / 약 0.35배↓ 됩니다. `BYTIER='^d_' node tools/simulate.js 1000` 으로 형편별 발생 비율, `node tools/review.js 300` 으로 페이싱·반복 문장·자산 분포 리뷰를 볼 수 있습니다. `FREQ='^d_' node tools/simulate.js 300` 으로 이벤트별 발생 비율, `TALENT=art` 로 재능을 고정한 시뮬레이션을 볼 수 있습니다.

## 자산관리

첫 수입 이후 운용 방식(예적금/균형/성장/공격)을 정하면 남는 현금이 자동 배분되고, 매년 시장(상승·보합·하락, 코인 사이클)에 따라 손익이 납니다. 자산 시트(💰)에서 방식 변경 가능.

## 이벤트 추가하기

`data/events-*.js` 배열에 객체 하나를 `push`하면 엔진이 자동으로 인식합니다.

```js
E.push({
  id: 'w_example', cat: 'career', tier: 'choice',   // auto | choice | major
  ages: [25, 45], w: 6, cd: 5,                     // 나이 범위 · 가중치 · 쿨다운(년)
  if: p => !!p.job,                                // 발생 조건
  label: '커리어', title: '새로운 제안', text: '...',
  choices: [{
    id: 'go', label: '도전한다', intent: 'career',
    check: { base: 40, partial: 0.5, f: [['stat', 'intelligence', 0.4], ['eff', 'work', 0.3], ['flag', 'intern', 10, '인턴 경험']] },
    out: {
      success: { t: '성공 문장', log: '연표 기록', perf: 10, achv: 5 },
      partial: { t: '부분 성공 문장', perf: 3 },
      fail:    { t: '실패 문장', sr: 8, queue: [{ id: 'w_example_retry', in: 1 }] }
    }
  }]
});
```

- 확률 요인: `stat` `eff` `family` `support` `assets` `region` `talent` `trait` `flag` `noflag` `stress` `health` `happy` `edu` `ageOver` `rel` `perf` `jobYears` `job` `eduEnv` `fn`
- 결과 효과: `st` `hp` `sr` `money` `debt` `eff` `rel` `flag` `unflag` `edu` `major` `status` `job` `quit` `home` `achv` `exp` `perf` `queue` `next` `fn`
- 텍스트 토큰: `{name}` `{partner}` `{spouse}` `{friend}` `{child}` `{sibling}` `{parent}` `{job}` `{region}` — 조사 `이(가)` `와(과)` `을(를)` `(으)로`는 자동 교정

## 라이프스타일 · 선택의 무게 · 엔딩 (v3)
- **라이프스타일** (`js/style.js`, `data/events-style.js`): 성장·일·건강·가족·럭셔리·절약 + 평범. 20~24세에 처음 고르고 30/42/55/66세 점검 이벤트와 대시보드 칩에서 바꿀 수 있다(변경 후 2년 쿨다운). 각 방식은 소득·지출·건강·관계·스트레스에 해마다 작은 변화를 쌓는다.
- **선택의 무게**: 의도(`stake()`)에 따라 성공/실패 폭이 커지고, 같은 의도를 반복하면 "(익숙함)" 보정이 붙는다. 누적된 선택은 일형/가족형/도전형/안정추구형 같은 **성향 태그**가 된다.
- **엔딩**: 점수는 돈·성취·행복·관계·건강·성장으로 퍼지고 종합 등급을 낸다. 돈만으로는 높은 등급이 나오지 않는다. 칭호는 성향·라이프스타일·큰 사건을 반영한다.
- **공유 카드**: 가장 큰 갈림길 3개가 카드에 들어간다.
- **되돌릴 수 없는 선택**: 두 번 눌러 확정(메뉴 > 설정에서 끌 수 있음).
- **경제 보정**: 35세 순자산 중앙값은 가난한 집 약 0.7억 ~ 부유한 집 약 2.5억(`node tools/simulate.js`로 확인).

## 밸런스 시뮬레이션

```bash
node tools/simulate.js 300 random   # 무작위 선택으로 300판
node tools/simulate.js 300 first    # 항상 첫 번째 선택지로 300판
```

수명 분포, 한 판 선택 횟수, 예상 플레이 시간, 결혼·자녀·자산 분포, 출생 형편별 결과, 오류를 출력합니다.
현재 기준(무작위 300판): 수명 중앙 80세(p10 66 ~ p90 91), 선택 약 32회, 오류 0.
