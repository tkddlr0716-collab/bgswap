# BgSwap — Product Hunt 론칭 자료

> 작성일: 2026-03-31 | 검수 반영: 2026-03-31

---

## 1. 태그라인 (Tagline) — PH 제한 60자

**메인 (52자):**
> 15 AI backgrounds per product photo. No subscription.

**대안:**
- Product photo backgrounds in 10 seconds. From $0.29. (52자)
- Drop your product photo, get 15 pro backgrounds back. (52자)

---

## 2. 한 줄 설명 (Short Description) — PH 카드 140자 내외

> AI removes product photo backgrounds and generates 15 pro backgrounds with shadows. Built for Amazon, Etsy & Shopify sellers. Try 1 free.

(138자)

---

## 3. 소개 설명 (Description)

### The Problem

E-commerce sellers spend hours editing product photos or pay $10–50 per image for studio shoots. Marketplaces like Amazon require pure white backgrounds — rejected photos mean suppressed listings and lost sales.

### The Solution

BgSwap handles it in 10 seconds:

1. **Upload** any product photo (phone camera, supplier image, anything)
2. **AI removes the background** and places your product on 15 professional backgrounds with realistic drop shadows
3. **Download** high-res images as a ZIP, ready to list

### 15 Backgrounds, Every Photo

| Background | Best For |
|-----------|----------|
| White (#FFFFFF) | Amazon main image |
| Light Gray | Etsy listings |
| Warm Cream | Shopify stores |
| Cool Gray | Websites & catalogs |
| Dark | Premium branding |

### Pricing (one-time, no subscription)

- **Free:** 1 photo preview (512px, watermarked) — see quality before paying
- **Starter:** $4.99 → 10 products × 15 backgrounds = 150 images ($0.50/product)
- **Pro:** $29 → 100 products × 15 backgrounds = 1,500 images ($0.29/product)

### Why BgSwap vs remove.bg / PhotoRoom?

> ⚠️ 론칭 전 경쟁사 최신 가격/기능 재확인 필수. PH 커뮤니티에서 오류 지적받으면 신뢰도 타격.

| | remove.bg | PhotoRoom | BgSwap |
|---|-----------|-----------|--------|
| Output | Background removal only | Templates | 15 backgrounds + shadows |
| Pricing | Credit-based or subscription | Subscription | One-time $0.29/image |
| Marketplace compliance | Manual check | Manual check | Auto-compliant |
| Batch processing | Paid add-on | Paid plan | Included |

---

## 4. Maker Comment (첫 댓글)

> Hey Product Hunt! 👋
>
> I built BgSwap because I kept seeing Amazon sellers in Reddit forums complaining about the same thing: spending hours removing backgrounds from product photos, only to have their listings suppressed because the white wasn't "white enough."
>
> The existing tools either just remove the background (you still need to add one back) or lock you into monthly subscriptions for features you use twice a year.
>
> BgSwap gives you 15 marketplace-ready backgrounds per photo — white for Amazon, warm tones for Shopify, dark for premium branding — with realistic drop shadows. All in about 10 seconds.
>
> On the tech side: it's built with Next.js 16, Bria AI for background removal, and Sharp for compositing. One-time payments via Polar.sh — no subscription.
>
> **Try it free** (1 photo, no credit card): https://bgswap.io
>
> I'd love to hear your feedback. What features would make this more useful for your workflow?

---

## 5. 데모 영상/GIF (거의 필수)

> PH에서 영상이 있는 제품의 업보트가 2~3배 높음. "선택"이 아니라 사실상 필수.

### 제작 계획
- **형식:** 30초 데모 GIF 또는 짧은 MP4
- **도구:** 화면 녹화 (OBS, Loom, 또는 macOS 화면 기록)
- **흐름:**
  1. bgswap.io 랜딩 (2초)
  2. "Try Free" 클릭 → 업로드 페이지 (3초)
  3. 상품 사진 드래그앤드롭 (3초)
  4. 이메일 입력 → 업로드 (3초)
  5. AI 처리 로딩 애니메이션 (5초)
  6. 15가지 배경 결과 나란히 표시 (10초 — 핵심)
  7. ZIP 다운로드 클릭 (2초)
  8. 엔딩: "15 backgrounds. 10 seconds. From $0.29" 텍스트 (2초)
- **해상도:** 1920×1080 또는 1280×720
- **캡션:** 무음 영상 + 자막 텍스트 오버레이 (PH는 대부분 음소거로 봄)

---

## 6. 스크린샷 가이드 (4장)

### Screenshot 1 — Landing Hero
- **내용:** 히어로 섹션 + "Built for Amazon, Etsy & Shopify sellers" 배지
- **캡처:** bgswap.io 전체 히어로 영역 (데스크톱, 1280px 너비)
- **포인트:** 서비스가 뭔지 한눈에 보여줌

### Screenshot 2 — Upload Flow
- **내용:** 업로드 페이지 + 파일 선택된 상태 (상품 사진 1~3장)
- **캡처:** /upload 페이지, 파일 그리드에 상품 사진 올려놓은 상태
- **포인트:** 사용이 간단하다는 것을 보여줌

### Screenshot 3 — 15 Backgrounds Result (별도 제작)
- **내용:** 동일 상품이 15가지 배경에 놓인 비교 이미지
- **캡처 방법:** /result/[id] 무료 프리뷰 화면 또는 15배경 결과물을 **한 장에 나란히 배치한 별도 이미지 제작**
- **포인트:** 결제 전 사용자도 이해할 수 있는 핵심 가치 시각화
- **주의:** /download 페이지는 결제 후에만 접근 가능 → 프리뷰 또는 제작 이미지 사용

### Screenshot 4 — Pricing
- **내용:** 가격표 섹션 (Starter $4.99 / Pro $29 BEST VALUE)
- **캡처:** 랜딩 가격 섹션
- **포인트:** 구독 없음 + 저렴한 가격 강조

### 스크린샷 제작 팁
- 해상도: 1270×760px (PH 권장)
- 브라우저 크롬 제거 — 콘텐츠만 캡처
- 실제 상품 사진 사용 (CSS 시뮬레이션 X) → Before/After 실사 이미지 완성 후 재캡처 권장

---

## 7. 카테고리 & 태그

**카테고리:** Design Tools, E-Commerce, Artificial Intelligence

**Topics:**
- E-Commerce
- Image Editing
- Artificial Intelligence
- Photography

---

## 8. 론칭 체크리스트

### 론칭 전
- [ ] Product Hunt maker 계정 생성/확인
- [ ] 경쟁사(remove.bg, PhotoRoom) 최신 가격/기능 재확인 → 비교 테이블 업데이트
- [ ] 실사 Before/After 이미지 완성 (Phase 3-5)
- [ ] 데모 GIF/영상 제작 (30초)
- [ ] 스크린샷 4장 캡처 (실사 이미지 반영 후)
- [ ] 태그라인/설명 최종 확정
- [ ] 론칭일 결정 (화~목 추천)

### 론칭 당일
- [ ] 00:01 PST (= KST 17:01) 게시
- [ ] Maker Comment 즉시 작성
- [ ] PH에 집중 — Reddit 공유는 별도 일정 (론칭 후 1주)

### 론칭 후 1주
- [ ] PH 댓글 전부 답변 (빠를수록 좋음)
- [ ] 피드백 기반 개선 항목 정리
- [ ] PostHog에서 PH 유입 트래픽 확인 (utm_source=producthunt)
- [ ] Reddit 게시 시작 (r/AmazonSeller, r/Etsy, r/ecommerce) — 별도 REDDIT.md 참조

---

## 검수 반영 기록

| # | 지적 | 심각도 | 조치 |
|---|------|--------|------|
| 1 | 도메인 미확정 | 높음 | 해당 없음 — bgswap.io 이미 라이브 (PROGRESS.md 도메인 전환 완료) |
| 2 | 태그라인 60자 초과 (91자) | 높음 | 52자로 축소: "15 AI backgrounds per product photo. No subscription." |
| 3 | 한 줄 설명 너무 김 (238자) | 높음 | 138자로 축소, 핵심 메시지 유지 |
| 4 | 경쟁사 비교 정확성 미검증 | 중간 | 론칭 전 재확인 필수 경고 추가, 표현 일부 수정 |
| 5 | Reddit 타이밍 + 채널 혼선 | 중간 | 론칭 당일에서 제거 → "론칭 후 1주"로 분리, 채널을 ROADMAP 기준으로 수정 |
| 6 | Screenshot 3이 결제 후 화면 | 중간 | 프리뷰 화면 또는 별도 제작 이미지로 변경 |
| 7 | 기술 스택 과도 노출 | 중간 | Description에서 제거 → Maker Comment에 짧게 이동 |
| 8 | 데모 영상/GIF 계획 없음 | 중간 | 섹션 5 신규 추가 — 제작 계획 + 흐름 + 사양 |
| 9 | 가격 이미지 수 혼동 | 낮음 | "10 products × 15 backgrounds = 150 images" 산식으로 변경 |
| 10 | Topics "Amazon" 오해 소지 | 낮음 | 삭제 |
| 11 | 론칭 시간 KST 미병기 | 낮음 | "00:01 PST (= KST 17:01)" 병기 |
