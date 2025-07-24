import { useState } from 'react';
import { Car, Phone, Mail, MapPin } from 'lucide-react';
import { SiDiscord, SiInstagram, SiGithub, SiLinkedin } from 'react-icons/si'

const Footer = () => {
  const [email, setEmail] = useState('');

  const handleNewsletterSubmit = () => {
    if (email) {
      console.log('Newsletter signup:', email);
      setEmail('');
    }
  };

  return (
    <footer className="bg-gray-900 text-white">
      <style jsx>{`
        .instagram-gradient:hover {
          background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .discord-spin:hover {
          animation: spin-360 0.5s ease-in-out;
        }
        
        @keyframes spin-360 {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Car className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Rental</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Premium car rental service offering luxury vehicles for every occasion. 
              Experience comfort and reliability with our fleet.
            </p>
            <div className="flex items-center space-x-1 text-sm text-gray-400">
              <span>⭐ 4.9/5 from 2,500+ reviews</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Quick Links</h4>
            <ul className="space-y-2">
              {[
                'Browse Cars',
                'Become a Host', 
                'How it Works',
                'Insurance Coverage',
                'Customer Support'
              ].map((link) => (
                <li key={link}>
                  <a 
                    href="#" 
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Contact Us</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-blue-400" />
                <a href='tel:+919919206912' className='text-gray-400 text-sm hover:text-blue-500 transition'>
                    (+91) 9919206912
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-blue-400" />
                <a href='mailto:jatinsrivastava4104@gmail.com' className='text-gray-400 text-sm hover:text-blue-500 transition'>
                    jatinsrivastava4104@gmail.com
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span className="text-gray-400 text-sm">Lucknow, Uttar Pradesh, 226022</span>
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Newsletter</h4>
            <p className="text-gray-400 text-sm">
              Subscribe for exclusive deals and updates.
            </p>
            <div className="space-y-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleNewsletterSubmit}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-800 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            
            {/* Copyright */}
            <p className="text-gray-400 text-sm">
              © 2024 Rental. All rights reserved.
            </p>
            
            {/* Social Links */}
            <div className="flex items-center space-x-4">
              {[
                { 
                  Icon: SiDiscord, 
                  href: '#discord', 
                  hoverColor: 'hover:text-[#5865F2]',
                  extraClass: 'discord-spin'
                },
                { 
                  Icon: SiGithub, 
                  href: '#github', 
                  hoverColor: 'hover:text-white',
                  extraClass: ''
                },
                { 
                  Icon: SiInstagram, 
                  href: '#instagram', 
                  hoverColor: '',
                  extraClass: 'instagram-gradient'
                },
                { 
                  Icon: SiLinkedin, 
                  href: '#linkedin', 
                  hoverColor: 'hover:text-[#0077B5]',
                  extraClass: ''
                }
              ].map(({ Icon, href, hoverColor, extraClass }, index) => (
                <a
                  key={index}
                  href={href}
                  className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-all duration-200 group"
                >
                  <Icon className={`w-4 h-4 text-gray-400 transition-all duration-200 ${hoverColor} ${extraClass}`} />
                </a>
              ))}
            </div>
            
            {/* Legal Links */}
            <div className="flex items-center space-x-4 text-sm">
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                Privacy Policy
              </a>
              <span className="text-gray-600">•</span>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;