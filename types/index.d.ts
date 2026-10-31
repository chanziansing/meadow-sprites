export type SpriteKind = 'agent' | 'shell'
export type SpriteStatus = 'running' | 'home' | 'landed' | 'lost'

export type Sprite = {
  id: string
  /** The subagent's id, or the background shell's task id. */
  taskId?: string
  kind: SpriteKind
  label: string
  type: string
  status: SpriteStatus
  startedAt: number
  endedAt?: number
  steps: number
  batch: number
}

/** One usage window: which one, how much is used (0 to 100), when it resets. */
export type Window = { kind: string; percentUsed: number; resetsAt?: string }

/** When the main thread last sent a request, how much context the next one re-sends, the model. */
export type CacheFacts = { lastAt: number; tokens: number; model: string | null }

declare module 'claude-code' {
  interface PluginState {
    'meadow-sprites': {
      sprites: Shaped<Sprite[]>
      batch: number
      dismissed: number
      now: number
      autoOpened: boolean
      windows: Window[]
      cache: CacheFacts | null
      look: 'auto' | 'light' | 'dark'
    }
  }
}
