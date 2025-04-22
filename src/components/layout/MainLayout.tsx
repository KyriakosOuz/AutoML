
import React from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <main className="flex-1">{children}</main>
    </div>
  );
};

export default MainLayout;
