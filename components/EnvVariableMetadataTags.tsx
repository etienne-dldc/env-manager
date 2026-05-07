import { css } from "hono/css";
import type { FC } from "hono/jsx";
import type { EnvMetadata } from "../logic/envFormat.ts";
import { Tag } from "./Tag.tsx";

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
      {metadata.type ? <Tag tone="info">{`type: ${metadata.type}`}</Tag> : null}
      {metadata.secret ? <Tag tone="warning">secret</Tag> : null}
      {metadata.optional ? <Tag tone="neutral">optional</Tag> : null}
      {metadata.length !== undefined
        ? <Tag tone="neutral">{`length: ${metadata.length}`}</Tag>
        : null}
      {metadata.generate ? <Tag tone="success">generate</Tag> : null}
    </div>
  );
};
