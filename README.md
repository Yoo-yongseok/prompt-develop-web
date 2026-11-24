# Prompt Lab

중학교 3학년 진로 연계형 AI 프롬프트 수업용 웹사이트. 기획서 전문은 [docs/prompt-lab-spec.md](docs/prompt-lab-spec.md).

## 실행

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # 배포 전 확인
```

## 구성

| 경로 | 내용 |
| --- | --- |
| `/` | 랜딩, 바이브 코딩 소개, 제작 과정 기록 |
| `/learn` | 프롬프트 5요소, Level 1~3 실제 결과물 비교, 수정 요청 예시 |
| `/explore` | 진로 12개 분야 아이디어 카드, 실험실로 가져오기 |
| `/studio` | 프롬프트 작성, 자동 저장, 복사, TXT 내려받기, 저장 내용 지우기 |

콘텐츠는 `src/content/`에 있고 코드 수정 없이 글만 고칠 수 있다.

- `making-of.ts` — 제작 과정 기록. 실제 있었던 일만 적는다.
- `demos/level-{1,2,3}.html` — Level 비교용 미니 앱. 실험실과 같은 `/api/generate`(같은 모델, 같은 시스템 프롬프트 `src/lib/llm/codegen-prompt.ts`, 같은 설정)로 `levels.ts`의 세 프롬프트를 각각 보내 만들었고 손으로 고치지 않았다. 다시 만들 때도 같은 조건을 지킨다.

## 디자인 원칙

`landing-outsourcing` 저장소의 `정책/03_디자인원칙.md`(AI가 대충 만든 티 체크리스트)를 따른다. 이 사이트에 적용한 내용:

- 바탕은 흰색과 옅은 회색, 포인트는 코발트 블루 한 색이며 버튼과 강조에만 쓴다. 그라데이션, 글로우, 블러 장식은 쓰지 않는다.
- 짙은 네이비 구역은 페이지당 한 곳(랜딩의 제작 과정, Learn의 Level 비교).
- 같은 모양의 카드 그리드를 반복하지 않는다. 목록은 선으로 나눈 행으로, 여러 항목은 목록을 누르면 옆 내용이 바뀌는 방식으로 보여 준다.
- 설명용 그림 대신 실제로 작동하는 앱을 보여 준다(랜딩 첫 화면).
- 등장 애니메이션, 숫자 카운트업, 자동으로 흐르는 띠는 쓰지 않는다.
- 글자 크기: 첫 화면 제목 72px, 섹션 제목 44px, 본문 16~18px. 콘텐츠 최대 폭 1360px.

기획서 15절의 "다크 네이비 배경, 퍼플·블루 포인트, 그라데이션, 글로우"는 이 원칙과 충돌해서 따르지 않았다.

## AI 기능 (Studio)

| 경로 | 하는 일 |
| --- | --- |
| `POST /api/improve` | 학생 프롬프트를 분석해 발전시킨 프롬프트, 잘 쓴 부분, 바꾼 이유, 기본값, 추가 질문을 구조화된 JSON으로 돌려준다 |
| `POST /api/generate` | 프롬프트 하나로 단일 HTML 미니 앱을 생성해 스트리밍한다. Before/After 구분을 받지 않는다 |
| `GET /api/status` | AI 사용 가능 여부와 접속 코드 필요 여부 |

LLM 호출은 `src/lib/llm/`에만 있다. 모델을 바꾸려면 `client.ts` 또는 환경변수만 고치면 된다.

### 환경변수

`.env.example`을 `.env.local`로 복사해 채운다. Vercel에는 같은 이름으로 등록한다.

| 이름 | 필수 | 설명 |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | 예 | 워크스페이스 범위로 발급한 키. 없으면 Studio는 AI 없이 직접 다듬기만 제공한다 |
| `CLASS_ACCESS_CODE` | 아니오 | 설정하면 이 코드를 입력한 사람만 AI 기능을 쓸 수 있다. 공개 배포 시 설정 권장 |
| `PROMPTLAB_IMPROVE_MODEL`, `PROMPTLAB_CODEGEN_MODEL` | 아니오 | 기본값 `claude-opus-5-5` |
| `LIMIT_IMPROVE_PER_HOUR`, `LIMIT_GENERATE_PER_HOUR`, `LIMIT_TOTAL_PER_DAY` | 아니오 | 기본값 12, 24, 600 |

### 알아 둘 것

- 횟수 제한은 서버 메모리에 저장한다. Vercel에서는 인스턴스마다 따로 세어져 정확한 상한이 아니다. 비용의 최종 상한은 Claude Console의 워크스페이스 지출 한도로 건다.
- 미니 앱 생성은 1분 넘게 걸린다. `/api/generate`는 `maxDuration = 300`을 쓰므로 Vercel 요금제의 함수 실행 시간 상한을 확인한다.
- 생성된 코드는 `sandbox-frame.tsx`의 격리 iframe(allow-scripts만, CSP로 네트워크 차단)에서만 실행한다.
- 학생 프롬프트는 서버에 저장하거나 로그로 남기지 않는다.
