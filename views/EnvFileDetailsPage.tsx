import {
  Button,
  InlineGroup,
  Input,
  Link,
  Paper,
  Stack,
  Typography,
  utility,
} from "@dldc/hono-ui";
import { css } from "hono/css";
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
    <Layout title={envFile.name} ok={ok} error={error}>
      <Stack direction="column" gap={3}>
        <Link href="/">
          ← Back to env files
        </Link>

        <Paper flexDirection="column" align="stretch">
          <Stack direction="column" gap={6} padding={4}>
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

            <form
              method="post"
              action={`/env/${encodeURIComponent(envFile.name)}/variable`}
              class={css`
                ${utility.flex({
                  gap: 2,
                  direction: "column",
                  align: "stretch",
                })};
              `}
            >
              <label
                for="variableName"
                class={css`
                  ${utility.srOnly};
                `}
              >
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
                  autoComplete="off"
                  spellCheck={false}
                  class={css`
                    flex: 1;
                  `}
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
