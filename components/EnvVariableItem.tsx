import { Stack, utility } from "@dldc/hono-ui";
import { css } from "hono/css";
import type { FC } from "hono/jsx";
import type { BackendFileVariable } from "../logic/backend/types.ts";
import { EnvVariableIcon } from "./EnvVariableIcon.tsx";
import { VariableValueDisplay } from "./EnvVariableItem/VariableValueDisplay.tsx";
import { EnvVariableMetadataTags } from "./EnvVariableMetadataTags.tsx";

type EnvVariableItemProps = {
  envFileName: string;
  variable: BackendFileVariable;
};

export const EnvVariableItem: FC<EnvVariableItemProps> = (
  { envFileName, variable },
) => {
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

  const descriptionClass = css`
    ${utility.textSize("sm")};
    ${utility.textColor("neutral.500")};
    margin: 0;
  `;

  return (
    <Stack render="li" direction="column" gap={2}>
      <Stack direction="column" gap={1} class={sectionClass}>
        <Stack direction="row" align="center" gap={2} class={nameRowClass}>
          <EnvVariableIcon variable={variable} />
          <span class={nameClass}>{variable.name}</span>
          <EnvVariableMetadataTags metadata={variable.metadata} />
        </Stack>

        {variable.metadata.description
          ? <p class={descriptionClass}>{variable.metadata.description}</p>
          : null}
      </Stack>

      <VariableValueDisplay
        envFileName={envFileName}
        variable={variable}
      />
    </Stack>
  );
};
