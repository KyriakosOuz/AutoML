
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, User } from "lucide-react";
import { Link } from "react-router-dom";

const AuthHeader = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="flex items-center gap-4">
      {user ? (
        <>
          <div className="text-sm text-gray-600 hidden md:block">
            {user.email}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={signOut}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </>
      ) : (
        <Link to="/auth">
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Sign In</span>
          </Button>
        </Link>
      )}
    </div>
  );
};

export default AuthHeader;
