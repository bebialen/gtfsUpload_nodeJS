import express from 'express';
import multer from 'multer';
import { uploadGTFS } from '../controller/gtfsController.js';
import { getRoutes, getStopsByRoute, getTripsByRoute } from '../controller/routesController.js';
import { getStops } from '../controller/stopsController.js';
import { getTrips } from '../controller/tripsController.js';


const upload = multer({ dest: 'uploads/' });
const router = express.Router();

router.post('/upload', upload.single('file'), uploadGTFS);
router.get('/routes', getRoutes);
router.get('/stops', getStops);
router.get('/trips', getTrips);
// router.get('/api/routes/:route_id/stops', getStopsByRoute);
router.get('/api/trips/:route_id/stops', getTripsByRoute);

export default router;
