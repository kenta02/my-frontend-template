import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import type { ReactNode } from "react";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "my-frontend-template" },
    ],
    // favicon を置くまでの空指定 (/favicon.ico への 404 を防ぐ)
    links: [{ rel: "icon", href: "data:," }],
  }),
  shellComponent: RootDocument,
  notFoundComponent: () => <p>ページが見つかりません</p>,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
