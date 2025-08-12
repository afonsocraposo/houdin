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

// Chrome userScripts API type declarations
declare namespace chrome {
  namespace userScripts {
    interface RegisteredUserScript {
      id: string
      js?: Array<{ code?: string; file?: string }>
      css?: Array<{ code?: string; file?: string }>
      matches: string[]
      excludeMatches?: string[]
      runAt?: "document_start" | "document_end" | "document_idle"
      world?: "ISOLATED" | "MAIN" | "USER_SCRIPT"
      allFrames?: boolean
    }

    interface UnregisterFilter {
      ids?: string[]
    }

    interface InjectionTarget {
      tabId: number
      frameIds?: number[]
      allFrames?: boolean
      documentIds?: string[]
    }

    interface UserScriptInjection {
      target: InjectionTarget
      js: Array<{ code?: string; file?: string }>
      world?: "MAIN" | "USER_SCRIPT"
      worldId?: string
      injectImmediately?: boolean
    }

    interface InjectionResult {
      frameId: number
      documentId: string
      result?: any
      error?: string
    }

    function register(scripts: RegisteredUserScript[]): Promise<void>
    function unregister(filter?: UnregisterFilter): Promise<void>
    function update(scripts: RegisteredUserScript[]): Promise<void>
    function getScripts(filter?: { ids?: string[] }): Promise<RegisteredUserScript[]>
    function execute(injection: UserScriptInjection): Promise<InjectionResult[]>
  }
}