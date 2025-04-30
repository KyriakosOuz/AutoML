
import React, { ReactNode } from 'react';
import MainHeader from './MainHeader';
import { Outlet } from 'react-router-dom';

interface MainLayoutProps {
  children?: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <MainHeader />
      <main className="flex-1 w-full overflow-x-hidden">
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default MainLayout;
