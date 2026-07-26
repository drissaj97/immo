export type MapPoiPoint = {
  name: string;
  category: string;
  distanceM: number;
  latitude: number;
  longitude: number;
};

export type MapPagePoiPayload = MapPoiPoint;
