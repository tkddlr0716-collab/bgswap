# 이어서 할 부분 (2026-04-04)

## 현재 상태

- Product Hunt 오늘(4/4) 론칭 — KST 17:01 라이브
- 블로그 11편 배포 완료 (SEO 인덱싱 요청 완료)
- 무료 체험 15배경 확대 + 이메일 nurture 시퀀스 가동 중
- Vercel 자동 배포 + 블로그 자동 생성 트리거 활성

## 완료된 것

### 제품
- [x] 무료 프리뷰 15배경 확대 (5→15, 512px 워터마크)
- [x] 이메일 nurture 시퀀스 (24h/48h/7d, cron 자동)
- [x] PostHog 전체 퍼널 (pageview→upload→preview_viewed→checkout_click→payment_completed→download)
- [x] 유리/투명 객체 decontamination
- [x] 이메일 CAN-SPAM (Unsubscribe 헤더/링크)
- [x] 이메일 from 주소 (noreply@bgswap.io)
- [x] Webhook 재시도 (3회, 백오프)
- [x] 사용자 Retry 버튼 (/api/retry)
- [x] OG 이미지 재생성 (랜딩 톤 일치)
- [x] Gallery 이미지 4장

### SEO/블로그
- [x] 블로그 11편 (키워드 맵 SEO_KEYWORDS.md 참조)
- [x] 날짜 분산 (4/3~4/19, 2~3일 간격)
- [x] 내부 링크 (글 간 Related 2~3개씩)
- [x] Canonical URL 설정 (layout.tsx)
- [x] Sitemap 11편 등록
- [x] Google Search Console sitemap 재제출 + 핵심 URL 인덱싱 요청

### 인프라
- [x] GitHub 리포 (tkddlr0716-collab/bgswap, public)
- [x] Vercel GitHub 연동 → push 시 자동 배포
- [x] 블로그 자동 생성 Remote Trigger (주 1회 월요일 09:00 KST)
- [x] 이메일 nurture cron (매일 15:00 KST)
- [x] Resend DNS 레코드 추가 (bgswap.io)
- [x] Replicate 자동 결제 설정
- [x] 민감 문서 gitignore (BUSINESS, COST, MARKETING_PLAN은 로컬만)

### 마케팅 자료
- [x] PH 등록 + 4/4 론칭 예약
- [x] Reddit 게시글 3개 (REDDIT.md)
- [x] X 포스트 10일분 (X_POSTS.md)
- [x] 디렉토리 등록 텍스트 7개 (DIRECTORY_SUBMISSIONS.md)
- [x] 포트폴리오 제품 사진 (portfolio/)

### 문서 (로컬)
- [x] BUSINESS.md — 비즈니스 정의, 전략, 리스크
- [x] COST_MANAGEMENT.md — 서비스별 비용, 시나리오, 전환점
- [x] MARKETING_PLAN.md — 오가닉+유료+에이전트 자동화
- [x] SEO_KEYWORDS.md — 키워드 맵 (11편 완료)

## 오늘 할 것 (4/4)

### PH 론칭
- [ ] KST 17:01 — PH 라이브 확인
- [ ] 댓글 전부 답변 (빠를수록 좋음)
- [ ] PostHog utm_source=producthunt 트래픽 확인
- [ ] 서비스 정상 동작 모니터링

### 확인 필요
- [ ] Resend 도메인 인증 — Verified 됐는지 확인
- [ ] Google 인덱싱 — 1~3일 후 `site:bgswap.io` 검색으로 확인

## 이후 액션

### 이번 주
- [ ] Reddit r/ecommerce 게시 (REDDIT.md Post 1)
- [ ] 디렉토리 7개 등록 (DIRECTORY_SUBMISSIONS.md)
- [ ] X 첫 포스트 (X_POSTS.md Day 1)

### 매일
- [ ] X 1포스트
- [ ] 커뮤니티 댓글 2~3개 (15~20분)

### 자동 (에이전트)
- 블로그 주 1편 자동 생성 (Remote Trigger, 키워드 8개 → 소진 시 추가)
- nurture 이메일 자동 발송 (cron)
- Vercel 자동 배포 (GitHub push)

## 자료 위치

```
로컬 전용 (gitignore):
├── BUSINESS.md
├── COST_MANAGEMENT.md
├── MARKETING_PLAN.md
└── docs-backup/

리포 (GitHub + Vercel 배포):
├── SEO_KEYWORDS.md
├── RESUME.md
├── STATUS.md
├── src/content/blog/ (11편)
│   ├── bgswap-vs-removebg-vs-photoroom.mdx (3/31)
│   ├── amazon-product-photo-requirements.mdx (4/3)
│   ├── batch-product-photo-editing.mdx (4/3)
│   ├── how-to-remove-background-product-photo-free.mdx (4/5)
│   ├── white-background-product-photo-guide.mdx (4/7)
│   ├── amazon-listing-suppressed-background-fix.mdx (4/9)
│   ├── product-photos-with-phone.mdx (4/11)
│   ├── etsy-product-photography-tips.mdx (4/13)
│   ├── product-photo-background-colors.mdx (4/15)
│   ├── shopify-product-image-size.mdx (4/17)
│   └── diy-product-photography-at-home.mdx (4/19)
└── scripts/launch-assets/
    ├── REDDIT.md
    ├── X_POSTS.md
    ├── DIRECTORY_SUBMISSIONS.md
    └── PRODUCT_HUNT.md
```
