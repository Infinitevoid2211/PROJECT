import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { riskOf } from "@/lib/constants";

// Token-free style: OpenTopoMap raster base + AWS Terrarium DEM for real 3D terrain.
const STYLE = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    topo: {
      type: "raster",
      tiles: [
        "https://a.tile.opentopomap.org/{z}/{x}/{y}.png",
        "https://b.tile.opentopomap.org/{z}/{x}/{y}.png",
        "https://c.tile.opentopomap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      maxzoom: 17,
      attribution: "© OpenTopoMap (CC-BY-SA) · © OpenStreetMap contributors",
    },
    terrain: {
      type: "raster-dem",
      tiles: ["https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png"],
      encoding: "terrarium",
      tileSize: 256,
      maxzoom: 15,
    },
  },
  layers: [
    { id: "bg", type: "background", paint: { "background-color": "#eef2f4" } },
    { id: "topo", type: "raster", source: "topo", paint: { "raster-opacity": 0.95 } },
    {
      id: "hills",
      type: "hillshade",
      source: "terrain",
      paint: { "hillshade-exaggeration": 0.55, "hillshade-shadow-color": "#334155" },
    },
  ],
  terrain: { source: "terrain", exaggeration: 1.6 },
};

export default function Map3D({ zones, footfall, onSelectZone, showHeatmap, focusZone }) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const gpsMarkers = useRef([]);
  const ready = useRef(false);

  useEffect(() => {
    if (mapRef.current) return;
    const map = new maplibregl.Map({
      container: ref.current,
      style: STYLE,
      center: [92.7176, 23.7271],
      zoom: 12.4,
      pitch: 62,
      bearing: -18,
      maxPitch: 80,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }));

    map.on("load", () => {
      map.setSky({
        "sky-color": "#a9c9e8",
        "sky-horizon-blend": 0.6,
        "horizon-color": "#e8eef2",
        "horizon-fog-blend": 0.6,
        "fog-color": "#eef2f4",
        "fog-ground-blend": 0.4,
      });
      ready.current = true;
      renderZones();
    });
    // eslint-disable-next-line
  }, []);

  const renderZones = () => {
    const map = mapRef.current;
    if (!map || !ready.current || !zones?.length) return;

    const fc = {
      type: "FeatureCollection",
      features: zones.map((z) => ({
        type: "Feature",
        properties: { id: z.id, name: z.name, risk: z.risk_level, color: riskOf(z.risk_level).color, prob: z.probability },
        geometry: { type: "Point", coordinates: [z.lng, z.lat] },
      })),
    };

    if (map.getSource("zones")) {
      map.getSource("zones").setData(fc);
    } else {
      map.addSource("zones", { type: "geojson", data: fc });
      map.addLayer({
        id: "zone-halo", type: "circle", source: "zones",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["get", "prob"], 20, 24, 90, 60],
          "circle-color": ["get", "color"], "circle-opacity": 0.22, "circle-blur": 0.6,
        },
      });
      map.addLayer({
        id: "zone-core", type: "circle", source: "zones",
        paint: {
          "circle-radius": 8, "circle-color": ["get", "color"],
          "circle-stroke-width": 2.5, "circle-stroke-color": "#ffffff",
        },
      });
      map.addLayer({
        id: "zone-label", type: "symbol", source: "zones",
        layout: {
          "text-field": ["get", "name"], "text-size": 11, "text-offset": [0, 1.6],
          "text-anchor": "top", "text-font": ["Open Sans Regular"],
        },
        paint: { "text-color": "#0f172a", "text-halo-color": "#ffffff", "text-halo-width": 1.6 },
      });

      map.on("click", "zone-core", (e) => onSelectZone && onSelectZone(e.features[0].properties.id));
      map.on("mouseenter", "zone-core", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "zone-core", () => (map.getCanvas().style.cursor = ""));
    }
  };

  useEffect(() => { renderZones(); }, [zones]); // eslint-disable-line

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready.current) return;
    if (map.getLayer("zone-halo")) {
      map.setPaintProperty("zone-halo", "circle-opacity", showHeatmap ? 0.42 : 0.22);
      map.setPaintProperty("zone-halo", "circle-radius",
        showHeatmap
          ? ["interpolate", ["linear"], ["get", "prob"], 20, 40, 90, 110]
          : ["interpolate", ["linear"], ["get", "prob"], 20, 24, 90, 60]);
    }
  }, [showHeatmap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready.current || !footfall?.zones) return;
    gpsMarkers.current.forEach((m) => m.remove());
    gpsMarkers.current = [];
    footfall.zones.forEach((z) => {
      const n = Math.min(14, Math.max(3, Math.round(z.people_in_zone / 12)));
      const color = riskOf(z.risk_level).color;
      for (let i = 0; i < n; i++) {
        const el = document.createElement("div");
        el.className = "gps-dot";
        el.style.background = color;
        const jLat = z.lat + (Math.random() - 0.5) * 0.012;
        const jLng = z.lng + (Math.random() - 0.5) * 0.012;
        gpsMarkers.current.push(new maplibregl.Marker({ element: el }).setLngLat([jLng, jLat]).addTo(map));
      }
    });
  }, [footfall]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready.current || !focusZone) return;
    map.flyTo({ center: [focusZone.lng, focusZone.lat], zoom: 14.5, pitch: 68, bearing: -18, duration: 1600 });
  }, [focusZone]);

  return <div ref={ref} data-testid="map-3d-canvas" className="w-full h-full rounded-xl overflow-hidden" />;
}

