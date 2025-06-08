import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {

  return (
    <footer className="bg-white w-full px-6 py-10 mt-20 border-t">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10">
        {/* Column 1: Logo + Socials + Language */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <img src="/icons/logo.png" alt="MeSeer Logo" className="h-10" />
            <span className="text-2xl font-bold text-gray-800">MeSeer</span>
          </div>

          <div className="flex space-x-4">
            <img src="/icons/instagram.png" alt="Instagram" className="h-5 cursor-pointer" />
            <img src="/icons/youtube.png" alt="YouTube" className="h-5 cursor-pointer" />
            <img src="/icons/linkedin.png" alt="LinkedIn" className="h-5 cursor-pointer" />
            <img src="/icons/facebook.png" alt="Facebook" className="h-5 cursor-pointer" />
            <img src="/icons/twitter.png" alt="Twitter" className="h-5 cursor-pointer" />
          </div>

          <div className="w-fit border px-4 py-2 text-sm rounded cursor-pointer text-gray-700 hover:bg-gray-100">
            English
          </div>

          <div className="text-sm text-gray-500">
            <span className="block hover:underline cursor-pointer">
              Do Not Sell or Share My Info
            </span>
            <span className="block hover:underline cursor-pointer">Cookie Settings</span>
          </div>
        </div>

        {/* Column 2: Company */}
        <div className="space-y-2 text-sm">
          <h3 className="text-gray-800 font-semibold mb-2">Company</h3>
          <div onClick={() => Link("/blogs")} className="text-gray-600 hover:text-black cursor-pointer">Blogs</div>
          <div className="text-gray-600 hover:text-black cursor-pointer">About Us</div>
          <div className="text-gray-600 hover:text-black cursor-pointer">Careers</div>
          <div className="text-gray-600 hover:text-black cursor-pointer">Security</div>
          <div className="text-gray-600 hover:text-black cursor-pointer">Status</div>
          <div className="text-gray-600 hover:text-black cursor-pointer">Terms & Privacy</div>
        </div>

        {/* Column 3: Download */}
        <div className="space-y-2 text-sm">
          <h3 className="text-gray-800 font-semibold mb-2">Download</h3>
          <div className="text-gray-600 hover:text-black cursor-pointer">iOS & Android</div>
          <div className="text-gray-600 hover:text-black cursor-pointer">Mac & Windows</div>
          <div className="text-gray-600 hover:text-black cursor-pointer">Calendar</div>
          <div className="text-gray-600 hover:text-black cursor-pointer">Web Clipper</div>
        </div>

        {/* Column 4: Resources */}
        <div className="space-y-2 text-sm">
          <h3 className="text-gray-800 font-semibold mb-2">Resources</h3>
          <div className="text-gray-600 hover:text-black cursor-pointer">Help Center</div>
          <div className="text-gray-600 hover:text-black cursor-pointer">Pricing</div>
          <div className="text-gray-600 hover:text-black cursor-pointer">Blogs</div>
          <div className="text-gray-600 hover:text-black cursor-pointer">Community</div>
          <div className="text-gray-600 hover:text-black cursor-pointer">Integrations</div>
          <div className="text-gray-600 hover:text-black cursor-pointer">Templates</div>
          <div className="text-gray-600 hover:text-black cursor-pointer">Affiliates</div>
        </div>

        {/* Column 5: MeSeer for */}
        <div className="space-y-2 text-sm">
          <h3 className="text-gray-800 font-semibold mb-2">MeSeer for</h3>
          <div className="text-gray-600 hover:text-black cursor-pointer">Enterprise</div>
          <div className="text-gray-600 hover:text-black cursor-pointer">Small Business</div>
          <div className="text-gray-600 hover:text-black cursor-pointer">Personal</div>
        </div>
      </div>

      {/* Bottom Disclaimer */}
      <div className="mt-10 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} MeSeer. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
