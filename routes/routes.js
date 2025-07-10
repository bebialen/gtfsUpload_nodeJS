import express from 'express';
import multer from 'multer';
import { uploadGTFS } from '../controller/gtfsController.js';
import { getRoutes, getStopsByRoute, getTripsByRoute} from '../controller/routesController.js';
import { getStops } from '../controller/stopsController.js';
import { getTrips } from '../controller/tripsController.js';
import {getGtfsDataController} from '../controller/getGtfsDataController.js'


const upload = multer({ dest: 'uploads/' });
const router = express.Router();

router.post('/api/upload', upload.single('file'), uploadGTFS);
// router.post('/upload/stop_times', upload.single('file'), uploadStopTimes);
router.get('/api/routes', getRoutes);
router.get('/api/stops', getStops);
router.get('/api/trips', getTrips);
// router.get('/api/routes/:route_id/stops', getStopsByRoute);
router.get('/api/trips/:route_id/stops', getTripsByRoute);
router.get('/api/gtfs', getGtfsDataController);

export default router;
