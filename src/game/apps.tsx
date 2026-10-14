import type { ComponentType, ReactNode } from 'react'
import { OperatorNotes } from '../components/apps/OperatorNotes'
import { RecoveryTerminal } from '../components/apps/RecoveryTerminal'
import { NotesIcon, TerminalIcon } from '../components/os/icons'
import type { AppType } from '../types/game'

export interface AppDefinition {
  type: AppType
  title: string
  icon: (props: { size?: number }) => ReactNode
  component: ComponentType
  defaultSize: { width: number; height: number }
}

export const APPS: Record<AppType, AppDefinition> = {
  'recovery-terminal': {
    type: 'recovery-terminal',
    title: 'Recovery Terminal',
    icon: ({ size }) => <TerminalIcon size={size} />,
    component: RecoveryTerminal,
    defaultSize: { width: 720, height: 520 },
  },
  'operator-notes': {
    type: 'operator-notes',
    title: 'Operator Notes',
    icon: ({ size }) => <NotesIcon size={size} />,
    component: OperatorNotes,
    defaultSize: { width: 420, height: 360 },
  },
}

export const APP_LIST = Object.values(APPS)
