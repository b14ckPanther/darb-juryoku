// The committed design tokens and brand palette, loaded the same way the app loads them.
import rawTokens from '../../../../config/design/tokens.yaml?raw';
import brand from '../../../../brand/src/tokens.json';
import { designTokens } from '../design';

export { rawTokens, brand };
export const tokens = designTokens;
