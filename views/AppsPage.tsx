import { Button, InlineGroup, Input, Paper, utility } from "@dldc/hono-ui";
import { css } from "hono/css";
import type { FC } from "hono/jsx";
import { EnvFilesList } from "../components/EnvFilesList.tsx";
import { Layout } from "../components/Layout.tsx";
import type { BackendFile } from "../logic/backend/types.ts";

type AppsPageProps = {
  ok?: string | null;
  error?: string | null;
  envFiles: BackendFile[];
};

export const AppsPage: FC<AppsPageProps> = (
  { ok, error, envFiles },
) => {
  const srOnlyClass = css`
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  `;

  return (
    <Layout title="Apps" ok={ok} error={error}>
      <Paper
        inlines={[utility.flex({ gap: 3, padding: 3, direction: "column" })]}
      >
        <EnvFilesList envFiles={envFiles} />

        <form
          method="post"
          action="/env"
          class={css`
            ${utility.flex({ gap: 2, direction: "column", align: "stretch" })};
          `}
        >
          <label for="name" class={srOnlyClass}>Env file name</label>
          <InlineGroup>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="app or .env.app"
              required
              size={10}
              autoComplete="off"
              spellCheck={false}
              class={css`
                flex: 1;
              `}
            />
            <Button type="submit" variant="primary" size={10}>
              Create file
            </Button>
          </InlineGroup>
        </form>
      </Paper>
    </Layout>
  );
};
