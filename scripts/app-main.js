window.LandScopeApp = (() => {
  const { buildMapUrl, formatCurrency, getGrowthPercentage } = window.LandScopeUtils;
  const { loadAllDatasets } = window.LandScopeData;
  const { getThread, loadChats, saveChats } = window.LandScopeChat;

  const MAX_RESULTS = 80;

  const state = {
    properties: [],
    filteredProperties: [],
    selectedPropertyId: null,
    searchLocation: "",
    activeType: "All",
    activeMode: "All",
    activeCity: "All",
    qualityMultiplier: 1,
    currentRole: "customer",
    chats: loadChats()
  };

  const elements = {
    locationInput: document.getElementById("location"),
    typeFilter: document.getElementById("type-filter"),
    modeFilter: document.getElementById("mode-filter"),
    cityFilter: document.getElementById("city-filter"),
    propertyList: document.getElementById("property-list"),
    resultCount: document.getElementById("result-count"),
    detailTitle: document.getElementById("detail-title"),
    detailCity: document.getElementById("detail-city"),
    detailStats: document.getElementById("detail-stats"),
    detailDescription: document.getElementById("detail-description"),
    detailAddress: document.getElementById("detail-address"),
    detailOwner: document.getElementById("detail-owner"),
    detailHighlights: document.getElementById("detail-highlights"),
    detailSignals: document.getElementById("detail-signals"),
    mapFrame: document.getElementById("map-frame"),
    mapCaption: document.getElementById("map-caption"),
    estimateSummary: document.getElementById("estimate-summary"),
    qualityRange: document.getElementById("quality-range"),
    qualityValue: document.getElementById("quality-value"),
    estimateTotal: document.getElementById("estimate-total"),
    estimateRate: document.getElementById("estimate-rate"),
    chatBox: document.getElementById("chat-box"),
    chatInput: document.getElementById("chat-input"),
    heroText: document.getElementById("hero-text"),
    loadingState: document.getElementById("loading-state"),
    datasetSummary: document.getElementById("dataset-summary"),
    roleToggle: document.getElementById("role-toggle"),
    ownerContact: document.getElementById("owner-contact"),
    marketLabel: document.getElementById("market-label")
  };

  function getConstructionEstimate(property, qualityMultiplier) {
    if (!property) return 0;
    const baseCost =
      property.type === "Apartment" ? 2100 : property.type === "Land" || property.type === "Plot" ? 1850 : 2000;
    return Math.round(property.areaSqft * baseCost * qualityMultiplier);
  }

  function applyFilters() {
    const query = state.searchLocation.toLowerCase();
    const filtered = state.properties.filter((property) => {
      const searchMatch =
        !query ||
        property.city.toLowerCase().includes(query) ||
        property.locality.toLowerCase().includes(query) ||
        property.address.toLowerCase().includes(query) ||
        property.title.toLowerCase().includes(query);
      const typeMatch = state.activeType === "All" || property.type === state.activeType;
      const modeMatch = state.activeMode === "All" || property.mode === state.activeMode;
      const cityMatch = state.activeCity === "All" || property.city === state.activeCity;
      return searchMatch && typeMatch && modeMatch && cityMatch;
    });

    filtered.sort((first, second) => (second.priceNow || 0) - (first.priceNow || 0));
    state.filteredProperties = filtered.slice(0, MAX_RESULTS);
    if (state.filteredProperties.length && !state.filteredProperties.some((item) => item.id === state.selectedPropertyId)) {
      state.selectedPropertyId = state.filteredProperties[0].id;
    }
  }

  function getSelectedProperty() {
    return state.filteredProperties.find((property) => property.id === state.selectedPropertyId) || null;
  }

  function renderCityOptions() {
    const cities = ["All", ...new Set(state.properties.map((property) => property.city).filter(Boolean))];
    elements.cityFilter.innerHTML = cities.map((city) => `<option value="${city}">${city}</option>`).join("");
    elements.cityFilter.value = state.activeCity;
  }

  function renderSummary() {
    elements.datasetSummary.textContent = `${state.properties.length} listings loaded from your Gurgaon, Hyderabad, Kolkata, and Mumbai datasets.`;
    elements.heroText.textContent =
      "Search by city, locality, property type, or sale/rent mode. The app now uses your CSV data and keeps chats per property.";
  }

  function renderPropertyList() {
    elements.propertyList.innerHTML = "";

    if (!state.filteredProperties.length) {
      elements.propertyList.innerHTML =
        '<div class="empty-state"><p>No matching properties found for this location or filter.</p></div>';
      elements.resultCount.textContent = "0 result(s)";
      return;
    }

    elements.resultCount.textContent = `${state.filteredProperties.length} result(s) shown`;

    state.filteredProperties.forEach((property) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `property-card ${state.selectedPropertyId === property.id ? "active" : ""}`;
      button.innerHTML = `
        <div class="property-topline">
          <span class="badge">${property.mode}</span>
          <span class="muted">${property.type}</span>
        </div>
        <img class="property-image" src="${property.imageUrl || "https://via.placeholder.com/600x340?text=No+Image"}" alt="${property.title}" />
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
      elements.propertyList.appendChild(button);
    });
  }

  function renderDetails(property) {
    if (!property) {
      elements.detailTitle.textContent = "Property Details";
      elements.detailCity.textContent = "";
      elements.detailStats.innerHTML = "";
      elements.detailDescription.textContent = "Select a property to view details.";
      elements.detailAddress.textContent = "";
      elements.detailOwner.textContent = "";
      elements.ownerContact.textContent = "";
      elements.marketLabel.textContent = "";
      elements.detailHighlights.innerHTML = "";
      elements.detailSignals.innerHTML = "";
      return;
    }

    elements.detailTitle.textContent = property.heading;
    elements.detailCity.textContent = property.city;
    elements.detailDescription.textContent = property.description;
    elements.detailAddress.textContent = property.address || property.city;
    elements.detailOwner.textContent = `Owner / Seller: ${property.ownerCompany}`;
    elements.ownerContact.textContent = `Contact person: ${property.owner}`;
    elements.marketLabel.textContent = "Past value is estimated from locality and amenity signals because the CSV does not include certified sale-deed history.";

    elements.detailStats.innerHTML = `
      <div class="stat-card">
        <span class="muted">Current ${property.mode === "Rent" ? "Rent" : "Price"}</span>
        <strong>${formatCurrency(property.priceNow, property.mode)}</strong>
      </div>
      <div class="stat-card">
        <span class="muted">Estimated Past Value</span>
        <strong>${formatCurrency(property.pricePast, property.mode)}</strong>
      </div>
      <div class="stat-card">
        <span class="muted">Growth Potential</span>
        <strong>${getGrowthPercentage(property.priceNow, property.pricePast)}%</strong>
      </div>
      <div class="stat-card">
        <span class="muted">Layout</span>
        <strong>${property.bedrooms || "-"} BHK | ${property.bathrooms || "-"} Bath</strong>
      </div>
    `;

    elements.detailHighlights.innerHTML = property.nearbyHighlights.map((item) => `<li>${item}</li>`).join("");
    elements.detailSignals.innerHTML = property.infrastructureSignals
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
    elements.mapFrame.src = buildMapUrl(property, state.searchLocation);
    elements.mapCaption.textContent = "Using free Google Maps embed mode. Add a key in scripts/utils.js if needed.";
  }

  function renderEstimator(property) {
    if (!property) {
      elements.estimateSummary.textContent = "Choose a property first to estimate construction cost.";
      elements.qualityValue.textContent = "Selected multiplier: 1.0x";
      elements.estimateTotal.textContent = "";
      elements.estimateRate.textContent = "";
      return;
    }

    const total = getConstructionEstimate(property, state.qualityMultiplier);
    elements.estimateSummary.innerHTML = `Estimated build cost for <strong>${property.areaSqft} sqft</strong> in ${property.city}.`;
    elements.qualityValue.textContent = `Selected multiplier: ${state.qualityMultiplier.toFixed(1)}x`;
    elements.estimateTotal.textContent = formatCurrency(total, "Sale");
    elements.estimateRate.textContent = `Market reference: ${formatCurrency(property.estimatePerSqft, "Sale")} per sqft`;
  }

  function renderChat(property) {
    elements.chatBox.innerHTML = "";

    if (!property) {
      elements.chatBox.innerHTML = "<p>Select a property to start chatting.</p>";
      return;
    }

    const thread = getThread(state.chats, property);
    thread.forEach((message) => {
      const node = document.createElement("div");
      node.className = `chat-message ${message.sender}`;
      node.innerHTML = `
        <span>${message.sender === "customer" ? "Customer" : "Owner"}</span>
        <p>${message.text}</p>
        <small>${new Date(message.timestamp).toLocaleString("en-IN")}</small>
      `;
      elements.chatBox.appendChild(node);
    });
  }

  function render() {
    const selectedProperty = getSelectedProperty();
    renderSummary();
    renderPropertyList();
    renderDetails(selectedProperty);
    renderMap(selectedProperty);
    renderEstimator(selectedProperty);
    renderChat(selectedProperty);
  }

  function bindEvents() {
    document.getElementById("search-form").addEventListener("submit", (event) => {
      event.preventDefault();
      state.searchLocation = elements.locationInput.value.trim();
      applyFilters();
      render();
    });

    elements.typeFilter.addEventListener("change", (event) => {
      state.activeType = event.target.value;
      applyFilters();
      render();
    });

    elements.modeFilter.addEventListener("change", (event) => {
      state.activeMode = event.target.value;
      applyFilters();
      render();
    });

    elements.cityFilter.addEventListener("change", (event) => {
      state.activeCity = event.target.value;
      applyFilters();
      render();
    });

    elements.qualityRange.addEventListener("input", (event) => {
      state.qualityMultiplier = Number(event.target.value);
      renderEstimator(getSelectedProperty());
    });

    elements.roleToggle.addEventListener("change", (event) => {
      state.currentRole = event.target.value;
    });

    document.getElementById("chat-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const selectedProperty = getSelectedProperty();
      const message = elements.chatInput.value.trim();
      if (!selectedProperty || !message) return;

      const thread = getThread(state.chats, selectedProperty);
      thread.push({
        sender: state.currentRole,
        text: message,
        timestamp: new Date().toISOString()
      });
      saveChats(state.chats);
      elements.chatInput.value = "";
      renderChat(selectedProperty);
    });
  }

  async function initialize() {
    try {
      bindEvents();
      elements.loadingState.textContent = "Loading property datasets...";
      state.properties = await loadAllDatasets();
      renderCityOptions();
      applyFilters();
      render();
      elements.loadingState.textContent = "";
    } catch (error) {
      elements.loadingState.textContent = `Could not load datasets: ${error.message}`;
    }
  }

  return { initialize };
})();
