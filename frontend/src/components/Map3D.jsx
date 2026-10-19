import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { riskOf } from "@/lib/constants";

// OpenFreeMap provides a high-resolution, token-free vector basemap (Liberty style)
// with roads, buildings, place names and topographic boundaries.
// AWS Terrarium DEM provides real-time 3D elevation and hillshading.
const BASE_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
const TERRAIN_SOURCE = {
  type: "raster-dem",
  tiles: ["https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png"],
  encoding: "terrarium",
  tileSize: 256,
  maxzoom: 15,
};

const INSAR_POINTS = [
  { id: "sar-1", lat: 23.7431, lng: 92.7079, v: -28.4, status: "Accelerated Subsidence (-28.4 mm/yr)" },
  { id: "sar-2", lat: 23.7425, lng: 92.7090, v: -24.1, status: "Active Shear Creep (-24.1 mm/yr)" },
  { id: "sar-3", lat: 23.7545, lng: 92.7308, v: -16.8, status: "Creeping Deformation (-16.8 mm/yr)" },
  { id: "sar-4", lat: 23.7538, lng: 92.7319, v: -13.2, status: "Creeping Deformation (-13.2 mm/yr)" },
  { id: "sar-5", lat: 23.7392, lng: 92.7192, v: -7.5, status: "Minor Settlement (-7.5 mm/yr)" },
  { id: "sar-6", lat: 23.7654, lng: 92.6845, v: -18.2, status: "Active Shear Creep (-18.2 mm/yr)" },
  { id: "sar-7", lat: 23.7605, lng: 92.7248, v: -2.1, status: "Stable (-2.1 mm/yr)" },
];

export default function Map3D({ zones, footfall, onSelectZone, showHeatmap, showInSAR, focusZone }) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const gpsMarkers = useRef([]);
  const ready = useRef(false);

  useEffect(() => {
    if (mapRef.current) return;
    const map = new maplibregl.Map({
      container: ref.current,
      style: BASE_STYLE_URL,
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
      // Add AWS Terrarium 3D elevation source after OpenFreeMap vector style loads
      if (!map.getSource("bhu-terrain")) {
        map.addSource("bhu-terrain", TERRAIN_SOURCE);
      }
      if (!map.getLayer("bhu-hillshade")) {
        const firstOverlayLayer = map
          .getStyle()
          .layers
          ?.find((layer) => layer.type === "line" || layer.type === "symbol");

        const hillshadeLayer = {
          id: "bhu-hillshade",
          type: "hillshade",
          source: "bhu-terrain",
          paint: {
            "hillshade-exaggeration": 0.55,
            "hillshade-shadow-color": "#334155",
          },
        };

        if (firstOverlayLayer) {
          map.addLayer(hillshadeLayer, firstOverlayLayer.id);
        } else {
          map.addLayer(hillshadeLayer);
        }
      }
      map.setTerrain({ source: "bhu-terrain", exaggeration: 1.6 });

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
      renderInSAR();
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

  const renderInSAR = () => {
    const map = mapRef.current;
    if (!map || !ready.current) return;

    const insarFc = {
      type: "FeatureCollection",
      features: INSAR_POINTS.map((p) => ({
        type: "Feature",
        properties: { id: p.id, status: p.status, v: p.v },
        geometry: { type: "Point", coordinates: [p.lng, p.lat] },
      })),
    };

    if (!map.getSource("insar")) {
      map.addSource("insar", { type: "geojson", data: insarFc });
      map.addLayer({
        id: "insar-points",
        type: "circle",
        source: "insar",
        layout: { visibility: showInSAR ? "visible" : "none" },
        paint: {
          "circle-radius": 7,
          "circle-color": [
            "interpolate",
            ["linear"],
            ["get", "v"],
            -30, "#7c3aed",
            -18, "#dc2626",
            -10, "#f59e0b",
            0, "#10b981",
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": 0.9,
        },
      });

      map.on("click", "insar-points", (e) => {
        const props = e.features[0].properties;
        new maplibregl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`<div class="p-1.5 font-mono text-xs"><b>Sentinel-1 InSAR Satellite Creep</b><br/><span class="text-rose-600 font-semibold">${props.status}</span></div>`)
          .addTo(map);
      });
      map.on("mouseenter", "insar-points", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "insar-points", () => (map.getCanvas().style.cursor = ""));
    }
  };

  useEffect(() => { renderZones(); }, [zones]); // eslint-disable-line

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready.current) return;
    if (map.getLayer("insar-points")) {
      map.setLayoutProperty("insar-points", "visibility", showInSAR ? "visible" : "none");
    }
  }, [showInSAR]);

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

  return <div ref={ref} data-testid="map-3d-canvas" className="w-full h-full rounded-xl overflow-hidden shadow-inner" />;
}
