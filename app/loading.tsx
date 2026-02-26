export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
      <div className="relative flex flex-col items-center transform scale-75">
        {/* Animated Cake/Cupcake */}
        <div className="relative animate-bounce duration-700">
             {/* Cherry */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-red-500 shadow-sm z-20">
                <div className="absolute top-0.5 right-0.5 h-1 w-1 rounded-full bg-white/40"></div>
                <div className="absolute -top-1.5 left-1/2 h-2 w-0.5 bg-red-700 -rotate-12"></div>
            </div>
            
            {/* Frosting Layers */}
            <div className="flex justify-center items-end -space-x-2 z-10 text-pink-300">
                 <div className="h-8 w-8 rounded-full bg-current shadow-sm"></div>
                 <div className="h-10 w-10 pb-1 rounded-full bg-current -mb-1 shadow-md relative z-10 flex items-center justify-center"></div>
                 <div className="h-8 w-8 rounded-full bg-current shadow-sm"></div>
            </div>

            {/* Cupcake Base */}
            <div className="relative mt-[-6px] h-10 w-16 bg-gradient-to-b from-purple-500 to-purple-700 rounded-b-lg shadow-xl overflow-hidden">
                {/* Ribs */}
                <div className="absolute inset-0 flex justify-around opacity-20 transform -skew-x-3">
                    <div className="w-0.5 h-full bg-black/30"></div>
                    <div className="w-0.5 h-full bg-black/30"></div>
                    <div className="w-0.5 h-full bg-black/30"></div>
                    <div className="w-0.5 h-full bg-black/30"></div>
                    <div className="w-0.5 h-full bg-black/30"></div>
                </div>
            </div>
        </div>
        
        {/* Text */}
        <div className="mt-6 flex flex-col items-center gap-2">
            <h2 className="text-xl font-bold text-purple-800 animate-pulse tracking-wide">
            Celebrate Sweetness...
            </h2>
            <div className="flex gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce delay-75"></div>
                <div className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce delay-150"></div>
                <div className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce delay-300"></div>
            </div>
        </div>
      </div>
    </div>
  );
}
