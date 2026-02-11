import { PowerSyncDatabase, SyncClientImplementation } from '@powersync/react-native';
import { SQLJSOpenFactory } from '@powersync/adapter-sql-js';
import { AppSchema } from './Schema';
import { SupabaseConnector } from './SupabaseConnector';
import { createContext, useContext } from 'react';
import Constants from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === "storeClient";

export class System {
  supabase: SupabaseConnector;
  powerSync: PowerSyncDatabase;

  constructor() {
    this.supabase = new SupabaseConnector();
    this.powerSync = new PowerSyncDatabase({
      schema: AppSchema,
      database: isExpoGo
        ? new SQLJSOpenFactory({
          dbFilename: 'powersync.db',
        })
        : new SQLJSOpenFactory({
          dbFilename: 'powersync.db',
        })
    });
  }

  async init() {
    await this.powerSync.init();
    await this.powerSync
      .connect(this.supabase, { clientImplementation: SyncClientImplementation.RUST })
      .then(() => console.log('connected'))
      .catch(console.error);
  }
};

export const system = new System();

export const SystemContext = createContext(system);
export const useSystem = () => useContext(SystemContext);
