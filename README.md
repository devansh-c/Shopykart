# ShopyKart - Premium Food Delivery

Official NextJS source code for ShopyKart.

## 🚀 Domain Status (shopykart.co.in)

✅ **Hosting:** Connected via Firebase App Hosting.
✅ **Email Templates:** Domain verified for custom sender.
⚠️ **FINAL STEP REQUIRED:** 
   - Go to [Firebase Authentication Settings](https://console.firebase.google.com/project/_/authentication/settings).
   - Under **"Authorized domains"**, click **"Add domain"**.
   - Add `shopykart.co.in`.
   - *Reason:* Bina iske login flows (Google/Email) block ho sakte hain.

## 🛠 Project Structure
- `src/app`: App Router pages.
- `src/components`: UI and Business logic components.
- `src/ai`: Genkit flows (Smart Basket Removed).
- `src/firebase`: Real-time database and auth configuration.

## 📦 Deployment
Run `npm run build` or use the "Publish" button in Firebase Studio.
