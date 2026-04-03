# BgSwap — Reddit 게시 전략

> 업데이트: 2026-04-02 | PH 론칭 후 1주에 시작

---

## 게시 순서 (각 2일 간격)

1. r/ecommerce (가장 "I built this" 친화적)
2. r/AmazonSeller (2일 후)
3. r/Etsy (2일 후)

**타이밍:** 화~목, 오전 9~11시 EDT (= KST 22:00~00:00)

---

## Post 1: r/ecommerce

**제목:**
```
I built a product photo background tool for sellers — 15 backgrounds in 10 seconds. Looking for feedback.
```

**본문:**
```
Hey r/ecommerce,

I kept noticing the same pain point here: sellers spending way too much time (or money) on product photo backgrounds.

So I built BgSwap — upload a product photo, AI removes the background, and it generates 15 clean backgrounds automatically:

- 5 Solid: White (#FFFFFF), Light Gray, Warm, Cool, Dark
- 5 Gradient: Sunset, Ocean, Mint, Lavender, Peach
- 5 Texture: Marble, Wood, Linen, Concrete, Paper
- + Custom: pick any brand color

The whole process takes about 10 seconds per photo. For bulk orders, you can upload up to 100 products — it processes them in parallel, about 16 minutes for the full batch.

**How it works:**
1. Upload any product photo (phone camera, supplier image, whatever)
2. AI removes the background
3. Product is placed on all 15 backgrounds with realistic drop shadows
4. Download as ZIP

**Pricing:** One-time payment, no subscription. $4.99 for 10 products (150 images), $29 for 100 (1,500 images). Free preview (1 photo, watermarked) so you can check quality first.

**What it's NOT:** A full photo editor. It does one thing — background replacement for product photos — and tries to do it well.

**Honest limitations:**
- AI works best with clear product shots (avoid hand-held if possible)
- It's a solo project, so rough edges exist

Would you use this? What's missing?

Link: https://bgswap.io?utm_source=reddit&utm_medium=post&utm_campaign=launch_ecommerce
```

---

## Post 2: r/AmazonSeller

**제목:**
```
Amazon product photo white background tips — what actually passes review + a tool I built
```

**본문:**
```
If you've ever had a listing suppressed because your white background wasn't "white enough," this post is for you.

**Amazon main image requirements (quick reference):**
- Main image MUST be pure white (#FFFFFF) background
- No borders, watermarks, or logos
- Product should fill most of the frame (check your category's style guide)
- No lifestyle/props on the main image

I used to spend 15-20 minutes per product in Photoshop getting the white right. Multiply that by 50+ SKUs and it's a full day gone.

**What I ended up building:**

A tool (BgSwap) that does background removal + replacement automatically. Upload a photo → AI removes background → outputs 15 backgrounds including Amazon-compliant pure white.

The 15 backgrounds include white, light gray, warm cream, cool gray, dark — plus gradients and textures for secondary images and other marketplaces.

Takes about 10 seconds per product. Batch upload up to 100 at once.

**What I learned building this:**
- Amazon checks that background pixels are at or very close to #FFFFFF. Automated tools are more consistent than manual editing.
- Drop shadows make a huge difference — products floating on white look fake.
- Having 15 options means you're covered for Amazon main + secondary + any other marketplace.

**Pricing:** $4.99 for 10 products (150 images), $29 for 100 (1,500 images). No subscription. Free preview.

Try it: https://bgswap.io?utm_source=reddit&utm_medium=post&utm_campaign=launch_amazon

Has anyone else dealt with background-related listing suppressions?
```

---

## Post 3: r/Etsy

**제목:**
```
Tips for better product photo backgrounds — plus a free tool
```

**본문:**
```
Hey everyone 👋

Product photography has been my biggest time sink. Etsy is more forgiving than Amazon on backgrounds, but clean photos still make a difference in click-through rates.

**Photo tips I've picked up:**
- **Light gray > pure white for Etsy.** Pure white feels "Amazon-ish." Light gray or warm tones match Etsy's handmade vibe.
- **Consistency matters more than perfection.** All listings with the same background style looks more professional.
- **Phone photos work fine.** Good lighting + clean background = good enough.
- **Texture backgrounds work great for handmade items.** Marble for jewelry, wood for crafts, linen for textiles.

**A tool I made:**

I built BgSwap — background removal + replacement. Upload a photo → AI removes background → generates 15 backgrounds (solids, gradients, textures) with drop shadows.

The texture backgrounds (marble, wood, linen) work especially well for handmade/artisan items.

Free to try (1 photo, watermarked): https://bgswap.io?utm_source=reddit&utm_medium=post&utm_campaign=launch_etsy

What backgrounds work best for your shop category?
```

---

## 댓글 대응

| 질문 | 답변 |
|------|------|
| "remove.bg와 뭐가 다름?" | remove.bg는 배경 제거만. BgSwap은 제거+15배경 교체+그림자 한번에. 원타임 결제. |
| "가격이 비쌈" | Pro 기준 $0.02/image. 스튜디오 $10-50/장, remove.bg 크레딧 방식. Free preview로 확인 가능. |
| "기능 X 추가해" | 리스트에 추가. 사용 케이스 알려달라. |
| "광고/스팸" | 인정 + 글 자체 팁은 도구 무관하게 유용. 톤 조절하겠다. |
