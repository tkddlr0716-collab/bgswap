# BgSwap — Product Hunt 론칭 자료

> 업데이트: 2026-04-02

---

## 1. 태그라인 (60자 이내)

> 15 AI backgrounds per product photo. No subscription. (52자)

## 2. 한 줄 설명 (140자 이내)

> AI removes product photo backgrounds and generates 15 pro backgrounds — solids, gradients, textures — with shadows. Try free, no credit card. (143자)

## 3. 소개 설명

### The Problem

E-commerce sellers spend hours editing product photos or pay $10–50 per image for studio shoots. Marketplaces like Amazon require pure white backgrounds — rejected photos mean suppressed listings and lost sales.

### The Solution

BgSwap handles it in 10 seconds:

1. **Upload** any product photo (phone camera, supplier image, anything)
2. **AI removes the background** and places your product on 15 professional backgrounds with realistic drop shadows
3. **Download** high-res images as a ZIP, ready to list

### 15 Backgrounds, Every Photo

- **5 Solid** — White, Light Gray, Warm, Cool, Dark
- **5 Gradient** — Sunset, Ocean, Mint, Lavender, Peach
- **5 Texture** — Marble, Wood, Linen, Concrete, Paper
- **+ Custom** — Pick any HEX color for your brand

### Batch Processing

Upload up to 100 product photos. AI processes them 3 at a time, ~20 seconds per product. 100 products = ~16 minutes = 1,500 ready-to-list images.

### Pricing (one-time, no subscription)

- **Free:** 1 photo preview (5 backgrounds, 512px, watermarked)
- **Starter:** $4.99 → 10 products × 15 backgrounds = 150 images ($0.03/image)
- **Pro:** $29 → 100 products × 15 backgrounds = 1,500 images ($0.02/image)

---

## 4. Maker Comment

> Hey Product Hunt! 👋
>
> I built BgSwap because I kept seeing Amazon sellers on Reddit complaining about the same thing: spending hours removing backgrounds from product photos, only to get listings suppressed because the white wasn't "white enough."
>
> Existing tools (remove.bg at $0.23/image, PhotoRoom at $7.50+/month) either just remove the background (you still need to add one back) or lock you into monthly subscriptions.
>
> BgSwap gives you 15 marketplace-ready backgrounds per photo — white for Amazon, warm tones for Shopify, dark for premium branding, plus gradients and textures. All with realistic drop shadows. Upload 100 products, get 1,500 images back.
>
> One-time payment, no subscription.
>
> **Try it free** (1 photo, no credit card): https://bgswap.io?utm_source=producthunt&utm_medium=launch&utm_campaign=ph_launch
>
> What features would make this more useful for your workflow?

---

## 5. 필수 에셋

| 에셋 | 파일 | 상태 |
|------|------|------|
| 15배경 그리드 (스크린샷 3) | `scripts/launch-assets/15-backgrounds-grid.jpg` | TODO |
| Before/After | `scripts/launch-assets/before-after.jpg` | TODO |
| 데모 GIF (30초) | 직접 화면 녹화 필요 | TODO |
| 랜딩 스크린샷 | 직접 캡처 (1270×760) | TODO |
| 가격 스크린샷 | 직접 캡처 (1270×760) | TODO |

### 데모 GIF 촬영 가이드
1. bgswap.io 랜딩 (2초)
2. "Try Free" → 업로드 페이지 (3초)
3. 상품 사진 드래그앤드롭 (3초)
4. 이메일 입력 → 업로드 (3초)
5. AI 처리 로딩 (5초)
6. 15가지 배경 결과 (10초 — 핵심)
7. ZIP 다운로드 클릭 (2초)
8. "15 backgrounds. 10 seconds. From $0.02/image" (2초)

---

## 6. 카테고리 & 태그

**카테고리:** Design Tools, E-Commerce, Artificial Intelligence

**Topics:** E-Commerce, Image Editing, Artificial Intelligence, Photography

---

## 7. 론칭 체크리스트

### 론칭 전
- [ ] Product Hunt maker 계정 확인
- [ ] 데모 GIF 제작 (OBS/Loom, 30초)
- [ ] 랜딩 + 가격 스크린샷 캡처 (1270×760)
- [ ] 경쟁사 가격 재확인 (remove.bg, PhotoRoom)
- [ ] 론칭일 결정 (화~목)

### 론칭 당일
- [ ] 00:01 PST (= KST 17:01) 게시
- [ ] Maker Comment 즉시 작성
- [ ] 댓글 전부 답변

### 론칭 후 1주
- [ ] PostHog에서 utm_source=producthunt 트래픽 확인
- [ ] Reddit 게시 시작 (r/ecommerce → r/AmazonSeller → r/Etsy, 각 2일 간격)
