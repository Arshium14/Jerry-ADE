import { createEffect, createMemo, Show, Suspense, type ParentProps } from "solid-js"
import { createStore } from "solid-js/store"
import { useNavigate } from "@solidjs/router"
import { base64Encode } from "@opencode-ai/core/util/encode"
import { useLayout, type LocalProject } from "@/context/layout"
import { useServer } from "@/context/server"
import { useGlobal } from "@/context/global"
import { useDirectoryPicker } from "@/components/directory-picker"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { Tooltip } from "@opencode-ai/ui/tooltip"
import { useCommand } from "@/context/command"
import { useLanguage } from "@/context/language"
import { DebugBar } from "@/components/debug-bar"
import { TabsInfoPopup } from "@/components/help-button"
import { Titlebar, type TitlebarUpdate } from "@/components/titlebar"
import { usePlatform } from "@/context/platform"
import { setV2Toast, ToastRegion } from "@/utils/toast"
import { SidebarContent } from "./layout/sidebar-shell"
import { DialogSettings } from "@/components/dialog-settings"
import { DialogEditProjectV2 } from "@/components/dialog-edit-project-v2"
import { ResizeHandle } from "@opencode-ai/ui/resize-handle"

export default function NewLayout(props: ParentProps) {
  const platform = usePlatform()
  const layout = useLayout()
  const server = useServer()
  const global = useGlobal()
  const navigate = useNavigate()
  const pickDirectory = useDirectoryPicker()
  const dialog = useDialog()
  const command = useCommand()
  const language = useLanguage()

  const [state, setState] = createStore({ debugTools: true })

  createEffect(() => setV2Toast(true))

  const update: TitlebarUpdate = {
    version: () => {
      const state = platform.updater?.state()
      if (state?.status !== "ready") return
      return state.version
    },
    installing: () => platform.updater?.state().status === "installing",
    install: () => void platform.updater?.install(),
  }

  const projects = () => layout.projects.list()

  function openProject(directory: string) {
    const conn = server.current
    if (!conn) return
    const serverCtx = global.ensureServerCtx(conn)
    serverCtx.projects.open(directory)
    serverCtx.projects.touch(directory)
    navigate(`/${base64Encode(directory)}/session`)
  }

  function chooseProject() {
    const conn = server.current
    if (!conn) return
    pickDirectory({
      server: conn,
      title: language.t("command.project.open"),
      multiple: true,
      onSelect: (result) => {
        if (Array.isArray(result)) {
          result.forEach((directory) => openProject(directory))
        } else if (result) {
          openProject(result)
        }
      },
    })
  }

  function closeProject(directory: string) {
    layout.projects.close(directory)
  }

  function openSettings() {
    dialog.show(() => <DialogSettings />)
  }

  const side = createMemo(() => Math.max(layout.sidebar.width(), 240))

  return (
    <div
      class="relative bg-v2-background-bg-deep flex-1 min-h-0 min-w-0 flex flex-row overflow-hidden select-none [&_input]:select-text [&_textarea]:select-text [&_[contenteditable]]:select-text h-screen w-screen"
      style={{
        "padding-top": "env(safe-area-inset-top, 0px)",
        "padding-bottom": "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <Show when={layout.sidebar.opened()}>
        <aside
          style={{ width: `${side()}px` }}
          class="h-full shrink-0 relative flex flex-col z-20"
        >
          <SidebarContent
            opened={() => layout.sidebar.opened()}
            projects={projects}
            onNewChat={(project?: LocalProject) => {
              const dir = project?.worktree ?? projects()[0]?.worktree
              if (dir) navigate(`/${base64Encode(dir)}/session`)
              else navigate("/new-session")
            }}
            onNavigateSession={(directory: string, sessionId: string) => {
              navigate(`/${base64Encode(directory)}/session/${sessionId}`)
            }}
            onNavigateProject={(directory: string) => {
              navigate(`/${base64Encode(directory)}/session`)
            }}
            onOpenProject={chooseProject}
            onCloseProject={closeProject}
            onEditProject={(project: LocalProject) => {
              if (server.current) {
                dialog.show(() => <DialogEditProjectV2 server={server.current!} project={project} />)
              }
            }}
            onOpenSettings={openSettings}
            onOpenHelp={() => platform.openExternal("https://opencode.ai/desktop-feedback")}
            onNavigateHome={() => navigate("/")}
            onSearch={async () => {
              const { DialogSelectFile } = await import("@/components/dialog-select-file")
              dialog.show(() => <DialogSelectFile />)
            }}
            onToggleSidebar={() => layout.sidebar.toggle()}
          />
          <div class="absolute inset-y-0 end-0 z-30 w-0 overflow-visible">
            <ResizeHandle
              direction="horizontal"
              size={layout.sidebar.width()}
              min={220}
              max={480}
              onResize={(w) => layout.sidebar.resize(w)}
            />
          </div>
        </aside>
      </Show>

      <main class="flex-1 min-h-0 min-w-0 overflow-hidden flex flex-col items-start contain-strict relative h-full">
        {/* Top Window Drag Strip & Right Caption Controls Spacing */}
        <div
          class="w-full h-8 shrink-0 flex items-center justify-between z-20 select-none pointer-events-auto"
          data-tauri-drag-region
          style={{ "-webkit-app-region": "drag" }}
        >
          <div class="flex items-center gap-1.5 px-3" style={{ "-webkit-app-region": "no-drag" }}>
            <Show when={!layout.sidebar.opened()}>
              <Tooltip value="Open sidebar">
                <button
                  type="button"
                  onClick={() => layout.sidebar.toggle()}
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
          <div
            class="flex items-center justify-end h-full"
            style={{
              "-webkit-app-region": "no-drag",
              "margin-right": platform.platform === "desktop" && platform.os === "windows" ? "140px" : "8px",
            }}
          />
        </div>

        <div class="flex-1 min-h-0 w-full overflow-y-auto flex flex-col">
          <Suspense>{props.children}</Suspense>
        </div>
      </main>

      {import.meta.env.DEV && state.debugTools && <DebugBar inline />}
      <TabsInfoPopup />
      <ToastRegion v2 />
    </div>
  )
}
