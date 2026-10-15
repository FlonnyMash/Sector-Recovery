import { useState, type ReactNode } from 'react'
import { APP_LIST, type AppDefinition } from '../../game/apps'
import { LOOT_NAMES } from '../../game/loot'
import { UPGRADES } from '../../game/upgrades'
import { strings } from '../../i18n'
import { selectCurrentOs, useGameStore } from '../../store/useGameStore'
import {
  KENJI_AUCTION_NUDGE_MS,
  LIVE_MESSAGE_COUNT,
  MOM_NUDGE_MS,
  initialPrologueState,
  type OsEnvironment,
  type PrologueState,
} from '../../types/game'
import { cn } from '../../utils/cn'
import { formatChatClock, formatDataSize, formatRate } from '../../utils/format'

const COPY = strings.devTools

const ENVIRONMENTS: { os: OsEnvironment; label: string; pcName: string; accent: string }[] = [
  {
    os: 'host_os',
    label: COPY.environment.hostLabel,
    pcName: strings.os.hostPcName,
    accent: 'from-[#3d1d6b] to-[#c45c78]',
  },
  {
    os: 'target_os',
    label: COPY.environment.targetLabel,
    pcName: strings.os.targetPcName,
    accent: 'from-[#0b3d66] to-[#0a7a7a]',
  },
]

const QUICK_AMOUNTS = [100, 1_000, 10_000, 100_000, 1_000_000]
const TIME_SCALES = [1, 2, 5, 10, 50]
const NARRATIVE_SCALES = [1, 10, 30, 60]

export function DevTools() {
  return (
    <div className="flex h-full flex-col bg-[#15171c] font-mono text-[12px] text-[#d8dbe2]">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="rounded-sm bg-[#e23d3d] px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
          DEV
        </span>
        <span className="text-[14px] font-bold text-white">{COPY.title}</span>
        <span className="ml-auto text-[10px] text-[#6a7080]">{COPY.devOnly}</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        <EnvironmentSection />
        <EconomySection />
        <UnlocksSection />
        <ProgramsSection />
        <PrologueSection />
        <UpgradesSection />
        <ToolsSection />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Sections                                                            */
/* ------------------------------------------------------------------ */

function EnvironmentSection() {
  const systemStage = useGameStore((state) => state.systemStage)
  const bootTarget = useGameStore((state) => state.bootTarget)
  const devSwitchOs = useGameStore((state) => state.devSwitchOs)
  const startRebootSequence = useGameStore((state) => state.startRebootSequence)
  const currentOs = selectCurrentOs(systemStage, bootTarget)
  const current = ENVIRONMENTS.find((env) => env.os === currentOs) ?? ENVIRONMENTS[0]

  return (
    <Section title={COPY.sections.environment}>
      <p className="text-[11px] leading-snug text-[#8a90a0]">{COPY.environment.hint}</p>

      <InfoGrid
        rows={[
          [COPY.environment.currentOs, `${current.label} · ${current.pcName}`],
          [COPY.environment.stage, systemStage],
        ]}
      />

      <div className="grid grid-cols-2 gap-3">
        {ENVIRONMENTS.map((env) => {
          const isActive = env.os === currentOs
          return (
            <button
              key={env.os}
              type="button"
              disabled={isActive}
              onClick={() => devSwitchOs(env.os)}
              className={cn(
                'flex flex-col items-start justify-between rounded-md border p-3 text-left transition',
                'bg-gradient-to-br',
                env.accent,
                isActive
                  ? 'cursor-default border-white/60 opacity-60 ring-2 ring-white/40'
                  : 'border-white/15 hover:border-white/50 hover:brightness-110 active:scale-[0.98]',
              )}
            >
              <div>
                <div className="text-[13px] font-bold text-white">{env.label}</div>
                <div className="text-[11px] text-white/75">{env.pcName}</div>
                <div className="mt-1 text-[10px] text-white/50">{env.os}</div>
              </div>
              <div className="mt-3 w-full rounded-sm bg-black/35 px-2 py-1 text-center text-[11px] font-semibold text-white">
                {isActive
                  ? COPY.environment.active
                  : COPY.environment.switchTo.replace('{name}', env.label)}
              </div>
            </button>
          )
        })}
      </div>

      <DevButton onClick={startRebootSequence}>{COPY.environment.fullReboot}</DevButton>
    </Section>
  )
}

function EconomySection() {
  const fragments = useGameStore((state) => state.dataFragments)
  const rate = useGameStore((state) => state.fragmentsPerSecond)
  const timeScale = useGameStore((state) => state.timeScale)
  const devAddFragments = useGameStore((state) => state.devAddFragments)
  const devSetFragments = useGameStore((state) => state.devSetFragments)
  const devSetTimeScale = useGameStore((state) => state.devSetTimeScale)
  const [input, setInput] = useState('')

  const parsed = parseAmount(input)
  const valid = parsed !== null && parsed > 0

  const apply = (fn: (amount: number) => void) => {
    if (parsed === null) return
    fn(parsed)
  }

  return (
    <Section title={COPY.sections.economy}>
      <InfoGrid
        rows={[
          [
            COPY.economy.balance,
            `${formatDataSize(fragments)} (${Math.floor(fragments).toLocaleString()} KB)`,
          ],
          [
            COPY.economy.rate,
            `${formatRate(rate)} KB/s${timeScale !== 1 ? ` × ${timeScale}` : ''}`,
          ],
        ]}
      />

      <form
        className="flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          if (valid) apply(devAddFragments)
        }}
      >
        <label className="flex flex-col gap-1 text-[11px] text-[#8a90a0]">
          {COPY.economy.amountLabel}
          <input
            type="text"
            inputMode="numeric"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={COPY.economy.amountPlaceholder}
            className="h-8 rounded-sm border border-white/15 bg-black/40 px-2 text-[12px] text-white outline-none placeholder:text-[#555b68] focus:border-[#ffd166]"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <DevButton type="submit" disabled={!valid} variant="primary">
            {COPY.economy.add}
          </DevButton>
          <DevButton
            disabled={!valid}
            onClick={() => apply((amount) => devAddFragments(-amount))}
          >
            {COPY.economy.subtract}
          </DevButton>
          <DevButton disabled={parsed === null} onClick={() => apply(devSetFragments)}>
            {COPY.economy.setTo}
          </DevButton>
          <DevButton onClick={() => devSetFragments(0)} variant="danger">
            {COPY.economy.clear}
          </DevButton>
        </div>
      </form>

      <div className="flex flex-col gap-1">
        <span className="text-[11px] text-[#8a90a0]">{COPY.economy.quickAdd}</span>
        <div className="flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((amount) => (
            <DevButton key={amount} onClick={() => devAddFragments(amount)}>
              +{formatCompact(amount)}
            </DevButton>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[11px] text-[#8a90a0]">{COPY.economy.timeScale}</span>
        <div className="flex flex-wrap gap-2">
          {TIME_SCALES.map((scale) => (
            <DevButton
              key={scale}
              onClick={() => devSetTimeScale(scale)}
              variant={scale === timeScale ? 'primary' : 'default'}
            >
              {scale}×
            </DevButton>
          ))}
        </div>
      </div>
    </Section>
  )
}

function UnlocksSection() {
  const hasRecoveryTool = useGameStore((state) => state.hasRecoveryTool)
  const inventory = useGameStore((state) => state.inventory)
  const devSetRecoveryTool = useGameStore((state) => state.devSetRecoveryTool)
  const devSetInventory = useGameStore((state) => state.devSetInventory)
  const devCompletePrologue = useGameStore((state) => state.devCompletePrologue)
  const devGrantUpgrade = useGameStore((state) => state.devGrantUpgrade)
  const upgrades = useGameStore((state) => state.upgrades)

  const unlockEverything = () => {
    devCompletePrologue()
    devSetRecoveryTool(true)
    devSetInventory([...LOOT_NAMES])
    for (const upgrade of UPGRADES) {
      if ((upgrades[upgrade.id] ?? 0) === 0) devGrantUpgrade(upgrade.id, 1)
    }
  }

  const ownedNames = inventory.map((file) => file.name)

  const toggleItem = (item: string) => {
    devSetInventory(
      ownedNames.includes(item) ? ownedNames.filter((name) => name !== item) : [...ownedNames, item],
    )
  }

  return (
    <Section title={COPY.sections.unlocks}>
      <Row label={COPY.unlocks.recoveryTool} status={hasRecoveryTool}>
        <DevButton
          onClick={() => devSetRecoveryTool(!hasRecoveryTool)}
          variant={hasRecoveryTool ? 'default' : 'primary'}
        >
          {hasRecoveryTool ? COPY.unlocks.uninstall : COPY.unlocks.install}
        </DevButton>
      </Row>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[#8a90a0]">
            {COPY.unlocks.inventory} · {inventory.length} / {LOOT_NAMES.length}
          </span>
          <div className="flex gap-2">
            <DevButton size="sm" onClick={() => devSetInventory([...LOOT_NAMES])}>
              {COPY.unlocks.unlockAll}
            </DevButton>
            <DevButton size="sm" onClick={() => devSetInventory([])}>
              {COPY.unlocks.clearInventory}
            </DevButton>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {LOOT_NAMES.map((item) => {
            const owned = ownedNames.includes(item)
            return (
              <button
                key={item}
                type="button"
                onClick={() => toggleItem(item)}
                className={cn(
                  'rounded-sm border px-2 py-1 text-[11px] transition',
                  owned
                    ? 'border-[#3ea74a]/60 bg-[#3ea74a]/20 text-[#9fe8a8]'
                    : 'border-white/15 bg-black/30 text-[#8a90a0] hover:border-white/40',
                )}
              >
                {owned ? '✓ ' : ''}
                {item}
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-sm border border-[#ffd166]/30 bg-[#ffd166]/10 p-3">
        <DevButton onClick={unlockEverything} variant="primary">
          {COPY.unlocks.unlockEverything}
        </DevButton>
        <p className="mt-2 text-[10px] leading-snug text-[#c9b77a]">
          {COPY.unlocks.unlockEverythingHint}
        </p>
      </div>
    </Section>
  )
}

function ProgramsSection() {
  const systemStage = useGameStore((state) => state.systemStage)
  const bootTarget = useGameStore((state) => state.bootTarget)
  const hasRecoveryTool = useGameStore((state) => state.hasRecoveryTool)
  const devSetRecoveryTool = useGameStore((state) => state.devSetRecoveryTool)
  const devSwitchOs = useGameStore((state) => state.devSwitchOs)
  const openWindow = useGameStore((state) => state.openWindow)
  const currentOs = selectCurrentOs(systemStage, bootTarget)

  // Dev Tools itself is excluded; it is always present in dev builds.
  const programs = APP_LIST.filter((app) => !app.devOnly)
  const isInstalled = (app: AppDefinition) => !app.requiresRecoveryTool || hasRecoveryTool
  const allInstalled = programs.every(isInstalled)

  const installAll = () => {
    if (programs.some((app) => app.requiresRecoveryTool)) devSetRecoveryTool(true)
  }

  const open = (app: AppDefinition) => {
    if (!isInstalled(app)) devSetRecoveryTool(true)
    if (app.os !== currentOs) devSwitchOs(app.os)
    openWindow(app.type)
  }

  return (
    <Section title={COPY.sections.programs}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] text-[#8a90a0]">{COPY.programs.openHint}</span>
        <DevButton
          onClick={installAll}
          disabled={allInstalled}
          variant={allInstalled ? 'default' : 'primary'}
        >
          {allInstalled ? COPY.programs.allInstalled : COPY.programs.installAll}
        </DevButton>
      </div>

      {ENVIRONMENTS.map((env) => {
        const envPrograms = programs.filter((app) => app.os === env.os)
        if (envPrograms.length === 0) return null
        return (
          <div key={env.os} className="flex flex-col gap-1">
            <span className="text-[10px] tracking-wide text-[#8a90a0] uppercase">
              {env.label} · {env.pcName}
            </span>
            <div className="flex flex-col divide-y divide-white/5 rounded-sm border border-white/10 bg-black/30">
              {envPrograms.map((app) => {
                const installed = isInstalled(app)
                return (
                  <div key={app.type} className="flex items-center gap-3 px-3 py-2">
                    <span className="shrink-0">{app.icon({ size: 20 })}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[11px] text-white">{app.title}</div>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            installed ? 'bg-[#3ea74a]' : 'bg-[#e23d3d]',
                          )}
                        />
                        <span className={installed ? 'text-[#9fe8a8]' : 'text-[#ffb3b3]'}>
                          {!app.requiresRecoveryTool
                            ? COPY.programs.preinstalled
                            : installed
                              ? COPY.programs.installed
                              : COPY.programs.notInstalled}
                        </span>
                      </div>
                    </div>
                    <DevButton size="sm" onClick={() => open(app)}>
                      {COPY.programs.open}
                    </DevButton>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </Section>
  )
}

function PrologueSection() {
  const prologue = useGameStore((state) => state.prologue)
  const narrativeTimeScale = useGameStore((state) => state.narrativeTimeScale)
  const narrativeElapsedMs = useGameStore((state) => state.narrativeElapsedMs)
  const devPatchPrologue = useGameStore((state) => state.devPatchPrologue)
  const devCompletePrologue = useGameStore((state) => state.devCompletePrologue)
  const devSetNarrativeTimeScale = useGameStore((state) => state.devSetNarrativeTimeScale)
  const deliverMomNudge = useGameStore((state) => state.deliverMomNudge)

  const toggle = (key: keyof PrologueState, patch: Partial<PrologueState>) => {
    if (isOn(prologue[key])) {
      // Revert every key the "on" patch touches back to its initial value.
      const off = Object.fromEntries(
        Object.keys(patch).map((k) => [k, initialPrologueState[k as keyof PrologueState]]),
      ) as Partial<PrologueState>
      devPatchPrologue(off)
    } else {
      devPatchPrologue(patch)
    }
  }

  const remainingMs = Math.max(
    0,
    (MOM_NUDGE_MS - narrativeElapsedMs) / narrativeTimeScale,
  )
  const auctionRemainingMs = Math.max(
    0,
    (KENJI_AUCTION_NUDGE_MS - narrativeElapsedMs) / narrativeTimeScale,
  )
  const auctionNudgePending =
    prologue.auctionCountdownStartedAt === null && !prologue.kenjiAuctionNudgeSent
  const clockStatus = prologue.momNudgeReceived
    ? COPY.prologue.narrativeDelivered
    : prologue.hasReadTargetArticle
      ? COPY.prologue.narrativeSkipped
      : COPY.prologue.narrativeRemaining.replace('{time}', formatClock(remainingMs))
  const auctionClockStatus = auctionNudgePending
    ? COPY.prologue.narrativeAuctionRemaining.replace('{time}', formatClock(auctionRemainingMs))
    : COPY.prologue.narrativeDelivered
  const canSendMom = !prologue.momNudgeReceived && !prologue.hasReadTargetArticle

  const flags: { label: string; key: keyof PrologueState; patch: Partial<PrologueState> }[] = [
    {
      label: COPY.prologue.coldCasePublished,
      key: 'isColdCasePublished',
      patch: { isColdCasePublished: true },
    },
    { label: COPY.prologue.articleRead, key: 'hasReadTargetArticle', patch: { hasReadTargetArticle: true } },
    {
      label: COPY.prologue.auctionSold,
      key: 'auctionLot404Sold',
      patch: { auctionLot404Sold: true },
    },
    {
      label: COPY.prologue.kenjiAuctionNudge,
      key: 'kenjiAuctionNudgeSent',
      patch: {
        kenjiAuctionNudgeSent: true,
        kenjiAuctionNudgeTime: formatChatClock(),
        chatNotificationPending: false,
      },
    },
    {
      label: COPY.prologue.kenjiAuctionWon,
      key: 'kenjiAuctionWonSent',
      patch: {
        kenjiAuctionWonSent: true,
        kenjiAuctionWonTime: formatChatClock(),
        chatNotificationPending: false,
      },
    },
    {
      label: COPY.prologue.friendMessage,
      key: 'friendMessageReceived',
      patch: { friendMessageReceived: true, chatNotificationPending: false },
    },
    {
      label: COPY.prologue.momNudge,
      key: 'momNudgeReceived',
      patch: {
        momNudgeReceived: true,
        momChatNotificationPending: false,
        momNudgeTime: formatChatClock(),
      },
    },
    {
      label: `${COPY.prologue.liveMessages} (${prologue.liveMessagesRevealed}/${LIVE_MESSAGE_COUNT})`,
      key: 'liveMessagesRevealed',
      patch: {
        liveMessagesRevealed: LIVE_MESSAGE_COUNT,
        liveMessageTimes: Array.from({ length: LIVE_MESSAGE_COUNT }, () => formatChatClock()),
      },
    },
    {
      label: `${COPY.prologue.partitionDownloaded} (${prologue.imageDownloadProgress}%)`,
      key: 'isPartitionDownloaded',
      patch: {
        isPartitionDownloaded: true,
        imageDownloadProgress: 100,
        partitionMountedTime: formatChatClock(),
      },
    },
    { label: COPY.prologue.rebootPrompt, key: 'rebootPromptActive', patch: { rebootPromptActive: true } },
  ]

  return (
    <Section title={COPY.sections.prologue}>
      <div className="flex flex-col divide-y divide-white/5 rounded-sm border border-white/10 bg-black/30">
        {flags.map((flag) => {
          const on = isOn(prologue[flag.key])
          return (
            <label
              key={flag.key}
              className="flex cursor-pointer items-center gap-3 px-3 py-2 text-[11px] hover:bg-white/5"
            >
              <input
                type="checkbox"
                checked={on}
                onChange={() => toggle(flag.key, flag.patch)}
                className="h-3.5 w-3.5 accent-[#ffd166]"
              />
              <span className={on ? 'text-white' : 'text-[#8a90a0]'}>{flag.label}</span>
            </label>
          )
        })}
      </div>

      <div className="flex flex-col gap-2 rounded-sm border border-white/10 bg-black/30 p-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[11px] text-[#8a90a0]">{COPY.prologue.narrativeClock}</span>
          <span className="text-[11px] text-white">{clockStatus}</span>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[11px] text-[#8a90a0]">{COPY.prologue.kenjiAuctionNudge}</span>
          <span className="text-[11px] text-white">{auctionClockStatus}</span>
        </div>
        <span className="text-[11px] text-[#8a90a0]">{COPY.prologue.narrativeSpeed}</span>
        <div className="flex flex-wrap gap-2">
          {NARRATIVE_SCALES.map((scale) => (
            <DevButton
              key={scale}
              onClick={() => devSetNarrativeTimeScale(scale)}
              variant={scale === narrativeTimeScale ? 'primary' : 'default'}
            >
              {scale}×
            </DevButton>
          ))}
        </div>
        <DevButton onClick={deliverMomNudge} disabled={!canSendMom} variant="primary">
          {COPY.prologue.sendMomNow}
        </DevButton>
      </div>

      <div className="flex gap-2">
        <DevButton onClick={devCompletePrologue} variant="primary">
          {COPY.prologue.completeAll}
        </DevButton>
        <DevButton onClick={() => devPatchPrologue(initialPrologueState)}>
          {COPY.prologue.reset}
        </DevButton>
      </div>
    </Section>
  )
}

function UpgradesSection() {
  const upgrades = useGameStore((state) => state.upgrades)
  const devGrantUpgrade = useGameStore((state) => state.devGrantUpgrade)
  const devResetUpgrades = useGameStore((state) => state.devResetUpgrades)

  return (
    <Section title={COPY.sections.upgrades}>
      <div className="flex flex-col divide-y divide-white/5 rounded-sm border border-white/10 bg-black/30">
        {UPGRADES.map((upgrade) => {
          const owned = upgrades[upgrade.id] ?? 0
          return (
            <div key={upgrade.id} className="flex items-center gap-3 px-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[11px] text-white">{upgrade.name}</div>
                <div className="text-[10px] text-[#8a90a0]">
                  +{upgrade.fragmentsPerSecond} KB/s · {COPY.upgrades.owned}: {owned}
                </div>
              </div>
              <div className="flex gap-1">
                <DevButton size="sm" disabled={owned === 0} onClick={() => devGrantUpgrade(upgrade.id, -1)}>
                  {COPY.upgrades.removeOne}
                </DevButton>
                <DevButton size="sm" onClick={() => devGrantUpgrade(upgrade.id, 1)}>
                  {COPY.upgrades.grantOne}
                </DevButton>
                <DevButton size="sm" onClick={() => devGrantUpgrade(upgrade.id, 10)}>
                  {COPY.upgrades.grantTen}
                </DevButton>
              </div>
            </div>
          )
        })}
      </div>
      <DevButton onClick={devResetUpgrades}>{COPY.upgrades.reset}</DevButton>
    </Section>
  )
}

function ToolsSection() {
  const devCloseOtherWindows = useGameStore((state) => state.devCloseOtherWindows)
  const notifications = useGameStore((state) => state.notifications)
  const dismissNotification = useGameStore((state) => state.dismissNotification)
  const pushNotification = useGameStore((state) => state.pushNotification)
  const devResetGame = useGameStore((state) => state.devResetGame)
  const [confirmReset, setConfirmReset] = useState(false)

  const clearNotifications = () => {
    for (const notification of notifications) dismissNotification(notification.id)
  }

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true)
      window.setTimeout(() => setConfirmReset(false), 3000)
      return
    }
    setConfirmReset(false)
    devResetGame()
  }

  return (
    <Section title={COPY.sections.tools}>
      <div className="flex flex-wrap gap-2">
        <DevButton onClick={devCloseOtherWindows}>{COPY.tools.closeOtherWindows}</DevButton>
        <DevButton onClick={clearNotifications} disabled={notifications.length === 0}>
          {COPY.tools.clearNotifications}
          {notifications.length > 0 ? ` (${notifications.length})` : ''}
        </DevButton>
        <DevButton
          onClick={() =>
            pushNotification({
              title: COPY.tools.testToastTitle,
              body: COPY.tools.testToastBody,
              kind: 'system',
            })
          }
        >
          {COPY.tools.testSystemToast}
        </DevButton>
        <DevButton
          onClick={() =>
            pushNotification({
              title: COPY.tools.testToastTitle,
              body: COPY.tools.testToastBody,
              kind: 'chat',
            })
          }
        >
          {COPY.tools.testChatToast}
        </DevButton>
      </div>

      <div className="rounded-sm border border-[#e23d3d]/40 bg-[#e23d3d]/10 p-3">
        <DevButton onClick={handleReset} variant="danger">
          {confirmReset ? COPY.tools.resetGameConfirm : COPY.tools.resetGame}
        </DevButton>
        <p className="mt-2 text-[10px] leading-snug text-[#e8a0a0]">{COPY.tools.resetGameHint}</p>
      </div>
    </Section>
  )
}

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[10px] font-bold tracking-[0.18em] text-[#ffd166] uppercase">{title}</h2>
      {children}
    </section>
  )
}

function InfoGrid({ rows }: { rows: [string, string][] }) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-sm border border-white/10 bg-black/30 p-3 text-[11px]">
      {rows.map(([label, value]) => (
        <RowPair key={label} label={label} value={value} />
      ))}
    </div>
  )
}

function RowPair({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span className="text-[#8a90a0]">{label}</span>
      <span className="truncate text-white">{value}</span>
    </>
  )
}

function Row({
  label,
  status,
  children,
}: {
  label: string
  status?: boolean
  children: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-sm border border-white/10 bg-black/30 px-3 py-2">
      <div className="flex items-center gap-2 text-[11px]">
        {status !== undefined ? (
          <span
            className={cn(
              'h-2 w-2 rounded-full',
              status ? 'bg-[#3ea74a] shadow-[0_0_6px_rgba(62,167,74,0.8)]' : 'bg-[#555b68]',
            )}
          />
        ) : null}
        <span className={status ? 'text-white' : 'text-[#c0c4cc]'}>{label}</span>
      </div>
      {children}
    </div>
  )
}

function DevButton({
  children,
  onClick,
  disabled = false,
  type = 'button',
  variant = 'default',
  size = 'md',
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
  variant?: 'default' | 'primary' | 'danger'
  size?: 'sm' | 'md'
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded-sm border font-semibold transition active:scale-[0.97]',
        size === 'sm' ? 'h-6 px-2 text-[10px]' : 'h-8 px-3 text-[11px]',
        variant === 'default' &&
          'border-white/15 bg-white/5 text-white hover:border-white/40 hover:bg-white/10',
        variant === 'primary' &&
          'border-[#ffd166]/60 bg-[#ffd166]/20 text-[#ffe6a3] hover:bg-[#ffd166]/30',
        variant === 'danger' &&
          'border-[#e23d3d]/60 bg-[#e23d3d]/20 text-[#ffb3b3] hover:bg-[#e23d3d]/30',
        disabled && 'cursor-not-allowed opacity-40 hover:bg-transparent active:scale-100',
      )}
    >
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Accepts "5000", "5,000", "5k", "2.5m", "1g" (KB-based suffixes). */
function parseAmount(raw: string): number | null {
  const text = raw.trim().toLowerCase().replace(/[,_\s]/g, '')
  if (text === '') return null
  const match = /^(\d+(?:\.\d+)?)([kmg])?$/.exec(text)
  if (!match) return null
  const base = Number(match[1])
  const suffix = match[2]
  const multiplier = suffix === 'k' ? 1_000 : suffix === 'm' ? 1_000_000 : suffix === 'g' ? 1_000_000_000 : 1
  const value = Math.floor(base * multiplier)
  return Number.isFinite(value) ? value : null
}

function formatCompact(amount: number): string {
  if (amount >= 1_000_000) return `${amount / 1_000_000}M`
  if (amount >= 1_000) return `${amount / 1_000}K`
  return String(amount)
}

function isOn(value: PrologueState[keyof PrologueState]): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value > 0
  if (Array.isArray(value)) return value.length > 0
  return value != null
}

function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
