const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicine.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.post('/', requireAuth, medicineController.createMedicine);
router.get('/', requireAuth, medicineController.getMedicines);
router.delete('/:id', requireAuth, medicineController.deactivateMedicine);
router.get('/today', requireAuth, medicineController.getTodayDoses);
router.patch('/logs/:id', requireAuth, medicineController.updateDoseStatus);
router.get('/history', requireAuth, medicineController.getAdherenceHistory);

module.exports = router;