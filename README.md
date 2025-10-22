# AI Interview Prep App

A full-stack Single Page Application (SPA) designed to help job seekers practice interviews. The app uses **Gemini's LLM** to generate highly relevant, context-specific questions based on a Job Description (JD) and provides instant, grounded feedback against the user's Resume using the **RAG (Retrieval-Augmented Generation)** pattern.

## Tech Stack

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | React, Tailwind CSS (CDN) | UI/UX, Component Logic, Mock API Client. |
| **Backend** | Node.js, Express, Mongoose (MongoDB) | REST API, Authentication, Data Persistence. |
| **Security** | JWT, Bcryptjs | User authentication and secure password hashing. |
| **Storage** | Multer, Cloudinary | Handles multipart file upload and cloud storage of PDF files. |
| **AI/RAG** | Gemini API, PDF-Parse | Question generation, response scoring, and grounding answers in uploaded documents. |

---

## Setup Guide

Follow these steps to get both the frontend and conceptual backend running locally.

### 1. Prerequisites

* Node.js (v18+)
* MongoDB Atlas Account (or local MongoDB instance)
* Gemini API Key
* Cloudinary Account

### 2. Backend Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Create the `.env` file:** Copy the contents of `.env.example` into a new file named `.env` and fill in your credentials.

    #### `.env` File Content:

    ```bash
    # MONGO DB
    MONGO_URI="your_mongodb_atlas_connection_string"

    # AUTHENTICATION
    JWT_SECRET="a_very_long_and_random_secret_key"
    JWT_LIFETIME="30d"

    # CLOUDINARY CONFIG
    CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
    CLOUDINARY_API_KEY="your_cloudinary_api_key"
    CLOUDINARY_API_SECRET="your_cloudinary_api_secret"

    # GEMINI
    # NOTE: The client-side App.jsx will handle its own API key for demonstration purposes.
    # The server only needs this if you move the AI logic server-side.
    # GEMINI_API_KEY="your_gemini_api_key" 
    ```

4.  **Start the server:**
    ```bash
    npm run dev
    ```
    The server should start on `http://localhost:5000`.

### 3. Frontend Setup

1.  **Navigate to the frontend directory:**
    ```bash
    cd ../frontend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Update API URL (Optional):** If your backend runs on a different port, update the `BASE_URL` variable inside `frontend/App.jsx`. By default, it uses `http://localhost:5000/api`.

4.  **Add Gemini API Key:** The application uses the Gemini API directly from the client. **Update the `GEMINI_API_KEY` constant** in `frontend/App.jsx` with your key.

    ```javascript
    // Inside frontend/App.jsx:
    const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE"; 
    ```

5.  **Start the React development server:**
    ```bash
    npm start
    ```

The frontend will run on `http://localhost:3000` (or the next available port), and the application should now be fully functional.
