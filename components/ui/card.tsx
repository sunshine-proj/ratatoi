import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type CardProps = HTMLAttributes<HTMLElement> & {
  /** Render as a sectioning element when the card has its own heading. */
  as?: "div" | "article" | "section" | "li";
  padded?: boolean;
};

export function Card({ as: Tag = "div", padded = true, className, ...rest }: CardProps) {
  return (
    <Tag
      className={cn(
        "rounded-card border border-line bg-surface shadow-card",
        padded && "p-5",
        className,
      )}
      {...rest}
    />
  );
}
