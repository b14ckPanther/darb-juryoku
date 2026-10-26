import rawAppYaml from '../../../../config/app.yaml?raw';
import { parseAppConfig } from './load-config';

export type { AppConfig } from './load-config';

export const appConfig = parseAppConfig(rawAppYaml, 'config/app.yaml');
