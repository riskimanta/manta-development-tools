"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Command as CommandPrimitive } from "cmdk";
import * as React from "react";

import { cn } from "@/lib/utils";

export {
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "cmdk";

const DEFAULT_COMMAND_DIALOG_DESCRIPTION =
  "Search pages, projects, and features.";

type CommandDialogProps = Dialog.DialogProps &
  React.ComponentPropsWithoutRef<typeof CommandPrimitive> & {
    label?: string;
    description?: string;
    overlayClassName?: string;
    contentClassName?: string;
    container?: HTMLElement;
  };

export const CommandDialog = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  CommandDialogProps
>(
  (
    {
      open,
      onOpenChange,
      overlayClassName,
      contentClassName,
      container,
      label = "Command menu",
      description = DEFAULT_COMMAND_DIALOG_DESCRIPTION,
      children,
      ...commandProps
    },
    ref,
  ) => (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={container}>
        <Dialog.Overlay
          cmdk-overlay=""
          className={cn(
            "fixed inset-0 z-50 bg-black/30",
            overlayClassName,
          )}
        />
        <Dialog.Content
          cmdk-dialog=""
          className={cn(
            "fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 outline-none",
            contentClassName,
          )}
        >
          <Dialog.Title className="sr-only">{label}</Dialog.Title>
          <Dialog.Description className="sr-only">{description}</Dialog.Description>
          <CommandPrimitive ref={ref} label={label} {...commandProps}>
            {children}
          </CommandPrimitive>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  ),
);
CommandDialog.displayName = "CommandDialog";
