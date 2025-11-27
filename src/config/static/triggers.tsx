import { initializeTriggers } from "@/services/triggerInitializer";
import { TriggerRegistry } from "@/services/triggerRegistry";
import StaticRenderer from "./StaticRenderer";

export default function AssetsTriggers() {
  initializeTriggers();
  const triggerRegistry = TriggerRegistry.getInstance();
  const assets = {
    triggers: triggerRegistry.getAllStatic(),
  };
  return (
    <StaticRenderer filename="triggers.json">
      {JSON.stringify(assets, null, 2)}
    </StaticRenderer>
  );
}
