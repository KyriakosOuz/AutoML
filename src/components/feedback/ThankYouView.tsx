
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';

const ThankYouView = () => {
  return (
    <Card className="max-w-lg mx-auto text-center">
      <CardHeader>
        <CardTitle className="text-2xl">Thank You for Your Feedback!</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center my-4">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} 
                className="h-10 w-10 text-amber-400 fill-amber-400" 
              />
            ))}
          </div>
        </div>
        
        <p className="text-gray-600">
          Your feedback is invaluable and helps us improve the KyrO AutoML platform for everyone. We appreciate you taking the time to share your thoughts with us.
        </p>
        
        <div className="pt-4">
          <Link to="/dashboard">
            <Button variant="default">
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default ThankYouView;
