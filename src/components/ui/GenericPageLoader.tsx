import React from "react";
import { BrandLogo } from "./BrandLogo";

export function GenericPageLoader() {
  return (
    <div className="flex-1 w-full h-full min-h-[500px] flex flex-col items-center justify-center p-6 bg-gray-50/30">
      <div className="relative flex items-center justify-center w-16 h-16">
        {/* Outer glowing ring */}
        <div className="absolute inset-0 rounded-full border-4 border-indigo-100/50 animate-ping opacity-75" />

        {/* Inner spinning ring */}
        <div className="absolute inset-[-4px] rounded-full border-t-2 border-l-2 border-indigo-600 animate-spin" />

        {/* Logo Container */}
        <div className="w-10 h-10 rounded-full bg-white shadow-xl shadow-indigo-600/10 flex items-center justify-center relative z-10 text-indigo-600">
          <div className="w-6 h-6 text-white bg-gray-950 rounded-lg flex items-center justify-center flex-shrink-0">
            <BrandLogo />
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center gap-2">
        <h3 className="text-lg font-semibold text-gray-900 tracking-tight animate-pulse">Loading</h3>
        <p className="text-sm text-gray-500 max-w-[250px] text-center">
          Preparing your workspace...
        </p>
      </div>
    </div>
  );
}
