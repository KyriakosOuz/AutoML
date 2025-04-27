
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { API_BASE_URL } from '@/lib/constants';
import { handleApiResponse, getAuthHeaders } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface SaveComparisonDialogProps {
  experimentIds: string[];
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const SaveComparisonDialog: React.FC<SaveComparisonDialogProps> = ({
  experimentIds,
  open,
  onClose,
  onSaved
}) => {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a name for this comparison',
        variant: 'destructive'
      });
      return;
    }
    
    setSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      
      // Create FormData and append each experiment ID individually
      const formData = new FormData();
      formData.append('name', name);
      
      // Important: Append each experiment_ids separately, not as an array
      experimentIds.forEach(id => {
        formData.append('experiment_ids', id);
      });
      
      // Remove the Content-Type header to let the browser set it with the boundary
      const { 'Content-Type': _, ...headerWithoutContentType } = headers;
      
      const response = await fetch(`${API_BASE_URL}/comparisons/create/`, {
        method: 'POST',
        headers: headerWithoutContentType, // Use headers without Content-Type
        body: formData
      });
      
      await handleApiResponse(response);
      
      toast({
        title: 'Comparison saved',
        description: 'The comparison has been successfully saved'
      });
      
      onSaved();
      onClose();
    } catch (error) {
      console.error('Error saving comparison:', error);
      toast({
        title: 'Failed to save comparison',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Comparison</DialogTitle>
          <DialogDescription>
            Save a comparison of {experimentIds.length} experiments for future reference.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="comparison-name">Comparison Name</Label>
              <Input
                id="comparison-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter a descriptive name"
                autoFocus
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Comparison'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SaveComparisonDialog;
