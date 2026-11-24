import Image from "next/image";
import { cn } from "@/lib/cn";
import type { RecipeImage as RecipeImageData, MealType } from "@/lib/recipes/schema";
import { Icon, type IconName } from "@/components/ui/icon";

const art: Record<MealType, { bg: string; ink: string; icon: IconName }> = {
  breakfast: { bg: "bg-accent-soft", ink: "text-accent-strong", icon: "today" },
  lunch: { bg: "bg-primary-soft", ink: "text-primary-strong", icon: "recipes" },
  dinner: { bg: "bg-surface-muted", ink: "text-accent-strong", icon: "utensils" },
  snack: { bg: "bg-butter-soft", ink: "text-butter-strong", icon: "snacks" },
};

/**
 * Recipe photo with a fixed 4:3 frame, so nothing shifts while it loads.
 * Without a licensed photo, a designed illustration fills the same frame;
 * it is decorative (the recipe name is always shown as text).
 */
export function RecipeImage({ image, mealType, sizes, priority, className }: {
  image: RecipeImageData | null;
  mealType: MealType;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  if (image) {
    return (
      <div className={cn("relative aspect-[4/3] overflow-hidden bg-surface-muted", className)}>
        <Image src={image.src} alt={image.alt} fill sizes={sizes} priority={priority} className="object-cover" />
      </div>
    );
  }

  const style = art[mealType];
  return (
    <div aria-hidden="true" className={cn("relative aspect-[4/3] overflow-hidden", style.bg, style.ink, className)}>
      <svg viewBox="0 0 400 300" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice">
        <circle cx="200" cy="150" r="104" fill="currentColor" opacity="0.08" />
        <circle cx="200" cy="150" r="84" fill="#fffdf9" />
        <circle cx="200" cy="150" r="64" fill="none" stroke="currentColor" strokeOpacity="0.14" strokeWidth="3" />
        <path d="M58 64c18-22 52-24 70-6-20 20-52 22-70 6Z" fill="currentColor" opacity="0.18" />
        <path d="M330 244c-20 14-48 10-60-8 22-14 48-10 60 8Z" fill="currentColor" opacity="0.18" />
        <circle cx="336" cy="70" r="10" fill="currentColor" opacity="0.2" />
        <circle cx="72" cy="232" r="7" fill="currentColor" opacity="0.2" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon name={style.icon} className="size-[18%] min-w-10" strokeWidth={1.5} />
      </div>
    </div>
  );
}
