
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { CheckCircle, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const ThankYouView = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="max-w-lg mx-auto text-center border-2 border-primary/20 shadow-lg">
        <CardHeader className="pb-2">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="flex justify-center mb-4"
          >
            <div className="bg-green-100 text-green-700 p-3 rounded-full">
              <CheckCircle size={36} className="text-green-600" />
            </div>
          </motion.div>
          <CardTitle className="text-2xl text-primary font-bold">Thank You for Your Feedback!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <motion.div 
            className="flex justify-center my-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
          >
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.div
                  key={star}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  }}
                >
                  <Star 
                    className="h-10 w-10 text-amber-400 fill-amber-400" 
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          <p className="text-gray-600 text-lg">
            Your feedback is invaluable and helps us improve the KyrO AutoML platform for everyone. We appreciate you taking the time to share your thoughts with us.
          </p>
          
          <div className="pt-4">
            <Link to="/dashboard">
              <Button variant="default" size="lg" className="px-8">
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ThankYouView;
