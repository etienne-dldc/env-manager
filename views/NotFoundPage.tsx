import { Link, Paper, utility } from "@dldc/hono-ui";
import { css } from "hono/css";
import type { FC } from "hono/jsx";
import { Layout } from "../components/Layout.tsx";

export const NotFoundPage: FC = () => {
  const titleClass = css`
    ${utility.textSize("3xl")};
    ${utility.fontWeight("bold")};
    ${utility.textColor("white")};
  `;

  return (
    <Layout>
      <Paper
        class={css`
          ${utility.flex({ gap: 2, padding: 3, direction: "column" })};
        `}
      >
        <h1 class={titleClass}>404</h1>
        <p
          class={css`
            ${utility.textSize("xl")};
            ${utility.textColor("gray.200")};
          `}
        >
          Page not found.
        </p>
        <Link href="/">Go back to home</Link>
      </Paper>
    </Layout>
  );
};
