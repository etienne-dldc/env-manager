import { Button, css, InlineGroup, Input, srOnlyClass } from "@dldc/hono-ui";

interface CreateVariableFormProps {
  envFileName: string;
}

export function CreateVariableForm({ envFileName }: CreateVariableFormProps) {
  return (
    <form
      method="post"
      action={`/env/${encodeURIComponent(envFileName)}/variable`}
      class={css({
        display: "flex",
        flexDirection: "column",
        gap: 2,
        alignItems: "stretch",
      })}
    >
      <label for="variableName" class={srOnlyClass}>
        Variable name
      </label>
      <InlineGroup>
        <Input
          id="variableName"
          name="variableName"
          type="text"
          placeholder="VARIABLE_NAME"
          required
          size={10}
          autocomplete="off"
          spellCheck={false}
          classList={css({ flex: "1" })}
        />
        <Button type="submit" variant="primary" size={10}>
          Add variable
        </Button>
      </InlineGroup>
    </form>
  );
}
