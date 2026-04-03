# BgSwap 론칭 실행 체크리스트

> 이 문서를 따라서 순서대로 실행하면 됩니다.

---

## Step 1: 스크린샷 캡처 (10분)

브라우저 크기: 1280px 너비, 브라우저 크롬(주소창 등) 제거하고 콘텐츠만 캡처.

| # | 페이지 | 캡처 내용 | 파일명 |
|---|--------|----------|--------|
| 1 | https://bgswap.io | 히어로 섹션 + 필름스트립 | `screenshot-1-hero.png` |
| 2 | https://bgswap.io/upload | 파일 올린 상태 (아무 상품 사진 1~2장) | `screenshot-2-upload.png` |
| 3 | 프리뷰 결과 페이지 | 5배경 썸네일 + 옵션 패널 | `screenshot-3-result.png` |
| 4 | https://bgswap.io 가격 섹션 | 가격표 (Starter/Pro) | `screenshot-4-pricing.png` |

**캡처 도구:** Windows: Win+Shift+S / Mac: Cmd+Shift+4

---

## Step 2: 데모 GIF 제작 (20분)

**도구:** OBS, Loom, 또는 ScreenToGif (무료)

**녹화 흐름 (30초):**
1. bgswap.io 랜딩 (2초)
2. "Try Free" 클릭 → 업로드 페이지 (3초)
3. 상품 사진 드래그앤드롭 (3초)
4. 이메일 입력 → "Get Free Preview" 클릭 (3초)
5. 로딩 애니메이션 (5초)
6. 5배경 썸네일 결과 — 하나씩 클릭 (10초)
7. 옵션 패널 (그림자, 여백, 마켓플레이스) 조작 (4초)

**해상도:** 1280×720 또는 1920×1080
**포맷:** GIF (Product Hunt) 또는 MP4 (유튜브 업로드 후 링크)

---

## Step 3: Product Hunt 게시

### 3-1. 계정 준비
- [ ] https://producthunt.com 로그인
- [ ] 프로필 사진 + 이름 설정 (Maker로 표시됨)

### 3-2. 제품 등록
1. https://producthunt.com/posts/new 접속
2. 다음 입력:

**Website URL:** `https://bgswap.io`

**Tagline:**
```
5 AI backgrounds per product photo. No subscription.
```

**Description:** (PRODUCT_HUNT.md 섹션 3 전체 복사)

**Topics:** E-Commerce, Image Editing, Artificial Intelligence, Photography

**스크린샷:** Step 1에서 캡처한 4장 업로드

**데모 영상:** Step 2의 GIF/MP4

### 3-3. 게시 타이밍
- **화~목** 추천 (PH 트래픽 최고)
- **00:01 PST (= KST 17:01)** 에 게시 → 하루 전체 노출
- 게시 후 즉시 Maker Comment 작성 (PRODUCT_HUNT.md 섹션 4 복사)

### 3-4. 게시 당일
- [ ] 00:01 PST 게시
- [ ] Maker Comment 즉시 작성
- [ ] 댓글 전부 2~3시간 내 답변
- [ ] PH에 집중 — Reddit은 별도 일정

---

## Step 4: Reddit 게시 (PH 1주 후)

### 4-1. 게시 순서 + 간격
| 순서 | 서브레딧 | 타이밍 |
|------|----------|--------|
| 1 | r/ecommerce | PH +7일 |
| 2 | r/AmazonSeller | PH +9일 |
| 3 | r/Etsy | PH +11일 |

### 4-2. 게시 방법
1. 해당 서브레딧 접속
2. "Create Post" 클릭
3. REDDIT.md에서 해당 서브레딧 제목 + 본문 복사
4. 게시 후 2~3시간 댓글 응답

### 4-3. 주의사항
- 동시 게시 금지 (1~2일 간격)
- 각 글은 해당 커뮤니티 톤에 맞춰 다르게 작성됨 (이미 REDDIT.md에 준비)
- 게시 전 각 서브레딧 규칙 재확인

---

## Step 5: 게시 후 모니터링

### PostHog 확인
- https://us.posthog.com → BgSwap 프로젝트
- utm_source=producthunt / utm_source=reddit 필터로 트래픽 확인

### Sentry 확인
- https://sentry.io → BgSwap 프로젝트
- 트래픽 유입 후 에러 급증 여부 모니터링

### 대응
- [ ] PH 댓글 전부 답변
- [ ] Reddit 댓글 전부 답변
- [ ] 유용한 피드백 → PROGRESS.md에 기록
- [ ] 반복 질문 → FAQ에 반영
