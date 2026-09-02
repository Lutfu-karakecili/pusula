"use client";

import { useEffect, useState } from "react";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

type ToasterToast = {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
};

let listeners: Array<(state: ToasterToast[]) => void> = [];
let memoryState: ToasterToast[] = [];

function dispatch(action: { type: string; toast?: ToasterToast; toastId?: string }) {
  switch (action.type) {
    case "ADD_TOAST":
      memoryState = [...memoryState, action.toast!];
      break;
    case "DISMISS_TOAST":
      memoryState = memoryState.filter((t) => t.id !== action.toastId);
      break;
    case "REMOVE_TOAST":
      memoryState = memoryState.filter((t) => t.id !== action.toastId);
      break;
  }
  listeners.forEach((listener) => listener(memoryState));
}

function toast(props: Omit<ToasterToast, "id"> & { id?: string }) {
  const id = props.id || Math.random().toString(36).slice(2, 9);
  dispatch({ type: "ADD_TOAST", toast: { ...props, id } });
  setTimeout(() => dispatch({ type: "DISMISS_TOAST", toastId: id }), 4000);
  return { id, dismiss: () => dispatch({ type: "DISMISS_TOAST", toastId: id }) };
}

function useToast() {
  const [state, setState] = useState<ToasterToast[]>(memoryState);

  useEffect(() => {
    listeners.push(setState);
    return () => {
      listeners = listeners.filter((l) => l !== setState);
    };
  }, []);

  return {
    toasts: state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, variant }) => (
        <Toast key={id} variant={variant}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}

export { useToast, toast, Toaster };
