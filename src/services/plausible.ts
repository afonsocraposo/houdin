import { useStore } from "@/store";
import { getVersion } from "@/utils/version";

const PLAUSIBLE_ENDPOINT = "https://plausible.afonso.app/api/event";
const DOMAIN = "houdin";

export enum PlausibleEvent {
  WorkflowCreated = "workflow_created",
  WorkflowDeleted = "workflow_deleted",
  WorkflowEdited = "workflow_edited",
  WorkflowSuccess = "workflow_success",
  WorkflowError = "workflow_error",
  VersionInstalled = "version_installed",
}

const trackPlausible = async (
  name: string,
  url: string,
  props?: Record<string, string>,
) => {
  if (!import.meta.env.PROD) {
    return;
  }
  if (!useStore.getState().settings.general.analytics) {
    return;
  }

  await fetch(PLAUSIBLE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": navigator.userAgent,
    },
    body: JSON.stringify({
      domain: DOMAIN,
      name,
      url,
      props,
    }),
  });
};

export const trackPageView = async (url: string) => {
  await trackPlausible("pageview", url, {
    version: getVersion(),
  });
};

export const trackCustomEvent = async (
  name: string,
  url: string,
  props?: Record<string, string>,
) => {
  await trackPlausible(name, url, props);
};
