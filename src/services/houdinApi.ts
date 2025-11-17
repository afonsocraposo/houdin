import browser from "./browser";

export class HoudinApi {
  private static instance: HoudinApi | null = null;
  constructor(public baseUrl: string = import.meta.env.VITE_API_BASE_URL) {
    browser.runtime.onMessage.addListener((message: any, _sender: any) => {
      if (message.type === "HOUDIN_API") {
        const { path, options } = message.data;
        return this.fetch(path, options)
          .then(async (response) => {
            return {
              body: await response.text(),
              status: response.status,
              statusText: response.statusText,
              headers: Object.fromEntries(response.headers.entries()),
              ok: response.ok,
              url: response.url,
            };
          })
          .catch((error: any) => {
            console.error("HoudinApi: Error handling message", {
              message,
              error,
            });
            throw error;
          });
      }
    });
  }

  private async fetch(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    return fetch(url, options);
  }

  static getInstance(): HoudinApi {
    if (!HoudinApi.instance) {
      HoudinApi.instance = new HoudinApi();
    }
    return HoudinApi.instance;
  }
}
