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
  onNavigateHome?: () => void
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

  const dirs = createMemo(() => [props.project.worktree, ...(props.project.sandboxes ?? [])])
  const sessions = createMemo(() => {
    return dirs()
      .flatMap((dir) => {
        const [store] = serverSync().child(dir)
        return sortedRootSessions(store, Date.now())
      })
      .sort((a, b) => (b.time?.updated ?? b.time?.created ?? 0) - (a.time?.updated ?? a.time?.created ?? 0))
  })

  const isCurrentProject = createMemo(() => {
    return props.currentDir?.() === props.project.worktree
  })

  const visibleSessions = createMemo(() => {
    const list = sessions()
    if (showAll() || list.length <= 10) return list
    return list.slice(0, 10)
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
  const notification = useNotification()

  const activeProjectName = createMemo(() => {
    return props.currentProject?.()?.name || "Jerry AI IDE"
  })

  // Aggregate all notifications from projects
  const allNotifications = createMemo(() => {
    const projs = props.projects()
    const items: {
      id: string
      type: string
      directory: string
      session?: string
      sessionTitle: string
      projectName: string
      time: number
      viewed: boolean
      error?: string
    }[] = []

    projs.forEach((proj) => {
      const pName = displayName(proj)
      const pNotifs = notification.project.all(proj.worktree)
      pNotifs.forEach((n, idx) => {
        let sTitle: string | undefined
        if (n.session) {
          const [store] = serverSync().child(proj.worktree)
          const found = store.session?.find((s) => s.id === n.session)
          if (found) sTitle = sessionTitle(found.title)
        }
        items.push({
          id: `${proj.worktree}-${n.session ?? ""}-${n.time}-${idx}`,
          type: n.type,
          directory: n.directory || proj.worktree,
          session: n.session,
          sessionTitle: sTitle || (n.session ? "Chat session" : pName),
          projectName: pName,
          time: n.time,
          viewed: n.viewed,
          error: n.type === "error" ? ((n as any).error?.message || "An error occurred") : undefined,
        })
      })
    })

    return items.sort((a, b) => b.time - a.time)
  })

  const unreadCount = createMemo(() => {
    return allNotifications().filter((n) => !n.viewed).length
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
                aria-label="Search"
              >
                <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </button>
            </Tooltip>
          </Show>

          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenu.Trigger
              as="button"
              type="button"
              class="size-7 rounded-md flex items-center justify-center text-text-weak hover:text-text-strong hover:bg-surface-base transition-colors relative"
              aria-label="Notifications"
            >
              <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              <Show when={unreadCount() > 0}>
                <span class="absolute top-1 right-1 size-2 rounded-full bg-[#3b82f6] ring-2 ring-background-base" />
              </Show>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content class="w-80 p-0 shadow-lg border border-border-weak-base bg-background-base rounded-xl overflow-hidden z-50">
                <div class="px-3.5 py-2.5 flex items-center justify-between border-b border-border-weaker-base bg-surface-base/40">
                  <div class="flex items-center gap-2 font-medium text-[13px] text-text-strong">
                    <span>Notifications</span>
                    <Show when={unreadCount() > 0}>
                      <span class="px-1.5 py-0.2 rounded-full bg-[#3b82f6]/20 text-[#3b82f6] text-[11px] font-semibold">
                        {unreadCount()}
                      </span>
                    </Show>
                  </div>
                  <Show when={unreadCount() > 0}>
                    <button
                      type="button"
                      onClick={() => {
                        props.projects().forEach((p) => notification.project.markViewed(p.worktree))
                      }}
                      class="text-[11px] text-[#3b82f6] hover:underline cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  </Show>
                </div>

                <div class="max-h-72 overflow-y-auto no-scrollbar py-1">
                  <For
                    each={allNotifications().slice(0, 15)}
                    fallback={
                      <div class="py-8 px-4 flex flex-col items-center justify-center text-center text-text-weak gap-2">
                        <div class="size-9 rounded-full bg-surface-base flex items-center justify-center text-text-weak/70">
                          <svg class="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                          </svg>
                        </div>
                        <div class="text-[12px] font-medium text-text-strong">No notifications</div>
                        <div class="text-[11px] text-text-weak/80">You're all caught up with Jerry!</div>
                      </div>
                    }
                  >
                    {(notif) => (
                      <button
                        type="button"
                        onClick={() => {
                          if (notif.session) {
                            notification.session.markViewed(notif.session)
                            if (notif.directory) props.onNavigateSession(notif.directory, notif.session)
                          } else if (notif.directory) {
                            notification.project.markViewed(notif.directory)
                            props.onNavigateProject(notif.directory)
                          }
                        }}
                        class="w-full px-3.5 py-2 flex items-start gap-2.5 text-left hover:bg-surface-base transition-colors cursor-pointer"
                        classList={{
                          "bg-surface-base/30": !notif.viewed,
                        }}
                      >
                        <div class="mt-0.5 shrink-0">
                          <Show
                            when={notif.type === "error"}
                            fallback={
                              <div class="size-6 rounded-full bg-[#10b981]/15 text-[#10b981] flex items-center justify-center">
                                <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </div>
                            }
                          >
                            <div class="size-6 rounded-full bg-[#ef4444]/15 text-[#ef4444] flex items-center justify-center">
                              <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                              </svg>
                            </div>
                          </Show>
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center justify-between gap-1">
                            <span class="text-[12px] font-medium text-text-strong truncate">
                              {notif.sessionTitle}
                            </span>
                            <span class="text-[10px] text-text-weak shrink-0 font-mono">
                              {formatShortTime(notif.time)}
                            </span>
                          </div>
                          <div class="text-[11px] text-text-weak truncate mt-0.5">
                            {notif.type === "turn-complete" ? "Jerry completed the task." : (notif.error || "Session updated.")}
                          </div>
                          <div class="text-[10px] text-text-weak/70 truncate mt-0.5">
                            {notif.projectName}
                          </div>
                        </div>
                        <Show when={!notif.viewed}>
                          <span class="size-1.5 rounded-full bg-[#3b82f6] shrink-0 mt-2" />
                        </Show>
                      </button>
                    )}
                  </For>
                </div>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu>

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
        <Show when={props.onNavigateHome}>
          <button
            type="button"
            onClick={props.onNavigateHome}
            class="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg text-text-base hover:text-text-strong hover:bg-surface-base transition-colors font-medium cursor-pointer"
          >
            <svg class="size-4 text-text-weak" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>Home</span>
          </button>
        </Show>

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
