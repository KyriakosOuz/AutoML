
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatDateForGreece } from '@/lib/dateUtils';
import LikertScale from './LikertScale';
import { Progress } from '@/components/ui/progress';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

// SUS questionnaire items
const questions = [
  { id: 'q1', text: 'I think that I would like to use this system frequently.', reversed: false },
  { id: 'q2', text: 'I found the system unnecessarily complex.', reversed: true },
  { id: 'q3', text: 'I thought the system was easy to use.', reversed: false },
  { id: 'q4', text: 'I think that I would need the support of a technical person to be able to use this system.', reversed: true },
  { id: 'q5', text: 'I found the various functions in this system were well integrated.', reversed: false },
  { id: 'q6', text: 'I thought there was too much inconsistency in this system.', reversed: true },
  { id: 'q7', text: 'I would imagine that most people would learn to use this system very quickly.', reversed: false },
  { id: 'q8', text: 'I found the system very cumbersome to use.', reversed: true },
  { id: 'q9', text: 'I felt very confident using the system.', reversed: false },
  { id: 'q10', text: 'I needed to learn a lot of things before I could get going with this system.', reversed: true },
];

interface FormValues {
  [key: string]: string;
}

const SUSForm = ({ onSubmitSuccess }: { onSubmitSuccess: () => void }) => {
  const [formValues, setFormValues] = useState<FormValues>(
    questions.reduce((acc, q) => ({ ...acc, [q.id]: '' }), {})
  );
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleValueChange = (questionId: string, value: string) => {
    setFormValues(prev => ({ ...prev, [questionId]: value }));
  };

  const handleCommentsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComments(e.target.value);
    setCharacterCount(e.target.value.length);
  };

  const answeredCount = () => {
    return Object.values(formValues).filter(val => val !== '').length;
  };

  const progressPercentage = () => {
    return (answeredCount() / questions.length) * 100;
  };

  const isFormComplete = () => {
    return Object.values(formValues).every(value => value !== '');
  };

  // Calculate SUS score (0-100)
  const calculateSUSScore = () => {
    let score = 0;
    
    questions.forEach((question) => {
      const responseValue = parseInt(formValues[question.id]);
      if (!isNaN(responseValue)) {
        if (!question.reversed) {
          score += responseValue - 1; // Scale from 0 to 4
        } else {
          score += 5 - responseValue; // Scale from 0 to 4
        }
      }
    });
    
    // Multiply by 2.5 to get score from 0 to 100
    return score * 2.5;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormComplete()) {
      toast({
        title: "Please complete all questions",
        description: "All questions must be answered before submitting.",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "You need to be logged in to submit feedback.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    const susScore = calculateSUSScore();

    try {
      // Use custom SQL query via RPC instead of direct table operation
      const { error } = await (supabase.rpc as any)('insert_user_feedback', {
        p_user_id: user.id,
        p_responses: formValues,
        p_sus_score: susScore,
        p_additional_comments: comments
      });

      if (error) throw error;

      toast({
        title: "Feedback submitted",
        description: `Thank you for your feedback! Submitted on ${formatDateForGreece(new Date(), 'PPP')} at ${formatDateForGreece(new Date(), 'p')}`
      });
      
      onSubmitSuccess();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Submission failed",
        description: "There was an error submitting your feedback. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="mb-6">
        <div className="flex justify-between mb-2 text-sm">
          <span className="text-muted-foreground">{answeredCount()} of {questions.length} questions answered</span>
          <span className="font-medium">{Math.round(progressPercentage())}% Complete</span>
        </div>
        <Progress value={progressPercentage()} className="h-2" />
      </div>

      <Card className="bg-white">
        <CardHeader className="pb-2 border-b">
          <CardTitle className="text-xl text-primary">System Usability Scale (SUS)</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-8">
            {questions.map((question, index) => (
              <div key={question.id} className="p-4 border border-muted rounded-lg transition-all hover:border-muted-foreground/50 hover:bg-muted/10">
                <div className="flex items-start gap-3 mb-3">
                  <span className="inline-flex items-center justify-center rounded-full bg-primary/10 text-primary font-medium h-6 w-6 text-sm">
                    {index + 1}
                  </span>
                  <h3 className="font-medium text-foreground">{question.text}</h3>
                </div>
                <div className="ml-9">
                  <LikertScale
                    value={formValues[question.id]}
                    onChange={(value) => handleValueChange(question.id, value)}
                    reversed={question.reversed}
                  />
                </div>
              </div>
            ))}

            <div className="p-4 border border-muted rounded-lg transition-all hover:border-muted-foreground/50">
              <label htmlFor="comments" className="block text-sm font-medium mb-2">
                Additional Comments (Optional)
              </label>
              <Textarea
                id="comments"
                placeholder="Please share any additional feedback or suggestions..."
                value={comments}
                onChange={handleCommentsChange}
                rows={4}
                className="w-full resize-y min-h-[100px]"
              />
              <div className="flex justify-end mt-1">
                <span className="text-xs text-muted-foreground">
                  {characterCount} characters
                </span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t pt-4 mt-4">
          <Button 
            type="submit" 
            disabled={!isFormComplete() || isSubmitting}
            className="px-8 py-2 h-11 relative"
          >
            <span className={`transition-all ${isSubmitting ? 'opacity-0' : 'opacity-100'}`}>
              {isFormComplete() ? "Submit Feedback" : `Complete All Questions (${answeredCount()}/${questions.length})`}
            </span>
            {isSubmitting && (
              <AnimatePresence>
                <motion.div 
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </motion.div>
              </AnimatePresence>
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export default SUSForm;
