# BgSwap 디자인 시스템

> 최종 업데이트: 2026-03-31 (v2 리디자인 반영)

## 디자인 컨셉
- **클린 미니멀** — 흰 배경 + 블루 포인트, 과도한 장식 없음
- **상품 중심** — 이미지와 결과물이 주인공
- **신뢰 기반** — 무료 미리보기, 가격 투명성, 환불 보장
- **모바일 퍼스트** — 기본 1컬럼, md/lg에서 확장
- **단일 CTA 원칙** — 뷰포트당 하나의 명확한 행동 유도

---

## 컬러 시스템

### 브랜드 컬러
| 용도 | 클래스 | HEX |
|------|--------|-----|
| Primary CTA | `blue-600` | #155dfc |
| Primary Hover | `blue-700` | #1447e6 |
| Primary Light (배지 배경) | `blue-50` | #eff6ff |
| Primary Light Text | `blue-700` | #1447e6 |
| Success | `green-600` | #00a544 |
| Success Text | `green-500` | (체크마크) |
| Error | `red-500` | #fb2c36 |
| Warning BG | `yellow-50` | #fefce8 |

### 뉴트럴
| 용도 | 클래스 | HEX |
|------|--------|-----|
| 배경 | `white` | #ffffff |
| 섹션 배경 | `gray-50` | #f9fafb |
| 카드 보더 | `gray-100` ~ `gray-200` | #f3f4f6 ~ #e5e7eb |
| 보조 텍스트 | `gray-400` ~ `gray-500` | #9ca3af ~ #6a7282 |
| 본문 텍스트 | `gray-700` ~ `gray-900` | #364153 ~ #101828 |

### 배경 합성 옵션 (5종)
| 이름 | HEX | 용도 |
|------|-----|------|
| White | #ffffff | Amazon 메인 이미지 |
| Light Gray | #f5f5f5 | Etsy |
| Warm Cream | #faf5ee | Shopify |
| Cool Gray | #ebeff2 | 웹사이트 |
| Dark | #1e1e23 | 프리미엄 브랜드 |

---

## 타이포그래피

### 폰트
- **패밀리:** Google Inter (`next/font/google`)
- **폴백:** system-ui, -apple-system, sans-serif
- **렌더링:** `antialiased`

### 크기 체계
| 용도 | 클래스 | 비고 |
|------|--------|------|
| 히어로 타이틀 | `text-4xl md:text-5xl font-bold tracking-tight` | 반응형 |
| 섹션 타이틀 | `text-3xl font-bold` | 각 섹션 h2 |
| 카드 타이틀 | `text-2xl font-bold` | 가격, 완료 메시지 |
| 본문 강조 | `text-xl font-semibold` | 상태 메시지 |
| 본문 | `text-lg` ~ 기본 | 설명 텍스트 |
| 보조 | `text-sm text-gray-500` | 날짜, 부가 정보 |
| 라벨/배지 | `text-xs font-bold` | 태그, 뱃지 |
| 마이크로 | `text-[10px]` | 배경별 태그 라벨 |

---

## 레이아웃

### 스티키 헤더
```
sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100
내부: max-w-5xl mx-auto px-4 py-3 flex justify-between
왼쪽: BgSwap 로고 (text-lg font-bold)
오른쪽: "Try Free" CTA (bg-blue-600 text-sm)
```

### 컨테이너
| 클래스 | 사용처 |
|--------|--------|
| `max-w-5xl` | 헤더/푸터 |
| `max-w-4xl mx-auto px-4` | 랜딩 (넓은 콘텐츠) |
| `max-w-3xl mx-auto px-4` | 정책 페이지 (prose), 가격표 |
| `max-w-2xl mx-auto px-4` | 업로드, 결과, 다운로드 (폼 중심) |

### 그리드
| 패턴 | 사용처 |
|------|--------|
| `grid-cols-1 md:grid-cols-2` | 가격표, Before/After |
| `grid-cols-1 md:grid-cols-3` | How it works, 3단계 카드 |
| `grid-cols-2 md:grid-cols-4` | 마켓플레이스 컴플라이언스 |
| `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` | 다운로드 갤러리 |
| `grid-cols-5` | 업로드 파일 미리보기 |

### 섹션 간격
| 위치 | 패턴 |
|------|------|
| 히어로 | `pt-20 pb-16` |
| 일반 섹션 | `py-16` |
| 섹션 내 제목→콘텐츠 | `mb-10` ~ `mb-12` |
| 폼 입력 간 | `mb-4` ~ `mb-6` |

---

## 컴포넌트 패턴

### 버튼
```
Primary CTA:     bg-blue-600 text-white font-semibold py-3.5 px-8 rounded-lg hover:bg-blue-700 transition
Primary + Pulse: + cta-pulse (box-shadow 애니메이션)
Secondary:       border-2 border-blue-600 text-blue-600 font-semibold py-3 rounded-lg hover:bg-blue-50
Success:         bg-green-600 text-white font-semibold py-4 rounded-lg hover:bg-green-700
Disabled:        disabled:opacity-50 disabled:cursor-not-allowed
Header CTA:      bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg
```

### 인풋
```
Text:      w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
Checkbox:  w-4 h-4 accent-blue-600
```

### 업로드 영역
```
기본:      border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-blue-400 hover:bg-gray-50
드래그 중:  border-blue-500 bg-blue-50
파일 있음:  border-green-300 bg-green-50
추가 슬롯: border-2 border-dashed border-gray-300 rounded-lg + "+" 텍스트
```

### 카드
```
기본:        bg-white rounded-xl p-6 border border-gray-200
강조:        border-2 border-blue-600 shadow-lg shadow-blue-100
How-it-works: bg-white rounded-xl p-6 shadow-sm
컴플라이언스: bg-gray-50 rounded-xl p-4
배지:        absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full
상단 뱃지:   inline-block bg-blue-50 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full
```

### 알림/피드백
```
Error:     bg-red-50 text-red-600 px-4 py-3 rounded-lg + ⚠ 아이콘
Warning:   bg-yellow-50 text-yellow-700 px-4 py-3 rounded-lg
Success:   text-green-600 text-xl font-bold + 🎉 이모지
Info Box:  bg-gray-50 rounded-xl p-5 (업그레이드 체크리스트)
```

### 신뢰 시그널
```
하단 배치: flex items-center justify-center gap-4 text-xs text-gray-400
내용: 🔒 Secure / ↩ 7-day refund / 📧 Instant download / 🗑 Auto-deleted / 💳 No payment needed
```

### 프로그레스
```
도트:  h-2 rounded-full, 활성 bg-blue-600 w-8, 비활성 bg-gray-200 w-2
바:    w-full bg-gray-200 rounded-full h-3 + 내부 bg-blue-600 transition-all
스와치: w-10 h-10 rounded-lg, 완료 opacity-100 scale-100, 미완 opacity-30 scale-90
```

### 이미지
```
프리뷰 카드:  bg-white rounded-2xl p-6 shadow-lg border border-gray-100
갤러리:       aspect-square object-cover rounded-lg border border-gray-200
오버레이:     bg-black/50 opacity-0 group-hover:opacity-100 transition
삭제 버튼:    absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full
             모바일: opacity-100, 데스크톱: md:opacity-0 md:group-hover:opacity-100
```

---

## 반응형 브레이크포인트

Tailwind 기본값 사용:

| 브레이크포인트 | 크기 | 주요 변화 |
|---------------|------|----------|
| 기본 (모바일) | < 768px | 1컬럼, 삭제 버튼 항상 표시, 카메라 촬영 문구 |
| `md:` | 768px+ | 2~3컬럼 그리드, 드래그앤드롭 문구, hover 상호작용 |
| `lg:` | 1024px+ | 4컬럼 갤러리 |
| `sm:` | 640px+ | 신뢰 시그널 flex-row 전환 |

---

## 커스텀 애니메이션 (globals.css)

| 이름 | 클래스 | 사용처 | 설명 |
|------|--------|--------|------|
| float | `.float-animation` | Before/After 상품 | 3s ease-in-out 위아래 8px |
| ctaPulse | `.cta-pulse` | 주요 CTA 버튼 | 2s blue 그림자 펄스 |
| progressFill | `.progress-fill` | (예비) | 8s 너비 0→100% |

기본 Tailwind 애니메이션:
| 클래스 | 사용처 |
|--------|--------|
| `transition` | 모든 호버/포커스 상태 전환 |
| `animate-spin` | 업로드 로딩 스피너 |
| `animate-pulse` | (예비, v2에서 대부분 프로그레스 도트로 교체) |
| `transition-transform` | FAQ +/× 회전 |
| `transition-all` | 프로그레스 바, 배경 스와치 |

---

## 페이지별 디자인 상세

### `/` 랜딩 (v2)
1. **히어로**: "Built for" 상단 뱃지 → 큰 타이틀 (blue-600 강조) → 설명 → CTA (pulse) → 보조 텍스트
2. **Before/After**: 2컬럼 그리드, CSS 시뮬레이션 (론칭 후 실제 사진 교체 예정)
3. **15 Backgrounds**: 15색 스와치 + 이름 + 마켓플레이스 태그
4. **How it Works**: 3단계 카드 (이모지 + 번호 + 제목 + 설명)
5. **Marketplace Compliance**: 4플랫폼 (Amazon/eBay/Etsy/Shopify) + "✓ Compliant"
6. **Comparison Table**: 3열 비교 (Studio/DIY/BgSwap), BgSwap 컬럼 blue-600 + font-semibold
7. **Pricing**: 2카드 (Starter outline / Pro filled+shadow), "Save 42%" 배지
8. **FAQ**: `<details>` 아코디언, +/× 토글 (group-open:rotate-45)
9. **Bottom CTA**: blue-600 배경 반전 섹션

### `/upload` (v2)
1. 드래그앤드롭 (상태별 색상: 기본 gray / 드래그 blue / 완료 green)
2. 모바일: "Tap to take a photo or choose from gallery" / 데스크톱: "Drag & drop"
3. 파일 그리드 (5컬럼) + "+" 추가 슬롯 + 삭제 버튼 (모바일 항상 표시)
4. 이메일 + 동의 → CTA (로딩 시 스피너) → 신뢰 시그널

### `/result/[id]` (v2)
1. **로딩**: 4단계 애니메이션 (이모지 + 텍스트 + 프로그레스 도트)
2. **프리뷰**: 카드 스타일 이미지 + 해상도/워터마크 안내
3. **결제 유도**: "Upgrade to get" 체크리스트 (4항목) + 15배경 스와치 + CTA (pulse)
4. **결제 후**: 프로그레스 바 (0/5→5/5) + 배경별 스와치 밝기 변화
5. **완료**: 🎉 + 녹색 다운로드 CTA + 이메일 안내

### `/download/[token]`
- 타이틀 + "Download All (ZIP)" → 반응형 그리드 (2→3→4) → 호버 오버레이 → 만료일

### 정책 페이지 (`/privacy`, `/terms`, `/refund`)
- `prose prose-gray`, max-w-3xl, 제목 + 날짜 + 본문

### Layout
- **헤더**: sticky, blur 배경, 로고 + CTA
- **푸터**: 3열 (브랜드 / 링크 / 카피라이트)

---

## 에셋

| 파일 | 용도 | 상태 |
|------|------|------|
| `/public/og-image.png` | OG/소셜 이미지 (1200x630) | 사용 중 |
| `/public/file.svg` | Next.js 보일러플레이트 | 삭제 가능 |
| `/public/globe.svg` | Next.js 보일러플레이트 | 삭제 가능 |
| `/public/next.svg` | Next.js 보일러플레이트 | 삭제 가능 |
| `/public/vercel.svg` | Next.js 보일러플레이트 | 삭제 가능 |
| `/public/window.svg` | Next.js 보일러플레이트 | 삭제 가능 |

---

## 디자인 개선 예정 (론칭 후)
- Before/After에 실제 상품 사진 적용 (현재 CSS 시뮬레이션)
- 아이콘 라이브러리 도입 (현재 이모지 + 텍스트 심볼)
- 재사용 컴포넌트 추출 (Button, Card, Alert 등)
- 다크 모드 (현재 라이트 전용)
- 로고/브랜드 마크 (현재 텍스트 로고)
- 스켈레톤 UI (현재 프로그레스 도트로 대체)
