export type ElementType = '土' | '火' | '岩';

export type MonsterData = {
  id: string;
  name: string;
  element: ElementType;
  hp: number;
  attack: number;
  defense: number;
  baseCatchRate?: number;
};

export type PlayerBattleState = {
  monster: MonsterData;
  currentHp: number;
  maxHp: number;
  seals: number;
};

export const WILD_MONSTERS: readonly MonsterData[] = [
  {
    id: 'tanuki',
    name: '狸貓妖',
    element: '土',
    hp: 30,
    attack: 8,
    defense: 5,
    baseCatchRate: 0.55
  },
  {
    id: 'fire-fox',
    name: '火狐',
    element: '火',
    hp: 26,
    attack: 10,
    defense: 4,
    baseCatchRate: 0.45
  },
  {
    id: 'stone-lantern',
    name: '石燈籠',
    element: '岩',
    hp: 40,
    attack: 6,
    defense: 8,
    baseCatchRate: 0.35
  }
];

export const PLAYER_MONSTER: MonsterData = {
  id: 'chiu-chiu',
  name: '啾啾',
  element: '土',
  hp: 35,
  attack: 9,
  defense: 5
};

const STARTING_SEALS = 5;

export const PLAYER_BATTLE_STATE: PlayerBattleState = {
  monster: PLAYER_MONSTER,
  currentHp: PLAYER_MONSTER.hp,
  maxHp: PLAYER_MONSTER.hp,
  seals: STARTING_SEALS
};

export const getRandomWildMonster = (): MonsterData => {
  const index = Math.floor(Math.random() * WILD_MONSTERS.length);
  return { ...WILD_MONSTERS[index] };
};

export const resetPlayerHp = (): void => {
  PLAYER_BATTLE_STATE.currentHp = PLAYER_BATTLE_STATE.maxHp;
};
