import React from "react";

export default function BrandLogo({ className = "h-8", showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className="flex items-center space-x-3.5 select-none shrink-0">
      {/* Self-contained highly precise Vector depiction of the AgentOps Logo */}
      <svg
        className={className}
        viewBox="0 0 420 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Deep blue stylized A loop */}
        <path
          d="M174.5 24L52.5 214C37.5 237.5 54.5 269 82.5 269H172.5L200.5 225.5L160.5 158.5L210.5 75.5L174.5 24Z"
          fill="#00205B"
        />
        {/* Golden yellow triangle accent inside A */}
        <path
          d="M125.5 269H205.5L165.5 204C157.5 217 141.5 243.5 125.5 269Z"
          fill="#FFB800"
        />
        {/* Overlapping golden yellow circle O */}
        <path
          d="M265.5 84C218 84 179.5 122.5 179.5 170C179.5 210 206.5 243.5 243.5 253L253 236.5C227.5 227 209.5 200.5 209.5 170C209.5 139 234.5 114 265.5 114C296.5 114 321.5 139 321.5 170C321.5 198.5 306 222.5 283 233.5L296.5 249C323 234.5 340.5 205.5 340.5 170C340.5 122.5 302 84 265.5 84Z"
          fill="#FFB800"
        />
        {/* Deep blue interlocking bottom slice of O */}
        <path
          d="M243.5 253C250.5 255 258 256 265.5 256C291.5 256 314 243.5 328.5 224L296.5 202C289.5 213 278 220 265.5 220C255.5 220 246.5 215.5 240.5 209L216.5 227C223.5 238 232.5 247 243.5 253Z"
          fill="#00205B"
        />
      </svg>
      {showText && (
        <div className="flex items-baseline text-xl font-bold tracking-tight">
          <span className="text-[#00205B] font-extrabold" style={{ fontFamily: "Inter, sans-serif" }}>Agent</span>
          <span className="text-[#FFB800] font-black" style={{ fontFamily: "Inter, sans-serif" }}>Ops</span>
        </div>
      )}
    </div>
  );
}
