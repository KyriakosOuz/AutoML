
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import LikertScale from './LikertScale';

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
  const { toast } = useToast();
  const { user } = useAuth();

  const handleValueChange = (questionId: string, value: string) => {
    setFormValues(prev => ({ ...prev, [questionId]: value }));
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
        // For odd-numbered questions (not reversed), the score contribution is the scale position minus 1
        // For even-numbered questions (reversed), the score contribution is 5 minus the scale position
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
      // This allows us to insert into the table without having updated TypeScript definitions
      const { error } = await supabase.rpc('insert_user_feedback', {
        p_user_id: user.id,
        p_responses: formValues,
        p_sus_score: susScore,
        p_additional_comments: comments
      });

      if (error) throw error;

      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback!"
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
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>System Usability Scale (SUS)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {questions.map((question) => (
              <div key={question.id} className="space-y-2">
                <div className="font-medium">{question.text}</div>
                <LikertScale
                  value={formValues[question.id]}
                  onChange={(value) => handleValueChange(question.id, value)}
                  reversed={question.reversed}
                />
              </div>
            ))}

            <div className="pt-4">
              <label htmlFor="comments" className="block text-sm font-medium mb-2">
                Additional Comments (Optional)
              </label>
              <Textarea
                id="comments"
                placeholder="Please share any additional feedback or suggestions..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={!isFormComplete() || isSubmitting}
          className="px-6"
        >
          {isSubmitting ? "Submitting..." : "Submit Feedback"}
        </Button>
      </div>
    </form>
  );
};

export default SUSForm;
