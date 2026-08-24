'use client';
import { useState } from 'react';

const CATEGORIES = [
  '🔥 All',
  '🚀 Productivity',
  '🎨 Design & Art',
  '💻 Developer',
  '📈 Marketing',
  '👥 People & Creators',
  '💡 Tech & AI',
];

export default function CategoryBidBar({ selectedCategory, setSelectedCategory }) {
  return (
    <div className="w-full max-w-7xl mx-auto px-6 md:px-16 my-8">
      <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-4 py-2.5 rounded-xl font-mono text-xs transition duration-200 border ${
                isActive
                  ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white border-transparent shadow-lg shadow-pink-500/20 font-bold'
                  : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}