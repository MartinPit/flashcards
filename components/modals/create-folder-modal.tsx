import { useAuth } from '@/hooks/use-auth-context';
import React, { useState, useImperativeHandle, forwardRef, useMemo } from 'react';
import { ScrollView } from 'react-native';
import { Button, Dialog, Portal, TextInput, Text, Menu } from 'react-native-paper';
import { randomUUID } from 'expo-crypto';
import { usePowerSync, useQuery } from '@powersync/react-native';
import { withUniwind } from 'uniwind';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Folder } from '@/lib/powersync/Schema';

export interface AddFolderDialogRef {
  show: (parentFolderId?: string) => void;
}

const StyledText = withUniwind(Text);
const StyledIcon = withUniwind(MaterialCommunityIcons);

export const AddFolderDialog = forwardRef<AddFolderDialogRef>((_, ref) => {
  const [visible, setVisible] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parentFolderId, setParentFolderId] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const { data: allFolders } = useQuery<Folder>(
    user?.id ? `SELECT * FROM folders WHERE user_id = ? ORDER BY name` : null,
    user?.id ? [user.id] : []
  );

  const parentFolder = useMemo(() => {
    if (!parentFolderId || !allFolders) return null;
    return allFolders.find(f => f.id === parentFolderId);
  }, [parentFolderId, allFolders]);

  useImperativeHandle(ref, () => ({
    show: (newParentFolderId?: string) => {
      setParentFolderId(newParentFolderId || null);
      setVisible(true);
    }
  }));

  const handleDismiss = () => {
    if (loading) return;
    setVisible(false);
    setFolderName('');
    setError(null);
    setParentFolderId(null);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const newId = randomUUID();
      const userId = user!.id;

      const result = await powerSync.execute(
        'SELECT id FROM folders WHERE user_id = ? AND name = ? AND (parent_id = ? OR (parent_id IS NULL AND ? IS NULL)) LIMIT 1',
        [userId, folderName.trim(), parentFolderId, parentFolderId]
      )

      if (result.rows && result.rows.length > 0) {
        setError('A folder with this name already exists in this location.');
        return;
      }

      await powerSync.execute(
        'INSERT INTO folders (id, user_id, name, parent_id, created_at, is_card_set) VALUES (?, ?, ?, ?, ?, ?)',
        [newId, userId, folderName.trim(), parentFolderId, new Date().toISOString(), 0]
      );

      handleDismiss();
    } catch (error) {
      console.error("CRITICAL SQL ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={handleDismiss}
      >
        <StyledIcon name="folder-text-outline" size={30} className='self-center text-primary -mb-4' />
        <Dialog.Title style={{ fontSize: 24, textAlign: "center" }}>New folder</Dialog.Title>
        <Dialog.Content>
          <TextInput
            label="Name"
            value={folderName}
            placeholder="Enter folder name"
            error={!!error}
            onChangeText={setFolderName}
            mode="outlined"
            disabled={loading}
            style={{ backgroundColor: 'transparent' }}
          />
          {error && <StyledText className="text-error mt-2">{error}</StyledText>}
          
          <StyledText variant="labelLarge" className="text-on-surface mt-4 mb-2">Location</StyledText>
          <Button 
            mode="outlined" 
            onPress={() => setMenuVisible(true)}
            className="mt-1"
            icon="folder"
            contentStyle={{ flexDirection: 'row-reverse' }}
          >
            {parentFolder ? parentFolder.name : 'Root'}
          </Button>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={handleDismiss} disabled={loading}>Cancel</Button>
          <Button
            onPress={handleSave}
            loading={loading}
            disabled={!folderName.trim() || loading}
          >
            Create
          </Button>
        </Dialog.Actions>
      </Dialog>
      
      <Dialog visible={menuVisible} onDismiss={() => setMenuVisible(false)} style={{ maxHeight: 400 }}>
        <Dialog.Title>Select Location</Dialog.Title>
        <Dialog.ScrollArea style={{ maxHeight: 300, paddingHorizontal: 0 }}>
          <ScrollView>
            <Menu.Item 
              title="Root" 
              leadingIcon="folder"
              onPress={() => {
                setParentFolderId(null);
                setMenuVisible(false);
              }}
            />
            {allFolders?.filter(f => f.id !== parentFolderId).map(folder => (
              <Menu.Item 
                key={folder.id}
                title={folder.name}
                leadingIcon={folder.is_card_set === 1 ? "cards" : "folder"}
                onPress={() => {
                  setParentFolderId(folder.id);
                  setMenuVisible(false);
                }}
              />
            ))}
          </ScrollView>
        </Dialog.ScrollArea>
      </Dialog>
    </Portal>
  );
});

AddFolderDialog.displayName = 'AddFolderDialog';