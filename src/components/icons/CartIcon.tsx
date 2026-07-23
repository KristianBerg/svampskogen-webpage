export function CartIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 7h12l-1.2 12.1a1 1 0 0 1-1 .9H8.2a1 1 0 0 1-1-.9L6 7z" />
      <path d="M9 7V5.5a3 3 0 0 1 6 0V7" />
    </svg>
  )
}
