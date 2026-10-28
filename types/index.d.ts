export type ShibaPaws = number

declare module 'claude-code' {
  interface PluginState {
    'kuro-shiba-spinner': { tools: ShibaPaws }
  }
}
