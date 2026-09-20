import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { riskOf } from "@/lib/constants";
import "maplibre-gl/dist/maplibre-gl.css";

const BASE_STYLE_URL =
  "https://tiles.openfreemap.org/styles/liberty";

const TERRAIN_SOURCE = {
  type: "raster-dem",
  tiles: [
    "https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png",
  ],
  encoding: "terrarium",
  tileSize: 256,
  maxzoom: 15,
};

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export default function Map3D({
  zones,
  footfall,
  onSelectZone,
  showHeatmap,
  focusZone,
}) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const gpsMarkers = useRef([]);
  const ready = useRef(false);
  const onSelectZoneRef = useRef(onSelectZone);

  useEffect(() => {
    onSelectZoneRef.current = onSelectZone;
  }, [onSelectZone]);

  const renderZones = () => {
    const map = mapRef.current;

    if (!map || !ready.current || !zones?.length) {
      return;
    }

    const validZones = zones
      .map((zone) => ({
        ...zone,
        lat: toNumber(zone.lat, null),
        lng: toNumber(zone.lng, null),
        probability: toNumber(zone.probability, 0),
      }))
      .filter(
        (zone) =>
          zone.lat !== null &&
          zone.lng !== null
      );

    const featureCollection = {
      type: "FeatureCollection",
      features: validZones.map((zone) => ({
        type: "Feature",
        properties: {
          id: zone.id,
          name: zone.name || "Unknown zone",
          risk: zone.risk_level || "LOW",
          color: riskOf(zone.risk_level || "LOW").color,
          prob: zone.probability,
        },
        geometry: {
          type: "Point",
          coordinates: [zone.lng, zone.lat],
        },
      })),
    };

    if (map.getSource("zones")) {
      map.getSource("zones").setData(featureCollection);
      return;
    }

    map.addSource("zones", {
      type: "geojson",
      data: featureCollection,
    });

    map.addLayer({
      id: "zone-halo",
      type: "circle",
      source: "zones",
      paint: {
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["get", "prob"],
          20,
          24,
          90,
          60,
        ],
        "circle-color": ["get", "color"],
        "circle-opacity": 0.22,
        "circle-blur": 0.6,
      },
    });

    map.addLayer({
      id: "zone-core",
      type: "circle",
      source: "zones",
      paint: {
        "circle-radius": 8,
        "circle-color": ["get", "color"],
        "circle-stroke-width": 2.5,
        "circle-stroke-color": "#ffffff",
      },
    });

    map.addLayer({
      id: "zone-label",
      type: "symbol",
      source: "zones",
      layout: {
        "text-field": ["get", "name"],
        "text-size": 11,
        "text-offset": [0, 1.6],
        "text-anchor": "top",
      },
      paint: {
        "text-color": "#0f172a",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.6,
      },
    });

    map.on("click", "zone-core", (event) => {
      const feature = event.features?.[0];

      if (!feature) {
        return;
      }

      const zoneId = feature.properties?.id;

      if (zoneId && onSelectZoneRef.current) {
        onSelectZoneRef.current(zoneId);
      }
    });

    map.on("mouseenter", "zone-core", () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", "zone-core", () => {
      map.getCanvas().style.cursor = "";
    });
  };

  useEffect(() => {
    if (mapRef.current || !ref.current) {
      return;
    }

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

    map.addControl(
      new maplibregl.NavigationControl({
        visualizePitch: true,
      }),
      "top-right"
    );

    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
      })
    );

    map.on("load", () => {
      if (!map.getSource("bhu-terrain")) {
        map.addSource("bhu-terrain", TERRAIN_SOURCE);
      }

      if (!map.getLayer("bhu-hillshade")) {
        const firstOverlayLayer = map
          .getStyle()
          .layers?.find(
            (layer) =>
              layer.type === "line" ||
              layer.type === "symbol"
          );

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
          map.addLayer(
            hillshadeLayer,
            firstOverlayLayer.id
          );
        } else {
          map.addLayer(hillshadeLayer);
        }
      }

      map.setTerrain({
        source: "bhu-terrain",
        exaggeration: 1.6,
      });

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

    return () => {
      ready.current = false;

      gpsMarkers.current.forEach((marker) => {
        marker.remove();
      });

      gpsMarkers.current = [];

      map.remove();
      mapRef.current = null;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    renderZones();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zones]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !ready.current) {
      return;
    }

    if (!map.getLayer("zone-halo")) {
      return;
    }

    map.setPaintProperty(
      "zone-halo",
      "circle-opacity",
      showHeatmap ? 0.42 : 0.22
    );

    map.setPaintProperty(
      "zone-halo",
      "circle-radius",
      showHeatmap
        ? [
            "interpolate",
            ["linear"],
            ["get", "prob"],
            20,
            40,
            90,
            110,
          ]
        : [
            "interpolate",
            ["linear"],
            ["get", "prob"],
            20,
            24,
            90,
            60,
          ]
    );
  }, [showHeatmap]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !ready.current || !footfall?.zones) {
      return;
    }

    gpsMarkers.current.forEach((marker) => {
      marker.remove();
    });

    gpsMarkers.current = [];

    footfall.zones.forEach((zone) => {
      const lat = toNumber(zone.lat, null);
      const lng = toNumber(zone.lng, null);
      const people = toNumber(zone.people_in_zone, 0);

      if (lat === null || lng === null) {
        return;
      }

      const markerCount = Math.min(
        14,
        Math.max(
          3,
          Math.round(people / 12)
        )
      );

      const color = riskOf(
        zone.risk_level || "LOW"
      ).color;

      for (let i = 0; i < markerCount; i++) {
        const element = document.createElement("div");

        element.className = "gps-dot";
        element.style.background = color;

        const jitteredLat =
          lat + (Math.random() - 0.5) * 0.012;

        const jitteredLng =
          lng + (Math.random() - 0.5) * 0.012;

        const marker = new maplibregl.Marker({
          element,
        })
          .setLngLat([
            jitteredLng,
            jitteredLat,
          ])
          .addTo(map);

        gpsMarkers.current.push(marker);
      }
    });
  }, [footfall]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !ready.current || !focusZone) {
      return;
    }

    const lat = toNumber(focusZone.lat, null);
    const lng = toNumber(focusZone.lng, null);

    if (lat === null || lng === null) {
      return;
    }

    map.flyTo({
      center: [lng, lat],
      zoom: 14.5,
      pitch: 68,
      bearing: -18,
      duration: 1600,
    });
  }, [focusZone]);

  return (
    <div
      ref={ref}
      data-testid="map-3d-canvas"
      className="w-full h-full rounded-xl overflow-hidden"
    />
  );
}