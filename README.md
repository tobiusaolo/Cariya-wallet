
# Cariya Wallet

**Cariya Wallet** is a milestone-based crowdfunding platform designed to connect individual donors directly to mothers in need of social security support for their children. This repository contains the core modules powering the Cariya Wallet system.

## 📦 Repository Structure

```
cariya-wallet/
│
├── Backend/        # FastAPI-based RESTful backend for API logic and data handling
└── cariyawalletapp/             # React-based frontend (incomplete sample)
```

---

## ✅ Project Status

- ✅ **Backend Module**: Implemented using FastAPI with complete core functionalities for:
  - Secure unique ID generation
  - Excel-based data processing and user matching
  - Savings and activity tracking logic
  - Donor contribution computation and updates
  - User segmentation based on milestone scores

- ⚠️ **Frontend UI Module**: Partially implemented React sample for Cariya Wallet.  
  > Due to time limitations, the Carriyawallet is not yet fully complete.

---

## 💡 Features

- **Secure User ID Generator**: Creates unique, consistent identifiers using name, phone, and child data.
- **Savings + Activity Scoring**: Tracks users’ savings (UGX 1,000 per child) and monthly activity participation.
- **Donor Matching Logic**: Donors match monthly savings for compliant users.
- **Dynamic Segmentation**: Classifies users into High, Moderate, or Low Compliance groups.
- **Extensible API**: Backend supports future integrations and real-time front-end updates.

---

## 🛠️ Tech Stack

- **Backend**: FastAPI (Python), Pydantic, Uvicorn
- **Frontend**: ReactJS (in-progress)
- **Database**: Firebase (configurable)
- **Excel Handling**: `pandas`, `openpyxl`
- **Security**: Input validation, UUIDs, consistent hashing

---

## 🚧 How to Run

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8080 --reload 
```

### Frontend (React) *(not fully functional)*
```bash
cd cariyawalletapp
npm install
npm start
```

---


## 📁 Open Source Strategy

Planned to open-source the following components:
- Backend logic for scoring, curated datasets savings partterns and donor-matching
- CLI utilities for batch processing
- Public API definitions (OpenAPI schema)

Sensitive components such as user databases and identifiers will remain private. Suggested license: **Apache 2.0**, for balance between permissiveness and contribution governance.

---

## 📌 Next Steps

- [ ] Complete the front-end UI to allow real-time interaction
- [ ] Integrate Firebase or PostgreSQL for production-grade DB
- [ ] Add real-time dashboard for donors
- [ ] Finalize Docker deployment files

---

## 📄 License

[Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)

---

## 👤 Author

Developed by Tobius Saul 
📧 Contact: bateesasaul@gmail.com

---

> _"Empowering mothers. Empowering change."_
