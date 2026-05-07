const ALL_VARIABLE_TYPES = ["string", "number", "boolean", "json"] as const;

export type VariableType = (typeof ALL_VARIABLE_TYPES)[number];

export type EnvMetadata = {
  description?: string;
  type?: VariableType;
  secret?: boolean;
  optional?: boolean;
  length?: number;
  generate?: boolean;
};

export type EnvVariable = {
  name: string;
  value: string;
  metadata: EnvMetadata;
};

// Parse metadata comments from an array of comment lines
function parseMetadata(commentLines: string[]): EnvMetadata {
  const metadata: EnvMetadata = {};

  for (const line of commentLines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("# @description ")) {
      metadata.description = trimmed.substring("# @description ".length).trim();
    } else if (trimmed.startsWith("# @type ")) {
      const type = trimmed.substring("# @type ".length).trim();
      if (ALL_VARIABLE_TYPES.includes(type as VariableType)) {
        metadata.type = type as VariableType;
      }
    } else if (trimmed === "# @secret") {
      metadata.secret = true;
    } else if (trimmed === "# @optional") {
      metadata.optional = true;
    } else if (trimmed.startsWith("# @length ")) {
      const length = parseInt(trimmed.substring("# @length ".length).trim());
      if (!isNaN(length)) {
        metadata.length = length;
      }
    } else if (trimmed === "# @generate") {
      metadata.generate = true;
    }
  }

  return metadata;
}

// Parse an env file and extract variables with their metadata
export function parseEnvFile(content: string): EnvVariable[] {
  const lines = content.split("\n");
  const variables: EnvVariable[] = [];
  let currentComments: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      currentComments = [];
      continue;
    }

    // Collect comment lines
    if (trimmed.startsWith("#")) {
      currentComments.push(line);
      continue;
    }

    // Parse variable line (KEY=VALUE)
    const eqIndex = line.indexOf("=");
    if (eqIndex > 0) {
      const name = line.substring(0, eqIndex).trim();
      const value = line.substring(eqIndex + 1);

      // Only accept valid variable names
      if (/^[A-Z_][A-Z0-9_]*$/i.test(name)) {
        variables.push({
          name,
          value,
          metadata: parseMetadata(currentComments),
        });
      }

      currentComments = [];
    }
  }

  return variables;
}

// Serialize variables back to env file format
export function serializeEnvFile(variables: EnvVariable[]): string {
  const lines: string[] = [];

  for (const variable of variables) {
    const { name, value, metadata } = variable;

    // Add metadata comments
    if (metadata.description) {
      lines.push(`# @description ${metadata.description}`);
    }

    if (metadata.type) {
      lines.push(`# @type ${metadata.type}`);
    }

    if (metadata.secret) {
      lines.push("# @secret");
    }

    if (metadata.optional) {
      lines.push("# @optional");
    }

    if (metadata.length !== undefined) {
      lines.push(`# @length ${metadata.length}`);
    }

    if (metadata.generate) {
      lines.push("# @generate");
    }

    // Add variable line
    lines.push(`${name}=${value}`);

    // Add blank line between variables (except after the last one)
    if (variable !== variables[variables.length - 1]) {
      lines.push("");
    }
  }

  return lines.join("\n");
}
