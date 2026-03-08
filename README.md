# Photo Editor - AI-Powered Image Editing Application

A full-stack web application for image editing with AI capabilities including image summarization, search functionality, and email subscriptions.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

- **Image Editing**: Edit and manipulate photos using Fabric.js canvas
- **Image Gallery**: Browse and manage your image collection
- **AI-Powered Search**: Search and summarize images using Google Generative AI
- **Image Summarization**: Get AI-generated summaries of your images
- **Email Subscription**: Subscribe to newsletters and updates
- **Responsive Design**: Fully responsive UI built with React and Tailwind CSS
- **File Upload**: Upload images to the server with multer

## 🛠️ Tech Stack

### Frontend
- **React** 18.2.0 - UI framework
- **Tailwind CSS** 3.3.3 - Utility-first CSS framework
- **Fabric.js** 5.3.0 - Canvas/image manipulation library
- **Axios** 1.5.0 - HTTP client
- **React Hot Toast** 2.4.1 - Toast notifications
- **React Icons** 4.11.0 - Icon library

### Backend
- **Node.js** - Runtime environment
- **Express** 4.18.2 - Web framework
- **Google Generative AI** 0.1.3 - AI integration for summarization and search
- **Multer** 1.4.5 - File upload middleware
- **CORS** 2.8.5 - Cross-origin resource sharing
- **Dotenv** 16.3.1 - Environment variable management

### Database
- **JSON** - Simple file-based database (db.json)

## 📁 Project Structure

```
photo-editor/
├── client/                          # React frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── EmailSubscription.js # Email subscription component
│   │   │   ├── ImageEditor.js      # Main image editor component
│   │   │   ├── ImageGallery.js     # Image gallery component
│   │   │   └── SearchSummarizer.js # Search and summarize component
│   │   ├── App.js                  # Main app component
│   │   ├── index.js                # React entry point
│   │   └── index.css               # Global styles
│   ├── package.json
│   ├── tailwind.config.js          # Tailwind CSS configuration
│   └── public/
├── server/                          # Node.js backend application
│   ├── server.js                   # Express server entry point
│   └── package.json
├── database/
│   └── db.json                     # JSON database file
└── README.md                        # Project documentation
```

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) and npm
- **Google API Key** (for Generative AI features) - [Get it here](https://makersuite.google.com/app/apikey)

## 🚀 Installation

### 1. Clone or Extract the Project

```bash
cd photo-editor
```

### 2. Install Dependencies

#### Frontend Setup
```bash
cd client
npm install
```

#### Backend Setup
```bash
cd ../server
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the `server` directory:

```env
GOOGLE_API_KEY=your_google_api_key_here
PORT=5000
```

## ▶️ Running the Application

### Start the Backend Server

```bash
cd server
npm start
# or for development with auto-reload:
npm run dev
```

The backend server will run on `http://localhost:5000`

### Start the Frontend Application

In a new terminal:

```bash
cd client
npm start
```

The frontend will open automatically at `http://localhost:3000`

## 💡 Usage

1. **Upload Images**: Use the image upload feature to add images to your gallery
2. **Edit Images**: Select an image and use the editor to make modifications
3. **Search & Summarize**: Use the SearchSummarizer component to search for images or get AI-generated summaries
4. **Subscribe**: Enter your email to subscribe to updates

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload an image file |
| GET | `/api/images` | Retrieve all images |
| POST | `/api/search` | Search images using AI |
| POST | `/api/summarize` | Generate AI summary for an image |
| POST | `/api/subscribe` | Subscribe email to newsletter |
| GET | `/api/subscribe` | Retrieve all email subscriptions |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

---

**Note**: Make sure to keep your Google API key secure and never commit `.env` files to version control.
