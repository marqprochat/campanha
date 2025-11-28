import { Router } from 'express';
import { CSVImportController, upload, handleMulterError } from '../controllers/csvImportController';

const router = Router();

// Rota para importar contatos via CSV
// O handleMulterError captura erros do multer (arquivo corrompido, tipo inválido, etc)
router.post('/import', upload.single('csv'), handleMulterError, CSVImportController.importContacts);

// Rota para baixar template CSV
router.get('/template', CSVImportController.downloadTemplate);

export { router as csvImportRoutes };