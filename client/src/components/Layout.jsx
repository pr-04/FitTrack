import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import AIChatbot from './AIChatbot';

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen relative overflow-hidden">
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-20 lg:hidden transition-all duration-300"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden relative z-0">
                <div className="px-4 pt-4 md:px-6 md:pt-6 lg:px-8 lg:pt-8 w-full">
                    <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
                </div>
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pt-0 md:pt-0 lg:pt-0">
                    <Outlet />
                </main>
            </div>
            <AIChatbot />
        </div>
    );
};

export default Layout;
