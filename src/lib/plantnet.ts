/// <reference types="vite/client" />
/**
 * PlantNet API Integration
 * Documentation: https://my.plantnet.org/doc/openapi
 */

const API_KEY = import.meta.env.VITE_PLANTNET_API_KEY?.trim();
const API_URL = 'https://my-api.plantnet.org/v2/identify/all';

export interface PlantNetResult {
  score: number;
  species: {
    scientificNameWithoutAuthor: string;
    scientificName: string;
    genus: { scientificNameWithoutAuthor: string };
    family: { scientificNameWithoutAuthor: string };
    commonNames: string[];
  };
}

export const identifyPlant = async (base64Image: string): Promise<PlantNetResult | null> => {
  try {
    console.log('Attempting PlantNet identification via proxy...');
    
    const response = await fetch('/api/identify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,
        organs: 'auto'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PlantNet proxy failed:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    if (data.results && data.results.length > 0) {
      // Return the best match
      return data.results[0];
    }
    return null;
  } catch (error) {
    console.error('PlantNet identification failed:', error);
    return null;
  }
};
