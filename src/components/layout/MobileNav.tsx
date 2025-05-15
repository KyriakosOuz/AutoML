
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Sheet,
  SheetContent,
  SheetTrigger
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, BarChart2, Upload } from 'lucide-react';

const MobileNav = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    return currentPath.includes(path);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" className="md:hidden p-2">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[300px] pt-16">
        <div className="flex flex-col gap-4">
          <Link to="/dashboard" className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-100">
            <BarChart2 className={`h-5 w-5 ${isActive('/dashboard') ? 'text-black' : 'text-gray-500'}`} />
            <span className={`${isActive('/dashboard') ? 'font-medium text-black' : 'text-gray-700'}`}>
              Dashboard
            </span>
          </Link>
          <Link to="/dataset" className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-100">
            <Upload className={`h-5 w-5 ${isActive('/dataset') ? 'text-black' : 'text-gray-500'}`} />
            <span className={`${isActive('/dataset') ? 'font-medium text-black' : 'text-gray-700'}`}>
              Dataset
            </span>
          </Link>
          <Link to="/training" className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-100">
            <img 
              src="/app/lovable-uploads/c9e22fa3-6ca8-4d5e-bcbd-976529ccc178.png" 
              alt="IEE Logo" 
              className={`h-5 w-5 ${isActive('/training') ? 'opacity-100' : 'opacity-70'}`} 
            />
            <span className={`${isActive('/training') ? 'font-medium text-black' : 'text-gray-700'}`}>
              Training
            </span>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;
