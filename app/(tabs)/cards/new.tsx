import React, { useState, useMemo, useEffect } from 'react';
import { View, ScrollView, Dimensions, Pressable } from 'react-native';
import { Button, Divider, TextInput, Appbar, Chip, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { withUniwind } from 'uniwind';
import { useAuth } from '@/hooks/use-auth-context';
import { usePowerSync, useQuery } from '@powersync/react-native';
import { useFolderPicker } from '@/components/modals/folder-picker';
import { Column, Folder } from '@/lib/powersync/Schema';
import { randomUUID } from 'expo-crypto';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

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

type PreviewCardProps = {
  word: string;
  frontFields: Record<string, string>;
  backFields: Record<string, string>;
  frontColumns: string[];
  backColumns: string[];
  showSide: 'front' | 'back';
  onFlip: () => void;
};

function PreviewCard({ word, frontFields, backFields, frontColumns, backColumns, showSide, onFlip }: PreviewCardProps) {
  const isFront = showSide === 'front';
  const frontFilledColumns = frontColumns.filter((column) => (frontFields[column] ?? '').trim().length > 0);
  const backFilledColumns = backColumns.filter((column) => (backFields[column] ?? '').trim().length > 0);

  const flipProgress = useSharedValue(0);

  useEffect(() => {
    flipProgress.value = withTiming(isFront ? 0 : 1, {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFront]);

  const frontAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scaleX: 1 - flipProgress.value },
      ],
      opacity: flipProgress.value < 0.5 ? 1 : 0,
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scaleX: flipProgress.value },
      ],
      opacity: flipProgress.value >= 0.5 ? 1 : 0,
    };
  });

  return (
    <Pressable onPress={onFlip} className="mx-4 mt-2 mb-3">
      <Animated.View style={frontAnimatedStyle} className="rounded-2xl border border-outline-variant bg-surface-variant p-5 min-h-40">
        {!word.trim() && frontFilledColumns.length === 0 ? (
          <StyledText className="text-on-surface-variant">
            Tap to flip card.
          </StyledText>
        ) : (
          <StyledView className="gap-3">
            {word.trim() && (
              <StyledText className="text-2xl font-bold text-on-surface">{word}</StyledText>
            )}
            {frontFilledColumns.map((column) => (
              <StyledView key={`preview-${column}`} className="rounded-xl bg-surface p-3">
                <StyledText className="text-on-surface-variant text-sm">{column}</StyledText>
                <StyledText className="text-on-surface text-lg mt-1">{frontFields[column] || '-'}</StyledText>
              </StyledView>
            ))}
          </StyledView>
        )}
      </Animated.View>
      <Animated.View style={[backAnimatedStyle, { position: 'absolute', top: 0, left: 0, right: 0 }]} className="rounded-2xl border border-outline-variant bg-surface-variant p-5 min-h-40">
        {!word.trim() && backFilledColumns.length === 0 ? (
          <StyledText className="text-on-surface-variant">
            Tap to flip card.
          </StyledText>
        ) : (
          <StyledView className="gap-3">
            {backFilledColumns.map((column) => (
              <StyledView key={`preview-back-${column}`} className="rounded-xl bg-surface p-3">
                <StyledText className="text-on-surface-variant text-sm">{column}</StyledText>
                <StyledText className="text-on-surface text-lg mt-1">{backFields[column] || '-'}</StyledText>
              </StyledView>
            ))}
          </StyledView>
        )}
      </Animated.View>
    </Pressable>
  );
}

export default function NewCard() {
  const params = useLocalSearchParams<{ folderId?: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const powerSync = usePowerSync();

  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [word, setWord] = useState('');
  const [frontFields, setFrontFields] = useState<Record<string, string>>({});
  const [backFields, setBackFields] = useState<Record<string, string>>({});
  const [frontColumns, setFrontColumns] = useState<string[]>([]);
  const [backColumns, setBackColumns] = useState<string[]>([]);
  const [wordType, setWordType] = useState<(typeof WORD_TYPE_OPTIONS)[number]>('Andere');
  const [tag, setTag] = useState<(typeof TAG_OPTIONS)[number]>('New');
  const [loading, setLoading] = useState(false);
  const [showCardSide, setShowCardSide] = useState<'front' | 'back'>('front');

  const { folderId, showPicker, FolderPickerComponent } = useFolderPicker(params.folderId || null);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => subscription.remove();
  }, []);

  const isTablet = screenWidth >= BREAKPOINT;

  const { data: allFolders } = useQuery<Folder>(
    `SELECT * FROM folders WHERE user_id = ? ORDER BY name`,
    session?.user.id ? [session.user.id] : []
  );

  const { data: columns } = useQuery<Column>(
    `SELECT * FROM columns WHERE user_id = ? ORDER BY label`,
    session?.user.id ? [session.user.id] : []
  );

  const allColumnNames = useMemo(() => {
    const fromCategoriesOnly = (columns ?? [])
      .map((column) => column.label?.trim())
      .filter((label): label is string => Boolean(label));
    return Array.from(new Set(fromCategoriesOnly));
  }, [columns]);

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

  const toggleFront = (columnName: string) => {
    setFrontColumns((prev) => {
      if (prev.includes(columnName)) {
        return prev.filter((c) => c !== columnName);
      }
      setBackColumns((bprev) => bprev.filter((c) => c !== columnName));
      return [...prev, columnName];
    });
  };

  const toggleBack = (columnName: string) => {
    setBackColumns((prev) => {
      if (prev.includes(columnName)) {
        return prev.filter((c) => c !== columnName);
      }
      setFrontColumns((fprev) => fprev.filter((c) => c !== columnName));
      return [...prev, columnName];
    });
  };

  const flipCard = () => {
    setShowCardSide((prev) => (prev === 'front' ? 'back' : 'front'));
  };

  const nounArticleMeta = useMemo(() => {
    if (wordType !== 'Nomen') return null;
    const value = word.trim();
    if (!value) return null;

    const article = value.split(/\s+/)[0];
    const color = ARTICLE_COLORS[article];
    if (!color) return null;

    return { article, color };
  }, [word, wordType]);

  const handleSave = async () => {
    if (!folderId || !session?.user.id || !word.trim()) return;

    setLoading(true);
    try {
      const newId = randomUUID();
      const filteredFront = Object.fromEntries(
        Object.entries(frontFields).filter(([, value]) => value.trim().length > 0)
      );
      const filteredBack = Object.fromEntries(
        Object.entries(backFields).filter(([, value]) => value.trim().length > 0)
      );

      const dataPayload = {
        front: filteredFront,
        back: filteredBack,
        frontColumns: frontColumns,
        backColumns: backColumns,
      };

      await powerSync.execute(
        `INSERT INTO cards (id, user_id, folder_id, word, word_type, tag, data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [newId, session.user.id, folderId, word.trim(), wordType, tag, JSON.stringify(dataPayload), new Date().toISOString()]
      );

      router.back();
    } catch (error) {
      console.error("Create card failed", error);
    } finally {
      setLoading(false);
    }
  };

  const canSave = Boolean(folderId) && word.trim().length > 0;

  const renderFieldInput = (column: string, side: 'front' | 'back') => {
    const fields = side === 'front' ? frontFields : backFields;
    const setFields = side === 'front' ? setFrontFields : setBackFields;
    return (
      <TextInput
        key={`${side}-${column}`}
        label={column}
        value={fields[column] || ''}
        onChangeText={text => setFields({ ...fields, [column]: text })}
        mode="outlined"
      />
    );
  };

  const renderColumnChips = (
    listColumns: string[],
    onToggle: (col: string) => void
  ) => (
    <StyledView className="flex-row flex-wrap gap-2">
      {allColumnNames.map((col) => {
        const isSelected = listColumns.includes(col);
        return (
          <Chip
            key={col}
            selected={isSelected}
            onPress={() => onToggle(col)}
            mode={isSelected ? 'flat' : 'outlined'}
          >
            {col}
          </Chip>
        );
      })}
    </StyledView>
  );

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
                word={word}
                frontFields={frontFields}
                backFields={backFields}
                frontColumns={frontColumns}
                backColumns={backColumns}
                showSide={showCardSide}
                onFlip={flipCard}
              />
              <ScrollView className="flex-1 px-4 pb-4" showsVerticalScrollIndicator={false}>
                <StyledView className="mb-6">
                  <StyledText variant="labelLarge" className="text-on-surface mb-2">Word</StyledText>
                  <TextInput
                    label="Word"
                    value={word}
                    onChangeText={setWord}
                    mode="outlined"
                  />
                </StyledView>

                <Divider className="my-4" />

                <StyledView className="mb-4">
                  <StyledText variant="labelLarge" className="text-on-surface mb-2">Front</StyledText>
                  {renderColumnChips(frontColumns, toggleFront)}
                </StyledView>

                <StyledView className="mb-4">
                  <StyledText variant="labelLarge" className="text-on-surface mb-2">Back</StyledText>
                  {renderColumnChips(backColumns, toggleBack)}
                </StyledView>

                {frontColumns.length > 0 && (
                  <StyledView className="mb-6">
                    <StyledText variant="titleSmall" className="text-on-surface mb-2">Front Values</StyledText>
                    {frontColumns.map((col) => renderFieldInput(col, 'front'))}
                  </StyledView>
                )}

                {backColumns.length > 0 && (
                  <StyledView className="mb-6">
                    <StyledText variant="titleSmall" className="text-on-surface mb-2">Back Values</StyledText>
                    {backColumns.map((col) => renderFieldInput(col, 'back'))}
                  </StyledView>
                )}

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
          word={word}
          frontFields={frontFields}
          backFields={backFields}
          frontColumns={frontColumns}
          backColumns={backColumns}
          showSide={showCardSide}
          onFlip={flipCard}
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

          <StyledView className="mb-6">
            <StyledText variant="labelLarge" className="text-on-surface mb-2">Word</StyledText>
            <TextInput
              label="Word"
              value={word}
              onChangeText={setWord}
              mode="outlined"
            />
          </StyledView>

          <Divider className="my-4" />

          <StyledView className="mb-4">
            <StyledText variant="labelLarge" className="text-on-surface mb-2">Front</StyledText>
            {renderColumnChips(frontColumns, toggleFront)}
          </StyledView>

          <StyledView className="mb-4">
            <StyledText variant="labelLarge" className="text-on-surface mb-2">Back</StyledText>
            {renderColumnChips(backColumns, toggleBack)}
          </StyledView>

          {frontColumns.length > 0 && (
            <StyledView className="mb-6">
              <StyledText variant="titleSmall" className="text-on-surface mb-2">Front Values</StyledText>
              {frontColumns.map((col) => renderFieldInput(col, 'front'))}
            </StyledView>
          )}

          {backColumns.length > 0 && (
            <StyledView className="mb-6">
              <StyledText variant="titleSmall" className="text-on-surface mb-2">Back Values</StyledText>
              {backColumns.map((col) => renderFieldInput(col, 'back'))}
            </StyledView>
          )}

        </ScrollView>
      </StyledSafeAreaView>

      <FolderPickerComponent cardSetOnly />
    </>
  );
}
