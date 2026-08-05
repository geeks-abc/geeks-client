export interface NearbyMapFacility {
  name: string;
  lat: number;
  lng: number;
}

export interface NearbyMapItem {
  id: number;
  lat: number;
  lng: number;
  storeName: string;
  itemName: string;
  quantity: number;
  distanceKm: number;
  remainingText: string;
}

export interface NearbyMapProps {
  facility: NearbyMapFacility;
  items: NearbyMapItem[];
  onSelect: (listingId: number) => void;
}
