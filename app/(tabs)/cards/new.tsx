import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { Button, Divider, TextInput, Appbar, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack } from 'expo-router';
import { usePowerSync, useQuery } from '@powersync/react-native';
import { useAuth } from '@/hooks/use-auth-context';
import { Column, Folder } from '@/lib/powersync/Schema';
import { withUniwind } from 'uniwind';
import { randomUUID } from 'expo-crypto';
import { useFolderPicker } from '@/components/modals/folder-picker';

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledSafeAreaView = withUniwind(SafeAreaView);

const BREAKPOINT = 768;
const TAG_OPTIONS = ['New', 'Hard', 'Ok', 'Easy'] as const;
const WORD_TYPE_OPTIONS = ['Nomen', 'Verben', 'Artikel', 'Adjektive', 'Pronomen', 'Adverbien', 'Andere'] as const;
const ARTICLE_COLORS: Record<string, string> = {
  Der: '#3b82f6',
  Die: '#ec4899',
  Das: '#22c55e',
};

type ContentSectionProps = {
  title: string;
  columns: string[];
  values: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
};

function ContentSection({ title, columns, values, onChange }: ContentSectionProps) {
  return (
    <StyledView className="mb-6">
      <StyledText variant="titleSmall" className="text-on-surface mb-2">{title}</StyledText>
      {columns.map(col => (
        <TextInput
          key={`${title.toLowerCase()}-${col}`}
          label={col}
          value={values[col] || ''}
          onChangeText={text => onChange({ ...values, [col]: text })}
          mode="outlined"
          className="mb-3"
        />
      ))}
    </StyledView>
  );
}

type ColumnPickerProps = {
  title: string;
  selected: string[];
  side: 'front' | 'back';
  allColumnNames: string[];
  onToggle: (columnName: string, side: 'front' | 'back') => void;
};

function ColumnPicker({ title, selected, side, allColumnNames, onToggle }: ColumnPickerProps) {
  return (
    <StyledView className="mb-4">
      <StyledText variant="labelLarge" className="text-on-surface mb-2">{title}</StyledText>
      {allColumnNames.length === 0 ? (
        <StyledText className="text-on-surface-variant">
          No categories defined yet. Create categories first to select front/back columns.
        </StyledText>
      ) : (
        <StyledView className="flex-row flex-wrap gap-2">
          {allColumnNames.map((columnName) => (
            <Chip
              key={`${side}-${columnName}`}
              selected={selected.includes(columnName)}
              onPress={() => onToggle(columnName, side)}
              mode="outlined"
            >
              {columnName}
            </Chip>
          ))}
        </StyledView>
      )}
    </StyledView>
  );
}

type PreviewCardProps = {
  previewTitle: string;
  frontPreviewRows: string[];
  backPreviewRows: string[];
  frontFields: Record<string, string>;
  backFields: Record<string, string>;
};

function PreviewCard({ previewTitle, frontPreviewRows, backPreviewRows, frontFields, backFields }: PreviewCardProps) {
  return (
    <StyledView className="mx-4 mt-2 mb-3 rounded-2xl border border-outline-variant bg-surface-variant p-5 min-h-52">
      <StyledText variant="titleLarge" className="text-on-surface mb-1">
        {previewTitle}
      </StyledText>
      <StyledText className="text-on-surface-variant mb-3">Live flashcard preview</StyledText>
      <Divider className="mb-4" />
      {frontPreviewRows.length === 0 && backPreviewRows.length === 0 ? (
        <StyledText className="text-on-surface-variant">
          Start typing values to preview this flashcard.
        </StyledText>
      ) : (
        <StyledView className="gap-3">
          {frontPreviewRows.map((column) => (
            <StyledView key={`front-preview-${column}`} className="rounded-xl bg-surface p-3">
              <StyledText className="text-primary font-medium mb-1">Front</StyledText>
              <StyledText className="text-on-surface-variant">{column}</StyledText>
              <StyledText className="text-on-surface mt-1">{frontFields[column] || '-'}</StyledText>
            </StyledView>
          ))}
          {backPreviewRows.map((column) => (
            <StyledView key={`back-preview-${column}`} className="rounded-xl bg-surface p-3">
              <StyledText className="text-tertiary font-medium mb-1">Back</StyledText>
              <StyledText className="text-on-surface-variant">{column}</StyledText>
              <StyledText className="text-on-surface mt-1">{backFields[column] || '-'}</StyledText>
            </StyledView>
          ))}
        </StyledView>
      )}
    </StyledView>
  );
}

export default function NewCard() {
  const params = useLocalSearchParams<{ folderId?: string }>();
  const { session } = useAuth();
  const powerSync = usePowerSync();

  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [frontFields, setFrontFields] = useState<Record<string, string>>({});
  const [backFields, setBackFields] = useState<Record<string, string>>({});
  const [selectedFrontColumns, setSelectedFrontColumns] = useState<string[]>([]);
  const [selectedBackColumns, setSelectedBackColumns] = useState<string[]>([]);
  const [wordType, setWordType] = useState<(typeof WORD_TYPE_OPTIONS)[number]>('Andere');
  const [tag, setTag] = useState<(typeof TAG_OPTIONS)[number]>('New');
  const [loading, setLoading] = useState(false);

  const { folderId, showPicker, FolderPickerComponent } = useFolderPicker(params.folderId || null);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => subscription.remove();
  }, []);

  const isTablet = screenWidth >= BREAKPOINT;

  const { data: allFolders } = useQuery<Folder>(
    session?.user.id ? `SELECT * FROM folders WHERE user_id = ? ORDER BY name` : null,
    session?.user.id ? [session.user.id] : []
  );

  const { data: columns } = useQuery<Column>(
    session?.user.id ? `SELECT * FROM columns WHERE user_id = ? ORDER BY label` : null,
    session?.user.id ? [session.user.id] : []
  );

  const { data: userSettings } = useQuery(
    `SELECT * FROM user_settings WHERE user_id = ?`,
    session?.user.id ? [session.user.id] : []
  );

  const settingsFrontColumns = useMemo(() => {
    if (userSettings && userSettings.length > 0) {
      try {
        const cols = JSON.parse(userSettings[0].front_columns || '[]');
        return Array.isArray(cols) ? cols : [];
      } catch {
        return [];
      }
    }
    return [];
  }, [userSettings]);

  const settingsBackColumns = useMemo(() => {
    if (userSettings && userSettings.length > 0) {
      try {
        const cols = JSON.parse(userSettings[0].back_columns || '[]');
        return Array.isArray(cols) ? cols : [];
      } catch {
        return [];
      }
    }
    return [];
  }, [userSettings]);

  const allColumnNames = useMemo(() => {
    const fromCategoriesOnly = (columns ?? [])
      .map((column) => column.label?.trim())
      .filter((label): label is string => Boolean(label));
    return Array.from(new Set(fromCategoriesOnly));
  }, [columns]);

  useEffect(() => {
    if (selectedFrontColumns.length === 0) {
      setSelectedFrontColumns(settingsFrontColumns.filter((label) => allColumnNames.includes(label)));
    }
    if (selectedBackColumns.length === 0) {
      setSelectedBackColumns(settingsBackColumns.filter((label) => allColumnNames.includes(label)));
    }
  }, [allColumnNames, selectedBackColumns.length, selectedFrontColumns.length, settingsBackColumns, settingsFrontColumns]);

  useEffect(() => {
    if (selectedFrontColumns.length > 0 || selectedBackColumns.length > 0 || allColumnNames.length === 0) return;
    if (allColumnNames.length === 1) {
      setSelectedFrontColumns([allColumnNames[0]]);
      setSelectedBackColumns([allColumnNames[0]]);
      return;
    }

    setSelectedFrontColumns([allColumnNames[0]]);
    setSelectedBackColumns([allColumnNames[1]]);
  }, [allColumnNames, selectedBackColumns.length, selectedFrontColumns.length]);

  const selectedFolder = useMemo(() => {
    if (!folderId || !allFolders) return null;
    return allFolders.find(f => f.id === folderId);
  }, [folderId, allFolders]);

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

  const toggleColumn = (
    columnName: string,
    side: 'front' | 'back'
  ) => {
    if (side === 'front') {
      setSelectedFrontColumns((prev) => {
        if (prev.includes(columnName)) {
          return prev.filter((column) => column !== columnName);
        }
        return [...prev, columnName];
      });
      return;
    }

    setSelectedBackColumns((prev) => {
      if (prev.includes(columnName)) {
        return prev.filter((column) => column !== columnName);
      }
      return [...prev, columnName];
    });
  };

  const getMainTerm = () => {
    const firstFilled = selectedFrontColumns.find((column) => (frontFields[column] ?? '').trim().length > 0);
    if (!firstFilled) return '';
    return frontFields[firstFilled] ?? '';
  };

  const nounArticleMeta = useMemo(() => {
    if (wordType !== 'Nomen') return null;
    const value = getMainTerm().trim();
    if (!value) return null;

    const article = value.split(/\s+/)[0];
    const color = ARTICLE_COLORS[article];
    if (!color) return null;

    return { article, color };
  }, [frontFields, selectedFrontColumns, wordType]);

  const handleSave = async () => {
    if (!folderId || !session?.user.id) return;

    setLoading(true);
    try {
      const newId = randomUUID();
      const filteredFront = Object.fromEntries(
        Object.entries(frontFields).filter(([, value]) => value.trim().length > 0)
      );
      const filteredBack = Object.fromEntries(
        Object.entries(backFields).filter(([, value]) => value.trim().length > 0)
      );

      const mainFrontColumn = selectedFrontColumns[0];
      const previewFront = mainFrontColumn ? filteredFront[mainFrontColumn] : null;

      const dataObj: Record<string, Record<string, string>> = {
        front: filteredFront,
        back: filteredBack,
      };
      const payload = {
        ...dataObj,
        frontColumns: selectedFrontColumns,
        backColumns: selectedBackColumns,
        frontText: previewFront ?? null,
      };

      await powerSync.execute(
        `INSERT INTO cards (id, user_id, folder_id, word_type, tag, data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [newId, session.user.id, folderId, wordType, tag, JSON.stringify(payload), new Date().toISOString()]
      );

      setFrontFields({});
      setBackFields({});
      setWordType('Andere');
      setTag('New');
    } catch (error) {
      console.error("Create card failed", error);
    } finally {
      setLoading(false);
    }
  };

  const hasFrontValue = selectedFrontColumns.some((column) => (frontFields[column] ?? '').trim().length > 0);
  const hasBackValue = selectedBackColumns.some((column) => (backFields[column] ?? '').trim().length > 0);
  const canSave = Boolean(folderId) && selectedFrontColumns.length > 0 && selectedBackColumns.length > 0 && hasFrontValue && hasBackValue;

  const frontPreviewRows = selectedFrontColumns.filter((column) => (frontFields[column] ?? '').trim().length > 0);
  const backPreviewRows = selectedBackColumns.filter((column) => (backFields[column] ?? '').trim().length > 0);
  const previewTitle = getMainTerm().trim() || 'Card preview';

  if (isTablet) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <StyledSafeAreaView className="flex-1 bg-surface" edges={['left', 'right']}>
          <Appbar.Header elevated={false}>
            <Appbar.Content title="New Card" />
            <Appbar.Action icon="check" onPress={handleSave} disabled={!canSave || loading} />
          </Appbar.Header>
          
          <StyledView className="flex-1 flex-row">
            <StyledView className="w-80 border-r border-outline-variant flex-none bg-surface-variant/30">
              <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
                <StyledView className="mb-4">
                  <StyledText variant="labelLarge" className="text-on-surface mb-2">Card Set</StyledText>
                  <Button 
                    mode="outlined" 
                    onPress={showPicker}
                    icon="cards"
                    contentStyle={{ flexDirection: 'row-reverse' }}
                    className="justify-start"
                  >
                    {selectedFolder ? buildPath(selectedFolder) : 'Select card set'}
                  </Button>
                </StyledView>

                <Divider className="my-4" />

                <StyledView className="mb-4">
                  <StyledText variant="labelLarge" className="text-on-surface mb-2">Word Type</StyledText>
                  <StyledView className="flex-row flex-wrap gap-2">
                    {WORD_TYPE_OPTIONS.map((option) => (
                      <Chip
                        key={option}
                        selected={wordType === option}
                        onPress={() => setWordType(option)}
                      >
                        {option}
                      </Chip>
                    ))}
                  </StyledView>
                  {nounArticleMeta && (
                    <StyledText className="text-on-surface-variant mt-2">
                      Noun article detected: <Text style={{ color: nounArticleMeta.color }}>{nounArticleMeta.article}</Text>
                    </StyledText>
                  )}
                </StyledView>

                <StyledView className="mb-4">
                  <StyledText variant="labelLarge" className="text-on-surface mb-2">Tag</StyledText>
                  <StyledView className="flex-row flex-wrap gap-2">
                    {TAG_OPTIONS.map((option) => (
                      <Chip
                        key={option}
                        selected={tag === option}
                        onPress={() => setTag(option)}
                      >
                        {option}
                      </Chip>
                    ))}
                  </StyledView>
                </StyledView>

              </ScrollView>
            </StyledView>
            
            <StyledView className="flex-1">
              <PreviewCard
                previewTitle={previewTitle}
                frontPreviewRows={frontPreviewRows}
                backPreviewRows={backPreviewRows}
                frontFields={frontFields}
                backFields={backFields}
              />
              <ScrollView className="flex-1 px-4 pb-4" showsVerticalScrollIndicator={false}>
                <ColumnPicker
                  title="Front Face Columns"
                  selected={selectedFrontColumns}
                  side="front"
                  allColumnNames={allColumnNames}
                  onToggle={toggleColumn}
                />
                <ColumnPicker
                  title="Back Face Columns"
                  selected={selectedBackColumns}
                  side="back"
                  allColumnNames={allColumnNames}
                  onToggle={toggleColumn}
                />
                <Divider className="my-4" />
                <ContentSection 
                  title="Front" 
                  columns={selectedFrontColumns}
                  values={frontFields} 
                  onChange={setFrontFields} 
                />
                <ContentSection 
                  title="Back" 
                  columns={selectedBackColumns}
                  values={backFields} 
                  onChange={setBackFields} 
                />

              </ScrollView>
            </StyledView>
          </StyledView>
        </StyledSafeAreaView>
        
        <FolderPickerComponent cardSetOnly />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StyledSafeAreaView className="flex-1 bg-surface" edges={['left', 'right']}>
        <Appbar.Header elevated={false}>
          <Appbar.Content title="New Card" />
          <Appbar.Action icon="check" onPress={handleSave} disabled={!canSave || loading} />
        </Appbar.Header>

        <PreviewCard
          previewTitle={previewTitle}
          frontPreviewRows={frontPreviewRows}
          backPreviewRows={backPreviewRows}
          frontFields={frontFields}
          backFields={backFields}
        />
        <ScrollView className="flex-1 px-4 pb-4" showsVerticalScrollIndicator={false}>
          <StyledView className="mb-6">
            <StyledText variant="labelLarge" className="text-on-surface mb-2">Card Set</StyledText>
            <Button 
              mode="outlined" 
              onPress={showPicker}
              icon="cards"
              contentStyle={{ flexDirection: 'row-reverse' }}
            >
              {selectedFolder ? buildPath(selectedFolder) : 'Select card set'}
            </Button>
          </StyledView>

          <Divider className="my-4" />

          <StyledView className="mb-6">
            <StyledText variant="labelLarge" className="text-on-surface mb-2">Word Type</StyledText>
            <StyledView className="flex-row flex-wrap gap-2">
              {WORD_TYPE_OPTIONS.map((option) => (
                <Chip
                  key={option}
                  selected={wordType === option}
                  onPress={() => setWordType(option)}
                >
                  {option}
                </Chip>
              ))}
            </StyledView>
            {nounArticleMeta && (
              <StyledText className="text-on-surface-variant mt-2">
                Noun article detected: <Text style={{ color: nounArticleMeta.color }}>{nounArticleMeta.article}</Text>
              </StyledText>
            )}
          </StyledView>

          <StyledView className="mb-6">
            <StyledText variant="labelLarge" className="text-on-surface mb-2">Tag</StyledText>
            <StyledView className="flex-row flex-wrap gap-2">
              {TAG_OPTIONS.map((option) => (
                <Chip
                  key={option}
                  selected={tag === option}
                  onPress={() => setTag(option)}
                >
                  {option}
                </Chip>
              ))}
            </StyledView>
          </StyledView>

          <Divider className="my-4" />

          <ColumnPicker
            title="Front Face Columns"
            selected={selectedFrontColumns}
            side="front"
            allColumnNames={allColumnNames}
            onToggle={toggleColumn}
          />
          <ColumnPicker
            title="Back Face Columns"
            selected={selectedBackColumns}
            side="back"
            allColumnNames={allColumnNames}
            onToggle={toggleColumn}
          />

          <ContentSection 
            title="Front" 
            columns={selectedFrontColumns}
            values={frontFields} 
            onChange={setFrontFields} 
          />
          <ContentSection 
            title="Back" 
            columns={selectedBackColumns}
            values={backFields} 
            onChange={setBackFields} 
          />

        </ScrollView>
      </StyledSafeAreaView>
      
      <FolderPickerComponent cardSetOnly />
    </>
  );
}