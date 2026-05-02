import { actionCatalog } from "@/services/nodeCatalog";
import StaticRenderer from "./StaticRenderer";

export default function AssetsActions() {
  const assets = {
    actions: actionCatalog,
  };
  return (
    <StaticRenderer filename="actions.json">
      {JSON.stringify(assets, null, 2)}
    </StaticRenderer>
  );
}
