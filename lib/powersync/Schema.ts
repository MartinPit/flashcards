import { column, Schema, Table } from '@powersync/react-native';

export const AppSchema = new Schema({
  folders: new Table({
    user_id: column.text,
    name: column.text,
    parent_id: column.text,
    created_at: column.text,
  }),
  columns: new Table({
    user_id: column.text,
    label: column.text,
    order_index: column.integer,
  }),
  user_settings: new Table({
    user_id: column.text,
    front_columns: column.text,
    back_columns: column.text,
    updated_at: column.text,
  }),
  cards: new Table({
    user_id: column.text,
    folder_id: column.text,
    word_type: column.text,
    tag: column.text,
    data: column.text,
    created_at: column.text,
  }),
  practice_sessions: new Table({
    user_id: column.text,
    folder_id: column.text,
    tag: column.text,
    word_type: column.text,
    card_queue: column.text,
    current_index: column.integer,
    is_active: column.integer,
    last_accessed: column.text,
  }),
});

export type Database = (typeof AppSchema)['types'];
export type Folder = Database['folders'];
export type Column = Database['columns'];
export type UserSettings = Database['user_settings'];
export type Card = Database['cards'];
export type PracticeSession = Database['practice_sessions'];
