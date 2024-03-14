import fs from 'fs';
import { Readable } from 'stream';

import test from 'ava';
import { stub } from 'sinon';

import { Spens } from './spens';

const tokensYml = `
  Configuration:
    AmountField: 'Amount'
    DateField: 'Started Date'
    MerchantField: 'Description'
    TransactionTypeField: 'Type'
    Currency: 'EUR'
    IgnoredStatements: ['MONITO', 'INET']
    TransactionTypeDebit: ['Debit', 'Direct Debit', 'Bill Payment', 'CARD_PAYMENT']
  Expenses:
    Shop:
      Amazon:
        - 'Amazon'
    Entertainment:
      Online:
        - 'Microsoft'
        - 'YouTube'
`;

const expensesCsv = `Started Date,Description,Amount,Type
2021-11-13 02:21:26,Amazon,-102.02,CARD_PAYMENT
2021-11-02 03:37:07,Amazon,-35.30,CARD_PAYMENT
2021-11-04 03:00:42,YouTube,-11.99,CARD_PAYMENT
2021-11-04 13:37:28,Microsoft,-12.99,CARD_PAYMENT
2021-11-04 13:27:28,Uncategorized,-12.99,CARD_PAYMENT
01/11/2022,Microsoft,-12.99,CARD_PAYMENT`;

test.before(() => {
  const readable = Readable.from(expensesCsv);

  stub(fs, 'createReadStream').returns(readable as fs.ReadStream);
  stub(fs, 'readFileSync').returns(tokensYml);
  stub(fs, 'writeFileSync').returns(undefined);
});

test('spens should ensure that items are returned based on CSV and tokens provided', async (t) => {
  const result = await new Spens().create(
    './expenses.csv',
    './tokens.yml',
    './output.csv',
    ['YYYY-MM-DD HH:mm:ss', 'DD/MM/YYYY'],
  );

  t.deepEqual(result.items, [
    {
      amount: 35.3,
      category: 'Shop',
      date: '2021-11-02T03:37:07.000Z',
      subcategory: 'Amazon',
    },
    {
      amount: 11.99,
      category: 'Entertainment',
      date: '2021-11-04T03:00:42.000Z',
      subcategory: 'Online',
    },
    {
      amount: 12.99,
      category: '',
      date: '2021-11-04T13:27:28.000Z',
      subcategory: '',
    },
    {
      amount: 12.99,
      category: 'Entertainment',
      date: '2021-11-04T13:37:28.000Z',
      subcategory: 'Online',
    },
    {
      amount: 102.02,
      category: 'Shop',
      date: '2021-11-13T02:21:26.000Z',
      subcategory: 'Amazon',
    },
    {
      amount: 12.99,
      category: 'Entertainment',
      date: '2022-11-01T00:00:00.000Z',
      subcategory: 'Online',
    },
  ]);
});

test('spens should ensure that expenses are parsed based on CSV', async (t) => {
  const result = await new Spens().create(
    './expenses.csv',
    './tokens.yml',
    './output.csv',
  );

  t.deepEqual(result.expenses, [
    {
      category: 'Shop',
      subcategory: 'Amazon',
      value: 'Amazon',
    },
    {
      category: 'Entertainment',
      subcategory: 'Online',
      value: 'Microsoft',
    },
    {
      category: 'Entertainment',
      subcategory: 'Online',
      value: 'YouTube',
    },
  ]);
});

test('spens should ensure that expense subcategories are parsed based on CSV', async (t) => {
  const result = await new Spens().create(
    './expenses.csv',
    './tokens.yml',
    './output.csv',
  );

  t.deepEqual(result.expenseSubcategories, [
    {
      amount: 137.32,
      category: 'Shop',
      subcategory: 'Amazon',
    },
    {
      amount: 37.97,
      category: 'Entertainment',
      subcategory: 'Online',
    },
    {
      amount: 12.99,
      category: 'Unclassified',
      subcategory: '',
    },
  ]);
});
