# BgSwap 프로젝트 진행 현황

> 최종 업데이트: 2026-03-31

## 프로젝트 개요
상품 사진 배경 제거 + 전문 배경 합성 SaaS (타겟: Amazon/Etsy/Shopify 셀러)

## 기술 스택
- Next.js 16.2.1 + React 19 + TypeScript + TailwindCSS 4
- AI: Replicate (`bria/remove-background`)
- DB: Turso (SQLite, ap-northeast-1)
- 스토리지: Cloudflare R2 (APAC, Public URL 활성화)
- 결제: Polar.sh (웹훅 방식)
- 이메일: Resend
- 분석: PostHog (선택적)

## 가격 정책 (확정)
| 플랜 | 가격 | 내용 | 단가 |
|------|------|------|------|
| 무료 체험 | $0 | 1장, 워터마크, 512px | - |
| Starter | $4.99 | 상품 10개, 5가지 배경 | $0.50 |
| Pro | $29 | 상품 100개, 5가지 배경 | $0.29 |

- 비즈니스 팩 $99/500장: MVP에서 제외, Month 2에 $29 반복구매 패턴 확인 후 결정

---

## 인프라 설정 상태

### 완료
- [x] Turso DB 생성 + 테이블 초기화 (orders, images, free_samples)
- [x] Cloudflare R2 버킷 (bgswap, APAC) + Public Access
- [x] .env.local: Replicate, R2 (Account ID, Access Key, Secret Key, Public URL), Turso (URL, Auth Token)
- [x] 개발 서버 정상 구동 (localhost:3000)
- [x] 빌드 성공 확인

### 미설정 환경변수
- [ ] `POLAR_WEBHOOK_SECRET` — Polar.sh 웹훅 시크릿
- [ ] `NEXT_PUBLIC_POLAR_CHECKOUT_URL` — Polar.sh 체크아웃 URL
- [ ] `RESEND_API_KEY` — 이메일 발송용
- [ ] `CRON_SECRET` — Vercel Cron 인증
- [ ] `RECAPTCHA_SECRET_KEY` (선택)
- [ ] `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` (선택)
- [ ] `NEXT_PUBLIC_POSTHOG_KEY` (선택)

---

## 페이지 구조

| 경로 | 설명 | 상태 |
|------|------|------|
| `/` | 랜딩 페이지 | 완료 (v2 — 전환율 최적화) |
| `/upload` | 사진 업로드 | 완료 (v2 — 모바일 최적화) |
| `/result/[id]` | 결과 확인 + 결제 | 완료 (v2 — 단계별 로딩) |
| `/download/[token]` | 다운로드 페이지 | 완료 |
| `/privacy` | 개인정보처리방침 | 완료 |
| `/terms` | 이용약관 | 완료 (잔재 수정됨) |
| `/refund` | 환불정책 | 완료 (이메일 수정됨) |

## API 라우트

| 엔드포인트 | 설명 | 상태 |
|------------|------|------|
| `POST /api/upload` | 파일 업로드 → R2 저장 | 완료 |
| `POST /api/generate` | 배경 제거 + 합성 (free/paid) | 완료 |
| `GET /api/status/[id]` | 주문 상태 조회 (폴링) | 완료 |
| `GET /api/download/[token]` | 다운로드 데이터 반환 | 완료 |
| `POST /api/webhook/polar` | 결제 웹훅 수신 | 완료 |
| `GET /api/cron/cleanup` | 만료 데이터 정리 (7일) | 완료 |

## 핵심 라이브러리 (src/lib/)

| 파일 | 역할 |
|------|------|
| `db.ts` | Turso 클라이언트 + ensureDb() 테이블 자동 생성 |
| `r2.ts` | S3 클라이언트 (upload, delete, getPublicUrl) |
| `replicate.ts` | bria/remove-background 모델 호출 |
| `compositor.ts` | Sharp 이미지 합성 (5배경, 드롭섀도우, 워터마크) |
| `email.ts` | Resend 연동, 다운로드 이메일 발송 |
| `security.ts` | 일회용 이메일 차단, rate limit, reCAPTCHA |

---

## 수정 이력 (2026-03-31)

### HeadshotAI 잔재 제거 (9건)
- [x] `/terms` — "upload only photos of yourself" → "products you own or have rights to"
- [x] `/terms` — "$29 USD for 10 products" → Starter $4.99/10개 + Pro $29/100개
- [x] `/terms` — "support@productai.com" → "support@bgswap.com"
- [x] `/terms` — "uploading others' photos" → "uploading infringing content"
- [x] `/refund` — "support@product photoai.com" → "support@bgswap.com"
- [x] `/download` — "Your Headshots" → "Your Product Photos"
- [x] `/download` — `headshot-${i+1}.png` → `bgswap-product-${i+1}.png`
- [x] `/download` — `headshotai-photos.zip` → `bgswap-photos.zip`
- [x] `/download` — alt/loading 텍스트 전부 product photo로 변경

### 전환율 최적화 (v2 리디자인)
- [x] 랜딩: "Built for" 신뢰 배지, Before/After, 5배경 미리보기, 마켓플레이스 컴플라이언스
- [x] 랜딩: 가격표 "Save 42%" 강조, 개별 CTA 버튼, 신뢰 시그널 (보안/환불/이메일)
- [x] 랜딩: FAQ 개선 (+/× 토글, 환불/데이터 삭제 Q&A 추가)
- [x] 업로드: 모바일 카메라 직접 촬영 (`capture="environment"`), 드래그 피드백
- [x] 업로드: "+" 추가 버튼, 삭제 버튼 모바일 항상 표시, 로딩 스피너
- [x] 결과: 4단계 로딩 애니메이션 (📤→✂️→🎨→✅ + 프로그레스 도트)
- [x] 결과: "Upgrade to get" 체크리스트 + 5배경 스와치 미리보기
- [x] 결과: 결제 후 프로그레스 바 (0/5 → 5/5)
- [x] 레이아웃: 스티키 헤더 (blur 배경 + 로고 + "Try Free" CTA)
- [x] CSS: cta-pulse, float-animation 추가

### 검수 기반 수정
- [x] "Trusted by" → "Built for" (론칭 전 거짓 주장 방지)
- [x] 삭제 버튼 `opacity-100 md:opacity-0 md:group-hover:opacity-100` (모바일 항상 보임)
- [x] shimmer 데드코드 삭제

---

## 배포 완료 (2026-03-31)

### 프로덕션 URL
- **사이트**: https://bgswap.io (커스텀 도메인)
- **기존 URL**: https://bgswap.vercel.app (여전히 작동)
- **Vercel 대시보드**: https://vercel.com/tkddlr0716-2569s-projects/bgswap

### 환경변수 (Vercel Production 설정 완료)
| 변수 | 상태 | 비고 |
|------|------|------|
| `REPLICATE_API_TOKEN` | ✅ | AI 배경 제거 |
| `R2_ACCOUNT_ID` | ✅ | Cloudflare R2 |
| `R2_ACCESS_KEY_ID` | ✅ | |
| `R2_SECRET_ACCESS_KEY` | ✅ | |
| `R2_BUCKET_NAME` | ✅ | bgswap |
| `R2_PUBLIC_URL` | ✅ | pub-9028bb34984240329392fa064ac0cb4f.r2.dev |
| `TURSO_DATABASE_URL` | ✅ | ap-northeast-1 |
| `TURSO_AUTH_TOKEN` | ✅ | |
| `POLAR_WEBHOOK_SECRET` | ✅ | 결제 웹훅 검증 |
| `NEXT_PUBLIC_POLAR_CHECKOUT_STARTER` | ✅ | Starter $4.99 체크아웃 |
| `NEXT_PUBLIC_POLAR_CHECKOUT_PRO` | ✅ | Pro $29 체크아웃 |
| `RESEND_API_KEY` | ✅ | 이메일 발송 |
| `CRON_SECRET` | ✅ | Vercel Cron 인증 |
| `NEXT_PUBLIC_BASE_URL` | ✅ | https://bgswap.io |
| `NEXT_PUBLIC_POSTHOG_KEY` | ✅ | (set in Vercel) |
| `NEXT_PUBLIC_POSTHOG_HOST` | ✅ | https://us.i.posthog.com |

### 외부 서비스 연동 상태
| 서비스 | 상태 | 비고 |
|--------|------|------|
| Replicate (AI) | ✅ 연동 완료 | bria/remove-background |
| Cloudflare R2 (스토리지) | ✅ 연동 완료 | 버킷: bgswap, APAC |
| Turso (DB) | ✅ 연동 완료 | 인덱스 6개 추가됨 |
| Polar.sh (결제) | ✅ 연동 완료 | Starter/Pro 상품 생성, 웹훅 URL: /api/webhook/polar |
| Resend (이메일) | ✅ 연동 완료 | 도메인: bgswap.io 인증 완료, 발신: send.bgswap.io |
| PostHog (분석) | ✅ 활성화 | 프로젝트 ID: 363744, 쿠키 동의 후 추적 |
| Vercel Cron | ✅ 설정 완료 | 매일 03:00 UTC 만료 데이터 정리 |

---

## Phase 1 완료 (2026-03-31)

### 1. 파일 업로드 보안 검증 ✅
- **파일**: `src/app/api/upload/route.ts`
- 매직 바이트 검증 (JPEG: FF D8 FF, PNG: 89 50 4E 47, WebP: RIFF 헤더)
- Sharp 디코딩 시도 — 디코딩 실패하면 거부 (악성 파일 차단)
- 최대 해상도 제한: 8000x8000px
- 기존 파일 크기(10MB) + MIME 타입 검증은 유지

### 2. 보안 헤더 + CSP ✅
- **파일**: `next.config.ts`
- Content-Security-Policy (next.config.ts 헤더 방식):
  - `script-src 'self' 'unsafe-inline'` (정적 페이지 유지 위해 nonce 미사용, ROADMAP 5.2에 변경 사유 기록)
  - `img-src`: self + R2 public URL + data: + blob: (업로드 프리뷰용)
  - `connect-src`: self + PostHog + Polar.sh
  - `frame-src`: Polar.sh + Google reCAPTCHA
  - `object-src 'none'`, `frame-ancestors 'none'`
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(self) — 모바일 촬영 지원, microphone/geolocation 차단
- HSTS: Vercel 자동 적용 (`max-age=63072000`), next.config.ts에서 별도 설정 안 함

### 3. 쿠키 동의 배너 (GDPR) ✅ (코드 완료, 프로덕션 육안 확인 필요)
- **파일**: `src/components/CookieConsent.tsx`
- 첫 방문 시 하단 배너 표시 (1초 딜레이로 플래시 방지)
- Accept / Decline 버튼
- 동의 상태 localStorage 저장 (`cookie_consent`)
- 동의 전: PostHog 추적 완전 비활성화
- Privacy Policy 링크 포함

### 4. PostHog 행동 추적 코드 ⚠️ (코드 준비 완료, 키 미발급으로 미작동)
- **파일**: `src/components/PostHogProvider.tsx` (수정)
- 쿠키 동의 확인 후에만 이벤트 전송 (`hasAnalyticsConsent()`)
- 자동 수집: `$pageview` (경로 변경 시)
- UTM 파라미터 자동 캡처 (utm_source, utm_medium, utm_campaign)
- 디바이스 타입 자동 감지 (mobile/desktop)
- referrer 자동 수집
- **파일**: `src/lib/analytics.ts` (신규)
  - 20개 이벤트 헬퍼 함수:
    - 섹션 뷰/체류: `trackSectionView`, `trackSectionEnter/Leave` (3초 threshold)
    - 스크롤 깊이: `trackScrollDepth` (25/50/75/100%, 중복 방지)
    - CTA: `trackCtaHoverStart/End` (500ms threshold), `trackCtaClick`
    - 업로드: `trackFileSelect`, `trackUploadSubmit/Complete/Error`
    - 결제: `trackCheckoutClick`, `trackDownloadClick`
    - FAQ: `trackFaqToggle`
    - 이탈: `setupExitIntent` (데스크톱 mouseleave + 모바일 visibilitychange)
  - 디바운싱: 세션당 중복 이벤트 방지 (`oncePerSession`)
  - hover 500ms threshold로 노이즈 제거

### 5. robots.txt + sitemap.xml ✅
- **파일**: `src/app/robots.ts`
  - Allow: /
  - Disallow: /api/, /result/, /download/
  - Sitemap 참조 포함
- **파일**: `src/app/sitemap.ts`
  - 5개 페이지: /, /upload, /privacy, /terms, /refund
  - priority, changeFrequency 설정
- **확인 URL**:
  - https://bgswap.io/robots.txt
  - https://bgswap.io/sitemap.xml

### 6. JSON-LD 구조화 데이터 ✅
- **파일**: `src/components/JsonLd.tsx`
- 3종 스키마 랜딩 페이지에 삽입:
  1. **FAQPage** — 7개 Q&A → 구글 FAQ 리치 스니펫
  2. **SoftwareApplication** — 앱 설명 + Starter/Pro 가격 (priceCurrency: USD) + featureList 7개
  3. **Organization** — BgSwap 브랜드 + 고객지원 이메일

### 7. llms.txt (AI 검색 최적화) ✅
- **파일**: `public/llms.txt`
- AI 크롤러 전용 사이트 요약: 기능, 가격, 차별점, 타겟 유저, 환불/데이터 정책
- **확인 URL**: https://bgswap.io/llms.txt

### 8. og-image.png ✅
- **파일**: `public/og-image.png`
- 1200x630px PNG, 82KB
- 파란 그라데이션 배경 + BgSwap 타이틀 + 가격 + 보증 문구
- Sharp SVG→PNG 변환으로 생성
- **확인 URL**: https://bgswap.io/og-image.png

### 9. metadataBase + canonical URL ✅
- **파일**: `src/app/layout.tsx`
- `metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL)` 추가
- OG 이미지, Twitter Card 등 모든 메타 URL이 절대경로로 해석됨

---

## Phase 2 완료 (2026-03-31)

### 1. CSRF 보호 ✅
- **파일**: `src/proxy.ts`
- POST 요청에 Origin 헤더 검증
- 웹훅(Polar.sh) + 크론 요청 예외 처리
- Origin + Referer 모두 없으면 차단 (자동화 요청 방지)

### 2. API CORS 제한 ✅
- **파일**: `src/proxy.ts`
- `Access-Control-Allow-Origin`: bgswap.io + localhost만 허용
- Vercel 기본 `*` CORS 제거
- OPTIONS preflight 처리

### 3. SSRF 방어 ✅
- **파일**: `src/lib/replicate.ts`
- Replicate API 호출 전 URL이 R2 Public URL 프리픽스인지 검증

### 4. 404 에러 페이지 ✅
- **파일**: `src/app/not-found.tsx`
- 홈/업로드 버튼 포함

### 5. 500 에러 페이지 ✅
- **파일**: `src/app/error.tsx`
- 재시도/홈 버튼 포함

### 6. 결제 투명성 ✅
- 결과 페이지 + 푸터에 "Payments by Polar.sh" 표시

### 7. Privacy Policy 보강 ✅
- GDPR/CCPA/PIPA 준수, 데이터 주체 권리 6종
- 쿠키 테이블 (cookie_consent, ph_distinct_id, Polar session, Cloudflare)
- 데이터 처리 목적별 설명

### 8. Terms of Service 보강 ✅
- AI 생성물 저작권 고지 (Bria AI, 상업적 사용권 보장)
- 결제 제공자 투명성 (Polar.sh)
- 영구 라이선스 명시
- 관할권: 대한민국, 약관 변경 30일 사전 통지

---

## 추가 코드 변경 (배포 과정)

### package.json 이름 수정
- `"name": "headshotai"` → `"name": "bgswap"`

### DB 인덱스 추가 (6개)
- **파일**: `src/lib/db.ts`
- `idx_images_order_id`, `idx_images_type`, `idx_orders_status`
- `idx_orders_download_token`, `idx_free_samples_ip`, `idx_free_samples_created_at`

### 결과 페이지 결제 버튼 분리
- **파일**: `src/app/result/[id]/page.tsx`
- 단일 체크아웃 링크 → Starter $4.99 / Pro $29 두 버튼
- Pro에 "BEST VALUE" 배지
- 환경변수: `NEXT_PUBLIC_POLAR_CHECKOUT_STARTER`, `NEXT_PUBLIC_POLAR_CHECKOUT_PRO`

---

## 알려진 이슈 & 개선 필요 사항

### 보안 (Phase 1에서 일부 해결)
- ~~CSP 미설정~~ → ✅ 해결 (next.config.ts)
- ~~파일 업로드 검증 없음~~ → ✅ 해결 (매직 바이트 + Sharp)
- Rate Limiting 인메모리 → MVP 허용 (DB 기반 일일 캡 존재), 일일 500건 초과 시 Upstash Redis 전환
- ~~CSRF 보호 없음~~ → ✅ 해결 (Phase 2, Origin 헤더 검증)
- ~~API CORS: Access-Control-Allow-Origin: *~~ → ✅ 해결 (Phase 2, 허용 도메인만)
- 이메일 검증 없음 (MVP: Polar.sh 결제 이메일로 대체)
- ~~Resend 도메인 미인증~~ → ✅ 해결 (bgswap.io 인증 완료)
- R2 이미지 URL 공개 (7일 만료로 제한적 리스크)

### 성능
- 결과 페이지 3초 폴링 (WebSocket/SSE 미적용)
- 이미지 캐싱 헤더 미설정
- ~~DB 인덱스 누락~~ → ✅ 해결 (6개 추가)

### 미구현 기능
- [ ] 사용자 인증 / 주문 내역
- [ ] 커스텀 배경 선택
- [ ] 테스트 코드
- [ ] 에러 트래킹 (Sentry 등)
- [ ] 웹훅 재시도 로직
- [ ] 유료 주문 재생성 옵션

### 론칭 후 개선 예정
- [ ] Before/After에 실제 상품 사진 적용 (현재 CSS 시뮬레이션)
- [ ] "Built for" → "Trusted by" (실제 사용자 확보 후)
- [ ] 비즈니스 팩 $99/500장 (반복구매 패턴 확인 후)
- [x] ~~PostHog 키 발급 + 활성화~~ → ✅ 완료
- [x] ~~Resend 도메인 인증 (DNS 레코드)~~ → ✅ 완료 (bgswap.io)
- [x] ~~커스텀 도메인 연결~~ → ✅ 완료 (bgswap.io)
- [x] Google Search Console 등록 + sitemap.xml 제출 완료

---

## 도메인 전환 완료 (2026-03-31)

### 변경 내역
| 항목 | Before | After |
|------|--------|-------|
| 도메인 | bgswap.vercel.app | bgswap.io |
| DNS | Namecheap | A→76.76.21.21, CNAME www→cname.vercel-dns.com |
| 이메일 발신 | noreply@bgswap.com | noreply@send.bgswap.io |
| 지원 이메일 | support@bgswap.com | support@bgswap.io |
| Resend 도메인 | bgswap.com (잘못됨) | bgswap.io (인증 완료) |
| PostHog | 미활성화 | 활성화 (프로젝트 363744) |
| NEXT_PUBLIC_BASE_URL | https://bgswap.vercel.app | https://bgswap.io |

### 도메인 전환 체크리스트 (ROADMAP.md 섹션 10)
- [x] Vercel 도메인 설정
- [x] `NEXT_PUBLIC_BASE_URL` 환경변수
- [x] `llms.txt` 내 모든 URL
- [x] `sitemap.ts` baseUrl
- [x] `layout.tsx` metadataBase
- [x] Polar.sh 웹훅 URL
- [x] Polar.sh 체크아웃 Success URL — bgswap.io로 변경 완료
- [x] Resend 발신 도메인
- [x] Privacy Policy / Terms 내 도메인 표기
- [x] PostHog 프로젝트 설정
- [x] CSP connect-src 검토
- [x] Google Search Console 등록 + sitemap.xml 제출 완료

---

## Phase 3 진행 현황 (2026-03-31)

### 완료

#### 1. Polar.sh Success URL 변경 ✅
- bgswap.vercel.app → bgswap.io로 변경

#### 2. Google Search Console ✅
- 등록 + sitemap.xml 제출 완료

#### 3. Product Hunt 론칭 자료 ✅
- **파일**: `PRODUCT_HUNT.md`
- 태그라인 (52자), 한 줄 설명 (138자), 소개 설명, Maker Comment
- 데모 영상 제작 계획, 스크린샷 가이드 4장, 론칭 체크리스트
- 검수 2회 반영 완료

#### 4. Reddit 게시 전략 ✅
- **파일**: `REDDIT.md`
- 3개 서브레딧별 게시물 초안 (r/ecommerce, r/AmazonSeller, r/Etsy)
- 댓글 대응 템플릿 5종, 삭제 시 대응 전략
- UTM 파라미터 포함, 게시 타이밍/순서 전략
- 검수 2회 반영 완료

#### 5. 비교 블로그 초안 ✅
- **파일**: `BLOG_COMPARISON.md`
- "BgSwap vs remove.bg vs PhotoRoom" 비교
- 경쟁사 가격 실데이터 기반 (remove.bg 크레딧 가격, PhotoRoom Pro/Max)
- 비용 시뮬레이션 (10개/50개), 공정성 검수 통과
- 블로그 인프라(MDX) 구현 후 게시 예정

#### 6. 실사 Before/After 이미지 + 포트폴리오 필름스트립 ✅
- **이미지**: `public/samples/` (36개 이미지 + LICENSES.md)
- **컴포넌트**: `src/components/PortfolioStrip.tsx`
- 6세트 무브랜드 제품: 백팩, 커피컵, 미니백, 종이백, 머그, 메신저백
- 소스: Pexels (무료 상업 사용), 라이선스 기록 완비
- CSS 시뮬레이션 → 실사 교체 완료
- 무한 횡스크롤 필름스트립 (호버/탭으로 Before↔After 전환)
- 모바일 터치 지원 ("Tap to see original")
- 5배경 쇼케이스 섹션: 커피컵 5배경으로 통일

#### 7. Compositor 개선 ✅
- **파일**: `src/lib/compositor.ts`
- `trim()` 추가 — 투명 영역 제거 후 정확한 중앙 배치
- 실루엣 후광 그림자 → 제거 (다중 제품에 부적합, 깔끔한 배경이 표준)
- 제품 크기 80% fit, 중앙 배치
- `validateHexColor()` 함수 추가 — 커스텀 배경색 HEX 정규식 검증
- `createFreePreviewAll()` 함수 추가 — 무료 5배경 256px 워터마크 썸네일 생성

#### 8. 접근성 감사 (WCAG AA) ✅
- **도구**: axe-core 코드 감사 (20개 이슈 발견)
- **수정 목록**:

| # | 심각도 | 이슈 | 파일 | 수정 |
|---|--------|------|------|------|
| 1 | Critical | `text-gray-400` 대비 실패 (테이블 헤더/데이터) | `page.tsx` | → `text-gray-600` |
| 2 | Critical | `text-gray-400` 대비 실패 (푸터) | `layout.tsx` | → `text-gray-600` |
| 3 | Critical | `text-blue-100` on blue-600 대비 실패 | `page.tsx` | → `text-white/90` |
| 4 | Critical | `text-gray-400` 잔존 전체 (가격표, 업로드, 결과) | `page.tsx`, `upload/page.tsx`, `result/page.tsx` | → `text-gray-500` 일괄 변경 |
| 5 | Major | Skip navigation 없음 | `layout.tsx` | Skip to main content 링크 + `id="main-content"` 추가 |
| 6 | Major | PortfolioStrip 키보드 접근 불가 | `PortfolioStrip.tsx` | `role="button"`, `tabIndex={0}`, `onKeyDown` 추가 |
| 7 | Major | Cookie consent 버튼 aria 없음 | `CookieConsent.tsx` | `aria-label="Accept/Decline cookies and analytics"` |
| 8 | Major | 파일 삭제 버튼 aria 없음 + 터치 타겟 작음 | `upload/page.tsx` | `aria-label="Remove photo N"` + `w-6→w-8` |
| 9 | Major | 에러 메시지 스크린리더 미알림 | `upload/page.tsx` | `role="alert"` 추가 |
| 10 | Minor | 이모지 아이콘 스크린리더 노출 | `page.tsx`, `upload/page.tsx` | `aria-hidden="true"` 추가 |
| 11 | Minor | PortfolioStrip hover 힌트 `text-gray-400` | `PortfolioStrip.tsx` | → `text-gray-500` |

#### 9. Sentry 에러 트래킹 ✅
- **파일**: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
- **파일**: `src/instrumentation.ts`
- **파일**: `src/app/global-error.tsx` (Sentry 캡처 추가)
- **파일**: `src/app/error.tsx` (Sentry 캡처 추가)
- **파일**: `next.config.ts` (withSentryConfig 래핑, CSP에 sentry.io 추가)
- Vercel 환경변수: `NEXT_PUBLIC_SENTRY_DSN` 설정 완료
- tracesSampleRate: 10%, 프로덕션만 활성화

#### 9. 테스트 코드 ✅
- **프레임워크**: Vitest
- **설정**: `vitest.config.ts`
- **테스트**: `src/lib/__tests__/security.test.ts` (8개)
  - 일회용 이메일 차단, 대소문자, 도메인 없음
  - Rate limit 허용/차단/리셋/독립 키
- **테스트**: `src/lib/__tests__/compositor.test.ts` (8개)
  - JPEG 출력, 크기, 중앙 배치, 배경색
  - 5배경 생성, 프리뷰 512px/워터마크/크기 비교
- 19/19 통과 (validateHexColor + createFreePreviewAll 추가)

#### 11. 프로덕션 버그 수정 ✅
- **R2 버킷 이름 줄바꿈 문자** — `R2_BUCKET_NAME` 환경변수 끝에 `\n` 포함 → `InvalidBucketName` 에러 → 환경변수 재설정
- **파일 크기 413 에러** — Vercel body limit 4.5MB 초과 → 클라이언트에서 업로드 전 자동 압축 (3MB 이하, 최대 2000px) 추가 (`src/app/upload/page.tsx`)
- **에러 메시지 불명확** — "Something went wrong" → 구체적 에러 메시지 표시로 변경 (upload/generate 응답 상세화)
- **파일명 문제** — 긴 파일명 에러 방지를 위해 업로드 시 `photo-1.jpg` 등으로 자동 리네이밍
- **파일 선택 호환성** — `accept` 속성에 MIME + 확장자 모두 추가 (`.jpg,.jpeg,.png,.webp`)

#### 12. Owner IP 예외 ✅
- **파일**: `src/app/api/generate/route.ts`
- Vercel 환경변수: `OWNER_IPS` (쉼표 구분)
- Owner IP는 무료 샘플 한도/일일 캡 우회 가능
- 테스트용 DB 리셋 스크립트: `scripts/reset-free-samples.ts`

#### 13. Phase A: 기능 업그레이드 ✅
- **설계 문서**: `FEATURE_UPGRADE.md` (검수 반영 완료)

##### 13-1. 출력 해상도 2048px
- **파일**: `src/lib/compositor.ts` — 기본 size 1024→2048
- 유료 플랜 출력: 2048×2048 (Amazon/Etsy/Shopify 규격 충족)
- 무료 프리뷰: 256px (변경 없음)

##### 13-2. 커스텀 배경색
- **파일**: `src/lib/compositor.ts` — `validateHexColor()` HEX 정규식 검증
- **파일**: `src/app/api/generate/route.ts` — `customColor` 파라미터 수신, 유효하면 6번째 배경 생성
- 보안: `/^#?([0-9a-fA-F]{6})$/` 정규식, 실패 시 무시 (기본 5색만)

##### 13-3. 무료 프리뷰 5배경 썸네일
- **파일**: `src/lib/compositor.ts` — `createFreePreviewAll()` 256px 워터마크 5장 생성
- **파일**: `src/app/api/generate/route.ts` — free mode에서 5장 생성 + R2 저장
- **파일**: `src/app/api/status/[id]/route.ts` — `previewImages` 배열 반환
- **파일**: `src/app/result/[id]/page.tsx` — 5배경 썸네일 격자 UI, 클릭 시 확대
- "Full 2048px without watermark after purchase" 문구 표시

### 대기 중
- [ ] PostHog 데이터 기반 첫 병목 분석 — 데이터 부족, 트래픽 확보 후

#### 14. Phase B: 옵션 커스터마이징 ✅

##### 14-1. Compositor 옵션 확장
- **파일**: `src/lib/compositor.ts`
- `CompositeOptions` 인터페이스 추가 (size, padding, shadow)
- `MARKETPLACE_PRESETS` — Amazon/Etsy/Shopify/eBay/Instagram 사이즈 프리셋
- 그림자 ON/OFF (접촉 그림자, SVG ellipse)
- 여백(padding) 0.6~0.95 범위 클램핑

##### 14-2. 옵션 저장 API
- **파일**: `src/app/api/options/[id]/route.ts` — PUT으로 옵션 JSON 저장
- **DB**: orders 테이블에 `options TEXT` 컬럼 추가
- **마이그레이션**: `scripts/add-options-column.ts`
- HEX 색상/마켓플레이스/padding 검증 후 저장

##### 14-3. Generate API 옵션 수신
- **파일**: `src/app/api/generate/route.ts` — shadow, padding, marketplace, customColor 파라미터 수신
- 마켓플레이스 프리셋 → 출력 사이즈 자동 적용

##### 14-4. Webhook에서 옵션 읽기
- **파일**: `src/app/api/webhook/polar/route.ts` — 결제 완료 시 orders.options JSON 읽어서 generate에 전달

##### 14-5. Result 페이지 옵션 UI
- **파일**: `src/app/result/[id]/page.tsx`
- 마켓플레이스 드롭다운 (Amazon/Etsy/Shopify/eBay/Instagram)
- 그림자 ON/OFF 토글 스위치
- 여백 슬라이더 (60%~95%)
- 커스텀 배경색 피커 (color input + HEX 텍스트)
- 옵션 변경 시 자동 저장 → 결제 후 반영
- "You'll get" 동적 요약 (선택한 옵션 반영)

##### 14-6. 테스트
- `src/lib/__tests__/compositor.test.ts` — 22/22 통과
- shadow+padding 옵션 테스트, padding 클램핑 테스트, MARKETPLACE_PRESETS 테스트

#### 15. 블로그 인프라 (MDX) ✅
- **설정**: `next.config.ts` — `@next/mdx` + `pageExtensions: ["ts","tsx","md","mdx"]`
- **MDX 컴포넌트**: `mdx-components.tsx`
- **블로그 인덱스**: `src/app/blog/page.tsx`
- **블로그 글 페이지**: `src/app/blog/[slug]/page.tsx` — SSG (generateStaticParams)
- **첫 번째 글**: `src/content/blog/bgswap-vs-removebg-vs-photoroom.mdx`
- **URL**:
  - https://bgswap.io/blog
  - https://bgswap.io/blog/bgswap-vs-removebg-vs-photoroom
- 새 글 추가 방법: `src/content/blog/`에 MDX 파일 + `[slug]/page.tsx`의 POSTS에 import 추가

#### 16. Phase C-1: 배치 갤러리 UI ✅
- **파일**: `src/app/api/status/[id]/route.ts`
  - 완료 상태일 때 `generatedImages` 배열 반환 (id, url, style, uploadIndex)
  - r2_key에서 `-p{N}-` 패턴으로 uploadIndex 추출
- **파일**: `src/app/result/[id]/page.tsx`
  - 다중 상품 업로드 시 "Previewing product 1 of N" 안내 메시지
  - "All N products will be processed after purchase" 문구
  - 프로그레스 바: `generatedCount / (uploadCount * 15)` (기존 `* 20%` 하드코딩 제거)
  - 완료 상태: 상품별 탭 + 결과물 미리보기 격자 (다운로드 페이지 패턴 재사용)
  - "You'll get" 섹션에 총 이미지 수 동적 표시

#### 17. Phase C-2: 배경 템플릿 (5종 텍스처) ✅
- **파일**: `src/lib/compositor.ts`
  - `TextureBg` 인터페이스 + `TEXTURE_OPTIONS` 5종: Marble, Wood, Linen, Concrete, Paper
  - `createTextureBg()` — SVG feTurbulence 기반 텍스처 배경 생성 (외부 이미지 불필요)
  - `compositeProductOnTexture()` — 제품 합성 (shadow/padding/enhance 지원)
- **파일**: `src/app/api/generate/route.ts`
  - paid mode에서 TEXTURE_OPTIONS 5종 추가 생성 (기존 solid 5 + gradient 5 + texture 5 = 15)
- **배경 총 15종**: 단색 5 + 그라디언트 5 + 텍스처 5 (+커스텀 색상 선택 시 16)
- 랜딩/가격표/JsonLd/llms.txt 모두 "5 backgrounds" → "15 backgrounds" 업데이트
- 테스트: 27/27 통과 (텍스처 테스트 5개 추가)

#### 18. DB 버그 수정 ✅
- **파일**: `src/lib/db.ts`
  - `ensureDb()`에 `ALTER TABLE orders ADD COLUMN options TEXT` 추가
  - Phase B options API가 참조하던 컬럼이 스키마에 누락되어 있던 버그 수정

### 미진행
- [ ] Phase C-3: AI 업스케일링 (Real-ESRGAN) — 비용/속도 영향으로 보류, 트래픽 확보 후 재검토
- [ ] Rate Limit Upstash Redis 전환 (일일 500건 초과 시)
