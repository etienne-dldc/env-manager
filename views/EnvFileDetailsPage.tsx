import {
  Button,
  css,
  InlineGroup,
  Input,
  Link,
  Paper,
  srOnlyClass,
  Stack,
  Typography,
} from "@dldc/hono-ui";
import type { FC } from "hono/jsx";
import { EnvVariableItem } from "../components/EnvVariableItem.tsx";
import { Layout } from "../components/Layout.tsx";
import type { BackendFileVariable } from "../logic/backend/types.ts";

type EnvFileDetails = {
  name: string;
  variables: BackendFileVariable[];
};

type EnvFileDetailsPageProps = {
  envFile: EnvFileDetails;
  ok?: string | null;
  error?: string | null;
};

export const EnvFileDetailsPage: FC<EnvFileDetailsPageProps> = (
  { envFile, ok, error },
) => {
  const countClass = css({
    fontSize: "sm",
    opacity: 0.75,
    margin: 0,
  });

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

  return (
    <Layout title={envFile.name} ok={ok} error={error}>
      <Stack flexDirection="column" gap={3}>
        <Link href="/">
          ← Back to env files
        </Link>

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

            <form
              method="post"
              action={`/env/${encodeURIComponent(envFile.name)}/variable`}
              class={css({
                display: "flex",
                flexDirection: "column",
                gap: 2,
                alignItems: "stretch",
              })}
            >
              <label for="variableName" class={srOnlyClass}>
                Variable name
              </label>
              <InlineGroup>
                <Input
                  id="variableName"
                  name="variableName"
                  type="text"
                  placeholder="VARIABLE_NAME"
                  required
                  size={10}
                  autocomplete="off"
                  spellCheck={false}
                  classList={css({ flex: "1" })}
                />
                <Button type="submit" variant="primary" size={10}>
                  Add variable
                </Button>
              </InlineGroup>
            </form>
          </Stack>
        </Paper>
      </Stack>
    </Layout>
  );
};
