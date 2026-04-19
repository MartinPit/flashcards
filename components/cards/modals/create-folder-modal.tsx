import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Button, Dialog, Portal, Text, TextInput } from 'react-native-paper';
import { randomUUID } from 'expo-crypto';
import { useQuery } from '@powersync/react-native';
import { useAuth } from '@/hooks/use-auth-context';
import { useSystem } from '@/lib/powersync/system';
import { MenuSelect } from '../menu-select';

export interface AddFolderDialogRef {
  show: () => void;
}

export const AddFolderDialog = forwardRef<AddFolderDialogRef>((_, ref) => {
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { session } = useAuth();
  const { powerSync } = useSystem();
  const { data: folders = [] } = useQuery<{ id: string; name: string }>(
    'SELECT id, name FROM folders WHERE user_id = ? AND is_card_set = 0 ORDER BY created_at DESC',
    [session?.user.id ?? '']
  );

  useImperativeHandle(ref, () => ({ show: () => setVisible(true) }));

  const dismiss = () => {
    if (loading) return;
    setVisible(false);
    setName('');
    setParentId('');
    setError(null);
  };

  const save = async () => {
    if (!session?.user.id) return;
    const trimmed = name.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    try {
      const duplicate = await powerSync.execute(
        "SELECT id FROM folders WHERE user_id = ? AND is_card_set = 0 AND name = ? AND COALESCE(parent_id, '') = ? LIMIT 1",
        [session.user.id, trimmed, parentId || '']
      );

      if (duplicate.rows.length > 0) {
        setError('A folder with that name already exists in this location.');
        return;
      }

      await powerSync.execute(
        "INSERT INTO folders (id, user_id, name, parent_id, created_at, is_card_set) VALUES (?, ?, ?, ?, datetime('now'), 0)",
        [randomUUID(), session.user.id, trimmed, parentId || null]
      );

      dismiss();
    } catch (e) {
      console.error('Failed to create folder', e);
      setError('Could not create folder.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={dismiss}>
        <Dialog.Title>New Folder</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium" style={{ marginBottom: 12, opacity: 0.7 }}>
            Organize card sets into folders.
          </Text>
          <TextInput
            label="Folder name"
            value={name}
            onChangeText={setName}
            mode="outlined"
            disabled={loading}
            error={!!error}
          />
          <MenuSelect
            label="Parent folder"
            placeholder="Top level"
            value={parentId}
            onChange={setParentId}
            options={[
              { label: 'Top level', value: '' },
              ...folders.map((folder) => ({ label: folder.name, value: folder.id })),
            ]}
            disabled={loading}
          />
          {error ? <Text style={{ color: '#B3261E', marginTop: 8 }}>{error}</Text> : null}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={dismiss} disabled={loading}>Cancel</Button>
          <Button onPress={save} loading={loading} disabled={!name.trim() || loading}>Create</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
});

AddFolderDialog.displayName = 'AddFolderDialog';


