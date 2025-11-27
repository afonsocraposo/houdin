import { initializeTriggers } from "@/services/triggerInitializer";
import { TriggerRegistry } from "@/services/triggerRegistry";

export default function AssetsTriggers() {
  initializeTriggers();
  const triggerRegistry = TriggerRegistry.getInstance();
  const assets = {
    triggers: triggerRegistry.getAllStatic(),
  };
  return <pre>{JSON.stringify(assets, null, 2)}</pre>;
}
