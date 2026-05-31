import { Paper, Typography } from "@dldc/hono-ui";
import { EnvFilesList } from "../components/EnvFilesList.tsx";
import { Layout } from "../components/Layout.tsx";
import type { BackendFile } from "../logic/backend/types.ts";
import type { Flash } from "../logic/flash.ts";

type AppsPageProps = {
  flash?: Flash;
  envFiles: BackendFile[];
};

export const HomePage = ({ flash, envFiles }: AppsPageProps) => {
  return (
    <Layout title="Apps" flash={flash}>
      <Paper
        gap={4}
        flexDirection="column"
        padding={4}
      >
        <Typography fontSize="2xl" fontWeight="bold" render="h2">
          Files
        </Typography>
        <EnvFilesList envFiles={envFiles} />
      </Paper>
    </Layout>
  );
};
