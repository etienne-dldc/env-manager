import { ButtonLink, Icon, Stack, tokens, utility } from "@dldc/hono-ui";
import { css } from "hono/css";
import { type FC, Fragment } from "hono/jsx";
import { AlertTriangle, FileKey } from "lucide-static";
import type { EnvFileListItem } from "../logic/envFiles.ts";

type EnvFilesListProps = {
  envFiles: EnvFileListItem[];
};

export const EnvFilesList: FC<EnvFilesListProps> = (
  { envFiles },
) => {
  const listClass = css`
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.65rem;
  `;

  const fileNameClass = css`
    ${utility.fontWeight("semibold")};
    ${utility.textColor("neutral.100")};
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  `;

  const emptyClass = css`
    ${utility.textSize("sm")};
    font-style: italic;
    opacity: 0.8;
    margin: 0;
  `;

  return (
    <Fragment>
      {envFiles.length > 0
        ? (
          <ul class={listClass}>
            {envFiles.map((file) => (
              <li key={file.name}>
                <ButtonLink
                  size={10}
                  class={css`
                    width: 100%;
                  `}
                  href={`/env/${encodeURIComponent(file.name)}`}
                >
                  <Stack direction="row" align="center" gap={2}>
                    {file.missingInEnv
                      ? (
                        <Icon
                          icon={AlertTriangle}
                          size={4}
                          color={tokens.c("amber.500")}
                        />
                      )
                      : <Icon icon={FileKey} size={4} />}
                    <span class={fileNameClass}>{file.name}</span>
                  </Stack>
                </ButtonLink>
              </li>
            ))}
          </ul>
        )
        : (
          <p class={emptyClass}>
            No env files found. Add files with names like .env.app in env or
            template folders.
          </p>
        )}
    </Fragment>
  );
};
