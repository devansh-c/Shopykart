"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider duration={2000}>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props} className="rounded-2xl border-none shadow-2xl bg-black text-white p-5 mb-2">
            <div className="grid gap-1">
              {title && <ToastTitle className="font-black italic uppercase text-xs tracking-widest text-primary">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="font-bold text-[11px] uppercase opacity-80">{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose className="text-white/20 hover:text-white" />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
