const express = require('express');
const router = express.Router();
const userRoutes = require('./userRoutes');
const itemRoutes = require('./itemRoutes');

router.get('/', (req, res) => {
    res.send('Inventory API is running');
});

router.use('/users', userRoutes);
router.use('/items', itemRoutes);

module.exports = router;