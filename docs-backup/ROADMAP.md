# BgSwap 론칭 전 종합 설계서

> 작성일: 2026-03-31 | 최종 수정: 2026-03-31 (검증 피드백 3회 반영, 2차 검증 13개 지적 반영)
> 목표: 비즈니스 병목 발견 → 전환율 극대화 → 검색 유입 확보 → 보안/법적 리스크 제거

---

## 0. 현재 상태 요약

### 잘 된 점
- 랜딩 구성: Hero → 데모 → 기능 → 가격 → FAQ → CTA 흐름 깔끔
- 반응형 설계: `md:` breakpoint 기반 모바일 대응
- 시맨틱 HTML: `<header>`, `<main>`, `<footer>`, `<section>` 적절 사용
- SEO 기본: OG 태그, Twitter Card, 메타 description 구비
- 환불 정책: 2단계(무료 재생성 → 전액 환불) 고객 친화적
- 데이터 보존: 7일 자동 삭제 정책 명확
- 가격 투명성: $4.99/10장, $29/100장, 구독 없음

### 종합 평가 (Phase 완료 시 업데이트)
> 평가 업데이트 주기: Phase 1 완료 후, Phase 2 완료 후, 론칭 후 1개월 시점에 재평가.

| 항목 | 현재 (Phase 0) | Phase 1 목표 | Phase 2 목표 |
|------|---------------|-------------|-------------|
| 기술 구현 | ★★★★☆ | ★★★★☆ | ★★★★★ |
| UI/UX | ★★★☆☆ | ★★★☆☆ | ★★★★☆ (실사 이미지) |
| 보안 | ★★☆☆☆ | ★★★★☆ (CSP+업로드) | ★★★★☆ |
| 법적 준수 | ★★☆☆☆ | ★★☆☆☆ | ★★★★☆ (GDPR/PIPA) |
| 비즈니스 완성도 | ★★☆☆☆ | ★★★☆☆ | ★★★★☆ (도메인+이미지) |

---

## 1. 행동 추적 시스템 (비즈니스 디버깅)

### 1.1 목적
방문자가 **어디서 이탈**하고 **어디서 망설이는지** 정확히 파악하여 전환율 병목을 데이터로 찾고 제거한다.

### 1.2 추적 도구
- **PostHog** (이미 코드 있음, 키만 발급하면 활성화)
  - 이벤트 트래킹 + 세션 리플레이 + 퍼널 분석 + 히트맵
  - 무료 티어: 월 100만 이벤트, 5,000 세션 리플레이
  - 장점: 자체 호스팅 가능, GDPR 친화적, 올인원

### 1.3 GDPR 준수: 쿠키 동의 배너 (필수 선행)
> ⚠️ **검증 지적 #1**: PostHog 세션 리플레이/히트맵은 개인 행동 데이터. 쿠키 동의 없이 활성화하면 EU 사용자 대상 불법.

**구현 사항:**
- 첫 방문 시 쿠키 동의 배너 표시
- 동의 전: 필수 쿠키만 (세션 유지)
- 동의 후: PostHog 추적 활성화
- 거부 시: 추적 완전 비활성화, 익명 집계만
- 동의 상태를 localStorage에 저장
- `src/components/CookieConsent.tsx` — 배너 컴포넌트
- `src/lib/analytics.ts` — 동의 상태 확인 후 이벤트 전송

### 1.4 추적 이벤트 설계

#### A. 퍼널 (전환 경로)
```
랜딩 도착 → CTA 클릭 → 업로드 페이지 → 파일 선택 → 업로드 완료
→ 프리뷰 확인 → 결제 버튼 클릭 → 결제 완료 → 다운로드
```

| 이벤트명 | 발생 시점 | 수집 데이터 |
|----------|-----------|-------------|
| `page_view` | 모든 페이지 진입 | path, referrer, utm_source/medium/campaign, device |
| `landing_section_view` | 랜딩 각 섹션 뷰포트 진입 | section_id (hero, demo, pricing, faq, bottom_cta) |
| `landing_section_dwell` | 섹션에서 3초 이상 체류 | section_id, dwell_time_ms |
| `scroll_depth` | 스크롤 25/50/75/100% | depth_percent, time_to_reach_ms |
| `cta_hover` | CTA 버튼 hover **500ms 이상** | button_id, page, hover_duration_ms |
| `cta_click` | CTA 버튼 클릭 | button_id, page, time_on_page_ms |
| `upload_page_enter` | 업로드 페이지 진입 | from_page, time_since_landing_ms |
| `file_select` | 파일 선택 완료 | method (drag/click/camera), file_count, time_to_select_ms |
| `file_remove` | 선택 파일 삭제 | file_index |
| `upload_submit` | 업로드 버튼 클릭 | file_count, total_size_bytes |
| `upload_complete` | 업로드 성공 | order_id, duration_ms |
| `upload_error` | 업로드 실패 | error_type, file_size |
| `preview_view` | 프리뷰 이미지 확인 | order_id, time_since_upload_ms |
| `pricing_hover` | 가격 버튼 hover **500ms 이상** | plan (starter/pro), hover_duration_ms |
| `checkout_click` | 결제 버튼 클릭 | plan (starter/pro), time_on_result_ms |
| `checkout_complete` | 결제 완료 (웹훅) | plan, order_id, amount |
| `download_click` | 다운로드 버튼 클릭 | order_id |
| `faq_toggle` | FAQ 항목 열기/닫기 | question_index, action (open/close) |
| `exit_intent` | 이탈 감지 | page, scroll_depth, time_on_page_ms |

> **검증 반영 — cta_hover 노이즈 제거 (#4):** hover 이벤트는 최소 500ms threshold 적용. 500ms 미만 hover는 무시.

> **검증 반영 — exit_intent 모바일 대응 (#2):**
> - 데스크톱: `mouseleave` (마우스 브라우저 상단 이동)
> - 모바일: `visibilitychange` (탭 전환) + `beforeunload` (뒤로가기/닫기)
> - `pagehide` 이벤트도 fallback으로 등록

#### B. 망설임 감지 (Hesitation Detection)
| 시그널 | 정의 | 의미 |
|--------|------|------|
| 섹션 정지 | 스크롤 멈춤 3초+ | "이 내용 읽고 있음" 또는 "고민 중" |
| CTA 미클릭 hover | hover 500ms+ 후 클릭 안 함 | "관심은 있지만 확신 부족" |
| 가격표 왕복 | Starter↔Pro 반복 hover (3회+) | "어떤 플랜이 맞는지 고민" |
| 결과→랜딩 복귀 | 결과 페이지에서 뒤로가기 | "결제 전 재확인 필요" |
| 탭 전환 | visibilitychange hidden→visible | "경쟁사 비교 중일 가능성" |

#### C. 이벤트 과다 수집 방지 전략
> **검증 지적 #3**: hover, dwell, scroll 이벤트를 모두 전송하면 무료 티어 월 100만 이벤트 금방 소진.

| 대책 | 방법 |
|------|------|
| 디바운싱 | scroll_depth: 500ms 디바운스. 같은 depth 중복 전송 안 함 |
| 샘플링 | landing_section_dwell: 3초 간격으로 체류 시간 갱신 (매 초 전송 X) |
| 배치 전송 | hover/dwell 이벤트는 페이지 이탈 시 배치로 한번에 전송 |
| 중복 제거 | 같은 section_view는 세션당 1회만 |
| 예상 사용량 | 방문자 1,000명/월 × 평균 15 이벤트 = 15,000/월 (한도의 1.5%) |

#### D. 코호트 분석용 속성
| 속성 | 값 |
|------|-----|
| `device_type` | mobile / desktop / tablet |
| `utm_source` | google, reddit, producthunt, direct... |
| `first_visit` | true / false (재방문 판별) |
| `visit_count` | 누적 방문 횟수 |
| `country` | GeoIP 기반 (PostHog 자동) |

### 1.5 대시보드 구성 (PostHog)

**대시보드 1: 퍼널**
- 단계별 전환율 + 이탈률
- 디바이스별 비교
- 유입 채널별 비교

**대시보드 2: 병목 탐지**
- 섹션별 평균 체류 시간 히트맵
- CTA hover → 클릭 전환율
- 망설임 시그널 빈도

**대시보드 3: 매출**
- Starter vs Pro 선택 비율
- 결제까지 평균 소요 시간
- 재방문 후 결제 비율

### 1.6 구현 방식
- `src/components/CookieConsent.tsx` — 쿠키 동의 배너
- `src/lib/analytics.ts` — 이벤트 헬퍼 (동의 확인 + 디바운싱 + 배치 전송)
- `src/hooks/useTracker.ts` — 스크롤/체류/망설임 자동 추적 훅
- `src/components/PostHogProvider.tsx` — 기존 코드 확장 (동의 연동)
- Intersection Observer API로 섹션 뷰포트 진입 감지
- 이탈 감지: 데스크톱 `mouseleave` + 모바일 `visibilitychange`/`beforeunload`

---

## 2. 검색 최적화 (SEO)

### 2.1 현재 상태
- ✅ 메타 title, description, OG태그, Twitter Card 존재
- ❌ robots.txt 없음
- ❌ sitemap.xml 없음
- ❌ JSON-LD 구조화 데이터 없음
- ❌ og-image.png 파일 누락 (메타에서 참조하지만 실제 없음)
- ❌ canonical URL 미설정
- ❌ upload, result, download 페이지 메타데이터 없음

### 2.2 타겟 키워드

> **검증 지적 #5**: 키워드 검색량은 추정치. 론칭 후 Google Search Console 실데이터로 검증 필요.

#### Primary (직접 전환 의도)
| 키워드 | 경쟁도 | 비고 |
|--------|--------|------|
| product photo background remover | 높음 | 메인 키워드 |
| remove background from product photo | 높음 | 동의어 |
| white background product photo | 중간 | Amazon 셀러 |
| amazon product photo requirements | 낮음 | 정보성 → 전환 |

#### Long-tail (전환율 높음)
| 키워드 | 의도 |
|--------|------|
| bulk product photo background removal | 대량 처리 (Pro 타겟) |
| etsy product photo background | 플랫폼 특화 |
| product photo editing for ecommerce | 포괄적 |
| cheap product photo editing service | 가격 민감 (Starter 타겟) |
| product photo white background free | 무료 체험 유입 |

### 2.3 구현 항목

#### A. 기술적 SEO
| 항목 | 파일 | 내용 |
|------|------|------|
| robots.txt | `src/app/robots.ts` | Allow: /, Disallow: /api/, /result/, /download/ |
| sitemap.xml | `src/app/sitemap.ts` | /, /upload, /privacy, /terms, /refund |
| canonical URL | `src/app/layout.tsx` | metadataBase 설정 |
| OG Image | `public/og-image.png` | 1200x630px, 서비스 소개 이미지 생성 |
| 페이지별 메타 | 각 page.tsx | title, description 추가 |

#### B. 구조화 데이터 (JSON-LD)
```
1. FAQPage — 랜딩 FAQ 7개 항목 → 구글 검색 FAQ 리치 스니펫
2. Product — Starter/Pro 가격 (priceCurrency: USD, price 명시)
3. SoftwareApplication — 서비스 설명 + featureList
4. Organization — BgSwap 브랜드 정보
5. WebSite — 사이트명 + 검색 설명
```

#### C. 콘텐츠 SEO
- H1/H2 키워드 자연 포함 (이미 잘 되어 있음)
- img alt 태그 추가 (이모지 → 실사 교체 시)
- 내부 링크 구조: 랜딩 → 업로드 → 약관/환불/개인정보

#### D. 콘텐츠 마케팅 (Phase 3)
> **검증 지적 #7**: 랜딩 1장으로는 검색 순위 확보 어려움. 콘텐츠 페이지 필요.

론칭 후 블로그 페이지 추가 계획:
| 콘텐츠 | 타겟 키워드 | 목적 |
|--------|-------------|------|
| "Amazon Product Photo Requirements 2026 Guide" | amazon product photo requirements | 정보 유입 → 서비스 전환 |
| "How to Take Product Photos with Your Phone" | product photo with phone | 초보 셀러 유입 |
| "BgSwap vs remove.bg vs PhotoRoom" | product photo tool comparison | 비교 검색 캡처 |
| "5 Product Photo Backgrounds That Sell More" | product photo backgrounds | 배경 관심자 유입 |

**블로그 인프라**: Next.js App Router + MDX (`@next/mdx`). `/blog/[slug]` 경로. 별도 CMS 불필요 — MDX 파일을 `src/content/blog/`에 직접 작성. 이유: 글 4개 수준이면 CMS 오버헤드가 더 큼.

---

## 3. AI 검색 최적화 (AEO — Answer Engine Optimization)

### 3.1 왜 필요한가
ChatGPT, Perplexity, Google AI Overview가 검색 트래픽을 가져가고 있음.
AI가 "상품 사진 배경 제거 서비스 추천해줘"라고 물었을 때 **BgSwap이 답변에 포함**되어야 함.

### 3.2 AI가 크롤링하는 정보
| 소스 | AI가 읽는 것 |
|------|-------------|
| 웹사이트 | 구조화 데이터, FAQ, 가격, 기능 설명 |
| Reddit/커뮤니티 | 사용자 멘션, 추천글 |
| GitHub | 오픈소스 프로젝트 README |
| 리뷰 사이트 | G2, Capterra, Product Hunt |
| 비교 블로그 | "Best product photo tools 2026" 류 기사 |

### 3.3 구현 전략

#### A. 웹사이트 최적화 (AI 크롤러용)
| 항목 | 방법 |
|------|------|
| llms.txt | 루트에 `public/llms.txt` 생성 — AI 크롤러 전용 사이트 요약 |
| 명확한 Q&A 구조 | FAQ를 "질문: ... 답변: ..." 패턴으로 마크업 |
| 비교 테이블 | "BgSwap vs remove.bg vs PhotoRoom" 비교 데이터 구조화 |
| 가격 명시 | JSON-LD Product에 가격, 통화, 단위 명확히 |
| 기능 나열 | SoftwareApplication schema에 featureList 포함 |

#### B. llms.txt 내용
> **검증 지적 #8**: URL은 커스텀 도메인 확정 후 업데이트 필요. 도메인 전환 시 llms.txt, sitemap, canonical 모두 동시 변경.

```
# BgSwap
> AI-powered product photo background removal and replacement for e-commerce sellers.

## What it does
- Removes background from product photos using AI
- Generates 15 professional backgrounds (white, light gray, warm, cool, dark, and more)
- Outputs marketplace-compliant images (Amazon, Etsy, Shopify, eBay)

## Pricing
- Free: 1 photo preview (512px, watermarked)
- Starter: $4.99 for 10 products (15 backgrounds each = 150 images)
- Pro: $29 for 100 products (15 backgrounds each = 1,500 images)
- No subscription. One-time payment.

## Key differentiators vs remove.bg / PhotoRoom
- 15 backgrounds per photo (not just removal)
- Marketplace-specific compliance (Amazon white, Etsy lifestyle, etc.)
- Batch processing included
- No subscription required
- Drop shadow for realism

## Target users
Amazon sellers, Etsy sellers, Shopify store owners, eBay sellers, e-commerce product photographers

## Links
- Website: [도메인 확정 후 업데이트]
- Upload: [도메인 확정 후 업데이트]
```

#### C. 외부 시그널 (론칭 후) — 구체적 실행안
> **검증 지적 #9**: "Reddit에 글 쓴다"는 계획이 아니라 소원 목록. 구체적 실행안 필요.

| 액션 | 구체적 실행 | 시기 |
|------|------------|------|
| Product Hunt | 론칭 게시물 작성 (태그라인, 스크린샷 4장, 소개 영상 준비) | 론칭 D-day |
| Reddit | r/AmazonSeller (128K), r/Etsy (260K), r/ecommerce (120K)에 Before/After 결과물 + "I built this" 포맷으로 게시. 셀프 프로모션 규칙 확인 필수 | 론칭 후 1주 |
| 비교 블로그 | 자체 블로그에 "BgSwap vs remove.bg vs PhotoRoom 2026" 작성, 정직한 비교 (약점도 인정) | 론칭 후 2주 |
| Product 리뷰 | G2, Capterra에 프로필 등록 (무료). 초기 사용자에게 리뷰 요청 | 유료 사용자 10명 후 |

---

## 4. 실사 Before/After 이미지

### 4.1 현재 문제
랜딩페이지 Before/After가 **이모지 + CSS 시뮬레이션**. 설득력 제로.
스크린 리더에서 이모지 기반 UI가 혼란을 줄 수 있음.

### 4.2 필요 이미지 (4세트)

| # | 카테고리 | Before 상황 | After |
|---|----------|-------------|-------|
| 1 | 신발/스니커즈 | 어수선한 바닥/카펫 위 | 깔끔한 흰 배경 + 드롭섀도우 |
| 2 | 가방/핸드백 | 구겨진 천/침대 위 | 라이트 그레이 배경 |
| 3 | 화장품/스킨케어 | 욕실 선반/생활 잡음 | 웜 톤 배경 |
| 4 | 전자기기/이어폰 | 책상 위 잡동사니 | 다크 배경 (프리미엄) |

### 4.3 이미지 소싱 방법
> **검증 지적 #10**: 이미지 저작권 리스크. Unsplash/Pexels 라이선스 조건 확인 필요.

1. **자체 촬영 + 서비스 처리** (최우선) — 저작권 문제 없음, 가장 신뢰도 높음
2. **Unsplash/Pexels** — 라이선스 확인 필수:
   - Unsplash: 상업적 사용 허용, 편집 허용, 별도 허가 불요
   - Pexels: 동일 조건
   - 단, "편집본을 메인 콘텐츠로 판매" 금지 조항 확인 → Before/After 데모 용도는 허용됨
3. **AI 생성** — 비추 (실제 결과물과 괴리)

### 4.4 구현
> **검증 지적 #11**: Before/After 슬라이더 구현 방식 미정.

- **자체 CSS 구현** (외부 라이브러리 X) — `input[type="range"]` + `clip-path`로 드래그 비교
  - 이유: react-compare-image 등은 번들 크기 추가 + 유지보수 부담
  - 모바일: 터치 드래그 지원 (`touch-action: none`)
- 이미지 최적화: Next.js `<Image>` 컴포넌트, WebP, srcset, lazy loading
- alt 텍스트: "Sneaker photo on messy carpet before BgSwap" / "Same sneaker on clean white background after BgSwap"
- aria-label: 슬라이더에 접근성 레이블 추가

---

## 5. 보안 강화

### 5.1 발견된 문제 (사이트 검증 + 설계서 검증 통합)

| # | 문제 | 심각도 | 해결 방법 |
|---|------|--------|-----------|
| 1 | CSP 미설정 (nonce=$undefined) | 🔴 높음 | next.config.ts 헤더 방식 CSP 적용 (아래 5.2 참조) |
| 2 | CORS 미지정 (crossOrigin=$undefined) | 🔴 높음 | next.config.ts 보안 헤더 |
| 3 | **파일 업로드 보안 검증 없음** | 🔴 높음 | 매직 바이트 확인 + 파일 크기/타입 서버측 검증 |
| 4 | 보안 헤더 전무 | 🔴 높음 | X-Frame-Options 등 6종 |
| 5 | **SSRF 리스크** | 🟠 중간 | Replicate에 URL 전달 시 signed URL만 허용 |
| 6 | Rate Limit 인메모리 | 🟠 중간 | MVP 허용 (DB 기반 일일 캡 100건). 일일 무료 요청 500건 초과 시 Upstash Redis 전환 (Phase 3 #24) |
| 7 | **이메일 검증 없음** | 🟠 중간 | 아무 이메일이나 넣으면 타인에게 결과 전송 가능 |
| 8 | R2 URL 공개 | 🟡 낮음 | 7일 만료로 리스크 제한적 |

### 5.2 CSP 구현 (Phase 1 완료 — next.config.ts 헤더 방식)

**설계 변경 사유:** 원래 nonce 기반 CSP를 계획했으나, Next.js 16에서 nonce CSP는 모든 페이지를 동적 렌더링으로 강제함. 랜딩/업로드/약관 등 7개 정적 페이지가 동적으로 전환되면 성능이 크게 저하되고 CDN 캐싱이 불가능해짐. MVP에서는 `'unsafe-inline'` 기반 CSP로 구현. CSP 전무 상태 대비 상당한 개선 (default-src, object-src, frame-ancestors, connect-src 등으로 공격 표면 축소).

**향후 강화 계획:** Next.js experimental SRI (Subresource Integrity) 기능이 안정화되면 hash 기반 CSP로 전환하여 `unsafe-inline` 제거 가능. 정적 페이지 유지하면서 보안 강화 가능.

```
// next.config.ts에서 헤더로 적용 (실제 배포된 정책)
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://www.google.com https://www.gstatic.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' https://pub-*.r2.dev data: blob:;
  connect-src 'self' https://us.i.posthog.com https://api.polar.sh https://buy.polar.sh;
  frame-src https://buy.polar.sh https://www.google.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
```

> **blob: 근거**: 업로드 페이지에서 `URL.createObjectURL()`로 파일 선택 즉시 로컬 프리뷰를 표시함. blob: URL이 없으면 프리뷰 깨짐. 업로드 프리뷰 전용.

### 5.3 기타 보안 헤더 (next.config.ts)
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(self), microphone=(), geolocation=()
```

> **camera=(self) 근거**: 업로드 페이지에서 `capture="environment"`로 모바일 카메라 직접 촬영을 지원함. camera=()로 완전 차단하면 모바일 촬영 기능 동작 안 함.

> **HSTS**: Vercel이 자동으로 `Strict-Transport-Security: max-age=63072000`을 적용함 (next.config.ts에서 별도 설정 불필요). 커스텀 도메인 전환 시에도 Vercel이 처리하므로 수동 추가 불필요. 참고로 개발 환경(localhost HTTP)에는 적용되지 않음(Vercel 서빙이 아니므로).
> ```
> // next.config.ts에서 조건부 적용
> ...(process.env.NODE_ENV === 'production' && customDomain
>   ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }]
>   : [])
> ```

### 5.4 파일 업로드 보안 (Phase 1 필수)
> **검증 지적 #14, #26**: 악성 파일 업로드는 서비스 장애 직결. 보안 헤더보다 급함.

| 검증 항목 | 방법 |
|-----------|------|
| 파일 타입 | Accept: image/jpeg, image/png, image/webp만 허용 |
| 매직 바이트 | 파일 첫 4~8바이트로 실제 이미지 여부 확인 (JPEG: FF D8 FF, PNG: 89 50 4E 47) |
| 파일 크기 | 최대 10MB, 서버측 재검증 |
| 파일명 | sanitize (경로 순회 차단), UUID로 대체 저장 |
| Sharp 처리 | 업로드 즉시 Sharp로 디코딩 시도 → 실패하면 거부 |

구현: `/api/upload/route.ts`에 검증 로직 추가.

### 5.5 이메일 검증
> **검증 지적 #19**: 아무 이메일이나 넣으면 타인 메일로 결과 전송.

- MVP 대응: 결제 시 Polar.sh가 이메일 수집 → 해당 이메일로만 전송 (사용자 입력 이메일 무시)
- 론칭 후: 이메일 인증 코드 발송 (OTP)

### 5.6 SSRF 방어
> **검증 지적 #15**: Replicate API에 URL 전달 시 SSRF 가능.

- 현재 흐름: 업로드 → R2 저장 → R2 public URL을 Replicate에 전달
- R2 public URL은 고정 도메인(`pub-*.r2.dev`)이므로 외부 URL 주입 불가
- 추가 방어: Replicate 호출 전 URL이 R2_PUBLIC_URL 프리픽스인지 검증

---

## 6. 법적 문서 보강

### 6.1 발견된 문제 (통합)

| # | 문제 | 심각도 | 해결 방법 |
|---|------|--------|-----------|
| 1 | GDPR/CCPA 미준수 | 🔴 높음 | Privacy Policy에 적용 법률, 데이터 주체 권리 명시 |
| 2 | **한국 PIPA 누락** | 🔴 높음 | 한국 개인정보보호법 준수 조항 추가 |
| 3 | 결제 제공자 불투명 | 🔴 높음 | "Payments processed by Polar.sh" 추가 |
| 4 | **AI 생성물 저작권 미고지** | 🟠 중간 | AI가 만든 이미지의 저작권 귀속/상업적 사용 범위 명시 |
| 5 | 쿠키 정책 미흡 | 🟠 중간 | 구체적 쿠키 목록/목적 테이블 추가 |
| 6 | 분쟁 해결 조항 부재 | 🟠 중간 | 관할권, 중재 절차 추가 |
| 7 | 약관 변경 통지 미정의 | 🟠 중간 | 이메일/사이트 공지 방법 명시 |
| 8 | 라이선스 기간 모호 | 🟠 중간 | "구매 후 영구 라이선스" 명시 |

### 6.2 Privacy Policy 추가 내용
- **적용 법률**: GDPR (EU), CCPA (California), PIPA (대한민국)
- 데이터 주체 권리: 열람, 정정, 삭제, 이동, 처리 제한
- 쿠키 테이블:

| 쿠키명 | 목적 | 유형 | 만료 |
|--------|------|------|------|
| `cookie_consent` | 쿠키 동의 상태 저장 | 필수 | 1년 |
| `posthog_id` | 익명 분석 식별자 | 분석 (동의 후) | 1년 |
| (Polar.sh 세션) | 결제 처리 | 필수 | 세션 |
| `__cf_bm`, `__cflb` 등 | Cloudflare 봇 방지/로드밸런싱 (R2 이미지 접근 시) | 필수 (제3자) | 30분 |

> 실제 쿠키 전수 조사 필요: 론칭 전 DevTools → Application → Cookies에서 전체 목록 확인 후 테이블 업데이트.

- 데이터 처리 목적별 법적 근거
- DPO 연락처: support@bgswap.com

### 6.3 Terms of Service 추가 내용
- 결제 처리: "Payments are securely processed by Polar.sh (polar.sh). BgSwap does not store credit card information."
- 라이선스: "Upon purchase, you receive a perpetual, non-exclusive, worldwide license to use the generated images for commercial purposes, including but not limited to marketplace listings."
- **AI 생성물 고지**: "Images are processed using AI (Bria AI). The output images are derivative works of your original photos. You retain full commercial usage rights to the processed images."
- 관할권: "Governed by the laws of the Republic of Korea." (관할 법원은 사업자등록 주소 기준으로 확정. 서울이 아닐 수 있음 → 등록 전 확인 필요)
- 약관 변경: "We will notify users of material changes via email (if provided) and a prominent notice on our website at least 30 days before changes take effect."
- 분쟁 해결: "Any disputes shall first be addressed through good faith negotiation. If unresolved within 30 days, disputes shall be submitted to the Seoul Central District Court."

---

## 7. 간과된 항목 (통합)

### 7.1 비즈니스 크리티컬

| # | 항목 | 설명 | 우선순위 |
|---|------|------|----------|
| 1 | 커스텀 도메인 없음 | vercel.app 도메인은 신뢰도 저하, 결제 전환율 하락 | 🔴 |
| 2 | Social Proof 부재 | 리뷰, 사용자 수, 고객 로고 없음 | 🔴 |
| 3 | 경쟁사 차별점 약함 | remove.bg/PhotoRoom 대비 왜 BgSwap인지 불명확 | 🟠 |
| 4 | 에러 페이지 없음 | 404/500 커스텀 페이지 없어 이탈 유발 | 🟠 |

### 7.2 기술적

| # | 항목 | 설명 | 우선순위 |
|---|------|------|----------|
| 5 | og-image.png 누락 | SNS 공유 시 이미지 깨짐 | 🔴 |
| 6 | next.config.ts 비어있음 | 이미지 최적화, 보안 헤더, 캐시 설정 없음 | 🔴 |
| 7 | `<img>` 사용 | Next.js `<Image>` 미사용 → 이미지 최적화 누락 | 🟠 |
| 8 | metadataBase 미설정 | OG 이미지 절대경로 해석 불가 | 🟠 |
| 9 | 에러 트래킹 없음 | Sentry 등 없어 프로덕션 에러 감지 불가 | 🟠 |
| 10 | 웹훅 재시도 없음 | Polar 웹훅 실패 시 결제 누락 가능 | 🟠 |
| 11 | **모니터링/알림 없음** | 업타임 체크, Replicate API 장애 대응 없음 | 🟠 |
| 12 | **백업/복구 전략 없음** | Turso DB, R2 데이터 백업 계획 없음 | 🟠 |

### 7.3 접근성

| # | 항목 | 설명 | 우선순위 |
|---|------|------|----------|
| 13 | 이모지 기반 UI | 스크린 리더 혼란, aria-label 필요 | 🟡 |
| 14 | 키보드 네비게이션 | FAQ 토글 등 키보드 접근성 미확인 | 🟡 |
| 15 | 색상 대비 | gray-400 텍스트 WCAG AA 미달 가능 → gray-500 이상으로 | 🟡 |
| 16 | 터치 타겟 | 모바일 버튼/링크 최소 44px 충족 확인 필요 | 🟡 |

### 7.4 성능

| # | 항목 | 설명 | 우선순위 |
|---|------|------|----------|
| 17 | 이미지 캐싱 없음 | R2 이미지 Cache-Control 미설정 | 🟡 |
| 18 | 3초 폴링 | 결과 페이지 WebSocket/SSE 미적용 | 🟡 |
| 19 | 번들 분석 안 함 | 불필요한 코드 포함 여부 미확인 | 🟡 |

### 7.5 향후 고려

| # | 항목 | 설명 | 시기 |
|---|------|------|------|
| 20 | 사용자 계정 | 로그인/대시보드/히스토리 → 재구매 경험 | Month 2+ |
| 21 | 국제화(i18n) | 글로벌 셀러 대상인데 영어 단일 언어 | Month 3+ |
| 22 | 접근성 감사 | Lighthouse/axe로 WCAG AA 검증 | 론칭 후 |

---

## 8. 구현 우선순위 (론칭 전 필수)

> **검증 지적 #24, #25, #26**: 시간 추정이 비현실적이었음. 현실적으로 재조정.

### Phase 1: 론칭 차단 항목 (2일 + 디버깅 버퍼 반일)

> 합계 약 12.5시간. CSP 디버깅은 예측 불가능하므로 반일 버퍼 포함.

| # | 작업 | 예상 시간 | 영향도 | 비고 |
|---|------|-----------|--------|------|
| 1 | **파일 업로드 보안 검증** | 2시간 | 🔴 서비스 안전 | 매직 바이트 + 크기 + Sharp 디코딩 |
| 2 | **보안 헤더 + CSP** | 3시간 | 🔴 XSS 방어 | next.config.ts 헤더 방식 (nonce 미사용 — 정적 페이지 유지) |
| 3 | **쿠키 동의 배너** | 2시간 | 🔴 GDPR 필수 | PostHog 활성화 전 반드시 구현 |
| 4 | PostHog 추적 코드 (핵심 이벤트만) | 3시간 | 🔴 데이터 수집 | 코드 준비 완료. PostHog 키 발급 후 활성화 필요 |
| 5 | robots.txt + sitemap.ts | 30분 | 🟠 검색 크롤링 | |
| 6 | JSON-LD 구조화 데이터 | 1시간 | 🟠 리치 스니펫 | FAQPage + SoftwareApplication |
| 7 | llms.txt | 15분 | 🟠 AI 검색 | |
| 8 | og-image.png 생성 | 30분 | 🟠 SNS 공유 | Sharp로 프로그래밍 생성 |
| 9 | metadataBase + canonical URL | 15분 | 🟠 SEO 기본 | |

### Phase 2: 론칭 주간 (3~5일)

| # | 작업 | 예상 시간 | 영향도 |
|---|------|-----------|--------|
| 10 | 실사 Before/After 이미지 4세트 | 3시간 | 전환율 핵심 |
| 11 | 법적 문서 보강 (GDPR/PIPA/약관/AI 저작권) | 3시간 | 법적 리스크 |
| 12 | 결제 제공자 투명성 표시 | 15분 | 신뢰도 |
| 13 | 커스텀 도메인 연결 + llms.txt/sitemap URL 업데이트 | 1시간 | 신뢰도 핵심 |
| 14 | 404/500 에러 페이지 | 1시간 | 이탈 방지 |
| 15 | 추적 이벤트 확장 (망설임/스크롤/FAQ) | 2시간 | 병목 분석 |
| 16 | SSRF 방어 + 이메일 검증 (MVP) | 1시간 | 보안 |
| 17a | **Resend 도메인 인증** (DNS 레코드 추가) | 30분 | 🔴 결제 후 이메일 미수신 = 매출 손실 |
| 17b | **CSRF 보호** (Origin 헤더 검증) | 1시간 | 🟠 POST /api/upload, /api/generate 보호 |
| 17c | **API CORS 제한** (/api/ 경로 Access-Control-Allow-Origin 제한) | 30분 | 🟠 현재 * 허용 |

### Phase 3: 론칭 후 1~2주

| # | 작업 | 영향도 |
|---|------|--------|
| 17 | PostHog 데이터 기반 첫 병목 분석 | 전환율 개선 방향 확정 |
| 18 | Product Hunt 론칭 (태그라인, 스크린샷 4장 준비) | 초기 트래픽 |
| 19 | Reddit 게시 (r/AmazonSeller, r/Etsy, r/ecommerce) | 유입 + AI 데이터 |
| 20 | 비교 블로그 작성 ("BgSwap vs remove.bg vs PhotoRoom") | 검색 유입 |
| 21 | Social Proof 수집 시작 | 전환율 |
| 22 | Sentry 에러 트래킹 추가 | 안정성 |
| 23 | 접근성 감사 (Lighthouse/axe) | WCAG AA |
| 24 | 블로그 인프라 (MDX + /blog/[slug]) | 콘텐츠 SEO |
| 25 | Rate Limit Upstash Redis 전환 (일일 무료 500건 초과 시) | 보안 강화 |

---

## 9. 성공 지표 (KPI)

> **검증 지적 #27, #28, #29**: 근거 없는 목표치, 매출 지표 누락, 측정 주기 미정.

### 전환율 (론칭 후 데이터로 베이스라인 설정)

| 지표 | 베이스라인 | 1차 목표 | 비고 |
|------|-----------|----------|------|
| 랜딩 → 업로드 | 론칭 2주 후 측정 | 베이스라인 +5%p | SaaS 랜딩 평균 CTR 3~7% 참고 |
| 업로드 → 프리뷰 완료 | 론칭 2주 후 측정 | 80%+ | 기술 장애 아니면 높아야 함 |
| 프리뷰 → 결제 | 론칭 2주 후 측정 | 베이스라인 +2%p | freemium 전환 평균 2~5% 참고 |
| Starter vs Pro 비율 | 론칭 후 측정 | - | 비율 자체가 인사이트 |
| 모바일 vs 데스크톱 | 론칭 후 측정 | 격차 줄이기 | |

### 비즈니스 지표

| 지표 | Month 1 목표 | Month 3 목표 |
|------|-------------|-------------|
| 월 매출 (Monthly Revenue) | $50+ (운영비 커버) | $500+ |
| 유료 고객 수 | 5~10명 | 30~50명 |
| 유료 광고비 | $0 (오가닉만) | < $200/월 |
| 평균 객단가 | 측정 | Starter:Pro 비율로 최적화 |

> "MRR" 미사용: BgSwap은 구독이 아닌 일회성 결제 모델. Monthly Revenue가 정확한 용어.
> "CAC $0" 미사용: Reddit/Product Hunt에 쓰는 시간도 비용. "유료 광고비 $0"으로 표현.

### 검색 지표

| 지표 | Month 1 | Month 3 |
|------|---------|---------|
| Google Search Console 노출 | 측정 시작 | 주간 1,000+ |
| 오가닉 클릭 | 측정 시작 | 주간 50+ |

### 측정 주기
- **일간**: 유입, 업로드 수, 에러율 (PostHog 알림)
- **주간**: 퍼널 전환율, 매출, 이탈 구간 (일요일 리뷰)
- **월간**: KPI 전체 리뷰, 목표 재설정

---

## 10. 도메인 전환 체크리스트

커스텀 도메인 연결 시 동시에 변경해야 할 항목:

- [x] Vercel 도메인 설정
- [x] `NEXT_PUBLIC_BASE_URL` 환경변수
- [x] `llms.txt` 내 모든 URL
- [x] `sitemap.ts` baseUrl
- [x] `layout.tsx` metadataBase
- [x] Polar.sh 웹훅 URL
- [x] Polar.sh 체크아웃 Success URL — bgswap.io로 변경 완료
- [x] Resend 발신 도메인
- [x] Privacy Policy / Terms 내 도메인 표기
- [x] PostHog 프로젝트 설정 — 허용 도메인(Authorized URLs) 업데이트
- [x] CSP connect-src / frame-src 검토
- [x] Google Search Console 등록 + sitemap.xml 제출 완료
- [x] HSTS 헤더 — Vercel 자동 적용
