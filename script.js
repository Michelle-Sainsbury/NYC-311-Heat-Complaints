const API_ENDPOINT = "https://data.cityofnewyork.us/resource/erm2-nwe9.json";
const BOROUGH_GEOJSON_URL =
  "https://data.cityofnewyork.us/api/v3/views/gthc-hcne/query.geojson?accessType=DOWNLOAD";
const today = new Date();
const CURRENT_YEAR = today.getFullYear();

const START_DATE = `${CURRENT_YEAR}-01-01T00:00:00.000`;

const END_DATE =
  `${CURRENT_YEAR}-` +
  `${String(today.getMonth() + 1).padStart(2, "0")}-` +
  `${String(today.getDate()).padStart(2, "0")}T23:59:59.999`;

const boroughOrder = [
  "BRONX",
  "BROOKLYN",
  "MANHATTAN",
  "QUEENS",
  "STATEN ISLAND"
];

const statusMessage = document.getElementById("status");
const dateRange = document.getElementById("date-range");
const refreshButton = document.getElementById("refresh-button");
const insightText = document.querySelector(".insight");
const mapContainer = document.getElementById("borough-map");
const mapTitle = document.getElementById("map-title");
const mapSubtitle = document.getElementById("map-subtitle");
const chartTitle = document.getElementById("chart-title");
const chartCanvas = document.getElementById("complaints-chart");
const mapCard = mapContainer.closest(".map-card");
const chartCard = chartCanvas.closest(".chart-card");
const boroughSelect = document.getElementById("borough-select");
const zipCodeInput = document.getElementById("zip-code");
const complaintFilter = document.getElementById("complaint-filter");
const applyFiltersButton = document.getElementById("apply-filters");
let complaintsChart = null;
let boroughGeoData = null;
function formatNumber(number) {
  return new Intl.NumberFormat("en-US").format(number);
}
  async function renderBoroughMap(chartData, selectedZip = "") {
  
  
  try {
    if (!boroughGeoData) {
      boroughGeoData = await d3.json(BOROUGH_GEOJSON_URL);
    }
 mapContainer.innerHTML = "";   
    const width = Math.max(mapContainer.clientWidth || 800, 320);
    const height = Math.max(380, Math.min(560, width * 0.62));
    
    const svg = d3
      .select(mapContainer)
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("role", "img")
      .attr("aria-label", "NYC borough map showing complaint totals");
    
    const projection = d3
      .geoMercator()
      .fitExtent(
        [
          [25, 25],
          [width - 25, height - 25]
        ],
        boroughGeoData
      );
    
    const path = d3.geoPath(projection);
    
    const complaintCounts = Object.fromEntries(
      chartData.map((item) => [
        item.borough,
        Number(item.count) || 0
      ])
    );
    
    const boroughColors = {
      BRONX: "#e57a00",
      BROOKLYN: "#2474d8",
      MANHATTAN: "#63a944",
      QUEENS: "#7942c6",
      "STATEN ISLAND": "#d84343"
    };
    
    const selectedBorough =
      boroughSelect.value ||
      (selectedZip ?
        chartData.find((item) => Number(item.count) > 0)?.borough || "" :
        "");
    
    const getBoroughName = (feature) =>
      (
        feature.properties.boroname ||
        feature.properties.BoroName ||
        ""
      ).toUpperCase();
    
    svg
      .selectAll("path")
      .data(boroughGeoData.features)
      .join("path")
      .attr("d", path)
      .attr("fill", (feature) => {
        const borough = getBoroughName(feature);
        return boroughColors[borough] || "#777";
      })
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2)
      .attr("opacity", (feature) => {
        const borough = getBoroughName(feature);
        
        if (!selectedBorough) {
          return 1;
        }
        
        return borough === selectedBorough ? 1 : 0.28;
      });
    
    const labels = svg
      .selectAll(".borough-label")
      .data(boroughGeoData.features)
      .join("g")
      .attr("class", "borough-label")
      .attr("transform", (feature) => {
        const [x, y] = path.centroid(feature);
        return `translate(${x}, ${y})`;
      });
    
    labels
      .append("text")
      .attr("text-anchor", "middle")
      .attr("y", -5)
      .attr("font-size", 15)
      .attr("font-weight", 700)
      .attr("fill", "#ffffff")
      .attr("stroke", "#183044")
      .attr("stroke-width", 3)
      .attr("paint-order", "stroke")
.text((feature) => {
  const borough = getBoroughName(feature);
  return formatBoroughName(borough);
});

    
    labels
      .append("text")
      .attr("text-anchor", "middle")
      .attr("y", 16)
      .attr("font-size", 16)
      .attr("font-weight", 800)
      .attr("fill", "#ffffff")
      .attr("stroke", "#183044")
      .attr("stroke-width", 3)
      .attr("paint-order", "stroke")
  
.text((feature) => {
  const borough = getBoroughName(feature);
  
  if (selectedBorough && borough !== selectedBorough) {
    return "";
  }
  
  return formatNumber(complaintCounts[borough] || 0);
});    
    if (selectedZip) {
      mapTitle.textContent = `Complaints — ZIP ${selectedZip}`;
      mapSubtitle.textContent =
        "Complaint total shown within the ZIP code's borough.";
    } else if (boroughSelect.value) {
      mapTitle.textContent =
        `${formatBoroughName(boroughSelect.value)} Complaints`;
      mapSubtitle.textContent =
        "Selected borough complaint total.";
    } else {
      mapTitle.textContent =
        "NYC Heat & Hot Water Complaints";
      mapSubtitle.textContent =
        "Complaint totals by borough.";
    }
  } catch (error) {
    console.error("Borough map could not be loaded:", error);
    
    mapContainer.innerHTML =
      "<p>The NYC borough map could not be loaded right now.</p>";
  }
}
  


function createQueryUrl(selectedBorough = "", selectedZip = "", selectedComplaint = "all") {
  let complaintDetailFilter = "";

if (selectedComplaint === "heat") {
  complaintDetailFilter = " AND descriptor_2 = 'NO HEAT'";
} else if (selectedComplaint === "hot-water") {
  complaintDetailFilter = " AND descriptor_2 = 'NO HOT WATER'";
} else if (selectedComplaint === "both") {
  complaintDetailFilter = " AND descriptor_2 = 'NO HEAT AND NO HOT WATER'";
}
  const query = new URLSearchParams({
    "$select": "borough, count(*) AS complaint_count",
    "$where":
      `complaint_type = 'HEAT/HOT WATER' ` +
      `AND created_date BETWEEN '${START_DATE}' AND '${END_DATE}' ` +
      `AND borough IS NOT NULL`+
      (selectedBorough ? ` AND borough = '${selectedBorough}'` : "") +
(selectedZip ? ` AND incident_zip = '${selectedZip}'` : "") +
complaintDetailFilter ,
    "$group": "borough",
    "$order": "complaint_count DESC"
  });

  return `${API_ENDPOINT}?${query.toString()}`;
}

async function loadComplaintData() {
  refreshButton.disabled = true;
  statusMessage.textContent = "Loading live NYC 311 data...";
const selectedBoroughForLoad = boroughSelect.value;
const selectedZipForLoad = zipCodeInput.value.trim();
const selectedComplaintForLoad = complaintFilter.value;
if (selectedZipForLoad) {


  mapCard.style.display = "none";
  chartCard.style.display = "";
  chartCanvas.style.display = "none";
  if (complaintsChart) {
    complaintsChart.destroy();
    complaintsChart = null;
  }
  chartTitle.textContent = `ZIP ${selectedZipForLoad} Complaint Breakdown`;
  
} else {
  chartCard.style.display = "none";
  mapCard.style.display = "";
}
  dateRange.textContent =
  `January 1, ${CURRENT_YEAR} through ${today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  })}`;

  try {
    const response = await fetch(
  createQueryUrl(
 selectedBoroughForLoad,
selectedZipForLoad,
selectedComplaintForLoad
)
);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const apiData = await response.json();
if (apiData.length === 0) {
  const selectedBorough = boroughSelect.value;
  
  statusMessage.textContent = selectedBorough ?
    `No heat and hot water complaints were found for ${formatBoroughName(selectedBorough)} during the selected time period.` :
    "No heat and hot water complaint data was found for the selected time period.";
  
  insightText.textContent = "No complaint data is available for this selection.";
  
  if (complaintsChart) {
    complaintsChart.destroy();
    complaintsChart = null;
  }
  
  return;
}
    const complaintCounts = Object.fromEntries(
      boroughOrder.map((borough) => [borough, 0])
    );

    apiData.forEach((record) => {
      const borough = record.borough?.toUpperCase();

      if (borough in complaintCounts) {
        complaintCounts[borough] = Number(record.complaint_count);
      }
    });

    const chartData = selectedBoroughForLoad
  ? [
      {
        borough: selectedBoroughForLoad,
        count: complaintCounts[selectedBoroughForLoad]
      }
    ]
  : boroughOrder.map((borough) => ({
      borough,
      count: complaintCounts[borough]
    }));

    const highestBorough = [...chartData].sort(
      (first, second) => second.count - first.count
    )[0];

const selectedZip = selectedZipForLoad;

const complaintLabels = {
  all: "heat and hot water",
  heat: "heat-only",
  "hot-water": "hot-water-only",
  both: "no heat and no hot water"
};

const selectedComplaintLabel =
  complaintLabels[selectedComplaintForLoad] || "heat and hot water";

const periodText =
  `January 1, ${CURRENT_YEAR} through ${today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  })}`;

if (selectedZip) {
  insightText.textContent =
    `ZIP code ${selectedZip} recorded ${formatNumber(highestBorough.count)} ` +
    `${selectedComplaintLabel} complaints from ${periodText}.`;
} else if (boroughSelect.value) {
  insightText.textContent =
    `${formatBoroughName(highestBorough.borough)} recorded ` +
    `${formatNumber(highestBorough.count)} ${selectedComplaintLabel} complaints ` +
    `from ${periodText}.`;
} else {
  insightText.textContent =
    `The ${formatBoroughName(highestBorough.borough)} had the highest number ` +
    `of ${selectedComplaintLabel} complaints among all five NYC boroughs ` +
    `from ${periodText}, with ${formatNumber(highestBorough.count)} complaints.`;
}
    
const selectedZipForView = selectedZipForLoad;

if (selectedZipForView) {
  mapCard.style.display = "none";
  chartCard.style.display = "";
  
  await renderZipChart(
  selectedZipForView,
  selectedComplaintForLoad,
  chartData
);
} else {
  chartCard.style.display = "none";
  mapCard.style.display = "";
  
  await renderBoroughMap(chartData);
}

statusMessage.textContent =
  `Live data loaded successfully. Last refreshed: ${new Date().toLocaleTimeString()}`;
    
  } catch (error) {
    console.error(error);

    statusMessage.textContent =
      "The live NYC 311 data could not be loaded. Check your internet connection and try again.";
  } finally {
    refreshButton.disabled = false;
  }
}

function formatBoroughName(borough) {
  return borough
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
async function getZipBreakdown(selectedZip) {
  const query = new URLSearchParams({
    "$select": "descriptor_2, count(*) AS complaint_count",
    "$where":
      `complaint_type = 'HEAT/HOT WATER' ` +
      `AND created_date BETWEEN '${START_DATE}' AND '${END_DATE}' ` +
      `AND incident_zip = '${selectedZip}' ` +
      `AND descriptor_2 IS NOT NULL`,
    "$group": "descriptor_2"
  });

  const response = await fetch(
    `${API_ENDPOINT}?${query.toString()}`
  );

  if (!response.ok) {
    throw new Error("ZIP complaint breakdown could not be loaded.");
  }

  const data = await response.json();

  const counts = {
    "NO HEAT": 0,
    "NO HOT WATER": 0,
    "NO HEAT AND NO HOT WATER": 0
  };

  data.forEach((item) => {
    if (Object.prototype.hasOwnProperty.call(counts, item.descriptor_2)) {
      counts[item.descriptor_2] = Number(item.complaint_count || 0);
    }
  });

  return [
    {
      label: "Heat Only",
      count: counts["NO HEAT"]
    },
    {
      label: "Hot Water Only",
      count: counts["NO HOT WATER"]
    },
    {
      label: "No Heat & No Hot Water",
      count: counts["NO HEAT AND NO HOT WATER"]
    }
  ];
}
async function renderZipChart(
  selectedZip,
  selectedComplaint = "all",
  chartData = []
) {
  const complaintLabels = {
    heat: "Heat Only",
    "hot-water": "Hot Water Only",
    both: "No Heat & No Hot Water"
  };

  let breakdown = [];

  if (selectedComplaint === "all") {
    breakdown = await getZipBreakdown(selectedZip);

    const totalComplaints = chartData.reduce(
      (sum, item) => sum + Number(item.count || 0),
      0
    );

    const categorizedTotal = breakdown.reduce(
      (sum, item) => sum + Number(item.count || 0),
      0
    );

    const otherCount = Math.max(
      totalComplaints - categorizedTotal,
      0
    );

    if (otherCount > 0) {
      breakdown.push({
        label: "Other / Unspecified",
        count: otherCount
      });
    }

    chartTitle.textContent =
      `ZIP ${selectedZip} Complaint Breakdown`;
  } else {
    const filteredCount = chartData.reduce(
      (sum, item) => sum + Number(item.count || 0),
      0
    );

    breakdown = [
      {
        label: complaintLabels[selectedComplaint],
        count: filteredCount
      }
    ];

    chartTitle.textContent =
      `ZIP ${selectedZip} — ${complaintLabels[selectedComplaint]}`;
  }

  if (complaintsChart) {
    complaintsChart.destroy();
  }
chartCanvas.style.display = "block";
  complaintsChart = new Chart(chartCanvas, {
    type: "bar",

    data: {
      labels: breakdown.map((item) => item.label),

      datasets: [
        {
          label: "Complaints",
          data: breakdown.map((item) => item.count),
          backgroundColor: [
            "#d97706",
            "#3b82a0",
            "#7c3aed",
            "#64748b"
          ],
          borderRadius: 7,
          borderSkipped: false
        }
      ]
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: {
          display: false
        },

        tooltip: {
          callbacks: {
            label(context) {
              return `${formatNumber(context.raw)} complaints`;
            }
          }
        }
      },

      scales: {
        x: {
          title: {
            display: true,
            text: "Complaint Type"
          },

          grid: {
            display: false
          }
        },

        y: {
          beginAtZero: true,

          title: {
            display: true,
            text: "Number of Complaints"
          },

          ticks: {
            callback(value) {
              return formatNumber(value);
            }
          }
        }
      }
    }
  });
}

function renderChart(chartData, highestBorough) {
  const labels = chartData.map((item) =>
    formatBoroughName(item.borough)
  );

  const values = chartData.map((item) => item.count);

  const barColors = chartData.map((item) =>
    item.borough === highestBorough
      ? "#d97706"
      : "#3b82a0"
  );

  if (complaintsChart) {
    complaintsChart.destroy();
  }

  complaintsChart = new Chart(chartCanvas, {
    type: "bar",

    data: {
      labels,

      datasets: [
        {
          label: "Heat and hot water complaints",
          data: values,
          backgroundColor: barColors,
          borderRadius: 7,
          borderSkipped: false
        }
      ]
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: {
          display: false
        },

        tooltip: {
          callbacks: {
            label(context) {
              return `${formatNumber(context.raw)} complaints`;
            }
          }
        }
      },

      scales: {
        x: {
          title: {
            display: true,
            text: "NYC Borough"
          },

          grid: {
            display: false
          }
        },

        y: {
          beginAtZero: true,

          title: {
            display: true,
            text: "Number of Complaints"
          },

          ticks: {
            callback(value) {
              return formatNumber(value);
            }
          }
        }
      }
    }
  });
}

refreshButton.addEventListener("click", loadComplaintData);

applyFiltersButton.addEventListener("click", loadComplaintData);
loadComplaintData();