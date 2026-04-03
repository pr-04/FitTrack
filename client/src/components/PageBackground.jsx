const PageBackground = ({ children }) => {
    return (
        <div className="relative min-h-screen w-full overflow-x-hidden">
            <div className="relative z-10 min-h-screen">
                {children}
            </div>
        </div>
    );
};

export default PageBackground;
