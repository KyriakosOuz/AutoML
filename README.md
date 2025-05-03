
# KyrO AutoML Web Application

A complete platform for automated machine learning — from dataset upload and processing to training, evaluation, and prediction.

## Features

### Dataset Management
- Upload CSV datasets
- Handle missing values 
- Explore data with visual previews
- Select and analyze features

### Model Training
- AutoML mode for automatic algorithm selection
- Custom training with algorithm and hyperparameter selection
- Support for classification and regression tasks

### Evaluation and Prediction
- View detailed model metrics
- Interactive visualizations (confusion matrix, ROC curves, etc.)
- Make predictions with trained models
- Compare experiment results

## Technical Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **State Management**: React Context, TanStack Query
- **Visualization**: Recharts
- **Data Processing**: FastAPI backend (not included in this repository)

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Connect to your FastAPI backend or mock API

## Project Structure

```
src/
├── components/         # UI components
│   ├── dataset/        # Dataset handling components
│   ├── training/       # Model training components
│   ├── ui/             # shadcn UI components
├── contexts/           # React context providers
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and API clients
├── pages/              # Page components
└── types/              # TypeScript type definitions
```

## License

MIT License

