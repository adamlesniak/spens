#!/bin/bash

# Extract relevant columns for processing
csvgrep -c 1 -r "CARD_PAYMENT" data/monito_statement.csv | csvcut -c "Started Date","Description","Amount","Type" >data/output.csv
csvgrep -c 10 -r "Debit" data/bank_statement.csv | csvcut -c " Posted Transactions Date","Description1"," Debit Amount","Transaction Type" | tail -n +2 >>data/output.csv
