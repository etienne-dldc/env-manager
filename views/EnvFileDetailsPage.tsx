import { Button, css, Link, Paper, Stack, Typography } from "@dldc/hono-ui";
import type { FC } from "hono/jsx";
import { CreateVariableForm } from "../components/CreateVariableForm.tsx";
import { EnvVariableItem } from "../components/EnvVariableItem.tsx";
import { Layout } from "../components/Layout.tsx";
import type { BackendFileVariable } from "../logic/backend/types.ts";
import type { Flash } from "../logic/flash.ts";

type EnvFileDetails = {
  name: string;
  variables: BackendFileVariable[];
};

type EnvFileDetailsPageProps = {
  envFile: EnvFileDetails;
  flash?: Flash;
};

const countClass = css({ fontSize: "sm", opacity: 0.75, margin: 0 });

const listClass = css({
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "grid",
  gap: "[0.85rem]",
});

const emptyClass = css({
  fontSize: "sm",
  opacity: 0.8,
  fontStyle: "italic",
  margin: 0,
});

export const EnvFileDetailsPage: FC<EnvFileDetailsPageProps> = (
  { envFile, flash },
) => {
  return (
    <Layout title={envFile.name} flash={flash}>
      <Stack flexDirection="column" gap={3}>
        <Stack
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
          gap={2}
        >
          <Link href="/">
            ← Back to env files
          </Link>
          <Button
            hx-confirm={`Are you sure you want to delete ${envFile.name}? This action cannot be undone.`}
            hx-post={`/env/${encodeURIComponent(envFile.name)}/delete`}
            type="submit"
            size={8}
            variant="danger"
          >
            Delete file
          </Button>
        </Stack>

        <Paper flexDirection="column" alignItems="stretch">
          <Stack flexDirection="column" gap={6} padding={4}>
            <div>
              <Typography render="h2" fontSize="2xl" fontWeight="bold">
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

            <CreateVariableForm envFileName={envFile.name} />
          </Stack>
        </Paper>
      </Stack>
    </Layout>
  );
};
