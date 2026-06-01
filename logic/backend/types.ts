import type { EnvMetadata } from "../envFormat.ts";

export interface BackendFile {
  name: string; // relative path without template suffix, e.g. "production/.env" or "staging/.env.local"
  templatePath: string;
  envFilePath: string;
  fileExists: boolean; // whether the env file actually exists on disk, as opposed to just being a template without a corresponding env file yet
}

export interface BackendFileVariable {
  name: string;
  value: string;
  metadata: EnvMetadata;
  file: BackendFile;
  source: "env" | "template" | "both";
  exampleValue?: string;
}
