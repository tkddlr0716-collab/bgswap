# BgSwap 현황

**URL**: https://bgswap.io | **배포**: `npx vercel --prod` | **마지막 배포**: 2026-04-02

## 서비스 요약

상품 사진 AI 배경 제거 + 15배경 자동 합성 SaaS. 타겟: Amazon/Etsy/Shopify 셀러.

- 무료 1장 프리뷰 (512px 워터마크) → 결제 → 대량 업로드 → 자동 처리
- 가격: Starter $4.99 (10장) / Pro $29 (100장)
- 1장당 15배경 (단색5 + 그라디언트5 + 텍스처5) + 선택적 커스텀 색상
- 원가 ~$0.002/장 (Replicate bria/remove-background), 마진 99%+

## 기술 스택

Next.js 16 + React 19 + TailwindCSS 4 / Replicate / Turso (SQLite) / Cloudflare R2 / Polar.sh 결제 / Resend 이메일 / PostHog + Sentry / Vercel

## 핵심 플로우

```
사용자 → /upload (1장) → /api/generate (무료 프리뷰 5배경)
       → /result/{id} (프리뷰 확인 + 옵션 설정)
       → Polar 결제 → webhook → order.status='paid'
       → /order/{id}/upload (추가 업로드, plan 한도까지)
       → status API 폴링 → generate-one 트리거 (3장 병렬)
       → 완료 → /download/{token} (ZIP 다운로드)
```

### 처리 아키텍처

- **폴링 기반**: status API GET이 pending 감지 → generate-one POST 트리거 (최대 3병렬)
- **generate-one**: Replicate 배경제거 → Sharp 15배경 합성 → R2 업로드 → DB (단일 ~29초, 3병렬 시 ~20초/장 throughput)
- **자동 복구**: stuck 90초 리셋, failed 자동 재시도 (내부 3회 + 외부 3회)
- **Cron**: 매일 03:00 cleanup + stalled 주문 캐치업 + 재개 이메일

### 결제 (Polar.sh)

- Standard Webhooks 스펙 (webhook-id/timestamp/signature, HMAC-SHA256, v1 base64)
- 시크릿: `whsec_` 접두어 + base64
- 이벤트: `order.paid`, `checkout.completed`
- metadata에서 order_id, plan 추출

## 최근 작업 (2026-04-02)

### 버그 수정

| 문제 | 파일 | 수정 |
|------|------|------|
| status/webhook에서 generate-one 호출 시 CSRF 차단 | status/route.ts, webhook/route.ts | Origin/Referer 헤더 + baseUrl null 가드 + HTTP 에러 로깅 |
| Replicate 간헐 실패 시 즉시 failed | replicate.ts | 내부 재시도 3회 + 점진적 백오프 |
| removed 이미지 fetch 실패 | generate-one/route.ts | fetch 재시도 3회 + 점진적 백오프 |
| 외부 retry 부족 | status/route.ts | retry_count 2→3 |
| Webhook 서명 검증 실패 (프로덕션) | webhook/route.ts | x-polar-signature → Standard Webhooks (webhook-id/timestamp/signature) |
| timingSafeEqual 버퍼 길이 불일치 시 crash | webhook/route.ts | 길이 체크 후 false 반환 |
| ZIP 다운로드 CORS/CSP 차단 | next.config.ts, download/route.ts | CSP connect-src에 R2 추가 + 서버사이드 ZIP 생성 |
| completed 주문에 추가 업로드 불가 | upload/route.ts | status 체크에 completed 추가 |

### UX 개선

| 변경 | 파일 |
|------|------|
| 결제 이메일에 업로드 링크 + 잔여 수량 표시 | email.ts, webhook/route.ts |
| result 페이지에서 paid/completed 모두 잔여 슬롯 CTA | result/page.tsx |

## 남은 과제

- [ ] **Product Hunt / Reddit 론칭** (최우선 — 수익 검증, 기술적으로 준비됨)
- [ ] AI 모델 개선 (gpt-image-1 등 — 론칭 후)
- [ ] Shopify 앱/API 연동
- [ ] ZIP 업로드 (서버 메모리 이슈로 보류)
- [ ] status API 리팩터링 (GET에서 쓰기 분리 → 별도 큐/워커)
- [ ] Rate limiting DB 기반으로 전환 (현재 in-memory, 서버리스 인스턴스 간 비공유)

## 테스트

- 단위: 51/51 통과
- E2E: `npx tsx scripts/load-test/e2e-test.ts` (기본), `e2e-webhook-test.ts` (webhook)
- 부하: 100장 업로드 44초, 처리 29초/장, 100장 3병렬 ~16분

## 환경변수 (Vercel)

TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, R2_*, REPLICATE_API_TOKEN, POLAR_WEBHOOK_SECRET, NEXT_PUBLIC_POLAR_CHECKOUT_*, NEXT_PUBLIC_BASE_URL (https://bgswap.io), RESEND_API_KEY, SENTRY_*, CRON_SECRET, NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST
