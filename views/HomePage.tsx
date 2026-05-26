import {
  Button,
  css,
  InlineGroup,
  Input,
  Paper,
  srOnlyClass,
  Typography,
} from "@dldc/hono-ui";
import { EnvFilesList } from "../components/EnvFilesList.tsx";
import { Layout } from "../components/Layout.tsx";
import type { BackendFile } from "../logic/backend/types.ts";

type AppsPageProps = {
  ok?: string | null;
  error?: string | null;
  envFiles: BackendFile[];
};

export const HomePage = ({ ok, error, envFiles }: AppsPageProps) => {
  return (
    <Layout title="Apps" ok={ok} error={error}>
      <Paper
        gap={4}
        flexDirection="column"
        padding={4}
      >
        <Typography fontSize="2xl" fontWeight="bold" render="h2">
          Files
        </Typography>
        <EnvFilesList envFiles={envFiles} />

        <form
          method="post"
          action="/env"
          class={css({
            display: "flex",
            flexDirection: "column",
            gap: 2,
            alignItems: "stretch",
          })}
        >
          <label for="name" class={srOnlyClass}>
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
              autocomplete="off"
              spellCheck={false}
              classList={css({ flex: "1" })}
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
