window.LandScopeUtils = (() => {
  const GOOGLE_MAPS_API_KEY = "";

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let value = "";
    let insideQuotes = false;

    for (let index = 0; index < text.length; index += 1) {
      const char = text[index];
      const nextChar = text[index + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          value += '"';
          index += 1;
        } else {
          insideQuotes = !insideQuotes;
        }
        continue;
      }

      if (char === "," && !insideQuotes) {
        row.push(value);
        value = "";
        continue;
      }

      if ((char === "\n" || char === "\r") && !insideQuotes) {
        if (char === "\r" && nextChar === "\n") {
          index += 1;
        }
        row.push(value);
        if (row.some((cell) => cell !== "")) {
          rows.push(row);
        }
        row = [];
        value = "";
        continue;
      }

      value += char;
    }

    if (value.length || row.length) {
      row.push(value);
      rows.push(row);
    }

    const [headerRow, ...dataRows] = rows;
    return dataRows.map((cells) => {
      const entry = {};
      headerRow.forEach((header, index) => {
        entry[header] = (cells[index] || "").trim();
      });
      return entry;
    });
  }

  function safeNumber(value) {
    if (!value) {
      return null;
    }
    const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }

  function parsePseudoList(value) {
    if (!value) {
      return [];
    }
    const cleaned = value.replace(/^\[|\]$/g, "").trim();
    if (!cleaned) {
      return [];
    }
    return cleaned
      .split(/,(?=(?:[^']*'[^']*')*[^']*$)/)
      .map((item) => item.replace(/^'+|'+$/g, "").replace(/^"+|"+$/g, "").trim())
      .filter(Boolean);
  }

  function parseMapDetails(rawValue) {
    if (!rawValue) {
      return { latitude: null, longitude: null };
    }
    const latitudeMatch = rawValue.match(/LATITUDE':\s*'([^']+)'|LATITUDE':\s*([^,}]+)/);
    const longitudeMatch = rawValue.match(/LONGITUDE':\s*'([^']+)'|LONGITUDE':\s*([^,}]+)/);

    return {
      latitude: safeNumber(latitudeMatch?.[1] || latitudeMatch?.[2]),
      longitude: safeNumber(longitudeMatch?.[1] || longitudeMatch?.[2])
    };
  }

  function formatCurrency(value, mode) {
    const formatted = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(Math.max(0, value || 0));
    return mode === "Rent" ? `${formatted}/month` : formatted;
  }

  function getGrowthPercentage(current, past) {
    if (!current || !past) {
      return "0.0";
    }
    return (((current - past) / past) * 100).toFixed(1);
  }

  function buildMapUrl(property, fallbackLocation) {
    const target =
      property && property.latitude && property.longitude
        ? `${property.latitude},${property.longitude}`
        : encodeURIComponent(property?.address || fallbackLocation || "India");

    if (GOOGLE_MAPS_API_KEY) {
      return `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${target}`;
    }

    return `https://maps.google.com/maps?q=${target}&z=14&output=embed`;
  }

  return {
    buildMapUrl,
    formatCurrency,
    getGrowthPercentage,
    parseCsv,
    parseMapDetails,
    parsePseudoList,
    safeNumber
  };
})();
