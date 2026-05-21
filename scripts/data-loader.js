window.LandScopeData = (() => {
  const { parseCsv, parseMapDetails, parsePseudoList, safeNumber } = window.LandScopeUtils;

  const DATA_FILES = ["./data/gurgaon_10k.csv", "./data/hyderabad.csv", "./data/kolkata.csv", "./data/mumbai.csv"];

  function extractLocationText(row) {
    const locationSource = row.location || "";
    const localityMatch = locationSource.match(/LOCALITY_NAME':\s*'([^']+)/);
    const addressMatch = locationSource.match(/ADDRESS':\s*'([^']+)/);
    return {
      localityName: localityMatch?.[1] || row.LOCALITY || row.LOCALITY_WO_CITY || "",
      address: addressMatch?.[1] || ""
    };
  }

  function inferMode(row) {
    const preference = (row.PREFERENCE || "").toUpperCase();
    if (preference === "R") {
      return "Rent";
    }
    return "Sale";
  }

  function inferType(row) {
    const source = row.PROPERTY_TYPE || row.PROPERTY_TYPE__U || "Property";
    const normalized = source.toLowerCase();
    if (normalized.includes("residential land")) {
      return "Plot";
    }
    if (normalized.includes("land")) {
      return "Land";
    }
    if (normalized.includes("plot")) {
      return "Plot";
    }
    if (normalized.includes("site")) {
      return "Site";
    }
    if (normalized.includes("apartment") || normalized.includes("flat")) {
      return "Apartment";
    }
    return source;
  }

  function computeMarketSignals(row) {
    const source = `${row.FORMATTED_LANDMARK_DETAILS || ""} ${row.TOP_USPS || ""} ${row.SECONDARY_TAGS || ""} ${
      row.DESCRIPTION || ""
    }`.toLowerCase();
    const signals = [];

    if (source.includes("metro")) signals.push({ label: "Metro access impact", impact: "+8%" });
    if (source.includes("highway") || source.includes("connectivity") || source.includes("expressway")) {
      signals.push({ label: "Road connectivity impact", impact: "+12%" });
    }
    if (source.includes("airport")) signals.push({ label: "Airport corridor effect", impact: "+6%" });
    if (source.includes("hospital") || source.includes("school") || source.includes("shopping")) {
      signals.push({ label: "Social infrastructure boost", impact: "+5%" });
    }
    if (source.includes("office") || source.includes("it") || source.includes("business")) {
      signals.push({ label: "Commercial demand pressure", impact: "+7%" });
    }

    if (!signals.length) {
      signals.push({ label: "Local demand momentum", impact: "+4%" });
    }

    return signals.slice(0, 4);
  }

  function estimatePastPrice(currentPrice, signals, mode, ageYears) {
    if (!currentPrice) {
      return 0;
    }
    let growthPercent = mode === "Rent" ? 7 : 10;
    growthPercent += signals.length * 2;
    growthPercent += Math.min(ageYears || 0, 5);
    return Math.round(currentPrice / (1 + growthPercent / 100));
  }

  function normalizeProperty(row, datasetName) {
    const mapData = parseMapDetails(row.MAP_DETAILS);
    const locationData = extractLocationText(row);
    const mode = inferMode(row);
    const type = inferType(row);
    const city = row.CITY || datasetName;
    const minPrice = safeNumber(row.MIN_PRICE);
    const maxPrice = safeNumber(row.MAX_PRICE);
    const explicitPrice = safeNumber(row.PRICE);
    const priceNow = explicitPrice || minPrice || maxPrice || 0;
    const areaSqft =
      safeNumber(row.SUPER_SQFT) ||
      safeNumber(row.SUPERBUILTUP_SQFT) ||
      safeNumber(row.BUILTUP_SQFT) ||
      safeNumber(row.CARPET_SQFT) ||
      safeNumber(row.MIN_AREA_SQFT) ||
      safeNumber(row.MAX_AREA_SQFT) ||
      safeNumber(row.BEDROOM_NUM) * 500 ||
      1200;
    const signals = computeMarketSignals(row);
    const ageYears = safeNumber(row.AGE) || 0;
    const pricePast = estimatePastPrice(priceNow, signals, mode, ageYears);
    const highlights = [
      row.SOCIETY_NAME,
      row.BUILDING_NAME,
      locationData.localityName,
      ...parsePseudoList(row.TOP_USPS),
      ...parsePseudoList(row.SECONDARY_TAGS)
    ].filter(Boolean);

    return {
      id: row.PROP_ID || row.SPID || `${datasetName}-${Math.random().toString(36).slice(2, 10)}`,
      title: row.PROP_HEADING || row.PROP_NAME || row.ALT_TAG || "Property Listing",
      heading: row.PROP_HEADING || row.PROP_NAME || "Property Listing",
      description: row.DESCRIPTION || "No description available.",
      type,
      mode,
      city,
      locality: locationData.localityName,
      address: [locationData.address, locationData.localityName, city].filter(Boolean).join(", "),
      latitude: mapData.latitude,
      longitude: mapData.longitude,
      areaSqft: Math.round(areaSqft),
      bedrooms: safeNumber(row.BEDROOM_NUM),
      bathrooms: safeNumber(row.BATHROOM_NUM),
      balconies: safeNumber(row.BALCONY_NUM),
      facing: row.FACING && row.FACING !== "0" ? row.FACING : "Not specified",
      furnishing: row.FURNISH || "Not specified",
      owner: row.CONTACT_NAME || row.CONTACT_COMPANY_NAME || row.CLASS_HEADING || "Property owner",
      ownerCompany: row.CONTACT_COMPANY_NAME || row.CLASS_HEADING || "Direct listing",
      priceNow,
      pricePast,
      imageUrl: row.PHOTO_URL || row.MEDIUM_PHOTO_URL || "",
      society: row.SOCIETY_NAME || row.BUILDING_NAME || "Independent property",
      tags: parsePseudoList(row.SECONDARY_TAGS),
      nearbyHighlights: highlights.slice(0, 6),
      infrastructureSignals: signals,
      totalLandmarks: safeNumber(row.TOTAL_LANDMARK_COUNT) || 0,
      estimatePerSqft: safeNumber(row.PRICE_PER_UNIT_AREA) || safeNumber(row.PRICE_SQFT) || 2200
    };
  }

  async function loadDataset(filePath) {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to load ${filePath}`);
    }
    const text = await response.text();
    const rows = parseCsv(text);
    const datasetName = filePath.split("/").pop().replace(".csv", "");
    return rows.map((row) => normalizeProperty(row, datasetName)).filter((property) => property.priceNow > 0);
  }

  async function loadAllDatasets() {
    const loaded = await Promise.all(DATA_FILES.map((filePath) => loadDataset(filePath)));
    return loaded.flat();
  }

  return {
    loadAllDatasets
  };
})();
