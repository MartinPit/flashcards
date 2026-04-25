import React from 'react';
import { Dialog, Portal, Button, Text } from 'react-native-paper';

export interface ConfirmDialogRef {
  show: (options: ConfirmDialogOptions) => void;
}

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
}

export const ConfirmDialog = React.forwardRef<ConfirmDialogRef>((_, ref) => {
  const [visible, setVisible] = React.useState(false);
  const [options, setOptions] = React.useState<ConfirmDialogOptions | null>(null);

  React.useImperativeHandle(ref, () => ({
    show: (newOptions: ConfirmDialogOptions) => {
      setOptions(newOptions);
      setVisible(true);
    }
  }));

  const handleDismiss = () => {
    setVisible(false);
    setOptions(null);
  };

  const handleConfirm = () => {
    options?.onConfirm();
    handleDismiss();
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={handleDismiss}>
        <Dialog.Title>{options?.title}</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">{options?.message}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={handleDismiss}>{options?.cancelText ?? 'Cancel'}</Button>
          <Button
            onPress={handleConfirm}
            textColor={options?.destructive ? "#B3261E" : undefined}
          >
            {options?.confirmText ?? 'Delete'}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
});

ConfirmDialog.displayName = 'ConfirmDialog';
