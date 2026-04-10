/**
 * Shared form UI primitives — matches the Login/Register page design system.
 * Brand: Navy #093344 | Teal #0D9488 | Gold #df8d31 | Light #FDFBF7
 */
import React from 'react'
import { Loader2 } from 'lucide-react'

// ── Input class helper ─────────────────────────────────────────────────────
export function inputCls(hasError?: boolean, extra?: string) {
  return [
    'w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-900',
    'placeholder:text-gray-400',
    'transition-all duration-150',
    'focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488]',
    hasError
      ? 'border-red-400 focus:ring-red-400/30 focus:border-red-400'
      : 'border-gray-200 hover:border-gray-300',
    extra ?? '',
  ].join(' ')
}

// ── Field wrapper ──────────────────────────────────────────────────────────
export function Field({
  id,
  label,
  error,
  required,
  hint,
  children,
}: {
  id: string
  label: string
  error?: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">{error}</p>
      )}
    </div>
  )
}

// ── Input ──────────────────────────────────────────────────────────────────
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }
>(({ hasError, className, ...props }, ref) => (
  <input ref={ref} className={inputCls(hasError, className)} {...props} />
))
Input.displayName = 'Input'

// ── Textarea ───────────────────────────────────────────────────────────────
export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { hasError?: boolean }
>(({ hasError, className, ...props }, ref) => (
  <textarea
    ref={ref}
    rows={4}
    className={inputCls(hasError, `resize-none ${className ?? ''}`)}
    {...props}
  />
))
Textarea.displayName = 'Textarea'

// ── Select ─────────────────────────────────────────────────────────────────
export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { hasError?: boolean }
>(({ hasError, className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={inputCls(hasError, `appearance-none pr-10 cursor-pointer ${className ?? ''}`)}
      {...props}
    >
      {children}
    </select>
    <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
))
Select.displayName = 'Select'

// ── IconInput (input with left icon) ──────────────────────────────────────
export function IconInput({
  icon,
  hasError,
  inputRef,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon: React.ReactNode
  hasError?: boolean
  inputRef?: React.Ref<HTMLInputElement>
}) {
  return (
    <div className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none">
        {icon}
      </div>
      <input
        ref={inputRef}
        className={inputCls(hasError, 'pl-10')}
        {...props}
      />
    </div>
  )
}

// ── Primary button ─────────────────────────────────────────────────────────
export function PrimaryButton({
  loading,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={[
        'flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white',
        'bg-[#093344] hover:bg-[#0D9488]',
        'focus:outline-none focus:ring-2 focus:ring-[#0D9488]/50 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-all duration-200 shadow-sm',
        className ?? '',
      ].join(' ')}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
}

// ── Secondary button ───────────────────────────────────────────────────────
export function SecondaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={[
        'flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold',
        'border border-gray-200 bg-white text-gray-700',
        'hover:border-[#0D9488] hover:text-[#0D9488]',
        'focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-all duration-200 shadow-sm',
        className ?? '',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

// ── Form error alert ───────────────────────────────────────────────────────
export function FormError({ message }: { message: string }) {
  if (!message) return null
  return (
    <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  )
}

// ── Form success alert ─────────────────────────────────────────────────────
export function FormSuccess({ message }: { message: string }) {
  if (!message) return null
  return (
    <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
      {message}
    </div>
  )
}

// ── Section card (wraps a group of fields) ─────────────────────────────────
export function FormSection({
  title,
  description,
  children,
}: {
  title?: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      {(title || description) && (
        <div className="pb-4 border-b border-gray-100">
          {title && <h3 className="text-base font-semibold text-[#093344]">{title}</h3>}
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
      )}
      {children}
    </div>
  )
}

// ── Modal shell ────────────────────────────────────────────────────────────
export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
  wide?: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={[
          'bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] flex flex-col',
          wide ? 'max-w-2xl' : 'max-w-lg',
        ].join(' ')}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-semibold text-[#093344]">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-lg p-1 hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

// ── Search input ───────────────────────────────────────────────────────────
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={`relative ${className ?? ''}`}>
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputCls(false, 'pl-10')}
      />
    </div>
  )
}
