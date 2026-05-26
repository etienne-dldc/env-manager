import { css, Stack } from "@dldc/hono-ui";
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
  const sectionClass = css({
    minWidth: 0,
  });

  const nameRowClass = css({
    flexWrap: "wrap",
  });

  const nameClass = css({
    fontFamily: "mono",
  });

  const descriptionClass = css({
    fontSize: "sm",
    color: "neutral-500",
    margin: 0,
  });

  return (
    <Stack render="li" flexDirection="column" gap={2}>
      <Stack flexDirection="column" gap={1} classList={sectionClass}>
        <Stack
          flexDirection="row"
          alignItems="center"
          gap={2}
          classList={nameRowClass}
        >
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
