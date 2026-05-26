import {
  Button,
  css,
  Icon,
  InlineGroup,
  Input,
  SrOnly,
  Stack,
} from "@dldc/hono-ui";
import type { FC } from "hono/jsx";
import { Pencil, RefreshCcw } from "lucide-static";
import type { BackendFileVariable } from "../../logic/backend/types.ts";
import { buildUrl } from "../../logic/buildUrl.ts";
import { randomId } from "../../logic/randomId.ts";

const SECRET_PLACEHOLDER = "******";

type VariableValueDisplayProps = {
  envFileName: string;
  variable: BackendFileVariable;
};

export const VariableValueDisplay: FC<VariableValueDisplayProps> = (
  { envFileName, variable },
) => {
  const id = randomId();
  const canRegenerate = variable.metadata.generate === true &&
    typeof variable.metadata.length === "number";
  const displayValue =
    variable.metadata.secret && variable.source !== "template"
      ? SECRET_PLACEHOLDER
      : variable.value;

  return (
    <Stack id={id} flexDirection="column" gap={2}>
      <InlineGroup>
        <Input
          type="text"
          value={displayValue}
          placeholder={variable.source === "template"
            ? variable.exampleValue
            : undefined}
          readonly
          spellCheck={false}
          size={10}
          classList={css({
            fontFamily: "mono",
            flex: "1",
          })}
        />
        <Button
          type="button"
          size={10}
          aria-label={`Edit ${variable.name}`}
          hx-get={buildUrl("/partial/variable/edit", {
            envFileName,
            variableName: variable.name,
          })}
          hx-target={`#${id}`}
          hx-swap="outerHTML"
        >
          <Icon icon={Pencil} size={4} />
          <SrOnly>Edit {variable.name}</SrOnly>
        </Button>
        {canRegenerate
          ? (
            <Button
              type="button"
              size={10}
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
              <SrOnly>Regenerate {variable.name}</SrOnly>
            </Button>
          )
          : null}
      </InlineGroup>
    </Stack>
  );
};
