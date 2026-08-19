import { useDialog } from "@opencode-ai/ui/context/dialog"
import { Tooltip } from "@opencode-ai/ui/tooltip"
import { Icon as IconV2 } from "@opencode-ai/ui/v2/icon"
import { TooltipV2 } from "@opencode-ai/ui/v2/tooltip-v2"
import { Show, createMemo, createSignal, type Accessor } from "solid-js"
import { createStore } from "solid-js/store"
import { Portal } from "solid-js/web"
import createPresence from "solid-presence"
import { PromptInputV2Composer } from "@/components/prompt-input-v2"
import { PromptGitStatus, PromptWorkspaceSelector } from "@/components/prompt-workspace-selector"
import {
  PromptProjectAddButton,
  PromptProjectSelector,
  type PromptProjectController,
} from "@/components/prompt-project-selector"
import { StatusPopoverV2 } from "@/components/status-popover"
import { useLanguage } from "@/context/language"
import { useSDK } from "@/context/sdk"
import { usePrompt } from "@/context/prompt"
import { useServerSync } from "@/context/server-sync"
import { useProviders } from "@/hooks/use-providers"
import { getFilename } from "@opencode-ai/core/util/path"
import { NEW_SESSION_CONTENT_WIDTH } from "@/pages/session/new-session-layout"
import { Persist, persisted } from "@/utils/persist"
import type { NewSessionDraftController } from "./new-session-draft-controller"
import type { NewSessionWorkspaceController } from "./new-session-workspace-controller"

const providerTipDismissalDuration = 30 * 24 * 60 * 60 * 1000

export function NewSessionView(props: {
  input: NewSessionDraftController["input"]
  project: PromptProjectController
  workspace: NewSessionWorkspaceController
}) {
  const prompt = usePrompt()
  const sdk = useSDK()
  const serverSync = useServerSync()

  const projectName = createMemo(() => {
    const root = props.workspace.project.root() || sdk().directory
    return getFilename(root) || "workspace"
  })

  function fillCardPrompt(text: string) {
    prompt.set([{ type: "text", content: text, start: 0, end: text.length }], text.length)
    props.input.restoreFocus?.()
  }

  const cards = [
    {
      title: "Explore and understand code",
      promptText: "Explore the codebase and explain the main architecture, core components, and data flow.",
      iconColor: "text-[#60a5fa] bg-[#3b82f6]/10 border-[#3b82f6]/20",
      iconSvg: (
        <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
      ),
    },
    {
      title: "Build a new feature, app, or tool",
      promptText: "I want to build a new feature: ",
      iconColor: "text-[#c084fc] bg-[#a855f7]/10 border-[#a855f7]/20",
      iconSvg: (
        <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9"/>
          <path d="M17.64 15 22 10.64"/>
          <path d="m20.91 3.26-1.25-1.25a2.12 2.12 0 0 0-3 0l-4.14 4.14 4.25 4.25 4.14-4.14a2.12 2.12 0 0 0 0-3Z"/>
        </svg>
      ),
    },
    {
      title: "Review code and suggest changes",
      promptText: "Review recent code changes, look for potential bugs, edge cases, and suggest improvements.",
      iconColor: "text-[#4ade80] bg-[#22c55e]/10 border-[#22c55e]/20",
      iconSvg: (
        <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
        </svg>
      ),
    },
    {
      title: "Fix issues and failures",
      promptText: "Investigate and fix errors, failing tests, or unexpected behavior in the codebase.",
      iconColor: "text-[#fb923c] bg-[#f97316]/10 border-[#f97316]/20",
      iconSvg: (
        <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="8" height="14" x="8" y="6" rx="4"/>
          <path d="m19 7-3 2"/>
          <path d="m5 7 3 2"/>
          <path d="m19 19-3-2"/>
          <path d="m5 19 3-2"/>
          <path d="M20 13h-4"/>
          <path d="M4 13h4"/>
        </svg>
      ),
    },
  ]

  return (
    <div class="@container relative flex flex-col min-h-0 h-full flex-1">
      <div
        data-component="session-new-design"
        class="relative flex-1 min-h-0 overflow-y-auto rounded-[10px] bg-v2-background-bg-deep no-scrollbar"
      >
        <div class="flex flex-col items-center justify-center min-h-full px-6 py-10">
          <div class="w-full max-w-3xl flex flex-col items-center gap-6">
            {/* Jerry Logo & Dynamic Antigravity Headline */}
            <div class="flex flex-col items-center gap-3">
              <div class="size-14 rounded-2xl bg-surface-base border border-border-weak-base shadow-lg flex items-center justify-center p-2.5">
                <img src="/jerry.png" alt="Jerry AI" class="size-10 object-contain drop-shadow" />
              </div>
              <h1 class="text-20-medium sm:text-24-medium text-text-strong font-medium tracking-tight text-center">
                What should we build in <span class="underline decoration-border-base underline-offset-4">{projectName()}</span>?
              </h1>
            </div>

            {/* 4 Starter Action Cards */}
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
              {cards.map((card) => (
                <button
                  type="button"
                  onClick={() => fillCardPrompt(card.promptText)}
                  class="group flex flex-col items-start text-left p-3.5 rounded-xl bg-surface-base/60 hover:bg-surface-base-active border border-border-weak-base hover:border-border-base transition-all duration-150 gap-3 cursor-pointer shadow-xs"
                >
                  <div class={`p-2 rounded-lg border ${card.iconColor} transition-transform group-hover:scale-105`}>
                    {card.iconSvg}
                  </div>
                  <div class="text-[13px] font-medium text-text-strong leading-snug">
                    {card.title}
                  </div>
                </button>
              ))}
            </div>

            {/* Prompt Composer Box */}
            <div class="w-full flex flex-col gap-4 mt-2">
              <PromptInputV2Composer controller={props.input} />

              <Show when={props.project.empty()}>
                <PromptProjectAddButton controller={props.project} />
              </Show>

              <Show when={props.project.selected()}>
                <div class="flex min-h-7 min-w-0 flex-col items-center justify-center gap-0 text-v2-text-text-faint sm:flex-row">
                  <PromptProjectSelector controller={props.project} placement="bottom" />
                  <Show
                    when={props.workspace.bar.visible()}
                    fallback={
                      <PromptGitStatus branch={props.workspace.bar.branch()} noGit={!props.workspace.project.git()} />
                    }
                  >
                    <PromptWorkspaceSelector
                      value={props.workspace.selection.value()}
                      projectRoot={props.workspace.project.root()}
                      workspaces={props.workspace.project.workspaces()}
                      branch={props.workspace.bar.branch()}
                      onChange={props.workspace.selection.set}
                      onDone={props.input.restoreFocus}
                    />
                  </Show>
                </div>
              </Show>
            </div>
          </div>
        </div>
        <ProviderTip />
      </div>
    </div>
  )
}

export function NewSessionStatus(props: { mount: Accessor<HTMLElement | null>; visible: Accessor<boolean> }) {
  const language = useLanguage()

  return (
    <Show when={props.mount()} keyed>
      {(mount) => (
        <Portal mount={mount}>
          <Show when={props.visible()}>
            <Tooltip placement="bottom" value={language.t("status.popover.trigger")}>
              <StatusPopoverV2 />
            </Tooltip>
          </Show>
        </Portal>
      )}
    </Show>
  )
}

function ProviderTip() {
  const language = useLanguage()
  const dialog = useDialog()
  const sdk = useSDK()
  const serverSync = useServerSync()
  const providers = useProviders(() => sdk().directory)
  const [persistedState, setPersistedState, , persistedReady] = persisted(
    Persist.global("new-session.provider-tip"),
    createStore({ dismissedAt: 0 }),
  )
  const visible = createMemo(
    () =>
      serverSync().child(sdk().directory)[0].provider_ready &&
      persistedReady() &&
      providers.paid().length === 0 &&
      Date.now() - persistedState.dismissedAt >= providerTipDismissalDuration,
  )
  const [ref, setRef] = createSignal<HTMLDivElement>()
  const presence = createPresence({
    show: visible,
    element: () => ref() ?? null,
  })
  const openProviders = () => {
    void import("@/components/dialog-connect-provider").then(({ DialogConnectProvider }) => {
      void dialog.show(() => <DialogConnectProvider directory={() => sdk().directory} />)
    })
  }

  return (
    <Show when={presence.present()}>
      <div class="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-10">
        <div
          ref={setRef}
          data-component="provider-tip"
          data-visible={visible()}
          class="group/provider-tip pointer-events-auto relative flex h-6 max-w-full items-center transition-[opacity,transform] duration-[250ms] ease-[cubic-bezier(0.215,0.61,0.355,1)] motion-reduce:transition-none"
          classList={{ "data-[visible=false]:animate-out fade-out slide-out-to-bottom-4": true }}
        >
          <button
            type="button"
            class="flex h-6 min-w-0 items-center rounded-[4px] pl-1.5 text-[13px] leading-none tracking-[-0.04px] text-v2-text-text-faint transition-[background-color,color] duration-150 ease-in-out hover:bg-v2-overlay-simple-overlay-hover hover:text-v2-text-text-muted focus-visible:bg-v2-overlay-simple-overlay-hover focus-visible:text-v2-text-text-muted focus-visible:outline-none"
            onClick={openProviders}
          >
            <span class="truncate">{language.t("home.providerTip")}</span>
            <span class="flex size-6 shrink-0 items-center justify-center" aria-hidden="true">
              <IconV2 name="chevron-down" size="small" class="-rotate-90" />
            </span>
          </button>
          <TooltipV2
            class="hover-reveal absolute left-full top-0 flex h-6 w-7 items-center justify-end delay-0 duration-0 group-hover/provider-tip:delay-[250ms] group-hover/provider-tip:duration-150 group-hover/provider-tip:opacity-100 focus-within:delay-0 focus-within:duration-0 focus-within:opacity-100"
            placement="top"
            openDelay={1000}
            value={language.t("common.dismiss")}
          >
            <button
              type="button"
              class="flex size-6 items-center justify-center rounded-[4px] text-v2-icon-icon-muted transition-[background-color,color] duration-150 ease-in-out hover:bg-v2-overlay-simple-overlay-hover hover:text-v2-icon-icon-base focus-visible:bg-v2-overlay-simple-overlay-hover focus-visible:text-v2-icon-icon-base focus-visible:outline-none"
              aria-label={language.t("common.dismiss")}
              onClick={() => setPersistedState("dismissedAt", Date.now())}
            >
              <IconV2 name="xmark-small" />
            </button>
          </TooltipV2>
        </div>
      </div>
    </Show>
  )
}
