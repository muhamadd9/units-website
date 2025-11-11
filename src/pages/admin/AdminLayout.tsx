import { Outlet } from "react-router-dom";
import { useState } from "react";
import { classNames } from "primereact/utils";
import Sidebar from "./Sidebar";
import { FiAlignRight } from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  if (!user || user.role !== 'admin') {
    navigate('/login');
    return null;
  }

  return (
    <div className="h-screen flex flex-col relative">
      <div className="flex flex-1 h-full overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} />
        <div
          className={classNames(
            "py-3 px-2 md:px-3 lg:px-4 bg-background flex-1",
            "text-foreground",
            "overflow-y-auto space-y-6"
          )}
        >
          <div className="py-5">
            <Outlet />
          </div>

          <p className="font-medium text-muted-foreground text-sm text-center">
            {new Date().getFullYear()} © All rights reserved
          </p>
        </div>
      </div>
      <div
        onClick={toggleSidebar}
        className="absolute top-5 left-5 size-10 bg-foreground hover:bg-foreground/90 cursor-pointer rounded-full flex items-center justify-center z-50 lg:hidden"
      >
        <FiAlignRight className="text-background text-xl" />
      </div>
    </div>
  );
};

export default AdminLayout;
