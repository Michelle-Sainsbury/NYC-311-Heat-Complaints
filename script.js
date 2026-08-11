const API_ENDPOINT = "https://data.cityofnewyork.us/resource/erm2-nwe9.json";

const START_DATE = "2023-01-01T00:00:00.000";
const END_DATE = "2025-12-31T23:59:59.999";

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
const chartCanvas = document.getElementById("complaints-chart");
const boroughSelect = document.getElementById("borough-select");
let complaintsChart = null;

function formatNumber(number) {
  return new Intl.NumberFormat("en-US").format(number);
}

function createQueryUrl(selectedBorough = "") {
  const query = new URLSearchParams({
    "$select": "borough, count(*) AS complaint_count",
    "$where":
      `complaint_type = 'HEAT/HOT WATER' ` +
      `AND created_date BETWEEN '${START_DATE}' AND '${END_DATE}' ` +
      `AND borough IS NOT NULL`+
      (selectedBorough ? ` AND borough = '${selectedBorough}'` : ""),
    "$group": "borough",
    "$order": "complaint_count DESC"
  });

  return `${API_ENDPOINT}?${query.toString()}`;
}

async function loadComplaintData() {
  refreshButton.disabled = true;
  statusMessage.textContent = "Loading live NYC 311 data...";

  dateRange.textContent =
    "January 1, 2023 through December 31, 2025";

  try {
    const response = await fetch(createQueryUrl(boroughSelect.value));

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

    const chartData = boroughSelect.value
  ? [
      {
        borough: boroughSelect.value,
        count: complaintCounts[boroughSelect.value]
      }
    ]
  : boroughOrder.map((borough) => ({
      borough,
      count: complaintCounts[borough]
    }));

    const highestBorough = [...chartData].sort(
      (first, second) => second.count - first.count
    )[0];

    if (boroughSelect.value) {
  insightText.textContent =
    `${formatBoroughName(highestBorough.borough)} recorded ${formatNumber(highestBorough.count)} ` +
    `heat and hot water complaints from January 1, 2023 through December 31, 2025.`;
} else {
  insightText.textContent =
    `The ${formatBoroughName(highestBorough.borough)} had the highest number ` +
    `of heat and hot water complaints among all five NYC boroughs from ` +
    `January 1, 2023 through December 31, 2025, with ${formatNumber(highestBorough.count)} complaints.`;
}

    renderChart(chartData, highestBorough.borough);

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
boroughSelect.addEventListener("change", loadComplaintData);
loadComplaintData();