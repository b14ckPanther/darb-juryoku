// Demo mode only: the /design routes read their copy and sample numbers from config/seed/demo.
import rawSeed from '../../../../config/seed/demo/design.yaml?raw';
import rawPose from '../../../../config/seed/demo/pose-fixture.yaml?raw';
import { parsePoseFixture } from '../overlay/geometry';
import { parseDesignSeed } from './design-seed';

export const designSeed = parseDesignSeed(rawSeed, 'config/seed/demo/design.yaml');
export const poseFixture = parsePoseFixture(rawPose, 'config/seed/demo/pose-fixture.yaml');
