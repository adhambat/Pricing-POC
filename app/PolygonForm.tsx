import React, { useState, useEffect } from "react";

/**
 * PolygonForm Component
 *
 * A modal form for inputting and submitting polygon-related information.
 *
 * Props:
 * - polygonData: Object containing area, country, and price or null.
 * - onSubmit: Callback function to handle form submission with country and price as arguments.
 * - onClose: Callback function to close the modal.
 *
 * The component manages its own state for the country and price inputs,
 * synchronizing with the provided props via useEffect.
 */
interface PolygonData {
  area: string;
  country: string;
  price: string;
}

interface PolygonFormProps {
  polygonData: PolygonData | null; // Allow polygonData to be null
  onSubmit: (country: string, price: string) => void;
  onClose: () => void;
}

const PolygonForm: React.FC<PolygonFormProps> = ({
  polygonData,
  onSubmit,
  onClose,
}) => {
  const [countryInput, setCountryInput] = useState("");
  const [priceInput, setPriceInput] = useState("");

  useEffect(() => {
    if (polygonData) {
      setCountryInput(polygonData.country);
      setPriceInput(polygonData.price);
    }
  }, [polygonData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (polygonData) {
      onSubmit(countryInput, priceInput);
    }
  };

  if (!polygonData) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-sm w-full transform transition-all duration-300 hover:shadow-2xl">
        <h2 className="text-xl mb-4 font-semibold">Polygon Information</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium">Country</label>
            <input
              type="text"
              value={countryInput}
              onChange={(e) => setCountryInput(e.target.value)}
              className="border border-gray-300 rounded-md w-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out"
              required
              aria-label="Country"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium">Price</label>
            <input
              type="number"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              className="border border-gray-300 rounded-md w-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out"
              required
              aria-label="Price"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium">
              Area (km²)
            </label>
            <input
              type="text"
              value={polygonData.area}
              disabled
              className="border border-gray-300 rounded-md w-full p-2 bg-gray-200 cursor-not-allowed"
              aria-label="Area (km²)"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="mr-4 text-blue-500 hover:underline"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-md shadow-md transition duration-150 ease-in-out hover:bg-blue-600 hover:shadow-lg"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PolygonForm;
