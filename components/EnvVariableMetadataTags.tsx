import { Tag } from "@dldc/hono-ui";
import { css } from "hono/css";
import type { FC } from "hono/jsx";
import type { EnvMetadata } from "../logic/envFormat.ts";

type EnvVariableMetadataTagsProps = {
  metadata: EnvMetadata;
};

export const EnvVariableMetadataTags: FC<EnvVariableMetadataTagsProps> = (
  { metadata },
) => {
  const tagsRowClass = css`
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  `;

  return (
    <div class={tagsRowClass}>
      {metadata.type ? <Tag>{`type: ${metadata.type}`}</Tag> : null}
      {metadata.secret ? <Tag color="red.500">secret</Tag> : null}
      {metadata.optional ? <Tag color="gray.500">optional</Tag> : null}
      {metadata.length !== undefined
        ? <Tag color="blue.500">{`length: ${metadata.length}`}</Tag>
        : null}
      {metadata.generate ? <Tag color="green.500">generate</Tag> : null}
    </div>
  );
};
