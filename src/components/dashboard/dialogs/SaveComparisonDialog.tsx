
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
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a name for this comparison',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/comparisons/save/`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name,
          experiment_ids: experimentIds
        })
      });
      
      await handleApiResponse(response);
      toast({
        title: 'Comparison saved',
        description: 'Your comparison has been successfully saved'
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
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Comparison</DialogTitle>
          <DialogDescription>
            Create a new comparison with {experimentIds.length} selected experiments.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Comparison Name</Label>
            <Input 
              id="name" 
              placeholder="Enter a descriptive name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Comparison'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveComparisonDialog;
