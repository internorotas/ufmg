export interface IRoutingService {
  getRoute(stops: [number, number][]): Promise<[number, number][]>;
}
