import { initializeActions } from "@/services/actionInitializer";
import { ActionRegistry } from "@/services/actionRegistry";

export default function AssetsActions() {
  initializeActions();
  const actionRegistry = ActionRegistry.getInstance();
  const assets = {
    actions: actionRegistry.getAllStatic(),
  };
  return <pre>{JSON.stringify(assets, null, 2)}</pre>;
}
