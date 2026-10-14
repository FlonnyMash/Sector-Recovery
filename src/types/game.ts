export type AppType = 'recovery-terminal' | 'operator-notes'

export interface WindowState {
  id: string
  title: string
  type: AppType
  isOpen: boolean
  isMinimized: boolean
  isMaximized: boolean
  zIndex: number
}
