const GOOGLE_MAPS_API_KEY = "";

const properties = [
  {
    id: 1,
    title: "Highway Edge Villa Plot",
    type: "Plot",
    mode: "Sale",
    city: "Bengaluru",
    address: "Mysuru Road Growth Corridor, Bengaluru",
    latitude: 12.9121,
    longitude: 77.4812,
    areaSqft: 2400,
    facing: "East",
    priceNow: 9200000,
    pricePast: 7100000,
    nearbyHighlights: [
      "Proposed ring road interchange within 2.5 km",
      "Metro expansion phase under construction",
      "School and hospital within 10 minutes"
    ],
    infrastructureSignals: [
      { label: "Highway expansion", impact: "+18%" },
      { label: "Metro connectivity", impact: "+9%" },
      { label: "Water line approval", impact: "+4%" }
    ],
    description:
      "Residential plot in a fast-appreciating growth corridor with strong road connectivity, making it attractive for both end users and investors.",
    owner: "Arjun Developers",
    estimatePerSqft: 2150
  },
  {
    id: 2,
    title: "Lake View Apartment",
    type: "Apartment",
    mode: "Rent",
    city: "Hyderabad",
    address: "Kokapet Financial District, Hyderabad",
    latitude: 17.3903,
    longitude: 78.3322,
    areaSqft: 1480,
    facing: "North",
    priceNow: 42000,
    pricePast: 35000,
    nearbyHighlights: [
      "IT park within 5 km",
      "New flyover reducing peak traffic",
      "Retail mall coming up nearby"
    ],
    infrastructureSignals: [
      { label: "Flyover completion", impact: "+11%" },
      { label: "IT office absorption", impact: "+7%" }
    ],
    description:
      "A premium apartment for working professionals with access to major business hubs and upcoming commercial infrastructure.",
    owner: "Saanvi Realty",
    estimatePerSqft: 2350
  },
  {
    id: 3,
    title: "Farmland Conversion Site",
    type: "Land",
    mode: "Sale",
    city: "Chennai",
    address: "Outer Ring Peripheral Zone, Chennai",
    latitude: 12.9724,
    longitude: 80.1496,
    areaSqft: 5400,
    facing: "South",
    priceNow: 13800000,
    pricePast: 9800000,
    nearbyHighlights: [
      "Industrial park announced",
      "Wider arterial road planned",
      "Logistics demand increasing"
    ],
    infrastructureSignals: [
      { label: "Industrial corridor", impact: "+22%" },
      { label: "Road widening", impact: "+10%" }
    ],
    description:
      "Large land parcel suitable for plotting or mixed-use development where infrastructure announcements are already changing market sentiment.",
    owner: "Greenfield Estates",
    estimatePerSqft: 1900
  },
  {
    id: 4,
    title: "Corner Commercial Site",
    type: "Site",
    mode: "Sale",
    city: "Pune",
    address: "Hinjewadi Expansion Belt, Pune",
    latitude: 18.5912,
    longitude: 73.7389,
    areaSqft: 3200,
    facing: "West",
    priceNow: 12100000,
    pricePast: 8900000,
    nearbyHighlights: [
      "Tech campus expansion approved",
      "Bus terminal revamp underway",
      "Rental demand growing"
    ],
    infrastructureSignals: [
      { label: "Employment growth", impact: "+14%" },
      { label: "Transit improvement", impact: "+8%" }
    ],
    description:
      "Commercially attractive corner site positioned to benefit from job growth, transit improvements, and stronger leasing activity.",
    owner: "Urban Axis",
    estimatePerSqft: 2450
  }
];

const chatSeed = {
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

const state = {
  searchLocation: "Bengaluru",
  selectedPropertyId: 1,
  activeType: "All",
  activeMode: "All",
  qualityMultiplier: 1,
  messages: JSON.parse(JSON.stringify(chatSeed))
};

const locationInput = document.getElementById("location");
const typeFilter = document.getElementById("type-filter");
const modeFilter = document.getElementById("mode-filter");
const propertyList = document.getElementById("property-list");
const resultCount = document.getElementById("result-count");
const detailTitle = document.getElementById("detail-title");
const detailCity = document.getElementById("detail-city");
const detailStats = document.getElementById("detail-stats");
const detailDescription = document.getElementById("detail-description");
const detailAddress = document.getElementById("detail-address");
const detailOwner = document.getElementById("detail-owner");
const detailHighlights = document.getElementById("detail-highlights");
const detailSignals = document.getElementById("detail-signals");
const mapFrame = document.getElementById("map-frame");
const mapCaption = document.getElementById("map-caption");
const estimateSummary = document.getElementById("estimate-summary");
const qualityRange = document.getElementById("quality-range");
const qualityValue = document.getElementById("quality-value");
const estimateTotal = document.getElementById("estimate-total");
const estimateRate = document.getElementById("estimate-rate");
const chatBox = document.getElementById("chat-box");
const chatInput = document.getElementById("chat-input");

document.getElementById("search-form").addEventListener("submit", (event) => {
  event.preventDefault();
  state.searchLocation = locationInput.value.trim() || "Bengaluru";
  render();
});

typeFilter.addEventListener("change", (event) => {
  state.activeType = event.target.value;
  render();
});

modeFilter.addEventListener("change", (event) => {
  state.activeMode = event.target.value;
  render();
});

qualityRange.addEventListener("input", (event) => {
  state.qualityMultiplier = Number(event.target.value);
  renderEstimator(getSelectedProperty());
});

document.getElementById("chat-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const selectedProperty = getSelectedProperty();
  const message = chatInput.value.trim();

  if (!selectedProperty || !message) {
    return;
  }

  state.messages[selectedProperty.id].push({ sender: "customer", text: message });
  chatInput.value = "";
  renderChat(selectedProperty);
});

function formatCurrency(value, mode) {
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);

  return mode === "Rent" ? `${formatted}/month` : formatted;
}

function getGrowthPercentage(current, past) {
  return (((current - past) / past) * 100).toFixed(1);
}

function getConstructionEstimate(areaSqft, qualityMultiplier) {
  const baseCostPerSqft = 1800;
  return Math.round(areaSqft * baseCostPerSqft * qualityMultiplier);
}

function buildMapUrl(property) {
  const target = property
    ? `${property.latitude},${property.longitude}`
    : encodeURIComponent(state.searchLocation || "India");

  if (GOOGLE_MAPS_API_KEY) {
    return `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${target}`;
  }

  return `https://maps.google.com/maps?q=${target}&z=14&output=embed`;
}

function getFilteredProperties() {
  return properties.filter((property) => {
    const locationMatch =
      !state.searchLocation ||
      property.city.toLowerCase().includes(state.searchLocation.toLowerCase()) ||
      property.address.toLowerCase().includes(state.searchLocation.toLowerCase());
    const typeMatch = state.activeType === "All" || property.type === state.activeType;
    const modeMatch = state.activeMode === "All" || property.mode === state.activeMode;
    return locationMatch && typeMatch && modeMatch;
  });
}

function getSelectedProperty() {
  const filtered = getFilteredProperties();
  const found = filtered.find((property) => property.id === state.selectedPropertyId);
  return found || filtered[0] || null;
}

function renderProperties() {
  const filtered = getFilteredProperties();
  resultCount.textContent = `${filtered.length} result(s)`;
  propertyList.innerHTML = "";

  if (!filtered.length) {
    propertyList.innerHTML = '<div class="empty-state"><p>No matching properties found for this location or filter.</p></div>';
    return;
  }

  filtered.forEach((property) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `property-card ${state.selectedPropertyId === property.id ? "active" : ""}`;
    button.innerHTML = `
      <div class="property-topline">
        <span class="badge">${property.mode}</span>
        <span class="muted">${property.type}</span>
      </div>
      <h3>${property.title}</h3>
      <p>${property.address}</p>
      <div class="property-metrics">
        <strong>${formatCurrency(property.priceNow, property.mode)}</strong>
        <span>${property.areaSqft} sqft</span>
      </div>
    `;
    button.addEventListener("click", () => {
      state.selectedPropertyId = property.id;
      render();
    });
    propertyList.appendChild(button);
  });
}

function renderDetails(property) {
  if (!property) {
    detailTitle.textContent = "Property Details";
    detailCity.textContent = "";
    detailStats.innerHTML = "";
    detailDescription.textContent = "Select a property to view details.";
    detailAddress.textContent = "";
    detailOwner.textContent = "";
    detailHighlights.innerHTML = "";
    detailSignals.innerHTML = "";
    return;
  }

  detailTitle.textContent = property.title;
  detailCity.textContent = property.city;
  detailDescription.textContent = property.description;
  detailAddress.textContent = property.address;
  detailOwner.textContent = `Owner / Seller: ${property.owner}`;

  detailStats.innerHTML = `
    <div class="stat-card">
      <span class="muted">Current ${property.mode === "Rent" ? "Rent" : "Price"}</span>
      <strong>${formatCurrency(property.priceNow, property.mode)}</strong>
    </div>
    <div class="stat-card">
      <span class="muted">Past Value</span>
      <strong>${formatCurrency(property.pricePast, property.mode)}</strong>
    </div>
    <div class="stat-card">
      <span class="muted">Growth</span>
      <strong>${getGrowthPercentage(property.priceNow, property.pricePast)}%</strong>
    </div>
    <div class="stat-card">
      <span class="muted">Facing</span>
      <strong>${property.facing}</strong>
    </div>
  `;

  detailHighlights.innerHTML = property.nearbyHighlights.map((item) => `<li>${item}</li>`).join("");
  detailSignals.innerHTML = property.infrastructureSignals
    .map(
      (signal) => `
        <li>
          <span>${signal.label}</span>
          <strong>${signal.impact}</strong>
        </li>
      `
    )
    .join("");
}

function renderMap(property) {
  mapFrame.src = buildMapUrl(property);
  mapCaption.textContent = GOOGLE_MAPS_API_KEY
    ? "Using your Google Maps API key."
    : "Using free Google Maps embed mode. Add a key in app.js if needed.";
}

function renderEstimator(property) {
  if (!property) {
    estimateSummary.textContent = "Choose a property first to estimate construction cost.";
    qualityValue.textContent = "Selected multiplier: 1.0x";
    estimateTotal.textContent = "";
    estimateRate.textContent = "";
    return;
  }

  const total = getConstructionEstimate(property.areaSqft, state.qualityMultiplier);
  estimateSummary.innerHTML = `Estimated build cost for <strong>${property.areaSqft} sqft</strong> using a baseline quality rate.`;
  qualityValue.textContent = `Selected multiplier: ${state.qualityMultiplier.toFixed(1)}x`;
  estimateTotal.textContent = formatCurrency(total, "Sale");
  estimateRate.textContent = `Suggested local estimate rate: ${formatCurrency(property.estimatePerSqft, "Sale")} per sqft`;
}

function renderChat(property) {
  chatBox.innerHTML = "";

  if (!property) {
    chatBox.innerHTML = "<p>Select a property to start chatting.</p>";
    return;
  }

  state.messages[property.id].forEach((message) => {
    const messageNode = document.createElement("div");
    messageNode.className = `chat-message ${message.sender}`;
    messageNode.innerHTML = `
      <span>${message.sender === "customer" ? "Customer" : "Owner"}</span>
      <p>${message.text}</p>
    `;
    chatBox.appendChild(messageNode);
  });
}

function render() {
  const filtered = getFilteredProperties();
  if (filtered.length && !filtered.some((property) => property.id === state.selectedPropertyId)) {
    state.selectedPropertyId = filtered[0].id;
  }

  const selectedProperty = getSelectedProperty();
  renderProperties();
  renderDetails(selectedProperty);
  renderMap(selectedProperty);
  renderEstimator(selectedProperty);
  renderChat(selectedProperty);
}

locationInput.value = state.searchLocation;
render();
