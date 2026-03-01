import { PowerSyncDatabase, SyncClientImplementation } from '@powersync/react-native';
import { AppSchema } from './Schema';
import { SupabaseConnector } from './SupabaseConnector';
import { createContext, useContext } from 'react';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export class System {
  supabase: SupabaseConnector;
  powerSync!: PowerSyncDatabase;

  constructor() {
    this.supabase = new SupabaseConnector();
  }

  init = async () => {
    if (this.powerSync) return;

    let factory;
    if (isExpoGo) {
      const { SQLJSOpenFactory } = await import('@powersync/adapter-sql-js');
      console.log('Running in Expo Go - using SQL.js adapter for PowerSync');
      factory = new SQLJSOpenFactory({ dbFilename: 'powersync.db' });
    } else {
      const { OPSqliteOpenFactory } = await import('@powersync/op-sqlite');
      console.log('Running in Expo Dev Client or Native - using OP-SQLite adapter for PowerSync');
      factory = new OPSqliteOpenFactory({ dbFilename: 'powersync.db' });
    }

    this.powerSync = new PowerSyncDatabase({
      schema: AppSchema,
      database: factory,
    });

    await this.powerSync.init();
    await this.connect();
  }

  connect = async () => {
    // Add a guard just in case it's called prematurely from a component
    if (!this.powerSync) {
      console.warn("Connect called before PowerSync was initialized");
      return;
    }

    await this.powerSync
      .connect(this.supabase, {
        clientImplementation: SyncClientImplementation.RUST
      })
      .then(() => console.log('PowerSync Connected'))
      .catch(console.error);
  };
}

export const system = new System();
export const SystemContext = createContext(system);
export const useSystem = () => useContext(SystemContext);
