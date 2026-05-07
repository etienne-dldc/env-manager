import { Input, Stack, utility } from "@dldc/hono-ui";
import { css, cx } from "hono/css";
import type { FC } from "hono/jsx";
import type { EnvFileVariable } from "../logic/envFiles.ts";
import { EnvVariableMetadataTags } from "./EnvVariableMetadataTags.tsx";
import { VariableIcon } from "./VariableIcon.tsx";

type EnvVariableReadonlyItemProps = {
  variable: EnvFileVariable;
};

export const EnvVariableReadonlyItem: FC<EnvVariableReadonlyItemProps> = (
  { variable },
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

  return (
    <li class={itemClass}>
      <Stack direction="column" gap={2}>
        <Stack direction="column" gap={1} class={sectionClass}>
          <Stack
            direction="row"
            align="center"
            gap={2}
            class={nameRowClass}
          >
            <VariableIcon variable={variable} />
            <span class={nameClass}>{variable.name}</span>
            <EnvVariableMetadataTags metadata={variable.metadata} />
          </Stack>

          {variable.metadata.description
            ? <p class={descriptionClass}>{variable.metadata.description}</p>
            : null}
        </Stack>

        <Stack direction="column" gap={0.5} class={sectionClass}>
          <span class={cx(fieldLabelClass, srOnlyClass)}>Value</span>
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
            `}
          />
        </Stack>
      </Stack>
    </li>
  );
};
