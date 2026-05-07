import { Link, Paper, Stack, Typography, utility } from "@dldc/hono-ui";
import { css } from "hono/css";
import type { FC } from "hono/jsx";
import { EnvVariableItem } from "../components/EnvVariableItem.tsx";
import { Layout } from "../components/Layout.tsx";
import type { EnvFileVariable } from "../logic/envFiles.ts";

type EnvFileDetails = {
  name: string;
  variables: EnvFileVariable[];
};

type EnvFileDetailsPageProps = {
  envFile: EnvFileDetails;
};

export const EnvFileDetailsPage: FC<EnvFileDetailsPageProps> = (
  { envFile },
) => {
  const countClass = css`
    ${utility.textSize("sm")};
    opacity: 0.75;
    margin: 0;
  `;

  const listClass = css`
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.85rem;
  `;

  const emptyClass = css`
    ${utility.textSize("sm")};
    opacity: 0.8;
    font-style: italic;
    margin: 0;
  `;

  return (
    <Layout title={envFile.name}>
      <Stack direction="column" gap={3}>
        <Link href="/">
          ← Back to env files
        </Link>

        <Paper flexDirection="column" align="stretch">
          <Stack direction="column" gap={2} padding={3}>
            <div>
              <Typography render="h2" textSize="2xl" fontWeight="bold">
                {envFile.name}
              </Typography>
              <p class={countClass}>
                {envFile.variables.length} variable
                {envFile.variables.length === 1 ? "" : "s"}
              </p>
            </div>

            {envFile.variables.length > 0
              ? (
                <ul class={listClass}>
                  {envFile.variables.map((variable) => (
                    <EnvVariableItem
                      key={variable.name}
                      envFileName={envFile.name}
                      variable={variable}
                    />
                  ))}
                </ul>
              )
              : <p class={emptyClass}>This file has no variables yet.</p>}
          </Stack>
        </Paper>
      </Stack>
    </Layout>
  );
};
