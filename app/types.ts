export interface LocationData {
  id: string;
  Latitude: string;
  Longitude: string;
  DateOfReport: string;
  CrimeDateTime: string;
  Crime: string;
  Location:string;
}

export interface ProcessedLocation {
  id: string;
  position: [number, number]; // [lat, lng]
  DateOfReport: Date;
  CrimeDateTime: Date;
  Crime: string;
  Location:string;
}
