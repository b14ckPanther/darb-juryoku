// The synthetic upper-body pose that drives the overlay without a camera (demo, calibration preview).
import rawPose from '../../../../config/seed/demo/pose-fixture.yaml?raw';
import { parsePoseFixture } from '../overlay/geometry';

export const poseFixture = parsePoseFixture(rawPose, 'config/seed/demo/pose-fixture.yaml');
