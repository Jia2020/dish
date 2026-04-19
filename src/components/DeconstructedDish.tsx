import { motion, AnimatePresence } from "motion/react";
import * as React from "react";
import { useState } from "react";
import { Ingredient, DeconstructionResult } from "../types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Utensils, Info, Layers, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExplodedDishProps {
  originalImage: string;
  result: DeconstructionResult;
}

export function ExplodedDish({ originalImage, result }: ExplodedDishProps) {
  // Sort ingredients by layer index in descending order for the vertical stack
  const sortedIngredients = [...result.ingredients].sort((a, b) => b.layerIndex - a.layerIndex);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
      {/* Left Column: Visualizer */}
      <div className="lg:col-span-6 space-y-6">
        <div className="flex flex-col items-center justify-center min-h-[600px] relative bg-stone-100/50 rounded-2xl border border-stone-200 dot-grid p-8 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key="ai-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full h-full flex items-center justify-center"
            >
              {result.generatedImageUrl ? (
                <div className="relative group">
                  <img 
                    src={result.generatedImageUrl} 
                    alt="AI Generated Deconstruction" 
                    className="max-h-[550px] rounded-lg shadow-2xl border-4 border-white object-contain"
                  />
                </div>
              ) : (
                <div className="text-stone-400 flex flex-col items-center gap-4">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <p className="label-text">Generating Render...</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Right Column: Detailed Breakdown */}
      <div className="lg:col-span-6 h-full">
        <div className="space-y-6">
          <div className="label-group mb-4">
             <div className="label-text">Detected Components</div>
             <p className="text-xs text-stone-400 mt-1">High-confidence visual signatures identified</p>
          </div>

          <ScrollArea className="h-[550px] pr-4">
            <div className="space-y-3">
              {result.ingredients.map((item, i) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                >
                  <div className="bg-white border border-stone-200 rounded-lg p-5 flex items-center gap-6 group hover:border-amber-600 transition-all shadow-sm">
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-stone-900 leading-tight flex items-center gap-2">
                             {item.name}
                             {item.chineseName && <span className="text-stone-300 font-medium text-xs tracking-normal">{item.chineseName}</span>}
                          </h4>
                          <p className="text-stone-500 text-[12px] mt-1 leading-snug">{item.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
          
          <div className="pt-6 grid grid-cols-3 gap-6 border-t border-stone-200">
             <div className="space-y-1">
                <div className="text-xl font-bold text-stone-900">{result.ingredients.length}</div>
                <div className="label-text text-[9px]">Ingredients</div>
             </div>
             <div className="space-y-1">
                <div className="text-xl font-bold text-stone-900">High</div>
                <div className="label-text text-[9px]">Confidence</div>
             </div>
             <div className="space-y-1">
                <div className="text-xl font-bold text-stone-900">4s</div>
                <div className="label-text text-[9px]">Analysis Time</div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
