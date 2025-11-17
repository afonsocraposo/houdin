import { Account } from "./types/account";
import { sendMessageToBackground } from "@/lib/messages";

export class ApiClient {
  private static async fetch(
    path: string,
    options: RequestInit = {},
  ): Promise<Response> {
    const response = await sendMessageToBackground("HOUDIN_API", {
      path,
      options,
    });
    if (!response) {
      throw new Error("No response from Houdin API");
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  }

  static async getAccount(): Promise<Account | null> {
    const response = await this.fetch(`/account`, {
      credentials: "include",
    });
    if (!response.ok) {
      if (response.status === 401) {
        return null;
      }
      throw new Error(`Failed to fetch account: ${response.statusText}`);
    }
    return Account.parse(await response.json());
  }
}
