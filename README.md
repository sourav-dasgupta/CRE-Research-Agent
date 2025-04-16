# CRE Research Agent

## Intelligent Commercial Real Estate Research

The CRE Research Agent is an AI-powered research tool designed specifically for commercial real estate professionals. It combines multiple data sources with advanced AI processing to deliver comprehensive, well-sourced answers to complex CRE queries.

## Key Features

- **Intelligent Query Processing**: Automatically categorizes and routes research queries to specialized services
- **Multi-source Research**: Collects information from sustainability databases, market trends, leasing data, and general knowledge sources
- **Real-time Research Visibility**: Shows step-by-step research process as it happens
- **Document Analysis**: Upload and analyze CRE documents for additional context
- **Structured Responses**: Delivers well-formatted answers with clear sections and proper citations
- **PDF Report Generation**: Create downloadable reports from research results

## Architecture

The application follows a modern client-server architecture:

- **Frontend**: React single-page application with Material-UI components
- **Backend**: Node.js/Express API server with specialized research services
- **AI Integration**: OpenAI GPT-4 API for research synthesis and response generation

## Installation

### Prerequisites

- Node.js (v14+)
- npm or yarn
- MongoDB (optional)

### Backend Setup

# Navigate to backend directory
cd backend
Install dependencies
npm install
Create .env file from example
cp .env.example .env
Edit .env and add your API keys
nano .env
Create required directories
npm run setup
Start the server
npm run dev

### Frontend Setup
# Navigate to frontend directory
cd frontend
Install dependencies
npm install
Start the development server
npm start

## Usage Guide

1. Type your commercial real estate research query in the search bar
2. Watch as the agent conducts research in real-time, showing each step
3. Review the comprehensive response with properly cited sources
4. (Optional) Upload relevant documents for context-specific research
5. (Optional) Generate and download PDF reports of your research results

## API Documentation

### Key Endpoints

- `POST /api/query/research` - Submit a research query
- `GET /api/query/status/:sessionId` - Check status of ongoing research
- `POST /api/documents/upload` - Upload documents for analysis
- `POST /api/reports/generate` - Generate PDF reports
- `GET /api/reports/download/:id` - Download generated reports

## Technologies Used

### Frontend
- React 18
- Material-UI
- Axios for API requests
- React Markdown for formatting

### Backend
- Node.js
- Express
- MongoDB (optional)
- PDF.js & Mammoth for document processing
- pdf-lib for report generation

### AI & Research
- OpenAI GPT-4
- arXiv API
- Wikipedia API
- FRED Economic Data API

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request



## Acknowledgments

- Commercial real estate industry experts who provided domain knowledge
- The open-source libraries and APIs that made this project possible

---

*Built with ❤️ for the commercial real estate community*
