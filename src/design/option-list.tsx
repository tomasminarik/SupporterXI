import type { ReactNode } from 'react';

export type Option = { value: string; label: string; description?: string };

/** One choice from a few, each with a line of explanation, so choosing needs no second step.
    `name` must be unique on the page; it also names the radio group. */
export function OptionList({ name, label, options, value, onChange }: { name: string; label: ReactNode; options: readonly Option[]; value: string; onChange: (value: string) => void }) {
  return <>
    <p id={`${name}-label`} className="sx-label sx-options-label">{label}</p>
    <div className="sx-options" role="radiogroup" aria-labelledby={`${name}-label`}>
      {options.map((option, index) => <label key={option.value} className="sx-option">
        <input type="radio" name={name} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} aria-labelledby={`${name}-${index}`} aria-describedby={option.description ? `${name}-${index}-d` : undefined} />
        <span className="sx-option-dot" aria-hidden="true" />
        <span className="sx-option-text"><span id={`${name}-${index}`} className="sx-option-name">{option.label}</span>{option.description && <span id={`${name}-${index}-d`} className="sx-option-def">{option.description}</span>}</span>
      </label>)}
    </div>
  </>;
}
