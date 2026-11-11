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
import { CheckCircle2, AlertCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider duration={2000}>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant === 'destructive' ? 'destructive' : (title?.toString().toLowerCase().includes('success') || title?.toString().toLowerCase().includes('welcome') || title?.toString().toLowerCase().includes('added') ? 'success' : 'default')} {...props}>
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
                {variant === 'destructive' ? (
                  <AlertCircle className="h-4 w-4 text-white" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-white" />
                )}
              </div>
              <div className="flex flex-col pr-1 min-w-0">
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
