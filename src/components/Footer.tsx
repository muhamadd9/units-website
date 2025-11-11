import { Twitter, Instagram, Linkedin } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const whatsapp = 'https://wa.me/201020449160';
  const instagram = 'https://instagram.com/muhamadd9_';
  const xProfile = 'https://x.com/muhamadd9_';
  const linkedin = 'https://www.linkedin.com/in/muhamadd9';

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs sm:text-sm text-gray-600">
            © {currentYear} • Developed by{' '}
            <a href={whatsapp} target="_blank" rel="noreferrer" className="font-medium text-gray-800 hover:underline">
              Muhamad Ramadan
            </a>
          </p>
          <div className="flex items-center gap-2">
            <a href={xProfile} target="_blank" rel="noreferrer" className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-100 text-gray-600" aria-label="X (formerly Twitter)">
              <Twitter className="h-4 w-4" />
            </a>
            <a href={instagram} target="_blank" rel="noreferrer" className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-100 text-gray-600" aria-label="Instagram">
              <Instagram className="h-4 w-4" />
            </a>
            <a href={linkedin} target="_blank" rel="noreferrer" className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-100 text-gray-600" aria-label="LinkedIn">
              <Linkedin className="h-4 w-4" />
            </a>
            <a href={whatsapp} target="_blank" rel="noreferrer" className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-100 text-gray-600" aria-label="WhatsApp">
              <FaWhatsapp className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

