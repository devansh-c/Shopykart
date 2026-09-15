# ShopyKart - Premium Gourmet Delivery

Official NextJS source code for ShopyKart.

## 🚀 Domain Status (shopykart.co.in)

✅ **Hosting:** Connected via Firebase App Hosting (Permanent Domain).
✅ **Email Templates:** Domain verified for custom sender.
✅ **SEO:** Configured for high visibility on Google.
⚠️ **FINAL STEP REQUIRED FOR PLAY STORE:** 
   1. Go to [Firebase Authentication Settings](https://console.firebase.google.com/project/_/authentication/settings).
   2. Under **"Authorized domains"**, click **"Add domain"**.
   3. Add `shopykart.co.in`.
   4. *Reason:* Bina iske Android app mein Google Login block ho sakta hai.

## 🛠 Project Structure
- `src/app`: App Router pages.
- `src/components`: UI and Business logic components.
- `src/ai`: Genkit flows (Optimized for Build).
- `src/firebase`: Real-time database and auth configuration.

## 📦 Deployment
Run `npm run build` or use the "Publish" button in Firebase Studio. Final APK will be in GitHub Actions artifacts.