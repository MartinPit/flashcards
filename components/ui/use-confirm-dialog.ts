import { useCallback, useRef } from 'react';
import { ConfirmDialogRef, ConfirmDialogOptions } from './confirm-dialog';

export interface DeleteConfirmOptions {
  title: string;
  message: string;
  onDelete: () => void | Promise<void>;
}

export function useConfirmDialog() {
  const confirmDialogRef = useRef<ConfirmDialogRef>(null);

  const showConfirm = useCallback((options: ConfirmDialogOptions) => {
    confirmDialogRef.current?.show(options);
  }, []);

  const showDeleteConfirm = useCallback(({ title, message, onDelete }: DeleteConfirmOptions) => {
    confirmDialogRef.current?.show({
      title,
      message,
      destructive: true,
      onConfirm: onDelete,
    });
  }, []);

  return {
    confirmDialogRef,
    showConfirm,
    showDeleteConfirm,
  };
}