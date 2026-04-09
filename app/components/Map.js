'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import centroid from '@turf/centroid';
import turfDistance from '@turf/distance';
import turfDestination from '@turf/destination';

// Fix default marker icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function getGridCellColor(score) {
  // score 0-1: 0 = red (bad), 1 = green (good)
  if (score >= 0.66) return '#10b981'; // green
  if (score >= 0.33) return '#f59e0b'; // amber
  return '#ef4444'; // red
}

export default function Map({ lat, lon, competitors, population, medianIncome, industry = 'dental' }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current).setView([lat, lon], 12);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // User location marker (blue)
    const userIcon = L.divIcon({
      className: 'user-marker',
      html: `<div style="
        width: 20px; height: 20px;
        background: #3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
    L.marker([lat, lon], { icon: userIcon })
      .addTo(map)
      .bindPopup('<b>Selected Location</b>');

    // Competitor markers — industry-specific icon
    const toothSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="22" height="22"><path d="M16 2C12.5 2 10 3.5 8.5 5.5C7 7.5 6.5 10 7 12.5C7.5 15 8.5 17 9 19C9.5 21 9.5 23 10 25C10.5 27 11 29 12.5 29C14 29 14.5 27 14.5 25C14.5 23 15 21 16 21C17 21 17.5 23 17.5 25C17.5 27 18 29 19.5 29C21 29 21.5 27 22 25C22.5 23 22.5 21 23 19C23.5 17 24.5 15 25 12.5C25.5 10 25 7.5 23.5 5.5C22 3.5 19.5 2 16 2Z" fill="white" stroke="#ef4444" stroke-width="2"/></svg>`;
    const cocktailSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="22" height="22"><path d="M7 5h18l-9 13v7" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 27h10" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"/><path d="M9 9h14" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>`;
    const markerSvg = industry === 'bars' ? cocktailSvg : toothSvg;

    const compIcon = L.divIcon({
      className: 'comp-marker',
      html: `<div style="
        display: flex; align-items: center; justify-content: center;
        width: 30px; height: 30px;
        background: #ef4444;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      ">${markerSvg}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    competitors.forEach((comp) => {
      const dist = turfDistance([lon, lat], [comp.lon, comp.lat], { units: 'miles' }).toFixed(1);
      const googleUrl = comp.googlePlaceId
        ? `https://www.google.com/maps/place/?q=place_id:${comp.googlePlaceId}`
        : `https://www.google.com/maps/search/${encodeURIComponent(comp.name)}/@${comp.lat},${comp.lon},17z`;
      const ratingLine = comp.rating != null
        ? `<div style="margin:4px 0"><span style="color:#f59e0b">★</span> <b>${comp.rating}</b> <a href="${googleUrl}" target="_blank" rel="noopener" style="color:#94a3b8;font-size:11px;text-decoration:underline">${comp.reviewCount} reviews</a></div>`
        : '';
      const addressLine = comp.address ? `<div style="color:#64748b;font-size:12px">${comp.address}</div>` : '';
      const phoneLine = comp.phone ? `<div style="color:#64748b;font-size:12px">${comp.phone}</div>` : '';
      const distLine = `<div style="color:#64748b;font-size:11px;margin-top:4px">${dist} mi from search point</div>`;

      L.marker([comp.lat, comp.lon], { icon: compIcon })
        .addTo(map)
        .bindPopup(`<div style="min-width:180px"><b style="font-size:13px">${comp.name}</b>${ratingLine}${addressLine}${phoneLine}${distLine}</div>`);
    });

    // Turf.js grid overlay — 5mi x 5mi square (2.5mi in each direction)
    // Build grid in degrees so cells render as visual squares on the Mercator map
    const center = [lon, lat];
    const halfSideMiles = 2.5;
    const gridCount = 10; // 10x10 grid

    // Calculate bbox using destination points for accurate mile-to-degree conversion
    const north = turfDestination(center, halfSideMiles, 0, { units: 'miles' });
    const south = turfDestination(center, halfSideMiles, 180, { units: 'miles' });
    const east = turfDestination(center, halfSideMiles, 90, { units: 'miles' });
    const west = turfDestination(center, halfSideMiles, 270, { units: 'miles' });

    const minLon = west.geometry.coordinates[0];
    const maxLon = east.geometry.coordinates[0];
    const minLat = south.geometry.coordinates[1];
    const maxLat = north.geometry.coordinates[1];

    // Build grid manually as 10x10 equal-degree cells (renders as squares on map)
    const lonStep = (maxLon - minLon) / gridCount;
    const latStep = (maxLat - minLat) / gridCount;

    const gridFeatures = [];
    for (let row = 0; row < gridCount; row++) {
      for (let col = 0; col < gridCount; col++) {
        const cellMinLon = minLon + col * lonStep;
        const cellMinLat = minLat + row * latStep;
        const cellMaxLon = cellMinLon + lonStep;
        const cellMaxLat = cellMinLat + latStep;

        gridFeatures.push({
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [cellMinLon, cellMinLat],
              [cellMaxLon, cellMinLat],
              [cellMaxLon, cellMaxLat],
              [cellMinLon, cellMaxLat],
              [cellMinLon, cellMinLat],
            ]],
          },
        });
      }
    }
    const grid = { type: 'FeatureCollection', features: gridFeatures };

    // Calculate demographic baseline multiplier (0-1, same for all cells)
    const popNorm = Math.min(1, (population || 3000) / 5000);
    const incNorm = Math.min(1, (medianIncome || 55000) / 75000);
    const demoBaseline = (popNorm + incNorm) / 2;

    // Score each cell and add to map
    const competitorPoints = competitors.map((c) => [c.lon, c.lat]);

    // Find nearby competitor names per cell (for tooltips)
    grid.features.forEach((cell) => {
      const cellCentroid = centroid(cell);
      const centroidCoords = cellCentroid.geometry.coordinates;

      // Calculate distances to all competitors
      const compDistances = competitorPoints.map((cp, i) => ({
        distance: turfDistance(cellCentroid, cp, { units: 'miles' }),
        name: competitors[i]?.name || 'Dental Practice',
      }));
      compDistances.sort((a, b) => a.distance - b.distance);

      const minDist = compDistances.length > 0 ? compDistances[0].distance : Infinity;
      const nearbyComps = compDistances.filter((c) => c.distance <= 2.5);

      // If no competitors, max score
      const compFactor = competitors.length === 0 ? 1 : Math.min(1, minDist / 1.5);

      // Combined cell score
      const cellScore = compFactor * demoBaseline;

      // Distance from center
      const distFromCenter = turfDistance(center, centroidCoords, { units: 'miles' });

      // Build tooltip content
      const color = getGridCellColor(cellScore);
      const scorePercent = Math.round(cellScore * 100);
      const tierLabel = cellScore >= 0.66 ? 'Strong Expansion Target' : cellScore >= 0.33 ? 'Conditional Opportunity' : 'High Risk Location';
      const tierColor = cellScore >= 0.66 ? '#10b981' : cellScore >= 0.33 ? '#f59e0b' : '#ef4444';

      let tooltipHtml = `<div style="font-size:12px;line-height:1.5;min-width:160px">`;
      tooltipHtml += `<div style="font-weight:700;color:${tierColor};margin-bottom:4px">${tierLabel}</div>`;
      tooltipHtml += `<div style="color:#64748b;font-size:11px;margin-bottom:6px">${distFromCenter.toFixed(1)} mi from search point</div>`;

      if (nearbyComps.length === 0) {
        tooltipHtml += `<div style="color:#10b981;font-size:11px">No competitors nearby</div>`;
      } else {
        tooltipHtml += `<div style="font-size:11px;color:#1e293b;font-weight:600;margin-bottom:2px">${nearbyComps.length} competitor${nearbyComps.length > 1 ? 's' : ''} nearby:</div>`;
        nearbyComps.slice(0, 3).forEach((c) => {
          tooltipHtml += `<div style="font-size:11px;color:#64748b;padding-left:4px">${industry === 'bars' ? '🍸' : '🦷'} ${c.name} (${c.distance.toFixed(1)}mi)</div>`;
        });
        if (nearbyComps.length > 3) {
          tooltipHtml += `<div style="font-size:11px;color:#94a3b8;padding-left:4px">+${nearbyComps.length - 3} more</div>`;
        }
      }

      if (minDist < 0.5 && competitors.length > 0) {
        tooltipHtml += `<div style="font-size:11px;color:#ef4444;margin-top:4px">⚠ Very close to competitor(s)</div>`;
      } else if (minDist >= 1.5 || competitors.length === 0) {
        tooltipHtml += `<div style="font-size:11px;color:#10b981;margin-top:4px">✓ Good distance from competitors</div>`;
      }

      tooltipHtml += `</div>`;

      const layer = L.geoJSON(cell, {
        style: {
          fillColor: color,
          fillOpacity: 0.35,
          weight: 1,
          color: '#94a3b8',
          opacity: 0.3,
        },
      }).addTo(map);

      layer.bindTooltip(tooltipHtml, {
        sticky: true,
        direction: 'top',
        offset: [0, -10],
        opacity: 0.95,
      });
    });

    // Draw analysis area square outline
    const squareOutline = [
      [maxLat, minLon],
      [maxLat, maxLon],
      [minLat, maxLon],
      [minLat, minLon],
    ];
    L.polygon(squareOutline, {
      color: '#3b82f6',
      weight: 2,
      fill: false,
      dashArray: '8, 4',
      opacity: 0.5,
    }).addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lon, competitors, population, medianIncome]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
}
