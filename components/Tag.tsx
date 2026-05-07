import { utility } from "@dldc/hono-ui";
import { css, cx } from "hono/css";
import type { FC } from "hono/jsx";

type TagTone = "neutral" | "info" | "warning" | "success";

type TagProps = {
  children: unknown;
  tone?: TagTone;
};

export const Tag: FC<TagProps> = ({ children, tone = "neutral" }) => {
  const baseClass = css`
    ${utility.textSize("xs")};
    ${utility.fontWeight("semibold")};
    border-radius: 999px;
    padding: 0.2rem 0.55rem;
    border: 1px solid;
    display: inline-flex;
    align-items: center;
    width: fit-content;
  `;

  const toneClassMap: Record<TagTone, Promise<string>> = {
    neutral: css`
      color: #d1d5db;
      border-color: rgba(209, 213, 219, 0.35);
      background: rgba(209, 213, 219, 0.12);
    `,
    info: css`
      color: #93c5fd;
      border-color: rgba(147, 197, 253, 0.4);
      background: rgba(147, 197, 253, 0.12);
    `,
    warning: css`
      color: #fcd34d;
      border-color: rgba(252, 211, 77, 0.45);
      background: rgba(252, 211, 77, 0.12);
    `,
    success: css`
      color: #86efac;
      border-color: rgba(134, 239, 172, 0.45);
      background: rgba(134, 239, 172, 0.12);
    `,
  };

  return <span class={cx(baseClass, toneClassMap[tone])}>{children}</span>;
};
