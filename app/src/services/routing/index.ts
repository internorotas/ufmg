export type { IRoutingService } from './IRoutingService';
export { OsrmRoutingService } from './OsrmRoutingService';

import type { IRoutingService } from './IRoutingService';
import { OsrmRoutingService } from './OsrmRoutingService';

export const routingService: IRoutingService = new OsrmRoutingService();
