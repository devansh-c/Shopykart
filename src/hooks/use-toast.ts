"use client"

import * as React from "react"

export const reducer = (state: any, action: any): any => {
  return { toasts: [] }
}

function toast({ ...props }: any) {
  return {
    id: "none",
    dismiss: () => {},
    update: () => {},
  }
}

function useToast() {
  return {
    toasts: [],
    toast,
    dismiss: () => {},
  }
}

export { useToast, toast }
