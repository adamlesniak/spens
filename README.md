# spens

Convert bank statements with tags onto charts and easily accessible metrics.

## Combine statements

You can merge and combine statements using stack or utility of your choice such as `awk` or [csvkit](https://csvkit.readthedocs.io/en/latest/scripts/csvgrep.html).

Combine costs from different statements:

```
csvgrep -c 1 -r "CARD_PAYMENT" data/revolut_statement.csv | csvcut -c "Started Date","Description","Amount" > data/output.csv
csvgrep -c 10 -r "Debit" data/aib_statement.csv | csvcut -c " Posted Transactions Date","Description1"," Debit Amount" | tail -n +2 >> data/output.csv
```

## Example statement

```
Started Date,Description,Amount,Type
2021-11-13 02:21:26,Amazon,-102.02,CARD_PAYMENT
2021-11-02 03:37:07,Amazon,-35.30,CARD_PAYMENT
2021-11-04 03:00:42,YouTube,-11.99,CARD_PAYMENT
2021-11-04 13:37:28,Microsoft,-12.99,CARD_PAYMENT
```

## Example development usage with sample data

Input:

```
Started Date,Description,Amount,Type
2021-11-13 02:21:26,Amazon,-102.02,CARD_PAYMENT
2021-11-02 03:37:07,Amazon,-35.30,CARD_PAYMENT
2021-11-04 03:00:42,YouTube,-11.99,CARD_PAYMENT
2021-11-04 13:37:28,Microsoft,-12.99,CARD_PAYMENT
```

Run:

```
yarn cli-dev --file data/output.csv --token data/tokens_output.yml --output examples/sample_expenses.csv
```

Output:

```
category,subcategory,value,amountField,dateField
Shopping,Amazon,AMAZON,35.3,2021-11-02T03:37:07.000Z
Subscriptions,Entertainment,YouTube,11.99,2021-11-04T03:00:42.000Z
Subscriptions,Entertainment,Microsoft,12.99,2021-11-04T13:37:28.000Z
Shopping,Amazon,AMAZON,102.02,2021-11-13T02:21:26.000Z
```
