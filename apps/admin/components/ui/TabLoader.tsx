"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function TabLoaderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // When pathname or searchParams change, the navigation has completed.
    // We immediately restore the standard brand icon.
    restoreFavicon();
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      // Find the closest anchor tag
      let target = e.target as HTMLElement | null;
      while (target && target.tagName !== "A") {
        target = target.parentElement;
      }

      if (!target || !(target instanceof HTMLAnchorElement)) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Handle only client-side relative links (not external, hash links, mailto/tel, or target="_blank")
      const isExternal = href.startsWith("http") || href.startsWith("//");
      const isHash = href.startsWith("#");
      const isTargetBlank = target.target === "_blank";
      const isMailtoOrTel = href.startsWith("mailto:") || href.startsWith("tel:");

      if (isExternal || isHash || isTargetBlank || isMailtoOrTel) return;

      // Verify if the clicked link navigates to a different page/params
      try {
        const currentUrl = new URL(window.location.href);
        const targetUrl = new URL(href, window.location.href);

        if (
          currentUrl.pathname === targetUrl.pathname &&
          currentUrl.search === targetUrl.search
        ) {
          return;
        }
      } catch (err) {
        // Fallback for safety
      }

      // Temporarily change the favicon to the dynamic spinning icon!
      setLoadingFavicon();
    };

    window.addEventListener("click", handleLinkClick, { capture: true });

    // Fallback automatic recovery after a safe 6 seconds timeout
    let timeoutId: NodeJS.Timeout;
    const handleResetTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        restoreFavicon();
      }, 6000);
    };

    window.addEventListener("click", handleResetTimeout, { capture: true });

    return () => {
      window.removeEventListener("click", handleLinkClick, { capture: true });
      window.removeEventListener("click", handleResetTimeout, { capture: true });
      clearTimeout(timeoutId);
    };
  }, []);

  const setLoadingFavicon = () => {
    const links = document.querySelectorAll("link[rel*='icon']");
    links.forEach((link) => {
      if (link instanceof HTMLLinkElement) {
        if (!link.dataset.originalHref) {
          link.dataset.originalHref = link.href;
        }
        link.href = "/icon-loading.svg";
      }
    });
  };

  const restoreFavicon = () => {
    const links = document.querySelectorAll("link[rel*='icon']");
    links.forEach((link) => {
      if (link instanceof HTMLLinkElement && link.dataset.originalHref) {
        link.href = link.dataset.originalHref;
      }
    });
  };

  return null;
}

export function TabLoader() {
  return (
    <Suspense fallback={null}>
      <TabLoaderInner />
    </Suspense>
  );
}
