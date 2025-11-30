import { initializeActions } from "@/services/actionInitializer";
import { initializeTriggers } from "@/services/triggerInitializer";
import { ActionRegistry } from "@/services/actionRegistry";
import { TriggerRegistry } from "@/services/triggerRegistry";
import StaticRenderer from "./StaticRenderer";

export default function AssetsIcons() {
  initializeActions();
  initializeTriggers();
  const actionRegistry = ActionRegistry.getInstance();
  const triggerRegistry = TriggerRegistry.getInstance();
  const nodes = [
    ...Object.values(actionRegistry.getAllStatic()),
    ...Object.values(triggerRegistry.getAllStatic()),
  ];
  const icons = new Set<string>();
  nodes.forEach((node) => {
    const icon = node.metadata.icon;
    // check if icon is a componenttype
    if (icon.toString().startsWith("Icon")) {
      icons.add(icon.toString());
    }
  });
  const importStatement = `import { ${Array.from(icons).join(", ")} } from "@tabler/icons-react";\n\n`;
  const mapperEntries = Array.from(icons)
    .map((icon) => `  "${icon}": ${icon}`)
    .join(",\n");
  const mapperString = `const iconMapper: Record<string, any> = {\n${mapperEntries}\n};\n\nexport default iconMapper;\n`;

  return (
    <StaticRenderer filename="iconMapper.ts">
      {importStatement + mapperString}
    </StaticRenderer>
  );
}
