import { initializeActions } from "@/services/actionInitializer";
import { ActionRegistry } from "@/services/actionRegistry";
import StaticRenderer from "./StaticRenderer";

export default function AssetsActions() {
  initializeActions();
  const actionRegistry = ActionRegistry.getInstance();
  const assets = {
    actions: actionRegistry.getAllStatic(),
  };
  return (
    <StaticRenderer filename="actions.json">
      {JSON.stringify(assets, null, 2)}
    </StaticRenderer>
  );
}
