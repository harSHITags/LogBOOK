
# StockSphere — Intelligent Inventory Management with Generative AI

StockSphere is a full-stack product inventory management platform built using **React, FastAPI, and PostgreSQL**, with integrated Generative AI capabilities powered by the Google Gemini API.

The application helps users manage product records, track inventory quantities, and generate AI-assisted product descriptions and inventory recommendations. It combines reliable backend business logic with AI-generated insights to simplify everyday inventory management.

## Features

### 1. Product Management
- Create, view, update, and delete product records.
- Retrieve individual products by ID.
- Manage product names, descriptions, prices, and stock quantities.
- Search, filter, and sort products through the frontend where supported.
- Store and retrieve inventory data using PostgreSQL.

### 2. Authentication and Authorization
- User registration and login.
- Password hashing for secure password storage.
- JWT-based authentication.
- Protected API endpoints.
- User-specific inventory retrieval based on the authenticated user's identity.

### 3. AI-Powered Product Description Generation
Generate product descriptions using the Google Gemini API.

- Submit product information to the backend.
- Generate descriptions using a language model.
- Retrieve generated content through a FastAPI endpoint.
- Reduce the effort required to write product descriptions manually.

**Endpoint:** `POST /products/generate-description`

### 4. AI-Assisted Inventory Advisor
The Inventory Advisor combines Python-based stock classification with Gemini-generated recommendations.

- Retrieve inventory records belonging to the authenticated user.
- Identify products that may require restocking.
- Classify products according to their current stock quantities.
- Generate natural-language inventory summaries and recommendations.

**Stock classification rules:**

| Stock status | Condition |
|---|---|
| Out of stock | Quantity equals `0` |
| Low stock | Quantity is greater than `0` and less than or equal to the configured threshold |
| Healthy | Quantity exceeds the configured threshold |

The default low-stock threshold is `5`.

**Endpoint:** `POST /products/inventory-advice`

Stock classification is handled by deterministic Python logic. Gemini generates recommendations based on the supplied inventory data. The system does not independently predict future sales or demand without relevant historical data.

*Note: AI-generated recommendations depend on the availability of the Gemini service. The inventory-advice endpoint should be tested before relying on it in production.*

## Technology Stack

| Technology | Purpose |
|---|---|
| Python | Backend programming |
| FastAPI | REST API development |
| React | Frontend user interface |
| PostgreSQL | Relational database |
| SQLAlchemy | ORM and database operations |
| Pydantic | Request validation and data modelling |
| JWT | Authentication and authorization |
| Password hashing | Secure password storage |
| Google Gemini API | Generative AI integration |
| Axios | Frontend HTTP requests |
| Uvicorn | ASGI server |

## Project Structure

```text
fastapi-demo-main/
├── main.py
├── models.py
├── database.py
├── databaseModels.py
├── .gitignore
└── 04-products-with-ui/
    └── frontend/
        ├── package.json
        ├── public/
        │   └── stocksphere-logo.png
        └── src/
            ├── App.js
            ├── index.js
            └── index.css
```

This is a simplified representation of the main project files. The logo filename assumes the new logo has been saved in the frontend's `public` directory.

## Prerequisites

Before running the application, ensure you have:

- Python installed.
- Node.js and npm installed.
- PostgreSQL installed and running.
- A Google Gemini API key for AI-powered features.
- Git installed if you want to clone or contribute to the repository.

## Installation and Setup

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd fastapi-demo-main
```

Replace `<your-repository-url>` with your actual GitHub repository URL.

### 2. Create and activate a virtual environment

On Windows PowerShell:

```powershell
python -m venv myenv
.\myenv\Scripts\Activate.ps1
```

### 3. Install backend dependencies

Install the core packages used by the backend:

```bash
pip install fastapi uvicorn sqlalchemy "psycopg[binary]" python-dotenv PyJWT google-genai
```

Install any additional dependencies required by your existing password-hashing and authentication implementation.

### 4. Configure environment variables

Create a `.env` file in the directory from which your backend loads environment variables.

```env
DATABASE_URL=your_postgresql_connection_string
GEMINI_API_KEY=your_gemini_api_key
```

Use the database URL format expected by your SQLAlchemy configuration. Never commit real API keys, database passwords, or other secrets to GitHub.

### 5. Configure PostgreSQL

1. Start the PostgreSQL service.
2. Create the database used by the application.
3. Configure the database connection string.
4. Initialize the database tables using the project's existing database setup.

### 6. Start the FastAPI backend

From the backend project root:

```bash
uvicorn main:app --reload
```

The backend should be available at:

- **API:** http://localhost:8000
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### 