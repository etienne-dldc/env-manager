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
import { AlertTriangle, Check, CircleHelp, X } from "lucide-static";
import type { EnvFileVariable } from "../logic/envFiles.ts";
import { EnvVariableMetadataTags } from "./EnvVariableMetadataTags.tsx";
import { getVariableRowId } from "./EnvVariableReadonlyItem.tsx";

type EnvVariableEditableItemProps = {
  envFileName: string;
  variable: EnvFileVariable;
};

export const EnvVariableEditableItem: FC<EnvVariableEditableItemProps> = (
  { envFileName, variable },
) => {
  const itemClass = css`
    padding: 0.4rem 0;
  `;

  const sectionClass = css`
    min-width: 0;
  `;

  const nameRowClass = css`
    flex-wrap: wrap;
  `;

  const nameClass = css`
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    ${utility.fontWeight("bold")};
  `;

  const warningIconClass = css`
    ${utility.textColor("amber.500")};
    flex: none;
  `;

  const optionalIconClass = css`
    ${utility.textColor("sky.500")};
    flex: none;
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

  const descriptionClass = css`
    ${utility.textSize("sm")};
    ${utility.textColor("neutral.500")};
    margin: 0;
  `;

  const rowId = getVariableRowId(variable.name);
  const updateUrl = `/partial/env/${
    encodeURIComponent(envFileName)
  }/variables/${encodeURIComponent(variable.name)}`;

  return (
    <li id={rowId} class={itemClass}>
      <Stack direction="column" gap={2}>
        <Stack direction="column" gap={1} class={sectionClass}>
          <Stack
            direction="row"
            align="center"
            gap={2}
            class={nameRowClass}
          >
            {variable.missingInEnv
              ? (
                variable.metadata.optional
                  ? (
                    <Icon
                      icon={CircleHelp}
                      size={4}
                      class={optionalIconClass}
                      title="Optional variable missing in env"
                    />
                  )
                  : (
                    <Icon
                      icon={AlertTriangle}
                      size={4}
                      class={warningIconClass}
                      title="Required variable missing in env"
                    />
                  )
              )
              : null}
            <span class={nameClass}>{variable.name}</span>
            <EnvVariableMetadataTags metadata={variable.metadata} />
          </Stack>

          {variable.metadata.description
            ? <p class={descriptionClass}>{variable.metadata.description}</p>
            : null}
        </Stack>

        <form
          method="post"
          action={updateUrl}
          hx-post={updateUrl}
          hx-target={`#${rowId}`}
          hx-swap="outerHTML"
        >
          <Stack direction="column" gap={0.5} class={sectionClass}>
            <span class={cx(fieldLabelClass, srOnlyClass)}>Value</span>
            <InlineGroup>
              <Input
                type="text"
                name="value"
                value={variable.value}
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
                hx-get={updateUrl}
                hx-target={`#${rowId}`}
                hx-swap="outerHTML"
              >
                <Icon icon={X} size={4} />
              </Button>
            </InlineGroup>
          </Stack>
        </form>
      </Stack>
    </li>
  );
};
