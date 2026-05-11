import {
  Button,
  InlineGroup,
  Input,
  Paper,
  Typography,
  utility,
} from "@dldc/hono-ui";
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
  return (
    <Layout title="Apps" ok={ok} error={error}>
      <Paper
        gap={4}
        flexDirection="column"
        padding={4}
      >
        <Typography textSize="2xl" fontWeight="bold" render="h2">
          Files
        </Typography>
        <EnvFilesList envFiles={envFiles} />

        <form
          method="post"
          action="/env"
          class={css`
            ${utility.flex({ gap: 2, direction: "column", align: "stretch" })};
          `}
        >
          <label
            for="name"
            class={css`
              ${utility.srOnly};
            `}
          >
            Env file name
          </label>
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
