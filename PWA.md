# Progressive Web App (PWA) Implementation

This document provides an overview of the PWA features that have been added to the project.

## What Was Added

1.  **Web App Manifest** (`app.json`):
    - The project's `app.json` was updated to include all necessary properties for the PWA manifest, such as `short_name`, `display: 'standalone'`, `start_url`, `scope`, and icon references.

2.  **App Icons** (`/public/icons/`):
    - Placeholder icons for various sizes (192x192, 512x512) and a maskable icon have been added to the `/public/icons/` directory. These are used for the home screen icon when the app is installed.

3.  **Service Worker** (`/public/sw.js`):
    - A custom service worker has been added to provide basic offline support. It caches the main application shell (`index.html`, manifest, icons), allowing the app to load even without a network connection.

4.  **Install Prompt UI** (`src/components/pwa/InstallPrompt.tsx`):
    - A new component has been added that provides a user-friendly prompt to install the app. It automatically appears on compatible browsers (like Chrome on Android) and provides instructions for iOS users.

5.  **iOS Meta Tags** (`app.json`):
    - Specific meta tags have been added to ensure a better 'add to home screen' experience on iOS, including `apple-mobile-web-app-capable` and `apple-touch-icon`.

## How to Test Locally

To test the PWA features, you can use the live deployment URL:
[https://pcdcmobileapp-git-main-cobyyangs-projects.vercel.app](https://pcdcmobileapp-git-main-cobyyangs-projects.vercel.app)

Alternatively, you can run a production build of the web app locally, as service workers are typically disabled in development mode for easier debugging.

1.  **Build the project for web production:**
    ```bash
    npx expo export:web
    ```
2.  **Serve the output directory:**
    The command above will create a `dist` directory. You need to serve this directory with a local HTTP server.
    ```bash
    npx serve dist
    ```
3.  **Open in your browser:**
    Navigate to the local server address provided by `serve` (e.g., `http://localhost:3000`).

## How to Verify Installability

You can use Google Chrome's built-in developer tools to verify that the app is installable.

1.  Open your deployed web app in Chrome.
2.  Open **DevTools** (F12 or Ctrl+Shift+I).
3.  Go to the **Application** tab.
4.  In the left-hand menu, select **Manifest**. You should see all the details from your `app.json` (name, icons, start URL, etc.).
5.  Select **Service Workers**. You should see your `sw.js` file listed with a status of "activated and running".
6.  If all checks pass, the Manifest section will show a link that says **"Installability: Installable"**. You should also see an install icon in the URL bar.

## How to Install

### Android (Chrome)

- After opening the web app in Chrome, an "Install App" banner or button (our custom component) should appear at the bottom of the screen. Tap it to install.
- Alternatively, you can tap the three-dot menu in the top right of Chrome and select "Install app".

### iOS (Safari)

iOS does not support the same automatic install prompts as Android. Users must add the app to their home screen manually.

1.  Open the web app in **Safari**.
2.  Tap the **Share** button in the bottom navigation bar.
3.  Scroll down and tap **"Add to Home Screen"**.
4.  Confirm the name and tap **"Add"**.

## Troubleshooting

- **Install prompt doesn't appear:** Ensure you are serving the app over HTTPS (Vercel does this automatically) and that the service worker is registered and running correctly. Clear your browser cache and try again.
- **App is not working offline:** Check the Service Worker console in DevTools for any errors during the `install` phase. Make sure all the paths in the `urlsToCache` array in `sw.js` are correct.
- **Icons look wrong:** The current icons are placeholders. Replace the files in `/public/icons/` with your actual app icons to fix this.
