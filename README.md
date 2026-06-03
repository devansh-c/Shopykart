# ShopyKart - Premium Food Delivery

This is the official NextJS source code for ShopyKart.

## 🚀 Domain Connection Instructions (Shopykart.co.in)

To finish connecting your domain, please follow these steps:

1. **Firebase Console**:
   - Go to [Firebase Hosting Dashboard](https://console.firebase.google.com/project/_/hosting/main).
   - Click **"Add custom domain"**.
   - Enter `shopykart.co.in`.

2. **DNS Verification**:
   - Firebase will provide a **TXT record**.
   - Log in to your domain registrar (e.g., GoDaddy, Hostinger).
   - Go to DNS Management and add the TXT record as shown in Firebase.

3. **Point to IP**:
   - Once verified, Firebase will provide two **A records**.
   - Add these A records to your DNS settings.
   - Wait for SSL propagation (usually takes 1-2 hours).

## 🛠 Project Structure
- `src/app`: App Router pages.
- `src/components`: UI and Business logic components.
- `src/ai`: Genkit flows for AI features.
- `src/firebase`: Real-time database and auth configuration.

## 📦 Deployment
Run `npm run static-build` to generate the `out/` folder for production.
