import { useAuth } from '@/hooks/use-auth-context';
import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { Button, Dialog, Portal, TextInput, Text, Icon } from 'react-native-paper';
import { randomUUID } from 'expo-crypto';
import { usePowerSync } from '@powersync/react-native';
import { withUniwind } from 'uniwind';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface AddCategoryDialogRef {
  show: () => void;
}

const StyledText = withUniwind(Text);
const StyledIcon = withUniwind(MaterialCommunityIcons);

export const AddCategoryDialog = forwardRef<AddCategoryDialogRef>((_, ref) => {
  const [visible, setVisible] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const powerSync = usePowerSync();

  useImperativeHandle(ref, () => ({
    show: () => {
      setVisible(true);
    }
  }));

  const handleDismiss = () => {
    if (loading) return;
    setVisible(false);
    setCategoryName('');
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const newId = randomUUID();
      const userId = user!.id;

      const result = await powerSync.execute(
        'SELECT id FROM columns WHERE user_id = ? AND label = ? LIMIT 1',
        [userId, categoryName.trim()]
      )

      if (result.rows && result.rows.length > 0) {
        setError('A category with this name already exists.');
        return;
      }

      await powerSync.execute(
        'INSERT INTO columns (id, user_id, label) VALUES (?, ?, ?)',
        [newId, userId, categoryName.trim()]
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
        <StyledIcon name="label-outline" size={30} className='self-center text-primary -mb-4' />
        <Dialog.Title style={{ fontSize: 24, textAlign: "center" }}>New category</Dialog.Title>
        <Dialog.Content>
          <TextInput
            label="Name"
            value={categoryName}
            placeholder="Enter category name"
            error={!!error}
            onChangeText={setCategoryName}
            mode="outlined"
            disabled={loading}
            style={{ backgroundColor: 'transparent' }}
          />
          {error && <StyledText className="text-error mt-2">{error}</StyledText>}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={handleDismiss} disabled={loading}>Cancel</Button>
          <Button
            onPress={handleSave}
            loading={loading}
            disabled={!categoryName.trim() || loading}
          >
            Create
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
});

AddCategoryDialog.displayName = 'AddCategoryDialog';
