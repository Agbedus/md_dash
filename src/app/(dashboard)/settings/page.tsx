"use client";
import { FaCog } from "react-icons/fa";

export default function SettingsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-24 text-center">
      <FaCog className="text-6xl text-indigo-400 mb-4" />
      <h1 className="text-2xl font-semibold text-white">Settings</h1>
      <p className="text-slate-400 text-sm mt-2">Your settings will appear here.</p>
    </div>
  );
}
