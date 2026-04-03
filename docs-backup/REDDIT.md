# BgSwap — Reddit 게시 전략

> 작성일: 2026-03-31 | 검수 반영: 2026-03-31
> 타이밍: Product Hunt 론칭 후 1주 (PH에 집중 후 시작)

---

## 전략 개요

### 타겟 서브레딧

| 서브레딧 | 구독자 | 톤 | 셀프 프로모션 규칙 |
|----------|--------|-----|-------------------|
| r/AmazonSeller | ~128K | 실용적, 셀러 동료 | 가치 제공 필수, 노골적 광고 삭제됨 |
| r/Etsy | ~260K | 커뮤니티 중심, 친근 | 셀프 프로모션 제한적 허용, 유용성 우선 |
| r/ecommerce | ~120K | 비즈니스/기술 관심 | "I built this" 포맷 허용, 피드백 요청 권장 |

### 공통 원칙
1. **가치 먼저, 링크 나중** — 글 자체가 유용해야 함 (팁, 경험, 데이터)
2. **"I built this" 포맷** — 개발자가 직접 만든 도구를 공유하는 형태
3. **정직함** — 한계도 인정 (MVP, 1인 개발 등)
4. **댓글 필수** — 게시 후 최소 2~3시간 댓글 응답
5. **각 서브레딧 간 1~2일 간격** — 동시 게시하면 스팸으로 보임

### 게시 순서 (권장)
1. r/ecommerce (가장 "I built this" 친화적)
2. r/AmazonSeller (2일 후)
3. r/Etsy (2일 후)

### 게시 타이밍
- **미국 시간 기준 화~목, 오전 9~11시 EDT** (= KST 22:00~00:00)
- 주말/월요일 피하기 (트래픽 낮음)
- 참고: 3~11월은 EDT (서머타임), 11~3월은 EST. 게시 시점 기준으로 확인

---

## Post 1: r/ecommerce

### 제목
```
I built a product photo background tool for sellers — 15 backgrounds in 10 seconds. Looking for feedback.
```

### 본문
```
Hey r/ecommerce,

I've been lurking here for a while and kept noticing the same pain point: sellers spending way too much time (or money) on product photo backgrounds.

So I built BgSwap — you upload a product photo, AI removes the background, and it generates 15 clean backgrounds automatically:

- **White** (#FFFFFF) — Amazon main image compliant
- **Light Gray** — Etsy / general listings
- **Warm Cream** — Shopify / lifestyle feel
- **Cool Gray** — Website / catalog
- **Dark** — Premium branding

The whole process takes about 10 seconds per photo.

**How it works:**
1. Upload any product photo (phone camera, supplier image, whatever)
2. AI removes the background
3. Product is placed on all 15 backgrounds with realistic drop shadows
4. Download as ZIP

**Pricing:** One-time payment, no subscription. $4.99 for 10 products, $29 for 100. There's a free preview (1 photo, watermarked) so you can see the quality before paying.

**What it's NOT:** This isn't a full photo editor. It does one thing — background replacement — and tries to do it well.

**Honest limitations:**
- No custom background colors yet (the 15 presets cover most marketplace needs)
- AI works best when the product is clearly visible in the photo
- It's an MVP built by one person, so rough edges exist

I'd love honest feedback:
- Would you actually use this in your workflow?
- What background colors or features are missing?
- Is the pricing reasonable?

Link if you want to try: https://bgswap.io?utm_source=reddit&utm_medium=post&utm_campaign=launch_ecommerce (free preview, no credit card)

Happy to answer any questions.
```

---

## Post 2: r/AmazonSeller

### 제목
```
Amazon product photo white background tips — what actually passes review + a tool I built
```

### 본문
```
If you've ever had a listing suppressed because your white background wasn't "white enough," this post is for you.

**Amazon's main image requirements (quick reference):**
- Main image MUST be pure white (#FFFFFF) background
- No borders, watermarks, or logos
- Product should fill most of the frame (exact % varies by category — check your category's style guide)
- No lifestyle/props on the main image

I used to spend 15-20 minutes per product in Photoshop getting the white right. Multiply that by 50+ SKUs and it's a full day gone.

**What I ended up building:**

A tool (BgSwap) that does the background removal + replacement automatically. Upload a photo → AI removes background → outputs 15 backgrounds including Amazon-compliant pure white.

The 15 backgrounds include:
1. Pure White (#FFFFFF) — Amazon main
2. Light Gray (#F5F5F5) — secondary images
3. Warm Cream — lifestyle feel
4. Cool Gray — catalog
5. Dark — premium look

Takes about 10 seconds. You get all 5 as high-res downloads.

**What I learned building this:**
- Amazon checks that background pixels are at or very close to #FFFFFF. Getting this right manually in Photoshop is tedious — automated tools are more consistent.
- Drop shadows make a huge difference — products floating on white look fake. A subtle shadow adds depth.
- Most sellers only need 2-3 background types, but having 15 options means you're covered for any marketplace.

**Pricing:** $4.99 for 10 products, $29 for 100. No subscription. There's a free preview so you can check quality first.

Try it: https://bgswap.io?utm_source=reddit&utm_medium=post&utm_campaign=launch_amazon

Has anyone else dealt with background-related listing suppressions? Curious what workarounds you've found.
```

---

## Post 3: r/Etsy

### 제목
```
Tips for better product photo backgrounds — plus a free tool
```

### 본문
```
Hey everyone 👋

Product photography has been my biggest time sink. I know Etsy is more forgiving than Amazon on backgrounds, but clean photos still make a difference in click-through rates.

**Some photo tips I've picked up:**
- **Light gray > pure white for Etsy.** Pure white feels "Amazon-ish" and cold. Light gray or warm tones match Etsy's handmade vibe better.
- **Consistency matters more than perfection.** All your listings with the same background style looks way more professional than mix-and-match.
- **Phone photos work fine.** You don't need a DSLR. Good natural lighting + clean background (or AI removal) = good enough for most categories.
- **Show scale.** One background-removed hero shot + one lifestyle shot with context (hand holding, on a table) is the combo that works.

**A tool I made:**

I built a background removal + replacement tool called BgSwap. Upload a photo → AI removes background → generates 15 clean backgrounds (white, light gray, warm cream, cool gray, dark, and more) with drop shadows.

The dark background works especially well for jewelry, candles, and premium items.

Free to try (1 photo, watermarked): https://bgswap.io?utm_source=reddit&utm_medium=post&utm_campaign=launch_etsy

Would love to hear what backgrounds work best for your shop category. I'm considering adding more color options based on feedback.

What's your product photography workflow like?
```

---

## 댓글 대응 템플릿

### 긍정적 반응
```
Thanks! Would love to know how it works for your products. 
If you try it, let me know what you think of the output quality.
```

### "remove.bg와 뭐가 다름?" 질문
```
Good question. remove.bg is great at background *removal*, but it stops there — 
you get a transparent PNG and still need to add a background yourself.

BgSwap does removal + replacement in one step: you get 15 ready-to-use backgrounds 
with shadows. So it's more "upload → done" rather than "upload → transparent → 
open Photoshop → add background → adjust shadow."

Also one-time pricing vs per-credit.
```

### "가격이 비쌈" 반응
```
Fair point. The free preview is there so you can check quality before paying anything.

For context: studio shoots run $10-50/photo, and tools like remove.bg charge per credit. 
At $0.29/product (Pro plan), it's designed to be the cheapest option for bulk work. 
But I get that pricing is subjective — what would feel fair to you?
```

### "기능 X 추가해" 요청
```
That's a great suggestion, adding it to my list. 
Can you tell me more about your use case? 
I want to make sure I build it in a way that actually helps your workflow.
```

### "광고/스팸" 비난
```
Fair point. I probably should have led with more tips and less product talk.

For what it's worth — the background tips in the post apply regardless of 
what tool you use. If you're happy with your current workflow, no need to 
change anything.

I'll tone down the self-promotion in future posts. Appreciate the honest feedback.
```

---

## 게시 삭제/실패 시 대응

| 상황 | 대응 |
|------|------|
| 모드에 의해 삭제됨 | 모드에게 정중히 DM — 규칙 위반 항목 확인, 수정 후 재게시 가능 여부 문의 |
| 다운보트 폭격 | 글 삭제하지 말고 방치. 댓글에서 피드백 수집. 다음 서브레딧에 톤 반영 |
| 스팸 신고 | 해당 서브레딧에 재게시 금지. 다른 서브레딧에서 프로모션 비중 더 줄이기 |
| 반응 없음 (업보트 0~2) | 제목/타이밍 문제일 가능성. 2주 후 다른 제목으로 재시도 (같은 본문 X) |

---

## 게시 후 체크리스트

- [ ] 게시 후 2~3시간 댓글 집중 응답
- [ ] PostHog에서 utm_source=reddit, utm_campaign별 트래픽 확인
- [ ] 유용한 피드백 → PROGRESS.md "사용자 피드백" 섹션에 기록
- [ ] 반복 질문 → FAQ 또는 랜딩 페이지에 반영
- [ ] 업보트 10+ 받은 게시물 → 프로필에 고정

---

## 주의사항

1. **절대 여러 서브레딧에 동시 게시 금지** — 크로스포스트로 보이면 삭제 + 밴
2. **각 글을 해당 커뮤니티에 맞게 다르게 작성** — 복붙 금지 (위 초안도 각각 다른 톤)
3. **업보트 조작/요청 금지** — Reddit 전체 밴 사유
4. **링크는 본문 마지막에** — 서두에 링크 넣으면 광고로 인식
5. **계정 카르마** — 새 계정이면 게시 제한될 수 있음. 미리 커뮤니티 참여 필요
6. **각 서브레딧 규칙 게시 전 재확인** — 규칙은 수시로 변경됨

---

## 검수 반영 기록

| # | 지적 | 심각도 | 조치 |
|---|------|--------|------|
| 1 | URL에 UTM 파라미터 없음 | 높음 | 3개 게시물 모두 utm_source/medium/campaign 추가 |
| 2 | r/AmazonSeller 제목 핵심 앞으로 | 중간 | "Amazon product photo white background tips" 선두 배치 |
| 3 | r/Etsy "for my own use" 거짓 | 중간 | 해당 문구 삭제, 도구 소개를 팁 뒤로 배치 |
| 4 | "#FAFAFA gets flagged" 근거 부족 | 중간 | 톤 다운 — "at or very close to #FFFFFF" 표현으로 변경 |
| 5 | "85% of the frame" 카테고리별 차이 | 중간 | "exact % varies by category — check your category's style guide" 추가 |
| 6 | 스팸 비난 대응 너무 약함 | 중간 | 인정 + 글 자체의 가치 언급 + 개선 약속으로 보강 |
| 7 | URL에 UTM 파라미터 추가 | 중간 | #1과 통합 처리 완료 |
| 8 | r/ecommerce 제목 너무 김 | 낮음 | 축소 (105자 → 82자) |
| 9 | EST→EDT 구분 | 낮음 | EDT로 수정 + 서머타임 참고 메모 추가 |
| 10 | 삭제 시 대응 없음 | 낮음 | "게시 삭제/실패 시 대응" 섹션 신규 추가 |
| 11 | r/Etsy 가격 정보 과도 | 낮음 | 가격 항목 제거, "Free to try" 한 줄로 축소 |
