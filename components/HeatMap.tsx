import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import { useEffect } from "react";
import { ProcessedLocation } from "@/app/types";

interface ClusterMapProps {
  center: [number, number];
  locations: ProcessedLocation[];
  handleMapClick: (lat: number, lng: number) => void;
  epsilon?: number;
  minPoints?: number;
}

// DBSCAN implementation
function dbscan(points: [number, number][], epsilon: number, minPoints: number) {
  const clusters: [number, number][][] = [];
  const visited = new Set();
  const noise = new Set();

  function regionQuery(point: [number, number]) {
    return points.filter(p => {
      const dx = p[0] - point[0];
      const dy = p[1] - point[1];
      return dx * dx + dy * dy <= epsilon * epsilon;
    });
  }

  function expandCluster(point: [number, number], neighbors: [number, number][], cluster: [number, number][]) {
    cluster.push(point);
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor.toString())) {
        visited.add(neighbor.toString());
        const neighborNeighbors = regionQuery(neighbor);
        if (neighborNeighbors.length >= minPoints) {
          neighbors = neighbors.concat(neighborNeighbors);
        }
      }
      if (!clusters.some(c => c.includes(neighbor))) {
        cluster.push(neighbor);
      }
    }
  }

  for (const point of points) {
    if (visited.has(point.toString())) continue;
    visited.add(point.toString());
    
    const neighbors = regionQuery(point);
    if (neighbors.length < minPoints) {
      noise.add(point.toString());
    } else {
      const cluster: [number, number][] = [];
      expandCluster(point, neighbors, cluster);
      clusters.push(cluster);
    }
  }

  return { clusters, noise };
}

function HeatmapLayer({ locations, epsilon = 0.01, minPoints = 3 }: { 
  locations: ProcessedLocation[], 
  epsilon?: number, 
  minPoints?: number 
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const points = locations.map(loc => loc.position);
    const { clusters } = dbscan(points, epsilon, minPoints);

    // Create heatmap layers
    const heatLayers: L.Layer[] = [];
    
    // Main heatmap for all points
    const allPointsHeat = (L as any).heatLayer(
      points.map(p => [...p, 0.5]), // [lat, lng, intensity]
      { radius: 25, blur: 15, maxZoom: 17 }
    ).addTo(map);

    heatLayers.push(allPointsHeat);

    // Cluster heatmaps (hotter spots)
    clusters.forEach(cluster => {
      const clusterHeat = (L as any).heatLayer(
        cluster.map(p => [...p, 1]), // Higher intensity for clusters
        { radius: 30, blur: 20, maxZoom: 17, gradient: { 0.4: 'blue', 0.6: 'lime', 0.8: 'red' } }
      ).addTo(map);
      heatLayers.push(clusterHeat);
    });

    return () => {
      heatLayers.forEach(layer => map.removeLayer(layer));
    };
  }, [map, locations, epsilon, minPoints]);

  return null;
}

function MapClickHandler({ onLocationClick }: { 
  onLocationClick: (lat: number, lng: number) => void 
}) {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    const handleClick = (e: L.LeafletMouseEvent) => {
      onLocationClick(e.latlng.lat, e.latlng.lng);
    };
    
    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onLocationClick]);

  return null;
}

export default function ClusterHeatMap({
  center,
  locations,
  handleMapClick,
  epsilon = 0.01,
  minPoints = 3
}: ClusterMapProps) {
  return (
    <div style={{ height: "600px", width: "100%" }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <MapClickHandler onLocationClick={handleMapClick} />
        <HeatmapLayer locations={locations} epsilon={epsilon} minPoints={minPoints} />
      </MapContainer>
    </div>
  );
}