import { useEffect, useMemo, useState } from "react";
import { properties } from "./data/properties";

const defaultMessages = {
  1: [
    { sender: "customer", text: "Is this plot approved for immediate registration?" },
    { sender: "owner", text: "Yes, the documents are ready and we can share the survey papers." }
  ],
  2: [
    { sender: "customer", text: "Is maintenance included in the rent?" },
    { sender: "owner", text: "Maintenance is separate, around Rs. 4,500 per month." }
  ],
  3: [
    { sender: "customer", text: "How close is the new industrial corridor?" },
    { sender: "owner", text: "The notified corridor edge is roughly 3 km away." }
  ],
  4: [
    { sender: "customer", text: "Can this site be used for office space?" },
    { sender: "owner", text: "Yes, subject to commercial plan approval from the local authority." }
  ]
};

function formatCurrency(value, mode) {
  if (mode === "Rent") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(value) + "/month";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

function getGrowthPercentage(current, past) {
  return (((current - past) / past) * 100).toFixed(1);
}

function getConstructionEstimate(areaSqft, qualityMultiplier) {
  const baseCostPerSqft = 1800;
  const cost = areaSqft * baseCostPerSqft * qualityMultiplier;
  return Math.round(cost);
}

function buildMapEmbedUrl(property, searchedLocation, apiKey) {
  const target = property
    ? `${property.latitude},${property.longitude}`
    : encodeURIComponent(searchedLocation || "India");

  if (apiKey) {
    return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${target}`;
  }

  return `https://maps.google.com/maps?q=${target}&z=14&output=embed`;
}

export default function App() {
  const [locationInput, setLocationInput] = useState("");
  const [searchLocation, setSearchLocation] = useState("Bengaluru");
  const [activeType, setActiveType] = useState("All");
  const [activeMode, setActiveMode] = useState("All");
  const [selectedPropertyId, setSelectedPropertyId] = useState(properties[0].id);
  const [messages, setMessages] = useState(defaultMessages);
  const [draftMessage, setDraftMessage] = useState("");
  const [qualityMultiplier, setQualityMultiplier] = useState(1);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const locationMatch =
        !searchLocation ||
        property.city.toLowerCase().includes(searchLocation.toLowerCase()) ||
        property.address.toLowerCase().includes(searchLocation.toLowerCase());
      const typeMatch = activeType === "All" || property.type === activeType;
      const modeMatch = activeMode === "All" || property.mode === activeMode;
      return locationMatch && typeMatch && modeMatch;
    });
  }, [activeMode, activeType, searchLocation]);

  const selectedProperty =
    filteredProperties.find((property) => property.id === selectedPropertyId) || filteredProperties[0] || null;

  useEffect(() => {
    if (filteredProperties.length && !filteredProperties.some((item) => item.id === selectedPropertyId)) {
      setSelectedPropertyId(filteredProperties[0].id);
    }
  }, [filteredProperties, selectedPropertyId]);

  const constructionEstimate = selectedProperty
    ? getConstructionEstimate(selectedProperty.areaSqft, qualityMultiplier)
    : 0;

  function handleSearch(event) {
    event.preventDefault();
    setSearchLocation(locationInput.trim() || "Bengaluru");
  }

  function handleSendMessage(event) {
    event.preventDefault();

    if (!selectedProperty || !draftMessage.trim()) {
      return;
    }

    setMessages((current) => ({
      ...current,
      [selectedProperty.id]: [...(current[selectedProperty.id] || []), { sender: "customer", text: draftMessage.trim() }]
    }));
    setDraftMessage("");
  }

  return (
    <div className="app-shell">
      <header className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Smart Real Estate Discovery</p>
          <h1>Enter your location and explore lands, sites, apartments, and plots with market intelligence.</h1>
          <p className="hero-text">
            This starter app helps users search by location, compare rental and sale listings, track price movement,
            understand real-world infrastructure impact, and chat with property owners.
          </p>

          <form className="search-panel" onSubmit={handleSearch}>
            <label htmlFor="location" className="label">
              Enter Your Location
            </label>
            <div className="search-row">
              <input
                id="location"
                className="text-input"
                value={locationInput}
                onChange={(event) => setLocationInput(event.target.value)}
                placeholder="Example: Bengaluru, Hyderabad, Chennai"
              />
              <button className="primary-button" type="submit">
                Search
              </button>
            </div>
          </form>

          <div className="filter-row">
            <select className="filter-input" value={activeType} onChange={(event) => setActiveType(event.target.value)}>
              <option>All</option>
              <option>Plot</option>
              <option>Land</option>
              <option>Apartment</option>
              <option>Site</option>
            </select>

            <select className="filter-input" value={activeMode} onChange={(event) => setActiveMode(event.target.value)}>
              <option>All</option>
              <option>Sale</option>
              <option>Rent</option>
            </select>
          </div>
        </div>

        <div className="hero-map-card">
          <p className="map-title">Google Maps View</p>
          <iframe
            title="Location map"
            src={buildMapEmbedUrl(selectedProperty, searchLocation, apiKey)}
            loading="lazy"
            allowFullScreen
          />
          <p className="map-caption">
            {apiKey
              ? "Using your Google Maps API key."
              : "Working in free embed mode. Add a Google Maps API key for better control."}
          </p>
        </div>
      </header>

      <main className="content-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>Available Properties</h2>
            <span>{filteredProperties.length} result(s)</span>
          </div>

          <div className="property-list">
            {filteredProperties.map((property) => (
              <button
                key={property.id}
                className={`property-card ${selectedProperty?.id === property.id ? "active" : ""}`}
                onClick={() => setSelectedPropertyId(property.id)}
                type="button"
              >
                <div className="property-topline">
                  <span className="badge">{property.mode}</span>
                  <span className="muted">{property.type}</span>
                </div>
                <h3>{property.title}</h3>
                <p>{property.address}</p>
                <div className="property-metrics">
                  <strong>{formatCurrency(property.priceNow, property.mode)}</strong>
                  <span>{property.areaSqft} sqft</span>
                </div>
              </button>
            ))}

            {!filteredProperties.length && (
              <div className="empty-state">
                <p>No matching properties found for this location or filter.</p>
              </div>
            )}
          </div>
        </section>

        <section className="panel detail-panel">
          {selectedProperty ? (
            <>
              <div className="panel-heading">
                <h2>{selectedProperty.title}</h2>
                <span>{selectedProperty.city}</span>
              </div>

              <div className="detail-grid">
                <div className="stat-card">
                  <span className="muted">Current {selectedProperty.mode === "Rent" ? "Rent" : "Price"}</span>
                  <strong>{formatCurrency(selectedProperty.priceNow, selectedProperty.mode)}</strong>
                </div>
                <div className="stat-card">
                  <span className="muted">Past Value</span>
                  <strong>{formatCurrency(selectedProperty.pricePast, selectedProperty.mode)}</strong>
                </div>
                <div className="stat-card">
                  <span className="muted">Growth</span>
                  <strong>{getGrowthPercentage(selectedProperty.priceNow, selectedProperty.pricePast)}%</strong>
                </div>
                <div className="stat-card">
                  <span className="muted">Facing</span>
                  <strong>{selectedProperty.facing}</strong>
                </div>
              </div>

              <p className="description">{selectedProperty.description}</p>

              <div className="insight-columns">
                <div>
                  <h3>Location Details</h3>
                  <p>{selectedProperty.address}</p>
                  <p>Owner / Seller: {selectedProperty.owner}</p>
                  <ul className="clean-list">
                    {selectedProperty.nearbyHighlights.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3>Real-Life Market Signals</h3>
                  <ul className="signal-list">
                    {selectedProperty.infrastructureSignals.map((signal) => (
                      <li key={signal.label}>
                        <span>{signal.label}</span>
                        <strong>{signal.impact}</strong>
                      </li>
                    ))}
                  </ul>
                  <p className="insight-note">
                    Example: when highways, metro lines, flyovers, or IT parks are announced or built nearby, land and
                    rental demand often increase.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p>Select a property to view details.</p>
          )}
        </section>

        <section className="panel">
          <div className="panel-heading">
            <h2>Construction Cost Estimator</h2>
            <span>Approximate only</span>
          </div>

          {selectedProperty ? (
            <>
              <p className="estimator-text">
                Estimated build cost for <strong>{selectedProperty.areaSqft} sqft</strong> using a baseline quality
                rate.
              </p>

              <label className="label" htmlFor="quality">
                Construction Quality Multiplier
              </label>
              <input
                id="quality"
                type="range"
                min="0.9"
                max="1.6"
                step="0.1"
                value={qualityMultiplier}
                onChange={(event) => setQualityMultiplier(Number(event.target.value))}
              />
              <div className="estimate-box">
                <span>Selected multiplier: {qualityMultiplier.toFixed(1)}x</span>
                <strong>{formatCurrency(constructionEstimate, "Sale")}</strong>
                <p>
                  Suggested local estimate rate: {formatCurrency(selectedProperty.estimatePerSqft, "Sale")} per sqft
                </p>
              </div>
            </>
          ) : (
            <p>Choose a property first to estimate construction cost.</p>
          )}
        </section>

        <section className="panel">
          <div className="panel-heading">
            <h2>Customer Chat</h2>
            <span>Starter UI</span>
          </div>

          {selectedProperty ? (
            <>
              <div className="chat-box">
                {(messages[selectedProperty.id] || []).map((message, index) => (
                  <div key={`${message.sender}-${index}`} className={`chat-message ${message.sender}`}>
                    <span>{message.sender === "customer" ? "Customer" : "Owner"}</span>
                    <p>{message.text}</p>
                  </div>
                ))}
              </div>

              <form className="chat-form" onSubmit={handleSendMessage}>
                <input
                  className="text-input"
                  value={draftMessage}
                  onChange={(event) => setDraftMessage(event.target.value)}
                  placeholder="Ask about price, documents, approvals, or availability"
                />
                <button className="primary-button" type="submit">
                  Send
                </button>
              </form>
            </>
          ) : (
            <p>Choose a property to start chatting.</p>
          )}
        </section>
      </main>
    </div>
  );
}
