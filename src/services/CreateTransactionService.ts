import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateCategoryService from './CreateCategoryService';

interface TransactionDTO {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}
class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: TransactionDTO): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    /**
     * [x] criar/buscar Categoria
     * [x] Salvar no DB
     * [x] Verificar se a categoria ja existe
     * [x] Verificar type
     * [x] Gestao de error
     * [x] Bloquear saldo negativo
     */

    if (!['income', 'outcome'].includes(type)) {
      throw new AppError('Type of transaction invalid.');
    }

    const { total } = await transactionsRepository.getBalance();

    if (type === 'outcome' && total < value) {
      throw new AppError('Insufficient funds.');
    }

    const createCategory = new CreateCategoryService();

    const categoryEntity = await createCategory.execute(category);

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category: categoryEntity,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
