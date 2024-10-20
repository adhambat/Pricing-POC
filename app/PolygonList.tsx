import React from "react";

interface PolygonListProps {
  polygons: Array<{
    id: number;
    area: string;
    country: string;
    price: string;
  }>;
}

const PolygonList: React.FC<PolygonListProps> = ({ polygons }) => {
  return (
    <div className="polygon-list p-4 bg-white shadow-md max-w-xs">
      <h2 className="font-bold text-xl mb-4">Polygons</h2>
      {polygons.length === 0 ? (
        <p>No polygons added yet.</p>
      ) : (
        <ul>
          {polygons.map((polygon) => (
            <li key={polygon.id} className="mb-2">
              <strong>Area:</strong> {polygon.area} km² <br />
              <strong>Country:</strong> {polygon.country} <br />
              <strong>Price:</strong> {polygon.price}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PolygonList;
