import * as React from "react";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, Camera, Eraser, Loader2, ChefHat, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { deconstructDish, generateExplodedView } from "./lib/gemini";
import { DeconstructionResult } from "./types";
import { ExplodedDish } from "./components/DeconstructedDish";
import confetti from "canvas-confetti";

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string | null>(null);
  const [result, setResult] = useState<DeconstructionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrlInput.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrlInput)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error("Failed to fetch image via proxy");
      const blob = await response.blob();
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        setImageUrlInput("");
        setLoading(false);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error(err);
      setError("Unable to grab image from this link. Most sites block this for security (CORS). Try downloading and uploading instead!");
      setLoading(false);
    }
  };

  const processImage = async () => {
    if (!image) return;
    setLoading(true);
    setLoadingStep("Identifying Ingredients...");
    setError(null);
    try {
      const [base64Header, base64Data] = image.split(",");
      const mimeType = base64Header.match(/:(.*?);/)?.[1] || "image/jpeg";
      
      const deconstruction = await deconstructDish(base64Data, mimeType);
      
      setLoadingStep("Generating Exploded View...");
      const generatedImageUrl = await generateExplodedView(deconstruction.dishName, deconstruction.ingredients);
      
      setResult({
        ...deconstruction,
        generatedImageUrl
      });
      
      confetti({
        particleCount: 150,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#D97706", "#FBBF24", "#F87171", "#10B981"],
      });
    } catch (err: any) {
      console.error(err);
      setError("Chef had a mishap! Failed to analyze the image. Please try another one.");
    } finally {
      setLoading(false);
      setLoadingStep(null);
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen font-sans selection:bg-amber-100">
      <header className="h-[72px] border-bottom border-stone-200 flex items-center justify-between px-6 md:px-12 bg-white sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-black tracking-tighter uppercase">
            Culinara <span className="text-amber-600">Vision</span>
          </h2>
        </div>
        
        <div className="flex items-center gap-6">
          <Button variant="default" className="rounded-[4px] h-10 px-6 text-xs font-bold uppercase tracking-wider bg-stone-900 hover:bg-stone-800 text-white border-none">
            New Analysis
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 md:px-12">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="uploader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid lg:grid-cols-2 gap-12 items-center"
            >
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="label-text">Molecular Analysis Tool</div>
                  <h1 className="text-6xl font-black leading-[0.95] tracking-tight text-stone-900 uppercase">
                    Every dish is a <span className="text-amber-600">formula.</span>
                  </h1>
                  <p className="text-stone-500 text-lg leading-relaxed max-w-lg">
                    Upload a high-fidelity image of any culinary creation to deconstruct its biological and structural properties.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 max-w-md">
                   <div className="p-4 border border-stone-200 bg-white rounded-lg space-y-2">
                     <Camera className="w-5 h-5 text-amber-600" />
                     <div className="label-text">Visual Scan</div>
                   </div>
                   <div className="p-4 border border-stone-200 bg-white rounded-lg space-y-2">
                     <ChefHat className="w-5 h-5 text-amber-600" />
                     <div className="label-text">AI Synthesis</div>
                   </div>
                </div>
              </div>

              <div className="w-full">
                {!image ? (
                  <>
                    <motion.div
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer group"
                  >
                    <Card className="h-[450px] dot-grid border border-stone-200 bg-white flex flex-col items-center justify-center gap-6 rounded-lg group-hover:border-stone-400 transition-all shadow-sm">
                      <div className="w-20 h-20 rounded-full border border-stone-100 bg-white shadow-xl flex items-center justify-center text-stone-400 group-hover:text-amber-600 transition-colors">
                        <Upload className="w-8 h-8" />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="label-text text-stone-900">Upload Source Visual</p>
                        <p className="text-stone-400 text-xs">TIFF, JPEG, PNG supported</p>
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        className="hidden" 
                        accept="image/*" 
                      />
                    </Card>
                  </motion.div>
                  
                  <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="h-[1px] flex-1 bg-stone-100" />
                      <span className="label-text text-stone-300">OR</span>
                      <div className="h-[1px] flex-1 bg-stone-100" />
                    </div>
                    
                    <form onSubmit={handleUrlSubmit} className="flex gap-2">
                      <input 
                        type="url" 
                        placeholder="Paste image link here..."
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        className="flex-1 bg-white border border-stone-200 rounded-[4px] px-4 py-2 text-sm focus:outline-none focus:border-amber-600 transition-colors disabled:opacity-50"
                        disabled={loading}
                      />
                      <Button 
                        type="submit" 
                        disabled={loading || !imageUrlInput.trim()}
                        variant="secondary"
                        className="rounded-[4px] border-stone-200 hover:bg-stone-50"
                      >
                        {loading && imageUrlInput ? <Loader2 className="w-4 h-4 animate-spin" /> : "Load Link"}
                      </Button>
                    </form>
                  </div>
                </>
                ) : (
                  <div className="space-y-6">
                    <Card className="bg-white border-stone-200 overflow-hidden rounded-lg shadow-xl p-3 relative aspect-[4/3] flex items-center justify-center">
                       <img src={image} alt="Source" className="w-full h-full object-cover rounded-sm" />
                       
                       {loading && (
                        <motion.div 
                          initial={{ top: "0%" }}
                          animate={{ top: "100%" }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="absolute left-0 right-0 h-[2px] bg-amber-600 shadow-[0_0_10px_#D97706] z-10"
                        />
                       )}

                       <div className="absolute inset-x-0 bottom-0 top-[60%] bg-gradient-to-t from-white via-white/80 to-transparent flex items-end p-6">
                         <div className="w-full flex justify-between items-center">
                           <Button 
                             onClick={reset} 
                             variant="outline" 
                             className="rounded-[4px] border-stone-200 text-stone-600 hover:bg-stone-50"
                           >
                             Clear Source
                           </Button>
                           <Button 
                             onClick={processImage} 
                             disabled={loading}
                             className="rounded-[4px] bg-stone-900 hover:bg-stone-800 text-white font-bold h-10 px-8 uppercase text-xs tracking-widest shadow-lg"
                           >
                             {loading ? (
                               <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {loadingStep}</>
                             ) : (
                               <><Sparkles className="w-4 h-4 mr-2" /> Start Analysis</>
                             )}
                           </Button>
                         </div>
                       </div>
                    </Card>
                    
                    {error && (
                      <div className="p-4 bg-red-50 text-red-700 text-xs font-bold uppercase tracking-wider border border-red-100 rounded-lg">
                        Error: {error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-end border-bottom border-stone-200 pb-6">
                <div>
                  <div className="label-text mb-2">Analysis Results</div>
                  <h3 className="text-3xl font-black uppercase text-stone-900 tracking-tight">{result.dishName}</h3>
                </div>
                <Button 
                  onClick={() => setResult(null)} 
                  variant="outline" 
                  className="rounded-[4px] border-stone-200 text-stone-500 hover:text-stone-900"
                >
                  <Upload className="w-4 h-4 mr-2 rotate-180" />
                  New Scan
                </Button>
              </div>

              <ExplodedDish originalImage={image!} result={result} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
