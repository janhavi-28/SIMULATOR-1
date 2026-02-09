"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const MAIN_ROUTES = [
  "/subjects",
  "/high-school/physics",
  "/senior-secondary/physics",
  "/senior-secondary/chemistry",
  "/senior-secondary/maths",
  "/trending-topics/physics",
];

export default function RouteWarmup() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const delay = 120;
    const ids: ReturnType<typeof setTimeout>[] = [];
    MAIN_ROUTES.forEach((href, i) => {
      ids.push(
        setTimeout(() => {
          router.prefetch(href);
        }, i * delay)
      );
    });
    return () => ids.forEach((id) => clearTimeout(id));
  }, [router]);

  return null;
}
