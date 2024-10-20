import L from "leaflet";

/**
 * CustomPolygonOptions interface to include additional properties
 * specific to custom polygons.
 */
export interface CustomPolygonOptions extends L.PolylineOptions {
  country?: string;
  price?: string;
}
