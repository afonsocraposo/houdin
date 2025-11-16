import { Account } from "./types/account";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export class ApiClient {
  static async getAccount(): Promise<Account | null> {
    const response = await fetch(`${API_BASE_URL}/account`);
    if (!response.ok) {
      if (response.status === 401) {
        return null; // Not logged in
      }
      throw new Error(`Failed to fetch account: ${response.statusText}`);
    }
    return Account.parse(await response.json()); // Validate response data
  }
}
