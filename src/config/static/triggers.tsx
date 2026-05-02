import { triggerCatalog } from "@/services/nodeCatalog";
import StaticRenderer from "./StaticRenderer";

export default function AssetsTriggers() {
  const assets = {
    triggers: triggerCatalog,
  };
  return (
    <StaticRenderer filename="triggers.json">
      {JSON.stringify(assets, null, 2)}
    </StaticRenderer>
  );
}
