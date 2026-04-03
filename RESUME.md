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

### 자동화 (에이전트)
- 블로그 자동 생성 트리거 활성 (weekly-seo-blog, 주 1회)
- Vercel GitHub 연동 — push 시 자동 배포
- 이메일 nurture cron — 매일 06:00 UTC 자동 실행

### 확인 필요
- [ ] Resend 도메인 인증 (bgswap.io) Verified 확인

## 최근 세션 작업 (2026-04-03)

**제품 변경**
1. 무료 프리뷰 5배경→15배경 확대 (compositor.ts)
2. 이메일 nurture 시퀀스 구축 (24h/48h/7d 자동, cron/nurture)
3. PostHog 전체 퍼널 추적 (preview_viewed, preview_browse, checkout_click, payment_completed, download_click)
4. 유리/투명 객체 배경 잔상 제거 (decontamination)
5. 이메일 CAN-SPAM 준수 (Unsubscribe 헤더/링크)
6. 이메일 from 주소 수정 (send.bgswap.io → bgswap.io)
7. Webhook generate-one 재시도 (3회, 점진적 백오프)
8. 사용자 복구 경로 (Retry 버튼 + /api/retry)

**론칭/마케팅**
9. PH 등록 + 4/4 론칭 예약
10. OG 이미지 재생성 (랜딩 톤 일치)
11. Gallery 이미지 4장 (Hero, 15배경, 배치비교, 가격표)
12. SEO 블로그 2편 추가 (총 3편)
13. 마케팅 자료 일괄 준비 (Reddit, X, 디렉토리)
14. 포트폴리오 제품 사진 생성 (6종, Replicate 실제 호출)

**인프라**
15. GitHub 리포 생성 + Vercel 자동 배포 연동
16. 블로그 자동 생성 Remote Trigger 설정 (주 1회)
17. Resend DNS 레코드 추가 (전파 확인 필요)
18. 민감 문서 gitignore 처리

**문서**
19. BUSINESS.md, COST_MANAGEMENT.md, MARKETING_PLAN.md 작성
20. 검수 결과 반영 (Replicate 단가 통일, 가격 단위 통일, 수치 보정)

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
