
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronRight } from 'lucide-react';

const SettingsPage = () => {
  const { user } = useAuth();
  const [isChangeEmailOpen, setIsChangeEmailOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  
  // Form state for email change
  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  
  // Form state for password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChangeEmail = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newEmail !== confirmEmail) {
      toast({
        title: "Emails don't match",
        description: "Please ensure both email addresses match.",
        variant: "destructive",
      });
      return;
    }
    
    // Here you would call the actual API to change the email
    // This is a placeholder for the API call
    
    toast({
      title: "📬 Confirmation email sent",
      description: `We've sent a confirmation email to ${newEmail}.`,
    });
    
    setIsChangeEmailOpen(false);
    setNewEmail('');
    setConfirmEmail('');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please ensure your new passwords match.",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Your password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }
    
    // Here you would call the actual API to change the password
    // This is a placeholder for the API call
    
    toast({
      title: "Password updated successfully",
      description: "Your password has been changed.",
    });
    
    setIsChangePasswordOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>Manage your account settings and password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Setting Row */}
          <div className="flex items-center justify-between p-2 rounded-md hover:bg-accent/50 transition-colors">
            <div>
              <Label className="text-base font-medium">Email</Label>
              <p className="text-sm text-muted-foreground">{user?.email || 'email@example.com'}</p>
            </div>
            <Button 
              variant="ghost" 
              className="flex items-center"
              onClick={() => setIsChangeEmailOpen(true)}
            >
              Change Email <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>

          {/* Password Setting Row */}
          <div className="flex items-center justify-between p-2 rounded-md hover:bg-accent/50 transition-colors">
            <div>
              <Label className="text-base font-medium">Password</Label>
              <p className="text-sm text-muted-foreground">••••••••</p>
            </div>
            <Button 
              variant="ghost" 
              className="flex items-center"
              onClick={() => setIsChangePasswordOpen(true)}
            >
              Change Password <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Email Dialog */}
      <Dialog open={isChangeEmailOpen} onOpenChange={setIsChangeEmailOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Email</DialogTitle>
            <DialogDescription>
              Enter your new email address. A confirmation will be sent.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangeEmail} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-email">New Email Address</Label>
              <Input 
                id="new-email" 
                type="email" 
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter new email address"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-email">Confirm Email Address</Label>
              <Input 
                id="confirm-email" 
                type="email" 
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                placeholder="Confirm new email address"
                required
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsChangeEmailOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Send Confirmation Email</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and your new password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input 
                id="current-password" 
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input 
                id="new-password" 
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input 
                id="confirm-password" 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsChangePasswordOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Password</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
