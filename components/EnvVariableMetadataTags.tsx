import { Stack, Tag } from "@dldc/hono-ui";
import type { FC } from "hono/jsx";
import type { EnvMetadata } from "../logic/envFormat.ts";

type EnvVariableMetadataTagsProps = {
  metadata: EnvMetadata;
};

export const EnvVariableMetadataTags: FC<EnvVariableMetadataTagsProps> = (
  { metadata },
) => {
  return (
    <Stack direction="row" align="center" gap={2}>
      {metadata.type ? <Tag>{`type: ${metadata.type}`}</Tag> : null}
      {metadata.secret ? <Tag color="red.500">secret</Tag> : null}
      {metadata.required ? <Tag color="gray.500">required</Tag> : null}
      {metadata.length !== undefined
        ? <Tag color="blue.500">{`length: ${metadata.length}`}</Tag>
        : null}
      {metadata.generate ? <Tag color="green.500">generate</Tag> : null}
    </Stack>
  );
};
