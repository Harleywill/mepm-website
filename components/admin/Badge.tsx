import { Icon } from './Icon';

type BadgeTone = 'slate' | 'navy' | 'green' | 'amber' | 'red';

interface BadgeProps {
  children: React.ReactNode;
  tone?: BadgeTone;
  icon?: any;
  dot?: boolean;
}

const tones: Record<BadgeTone, { bg: string; fg: string }> = {
  slate: { bg: 'bg-slate-100', fg: 'text-slate-600' },
  navy: { bg: 'bg-navy-50', fg: 'text-navy-700' },
  green: { bg: 'bg-green-100', fg: 'text-green-800' },
  amber: { bg: 'bg-warning-bg', fg: 'text-amber-700' },
  red: { bg: 'bg-danger-bg', fg: 'text-danger' },
};

export function Badge({
  children,
  tone = 'slate',
  icon,
  dot,
}: BadgeProps) {
  const { bg, fg } = tones[tone];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-xs font-medium tracking-widest uppercase px-2.25 py-1 rounded-full ${bg} ${fg}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${fg}`}></span>
      )}
      {icon && <Icon name={icon} size={12} stroke={2.4} />}
      {children}
    </span>
  );
}
