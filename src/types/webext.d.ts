// WebExtensions API type declarations for Firefox compatibility
declare namespace browser {
  namespace storage {
    interface StorageArea {
      get(keys?: string | string[] | object): Promise<any>
      set(items: object): Promise<void>
      remove(keys: string | string[]): Promise<void>
      clear(): Promise<void>
      getBytesInUse?(keys?: string | string[]): Promise<number>
    }

    const sync: StorageArea
    const local: StorageArea

    namespace onChanged {
      function addListener(callback: (changes: any, areaName: string) => void): void
    }
  }

  namespace runtime {
    const lastError: { message: string } | undefined
  }
}