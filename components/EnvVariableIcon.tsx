import { Icon, tokens } from "@dldc/hono-ui";
import {
  AlertTriangle,
  Braces,
  Circle,
  CircleQuestionMark,
  Sigma,
  ToggleLeft,
  Type,
} from "lucide-static";
import type { BackendFileVariable } from "../logic/backend/types.ts";

export function EnvVariableIcon(
  { variable }: { variable: BackendFileVariable },
) {
  const { icon, color } = ((): { icon: string; color: tokens.ColorKey } => {
    if (variable.source === "template") {
      if (variable.metadata.required) {
        return { icon: AlertTriangle, color: "amber.500" };
      }
      return { icon: CircleQuestionMark, color: "sky.500" };
    }
    if (variable.metadata.type === "boolean") {
      return { icon: ToggleLeft, color: "neutral.400" };
    }
    if (variable.metadata.type === "string") {
      return { icon: Type, color: "neutral.400" };
    }
    if (variable.metadata.type === "number") {
      return { icon: Sigma, color: "neutral.400" };
    }
    if (variable.metadata.type === "json") {
      return { icon: Braces, color: "neutral.400" };
    }
    return { icon: Circle, color: "neutral.400" };
  })();

  return (
    <Icon
      icon={icon}
      size={4}
      color={tokens.c(color)}
    />
  );
}
