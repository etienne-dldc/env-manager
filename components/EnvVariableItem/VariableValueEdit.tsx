import {
  Button,
  Icon,
  InlineGroup,
  Input,
  Stack,
  utility,
} from "@dldc/hono-ui";
import { css, cx } from "hono/css";
import type { FC } from "hono/jsx";
import { Check, X } from "lucide-static";
import { buildUrl } from "../../logic/buildUrl.ts";
import type { EnvFileVariable } from "../../logic/envFiles.ts";
import { randomId } from "../../logic/randomId.ts";

type VariableValueEditProps = {
  envFileName: string;
  variable: EnvFileVariable;
};

export const VariableValueEdit: FC<VariableValueEditProps> = (
  { envFileName, variable },
) => {
  const sectionClass = css`
    min-width: 0;
  `;

  const fieldLabelClass = css`
    ${utility.textSize("xs")};
    opacity: 0.7;
    ${utility.fontWeight("semibold")};
    letter-spacing: 0.01em;
    text-transform: uppercase;
  `;

  const srOnlyClass = css`
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  `;

  const id = randomId();

  return (
    <form
      id={id}
      hx-post="/partial/variable/edit"
      hx-swap="outerHTML"
    >
      <input type="hidden" name="envFileName" value={envFileName} />
      <input type="hidden" name="variableName" value={variable.name} />
      <Stack direction="column" gap={0.5} class={sectionClass}>
        <span class={cx(fieldLabelClass, srOnlyClass)}>Value</span>
        <InlineGroup>
          <Input
            type="text"
            name="value"
            value={variable.metadata.secret ? "" : variable.value}
            placeholder={variable.missingInEnv
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
            hx-target={`#${id}`}
            hx-swap="outerHTML"
          >
            <Icon icon={X} size={4} />
          </Button>
        </InlineGroup>
      </Stack>
    </form>
  );
};
