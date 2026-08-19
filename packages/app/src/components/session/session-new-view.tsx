import { Show, createMemo } from "solid-js"
import { useSync } from "@/context/sync"
import { useSDK } from "@/context/sdk"
import { useLanguage } from "@/context/language"
import { Icon } from "@opencode-ai/ui/icon"
import { getDirectory, getFilename } from "@opencode-ai/core/util/path"

const MAIN_WORKTREE = "main"
const CREATE_WORKTREE = "create"
const ROOT_CLASS = "size-full flex flex-col overflow-y-auto no-scrollbar"

interface NewSessionViewProps {
  worktree: string
}

function fillPrompt(text: string) {
  const el = document.querySelector<HTMLTextAreaElement | HTMLDivElement>(
    '[data-component="prompt-input"] textarea, [data-component="prompt-input"] [contenteditable="true"], textarea',
  )
  if (el) {
    if ("value" in el) {
      el.value = text
      el.dispatchEvent(new Event("input", { bubbles: true }))
    } else {
      el.innerText = text
      el.dispatchEvent(new Event("input", { bubbles: true }))
    }
    el.focus()
  }
}

export function NewSessionView(props: NewSessionViewProps) {
  const sync = useSync()
  const sdk = useSDK()
  const language = useLanguage()

  const sandboxes = createMemo(() => sync().project?.sandboxes ?? [])
  const options = createMemo(() => [MAIN_WORKTREE, ...sandboxes(), CREATE_WORKTREE])
  const current = createMemo(() => {
    const selection = props.worktree
    if (options().includes(selection)) return selection
    return MAIN_WORKTREE
  })
  const projectRoot = createMemo(() => sync().project?.worktree ?? sdk().directory)
  const isWorktree = createMemo(() => {
    const project = sync().project
    if (!project) return false
    return sdk().directory !== project.worktree
  })

  const projectName = createMemo(() => {
    return sync().project?.name || getFilename(projectRoot()) || "workspace"
  })

  const branchLabel = createMemo(() => {
    const branch = sync().data.vcs?.branch
    if (branch) return branch
    return "main"
  })

  const cards = [
    {
      title: "Explore and understand code",
      prompt: "Explore the codebase and explain the main architecture, core components, and data flow.",
      iconColor: "text-[#60a5fa] bg-[#3b82f6]/10 border-[#3b82f6]/20",
      iconSvg: (
        <svg class="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
      ),
    },
    {
      title: "Build a new feature, app, or tool",
      prompt: "I want to build a new feature: ",
      iconColor: "text-[#c084fc] bg-[#a855f7]/10 border-[#a855f7]/20",
      iconSvg: (
        <svg class="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9"/>
          <path d="M17.64 15 22 10.64"/>
          <path d="m20.91 3.26-1.25-1.25a2.12 2.12 0 0 0-3 0l-4.14 4.14 4.25 4.25 4.14-4.14a2.12 2.12 0 0 0 0-3Z"/>
        </svg>
      ),
    },
    {
      title: "Review code and suggest changes",
      prompt: "Review recent code changes, look for potential bugs, edge cases, and suggest improvements.",
      iconColor: "text-[#4ade80] bg-[#22c55e]/10 border-[#22c55e]/20",
      iconSvg: (
        <svg class="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
        </svg>
      ),
    },
    {
      title: "Fix issues and failures",
      prompt: "Investigate and fix errors, failing tests, or unexpected behavior in the codebase.",
      iconColor: "text-[#fb923c] bg-[#f97316]/10 border-[#f97316]/20",
      iconSvg: (
        <svg class="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
    <div class={ROOT_CLASS}>
      <div class="flex-1 px-4 sm:px-8 py-8 flex flex-col items-center justify-center text-center">
        <div class="w-full max-w-3xl flex flex-col items-center gap-6">
          <div class="flex flex-col items-center gap-3.5">
            <div class="size-14 rounded-2xl bg-surface-base border border-border-weak-base shadow-lg flex items-center justify-center p-2">
              <img src="/jerry.png" alt="Jerry AI" class="size-10 object-contain drop-shadow" />
            </div>
            <h1 class="text-20-medium sm:text-24-medium text-text-strong font-medium tracking-tight">
              What should we build in <span class="underline decoration-border-base underline-offset-4">{projectName()}</span>?
            </h1>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full mt-2">
            {cards.map((card) => (
              <button
                type="button"
                onClick={() => fillPrompt(card.prompt)}
                class="group flex flex-col items-start text-left p-3.5 rounded-xl bg-surface-base/60 hover:bg-surface-base-active border border-border-weak-base hover:border-border-base transition-all duration-150 gap-3 cursor-pointer shadow-xs"
              >
                <div class={`p-2 rounded-lg border ${card.iconColor} transition-transform group-hover:scale-105`}>
                  {card.iconSvg}
                </div>
                <div class="text-[13px] font-medium text-text-strong group-hover:text-text-strong leading-snug">
                  {card.title}
                </div>
              </button>
            ))}
          </div>

          <div class="flex flex-wrap items-center justify-center gap-2 mt-2 text-12-medium text-text-weak">
            <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-base border border-border-weak-base">
              <Icon name="folder" size="small" class="text-icon-weak" />
              <span class="text-text-strong font-mono text-[11px]">{projectName()}</span>
            </div>
            <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-base border border-border-weak-base">
              <span class="size-1.5 rounded-full bg-icon-success-base" />
              <span>Local</span>
            </div>
            <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-base border border-border-weak-base">
              <Icon name="branch" size="small" class="text-icon-weak" />
              <span class="font-mono text-[11px] text-text-strong">{branchLabel()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
