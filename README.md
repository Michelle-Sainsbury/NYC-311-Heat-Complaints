# NYC 311 Heat & Hot Water Complaints

An interactive NYC housing-data application that uses live NYC 311 service-request data to explore heat and hot water complaint patterns across New York City.

## Project Overview

The NYC 311 Heat & Hot Water Complaints app provides a live, year-to-date view of heat and hot water complaints reported through NYC 311.

Users can explore complaint activity at two geographic levels:

- Borough-level analysis displayed on an interactive NYC borough map
- ZIP-code analysis displayed as a complaint-type breakdown chart

The application retrieves current data directly from the NYC Open Data API whenever the page loads or the user applies a new filter.

## Key Features

- Live NYC 311 data
- Automatic year-to-date reporting period
- Interactive map of all five NYC boroughs
- Borough selector with selected-borough highlighting
- ZIP-code complaint analysis
- Complaint-type filters:
  - All Heat & Hot Water
  - Heat Only
  - Hot Water Only
  - No Heat & No Hot Water
- ZIP-code breakdown chart showing complaint categories
- Dynamic Key Insight based on the selected geography and complaint type
- Manual Refresh Live Data option
- Responsive dark-theme interface

## How to Use

Select a borough to view complaint totals on the NYC map, or enter a ZIP code for a more localized analysis.

Use the complaint-type filter to explore Heat, Hot Water, combined, or related complaint categories.

## Intended Audience

The application is designed for:

- Tenants
- Housing advocates
- Attorneys
- Landlords and property managers
- Funders
- Policymakers
- Contractors and service businesses
- Other housing and community-development professionals

Complaint patterns can help users identify where heat and hot water problems are concentrated and where further investigation, advocacy, resources, repair, or maintenance activity may be warranted.

## Data Source

NYC Open Data  
311 Service Requests from 2010 to Present

Dataset ID: `erm2-nwe9`

The application requests data live from the NYC Open Data API.

## Technologies

- HTML
- CSS
- JavaScript
- NYC Open Data API
- D3.js
- Chart.js
- GeoJSON

## Project Files

- `index.html` — webpage structure and user interface
- `style.css` — page styling and dark-theme presentation
- `script.js` — API requests, filtering, map rendering, chart rendering, and application logic

## Live Application

https://nyc-311-heat-complaints-a2wbky8m8-michelle-sainsbury1.vercel.app

## Project Purpose

Created as part of the Pursuit Native AI Builder Program's data-driven product work.

The project demonstrates how public data can be transformed into an interactive tool that supports housing analysis, localized investigation, advocacy, program planning, and service-delivery decision-making.