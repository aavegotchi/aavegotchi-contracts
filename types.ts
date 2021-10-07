export interface GotchisOwned {
  id: string;
}
export interface UserGotchisOwned {
  id: string;
  gotchisOwned: GotchisOwned[];
}

export interface SubgraphGotchiUsers {
  users: UserGotchisOwned[];
}

export interface SubgraphGotchis {
  data: SubgraphGotchiUsers;
}
