# LandScope Starter Project

This is a real-estate app built with plain HTML, CSS, and JavaScript so you can run it without installing React or extra packages.

## Features included

- "Enter Your Location" landing UI
- Map view for the selected place/property
- Properties for sale and rent loaded from CSV datasets
- Property detail section with:
  - description
  - location
  - current price
  - estimated past price
  - market signal examples such as highway or metro growth impact
- Customer and owner chat UI with saved messages per property
- Construction cost estimator

## Quick start

1. Open this folder in VS Code
2. Open [index.html](./index.html) in your browser

If you want a local server:

1. Open the VS Code terminal
2. Run:

```bash
npx serve .
```

3. Open the local URL shown in the terminal

## Datasets

The app now reads:

- `data/gurgaon_10k.csv`
- `data/hyderabad.csv`
- `data/kolkata.csv`
- `data/mumbai.csv`

## Google Maps API key

This project works even without an API key by using a normal Google Maps embed URL.

If you want to use an official API key:

1. Open `scripts/utils.js`
2. Find `const GOOGLE_MAPS_API_KEY = "";`
3. Paste your key inside the quotes
4. Save and refresh the page

## Future backend ideas

- Firebase or Supabase for login, chat, and property storage
- PostgreSQL or MongoDB for listings and past sale history
- Socket.io or Firebase Realtime Database for live chat
- Google Places API for autocomplete
- Real property data APIs or government/open-data feeds for infrastructure signals
