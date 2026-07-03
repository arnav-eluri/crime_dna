export interface CrimeSummary {
  total_firs: number;
  active_cases: number;
  hotspot_count: number;
  spatiotemporal_hotspot_count: number;
  critical_count: number;
  anomaly_count: number;
  syndicate_link_count: number;
  crime_type_distribution: Record<string, number>;
  severity_distribution: Record<string, number>;
  district_distribution: Record<string, number>;
  risk_class_distribution: Record<string, number>;
  monthly_trends: Record<string, number>;
  hotspot_locations: HotspotLocation[];
  alerts: Alert[];
  spatiotemporal_clusters: SpatiotemporalCluster[];
}

export interface HotspotLocation {
  lat: number;
  lng: number;
  frequency: number;
  crime_type: string;
  severity: string;
}

export interface Alert {
  district: string;
  crime_category: string;
  alert_level: 'NORMAL' | 'ELEVATED' | 'CRITICAL';
  current_count: number;
  historical_avg: number;
  percent_change: number;
  trend_direction: 'up' | 'down' | 'stable';
}

export interface SpatiotemporalCluster {
  lat: number;
  lng: number;
  time_bucket: string;
  frequency: number;
  crime_categories: Record<string, number>;
  severity_level: string;
}

export interface NetworkNode {
  id: string;
  group: string;
  size: number;
}

export interface NetworkEdge {
  source: string;
  target: string;
  weight: number;
}

export interface NetworkData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

export interface Forecast {
  crime_category: string;
  historical: Record<string, number>;
  predicted: number[];
  trend_direction: 'up' | 'down';
}

export interface SocioEconomic {
  district: string;
  crime_rate_per_100k: number;
  total_firs: number;
  top_crimes: Record<string, number>;
  severity_breakdown: Record<string, number>;
  socioeconomic_indicators: {
    population_density_per_km2: number;
    urbanization_percent: number;
    literacy_rate_percent: number;
    avg_annual_income_inr: number;
  };
}

export interface FIRRecord {
  id: number;
  fir_number: string;
  crime_type: string;
  severity: string;
  latitude: number;
  longitude: number;
  district: string;
}
