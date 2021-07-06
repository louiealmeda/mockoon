import { Environments } from '@mockoon/commons';
import {
  get as storageGet,
  getDataPath,
  set as storageSet
} from 'electron-json-storage';
import { info as logInfo } from 'electron-log';
import { sep as pathSeparator } from 'path';
import { promisify } from 'util';
import {
  EnvironmentDescriptor,
  Settings
} from '../../shared/models/settings.model';

export const migrateData = async () => {
  const settings: Settings = (await promisify(storageGet)(
    'settings'
  )) as Settings;

  // Do not migrate if empty object (= first load) or already migrated
  if (
    (Object.keys(settings).length === 0 && settings.constructor === Object) ||
    settings.environments !== undefined
  ) {
    logInfo('[MAIN][MIGRATION]Data already migrated to new storage system');

    return;
  }

  logInfo('[MAIN][MIGRATION]Migrating data to new storage system');

  const environmentsList: EnvironmentDescriptor[] = [];

  const environments: Environments = (await promisify(storageGet)(
    'environments'
  )) as Environments;

  for (
    let environmentIndex = 0;
    environmentIndex < environments.length;
    environmentIndex++
  ) {
    const environment = environments[environmentIndex];
    const environmentName = `environment-${environmentIndex}`;

    environmentsList.push({
      uuid: environment.uuid,
      path: `${getDataPath()}${pathSeparator}${environmentName}.json`
    });
    await promisify(storageSet)(environmentName, environment);
  }

  settings.environments = environmentsList;
  await promisify(storageSet)('settings', settings);

  logInfo('[MAIN][MIGRATION]Migration to new storage system done');
};
