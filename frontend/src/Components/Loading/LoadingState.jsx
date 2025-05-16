const Loading = ({ fullScreen = true, inline = false }) => {
  const loadingDots = (
    <div className="flex items-center space-x-2">
      <div className="w-3 h-3 rounded-full bg-[#6b46c1] animate-bounce" style={{ animationDelay: '0s' }}></div>
      <div className="w-3 h-3 rounded-full bg-[#6b46c1] animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      <div className="w-3 h-3 rounded-full bg-[#6b46c1] animate-bounce" style={{ animationDelay: '0.4s' }}></div>
    </div>
  );

  if (inline) return loadingDots;

  if (fullScreen) {
    return (
      <div className="flex w-screen h-screen items-center justify-center bg-gradient-to-b from-[#f3e8ff] to-white">
        {loadingDots}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-white/80 flex items-center justify-center">
      {loadingDots}
    </div>
  );
};

export default Loading;
