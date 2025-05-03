
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SUSForm from '@/components/feedback/SUSForm';
import ThankYouView from '@/components/feedback/ThankYouView';
import { formatDateForGreece } from '@/lib/dateUtils';

const FeedbackPage = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<Date | null>(null);
  const navigate = useNavigate();

  const handleSubmitSuccess = () => {
    setSubmittedAt(new Date());
    setIsSubmitted(true);
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">App Feedback</h1>
      </div>

      <div className="mb-8">
        <p className="text-gray-600">
          Please rate your experience with KyrO AutoML. Your feedback will help us improve the platform.
          {submittedAt && (
            <span className="block text-sm text-muted-foreground mt-2">
              Last submitted: {formatDateForGreece(submittedAt)}
            </span>
          )}
        </p>
      </div>

      {isSubmitted ? (
        <ThankYouView />
      ) : (
        <SUSForm onSubmitSuccess={handleSubmitSuccess} />
      )}
    </div>
  );
};

export default FeedbackPage;
