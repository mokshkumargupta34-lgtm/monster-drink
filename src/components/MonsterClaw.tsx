import React from 'react';

/**
 * The three-slash Monster claw mark, drawn as paths so it can take any flavour's
 * theme colour. The shipped claw asset is an opaque JPG on a patterned backdrop,
 * so it cannot be tinted or sat on a transparent tile.
 */
export default function MonsterClaw({
  color = 'currentColor',
  glow = true,
  className = '',
}: {
  color?: string;
  glow?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 128 152"
      aria-hidden="true"
      className={className}
      style={glow ? { filter: `drop-shadow(0 0 6px ${color}88)` } : undefined}
    >
      <g fill={color}>
        {/* left slash — hooked head upper-left, tapers to a point down-right */}
        <path d="M2 28 L12 13 L26 9 L36 19 L40 36 L45 60 L48 86 L50 106 L47 122 L41 106 L37 86 L32 62 L26 40 L14 29 Z" />
        {/* centre slash — head sits highest, tail runs lowest */}
        <path d="M52 26 L60 8 L74 6 L84 18 L86 40 L85 66 L83 94 L80 120 L76 148 L70 124 L68 96 L66 68 L64 42 L57 30 Z" />
        {/* right slash — hooked head upper-right, tapers down-left */}
        <path d="M92 30 L102 12 L116 10 L126 24 L124 44 L119 68 L112 92 L103 116 L99 98 L102 76 L105 54 L106 38 L98 30 Z" />
      </g>
    </svg>
  );
}
