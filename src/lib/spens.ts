#!/usr/bin/env node
import * as fs from 'fs';

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { json2csv } from 'json-2-csv';
import removeAccents from 'remove-accents';
import { flatten } from 'safe-flat';

import { UNCLASSIFIED } from './constants';
import {
  SpensConfiguration,
  SpensDataCsvItem,
  SpensDataItem,
  SpensExpense,
  SpensExpenseSubcategory,
} from './interfaces';
import { readCsv, readYaml } from './utils';

export class Spens {
  items: SpensDataItem[] = [];
  expenses: SpensExpense[] = [];
  expenseSubcategories: SpensExpenseSubcategory[] = [];

  /**
   * @returns instance of Spens
   *
   * @param filePathCsv This is the file path for CSV containing details of each transaction.
   * @param filePathYaml This is the file path for YAML containing details of configuration and expenses.
   * @param filePathOutput This is the file path for the output file of Spens.
   *
   */
  async create(
    filePathCsv: string,
    filePathYaml: string,
    filePathOutput: string,
    dateFormats?: string[],
  ) {
    dayjs.extend(customParseFormat);

    // Read files and provide basic shape.
    const [csv, yaml]: [SpensDataCsvItem[], SpensConfiguration] =
      await Promise.all([
        readCsv(filePathCsv),
        readYaml<SpensConfiguration>(filePathYaml),
      ]);

    // Get configuration and flatten array of expenses.
    const [configuration, expensesCategories] = [
      yaml.Configuration,
      flatten(yaml.Expenses) as {
        [key: string]: string;
      },
    ];

    this.expenses = this.parseExpenseCategoryRowToExpense(expensesCategories);

    // Get array of spens data items that contain categories, value.
    this.items = this.parseCsvToSpensDataItem(
      csv,
      configuration,
      this.expenses,
      dateFormats,
    );

    // Get array of expenses based on the categories defined as tokens.
    this.expenseSubcategories = this.parseCsvToExpensesResults(this.items);

    await fs.writeFileSync(filePathOutput, json2csv(this.items), {
      encoding: 'utf-8',
    });

    return this;
  }

  /**
   * @returns formatted array of SpensExpense
   *
   * @param spensDataCsvItems This is the SpensDataCsvItem

   * @see {@link SpensExpense[]} for the returned data structure.
   */
  private readonly parseExpenseCategoryRowToExpense = (
    spensDataCsvItems: SpensDataCsvItem,
  ): SpensExpense[] =>
    Object.entries(spensDataCsvItems).map(([category, value]) => ({
      category: removeAccents(category.split('.')[0]),
      subcategory: removeAccents(category.split('.')[1]),
      value: value as string,
    }));

  /**
   * @returns formatted array of SpensDataItem[]
   *
   * @param csv This is the SpensDataCsvItem[]
   * @param configuration This is the SpensConfiguration - configuration object.
   * @param csv This is the SpensExpense[]

   * @see {@link SpensDataItem[]} for the returned data structure.
   */
  private readonly parseCsvToSpensDataItem = (
    csv: readonly SpensDataCsvItem[],
    configuration: Readonly<SpensConfiguration['Configuration']>,
    spensExpenses: readonly SpensExpense[],
    dateFormats?: string[],
  ): SpensDataItem[] =>
    csv
      .filter((record) =>
        configuration.TransactionTypeDebit.includes(
          record[configuration.TransactionTypeField],
        ),
      )
      .map((record) => ({
        amount: Math.abs(
          parseFloat(record[configuration.AmountField]),
        ).toString(),
        merchant: removeAccents(record[configuration.MerchantField]),
        date: record[configuration.DateField],
      }))
      .filter(
        (record) =>
          configuration.IgnoredStatements.filter((statement: string) =>
            record.merchant.toUpperCase().includes(statement.toUpperCase()),
          ).length === 0,
      )
      .map(({ amount, merchant, date }) => {
        const category = spensExpenses.find((expenseCategory) =>
          merchant.toUpperCase().includes(expenseCategory.value.toUpperCase()),
        );

        return {
          category: category?.category || '',
          subcategory: category?.subcategory || '',
          amount: parseFloat(amount),
          date: dayjs(date, dateFormats).toISOString(),
        };
      })
      .sort(
        (e1, e2) => new Date(e1.date).getTime() - new Date(e2.date).getTime(),
      );

  /**
   * @returns formatted array of SpensExpenseSubcategory[]
   *
   * @param expenses This is the SpensDataItem[].
   */
  parseCsvToExpensesResults = (
    expenses: readonly SpensDataItem[],
  ): SpensExpenseSubcategory[] => {
    const expensesResults = new Map();
    console.log('expenses', expenses);
    expenses.map(
      (entry) =>
        entry.category &&
        entry.subcategory &&
        expensesResults.set(`${entry.category}#${entry.subcategory}`, 0),
    );

    expensesResults.set(`${UNCLASSIFIED}`, 0);

    for (const expense of expenses) {
      if (
        `${expense.category}#${expense.subcategory}`.length > 1 &&
        expense.amount
      ) {
        const total =
          expensesResults.get(`${expense.category}#${expense.subcategory}`) +
          expense.amount;

        expensesResults.set(
          `${expense.category}#${expense.subcategory}`,
          parseFloat(parseFloat(total).toFixed(2)),
        );
      } else if (expense.amount && expense.category.length === 0) {
        const total = expensesResults.get(UNCLASSIFIED) + expense.amount;
        expensesResults.set(
          UNCLASSIFIED,
          parseFloat(parseFloat(total).toFixed(2)),
        );
      }
    }

    return Array.from(expensesResults, ([name, value]) => {
      const [category, subcategory] = name.split('#');

      return {
        category: category,
        subcategory: subcategory || '',
        amount: value,
      };
    });
  };
}
