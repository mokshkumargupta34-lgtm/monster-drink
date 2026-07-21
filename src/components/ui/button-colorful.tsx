import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '../../lib/utils';

type ButtonColorfulProps = React.ComponentPropsWithoutRef<'button'> & {
  label?: string;
};

/**
 * Colorful gradient action button — themed to the site's emerald palette.
 * Flexible: pass `children` for custom content (icons, spinners, dynamic text)
 * or `label` for the default label + arrow. `className` overrides size/shape
 * (merged with tailwind-merge so passed utilities win).
 */
export function ButtonColorful({
  className,
  label = 'Explore',
  children,
  ...props
}: ButtonColorfulProps) {
  return (
    <button
      className={cn(
        'relative inline-flex items-center justify-center overflow-hidden rounded-lg h-10 px-4',
        'bg-zinc-900 text-white transition-all duration-300 group cursor-pointer active:scale-95',
        'disabled:opacity-60 disabled:pointer-events-none',
        className,
      )}
      {...props}
    >
      {/* Green gradient glow */}
      <span
        className={cn(
          'pointer-events-none absolute inset-0',
          'bg-gradient-to-r from-emerald-500 via-green-500 to-lime-400',
          'opacity-40 group-hover:opacity-80 blur transition-opacity duration-500',
        )}
      />

      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children ?? (
          <>
            <span>{label}</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </>
        )}
      </span>
    </button>
  );
}

export { ButtonColorful as default };
