import { createEffect, createMemo, createSignal, For, Show, type Accessor, type JSX } from "solid-js"
import { useParams } from "@solidjs/router"
import { base64Encode } from "@opencode-ai/core/util/encode"
import { getFilename } from "@opencode-ai/core/util/path"
import { type Session } from "@opencode-ai/sdk/v2/client"
import { Avatar } from "@opencode-ai/ui/avatar"
import { DropdownMenu } from "@opencode-ai/ui/dropdown-menu"
import { Icon } from "@opencode-ai/ui/icon"
import { Icon as IconV2 } from "@opencode-ai/ui/v2/icon"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { Spinner } from "@opencode-ai/ui/spinner"
import { Tooltip } from "@opencode-ai/ui/tooltip"
import { type LocalProject } from "@/context/layout"
import { useServerSync } from "@/context/server-sync"
import { useNotification } from "@/context/notification"
import { usePermission } from "@/context/permission"
import { useLanguage } from "@/context/language"
import { sessionTitle } from "@/utils/session-title"
import { displayName, sortedRootSessions } from "./helpers"

function formatShortTime(timestamp?: number): string | undefined {
  if (!timestamp) return undefined
  const diffMs = Date.now() - timestamp
  if (diffMs < 0) return undefined
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 60) return `${Math.max(1, mins)}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo`
  return `${Math.floor(days / 365)}y`
}

export interface SidebarContentProps {
  mobile?: boolean
  opened: Accessor<boolean>
  aimMove?: (event: MouseEvent) => void
  projects: Accessor<LocalProject[]>
  currentProject?: Accessor<LocalProject | undefined>
  currentDir?: Accessor<string>
  onNewChat: (project?: LocalProject) => void
  onNavigateSession: (directory: string, sessionId: string) => void
  onNavigateProject: (directory: string) => void
  onOpenProject: () => void
  onCloseProject?: (directory: string) => void
  onEditProject?: (project: LocalProject) => void
  onOpenSettings: () => void
  onOpenHelp?: () => void
  onSearch?: () => void
  onToggleSidebar?: () => void
}

function ProjectSection(props: {
  project: LocalProject
  currentDir?: Accessor<string>
  onNavigateSession: (directory: string, sessionId: string) => void
  onNavigateProject: (directory: string) => void
  onCloseProject?: (directory: string) => void
  onEditProject?: (project: LocalProject) => void
  onNewChat: (project?: LocalProject) => void
}) {
  const params = useParams()
  const serverSync = useServerSync()
  const notification = useNotification()
  const permission = usePermission()
  const language = useLanguage()

  const [expanded, setExpanded] = createSignal(true)
  const [showAll, setShowAll] = createSignal(false)

  const [sessionStore] = serverSync().child(props.project.worktree)
  const sessions = createMemo(() => sortedRootSessions(sessionStore, Date.now()))

  const isCurrentProject = createMemo(() => {
    return props.currentDir?.() === props.project.worktree
  })

  const visibleSessions = createMemo(() => {
    const list = sessions()
    if (showAll() || list.length <= 5) return list
    return list.slice(0, 5)
  })

  const name = createMemo(() => displayName(props.project))

  return (
    <div class="flex flex-col gap-0.5 mt-1">
      {/* Project Folder Row */}
      <div
        class="group/project flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
        classList={{
          "bg-surface-base-hover font-medium text-text-strong": isCurrentProject(),
          "hover:bg-surface-base/60 text-text-strong": !isCurrentProject(),
        }}
      >
        <button
          type="button"
          onClick={() => {
            setExpanded(!expanded())
            props.onNavigateProject(props.project.worktree)
          }}
          class="flex items-center gap-2 min-w-0 flex-1 text-left focus:outline-none"
        >
          <svg
            class="size-4 shrink-0 text-text-weak transition-transform"
            classList={{ "rotate-90 text-text-strong": expanded() }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
          <svg class="size-4 shrink-0 text-text-weak" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
          </svg>
          <span class="text-[13px] truncate font-medium">{name()}</span>
        </button>

        <div class="flex items-center gap-1 opacity-0 group-hover/project:opacity-100 transition-opacity">
          <Tooltip value="New chat">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                props.onNewChat(props.project)
              }}
              class="size-5 rounded flex items-center justify-center text-text-weak hover:text-text-strong hover:bg-surface-base"
            >
              <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenu.Trigger
              as="button"
              type="button"
              onClick={(e) => e.stopPropagation()}
              class="size-5 rounded flex items-center justify-center text-text-weak hover:text-text-strong hover:bg-surface-base"
            >
              <svg class="size-3.5" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
                <circle cx="5" cy="12" r="2" />
              </svg>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content class="min-w-40">
                <Show when={props.onEditProject}>
                  <DropdownMenu.Item onSelect={() => props.onEditProject?.(props.project)}>
                    <DropdownMenu.ItemLabel>Edit project</DropdownMenu.ItemLabel>
                  </DropdownMenu.Item>
                </Show>
                <Show when={props.onCloseProject}>
                  <DropdownMenu.Item onSelect={() => props.onCloseProject?.(props.project.worktree)}>
                    <DropdownMenu.ItemLabel>Close project</DropdownMenu.ItemLabel>
                  </DropdownMenu.Item>
                </Show>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu>
        </div>
      </div>

      {/* Threads List */}
      <Show when={expanded()}>
        <div class="flex flex-col gap-0.5 ps-5 pe-1">
          <For
            each={visibleSessions()}
            fallback={
              <button
                type="button"
                onClick={() => props.onNewChat(props.project)}
                class="px-3 py-1.5 text-left text-[12px] text-text-weak hover:text-text-strong italic"
              >
                No chats yet · Start new chat
              </button>
            }
          >
            {(session) => {
              const isActive = createMemo(() => params.id === session.id)
              const title = createMemo(() => sessionTitle(session.title) || "Untitled chat")
              const unseen = createMemo(() => notification.session.unseenCount(session.id))
              const isWorking = createMemo(() => serverSync().session.data.session_working(session.id))
              const time = createMemo(() => formatShortTime(session.time?.updated ?? session.time?.created))

              return (
                <button
                  type="button"
                  onClick={() => props.onNavigateSession(props.project.worktree, session.id)}
                  class="group/session flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-left text-[13px] transition-colors cursor-pointer"
                  classList={{
                    "bg-surface-base-active font-medium text-text-strong shadow-xs": isActive(),
                    "hover:bg-surface-base/50 text-text-base": !isActive(),
                  }}
                >
                  <div class="flex items-center gap-2 min-w-0 flex-1">
                    <Show when={isWorking()}>
                      <Spinner class="size-3 text-icon-interactive-base shrink-0" />
                    </Show>
                    <Show when={unseen() > 0}>
                      <span class="size-1.5 rounded-full bg-[#3b82f6] shrink-0" />
                    </Show>
                    <span class="truncate">{title()}</span>
                  </div>

                  <Show when={time()}>
                    <span class="text-[11px] text-text-weak/70 shrink-0 font-mono ps-1">{time()}</span>
                  </Show>
                </button>
              )
            }}
          </For>

          <Show when={sessions().length > 5}>
            <button
              type="button"
              onClick={() => setShowAll(!showAll())}
              class="px-2.5 py-1 text-left text-[12px] text-text-weak hover:text-text-strong font-medium transition-colors"
            >
              {showAll() ? "Show less" : `Show more (${sessions().length - 5})`}
            </button>
          </Show>
        </div>
      </Show>
    </div>
  )
}

export function SidebarContent(props: SidebarContentProps): JSX.Element {
  const language = useLanguage()
  const serverSync = useServerSync()

  const activeProjectName = createMemo(() => {
    return props.currentProject?.()?.name || "Jerry AI IDE"
  })

  // Derive user info from sync or defaults
  const userInitials = "AC"
  const userName = "Arsh Choudhury"

  return (
    <div class="flex flex-col h-full w-full bg-background-base border-r border-border-weak-base select-none overflow-hidden text-[13px]">
      {/* Top Header */}
      <div class="h-12 shrink-0 px-3 flex items-center justify-between border-b border-border-weaker-base">
        <DropdownMenu>
          <DropdownMenu.Trigger
            as="button"
            type="button"
            class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-base transition-colors font-medium text-text-strong text-[13px] focus:outline-none"
          >
            <img src="/jerry.png" alt="Jerry" class="size-5 rounded object-contain" />
            <span class="font-semibold tracking-tight">Jerry</span>
            <svg class="size-3.5 text-text-weak" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content class="min-w-48">
              <DropdownMenu.Item onSelect={props.onOpenProject}>
                <DropdownMenu.ItemLabel>Open Project Folder...</DropdownMenu.ItemLabel>
              </DropdownMenu.Item>
              <DropdownMenu.Item onSelect={props.onOpenSettings}>
                <DropdownMenu.ItemLabel>Settings</DropdownMenu.ItemLabel>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu>

        <div class="flex items-center gap-1">
          <Show when={props.onSearch}>
            <Tooltip value="Search (Ctrl+P / Cmd+P)">
              <button
                type="button"
                onClick={props.onSearch}
                class="size-7 rounded-md flex items-center justify-center text-text-weak hover:text-text-strong hover:bg-surface-base transition-colors"
              >
                <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </button>
            </Tooltip>
          </Show>

          <Tooltip value="Notifications">
            <button
              type="button"
              class="size-7 rounded-md flex items-center justify-center text-text-weak hover:text-text-strong hover:bg-surface-base transition-colors"
            >
              <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
            </button>
          </Tooltip>

          <Show when={props.onToggleSidebar}>
            <Tooltip value="Toggle sidebar">
              <button
                type="button"
                onClick={props.onToggleSidebar}
                class="size-7 rounded-md flex items-center justify-center text-text-weak hover:text-text-strong hover:bg-surface-base transition-colors"
              >
                <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M9 3v18" />
                </svg>
              </button>
            </Tooltip>
          </Show>
        </div>
      </div>

      {/* Main Nav Items */}
      <div class="px-2 pt-2.5 flex flex-col gap-1 shrink-0">
        <button
          type="button"
          onClick={() => props.onNewChat()}
          class="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-text-strong hover:bg-surface-base-active transition-colors font-medium cursor-pointer"
        >
          <div class="flex items-center gap-2.5">
            <svg class="size-4 text-text-strong" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
            <span>New chat</span>
          </div>
          <span class="size-4.5 rounded-md bg-surface-base flex items-center justify-center text-text-weak text-[12px]">
            +
          </span>
        </button>

        <button
          type="button"
          class="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg text-text-base hover:text-text-strong hover:bg-surface-base transition-colors"
        >
          <svg class="size-4 text-text-weak" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="18" cy="18" r="3" />
            <circle cx="6" cy="6" r="3" />
            <path d="M13 6h3a2 2 0 0 1 2 2v7" />
            <path d="M6 9v12" />
          </svg>
          <span>Pull requests</span>
        </button>

        <button
          type="button"
          class="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg text-text-base hover:text-text-strong hover:bg-surface-base transition-colors"
        >
          <svg class="size-4 text-text-weak" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>Scheduled</span>
        </button>

        <button
          type="button"
          onClick={props.onOpenSettings}
          class="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg text-text-base hover:text-text-strong hover:bg-surface-base transition-colors"
        >
          <svg class="size-4 text-text-weak" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          <span>Plugins</span>
        </button>
      </div>

      {/* Projects Section Header */}
      <div class="px-3 pt-4 pb-1 flex items-center justify-between shrink-0">
        <span class="text-[11px] font-semibold text-text-weak/70 uppercase tracking-wider">Projects</span>
        <Tooltip value="Add / Open Project">
          <button
            type="button"
            onClick={props.onOpenProject}
            class="size-5 rounded flex items-center justify-center text-text-weak hover:text-text-strong hover:bg-surface-base transition-colors"
          >
            <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </Tooltip>
      </div>

      {/* Projects & Threads Tree Scrollable Area */}
      <div class="flex-1 min-h-0 px-2 py-1 overflow-y-auto no-scrollbar">
        <For
          each={props.projects()}
          fallback={
            <div class="p-3 text-center text-text-weak text-[12px]">
              No projects open.
              <button
                type="button"
                onClick={props.onOpenProject}
                class="block mx-auto mt-2 text-text-strong underline"
              >
                Open a folder
              </button>
            </div>
          }
        >
          {(project) => (
            <ProjectSection
              project={project}
              currentDir={props.currentDir}
              onNavigateSession={props.onNavigateSession}
              onNavigateProject={props.onNavigateProject}
              onCloseProject={props.onCloseProject}
              onEditProject={props.onEditProject}
              onNewChat={props.onNewChat}
            />
          )}
        </For>
      </div>

      {/* User Profile Footer */}
      <div class="h-14 shrink-0 px-3 border-t border-border-weak-base flex items-center justify-between bg-surface-base/30">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="size-7 rounded-full bg-[#10b981] text-white flex items-center justify-center font-semibold text-[11px] shrink-0 shadow-xs">
            {userInitials}
          </div>
          <span class="text-[13px] font-medium text-text-strong truncate max-w-[130px]">{userName}</span>
        </div>

        <Tooltip value="Settings">
          <button
            type="button"
            onClick={props.onOpenSettings}
            class="size-7 rounded-md flex items-center justify-center text-text-weak hover:text-text-strong hover:bg-surface-base transition-colors"
          >
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </Tooltip>
      </div>
    </div>
  )
}
