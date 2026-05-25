import { Outlet } from 'react-router-dom';

const MainLayout = () => {
  return (
    <div className="flex flex-1 overflow-hidden">
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 dark:bg-gray-900 relative">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
