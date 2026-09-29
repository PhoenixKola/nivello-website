'use client'

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { Search, X } from 'lucide-react'
import { cx, fieldBase, labelText } from './styles'

export function Field({ label, hint, error, htmlFor, children, className }: { label: ReactNode; hint?: ReactNode; error?: string | null; htmlFor?: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className={labelText}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-red-600 dark:text-red-300" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      )}
    </div>
  )
}

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & { label?: ReactNode; hint?: ReactNode; error?: string | null }

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField({ label, hint, error, className, id, ...rest }, ref) {
  const generated = useId()
  const inputId = id ?? generated
  const input = (
    <input
      ref={ref}
      id={inputId}
      aria-invalid={error ? true : undefined}
      className={cx(fieldBase, 'h-9', error && 'border-red-400 dark:border-red-400/60', className)}
      {...rest}
    />
  )
  if (!label) return input
  return (
    <Field label={label} hint={hint} error={error} htmlFor={inputId}>
      {input}
    </Field>
  )
})

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: ReactNode; hint?: ReactNode }

export function TextArea({ label, hint, className, id, ...rest }: TextAreaProps) {
  const generated = useId()
  const inputId = id ?? generated
  const area = <textarea id={inputId} className={cx(fieldBase, 'min-h-[88px] resize-y py-2 leading-relaxed', className)} {...rest} />
  if (!label) return area
  return (
    <Field label={label} hint={hint} htmlFor={inputId}>
      {area}
    </Field>
  )
}

export function SearchInput({ value, onChange, placeholder = 'Search', label = 'Search', className }: { value: string; onChange: (value: string) => void; placeholder?: string; label?: string; className?: string }) {
  return (
    <div className={cx('relative', className)}>
      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        aria-label={label}
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        className={cx(fieldBase, 'h-9 pl-9 pr-8 [&::-webkit-search-cancel-button]:hidden')}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
