import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, FAB, HelperText, SegmentedButtons, Surface, Text, TextInput, useTheme } from 'react-native-paper';
import { randomUUID } from 'expo-crypto';
import { useQuery } from '@powersync/react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/use-auth-context';
import { useSystem } from '@/lib/powersync/system';
import { Column, Folder, Card as CardRow } from '@/lib/powersync/Schema';
import { SelectCardSetDialog, SelectCardSetDialogRef } from './modals/select-card-set-modal';

type FieldValueMap = Record<string, string>;

const CARD_TAGS = ['New', 'Hard', 'Ok', 'Easy'] as const;
const WORD_TYPES = ['Nomen', 'Verben', 'Artikel', 'Adjektive', 'Pronomen', 'Adverbien', 'Andere'] as const;

type CardFormProps = {
  mode: 'create' | 'edit';
  cardId?: string;
  initialCardSetId?: string;
  onSaved?: () => void;
};

function parseCardData(data?: string | null): { fields: Array<{ columnId?: string; label: string; value: string }> } {
  if (!data) return { fields: [] };

  try {
    const parsed = JSON.parse(data);
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.fields)) {
      return {
        fields: parsed.fields
          .map((field: any) => ({
            columnId: field.columnId ? String(field.columnId) : undefined,
            label: String(field.label ?? ''),
            value: String(field.value ?? ''),
          }))
          .filter((field: { label: string }) => field.label.trim().length > 0),
      };
    }
  } catch {
    // legacy/plain string data falls through to an empty structured form
  }

  return { fields: [] };
}

export function CardForm({ mode, cardId, initialCardSetId, onSaved }: CardFormProps) {
  const router = useRouter();
  const theme = useTheme();
  const { session } = useAuth();
  const { powerSync } = useSystem();
  const userId = session?.user.id ?? '';
  const selectCardSetRef = useRef<SelectCardSetDialogRef>(null);

  const { data: cardSets = [] } = useQuery<Folder>(
    'SELECT * FROM folders WHERE user_id = ? AND is_card_set = 1 ORDER BY created_at DESC',
    [userId]
  );
  const { data: folders = [] } = useQuery<Folder>(
    'SELECT * FROM folders WHERE user_id = ? AND is_card_set = 0 ORDER BY created_at DESC',
    [userId]
  );
  const { data: columns = [] } = useQuery<Column>(
    'SELECT * FROM columns WHERE user_id = ? ORDER BY label ASC',
    [userId]
  );
  const { data: existingCards = [] } = useQuery<CardRow>(
    'SELECT * FROM cards WHERE id = ? AND user_id = ? LIMIT 1',
    [cardId ?? '', userId]
  );

  const existingCard = existingCards[0] ?? null;

  const [saving, setSaving] = useState(false);
  const [selectedCardSetId, setSelectedCardSetId] = useState(initialCardSetId ?? '');
  const [selectedTag, setSelectedTag] = useState<(typeof CARD_TAGS)[number]>('New');
  const [selectedWordType, setSelectedWordType] = useState<(typeof WORD_TYPES)[number]>('Andere');
  const [selectedColumnIds, setSelectedColumnIds] = useState<string[]>([]);
  const [fieldValues, setFieldValues] = useState<FieldValueMap>({});
  const [error, setError] = useState<string | null>(null);
  const initializedCreateRef = useRef(false);
  const initializedEditCardIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (mode === 'edit' && existingCard) {
      if (initializedEditCardIdRef.current === existingCard.id) {
        return;
      }

      setSelectedCardSetId(existingCard.folder_id ?? initialCardSetId ?? '');
      setSelectedTag((CARD_TAGS as readonly string[]).includes(existingCard.tag ?? '') ? (existingCard.tag as typeof CARD_TAGS[number]) : 'New');
      setSelectedWordType((WORD_TYPES as readonly string[]).includes(existingCard.word_type ?? '') ? (existingCard.word_type as typeof WORD_TYPES[number]) : 'Andere');

      const parsed = parseCardData(existingCard.data);
      if (parsed.fields.length > 0) {
        setSelectedColumnIds(parsed.fields.map((field) => field.columnId ?? field.label));
        setFieldValues(
          Object.fromEntries(parsed.fields.map((field) => [field.columnId ?? field.label, field.value]))
        );
      }

      initializedEditCardIdRef.current = existingCard.id;

      return;
    }

    if (mode === 'edit') {
      return;
    }

    if (initializedCreateRef.current) {
      return;
    }

    if (!initialCardSetId && cardSets.length === 0) {
      return;
    }

    if (columns.length === 0) {
      return;
    }

    if (!selectedCardSetId && initialCardSetId) {
      setSelectedCardSetId(initialCardSetId);
    }

    if (!selectedCardSetId && cardSets[0]) {
      setSelectedCardSetId(cardSets[0].id);
    }

    if (!selectedColumnIds.length && columns.length > 0) {
      setSelectedColumnIds(columns.slice(0, 2).map((column) => column.id));
    }

    initializedCreateRef.current = true;
  }, [cardSets, columns, existingCard, initialCardSetId, mode, selectedCardSetId, selectedColumnIds.length]);

  const selectedColumns = columns.filter((column) => selectedColumnIds.includes(column.id));

  const toggleColumn = (columnId: string) => {
    setSelectedColumnIds((current) => (
      current.includes(columnId)
        ? current.filter((id) => id !== columnId)
        : [...current, columnId]
    ));
  };

  const handleSave = async () => {
    if (!session?.user.id) return;
    if (!selectedCardSetId) {
      setError('Choose a card set first.');
      return;
    }
    if (!CARD_TAGS.includes(selectedTag)) {
      setError('Choose a valid tag.');
      return;
    }
    if (!WORD_TYPES.includes(selectedWordType)) {
      setError('Choose a valid word type.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        tag: selectedTag,
        wordType: selectedWordType,
        cardSetId: selectedCardSetId,
        fields: selectedColumns.map((column) => ({
          columnId: column.id,
          label: column.label,
          value: fieldValues[column.id] ?? '',
        })),
      };

      const data = JSON.stringify(payload);

      if (mode === 'edit' && cardId) {
        await powerSync.execute(
          'UPDATE cards SET folder_id = ?, word_type = ?, tag = ?, data = ? WHERE id = ? AND user_id = ?',
          [selectedCardSetId, selectedWordType, selectedTag, data, cardId, session.user.id]
        );
      } else {
        await powerSync.execute(
          "INSERT INTO cards (id, user_id, folder_id, word_type, tag, data, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))",
          [randomUUID(), session.user.id, selectedCardSetId, selectedWordType, selectedTag, data]
        );
      }

      onSaved?.();
      if (!onSaved) {
        router.back();
      }
    } catch (e) {
      console.error('Failed to save card', e);
      setError('Could not save the card.');
    } finally {
      setSaving(false);
    }
  };

  if (!userId) {
    return (
      <Surface style={styles.surface} elevation={1}>
        <Text variant="titleMedium">You need to be signed in to manage cards.</Text>
      </Surface>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text variant="titleMedium">{mode === 'edit' ? 'Edit card' : 'Create card'}</Text>
        <Text variant="bodySmall" style={{ opacity: 0.72 }}>
          Organize by set and type
        </Text>
      </View>

      <View style={styles.content}>
        <View
          style={[
            styles.selectSection,
            { backgroundColor: theme.colors.elevation.level1, borderColor: theme.colors.primary }
          ]}
        >
          <Text variant="labelLarge">Card set</Text>
          <Button
            mode="outlined"
            onPress={() =>
              selectCardSetRef.current?.show((cardSetId) => setSelectedCardSetId(cardSetId))
            }
            disabled={saving}
            icon="folder-open"
            style={styles.selectButton}
          >
            {cardSets.find((cs) => cs.id === selectedCardSetId)?.name || 'Select a card set'}
          </Button>
        </View>

        <View style={styles.section}>
          <Text variant="titleMedium">Tag</Text>
          <SegmentedButtons
            value={selectedTag}
            onValueChange={(value) => setSelectedTag(value as (typeof CARD_TAGS)[number])}
            buttons={CARD_TAGS.map((tag) => ({ value: tag, label: tag, showSelectedCheck: true }))}
            density="small"
            disabled={saving}
          />
        </View>

        <View style={styles.section}>
          <Text variant="titleMedium">Word type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.segmentedScroll}>
            <SegmentedButtons
              value={selectedWordType}
              onValueChange={(value) => setSelectedWordType(value as (typeof WORD_TYPES)[number])}
              buttons={WORD_TYPES.map((wordType) => ({ value: wordType, label: wordType, showSelectedCheck: true }))}
              density="small"
              disabled={saving}
            />
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text variant="titleMedium">Columns</Text>
          <View style={styles.chipWrap}>
            {columns.map((column) => {
              const active = selectedColumnIds.includes(column.id);
              return (
                <Chip
                  key={column.id}
                  selected={active}
                  onPress={() => toggleColumn(column.id)}
                  style={styles.chip}
                  compact
                >
                  {column.label}
                </Chip>
              );
            })}
          </View>
        </View>

        {selectedColumns.length > 0 ? (
          <View style={styles.section}>
            <Text variant="titleMedium">Fill in the fields</Text>
            {selectedColumns.map((column) => (
              <TextInput
                key={column.id}
                label={column.label}
                value={fieldValues[column.id] ?? ''}
                onChangeText={(text) => setFieldValues((current) => ({ ...current, [column.id]: text }))}
                mode="outlined"
                multiline
                style={styles.input}
                disabled={saving}
              />
            ))}
          </View>
        ) : null}

        {error ? (
          <HelperText type="error" visible>
            {error}
          </HelperText>
        ) : null}
      </View>

      <FAB
        icon={mode === 'edit' ? 'check' : 'plus'}
        label={mode === 'edit' ? 'Save' : 'Create'}
        visible={!saving}
        onPress={handleSave}
        disabled={saving || !selectedCardSetId}
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
      />

      <SelectCardSetDialog ref={selectCardSetRef} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 12,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 16,
    gap: 4,
  },
  content: {
    gap: 16,
  },
  selectSection: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  selectButton: {
    marginHorizontal: 0,
  },
  section: {
    gap: 12,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  segmentedScroll: {
    paddingRight: 2,
  },
  chip: {
    marginRight: 0,
  },
  input: {
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 20,
  },
});








