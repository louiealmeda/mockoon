import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  mergeMap,
  tap
} from 'rxjs/operators';
import { Logger } from 'src/renderer/app/classes/logger';
import { Config } from 'src/renderer/app/config';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import {
  PreMigrationSettings,
  SettingsProperties
} from 'src/renderer/app/models/settings.model';
import { StorageService } from 'src/renderer/app/services/storage.service';
import { updateSettingsAction } from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';
import { Settings } from 'src/shared/models/settings.model';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  public oldLastMigration: number;
  private logger = new Logger('[SERVICE][SETTINGS]');

  private settingsSchema: Settings = {
    welcomeShown: false,
    analytics: true,
    bannerDismissed: [],
    logSizeLimit: 10000,
    maxLogsPerEnvironment: Config.defaultMaxLogsPerEnvironment,
    truncateRouteName: true,
    environmentMenuSize: undefined,
    routeMenuSize: undefined,
    logsMenuSize: undefined,
    fakerLocale: 'en',
    fakerSeed: null,
    lastChangelog: null,
    environments: []
  };
  private storageKey = 'settings';

  constructor(private store: Store, private storageService: StorageService) {
    // switch Faker locale
    this.store
      .select('settings')
      .pipe(
        filter((settings) => !!settings),
        distinctUntilChanged(
          (previous, current) =>
            previous.fakerLocale === current.fakerLocale &&
            previous.fakerSeed === current.fakerSeed
        ),
        tap((settings) => {
          MainAPI.send('APP_SET_FAKER_OPTIONS', {
            locale: settings.fakerLocale,
            seed: settings.fakerSeed
          });
        })
      )
      .subscribe();
  }

  /**
   * Get existing settings from storage or create default one.
   * Start saving after loading the data.
   *
   * @returns
   */
  public loadSettings(): Observable<Settings> {
    return this.storageService
      .loadData<PreMigrationSettings>(this.storageKey)
      .pipe(
        tap((settings: PreMigrationSettings) => {
          // if file is absent during first load we receive an empty object
          if (!settings) {
            this.logger.info('No Settings, building default settings');

            // build default settings (we do not need to show the changelog on a fresh install)
            this.updateSettings({
              ...this.settingsSchema,
              lastChangelog: Config.appVersion
            });
          } else {
            this.updateSettings({
              ...this.settingsSchema,
              ...this.migrateSettings(settings)
            });
          }
        })
      );
  }

  /**
   * Subscribe to initiate saving settings changes
   *
   * @returns
   */
  public saveSettings(): Observable<void> {
    return this.store.select('settings').pipe(
      tap(() => {
        this.storageService.initiateSaving();
      }),
      debounceTime(500),
      distinctUntilChanged(),
      mergeMap((settings) =>
        this.storageService.saveData<Settings>('settings', settings)
      )
    );
  }

  /**
   * Update the settings with new properties
   *
   * @param newProperties
   */
  public updateSettings(newProperties: SettingsProperties) {
    this.store.update(updateSettingsAction(newProperties));
  }

  /**
   * Handle the migration of some settings.
   * Adding new default settings is not needed and handled at
   * load time.
   */
  private migrateSettings(settings: PreMigrationSettings): Settings {
    // remove lastMigration from settings
    if (settings.lastMigration) {
      this.oldLastMigration = settings.lastMigration;
      delete settings.lastMigration;
    }

    return settings;
  }
}
