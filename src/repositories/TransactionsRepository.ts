import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();

    const balance = transactions.reduce(
      (totalBalance: Balance, transaction: Transaction) => {
        switch (transaction.type) {
          case 'income':
            totalBalance.income += Number(transaction.value); // Forca ser numero, pois esta vindo com string do DB
            break;
          case 'outcome':
            totalBalance.outcome += Number(transaction.value);
            break;

          default:
            break;
        }
        return totalBalance;
      },
      {
        income: 0,
        outcome: 0,
        total: 0,
      },
    );

    balance.total = balance.income - balance.outcome;

    return balance;
  }
}

export default TransactionsRepository;
