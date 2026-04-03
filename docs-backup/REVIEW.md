# Phase D 버그픽스 검수 항목 (2026-04-02)

## 변경 파일 3개

### 1. `src/app/api/status/[id]/route.ts`
- **문제**: status API가 `generate-one`을 내부 fetch할 때 Origin/Referer 없이 호출 → 미들웨어 CSRF 체크에서 차단
- **수정**:
  - fetch headers에 `Origin: baseUrl`, `Referer: baseUrl` 추가 (155~165줄)
  - `baseUrl` 미설정 시 early return + 에러 로그 (154줄)
  - fire-and-forget fetch에서 HTTP 4xx/5xx 로깅 추가 (409 제외)
  - 외부 retry 한도 2→3으로 상향 (96줄, `retry_count < 3`)

### 2. `src/lib/replicate.ts` — `removeBackground()` (12~49줄)
- **문제**: Replicate API 간헐적 실패 시 즉시 failed 처리
- **수정**: 내부 재시도 최대 3회 시도 (1초→2초 점진적 백오프), clearTimeout 정리

### 3. `src/app/api/generate-one/route.ts` (102~112줄)
- **문제**: Replicate 반환 URL fetch 실패 시 재시도 없음
- **수정**: 최대 3회 시도 + 점진적 백오프

---

## E2E 테스트 결과

| 항목 | 수정 전 | 수정 후 |
|------|---------|---------|
| Step 5 처리 시작 | 안됨 (6분간 변화 없음) | 정상 시작 |
| 최종 성공률 | 0/6 (처리 불가) | 6/6 (90/90장) |
| failed 수 | N/A | 0 |
| 소요 시간 | N/A | ~116초 (19.4초/장) |

**테스트 명령**: `npx tsx scripts/load-test/e2e-test.ts`

---

## 검수 체크리스트

- [ ] 결제 후 자동 처리 시작 확인 (status API 폴링 → generate-one 트리거)
- [ ] 6장 업로드 → 90장(6x15) 전부 생성 확인
- [ ] failed=0 확인
- [ ] Replicate 재시도 로그 정상 출력 확인
- [ ] Vercel 배포 후 프로덕션에서도 동일 동작 확인
- [ ] NEXT_PUBLIC_BASE_URL 환경변수가 Vercel에 프로덕션 URL로 설정되어 있는지 확인

## 아키텍처 메모 (향후 리팩터링)

status GET API가 읽기 외에 쓰기(stuck recovery, retry reset, order status 변경, generate-one 트리거)를 수행함.
현재 규모에선 동작하지만 폴링 빈도가 높아지면 race condition 가능성 있음. 스케일 업 시 별도 큐/워커로 분리 필요.
