import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

export const buttonStyles = cva(
  "inline-flex min-h-10 cursor-pointer items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "border-accent bg-accent text-accent-contrast hover:bg-accent-hover active:bg-accent-active",
        secondary:
          "border-border-strong bg-surface text-text hover:bg-surface-hover active:bg-surface-active",
        quiet:
          "border-transparent bg-transparent text-text-muted hover:bg-surface-hover hover:text-text",
      },
    },
    defaultVariants: { variant: "secondary" },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonStyles>;

export function Button({ className, variant, ...props }: ButtonProps) {
  return <button className={buttonStyles({ variant, className })} type="button" {...props} />;
}
