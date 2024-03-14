export interface SpensConfiguration {
  Configuration: {
    AmountField: string;
    Currency: string;
    DateField: string;
    IgnoredStatements: string[];
    MerchantField: string;
    TransactionTypeDebit: string[];
    TransactionTypeField: string;
  };
  Expenses: {
    [key: string]: {
      [key: string]: string[];
    };
  };
}

export interface SpensDataCsvItem {
  [key: string]: string;
}

export interface SpensDataItem {
  amount: number;
  category: string;
  date: string;
  subcategory: string;
}

export interface SpensExpense {
  category: string;
  subcategory?: string;
  value: string;
}

export interface SpensExpenseSubcategory {
  amount: number;
  category: string;
  subcategory: string;
}
