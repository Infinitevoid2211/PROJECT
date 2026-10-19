/**
 * GeoJSON road network and evacuation graph for Aizawl District.
 * Models NH-54 sinking section, Sairang bypass, and arterial connections to relief shelters.
 */

export const AIZAWL_SHELTERS = [
  {
    id: "shelter-1",
    name: "Aizawl West Indoor Stadium",
    lat: 23.7380,
    lng: 92.7020,
    capacity: 650,
    supplies: "Full medical kit, backup generator, drinking water",
  },
  {
    id: "shelter-2",
    name: "Ramhlun Sports Complex Shelter",
    lat: 23.7580,
    lng: 92.7350,
    capacity: 400,
    supplies: "SDRF staging base, dry rations, emergency bedding",
  },
  {
    id: "shelter-3",
    name: "Sairang Community Relief Hall",
    lat: 23.7710,
    lng: 92.6820,
    capacity: 350,
    supplies: "Railway feeder base, first aid station",
  },
  {
    id: "shelter-4",
    name: "Government Mizo High School Ground",
    lat: 23.7340,
    lng: 92.7230,
    capacity: 500,
    supplies: "District shelter depot, open helipad ground",
  },
];

export const AIZAWL_ROAD_NETWORK = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        id: "road-nh54-sinking",
        name: "National Highway 54 (Hunthar Sinking Section)",
        type: "National Highway",
        traverses_zone: "zone-1",
        hazard_risk: "CRITICAL",
        blocked_when_critical: true,
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [92.7010, 23.7360],
          [92.7045, 23.7395],
          [92.7083, 23.7428], // Hunthar Veng epicenter
          [92.7120, 23.7460],
          [92.7160, 23.7500],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "road-sairang-bypass",
        name: "Sairang - Vaivakawn Safe Bypass Corridor",
        type: "State Highway",
        traverses_zone: "zone-4",
        hazard_risk: "MODERATE",
        blocked_when_critical: false,
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [92.6820, 23.7710],
          [92.6850, 23.7650],
          [92.6930, 23.7520],
          [92.7020, 23.7380], // Directly to Aizawl West Stadium
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "road-ramhlun-chite",
        name: "Ramhlun North - Chite Lui Arterial",
        type: "District Road",
        traverses_zone: "zone-2",
        hazard_risk: "HIGH",
        blocked_when_critical: false,
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [92.7245, 23.7601],
          [92.7312, 23.7541],
          [92.7350, 23.7580], // To Ramhlun Sports Complex
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "road-laipuitlang-ridge",
        name: "Laipuitlang - Mizo High School Link Road",
        type: "Urban Link",
        traverses_zone: "zone-3",
        hazard_risk: "MODERATE",
        blocked_when_critical: false,
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [92.7198, 23.7389],
          [92.7215, 23.7365],
          [92.7230, 23.7340], // To Government Mizo High School
        ],
      },
    },
  ],
};

/**
 * Calculates dynamic evacuation route bypassing zones in active critical failure.
 */
export function getEvacuationRoute(originZone, zonesList = []) {
  const isHuntharCritical = zonesList.some(
    (z) => z.id === "zone-1" && z.risk_level === "CRITICAL"
  );

  if (originZone?.id === "zone-1" || (originZone?.id === "zone-1" && isHuntharCritical)) {
    // Hunthar Veng must NOT take NH-54; it diverts via upper ridge bypass to West Stadium
    return {
      route_name: "Emergency Bypass: Hunthar Ridge -> Aizawl West Indoor Stadium",
      is_rerouted: true,
      blocked_segment: "National Highway 54 (Sinking Corridor CLOSED)",
      distance_km: 1.8,
      est_minutes: 6,
      safe_shelter: AIZAWL_SHELTERS[0],
      path_coordinates: [
        [92.7083, 23.7428], // Origin
        [92.7055, 23.7410],
        [92.7035, 23.7390],
        [92.7020, 23.7380], // Shelter
      ],
    };
  } else if (originZone?.id === "zone-2") {
    return {
      route_name: "Chite Lui Link -> Ramhlun Sports Complex",
      is_rerouted: false,
      distance_km: 0.9,
      est_minutes: 3,
      safe_shelter: AIZAWL_SHELTERS[1],
      path_coordinates: [
        [92.7312, 23.7541],
        [92.7335, 23.7560],
        [92.7350, 23.7580],
      ],
    };
  } else if (originZone?.id === "zone-4") {
    return {
      route_name: "Sairang Bypass -> Sairang Community Hall",
      is_rerouted: false,
      distance_km: 1.4,
      est_minutes: 5,
      safe_shelter: AIZAWL_SHELTERS[2],
      path_coordinates: [
        [92.6850, 23.7650],
        [92.6835, 23.7680],
        [92.6820, 23.7710],
      ],
    };
  } else {
    return {
      route_name: "Central Ridge Link -> Government Mizo High School Ground",
      is_rerouted: false,
      distance_km: 1.1,
      est_minutes: 4,
      safe_shelter: AIZAWL_SHELTERS[3],
      path_coordinates: [
        [originZone?.lng || 92.7198, originZone?.lat || 23.7389],
        [92.7215, 23.7365],
        [92.7230, 23.7340],
      ],
    };
  }
}

