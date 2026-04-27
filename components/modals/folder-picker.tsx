import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Button, Dialog, Portal, Text, List, ActivityIndicator, useTheme } from 'react-native-paper';
import { useQuery } from '@powersync/react-native';
import { useAuth } from '@/hooks/use-auth-context';
import { Folder } from '@/lib/powersync/Schema';
import { withUniwind } from 'uniwind';

const StyledView = withUniwind(View);

export interface FolderPickerRef {
  show: () => void;
}

interface FolderPickerProps {
  onSelect: (folderId: string | null) => void;
  selectedFolderId?: string | null;
  cardSetOnly?: boolean;
}

export const FolderPicker = React.forwardRef<FolderPickerRef, FolderPickerProps>(({ onSelect, selectedFolderId, cardSetOnly = false }, ref) => {
  const [visible, setVisible] = useState(false);
  const { session } = useAuth();
  const theme = useTheme();

  const { data: allFolders, isLoading } = useQuery<Folder>(
    session?.user.id ? `SELECT * FROM folders WHERE user_id = ? ORDER BY name` : null,
    session?.user.id ? [session.user.id] : []
  );

  React.useImperativeHandle(ref, () => ({
    show: () => setVisible(true)
  }));

  const selectableFolders = React.useMemo(
    () => (cardSetOnly ? (allFolders ?? []).filter((folder) => folder.is_card_set === 1) : allFolders ?? []),
    [allFolders, cardSetOnly]
  );

  const buildPath = (folder: Folder): string => {
    if (!allFolders) return folder.name || '';
    const parts: string[] = [folder.name!];
    let current = folder;
    while (current.parent_id) {
      const parent = allFolders.find(f => f.id === current.parent_id);
      if (parent) {
        parts.unshift(parent.name!);
        current = parent;
      } else {
        break;
      }
    }
    return parts.join(' / ');
  };

  const handleSelect = (folderId: string | null) => {
    onSelect(folderId);
    setVisible(false);
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={() => setVisible(false)} className="mx-4">
        <Dialog.Title>{cardSetOnly ? 'Select Card Set' : 'Select Folder'}</Dialog.Title>
        <Dialog.ScrollArea className="max-h-80">
          {isLoading ? (
            <StyledView className="p-8 items-center">
              <ActivityIndicator />
            </StyledView>
          ) : selectableFolders.length === 0 ? (
            <StyledView className="p-8 items-center">
              <Text variant="bodyMedium" className="text-on-surface-variant">
                {cardSetOnly ? 'No card sets yet' : 'No folders yet'}
              </Text>
              <Text variant="bodySmall" className="text-outline mt-2">
                {cardSetOnly ? 'Create a card set first' : 'Create a folder first'}
              </Text>
            </StyledView>
          ) : (
            <ScrollView>
              {!cardSetOnly && (
                <List.Item
                  title="Root"
                  left={props => <List.Icon {...props} icon="folder" />}
                  onPress={() => handleSelect(null)}
                  right={selectedFolderId === null ? props => <List.Icon {...props} icon="check" /> : undefined}
                />
              )}
              {selectableFolders.map(folder => (
                <List.Item
                  key={folder.id}
                  title={buildPath(folder)}
                  left={props => <List.Icon {...props} icon={folder.is_card_set === 1 ? 'cards' : 'folder'} color={folder.is_card_set === 1 ? theme.colors.primary : undefined} />}
                  onPress={() => handleSelect(folder.id!)}
                  right={selectedFolderId === folder.id ? props => <List.Icon {...props} icon="check" /> : undefined}
                />
              ))}
            </ScrollView>
          )}
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={() => setVisible(false)}>Cancel</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
});

FolderPicker.displayName = 'FolderPicker';

export const useFolderPicker = (initialFolderId?: string | null) => {
  const [folderId, setFolderId] = useState<string | null>(initialFolderId || null);
  const pickerRef = React.useRef<FolderPickerRef>(null);

  return {
    folderId,
    setFolderId,
    showPicker: () => pickerRef.current?.show(),
    pickerRef,
    FolderPickerComponent: ({ cardSetOnly = false }: { cardSetOnly?: boolean }) => (
      <FolderPicker
        ref={pickerRef}
        onSelect={setFolderId}
        selectedFolderId={folderId}
        cardSetOnly={cardSetOnly}
      />
    )
  };
};