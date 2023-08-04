/// <reference types="vite/client" />
/// <reference types="vite-plugin-comlink/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
