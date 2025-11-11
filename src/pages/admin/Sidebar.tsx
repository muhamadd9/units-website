import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { useNavigate, useLocation } from "react-router-dom";
import { FaBuilding, FaBookOpen } from "react-icons/fa";
import { FiArrowLeft } from "react-icons/fi";

const Sidebar = ({ isOpen, toggle }: { isOpen: boolean; toggle: () => void }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    {
      label: "Zaya Development",
      icon: <FaBuilding className="w-5 h-5" />,
      command: () => navigate("/admin/zaya-development"),
      path: "/admin/zaya-development",
    },
    {
      label: "Rikaz Development",
      icon: <FaBuilding className="w-5 h-5" />,
      command: () => navigate("/admin/rikaz-development"),
      path: "/admin/rikaz-development",
    },
    {
      label: "Bookings",
      icon: <FaBookOpen className="w-5 h-5" />,
      command: () => navigate("/admin/bookings"),
      path: "/admin/bookings",
    },
  ];

  return (
    <aside
      className={classNames(
        "h-full bg-foreground w-72 border-r border-border",
        "shadow-lg lg:shadow-none",
        "transition-all duration-300 ease-in-out z-40",
        "fixed lg:static",
        {
          "left-0": isOpen,
          "-left-72": !isOpen,
        }
      )}
      dir="ltr"
    >
      <div className="p-4 h-full overflow-y-auto bg-foreground text-background flex flex-col">
        <div className="pb-4 border-b border-border">
          <div className="flex gap-2 items-center justify-start">
            <button
              onClick={() => navigate('/units/zaya-development')}
              className="inline-flex items-center justify-center rounded-md text-background px-2 py-1 hover:bg-white hover:text-foreground transition-colors"
              aria-label="Back to home"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-background">Dashboard</h1>
            <Button
              icon="pi pi-bars"
              className="lg:hidden ml-auto"
              onClick={toggle}
              pt={{
                root: "bg-transparent border-0 hover:bg-muted",
                icon: "text-lg text-background",
              }}
            />
          </div>
        </div>

        <div className="flex-1 pt-4 space-y-2">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={item.command}
              className={classNames(
                "w-full flex items-center cursor-pointer gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                {
                  "font-medium bg-white/10 border-l-4 border-white/30": location.pathname.startsWith(item.path),
                  "text-background hover:bg-accent hover:text-accent-foreground": !location.pathname.startsWith(item.path),
                }
              )}
              style={{ justifyContent: "flex-start" }}
            >
              <span className="text-background">
                {item.icon}
              </span>
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

