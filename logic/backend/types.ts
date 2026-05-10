import type { EnvMetadata } from "../envFormat.ts";

export interface BackendFile {
  name: string;
  source: "env" | "template" | "both";
  envFilePath: string | null;
  templateFilePath: string | null;
}

export interface BackendFileVariable {
  name: string;
  value: string;
  metadata: EnvMetadata;
  file: BackendFile;
  source: "env" | "template" | "both";
  exampleValue?: string;
}
