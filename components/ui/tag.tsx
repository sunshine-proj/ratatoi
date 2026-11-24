import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type TagTone = "neutral" | "protein" | "energy" | "accent";

const tones: Record<TagTone, string> = {
  neutral: "bg-surface-muted text-ink",
  protein: "bg-protein-bg text-protein-fg",
  energy: "bg-energy-bg text-energy-fg",
  accent: "bg-accent text-on-accent",
};

type TagProps = HTMLAttributes<HTMLSpanElement> & { tone?: TagTone };

/**
 * Small, non-interactive label (e.g. "Snack", "32 g protein").
 * Tone is decoration only: the text itself must carry the meaning.
 */
export function Tag({ tone = "neutral", className, ...rest }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 text-sm font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
      {...rest}
    />
  );
}
