export const TIMEOUT_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
export class ModalService {
  public static showModal({
    title,
    content,
  }: {
    title: string;
    content: string;
    callback?: (data: any) => void;
  }): void {
    const modalEvent = new CustomEvent("modalDispatch", {
      detail: {
        type: "customModal",
        data: { title, content },
      },
    });
    window.dispatchEvent(modalEvent);
  }

  public static async showInputModal(
    id: string,
    {
      title,
    }: {
      title: string;
    },
  ): Promise<any> {
    const modalEvent = new CustomEvent("modalDispatch", {
      detail: {
        type: "inputModal",
        data: { id, title },
      },
    });
    window.dispatchEvent(modalEvent);
    return new Promise((resolve, reject) => {
      const handleResponse = (event: any) => {
        // Ensure the response is for the correct modal instance
        if (event.detail.id !== id) {
          return;
        }
        window.removeEventListener("inputModalResponse", handleResponse);
        resolve({
          input: event.detail.input,
          timestamp: Date.now(),
        });
      };
      window.addEventListener("inputModalResponse", handleResponse);
      // Optional: Add a timeout to reject the promise if no response is received
      setTimeout(() => {
        window.removeEventListener("inputModalResponse", handleResponse);
        reject(new Error("Input modal response timed out"));
      }, TIMEOUT_DURATION);
    });
  }
}
