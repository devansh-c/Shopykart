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
import { CheckCircle2, AlertCircle } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider duration={2000}>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 border border-white/10">
                {variant === 'destructive' ? (
                  <AlertCircle className="h-3.5 w-3.5 text-white" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                )}
              </div>
              <div className="flex flex-col pr-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}