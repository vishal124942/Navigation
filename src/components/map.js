import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./map.css";
import sourceIcon from "../Assets/source.png";
import destinationIcon from "../Assets/destination.png";
import arrowIcon from "../Assets/arrow.png";

const sourceIconObj = L.icon({
  iconUrl: sourceIcon,
  iconSize: [32, 32],
});

const destinationIconObj = L.icon({
  iconUrl: destinationIcon,
  iconSize: [32, 32],
});

const arrowIconObj = L.icon({
  iconUrl: arrowIcon,
  iconSize: [20, 80],
});

const MyMap = () => {
  const [startCoords, setStartCoords] = useState([22.1696, 91.4996]);
  const [endCoords, setEndCoords] = useState([22.2637, 91.7159]);
  const [speed, setSpeed] = useState(20);
  const [polylineCoords, setPolylineCoords] = useState([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [arrowPosition, setArrowPosition] = useState(null);

  useEffect(() => {
    let timeoutId;
    let step = 0;

    const animateArrow = () => {
      const distance = getDistance(startCoords, endCoords);
      const duration = distance / (speed / 3.6); // Convert speed from km/h to m/s
      const numSteps = duration * 2; // Update position every 500ms (2 FPS)
      const deltaLat = (endCoords[0] - startCoords[0]) / numSteps;
      const deltaLon = (endCoords[1] - startCoords[1]) / numSteps;
      let currentLat = startCoords[0];
      let currentLon = startCoords[1];
      const coords = [];

      const updatePosition = () => {
        currentLat += deltaLat;
        currentLon += deltaLon;
        const newPosition = [currentLat, currentLon];
        coords.push(newPosition);
        setPolylineCoords(coords);

        // Update the arrow position and rotation angle
        const vesselIndex = coords.length - 1;
        const prevIndex = vesselIndex === 0 ? 0 : vesselIndex - 1;
        const prevCoord = coords[prevIndex];
        const nextCoord = coords[vesselIndex];

        const arrowAngle = getAngle(prevCoord, nextCoord);
        const arrowOffsetX = Math.cos(arrowAngle) * 0.0005; // Adjust offset values as needed
        const arrowOffsetY = Math.sin(arrowAngle) * 0.0005;

        setArrowPosition([
          prevCoord[0] + arrowOffsetX,
          prevCoord[1] + arrowOffsetY,
          arrowAngle,
        ]);

        if (step < numSteps) {
          step++;
          timeoutId = setTimeout(updatePosition, 100); // Update every 500ms (2 FPS)
        } else {
          setIsNavigating(false);
        }
      };

      updatePosition();
    };

    if (isNavigating) {
      animateArrow();
    }

    return () => clearTimeout(timeoutId);
  }, [startCoords, endCoords, speed, isNavigating]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setPolylineCoords([]);
    setIsNavigating(true);
    setArrowPosition(null); // Reset the arrow position

    // Swap startCoords and endCoords
    setStartCoords(endCoords);
    setEndCoords(startCoords);
  };

  const getDistance = (start, end) => {
    const R = 6371e3; // Earth's radius in meters
    const phi1 = (start[0] * Math.PI) / 180;
    const phi2 = (end[0] * Math.PI) / 180;
    const deltaPhi = ((end[0] - start[0]) * Math.PI) / 180;
    const deltaLambda = ((end[1] - start[1]) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) ** 2 +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const getAngle = (start, end) => {
    const dLon = (end[1] - start[1]) * (Math.PI / 180);
    const y = Math.sin(dLon) * Math.cos(end[0] * (Math.PI / 180));
    const x =
      Math.cos(start[0] * (Math.PI / 180)) *
        Math.sin(end[0] * (Math.PI / 180)) -
      Math.sin(start[0] * (Math.PI / 180)) *
        Math.cos(end[0] * (Math.PI / 180)) *
        Math.cos(dLon);
    const angle = Math.atan2(y, x) * (180 / Math.PI);
    return angle;
  };

  return (
    <div className="map-container">
      <MapContainer
        center={startCoords}
        zoom={13}
        className="map-wrapper"
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={startCoords} icon={sourceIconObj} />
        <Marker position={endCoords} icon={destinationIconObj} />
        {arrowPosition && (
          <Marker
            position={[arrowPosition[0], arrowPosition[1]]}
            icon={arrowIconObj}
            rotationAngle={arrowPosition[2]}
          />
        )}
        <Polyline positions={polylineCoords} />
      </MapContainer>
      <div className="map-overlay">
        <h2>Vessel Navigation</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Start Coordinates:
            <input
              type="text"
              value={`${startCoords[0]}, ${startCoords[1]}`}
              onChange={(e) =>
                setStartCoords(e.target.value.split(",").map(Number))
              }
            />
          </label>
          <label>
            End Coordinates:
            <input
              type="text"
              value={`${endCoords[0]}, ${endCoords[1]}`}
              onChange={(e) =>
                setEndCoords(e.target.value.split(",").map(Number))
              }
            />
          </label>
          <label>
            Speed (km/h):
            <input
              type="number"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            />
          </label>
          <button type="submit">Start Navigation</button>
        </form>
      </div>
    </div>
  );
};

export default MyMap;
