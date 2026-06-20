export interface AppConfig {
  port: number;
  envFolder: string;
  envTemplateFolder: string;
  globPattern: string;
  templateSuffixes: string[];
  otelDenoEnabled: boolean;
}
