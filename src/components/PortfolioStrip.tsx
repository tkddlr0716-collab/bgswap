"use client";

import { useState } from "react";
import Image from "next/image";

const PORTFOLIO = [
  {
    id: "backpack",
    label: "Backpack",
    before: "/samples/before-backpack.jpg",
    after: "/samples/after-backpack-white.jpg",
    bg: "White",
  },
  {
    id: "coffee",
    label: "Coffee Cup",
    before: "/samples/before-coffee.jpg",
    after: "/samples/after-coffee-dark.jpg",
    bg: "Dark",
  },
  {
    id: "paperbag",
    label: "Paper Bags",
    before: "/samples/before-paperbag.jpg",
    after: "/samples/after-paperbag-light-gray.jpg",
    bg: "Light Gray",
  },
  {
    id: "bag",
    label: "Messenger Bag",
    before: "/samples/before-bag.jpg",
    after: "/samples/after-bag-white.jpg",
    bg: "White",
  },
  {
    id: "mug-showcase",
    label: "Coffee Mug",
    before: "/showcase/mug-before.jpg",
    after: "/showcase/mug-dark.jpg",
    bg: "Dark",
  },
];

const ITEMS = [...PORTFOLIO, ...PORTFOLIO];

function Card({ item, index }: { item: typeof PORTFOLIO[0]; index: number }) {
  const [showBefore, setShowBefore] = useState(false);

  return (
    <div className="flex-shrink-0 w-[320px] md:w-[400px] lg:w-[460px]">
      <div
        className="relative rounded-2xl overflow-hidden shadow-lg border border-gray-100 bg-white cursor-pointer focus:outline-2 focus:outline-offset-2 focus:outline-blue-500"
        role="button"
        tabIndex={0}
        aria-label={`${item.label} — ${showBefore ? "showing original" : "showing result on " + item.bg + " background"}. Press Enter to toggle.`}
        onMouseEnter={() => setShowBefore(true)}
        onMouseLeave={() => setShowBefore(false)}
        onTouchStart={() => setShowBefore((v) => !v)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setShowBefore((v) => !v); } }}
      >
        <div className="relative aspect-square">
          <Image
            src={item.after}
            alt={`${item.label} on ${item.bg} background`}
            fill
            className={`object-cover transition-opacity duration-500 ${showBefore ? "opacity-0" : "opacity-100"}`}
            sizes="(max-width: 768px) 320px, (max-width: 1024px) 400px, 460px"
            priority={index < 3}
          />
          <Image
            src={item.before}
            alt={`${item.label} original photo`}
            fill
            className={`object-cover transition-opacity duration-500 ${showBefore ? "opacity-100" : "opacity-0"}`}
            sizes="(max-width: 768px) 320px, (max-width: 1024px) 400px, 460px"
            priority={index < 3}
          />
          <div className="absolute top-3 left-3">
            <span
              className={`backdrop-blur-sm text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm transition-all duration-500 ${
                showBefore
                  ? "bg-black/70 text-white"
                  : "bg-white/90 text-blue-600"
              }`}
            >
              {showBefore ? "Before" : `After · ${item.bg}`}
            </span>
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-500 text-center mt-2 hidden md:block">
        Hover to see original
      </p>
      <p className="text-xs text-gray-500 text-center mt-2 md:hidden">
        Tap to see original
      </p>
    </div>
  );
}

export default function PortfolioStrip() {
  return (
    <section className="py-16 overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 text-center mb-10">
        <h2 className="text-3xl font-bold mb-3">See the Difference</h2>
        <p className="text-gray-500">
          Real results &mdash; messy backgrounds to studio-quality in seconds
        </p>
      </div>

      <div className="relative">
        <div className="flex gap-6 animate-scroll">
          {ITEMS.map((item, i) => (
            <Card key={`${item.id}-${i}`} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
