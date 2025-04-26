import {
  useState,
  useEffect,
  useRef,
  ChangeEvent,
} from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Head from "next/head";

// Fix for Leaflet marker icons in Next.js
import L from "leaflet";
import { ProcessedLocation } from "@/app/types";
import { fetchData } from "@/app/helpers/fetchData";
import downloadCsv from "@/app/helpers/downloadCsv";
import Styler from "../app/helpers/Styler";

// Define TypeScript interfaces

// This needs to run only on the client side
const setupLeafletIcons = (): void => {
  //   delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: "/marker-icon.png",
    iconRetinaUrl: "/marker-icon-2x.png",
    shadowUrl: "/marker-shadow.png",
  });
};

// Component for handling map clicks
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

export default function LocationMap() {
  const [locations, setLocations] = useState<ProcessedLocation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [newCrimeDate, setNewCrimeDate] = useState<string>(
    new Date().toDateString()
  );
  const [newReportDate, setNewReportDate] = useState<string>(
    new Date().toDateString()
  );
  const [newCrime, setNewCrime] = useState<string>("");
  const [clickedLat, setClickedLat] = useState<number | null>(null);
  const [clickedLng, setClickedLng] = useState<number | null>(null);

  // Modal state
  const [formMessage, setFormMessage] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  // Reference for map container
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Setup Leaflet icons
    setupLeafletIcons();

    fetchData(setLocations, setIsLoading, setError);
  }, []);

  // Handle map click to get coordinates
  const handleMapClick = (lat: number, lng: number) => {
    setClickedLat(lat);
    setClickedLng(lng);
    // setShowForm(true);

    // Scroll to form
    if (mapContainerRef.current) {
      setTimeout(() => {
        const yOffset = -20;
        const formElement = document.getElementById("add-location-form");
        if (formElement) {
          const y =
            formElement.getBoundingClientRect().top +
            window.pageYOffset +
            yOffset;
          window.scrollTo({ top: y, behavior: "smooth" });
        }
      }, 100);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!clickedLat || !clickedLng) {
      setFormMessage(
        "Please provide an address and select a location on the map."
      );
      return;
    }

    // Create new location ID (increment from highest existing ID)
    const newId =
      locations.length > 0
        ? String(Math.max(...locations.map((loc) => parseInt(loc.id))) + 1)
        : "0";

    // Add new location to state
    const newLocation: ProcessedLocation = {
      id: newId,
      DateOfReport: new Date(newReportDate),
      CrimeDateTime: new Date(newCrimeDate),
      Crime: newCrime,
      position: [clickedLat, clickedLng],
      Location: `${clickedLat}, ${clickedLng}`,
    };

    setLocations([...locations, newLocation]);

    // Reset form
    setClickedLat(null);
    setClickedLng(null);
    // setShowForm(false);

    // Show success message
    setFormMessage("Location added successfully!");
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  // Generate and download updated CSV

  if (isLoading) return <div className="loading">Loading map data...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  // Find center point based on average of coordinates
  const center =
    locations.length > 0
      ? ([
          locations.reduce((sum, loc) => sum + loc.position[0], 0) /
            locations.length,
          locations.reduce((sum, loc) => sum + loc.position[1], 0) /
            locations.length,
        ] as [number, number])
      : ([42.3601, -71.0589] as [number, number]); // Default to Boston/Cambridge area

  return (
    <div className="map-container" ref={mapContainerRef}>
      <Head>
        <title>Location Map</title>
      </Head>

      <h1>Location Map</h1>
      <p className="instructions">
        Click anywhere on the map to add a new location, or use the form below.
      </p>

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

          {locations.map((location) => (
            <Marker key={location.id} position={location.position}>
              <Popup>
                <div>
                  <strong>ID: {location.id}</strong>
                  {/* <p>{location.address}</p> */}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Add Location Form */}
      <div id="add-location-form" className="form-container">
        <h2>Add New Location</h2>

        {showSuccess && <div className="success-message">{formMessage}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Coordinates:</label>
            <div className="coordinates-display">
              {clickedLat && clickedLng ? (
                <>
                  <span>Latitude: {clickedLat.toFixed(6)}</span>
                  <span>Longitude: {clickedLng.toFixed(6)}</span>
                </>
              ) : (
                <span className="help-text">
                  Click on the map to set coordinates
                </span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Date and time of incident</label>
            <input
              type="datetime-local"
              value={newCrimeDate}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                setNewCrimeDate(event.target.value || "");
              }}
            />
          </div>

          <div className="form-group">
            <label>Date and time of report</label>
            <input
              type="datetime-local"
              value={newReportDate}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                setNewReportDate(event.target.value || "");
              }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="crime">Crime</label>
            <select
              name="crime"
              id="crime"
              value={newCrime}
              onChange={(event: ChangeEvent) => {
                setNewCrime(event.target.nodeValue || "");
              }}
            >
              {Array.from(
                new Set(locations.map((location) => location.Crime))
              ).map((crime, index) => {
                return (
                  <option key={index} value={crime}>
                    {crime}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="submit-button"
              disabled={!clickedLat || !clickedLng}
            >
              Add Location
            </button>

            <button
              type="button"
              className="download-button"
              onClick={() => downloadCsv(locations)}
            >
              Download Updated CSV
            </button>
          </div>
        </form>
      </div>

      {/* Locations List */}
      <div className="location-list">
        <h2 className="location-list__title">
          All Locations ({locations.length})
        </h2>
        <div className="location-list__table-container">
          <table className="location-list__table">
            <thead>
              <tr className="location-list__header-row">
                <th className="location-list__header">Id</th>
                <th className="location-list__header">Position</th>
                <th className="location-list__header">Date of Report</th>
                <th className="location-list__header">Crime Date/Time</th>
                <th className="location-list__header">Crime</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((location) => (
                <tr key={location.id} className="location-list__data-row">
                  <td className="location-list__data location-list__data--id">
                    <strong>{location.id}</strong>
                  </td>
                  <td className="location-list__data location-list__data--position">
                    ({location.position[0].toFixed(6)},{" "}
                    {location.position[1].toFixed(6)})
                  </td>
                  <td className="location-list__data location-list__data--report-date">
                    {location.DateOfReport.toDateString()}
                  </td>
                  <td className="location-list__data location-list__data--crime-date">
                    {location.CrimeDateTime.toLocaleString()}
                  </td>
                  <td className="location-list__data location-list__data--crime">
                    {location.Crime}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{Styler}</style>
    </div>
  );
}
