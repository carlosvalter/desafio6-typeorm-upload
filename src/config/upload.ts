import multer from 'multer';
import path from 'path'; // Metodo do Node trabalhar com caminhos no disco
import crypto from 'crypto'; // Criptografia e hash no Node

const tmpFolder = path.resolve(__dirname, '..', '..', 'tmp');

export default {
  directory: tmpFolder,

  storage: multer.diskStorage({
    destination: tmpFolder,
    filename(request, file, callback) {
      const fileHash = crypto.randomBytes(10).toString('hex'); // Gera um hash 10 bytes e converte para hex
      const fileName = `${fileHash}-${file.originalname}`; // Salva o nome do arquivo de forma não duplicar

      return callback(null, fileName);
    },
  }),
};
