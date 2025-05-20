
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SUSForm from '@/components/feedback/SUSForm';
import ThankYouView from '@/components/feedback/ThankYouView';
import { formatDateForGreece } from '@/lib/dateUtils';
import { motion } from 'framer-motion';

const FeedbackPage = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<Date | null>(null);
  const navigate = useNavigate();

  const handleSubmitSuccess = () => {
    setSubmittedAt(new Date());
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="mr-3"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold text-primary">App Feedback</h1>
          </div>

          <div className="text-muted-foreground">
            <p className="text-lg">
              Please rate your experience with IEE AutoML. Your feedback will help us improve the platform.
              {submittedAt && (
                <span className="block text-sm text-muted-foreground mt-2 font-medium">
                  Last submitted: {formatDateForGreece(submittedAt)}
                </span>
              )}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {isSubmitted ? (
            <ThankYouView />
          ) : (
            <SUSForm onSubmitSuccess={handleSubmitSuccess} />
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default FeedbackPage;
