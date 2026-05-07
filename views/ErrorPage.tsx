import { Link, Paper, utility } from "@dldc/hono-ui";
import { css } from "hono/css";
import type { FC } from "hono/jsx";
import { Layout } from "../components/Layout.tsx";

type ErrorPageProps = {
  title?: string;
  message: string;
  returnPath?: string;
  returnLabel?: string;
};

export const ErrorPage: FC<ErrorPageProps> = ({
  title = "Error",
  message,
  returnPath = "/",
  returnLabel = "Back",
}) => {
  const containerClass = css`
    ${utility.flex({ direction: "column", gap: 3, padding: 2 })};
  `;

  const headerClass = css`
    ${utility.flex({ direction: "column", gap: 1 })};
  `;

  const titleClass = css`
    ${utility.textSize("2xl")};
    ${utility.fontWeight("bold")};
    ${utility.textColor("red.400")};
    margin: 0;
  `;

  const messageClass = css`
    ${utility.textSize("lg")};
    ${utility.textColor("gray.200")};
    margin: 0;
    line-height: 1.5;
  `;

  const linkClass = css`
    ${utility.textColor("blue.400")};
    text-decoration: none;
    transition: opacity 140ms ease;

    &:hover {
      opacity: 0.8;
    }
  `;

  return (
    <Layout>
      <Link href={returnPath}>
        <span class={linkClass}>← {returnLabel}</span>
      </Link>
      <Paper class={containerClass}>
        <div class={headerClass}>
          <h2 class={titleClass}>{title}</h2>
        </div>
        <p class={messageClass}>{message}</p>
      </Paper>
    </Layout>
  );
};
