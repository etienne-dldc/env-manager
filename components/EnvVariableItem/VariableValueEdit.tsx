import {
  Button,
  Icon,
  InlineGroup,
  Input,
  Stack,
  Toggle,
  utility,
} from "@dldc/hono-ui";
import { css } from "hono/css";
import type { FC } from "hono/jsx";
import { Check, X } from "lucide-static";
import type { BackendFileVariable } from "../../logic/backend/types.ts";
import { buildUrl } from "../../logic/buildUrl.ts";
import { randomId } from "../../logic/randomId.ts";

type VariableValueEditProps = {
  envFileName: string;
  variable: BackendFileVariable;
};

export const VariableValueEdit: FC<VariableValueEditProps> = (
  { envFileName, variable },
) => {
  const id = randomId();

  return (
    <form
      id={id}
      hx-post="/partial/variable/edit"
      hx-swap="outerHTML"
    >
      <input type="hidden" name="envFileName" value={envFileName} />
      <input type="hidden" name="variableName" value={variable.name} />
      {(() => {
        if (variable.metadata.type === "boolean") {
          return (
            <BooleanEdit
              variable={variable}
              envFileName={envFileName}
              parentId={id}
            />
          );
        }
        return (
          <TextEdit
            variable={variable}
            envFileName={envFileName}
            parentId={id}
          />
        );
      })()}
    </form>
  );
};

function TextEdit(
  { variable, envFileName, parentId }: {
    variable: BackendFileVariable;
    envFileName: string;
    parentId: string;
  },
) {
  return (
    <Stack direction="column" gap={0.5} inlines={["min-width: 0"]}>
      <span
        class={css`
          ${utility.srOnly};
        `}
      >
        Value
      </span>{" "}
      <InlineGroup>
        <Input
          type="text"
          name="value"
          value={variable.metadata.secret ? "" : variable.value}
          placeholder={variable.source === "template"
            ? variable.exampleValue
            : undefined}
          spellCheck={false}
          size={10}
          class={css`
            ${utility.fontFamily("mono")};
            flex: 1;
          `}
          autoFocus
        />
        <Button
          type="submit"
          size={10}
          title={`Save ${variable.name}`}
          aria-label={`Save ${variable.name}`}
        >
          <Icon icon={Check} size={4} />
        </Button>
        <Button
          type="button"
          size={10}
          title={`Cancel ${variable.name}`}
          aria-label={`Cancel ${variable.name}`}
          hx-get={buildUrl("/partial/variable/display", {
            envFileName,
            variableName: variable.name,
          })}
          hx-target={`#${parentId}`}
          hx-swap="outerHTML"
        >
          <Icon icon={X} size={4} />
        </Button>
      </InlineGroup>
    </Stack>
  );
}

function BooleanEdit(
  { variable, envFileName, parentId }: {
    variable: BackendFileVariable;
    envFileName: string;
    parentId: string;
  },
) {
  return (
    <Stack
      direction="row"
      align="center"
      justify="between"
      gap={0.5}
      inlines={["min-width: 0"]}
    >
      <Toggle name="value" checked={variable.value === "true"} />
      <InlineGroup>
        <Button
          type="submit"
          title={`Save ${variable.name}`}
          aria-label={`Save ${variable.name}`}
          size={10}
        >
          <Icon icon={Check} size={4} />
        </Button>
        <Button
          type="button"
          title={`Cancel ${variable.name}`}
          aria-label={`Cancel ${variable.name}`}
          size={10}
          hx-get={buildUrl("/partial/variable/display", {
            envFileName,
            variableName: variable.name,
          })}
          hx-target={`#${parentId}`}
          hx-swap="outerHTML"
        >
          <Icon icon={X} size={4} />
        </Button>
      </InlineGroup>
    </Stack>
  );
}
