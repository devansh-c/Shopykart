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
          <Toast key={id} {...props} className="rounded-full border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-black/95 text-white py-3 px-6 mb-2 backdrop-blur-md">
            <div className="flex flex-col items-center text-center w-full">
              {title && <ToastTitle className="font-black italic uppercase text-[10px] tracking-[0.2em] text-primary">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="font-bold text-[11px] uppercase opacity-90 mt-0.5">{description}</ToastDescription>
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
