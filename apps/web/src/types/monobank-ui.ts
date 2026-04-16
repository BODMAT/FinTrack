export type StatsTransaction = {
  id: string;
  title: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  currencyCode: string;
  createdAt: Date;
};

export type ActionMode = "PREVIEW" | "IMPORT";
