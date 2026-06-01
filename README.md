# Env Manager

> A simple web UI to manage env files

## How it works

This project create a UI for managing env files. It takes your infra folder as
base with some .env "templates" (e.g. `.env.app.example`) and let you
create/edit corresponding .env files (e.g. `.env.app`) in a specified env files
folder. When reading the template files, the app parse the metadata comments to
extract information about each variable, such as description, type, and options.
This allows the UI to provide a better experience when editing variables.

## Templates files

The app will only let you edit files that have a corresponding template file.
For example, if you have a template file named `.env.app.example`, you will be
able to edit the corresponding `.env.app` file. If the `.env.app` file does not
exist, it will be created when you first edit one of its variables.

## Templates Env file format

This project use comments in env files to store metadata about each variable,
such as description, type, and options. This allows the UI to provide a better
experience when editing variables.

Example of an env file with metadata comments:

```env
# @description The port the app listens on
# @type number
PORT=3000

# @description Database secret
# @type string
# @secret
DB_PASSWORD=supersecret
```

_Note_: In template files, the variable values are used as placeholders and are
not important.

## Available metadata tags:

- `@description`: A description of the variable, displayed in the UI.
- `@type`: The type of the variable, see below for supported types.
- `@secret`: A flag to indicate that the variable is a secret. Secrets value are
  never displayed in the UI, they can only be replaced. Once a variable is
  marked as secret, it cannot be unmarked. This is to prevent accidental
  exposure of secrets.
- `@required`: A flag to indicate that the variable is required. This is
  particularly useful when using a template, as it allows to differentiate
  between variables that are required and those that are optional.
- `@length`: A number to indicate the expected length of the variable value.
  This is useful for variables that have a fixed length, such as API keys or
  secrets.
- `@generate`: A flag to indicate that the variable value can be generated.

## Supported types

- `string`: A simple string variable.
- `number`: A variable that should be a number. The UI will provide a number
  input for this type.
- `boolean`: A variable that should be a boolean. The UI will provide a toggle
  switch for this type and will set `true` or `false` as value.
- `json`: A variable that should contain valid JSON. The UI will provide a text
  input for this type and the value will be validated as JSON.

## OpenTelemetry

This app uses Deno's built-in OpenTelemetry integration:
https://docs.deno.com/runtime/fundamentals/open_telemetry/

Telemetry can be enabled by setting `OTEL_DENO=true`.

Useful environment variables:

- `OTEL_DENO=true` to enable OpenTelemetry.
- `OTEL_SERVICE_NAME=env-manager` to set the service name.
- `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318` to point to an OTLP
  collector.
- `OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf` (default) or `console` for
  debugging.
- `OTEL_DENO_CONSOLE=capture|ignore|replace` to control whether `console.*` logs
  are exported.

For Docker/Swarm deployments, set these variables in the service environment.
