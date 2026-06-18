import { Icon } from './Icon';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  count?: string | number;
  desc?: string;
  actions?: React.ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  count,
  desc,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-6 mb-7 flex-wrap">
      <div>
        {eyebrow && (
          <div className="font-mono text-sm tracking-widest uppercase text-green-700 flex items-center gap-2.5 mb-3">
            <span className="w-5.5 h-0.5 bg-green-500"></span>
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-5xl font-800 tracking-tight text-navy-800 m-0 flex items-baseline gap-3.5">
          {title}
          {count != null && (
            <span className="font-mono text-base font-500 text-slate-400">
              {count}
            </span>
          )}
        </h1>
        {desc && (
          <p className="font-body text-base text-slate-600 m-0 mt-2.5 max-w-md">
            {desc}
          </p>
        )}
      </div>
      {actions && <div className="flex gap-2.5">{actions}</div>}
    </div>
  );
}
