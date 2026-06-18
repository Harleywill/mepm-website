interface FieldProps {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function Field({
  label,
  hint,
  required,
  children,
}: FieldProps) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-1.75">
        <span className="font-mono text-xs tracking-widest uppercase text-slate-500">
          {label}
          {required && <span className="text-green-700"> *</span>}
        </span>
        {hint && (
          <span className="font-body text-sm text-fg-subtle">{hint}</span>
        )}
      </div>
      {children}
    </label>
  );
}
