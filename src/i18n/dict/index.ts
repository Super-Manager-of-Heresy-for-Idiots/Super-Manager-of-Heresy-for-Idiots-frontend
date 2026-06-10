import type { DictModule } from '../translations';
import { playerExtra } from './playerExtra';
import { campaigns } from './campaigns';
import { campaigns2 } from './campaigns2';
import { homebrew } from './homebrew';
import { admin } from './admin';
import { components } from './components';
import { components2 } from './components2';
import { components3 } from './components3';
import { wizard } from './wizard';
import { hooks } from './hooks';
import { wallet } from './wallet';
import { combat } from './combat';

/** Every feature dictionary module, merged into the final translations. */
export const modules: DictModule[] = [
  playerExtra,
  campaigns,
  campaigns2,
  homebrew,
  admin,
  components,
  components2,
  components3,
  wizard,
  hooks,
  wallet,
  combat,
];
