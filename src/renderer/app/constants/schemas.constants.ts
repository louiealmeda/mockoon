import * as Joi from 'joi';
import { Config } from 'src/renderer/app/config';
import { PreMigrationSettings } from 'src/renderer/app/models/settings.model';
import {
  EnvironmentDescriptor,
  Settings
} from 'src/shared/models/settings.model';

const settingsDefault = {
  welcomeShown: false,
  analytics: true,
  bannerDismissed: [],
  logSizeLimit: 10000,
  maxLogsPerEnvironment: Config.defaultMaxLogsPerEnvironment,
  truncateRouteName: true,
  environmentMenuSize: Config.defaultEnvironmentMenuSize,
  routeMenuSize: Config.defaultRouteMenuSize,
  logsMenuSize: Config.defaultLogsMenuSize,
  fakerLocale: 'en',
  fakerSeed: null,
  lastChangelog: Config.appVersion,
  environments: []
};

export const settingsSchema = Joi.object<Settings & PreMigrationSettings>({
  welcomeShown: Joi.boolean().failover(settingsDefault.welcomeShown).required(),
  analytics: Joi.boolean().failover(settingsDefault.analytics).required(),
  bannerDismissed: Joi.array()
    .items(Joi.string(), Joi.any().strip())
    .failover(settingsDefault.bannerDismissed)
    .required(),
  logSizeLimit: Joi.number()
    .min(1)
    .failover(settingsDefault.logSizeLimit)
    .required(),
  maxLogsPerEnvironment: Joi.number()
    .min(1)
    .failover(settingsDefault.maxLogsPerEnvironment)
    .required(),
  truncateRouteName: Joi.boolean()
    .failover(settingsDefault.truncateRouteName)
    .required(),
  environmentMenuSize: Joi.number()
    .min(Config.defaultEnvironmentMenuSize)
    .failover(settingsDefault.environmentMenuSize)
    .required(),
  routeMenuSize: Joi.number()
    .min(Config.defaultRouteMenuSize)
    .failover(settingsDefault.routeMenuSize)
    .required(),
  logsMenuSize: Joi.number()
    .min(Config.defaultLogsMenuSize)
    .failover(settingsDefault.logsMenuSize)
    .required(),
  fakerLocale: Joi.string().failover(settingsDefault.fakerLocale).required(),
  fakerSeed: Joi.number()
    .allow(null)
    .failover(settingsDefault.fakerSeed)
    .required(),
  lastChangelog: Joi.string()
    .failover(settingsDefault.lastChangelog)
    .required(),
  environments: Joi.array()
    .items(
      Joi.object<EnvironmentDescriptor>({
        uuid: Joi.string().required(),
        path: Joi.string().required()
      }),
      Joi.any().strip()
    )
    .failover(settingsDefault.environments)
    .required(),
  lastMigration: Joi.number().strip()
})
  .failover(settingsDefault)
  .default(settingsDefault)
  .options({ stripUnknown: true });
