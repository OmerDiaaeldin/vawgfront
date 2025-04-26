import { ProcessedLocation } from "@/app/types";
import { MapContainer, Marker, Popup, TileLayer, Tooltip, useMapEvents } from "react-leaflet";

interface detailedMapProps {
    center: [number, number],
  locations: ProcessedLocation[],
  handleMapClick: (lat: number, lng: number) => void
}

const detailedMap = (
  {center, locations, handleMapClick}: detailedMapProps
) => {
    function MapClickHandler({
      onLocationClick,
    }: {
      onLocationClick: (lat: number, lng: number) => void;
    }) {
      useMapEvents({
        click: (e) => {
          onLocationClick(e.latlng.lat, e.latlng.lng);
        },
      });
    
      return null;
    }
  return (<div style={{ height: "600px", width: "100%" }}>
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

      {locations.map((location) => (
        <Marker key={location.id} position={location.position}>
          {/* Permanent Popup (click-triggered) */}
          <Popup>
            <div>
              <strong>ID: {location.id}</strong>
              <p>Crime: {location.Crime}</p>
              <p>Date: {new Date(location.CrimeDateTime).toLocaleString()}</p>
            </div>
          </Popup>

          {/* Hover Tooltip */}
          <Tooltip direction="top" offset={[0, -10]} permanent={false}>
            <div style={{ padding: "5px" }}>
              <strong>{location.Crime}</strong>
              <div>{new Date(location.CrimeDateTime).toDateString()}</div>
            </div>
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  </div>)}

export default detailedMap