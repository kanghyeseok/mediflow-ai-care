# MediFlow AI Care

AI 기반 복약 스케줄러 — 약 먹을 시간을 알려주고, 처방을 자연어로 입력하면 자동으로 일정을 만들어 주며, 약물 상호작용과 부작용까지 함께 검토해 주는 웹 애플리케이션입니다.

브라우저 단독으로 동작하며, 모든 복약 데이터는 사용자의 로컬 스토리지에 저장됩니다.

## 주요 기능

- **투약 대시보드** — 오늘 복용할 약과 시간대별(아침/점심/저녁/취침 전) 진행 상황을 한눈에 확인
- **복약 보관함** — 약 등록·삭제, 잔여 재고 관리, 처방 주의사항 메모
- **달력 분석 트래커** — 일자별 복약 순응도 및 스트릭(연속 달성일) 시각화
- **AI 상담 스캔** — 자연어로 처방을 입력하면([NaturalScheduleParser](src/services/aiOrchestrator.ts#L410))
  - 약명·용량·복용 빈도·기간을 자동 추출
  - 약물 간 상호작용 검사 ([InteractionAgent](src/services/aiOrchestrator.ts#L354))
  - openFDA API + 로컬 폴백 DB 기반 부작용 조회 ([SideEffectAgent](src/services/aiOrchestrator.ts#L261))
- **실시간 알람** — Web Audio API로 합성한 차임음 + 브라우저 알림([scheduler.ts](src/services/scheduler.ts))

## 기술 스택

- React 18 + TypeScript
- Vite 5
- lucide-react (아이콘)
- 외부 API: [openFDA Drug Event API](https://open.fda.gov/apis/drug/event/)

## 로컬에서 실행하기

### 사전 요구사항

- Node.js 18 이상
- npm

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (기본 http://localhost:5173)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과물 미리보기
npm run preview
```

> 알람 사운드(Web Audio)와 브라우저 알림은 사용자의 페이지 상호작용 이후에 활성화됩니다. 첫 실행 시 알림 권한을 허용해 주세요.

## 프로젝트 구조

```
.
├── index.html
├── vite.config.ts
├── src
│   ├── main.tsx              # 엔트리 포인트
│   ├── App.tsx               # 탭 라우팅·알람·상태 관리
│   ├── index.css
│   ├── components
│   │   ├── Dashboard.tsx         # 대시보드 / 보관함 화면
│   │   ├── CalendarTracker.tsx   # 달력 분석 트래커
│   │   └── AIAssistant.tsx       # AI 상담 입력 UI
│   └── services
│       ├── aiOrchestrator.ts     # 자연어 파싱·상호작용·부작용
│       └── scheduler.ts          # 알람·로컬 저장·복약 기록
```

## 데이터 저장

별도의 백엔드 없이 [localStorage](src/App.tsx#L18)에 다음 키로 저장됩니다.

- `medismart_medicines` — 등록된 약물 목록
- `medismart_streak` — 연속 복약 달성일
- `medismart_compliance` — 일자별 복약 기록
- `medismart_schedules`, `medismart_notified_events`, `medismart_chime_pref` — 스케줄러 내부 상태

브라우저 데이터를 삭제하면 모든 기록이 초기화됩니다.

## 배포

GitHub Pages 배포를 전제로 `vite.config.ts`에 `base: '/mediflow-ai-care/'`가 설정되어 있습니다. 다른 경로로 배포하는 경우 이 값을 수정하세요.

## 라이선스

[MIT](LICENSE)
