import { ConfigModule as NConfigModule, ConfigModuleOptions } from '@nestjs/config';
import { config } from 'dotenv';

config();

export const generateAppConfig = (
  options: {
    isGlobal?: boolean,
    envFilePath?: [string, ...string[]] | string,
    validate?: ConfigModuleOptions['validate'],
  } = {}) => {
  const {
    isGlobal = true,
    envFilePath,
    validate,
  } = options;

  return NConfigModule
    .forRoot({
      isGlobal,
      envFilePath,
      validate,
    });
}
