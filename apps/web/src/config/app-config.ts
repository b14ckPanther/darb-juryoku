import { parse } from 'yaml';
import rawAppYaml from '../../../../config/app.yaml?raw';

export interface AppConfig {
  name: string;
}

export const appConfig = parse(rawAppYaml) as AppConfig;
