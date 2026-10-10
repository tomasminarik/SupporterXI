import type { ButtonHTMLAttributes, Ref } from 'react';

// Primary confirms; secondary is the other choice; quiet is a small action inside a heading; action (yellow)
// is for sharing only. The class names are the parts' public names (components.css).
const classes = { primary: 'sx-primary', secondary: 'sx-secondary', quiet: 'sx-quiet', action: 'sx-share' } as const;
type Props = ButtonHTMLAttributes<HTMLButtonElement> & { ref?: Ref<HTMLButtonElement> };

export function Button({ variant = 'secondary', className, ...props }: Props & { variant?: keyof typeof classes }) {
  return <button type="button" {...props} className={className ? `${classes[variant]} ${className}` : classes[variant]} />;
}

/** The cross that closes a panel, sheet or dialog. Its 44px target is larger than the mark. */
export function CloseButton({ label = 'Close', className, ...props }: Omit<Props, 'children'> & { label?: string }) {
  return <button type="button" aria-label={label} {...props} className={className ? `sx-close ${className}` : 'sx-close'}>
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 2l10 10M12 2L2 12" /></svg>
  </button>;
}
