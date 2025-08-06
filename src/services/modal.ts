export class ModalService {
  public static showModal({
    title,
    content,
  }: {
    title: string;
    content: string;
  }): void {
    const modalEvent = new CustomEvent("modalDispatch", {
      detail: {
        type: "customModal",
        data: { title, content },
      },
    });
    window.dispatchEvent(modalEvent);
  }
}
