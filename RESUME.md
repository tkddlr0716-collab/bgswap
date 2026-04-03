# 이어서 할 부분 (2026-04-03)

## 현재 상태

Product Hunt 2026-04-04 론칭 예약 완료. 블로그 3편, 마케팅 자료 준비 완료.

## 준비된 자료 (복사해서 바로 사용)

| 자료 | 파일 | 용도 |
|------|------|------|
| Reddit 게시글 3개 | `scripts/launch-assets/REDDIT.md` | r/ecommerce, r/AmazonSeller, r/Etsy |
| X 포스트 10일분 | `scripts/launch-assets/X_POSTS.md` | 매일 1개씩 |
| 디렉토리 등록 텍스트 | `scripts/launch-assets/DIRECTORY_SUBMISSIONS.md` | 7개 사이트 |
| PH 텍스트 전체 | `scripts/launch-assets/PRODUCT_HUNT.md` | 태그라인, 설명, Maker Comment |
| Gallery 이미지 4장 | `scripts/launch-assets/gallery-*.png` | PH Gallery |
| 포트폴리오 사진 | `scripts/launch-assets/portfolio/` | SNS, 랜딩 |

## 실행 체크리스트

### 즉시 (사용자가 직접)
- [ ] Reddit r/ecommerce 게시 (REDDIT.md → Post 1 복사)
- [ ] AI 디렉토리 등록 (DIRECTORY_SUBMISSIONS.md → 7개 사이트)
- [ ] X 첫 포스트 게시 (X_POSTS.md → Day 1)
- [ ] Resend 도메인 인증 확인 (bgswap.io Verified 여부)

### 4/4 (PH 론칭)
- [ ] KST 17:01부터 PH 댓글 전부 답변
- [ ] PostHog에서 utm_source=producthunt 트래픽 확인
- [ ] 서비스 정상 동작 모니터링

### 4/5~6 (PH 후)
- [ ] Reddit r/AmazonSeller 게시 (2일 후)
- [ ] Reddit r/Etsy 게시 (4일 후)

### 매일
- [ ] X 1포스트 (X_POSTS.md 순서대로)
- [ ] Reddit/커뮤니티 댓글 2~3개 (15~20분)

### 배포 대기 중
- [ ] `npx vercel --prod` — 블로그 2편 + 포트폴리오 반영

## 최근 세션 작업 (2026-04-03)

1. PH 등록 완료 + 4/4 론칭 예약
2. OG 이미지 재생성 (랜딩 톤 일치)
3. Gallery 이미지 4장 (Hero, 15배경, 배치비교, 가격표)
4. 이메일 CAN-SPAM 준수 (Unsubscribe 헤더/링크)
5. Webhook generate-one 재시도 (3회, 점진적 백오프)
6. 사용자 복구 경로 (Retry 버튼 + /api/retry)
7. PostHog 결제 트래킹 (checkout_click, payment_completed, download_click)
8. 유리/투명 객체 배경 잔상 제거 (decontamination 알고리즘)
9. 이메일 from 주소 수정 (send.bgswap.io → bgswap.io)
10. PortfolioStrip에 선글라스 + 스피커 추가
11. SEO 블로그 2편 (Amazon 요구사항, 배치 편집)
12. 마케팅 자료 일괄 준비 (Reddit, X, 디렉토리)
13. BUSINESS.md 비즈니스 문서 작성
14. GROWTH.md 무료 유입 전략 작성

## 파일 위치

```
scripts/launch-assets/
├── REDDIT.md                  ← Reddit 3개 서브레딧 게시글
├── X_POSTS.md                 ← X 포스트 10일분 템플릿
├── DIRECTORY_SUBMISSIONS.md   ← 디렉토리 7개 등록 텍스트
├── PRODUCT_HUNT.md            ← PH 텍스트 전체
├── gallery-1-hero.png         ← PH Gallery
├── gallery-2-backgrounds.png
├── gallery-3-batch.png
├── gallery-4-pricing.png
├── thumbnail-240.png          ← PH 썸네일
└── portfolio/                 ← 포트폴리오 Before/After
    ├── sunglasses-before/white/dark.jpg
    ├── speaker-desk-before/white/dark.jpg
    └── ...

src/content/blog/
├── bgswap-vs-removebg-vs-photoroom.mdx
├── amazon-product-photo-requirements.mdx
└── batch-product-photo-editing.mdx
```
