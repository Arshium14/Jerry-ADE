import { type ComponentProps } from "solid-js"

export const JerryMark = (props: { class?: string }) => {
  return (
    <svg
      data-component="logo-jerry-mark"
      classList={{ [props.class ?? ""]: !!props.class }}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Top Antenna */}
      <rect x="238" y="160" width="36" height="46" rx="18" fill="#1b4294" />
      <circle cx="256" cy="146" r="30" fill="#1b4294" />

      {/* Side Ears */}
      <rect x="88" y="220" width="46" height="150" rx="23" fill="#1b4294" />
      <rect x="378" y="220" width="46" height="150" rx="23" fill="#1b4294" />

      {/* Head */}
      <rect x="114" y="198" width="284" height="194" rx="56" fill="#2d88eb" />

      {/* Eyes */}
      <circle cx="190" cy="295" r="45" fill="#ffffff" />
      <circle cx="322" cy="295" r="45" fill="#ffffff" />

      {/* Pupils */}
      <circle cx="202" cy="297" r="22" fill="#1e202e" />
      <circle cx="310" cy="297" r="22" fill="#1e202e" />

      {/* Smile */}
      <path d="M 228 342 Q 256 368 284 342" stroke="#1e202e" stroke-width="12" stroke-linecap="round" fill="none" />
    </svg>
  )
}

export const JerrySplash = (props: Pick<ComponentProps<"svg">, "ref" | "class">) => {
  return (
    <svg
      ref={props.ref}
      data-component="logo-jerry-splash"
      classList={{ [props.class ?? ""]: !!props.class }}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Top Antenna */}
      <rect x="238" y="160" width="36" height="46" rx="18" fill="#1b4294" />
      <circle cx="256" cy="146" r="30" fill="#1b4294" />

      {/* Side Ears */}
      <rect x="88" y="220" width="46" height="150" rx="23" fill="#1b4294" />
      <rect x="378" y="220" width="46" height="150" rx="23" fill="#1b4294" />

      {/* Head */}
      <rect x="114" y="198" width="284" height="194" rx="56" fill="#2d88eb" />

      {/* Eyes */}
      <circle cx="190" cy="295" r="45" fill="#ffffff" />
      <circle cx="322" cy="295" r="45" fill="#ffffff" />

      {/* Pupils */}
      <circle cx="202" cy="297" r="22" fill="#1e202e" />
      <circle cx="310" cy="297" r="22" fill="#1e202e" />

      {/* Smile */}
      <path d="M 228 342 Q 256 368 284 342" stroke="#1e202e" stroke-width="12" stroke-linecap="round" fill="none" />
    </svg>
  )
}

export const JerryLogo = (props: { class?: string; text?: string }) => {
  return (
    <div class={`inline-flex items-center gap-2.5 ${props.class ?? ""}`}>
      <JerryMark class="size-6 shrink-0" />
      <span class="font-semibold text-sm tracking-tight text-text-strong font-mono">
        {props.text ?? "Jerry AI"}
      </span>
    </div>
  )
}

export const Mark = (props: { class?: string }) => {
  return <JerryMark class={props.class} />
}

export const Splash = (props: Pick<ComponentProps<"svg">, "ref" | "class">) => {
  return <JerrySplash ref={props.ref} class={props.class} />
}

export const Logo = (props: { class?: string }) => {
  return (
    <div class={`inline-flex items-center gap-2.5 ${props.class ?? ""}`}>
      <JerryMark class="size-7 shrink-0" />
      <span class="font-semibold text-base tracking-tight text-text-strong">Jerry AI IDE</span>
    </div>
  )
}
