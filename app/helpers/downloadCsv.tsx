import { ProcessedLocation } from "../types";
import Papa from "papaparse"

export default (locations: ProcessedLocation[]) => {
    // Convert locations back to CSV format
    const csvData = locations.map(loc => ({
      id: loc.id,
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