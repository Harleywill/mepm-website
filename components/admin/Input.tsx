'use client';

import { useState } from 'react';
import { Icon } from './Icon';

const inputBaseClasses =
  'w-full box-border font-body text-base text-fg bg-white border-[1.5px] border-slate-300 rounded-md px-3.5 py-2.5 outline-none transition-all duration-120';

const focusRingClasses =
  'focus:border-navy-600 focus:shadow-[0_0_0_3px_rgba(0,64,120,0.1)]';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export function Input({ className, style, error, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <input
      {...props}
      onFocus={(e) => {
        setFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        props.onBlur?.(e);
      }}
      className={`${inputBaseClasses} ${focusRingClasses} ${className || ''}`}
      style={style}
    />
  );
}

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export function Textarea({
  className,
  style,
  error,
  ...props
}: TextareaProps) {
  const [focused, setFocused] = useState(false);

  return (
    <textarea
      {...props}
      onFocus={(e) => {
        setFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        props.onBlur?.(e);
      }}
      className={`${inputBaseClasses} ${focusRingClasses} resize-vertical min-h-[100px] leading-[1.6] ${
        className || ''
      }`}
      style={style}
    />
  );
}

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: (string | SelectOption)[];
  error?: string;
}

export function Select({
  options,
  className,
  style,
  error,
  ...props
}: SelectProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="relative">
      <select
        {...props}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        className={`${inputBaseClasses} ${focusRingClasses} appearance-none pr-9 cursor-pointer ${
          className || ''
        }`}
        style={style}
      >
        {options.map((o) => {
          const v = typeof o === 'string' ? o : o.value;
          const l = typeof o === 'string' ? o : o.label;
          return (
            <option key={v} value={v}>
              {l}
            </option>
          );
        })}
      </select>
      <Icon
        name="ChevronDown"
        size={16}
        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"
      />
    </div>
  );
}
