# 🌱 NomaApp AI

**NomaApp AI** is an AI-powered mobile application built to help smallholder farmers in Africa detect crop diseases and pest infestations in real time. By using machine learning and computer vision, the app empowers farmers with fast, accessible, and accurate crop diagnostics — even in remote, low-connectivity areas.

---

## 🌍 Why NomaApp?

Agricultural productivity in many African regions is challenged by delayed or incorrect pest and disease detection. Smallholder farmers, who make up the majority of the agricultural workforce, often lack access to timely expert support.

**NomaApp AI** addresses this gap by providing:
- 📷 Instant image-based diagnosis of plant diseases and pests
- 🌽 Tailored treatment advice for local crops
- 🌐 Offline functionality for rural areas with poor internet access
- 🔄 Continuous improvement using farmer-submitted images and feedback

---

## 🚀 Features

- 🤖 **AI-powered detection**: Uses a custom-trained machine learning model to identify diseases and pests from leaf images.
- 📸 **Photo-based input**: Diagnose issues using the phone's camera or image gallery.
- 📡 **Offline-first**: Works with limited or no internet by deploying lightweight models on-device.
- 🗣️ **Multilingual support**: Designed with future support for local African languages.
- 🧑🏾‍🌾 **Farmer-friendly**: Simple UI, clear advice, and low data consumption.

---

## 🧠 Tech Stack

| Component           | Technology                     |
|---------------------|--------------------------------|
| **Mobile App**      | React Native, Tailwind, Figma                   
| **Backend**         | Node.js, Express.js, Supabase  
| **ML Framework**    | TensorFlow / TensorFlow lite, PyTorch, Python, FastAPI (for model inference)
| **Model Type**      | CNN for image classification   
| **APIs**            | Google Maps, WeatherStack, Market APIs                        
| **Data Storage**    | MongoDB, Watermelon DB                        
| **Offline Storage** | SQLite, RealmDB, LocalStorage  
| **Voice**           | Google Speech, Mozilla TTS, custom language models
| **Deployment**      | Google Cloud, On-device        



## 📁 Project Structure

nomaapp-ai/
├── README.md
├── LICENSE
├── .gitignore
├── docs/
│   └── development_plan.md
├── frontend/
│   ├── mobile-app/
│   │   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── screens/
│   │   └── App.js
│   └── web-dashboard/
│       ├── src/
│       ├── public/
│       ├── components/
│       ├── pages/
│       └── index.js
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── server.js
│   └── config/
│       ├── db.js
│       └── env/
├── ai-models/
│   ├── training-data/
│   ├── notebooks/
│   ├── models/
│   └── inference-api/
│       └── predict.py
├── data/
│   ├── cache/
│   └── mock/
├── gps-mapping/
│   ├── maps/
│   ├── api/
│   └── geolocation-utils.js
├── marketplace/
│   ├── shop/
│   ├── payments/
│   ├── vendors/
│   └── insurance/
├── voice-support/
│   ├── hausa/
│   ├── yoruba/
│   ├── igbo/
│   └── utils/
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/




---

## 📄 License

This project is licensed under the **Apache License**. See the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

We welcome contributors who are passionate about agriculture, AI, and social impact.

To get started:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature-name`)
3. Commit your changes
4. Push to the branch (`git push origin feature/your-feature-name`)
5. Open a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) *(coming soon)* for full guidelines.

---

🙌 Support or Partner?
If you're an agritech investor, NGO, or tech enthusiast looking to support or collaborate, open an issue or reach out via email.


## 📬 Contact

Interested in contributing, collaborating, or learning more?

- Email: **yusufiabichi@yahoo.com**
- Website: [www.nomaapp.com.ng](http://www.nomaapp.com.ng)

---

> NomaApp AI is committed to supporting African farmers through innovative, accessible technology. Let's grow better — together. 🌾
