const express = require('express');
const router = express.Router();
const statscontroller = require('../controllers/statscontroller');
const allcontroller = require('../controllers/allcontroller');
const allwithposcontroller = require('../controllers/allwithposcontroller');
const callsigncontroller = require('../controllers/callsigncontroller');
const circlecontroller = require('../controllers/circlecontroller');
const closestcontroller = require('../controllers/closestcontroller');
const hexcontroller = require('../controllers/hexcontroller');
const regcontroller = require('../controllers/regcontroller');

router.get('/stats', statscontroller.getStats);
router.get('/v2/all', allcontroller.getAll);
router.get('/v2/all_with_pos', allwithposcontroller.getAllWithPos);
router.get('/v2/callsign/:callsign', callsigncontroller.getCallsign);
router.get('/v2/circle/:lat/:lon/:radius_mni', circlecontroller.getCircle);
router.get('/v2/closest/:lat/:lon/:radius_mni', closestcontroller.getClosest);
router.get('/v2/hex/:hex', hexcontroller.getHex);
router.get('/v2/reg/:reg', regcontroller.getReg);

module.exports = router;