import { Html, Title, UniversalLayout, utility } from "@dldc/hono-ui";
import { css } from "hono/css";
import { type FC, Fragment } from "hono/jsx";

type LayoutProps = {
  title?: string;
  children: unknown;
  ok?: string | null;
  error?: string | null;
};

export const Layout: FC<LayoutProps> = (
  { title, children, ok, error },
) => {
  const okClass = css`
    background: #ecfdf5;
    color: #065f46;
    border-radius: 8px;
    padding: 10px 12px;
  `;

  const errorClass = css`
    background: #fef2f2;
    color: #991b1b;
    border-radius: 8px;
    padding: 10px 12px;
  `;

  return (
    <Html
      title={title ? `${title} - Env Manager` : "Env Manager"}
      heads={
        <Fragment>
          <link
            rel="icon"
            href={`data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🔒</text></svg>`}
          />
          <script
            type="module"
            src="https://cdn.jsdelivr.net/npm/htmx.org@4.0.0-beta2/dist/htmx.esm.min.js"
            integrity="sha384-imtDMsKpIb5KDnuaceZPNUtGHemw6nZSQTAcVNpfegk47oSVnMbe0dp6civ/SA4s"
            crossorigin="anonymous"
          >
          </script>
          <script src="/public/helper.js" defer />
        </Fragment>
      }
    >
      <UniversalLayout
        class={css`
          ${utility.rowGap(4)};
        `}
      >
        <Title>
          Env Manager
        </Title>
        {ok ? <div class={okClass}>{ok}</div> : null}
        {error ? <div class={errorClass}>{error}</div> : null}
        {children}
      </UniversalLayout>
    </Html>
  );
};
