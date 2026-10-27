// Demo mode only: the /design routes read their copy and sample numbers from config/seed/demo.
import rawSeed from '../../../../config/seed/demo/design.yaml?raw';
import { parseDesignSeed } from './design-seed';

export const designSeed = parseDesignSeed(rawSeed, 'config/seed/demo/design.yaml');
export { poseFixture } from './pose';
