import 'colors';
import { footer, restoreEnv } from '../_utils';
import { origEnv } from './global-setup';

const globalTeardown = async (): Promise<void> => {
  console.log('\nTeardown...'.italic);
  restoreEnv(origEnv);
  console.log(footer);
};

export default globalTeardown;
