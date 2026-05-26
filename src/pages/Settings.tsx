import Sidebar from "../components/Slidebar";

function Settings() {
  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />
      <div className="flex-1 p-10">
        <h1 className="text-4xl font-bold text-white">Settings</h1>
        <p className="mt-4 text-slate-400">Settings functionality coming soon...</p>
      </div>
    </div>
  );
}

export default Settings;
