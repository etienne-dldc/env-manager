import {
  Button,
  Icon,
  InlineGroup,
  Input,
  Stack,
  utility,
} from "@dldc/hono-ui";
import { css } from "hono/css";
import type { FC } from "hono/jsx";
import { Pencil, RefreshCcw } from "lucide-static";
import { buildUrl } from "../../logic/buildUrl.ts";
import type { EnvFileVariable } from "../../logic/envFiles.ts";
import { randomId } from "../../logic/randomId.ts";

type VariableValueDisplayProps = {
  envFileName: string;
  variable: EnvFileVariable;
};

export const VariableValueDisplay: FC<VariableValueDisplayProps> = (
  { envFileName, variable },
) => {
  const id = randomId();
  const canRegenerate = variable.metadata.generate === true &&
    typeof variable.metadata.length === "number";

  return (
    <Stack id={id} direction="column" gap={2}>
      <InlineGroup>
        <Input
          type="text"
          value={variable.value}
          placeholder={variable.missingInEnv
            ? variable.exampleValue
            : undefined}
          readOnly
          spellCheck={false}
          size={10}
          class={css`
            ${utility.fontFamily("mono")};
            flex: 1;
          `}
        />
        <Button
          type="button"
          size={10}
          title={`Edit ${variable.name}`}
          aria-label={`Edit ${variable.name}`}
          hx-get={buildUrl("/partial/variable/edit", {
            envFileName,
            variableName: variable.name,
          })}
          hx-target={`#${id}`}
          hx-swap="outerHTML"
        >
          <Icon icon={Pencil} size={4} />
        </Button>
        {canRegenerate
          ? (
            <Button
              type="button"
              size={10}
              title={`Regenerate ${variable.name}`}
              aria-label={`Regenerate ${variable.name}`}
              hx-post={buildUrl("/partial/variable/generate", {
                envFileName,
                variableName: variable.name,
              })}
              hx-target={`#${id}`}
              hx-swap="outerHTML"
              hx-confirm={`Regenerate ${variable.name}? This will replace the current value.`}
            >
              <Icon icon={RefreshCcw} size={4} />
            </Button>
          )
          : null}
      </InlineGroup>
    </Stack>
  );
};
