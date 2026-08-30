export function DateNavigationButton({
  icon,
  onClick,
  disabled,
  title,
}: {
  icon: React.ReactNode
  onClick: () => void
  disabled?: boolean
  title: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className="flex h-8 w-8 flex-none items-center justify-center rounded-md text-foreground-secondary transition hover:bg-surface-selected active:scale-[0.97] disabled:opacity-30 disabled:hover:bg-transparent disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {icon}
    </button>
  )
}
