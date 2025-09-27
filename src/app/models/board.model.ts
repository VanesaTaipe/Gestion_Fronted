export interface Card {
  id: number;
  title: string;
  assignee: string;
  tag: string;
}

export interface Column {
  id: number;
  title: string;
  color: string;
  cards: Card[];
}

export interface Board {
  id: number;
  name: string;
  columns: Column[];
}
