# Rasatantra Backend: Architectural Details & Technical Analysis

This document provides an exhaustive breakdown of the Rasatantra backend, explaining the integration of the Navarasa ML model, the raga recommendation engine, and the data-driven scoring system.

---

## 1. Directory Structure Analysis

The backend is built using **FastAPI** and follows a modular service-oriented architecture.

```text
backend/
├── app/
│   ├── api/                # API Endpoints (FastAPI Routers)
│   │   ├── auth_routes.py           # User authentication (Login/Register)
│   │   ├── mode_routes.py           # Fetching available recommendation modes
│   │   └── recommendation_routes.py # CORE: Image processing & Raga recommendations
│   ├── schemas/            # Pydantic models for Data Validation
│   │   ├── auth.py                  # Auth request/response schemas
│   │   └── recommendation.py        # Recommendation API schemas
│   ├── services/           # Business Logic & Core Engines
│   │   ├── rasa_model.py            # ML Model Loader and Predictor (PyTorch)
│   │   ├── rasa_bhava_mapper.py     # Maps Navarasa to Sthayi Bhava
│   │   ├── raga_recommender.py      # Main recommendation scoring logic
│   │   ├── raga_repository.py       # Data access layer for the Raga JSON
│   │   ├── mode_engine.py           # Strategic logic for Therapeutic/Traditional modes
│   │   ├── environment_service.py   # Fetches Prahara (time) and Ritu (weather/season)
│   │   └── auth_service.py          # JWT and User management logic
│   ├── config.py           # Application configuration (env vars, model paths)
│   ├── database.py         # Persistence layer (Recommendation History & Users)
│   └── main.py             # Application entry point & state initialization
├── local_dev.db            # SQLite database for development
└── requirements.txt        # Backend dependencies (torch, torchvision, fastapi, etc.)
```

---

## 2. Machine Learning Integration

### The Model: `best_navarasa_model.pth`
The backend utilizes a trained **EfficientNet-B2** model. This model was developed in the `navarasa_efficientnet_b2.ipynb` notebook and saved as a state dictionary.

#### Model Architecture (Defined in `rasa_model.py`):
The architecture exactly matches the one used during training:
```python
model = models.efficientnet_b2(weights=None)
model.classifier = nn.Sequential(
    nn.Dropout(p=0.4),
    nn.Linear(in_features=1408, out_features=512),
    nn.ReLU(),
    nn.Dropout(p=0.3),
    nn.Linear(512, 9), # 9 Classes: Navarasa
)
```

### Preprocessing & Inference
The backend ensures that the image captured by the user's camera is processed identically to the training data:
1. **Resize (256)** and **CenterCrop (224)**.
2. **Normalization** using ImageNet stats (mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]).
3. **Softmax** is applied to the output to get confidence scores for all 9 Navarasas:
   *   *adhbuta, bhayanak, bhibhatsa, hasya, karuna, raudra, shanta, shringara, veer.*

---

## 3. The Raga Recommendation Engine

The core of Rasatantra is its ability to bridge **Emotions (Navarasa)** with **Music (Ragas)**.

### Step 1: Navarasa to Bhava Mapping (`rasa_bhava_mapper.py`)
Since Ragas in the dataset are categorized by **Sthayi Bhava** (permanent aesthetic states), the detected Rasa must be mapped:
*   `shringara` -> `rati` (Love/Eros)
*   `karuna` -> `shoka` (Sorrow)
*   `raudra` -> `krodha` (Anger)
*   `shanta` -> `shama` (Peace)
*   ...and so on.

### Step 2: Strategic Mode Selection (`mode_engine.py`)
Depending on the user's selected mode, the "Target Bhava" changes:
- **Therapeutic Mode**: Aims for emotional regulation. If `Krodha` (Anger) is detected, the engine targets `Shama` (Peace) or `Utsaha` (Energy) to balance the user.
- **Traditional Mode**: Enhances the existing mood while following classical rules.

### Step 3: Scoring Logic (`raga_recommender.py`)
The engine iterates through the `raga_sthayi_bhava_dataset_enriched.json` and calculates a **Composite Score** for each raga:

$$Score = (BhavaScore \times 0.65) + (PraharaScore \times 0.20) + (RituScore \times 0.15)$$

1.  **Bhava Score (65%)**: 
    *   1.0 if the target Bhava is the raga's `primary_sthayi_bhava`.
    *   0.6 if it's in the `secondary_sthayi_bhava`.
2.  **Prahara Score (20%)**: 
    *   1.0 if the current time of day matches the raga's prescribed `prahara` (1-8).
3.  **Ritu Score (15%)**: 
    *   1.0 if the current weather/season matches the raga's `ritu`.

---

## 4. Dataset Usage: `raga_sthayi_bhava_dataset_enriched.json`

The `RagaRepository` loads this JSON file into memory. Each entry contains:
- **raga_name**: The identifier.
- **primary_sthayi_bhava**: The main emotional quality.
- **prahara**: A list of time slots (3-hour intervals) when the raga is traditionally performed.
- **ritu**: The seasonal association (e.g., `vasanta` for Spring).
- **youtube_links**: Curated vocal and instrumental performances.

The backend filters these links based on the user's preference (`vocal`, `instrumental`, or `both`) and returns the top-ranked ragas.

---

## 6. Database Schema & Persistence (`local_dev.db`)

The backend uses **SQLite** for lightweight persistence. The schema is designed to track user activity and provide a historical record of emotional states and recommendations.

### `users` Table
Stores authentication and profile information.
*   `id`: Primary key (Autoincrement).
*   `email`: Unique identifier for login.
*   `password_hash`: Salted and hashed password (never stored in plain text).
*   `created_at`: ISO timestamp of registration.

### `recommendation_history` Table
Captures the context and outcome of every recommendation request.
*   `user_id`: Foreign key linking to the `users` table.
*   `mode`: The strategic mode used (e.g., `therapeutic`, `study`).
*   `detected_rasa`: The raw Navarasa output from the ML model.
*   `detected_bhava`: The mapped emotional state.
*   `confidence`: The model's confidence score for the primary Rasa.
*   `prahara`: The time slot (1-8) at the moment of request.
*   `ritu`: The seasonal context.
*   `weather_condition`: Specific weather data (e.g., "Clear", "Rainy").
*   `recommendations_json`: A serialized JSON string containing the full raga details and YouTube links returned to the user.
*   `created_at`: ISO timestamp of the interaction.

---

## 7. Authentication Mechanism (`auth_service.py`)

Rasatantra implements a secure authentication flow using **PBKDF2-SHA256** and **JWT-style custom tokens**.

### Password Security
- **Hashing:** When a user registers, their password is processed using `hashlib.pbkdf2_hmac` with **240,000 iterations** and a unique **16-byte salt**.
- **Format:** The stored hash follows the format: `pbkdf2_sha256$salt$digest`.
- **Verification:** During login, the same algorithm is applied to the input password and compared using `hmac.compare_digest` to prevent timing attacks.

### Session Management
- **Token Generation:** Upon successful login, the server generates a signed token containing the user's ID, email, and expiration time (`exp`).
- **Signing:** Tokens are signed using a server-side `SECRET_KEY` and HMAC-SHA256.
- **Authorization:** Protected routes use an `HTTPBearer` dependency to validate the token in the `Authorization` header before granting access.

---

## 8. Logic Summary: Mapping & Recommendation

1.  **Static Mappings:** The emotional logic (Rasa -> Bhava) and strategic targets (e.g., "Anger" targets "Peace" in Therapeutic mode) are defined as **immutable dictionaries** in the code (`rasa_bhava_mapper.py` and `mode_engine.py`). This ensures high performance and consistency.
2.  **Dynamic Recommendations:** While the "rules" are static, the **outputs are dynamic** because they depend on:
    *   **ML Prediction:** Real-time facial analysis.
    *   **Environment Context:** The exact time (`prahara`) and local weather (`ritu`) at the user's location.
    *   **History Persistence:** Every interaction is saved to `local_dev.db`, allowing users to track their emotional journey over time.
