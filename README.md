## 📦 INSTALL DEPENDENCIES

- `npm install firebase`
- `npm install react-router-dom`
- `npm install lucide-react`
- `npm install -D tailwindcss@3.4.1 postcss autoprefixer`
- `npm install react-qr-code`
- `npm install @tensorflow/tfjs`
- `npm install tesseract.js`
- `npm install jsqr`
- `npm install @vladmandic/face-api`
  - 🔗 [Repository](https://github.com/vladmandic/face-api/tree/master)
- `npm install dotenv`
- `npm install express body-parser cors twilio dotenv`
- `npm install node-fetch`
- `npm install -g firebase-tools`

---

### 🧹 Run ESLint (optional)
- `npm run lint`

---

## 🚀 RUN THE PROJECT

- `npm run dev`

---

## ⚙️ SAVE CORS CONFIGURATION

Save the following JSON into:

C:\Users\gabri\cors.json


```json
[
  {
    "origin": ["http://localhost:5173", "https://elderease.web.app"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "responseHeader": ["Content-Type", "x-goog-meta-*"],
    "maxAgeSeconds": 3600
  }
]