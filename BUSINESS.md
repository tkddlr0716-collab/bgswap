# BgSwap 비즈니스 문서

> 마지막 업데이트: 2026-04-03

---

## 1. 비즈니스 정의

### 한 줄 정의

상품 사진 1장을 업로드하면 AI가 배경을 제거하고 15가지 배경을 자동 합성해주는 SaaS.

### 타겟 고객

Amazon, Etsy, Shopify 셀러 — 특히 50~500개 SKU를 가진 중소 셀러.

### 해결하는 문제

- 셀러들이 상품 사진 배경 편집에 사진당 15~20분 소비 (또는 $10~50/장 외주)
- Amazon 등 마켓플레이스 화이트 배경 규정 미충족 시 리스팅 억제(suppression)
- 기존 도구(remove.bg, PhotoRoom)는 배경 "제거"만 하고 "교체"는 별도 작업

### 핵심 가치 제안

| 항목 | BgSwap | 경쟁사 |
|------|--------|--------|
| 기능 | 배경 제거 + 15배경 교체 + 그림자 | 배경 제거만 (remove.bg) 또는 월구독 (PhotoRoom) |
| 가격 | 원타임 $0.02~0.03/image | remove.bg $0.23/image, PhotoRoom $7.50+/월 |
| 대량 처리 | 100장 일괄 업로드, ~16분 | 대부분 1장씩 |
| 과금 모델 | 일회성 결제 | 크레딧 소진 또는 월구독 |

### 수익 구조

| 플랜 | 가격 | 상품 수 | 이미지 수 | 단가/이미지 | 원가/이미지 | 마진 |
|------|------|---------|-----------|-------------|-------------|------|
| Free | $0 | 1장 | 5장 (512px, 워터마크) | - | ~$0.002 | - |
| Starter | $4.99 | 10장 | 150장 | $0.03 | ~$0.02 | ~94% |
| Pro | $29 | 100장 | 1,500장 | $0.02 | ~$0.02 | ~93% |

- 원가: Replicate BiRefNet ~$0.002/장 (배경 제거), Sharp 합성은 CPU 비용만
- 인프라: Vercel (무료~$20/월), Turso (무료), R2 (무료 tier), Resend (무료 tier)
- **손익분기**: 월 Starter 1건이면 흑자

---

## 2. 전략 방향

### 핵심 전략: "대량 자동화"

> GPT 대비 1장 품질은 열세. 1장 품질 경쟁은 포기하고, **"100장을 한번에 15배경씩"** 대량 자동화에 집중.

이 결정의 근거:
- GPT-4o/gpt-image-1의 1장 품질을 이길 수 없음 (인정)
- 그러나 GPT는 대량 배치 처리 API가 없고, 1장당 $0.02~0.08로 비쌈
- 셀러의 실제 니즈는 "50~500장을 빠르게, 일관되게, 저렴하게"
- 대량 처리 + 일회성 결제가 유일한 차별점

### 론칭 전략

```
Phase 1: Product Hunt 론칭 (트래픽 + 백링크 + 신뢰)
Phase 2: Reddit 순차 게시 (실제 타겟 유저)
   → r/ecommerce → r/AmazonSeller → r/Etsy (각 2일 간격)
Phase 3: SEO (블로그 + 롱테일 키워드)
Phase 4: 유료 광고 (Google Ads, Facebook — 수익 검증 후)
```

### 제품 로드맵 (론칭 후)

| 우선순위 | 항목 | 이유 |
|---------|------|------|
| 1 | AI 모델 개선 (gpt-image-1 등) | 품질 격차 줄이기 |
| 2 | Shopify 앱/API 연동 | 셀러 워크플로우 통합 |
| 3 | Business 플랜 ($99/500장) | 반복구매 패턴 확인 후 |
| 4 | ZIP 업로드 지원 | 대량 처리 UX 개선 |
| 5 | status API 리팩터링 | 기술 부채 정리 |

---

## 3. 진행 상황

### 완료된 것

**제품 개발 (Phase 1~3 + A~D)**
- [x] 핵심 플로우: 업로드 → AI 배경 제거 → 15배경 합성 → ZIP 다운로드
- [x] 무료 프리뷰 (1장, 5배경, 512px, 워터마크)
- [x] 결제 연동 (Polar.sh, Standard Webhooks)
- [x] 대량 업로드 (최대 100장, 3병렬 처리)
- [x] 이메일 발송 (다운로드 링크, 처리 재개 알림)
- [x] 옵션: 그림자, 패딩, 마켓플레이스 프리셋, 커스텀 색상, 화질 향상
- [x] 자동 복구: stuck 90초 리셋, failed 자동 재시도
- [x] Cron: 일일 정리 + stalled 주문 캐치업 + 재개 이메일

**AI 모델**
- [x] Bria → BiRefNet 교체 완료 (해상도↑, 엣지 품질↑, 비용 유사)

**인프라**
- [x] Vercel 배포, Turso DB, Cloudflare R2 스토리지
- [x] PostHog 분석 (스크롤, CTA, 업로드 이벤트)
- [x] Sentry 에러 모니터링
- [x] SEO 기본 (sitemap, robots, OG tags, JSON-LD)
- [x] 법적 페이지 (Privacy, Terms, Refund)
- [x] 블로그 1편 (BgSwap vs remove.bg vs PhotoRoom)

**랜딩 페이지**
- [x] 밝은 톤 리뉴얼 (화이트 배경, 앰버+블루 강조)
- [x] Before→After 쇼케이스 (머그+백팩)
- [x] 15배경 그리드 (스니커)
- [x] 비교 테이블 (Studio vs DIY vs BgSwap)
- [x] 모바일 반응형

**론칭 준비**
- [x] Product Hunt 등록 완료 + 2026-04-04 론칭 예약
- [x] Gallery 이미지 3장 (Hero, 15배경, 가격표)
- [x] Reddit 게시글 3개 서브레딧 준비
- [x] OG 이미지 재생성 (랜딩 톤 일치)

**품질 패치 (2026-04-03)**
- [x] 이메일 CAN-SPAM 준수 (List-Unsubscribe 헤더/링크)
- [x] Webhook generate-one 트리거 재시도 (3회, 점진적 백오프)
- [x] 사용자 복구 경로 (Retry Failed Products 버튼 + /api/retry)

### 미완료

| 항목 | 상태 | 비고 |
|------|------|------|
| PH 론칭 실행 | 4/4 예약됨 | 댓글 응답 준비 필요 |
| PH Gallery 교체 | 필요 | 대량 배치 + 경쟁사 비교 이미지 추가됨 (gallery-3-batch.png, gallery-4-pricing.png) |
| Reddit 게시 | PH 후 1주 | 텍스트 준비 완료 |
| **Resend 도메인 인증 확인** | **미확인** | **SPF/DKIM/DMARC — 론칭 전 필수 확인** |
| 결제 이벤트 PostHog 트래킹 | ✅ 구현 완료 | checkout_click (클라이언트) + payment_completed (서버) |
| AI 모델 추가 개선 | 보류 | 론칭 후 |
| Shopify 연동 | 보류 | 론칭 후 |
| SEO canonical URL | 미설정 | PH 백링크 유입 시 SEO 가치 분산 우려 |

---

## 4. 전략 점검

### 전략대로 가고 있는가?

| 전략 | 실행 | 판정 |
|------|------|------|
| 대량 자동화 집중 | 100장 배치 + 3병렬 + 자동 복구 구현 | ✓ 일치 |
| 1장 품질 경쟁 안 함 | BiRefNet 교체했지만 GPT급 추구 안 함 | ✓ 일치 |
| 일회성 결제 | Starter $4.99 / Pro $29, 구독 없음 | ✓ 일치 |
| 론칭이 모델 교체보다 우선 | BiRefNet 교체 후 론칭 진행 | ✓ 일치 |
| PH → Reddit → SEO 순서 | PH 4/4 예약, Reddit 텍스트 준비 | ✓ 일치 |
| Business 플랜은 검증 후 | MVP에 미포함 | ✓ 일치 |

### 리스크

| 리스크 | 심각도 | 대응 |
|--------|--------|------|
| GPT 품질 격차 확대 | 높음 | 대량 자동화 + 가격 차별화로 포지션 유지. 품질 갭이 치명적이면 gpt-image-1 API 전환 검토 |
| 타겟 유저 도달 실패 | 높음 | PH는 타겟 불일치 가능. Reddit이 실제 검증 채널. 전환 안 되면 Google Ads 테스트 |
| 론칭 당일 서버 장애 | 높음 | Vercel 무료~$20 tier 트래픽 스파이크, Replicate cold start. 론칭 당일 모니터링 필수 |
| 환불 쇄도 | 중간 | 7-day money-back 명시. Polar 대시보드에서 수동 환불. 자동화 미구현 — 건수 적을 때는 수동 대응 |
| Polar.sh 의존도 | 중간 | 결제 100% Polar 의존. 장애 시 대안 없음. Stripe 전환 옵션 보류 |
| 원가 상승 (Replicate 가격 변동) | 중간 | 현재 마진 93%+. 10배 올라도 흑자. 자체 호스팅 옵션 있음 |
| 1인 운영 한계 | 중간 | 자동화 최대한 + CS 최소화 설계. 7일 자동 삭제로 데이터 관리 부담 제거 |

### 핵심 지표 (론칭 후 추적)

| 지표 | 목표 | 측정 방법 |
|------|------|-----------|
| 무료 → 결제 전환율 | 5%+ | PostHog funnel (미구현, 추가 필요) |
| 월 결제 건수 | 10건+ (첫 달) | Polar 대시보드 |
| CAC | $0 (오가닉) | UTM 트래킹 |
| 재구매율 | 추적 시작 | 이메일 기반 반복 주문 |

---

## 5. 기술 스택 요약

```
Frontend:  Next.js 16 + React 19 + TailwindCSS 4
AI:        Replicate (BiRefNet/lucataco/remove-bg)
합성:      Sharp (Node.js 이미지 처리)
DB:        Turso (LibSQL/SQLite)
스토리지:   Cloudflare R2 (S3 호환)
결제:      Polar.sh (Standard Webhooks)
이메일:    Resend
분석:      PostHog
에러:      Sentry
배포:      Vercel
도메인:    bgswap.io
```

---

## 6. 파일 구조

```
bgswap/
├── src/app/
│   ├── page.tsx              ← 랜딩 페이지
│   ├── upload/page.tsx       ← 업로드 페이지
│   ├── result/[id]/page.tsx  ← 결과/프리뷰 페이지
│   ├── order/[id]/upload/    ← 추가 업로드 (결제 후)
│   ├── download/[token]/     ← ZIP 다운로드
│   ├── blog/                 ← 블로그
│   ├── api/
│   │   ├── upload/           ← 파일 업로드 API
│   │   ├── generate/         ← 무료 프리뷰 생성
│   │   ├── generate-one/     ← 단일 이미지 처리 (유료)
│   │   ├── status/           ← 주문 상태 폴링
│   │   ├── retry/            ← 실패 이미지 재시도
│   │   ├── webhook/polar/    ← 결제 웹훅
│   │   ├── download/         ← ZIP 생성
│   │   ├── options/          ← 옵션 저장
│   │   └── cron/             ← 일일 정리
│   └── privacy|terms|refund/ ← 법적 페이지
├── src/lib/
│   ├── replicate.ts          ← AI 모델 호출
│   ├── compositor.ts         ← 15배경 합성 (Sharp)
│   ├── r2.ts                 ← R2 스토리지
│   ├── db.ts                 ← Turso DB
│   ├── email.ts              ← Resend 이메일
│   └── analytics.ts          ← PostHog 이벤트
├── scripts/launch-assets/    ← PH/Reddit 론칭 자료
├── STATUS.md                 ← 기술 현황
├── RESUME.md                 ← 이어서 할 작업
└── BUSINESS.md               ← 이 문서
```
