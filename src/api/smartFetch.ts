import { sendMessageToBackground } from "@/lib/messages";
import { isBackgroundContext } from "@/lib/context";

interface FetchProxyResponse {
  body: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  ok: boolean;
}

export async function smartFetch(
  url: string,
  options?: RequestInit,
): Promise<Response> {
  if (await isBackgroundContext()) {
    return fetch(url, options);
  }

  const result: FetchProxyResponse = await sendMessageToBackground(
    "PROXY_FETCH",
    {
      url,
      options,
    },
  );

  return new Response(result.body, {
    status: result.status,
    statusText: result.statusText,
    headers: new Headers(result.headers),
  });
}
