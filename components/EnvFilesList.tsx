import { ButtonLink, css, Icon, Stack, tokens } from "@dldc/hono-ui";
import { type FC, Fragment } from "hono/jsx";
import { AlertTriangle, FileKey } from "lucide-static";
import type { BackendFile } from "../logic/backend/types.ts";

type EnvFilesListProps = {
  envFiles: BackendFile[];
};

export const EnvFilesList: FC<EnvFilesListProps> = (
  { envFiles },
) => {
  const listClass = css({
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "grid",
    gap: "[0.65rem]",
  });

  const fileNameClass = css({
    fontWeight: "semibold",
    color: "neutral-100",
    fontFamily: "mono",
  });

  const emptyClass = css({
    fontSize: "sm",
    fontStyle: "italic",
    opacity: 0.8,
    margin: 0,
  });

  return (
    <Fragment>
      {envFiles.length > 0
        ? (
          <ul class={listClass}>
            {envFiles.map((file) => (
              <li key={file.name}>
                <ButtonLink
                  size={10}
                  classList={css({ width: "full" })}
                  href={`/env/${encodeURIComponent(file.name)}`}
                >
                  <Stack flexDirection="row" alignItems="center" gap={2}>
                    {file.source === "template"
                      ? (
                        <Icon
                          icon={AlertTriangle}
                          size={4}
                          color={tokens.c("amber-500")}
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
            No env files found. Add files matching ENV_GLOB under ENV_ROOT.
          </p>
        )}
    </Fragment>
  );
};
