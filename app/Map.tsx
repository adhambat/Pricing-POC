"use client";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet-draw";
import * as turf from "@turf/turf";
import { CustomPolygonOptions } from "./types/leaflet";
import PolygonForm from "./PolygonForm";

interface PolygonData {
  id: number;
  area: string;
  country: string;
  price: string;
  highlighted: boolean;
  originalStyle: {
    color: string | undefined;
  };
}

const MapComponent = () => {
  const mapRef = useRef<L.Map | null>(null);
  const isEditMode = useRef<boolean>(false);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [polygonData, setPolygonData] = useState<{
    area: string;
    country: string;
    price: string;
  }>({ area: "", country: "", price: "" });
  const [polygonLayer, setPolygonLayer] =
    useState<L.Polygon<CustomPolygonOptions> | null>(null);
  const polygonMarkerMap = useRef<Map<number, L.Marker[]>>(new Map());
  const [polygons, setPolygons] = useState<PolygonData[]>([]);
  const [highlightedPolygonIds, setHighlightedPolygonIds] = useState<number[]>(
    []
  );
  const [inputValues, setInputValues] = useState<{
    [id: number]: { country: string; price: string };
  }>({});

  // Initializes the map
  useEffect(() => {
    if (!mapRef.current) {
      const map = L.map("map").setView([33.8, 35.5], 8.5);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      const drawnItems = new L.FeatureGroup();
      drawnItemsRef.current = drawnItems;
      map.addLayer(drawnItems);

      const drawControl = new L.Control.Draw({
        edit: {
          featureGroup: drawnItems,
        },
      });
      map.addControl(drawControl);

      // Updates the polygon's properties and opens the form when a polygon is clicked in edit mode
      const editPolygonProperties = (
        layer: L.Polygon<CustomPolygonOptions>,
        leafletId?: number
      ) => {
        const geoJson = layer.toGeoJSON();
        const area = turf.area(geoJson);
        const formattedArea = (area / 1000000).toFixed(2);

        setPolygons((prevPolygons) =>
          prevPolygons.map((polygon) =>
            polygon.id === leafletId
              ? { ...polygon, area: formattedArea }
              : polygon
          )
        );
        setPolygonData({
          area: formattedArea,
          country: (layer.options as CustomPolygonOptions).country || "",
          price: (layer.options as CustomPolygonOptions).price || "",
        });
        setPolygonLayer(layer as L.Polygon<CustomPolygonOptions>);
        setIsFormOpen(true);
      };

      // Handles polygon creation
      map.on(L.Draw.Event.CREATED, function (event) {
        const layer = event.layer;
        drawnItems.addLayer(layer);

        if (layer instanceof L.Polygon) {
          const originalStyle = { color: layer.options.color };
          layer.setStyle(originalStyle);

          const coords = layer.getLatLngs()[0] as L.LatLng[];
          const vertexMarkers: L.Marker[] = [];

          coords.forEach((latLng) => {
            const marker = L.marker(latLng, {
              draggable: true,
            }).addTo(map);
            marker.bindPopup(
              `Lat: ${latLng.lat.toFixed(5)}, Lng: ${latLng.lng.toFixed(5)}`
            );
            vertexMarkers.push(marker);
          });

          const leafletId = (layer as any)._leaflet_id;
          polygonMarkerMap.current.set(leafletId, vertexMarkers);

          layer.on("click", function () {
            if (!isEditMode.current) {
              layer.openPopup();
            } else {
              editPolygonProperties(layer);
            }
          });

          const geoJson = layer.toGeoJSON();
          const area = turf.area(geoJson);
          const formattedArea = (area / 1000000).toFixed(2);

          const newPolygon = {
            id: leafletId,
            area: formattedArea,
            country: "",
            price: "",
            highlighted: false,
            originalStyle,
          };

          setPolygons((prevPolygons) => [...prevPolygons, newPolygon]);

          setPolygonData({ area: formattedArea, country: "", price: "" });
          setPolygonLayer(layer as L.Polygon<CustomPolygonOptions>);
          setIsFormOpen(true);
        }
      });

      // Sets edit mode to true when editing starts
      map.on(L.Draw.Event.EDITSTART, function () {
        isEditMode.current = true;
      });

      // Updates polygon markers and data when polygons are edited
      map.on(L.Draw.Event.EDITED, function (event: any) {
        event.layers.eachLayer(function (layer: L.Layer) {
          if (layer instanceof L.Polygon) {
            const newCoords = layer.getLatLngs()[0] as L.LatLng[];
            const leafletId = (layer as any)._leaflet_id;
            const vertexMarkers = polygonMarkerMap.current.get(leafletId) || [];

            if (newCoords.length > vertexMarkers.length) {
              for (let i = vertexMarkers.length; i < newCoords.length; i++) {
                const newMarker = L.marker(newCoords[i]).addTo(map);
                newMarker.bindPopup(
                  `Lat: ${newCoords[i].lat.toFixed(5)}, Lng: ${newCoords[
                    i
                  ].lng.toFixed(5)}`
                );
                vertexMarkers.push(newMarker);
              }
            }

            newCoords.forEach((latLng, index) => {
              const marker = vertexMarkers[index];
              if (marker) {
                marker.setLatLng(latLng);
              }
            });

            if (newCoords.length < vertexMarkers.length) {
              for (
                let i = vertexMarkers.length - 1;
                i >= newCoords.length;
                i--
              ) {
                const markerToRemove = vertexMarkers[i];
                map.removeLayer(markerToRemove);
                vertexMarkers.pop();
              }
            }

            polygonMarkerMap.current.set(leafletId, vertexMarkers);

            editPolygonProperties(layer, leafletId);
          }
        });

        isEditMode.current = false;
      });

      // Exits edit mode when editing stops
      map.on(L.Draw.Event.EDITSTOP, function () {
        isEditMode.current = false;
      });

      // Deletes polygons and associated markers when deleted
      map.on(L.Draw.Event.DELETED, function (event: any) {
        event.layers.eachLayer(function (layer: L.Layer) {
          if (layer instanceof L.Polygon) {
            const leafletId = (layer as any)._leaflet_id;

            setPolygons((prevPolygons) =>
              prevPolygons.filter((polygon) => polygon.id !== leafletId)
            );
            const vertexMarkers = polygonMarkerMap.current.get(leafletId) || [];

            vertexMarkers.forEach((marker: L.Marker) => {
              map.removeLayer(marker);
            });

            polygonMarkerMap.current.delete(leafletId);
          }
        });
      });
    }
  }, []);

  // Toggles highlighting a polygon on the map
  const handleHighlightPolygon = (polygonId: number) => {
    const drawnItems = drawnItemsRef.current;
    if (!drawnItems) return;

    const polygonLayer = drawnItems
      .getLayers()
      .find(
        (layer) => (layer as any)._leaflet_id === polygonId
      ) as L.Polygon<CustomPolygonOptions>;

    const isHighlighted = highlightedPolygonIds.includes(polygonId);

    if (isHighlighted) {
      setHighlightedPolygonIds((prevIds) =>
        prevIds.filter((id) => id !== polygonId)
      );
      if (polygonLayer) {
        const originalStyle = polygons.find(
          (p) => p.id === polygonId
        )?.originalStyle;
        if (originalStyle) {
          polygonLayer.setStyle(originalStyle);
        }
      }
    } else {
      setHighlightedPolygonIds((prevIds) => [...prevIds, polygonId]);
      if (polygonLayer) {
        polygonLayer.setStyle({ color: "red" });
      }
    }
  };

  // Handles form submission to update polygon properties
  const handleFormSubmit = (country: string, price: string) => {
    if (polygonLayer && polygonData) {
      const leafletId = (polygonLayer as any)._leaflet_id;
      (polygonLayer.options as CustomPolygonOptions).country = country;
      (polygonLayer.options as CustomPolygonOptions).price = price;

      setPolygons((prevPolygons) =>
        prevPolygons.map((polygon) =>
          polygon.id === leafletId
            ? {
                ...polygon,
                country: country,
                price: price,
              }
            : polygon
        )
      );

      setInputValues((prevValues) => ({
        ...prevValues,
        [leafletId]: { country: country, price: price },
      }));

      const popupContent = `
      <strong>Area:</strong> ${polygonData.area} km² <br />
      <strong>Country:</strong> ${country} <br />
      <strong>Price:</strong> ${price}
    `;
      polygonLayer.bindPopup(popupContent);

      setIsFormOpen(false);
    }
  };

  // Handles input changes for country or price fields
  const handleInputChange = (
    id: number,
    field: "country" | "price",
    value: string
  ) => {
    setInputValues((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  // Saves all changes and update the polygons on the map
  const handleSaveAllChanges = () => {
    const drawnItems = drawnItemsRef.current;
    if (!drawnItems) return;

    polygons.forEach((polygon) => {
      const polygonLayer = drawnItems
        .getLayers()
        .find(
          (layer) => (layer as any)._leaflet_id === polygon.id
        ) as L.Polygon<CustomPolygonOptions>;

      if (polygonLayer) {
        const updatedValues = inputValues[polygon.id];
        if (updatedValues) {
          const { country, price } = updatedValues;

          (polygonLayer.options as CustomPolygonOptions).country = country;
          (polygonLayer.options as CustomPolygonOptions).price = price;

          polygonLayer.bindPopup(`
            <strong>Area:</strong> ${polygon.area} km² <br />
            <strong>Country:</strong> ${country} <br />
            <strong>Price:</strong> ${price}
          `);

          setPolygons((prevPolygons) =>
            prevPolygons.map((p) =>
              p.id === polygon.id ? { ...p, country, price } : p
            )
          );
        }
      }
    });
  };

  return (
    <>
      <div className="flex">
        <div id="map" className="relative w-[850px] h-[600px] z-10" />

        <div className="w-[400px] ml-4 p-4 bg-white shadow-lg rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Polygons List
          </h3>

          <ul className="space-y-4 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 pr-2">
            {polygons.filter(
              (polygon) => polygon.country !== "" && polygon.price !== ""
            ).length === 0 ? (
              <li className="text-gray-500 text-center">List is empty</li>
            ) : (
              polygons
                .filter(
                  (polygon) => polygon.country !== "" && polygon.price !== ""
                )
                .map((polygon) => (
                  <li
                    key={polygon.id}
                    className="border border-gray-300 rounded-md p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="mb-2">
                      <strong className="text-gray-700">Area:</strong>
                      {polygon.area}
                    </div>
                    <div className="mb-2">
                      <input
                        type="text"
                        value={
                          inputValues[polygon.id]?.country || polygon.country
                        }
                        onChange={(e) =>
                          handleInputChange(
                            polygon.id,
                            "country",
                            e.target.value
                          )
                        }
                        className="border border-gray-300 p-2 rounded-md w-full"
                      />
                    </div>
                    <div className="mb-4">
                      <input
                        type="number"
                        value={inputValues[polygon.id]?.price || polygon.price}
                        onChange={(e) =>
                          handleInputChange(polygon.id, "price", e.target.value)
                        }
                        className="border border-gray-300 p-2 rounded-md w-full"
                      />
                    </div>

                    <button
                      onClick={() => handleHighlightPolygon(polygon.id)}
                      className={`px-4 py-2 ml-1 rounded-lg text-white font-medium shadow-md transition-all ${
                        highlightedPolygonIds.includes(polygon.id)
                          ? "bg-red-500 hover:bg-red-600"
                          : "bg-blue-500 hover:bg-blue-600"
                      }`}
                    >
                      {highlightedPolygonIds.includes(polygon.id)
                        ? "Unhighlight"
                        : "Highlight"}
                    </button>
                  </li>
                ))
            )}
          </ul>
          {polygons.length > 0 && (
            <button
              onClick={handleSaveAllChanges}
              className="mt-4 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg shadow-md transition-all"
            >
              Save All
            </button>
          )}
        </div>
      </div>

      {isFormOpen && (
        <PolygonForm
          polygonData={polygonData}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleFormSubmit}
        />
      )}
    </>
  );
};

export default MapComponent;
