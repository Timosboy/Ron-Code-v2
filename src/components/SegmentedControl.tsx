import { useState } from 'react';

interface SegmentedControlProps {
  options: string[];
  value: number;
  onChange: (index: number) => void;
}

export default function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="relative inline-flex rounded-2xl bg-gray-100 p-1 gap-0.5">
      {/* Animated pill background */}
      <div
        className="absolute top-1 bottom-1 rounded-xl bg-white shadow-md transition-all duration-300 ease-out"
        style={{
          width: `calc(${100 / options.length}% - 4px)`,
          left: `calc(${(100 / options.length) * value}% + 2px)`,
        }}
      />
      {options.map((option, i) => (
        <button
          key={option}
          onClick={() => onChange(i)}
          onMouseEnter={() => setHoveredIndex(i)}
          onMouseLeave={() => setHoveredIndex(null)}
          className={`relative z-10 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200 cursor-pointer ${
            value === i
              ? 'text-violet-700'
              : hoveredIndex === i
                ? 'text-gray-600'
                : 'text-gray-400'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
