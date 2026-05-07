import type { FC } from "hono/jsx";
import { EnvFilesList } from "../components/EnvFilesList.tsx";
import { Layout } from "../components/Layout.tsx";
import type { EnvFileListItem } from "../logic/envFiles.ts";

type AppsPageProps = {
  ok?: string | null;
  error?: string | null;
  envFiles: EnvFileListItem[];
};

export const AppsPage: FC<AppsPageProps> = (
  { ok, error, envFiles },
) => {
  return (
    <Layout title="Apps" ok={ok} error={error}>
      <EnvFilesList envFiles={envFiles} />
    </Layout>
  );
};
