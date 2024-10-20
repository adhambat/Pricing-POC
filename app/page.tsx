import Map from "./Map";

export default function Home() {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet/dist/leaflet.css"
      />
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet-draw/dist/leaflet.draw.css"
      />
      <Map />
    </>
  );
}
