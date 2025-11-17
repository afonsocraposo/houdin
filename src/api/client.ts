import { Account } from "./types/account";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://houdin.dev/api";

export class ApiClient {
  static async getAccount(): Promise<Account | null> {
    const response = await fetch(`${API_BASE_URL}/account`, {
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
