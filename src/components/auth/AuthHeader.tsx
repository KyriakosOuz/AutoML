
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, User, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const AuthHeader = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="flex items-center gap-4">
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 p-0">
              <Avatar>
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col">
                <p className="text-sm font-medium">{user.email}</p>
                <p className="text-xs text-muted-foreground">My Account</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings" className="cursor-pointer flex gap-2 items-center">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
