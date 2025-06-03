import { Router } from 'express';

import foodRoutes from './foodRoutes.ts';

const apiV1Routes = Router();

apiV1Routes.use('/foods', foodRoutes);

export default apiV1Routes;
