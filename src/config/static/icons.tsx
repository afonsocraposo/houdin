import { actionCatalog, triggerCatalog } from "@/services/nodeCatalog";
import StaticRenderer from "./StaticRenderer";

export default function AssetsIcons() {
  const nodes = [
    ...Object.values(actionCatalog),
    ...Object.values(triggerCatalog),
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
