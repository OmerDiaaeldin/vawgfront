import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import Papa from 'papaparse';
import 'leaflet/dist/leaflet.css';
import Head from 'next/head';

// Fix for Leaflet marker icons in Next.js
import L from 'leaflet';

// Define TypeScript interfaces
interface LocationData {
  id: string;
  address: string;
  Latitude: string;
  Longitude: string;
}

interface ProcessedLocation {
  id: string;
  address: string;
  position: [number, number]; // [lat, lng]
}

// This needs to run only on the client side
const setupLeafletIcons = (): void => {
//   delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: '/marker-icon.png',
    iconRetinaUrl: '/marker-icon-2x.png',
    shadowUrl: '/marker-shadow.png',
  });
};

// Component for handling map clicks
function MapClickHandler({ onLocationClick }: { onLocationClick: (lat: number, lng: number) => void }) {
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
  const [newAddress, setNewAddress] = useState<string>('');
  const [clickedLat, setClickedLat] = useState<number | null>(null);
  const [clickedLng, setClickedLng] = useState<number | null>(null);
//   const [showForm, setShowForm] = useState<boolean>(false);
  
  // Modal state
  const [formMessage, setFormMessage] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  
  // Original CSV data
//   const [originalCsvData, setOriginalCsvData] = useState<string>('');

  // Reference for map container
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Setup Leaflet icons
    setupLeafletIcons();
    
    async function fetchData() {
      try {
        const response = await fetch('/sample-data.csv');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        // setOriginalCsvData(text);
        
        Papa.parse<LocationData>(text, {
          header: true,
          complete: (results) => {
            const validLocations = results.data
              .filter(item => item.Latitude && item.Longitude && item.id !== undefined)
              .map(item => ({
                id: item.id,
                address: item.address,
                position: [parseFloat(item.Latitude), parseFloat(item.Longitude)] as [number, number]
              }));
            
            setLocations(validLocations);
            setIsLoading(false);
          },
          error: (error: Error) => {
            setError(`Error parsing CSV: ${error.message}`);
            setIsLoading(false);
          }
        });
      } catch (err) {
        setError(`Error fetching data: ${err instanceof Error ? err.message : String(err)}`);
        setIsLoading(false);
      }
    }

    fetchData();
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
        const formElement = document.getElementById('add-location-form');
        if (formElement) {
          const y = formElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 100);
    }
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAddress || !clickedLat || !clickedLng) {
      setFormMessage('Please provide an address and select a location on the map.');
      return;
    }
    
    // Create new location ID (increment from highest existing ID)
    const newId = locations.length > 0 
      ? String(Math.max(...locations.map(loc => parseInt(loc.id))) + 1)
      : '0';
    
    // Add new location to state
    const newLocation: ProcessedLocation = {
      id: newId,
      address: newAddress,
      position: [clickedLat, clickedLng]
    };
    
    setLocations([...locations, newLocation]);
    
    // Reset form
    setNewAddress('');
    setClickedLat(null);
    setClickedLng(null);
    // setShowForm(false);
    
    // Show success message
    setFormMessage('Location added successfully!');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };
  
  // Generate and download updated CSV
  const downloadCSV = () => {
    // Convert locations back to CSV format
    const csvData = locations.map(loc => ({
      id: loc.id,
      address: loc.address,
      Latitude: loc.position[0].toString(),
      Longitude: loc.position[1].toString()
    }));
    
    const csv = Papa.unparse(csvData);
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'updated-locations.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) return <div className="loading">Loading map data...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  // Find center point based on average of coordinates
  const center = locations.length > 0
    ? [
        locations.reduce((sum, loc) => sum + loc.position[0], 0) / locations.length,
        locations.reduce((sum, loc) => sum + loc.position[1], 0) / locations.length
      ] as [number, number]
    : [42.3601, -71.0589] as [number, number]; // Default to Boston/Cambridge area

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
                  <p>{location.address}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      
      {/* Add Location Form */}
      <div id="add-location-form" className="form-container">
        <h2>Add New Location</h2>
        
        {showSuccess && (
          <div className="success-message">
            {formMessage}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="address">Address:</label>
            <input 
              type="text" 
              id="address" 
              value={newAddress} 
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="Enter location address"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Coordinates:</label>
            <div className="coordinates-display">
              {clickedLat && clickedLng ? (
                <>
                  <span>Latitude: {clickedLat.toFixed(6)}</span>
                  <span>Longitude: {clickedLng.toFixed(6)}</span>
                </>
              ) : (
                <span className="help-text">Click on the map to set coordinates</span>
              )}
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-button"
              disabled={!newAddress || !clickedLat || !clickedLng}
            >
              Add Location
            </button>
            
            <button 
              type="button" 
              className="download-button"
              onClick={downloadCSV}
            >
              Download Updated CSV
            </button>
          </div>
        </form>
      </div>
      
      {/* Locations List */}
      <div className="location-list">
        <h2>All Locations ({locations.length})</h2>
        <ul>
          {locations.map(location => (
            <li key={location.id}>
              <strong>{location.id}</strong>: {location.address} ({location.position[0].toFixed(6)}, {location.position[1].toFixed(6)})
            </li>
          ))}
        </ul>
      </div>

      <style jsx>{`
        .map-container {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .loading, .error {
          padding: 20px;
          text-align: center;
          font-size: 18px;
        }
        .error {
          color: red;
        }
        .instructions {
          margin-bottom: 20px;
          color: #666;
        }
        .form-container {
          margin-top: 30px;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background-color: #f9f9f9;
        }
        .form-group {
          margin-bottom: 15px;
        }
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        .coordinates-display {
          padding: 8px;
          background-color: #eee;
          border-radius: 4px;
          display: flex;
          gap: 20px;
        }
        .help-text {
          color: #666;
          font-style: italic;
        }
        .form-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }
        button {
          padding: 10px 15px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }
        button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        .submit-button {
          background-color: #4CAF50;
          color: white;
        }
        .download-button {
          background-color: #2196F3;
          color: white;
        }
        .success-message {
          padding: 10px;
          margin-bottom: 15px;
          background-color: #dff0d8;
          color: #3c763d;
          border: 1px solid #d6e9c6;
          border-radius: 4px;
        }
        .location-list {
          margin-top: 30px;
        }
        ul {
          max-height: 300px;
          overflow-y: auto;
          border: 1px solid #ddd;
          padding: 10px 20px;
        }
        li {
          margin: 8px 0;
        }
      `}</style>
    </div>
  );
}