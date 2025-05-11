# Spotify Ultimate Recap

A comprehensive web application that provides enhanced visualization and insights for your Spotify listening data. This project allows users to view detailed statistics about their music preferences and share these insights with others.

## 🎵 Features

- **Detailed Listening Statistics**: Visualize your Spotify listening habits with interactive charts
- **Data Sharing**: Share your music statistics with friends via unique links
- **Internationalization**: Available in English and French
- **Responsive Design**: Works on desktop and mobile devices

## 🚀 Tech Stack

- **Frontend**: [Astro](https://astro.build/) with [React](https://reactjs.org/) components
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database**: PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- **Visualization**: [ECharts](https://echarts.apache.org/)
- **Internationalization**: [i18next](https://www.i18next.com/)
- **Infrastructure**: Terraform for infrastructure as code
- **Containerization**: Docker for development and deployment

## 📋 Prerequisites

- Node.js 22 or higher
- Docker and Docker Compose
- Git

## 🛠️ Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/spotify-ultimate-recap.git
   cd spotify-ultimate-recap
   ```

2. Install dependencies:
   ```bash
   npm install
   cd app
   npm install
   ```

3. Start the database:
   ```bash
   docker-compose up -d
   ```

4. Generate Prisma client:
   ```bash
   cd app
   npm run prisma generate
   ```

5. Run database migrations:
   ```bash
   npm run prisma migrate dev
   ```

## 🖥️ Development

1. Start the development server:
   ```bash
   cd app
   npm run dev
   ```

2. Open your browser and navigate to `http://localhost:4321`

## 🏗️ Building for Production

1. Build the application:
   ```bash
   cd app
   npm run build
   ```

2. Preview the production build:
   ```bash
   npm run preview
   ```

## 🐳 Docker Deployment

You can build and run the application using Docker:

```bash
docker build -t spotify-ultimate-recap .
docker run -p 4321:4321 -e POSTGRES_PRISMA_URL=your_database_url spotify-ultimate-recap
```

## 📁 Project Structure

```
/
├── app/                    # Astro application
│   ├── public/             # Static assets
│   ├── src/                # Source code
│   │   ├── components/     # UI components
│   │   ├── layouts/        # Page layouts
│   │   ├── lib/            # Utility functions
│   │   ├── locales/        # Internationalization files
│   │   ├── models/         # Data models
│   │   └── pages/          # Application pages
│   ├── prisma/             # Database schema and migrations
│   └── package.json        # App dependencies
├── infrastructure/         # Terraform IaC files
├── .github/                # GitHub Actions workflows
├── docker-compose.yml      # Local development setup
├── Dockerfile              # Production Docker configuration
└── package.json            # Root dependencies
```

## 📄 License

This project is licensed under the terms of the license included in the [LICENSE](LICENSE) file.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
