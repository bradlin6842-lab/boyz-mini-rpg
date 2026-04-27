export type ElementType = '土' | '火' | '岩';

export type MonsterData = {
  id: string;
  name: string;
  element: ElementType;
  hp: number;
  attack: number;
  defense: number;
};

export const WILD_MONSTERS: readonly MonsterData[] = [
  {
    id: 'tanuki',
    name: '狸貓妖',
    element: '土',
    hp: 30,
    attack: 8,
    defense: 5
  },
  {
    id: 'fire-fox',
    name: '火狐',
    element: '火',
    hp: 26,
    attack: 10,
    defense: 4
  },
  {
    id: 'stone-lantern',
    name: '石燈籠',
    element: '岩',
    hp: 40,
    attack: 6,
    defense: 8
  }
];

export const PLAYER_MONSTER: MonsterData = {
  id: 'starter',
  name: '初始妖怪',
  element: '土',
  hp: 35,
  attack: 7,
  defense: 6
};

export const getRandomWildMonster = (): MonsterData => {
  const index = Math.floor(Math.random() * WILD_MONSTERS.length);
  return { ...WILD_MONSTERS[index] };
};
