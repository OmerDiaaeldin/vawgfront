import { LocationData } from "../types";
import Papa from "papaparse"
export async function fetchData(setLocations: any, setIsLoading: any, setError: any) {
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
              position: [parseFloat(item.Latitude), parseFloat(item.Longitude)] as [number, number],
              Crime: item.Crime,
              DateOfReport: new Date(item.DateOfReport),
              CrimeDateTime: new Date(item.CrimeDateTime.split("-")[0]),
              Location: item.Location
            }));

            console.log(validLocations)
          
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