import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
}

export interface SmartCard {
  id: number;
  card_number: string;
  balance: number;
  is_active: boolean;
  passenger: User;
}

export interface Transaction {
  id: number;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
}

export interface BusStop {
  id: number;
  name: string;
  stop_order: number;
  latitude: number;
  longitude: number;
  estimated_waiting: number;
}

export interface BusRoute {
  id: number;
  route_number: string;
  name: string;
  source: string;
  destination: string;
  stops: BusStop[];
}

export interface Bus {
  id: number;
  bus_number: string;
  route_id: number;
  total_capacity: number;
  seated_capacity: number;
  current_passengers: number;
  boarded_count: number;
  alighted_count: number;
  current_stop_index: number;
  latitude: number;
  longitude: number;
  status: string;
  is_active: boolean;
  crowd_status: string;
  occupancy_percent: number;
  route?: BusRoute;
  driver?: User;
}

export interface DashboardStats {
  total_buses: number;
  active_buses: number;
  total_passengers: number;
  overcrowded_buses: number;
  approaching_capacity: number;
  total_routes: number;
}

export interface Alert {
  id: number;
  type: string;
  severity: string;
  message: string;
  bus_id: number | null;
  route_id: number | null;
  is_resolved: boolean;
  created_at: string;
}

export interface Festival {
  id: number;
  name: string;
  date: string;
  demand_multiplier: number;
  affected_routes: string;
  description: string;
}

export interface Recommendation {
  id: string;
  type: string;
  priority: string;
  route_number: string;
  route_name: string;
  message: string;
  detail: string;
  can_dispatch: boolean;
  depot_bus_id: number | null;
  hold_bus_id?: number | null;
  bus_number?: string;
}

export interface OvercrowdingPrediction {
  bus_id: number;
  bus_number: string;
  route_number: string;
  current_occupancy: number;
  predicted_full_at_stop: string;
  predicted_full_at_stop_index: number;
  stops_until_full: number;
  confidence: number;
  trend: number;
  severity: string;
  message: string;
}

export interface StopDemandForecast {
  stop_id: number;
  stop_name: string;
  route_id: number;
  route_number: string;
  current_waiting: number;
  forecast_5min: number;
  forecast_10min: number;
  demand_level: string;
}

export interface RouteHeatmap {
  route_id: number;
  route_number: string;
  route_name: string;
  avg_occupancy: number;
  total_passengers: number;
  total_capacity: number;
  active_buses: number;
  congestion_level: string;
  stop_demand: { stop_id: number; stop_name: string; demand: number; latitude: number; longitude: number }[];
}

export interface DemandTrend {
  route_id: number;
  route_number: string;
  route_name: string;
  data_points: { tick: number; demand: number; period: string }[];
}

export interface PredictionsData {
  overcrowding: OvercrowdingPrediction[];
  heatmap: RouteHeatmap[];
}

export interface FestivalRouteImpact {
  route_id: number;
  route_number: string;
  route_name: string;
  baseline_demand: number;
  projected_demand: number;
  multiplier: number;
  current_occupancy: number;
  projected_occupancy: number;
  active_buses: number;
  depot_buses_available: number;
  needs_extra_bus: boolean;
  risk_level: string;
}

export interface FestivalImpact {
  festival: {
    id: number;
    name: string;
    date: string;
    demand_multiplier: number;
    description: string;
    affected_routes: string[];
  };
  route_impacts: FestivalRouteImpact[];
  recommendations: Recommendation[];
  summary: {
    total_affected_routes: number;
    routes_needing_extra: number;
    max_projected_occupancy: number;
    avg_projected_occupancy: number;
  };
}

export interface FestivalComparison {
  route_id: number;
  route_number: string;
  route_name: string;
  normal_demand: number;
  festival_demand: number;
  increase_percent: number;
}

export interface NearbyStation {
  id: number;
  name: string;
  station_type: string;
  line: string;
  latitude: number;
  longitude: number;
  distance_km: number;
  walk_minutes: number;
}

export interface BusAlternatives {
  bus_number: string;
  occupancy: number;
  current_stop: string;
  suggestion: string;
  alternatives: NearbyStation[];
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: User }>('/auth/login', { email, password }),
  me: (token: string) =>
    api.get<User>('/auth/me', { params: { token } }),
};

export const busApi = {
  list: (activeOnly = false) =>
    api.get<Bus[]>('/buses/', { params: { active_only: activeOnly } }),
  get: (id: number) =>
    api.get<Bus>(`/buses/${id}`),
  byRoute: (routeId: number) =>
    api.get<Bus[]>(`/buses/route/${routeId}`),
  byDriver: (driverId: number) =>
    api.get<Bus>(`/buses/driver/${driverId}`),
  updateCapacity: (busId: number, totalCapacity: number, seatedCapacity?: number) =>
    api.patch<{ success: boolean; bus_number: string; total_capacity: number; occupancy_percent: number; crowd_status: string }>(
      `/buses/${busId}/capacity`, { total_capacity: totalCapacity, seated_capacity: seatedCapacity }
    ),
};

export interface ScanResultResponse {
  success: boolean;
  message: string;
  current_passengers: number;
  fare: number;
  new_balance?: number;
  bus_id?: number;
}

export const passengerApi = {
  getCard: (passengerId: number) =>
    api.get<SmartCard>(`/passengers/card/${passengerId}`),
  getTransactions: (cardId: number) =>
    api.get<Transaction[]>(`/passengers/transactions/${cardId}`),
  scan: (cardNumber: string, busId: number, action: string, stopId?: number) =>
    api.post<ScanResultResponse>(
      '/passengers/scan', { card_number: cardNumber, bus_id: busId, action, stop_id: stopId }),
  recharge: (cardNumber: string, amount: number) =>
    api.post<{ success: boolean; new_balance: number }>(
      '/passengers/recharge', { card_number: cardNumber, amount }),
};

export const dashboardApi = {
  stats: () =>
    api.get<DashboardStats>('/dashboard/stats'),
  alerts: (resolved = false) =>
    api.get<Alert[]>('/dashboard/alerts', { params: { resolved } }),
  resolveAlert: (id: number) =>
    api.post(`/dashboard/alerts/${id}/resolve`),
  festivals: () =>
    api.get<Festival[]>('/dashboard/festivals'),
  routes: () =>
    api.get<(BusRoute & { total_distance_km: number })[]>('/dashboard/routes'),
  recommendations: () =>
    api.get<Recommendation[]>('/dashboard/recommendations'),
  dispatch: (busId: number) =>
    api.post<{ success: boolean; message: string; bus_number?: string }>(`/dashboard/dispatch/${busId}`),
  holdBus: (busId: number) =>
    api.post<{ success: boolean; message: string; bus_number?: string }>(`/dashboard/hold/${busId}`),
};

export const predictionsApi = {
  overcrowding: () =>
    api.get<OvercrowdingPrediction[]>('/predictions/overcrowding'),
  demand: (routeId?: number) =>
    api.get<StopDemandForecast[]>('/predictions/demand', { params: routeId ? { route_id: routeId } : {} }),
  heatmap: () =>
    api.get<RouteHeatmap[]>('/predictions/heatmap'),
  trends: (routeId?: number) =>
    api.get<DemandTrend[]>('/predictions/trends', { params: routeId ? { route_id: routeId } : {} }),
  festivalImpact: (festivalId: number) =>
    api.get<FestivalImpact>(`/predictions/festival-impact/${festivalId}`),
  festivalComparison: () =>
    api.get<FestivalComparison[]>('/predictions/festival-comparison'),
  modelMetrics: () =>
    api.get<any>('/predictions/model-metrics'),
};

export const simulationApi = {
  state: () =>
    api.get<{ running: boolean; speed: number; tick_count: number; festival_mode: string | null }>('/simulation/state'),
  start: () =>
    api.post('/simulation/start'),
  stop: () =>
    api.post('/simulation/stop'),
  setSpeed: (speed: number) =>
    api.post('/simulation/speed', null, { params: { speed } }),
  reset: () =>
    api.post('/simulation/reset'),
  activateFestival: (festivalId: number) =>
    api.post(`/simulation/festival/${festivalId}`),
};

export const multimodalApi = {
  stations: () =>
    api.get<NearbyStation[]>('/multimodal/stations'),
  nearby: (lat: number, lng: number, radiusKm = 2.0) =>
    api.get<NearbyStation[]>('/multimodal/nearby', { params: { lat, lng, radius_km: radiusKm } }),
  forBus: (busId: number) =>
    api.get<BusAlternatives>('/multimodal/for-bus/' + busId),
};

export default api;
