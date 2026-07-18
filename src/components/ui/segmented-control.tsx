import { cva } from "class-variance-authority";

const itemStyles = cva(
  "min-h-9 cursor-pointer rounded-sm px-3 text-sm font-medium transition-colors duration-150",
  {
    variants: {
      selected: {
        true: "bg-surface text-text shadow-xs",
        false: "text-text-muted hover:text-text",
      },
    },
  },
);

type SegmentedControlProps<T extends string> = {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <fieldset className="inline-flex rounded-md border border-border bg-surface-muted p-0.5">
      <legend className="sr-only">{label}</legend>
      {options.map((option) => (
        <button
          aria-pressed={option.value === value}
          className={itemStyles({ selected: option.value === value })}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </fieldset>
  );
}
