"use client";

import { Suspense, type ComponentProps } from "react";
import { usePathname } from "next/navigation";
import { NavList } from "./nav-list";

type Props = Omit<ComponentProps<typeof NavList>, "pathname">;

function PathAwareNavList(props: Props) {
  const pathname = usePathname();
  return <NavList {...props} pathname={pathname} />;
}

/**
 * With Cache Components, `usePathname` suspends on routes whose dynamic
 * params are unknown at build time (e.g. /recipes/[slug]). The fallback
 * renders the same links without a current-page marker, so the shell
 * stays prerendered and navigable.
 */
export function ActiveNavList(props: Props) {
  return (
    <Suspense fallback={<NavList {...props} pathname={null} />}>
      <PathAwareNavList {...props} />
    </Suspense>
  );
}
