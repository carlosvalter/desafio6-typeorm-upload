import fs from 'fs';
import csvParse from 'csv-parse';
import { getCustomRepository, getRepository, In } from 'typeorm';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface CVSTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}
/**
 * @tutorial: https://www.notion.so/Importando-arquivos-CSV-com-Node-js-2172338480cb47e28a5d3ed9981c38a0
 */
class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const readCSVStream = fs.createReadStream(filePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const transactions: CVSTransaction[] = [];
    const categories: string[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      // Valores obrigatorio
      if (!title || !type || !value) return;

      categories.push(category);
      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    // Busca as categorias que existe no DB que seja igual no CSV
    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });

    // mantem os nomes das categorias que existe no DB
    const existentCategoriesTitle = existentCategories.map(
      (category: Category) => category.title,
    );

    /** Filtra para deixar somente as categorias que não existe no DB
     * Depois filtra novamente para tirar os duplicados
     * https://www.youtube.com/watch?v=aEUDRBBbo-Y - 1:36:36
     */
    const addCategoryTitles = categories
      .filter(category => !existentCategoriesTitle.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    /**
     * Retorna um array de objeto para cada elemento do array
     * isso pq o ({}) parenteses atua como return
     * [ Category { title: 'alimentação' }, Category { title: 'lazer' }]
     * OBS.: Com isso salva varios registros no DB, com uma unica conexao... SHOW :D
     */
    const newCategories = categoriesRepository.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );

    await categoriesRepository.save(newCategories);

    // Junta categorias novas e as do DB
    const finalCategories = [...newCategories, ...existentCategories];

    const createdTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionsRepository.save(createdTransactions);

    // Excluir o arquivo
    await fs.promises.unlink(filePath);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
