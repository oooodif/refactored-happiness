import { useState } from "react";
import { useLocation } from "wouter";
import SiteLayout from "@/components/layout/site-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function UIPlayground() {
  const [, navigate] = useLocation();
  const [activeEffects, setActiveEffects] = useState<string[]>([]);
  
  const toggleEffect = (effect: string) => {
    if (activeEffects.includes(effect)) {
      setActiveEffects(activeEffects.filter(e => e !== effect));
    } else {
      setActiveEffects([...activeEffects, effect]);
    }
  };
  
  // Helper to check if an effect is active
  const isEffectActive = (effect: string) => activeEffects.includes(effect);
  
  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-8 overflow-y-auto max-h-screen">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">UI Enhancement Playground</h1>
            <p className="text-gray-600">Toggle different modern UI effects to preview how they look</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Controls Panel */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>UI Effects</CardTitle>
                  <CardDescription>Toggle effects on/off</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="glassmorphism" className="cursor-pointer">Glassmorphism 2.0</Label>
                    <Switch 
                      id="glassmorphism" 
                      checked={isEffectActive('glassmorphism')}
                      onCheckedChange={() => toggleEffect('glassmorphism')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="depth3d" className="cursor-pointer">3D Elements with Depth</Label>
                    <Switch 
                      id="depth3d" 
                      checked={isEffectActive('depth3d')}
                      onCheckedChange={() => toggleEffect('depth3d')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="variableColors" className="cursor-pointer">Variable Blending Colors</Label>
                    <Switch 
                      id="variableColors" 
                      checked={isEffectActive('variableColors')}
                      onCheckedChange={() => toggleEffect('variableColors')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="microInteractions" className="cursor-pointer">Morphing Micro-interactions</Label>
                    <Switch 
                      id="microInteractions" 
                      checked={isEffectActive('microInteractions')}
                      onCheckedChange={() => toggleEffect('microInteractions')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="neumorphic" className="cursor-pointer">Neumorphic Controls</Label>
                    <Switch 
                      id="neumorphic" 
                      checked={isEffectActive('neumorphic')}
                      onCheckedChange={() => toggleEffect('neumorphic')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="animatedGradients" className="cursor-pointer">Animated Gradients</Label>
                    <Switch 
                      id="animatedGradients" 
                      checked={isEffectActive('animatedGradients')}
                      onCheckedChange={() => toggleEffect('animatedGradients')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="customCursor" className="cursor-pointer">Custom Cursor Effects</Label>
                    <Switch 
                      id="customCursor" 
                      checked={isEffectActive('customCursor')}
                      onCheckedChange={() => toggleEffect('customCursor')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="typography" className="cursor-pointer">Enhanced Typography</Label>
                    <Switch 
                      id="typography" 
                      checked={isEffectActive('typography')}
                      onCheckedChange={() => toggleEffect('typography')}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveEffects([])}
                    className="w-full"
                  >
                    Reset All
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            {/* Preview Area */}
            <div className="lg:col-span-3">
              <Tabs defaultValue="cards" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="cards">Cards</TabsTrigger>
                  <TabsTrigger value="buttons">Buttons</TabsTrigger>
                  <TabsTrigger value="forms">Forms</TabsTrigger>
                </TabsList>
                <TabsContent value="cards" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Preview Card 1 */}
                    <Card className={`
                      transition-all duration-300
                      ${isEffectActive('glassmorphism') ? 'bg-opacity-70 backdrop-blur-md border-opacity-30' : ''}
                      ${isEffectActive('depth3d') ? 'hover:translate-y-[-5px] hover:shadow-xl' : ''}
                      ${isEffectActive('variableColors') ? 'bg-gradient-to-br from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100' : ''}
                      ${isEffectActive('neumorphic') ? 'shadow-[4px_4px_10px_rgba(0,0,0,0.1),-4px_-4px_10px_rgba(255,255,255,0.9)]' : ''}
                      ${isEffectActive('animatedGradients') ? 'animated-gradient border-transparent' : ''}
                    `}>
                      <CardHeader>
                        <CardTitle className={`
                          ${isEffectActive('typography') ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-2xl font-bold' : ''}
                        `}>
                          Subscription Options
                        </CardTitle>
                        <CardDescription>Choose the plan that works for you</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="p-4 rounded-lg bg-gray-50">
                          <div className="text-xl font-bold mb-2">$0.99 / month</div>
                          <ul className="list-disc ml-5 space-y-1">
                            <li>100 LaTeX generations</li>
                            <li>PDF export</li>
                            <li>Basic templates</li>
                          </ul>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button className={`w-full
                          ${isEffectActive('microInteractions') ? 'transform active:scale-95 transition-transform' : ''}
                          ${isEffectActive('animatedGradients') ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600' : ''}
                        `}>
                          Subscribe Now
                        </Button>
                      </CardFooter>
                    </Card>
                    
                    {/* Preview Card 2 */}
                    <Card className={`
                      transition-all duration-300
                      ${isEffectActive('glassmorphism') ? 'bg-opacity-70 backdrop-blur-md border-opacity-30' : ''}
                      ${isEffectActive('depth3d') ? 'hover:translate-y-[-5px] hover:shadow-xl' : ''}
                      ${isEffectActive('variableColors') ? 'bg-gradient-to-br from-green-50 to-teal-50 hover:from-green-100 hover:to-teal-100' : ''}
                      ${isEffectActive('neumorphic') ? 'shadow-[4px_4px_10px_rgba(0,0,0,0.1),-4px_-4px_10px_rgba(255,255,255,0.9)]' : ''}
                      ${isEffectActive('animatedGradients') ? 'animated-gradient-2 border-transparent' : ''}
                    `}>
                      <CardHeader>
                        <CardTitle className={`
                          ${isEffectActive('typography') ? 'text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-teal-600 text-2xl font-bold' : ''}
                        `}>
                          Document Templates
                        </CardTitle>
                        <CardDescription>Professional layouts for any need</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="p-4 rounded-lg bg-gray-50">
                          <p className="mb-3">Choose from various templates:</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 border rounded text-center">Academic</div>
                            <div className="p-2 border rounded text-center">Presentation</div>
                            <div className="p-2 border rounded text-center">Report</div>
                            <div className="p-2 border rounded text-center">Letter</div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" className={`w-full
                          ${isEffectActive('microInteractions') ? 'transform active:scale-95 transition-transform' : ''}
                          ${isEffectActive('animatedGradients') ? 'bg-gradient-to-r from-green-100 to-teal-100 hover:from-green-200 hover:to-teal-200 border-transparent' : ''}
                        `}>
                          Browse Templates
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="buttons" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className={`
                        ${isEffectActive('typography') ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-2xl font-bold' : ''}
                      `}>
                        Button Styles
                      </CardTitle>
                      <CardDescription>Different button variations with applied effects</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                        <div className="space-y-4">
                          <h3 className="font-medium mb-2">Primary Buttons</h3>
                          <div className="space-y-2">
                            <Button size="lg" className={`w-full
                              ${isEffectActive('microInteractions') ? 'transform active:scale-95 transition-transform' : ''}
                              ${isEffectActive('animatedGradients') ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-transparent' : ''}
                              ${isEffectActive('neumorphic') ? 'shadow-[3px_3px_6px_rgba(0,0,0,0.2),-2px_-2px_5px_rgba(255,255,255,0.1)]' : ''}
                              ${isEffectActive('depth3d') ? 'hover:translate-y-[-2px] hover:shadow-lg' : ''}
                            `}>
                              Generate LaTeX
                            </Button>
                            
                            <Button size="default" className={`w-full
                              ${isEffectActive('microInteractions') ? 'transform active:scale-95 transition-transform' : ''}
                              ${isEffectActive('animatedGradients') ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-transparent' : ''}
                              ${isEffectActive('neumorphic') ? 'shadow-[3px_3px_6px_rgba(0,0,0,0.2),-2px_-2px_5px_rgba(255,255,255,0.1)]' : ''}
                              ${isEffectActive('depth3d') ? 'hover:translate-y-[-2px] hover:shadow-lg' : ''}
                            `}>
                              Upgrade Plan
                            </Button>
                            
                            <Button size="sm" className={`w-full
                              ${isEffectActive('microInteractions') ? 'transform active:scale-95 transition-transform' : ''}
                              ${isEffectActive('animatedGradients') ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-transparent' : ''}
                              ${isEffectActive('neumorphic') ? 'shadow-[2px_2px_4px_rgba(0,0,0,0.2),-1px_-1px_3px_rgba(255,255,255,0.1)]' : ''}
                              ${isEffectActive('depth3d') ? 'hover:translate-y-[-1px] hover:shadow-md' : ''}
                            `}>
                              Download PDF
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <h3 className="font-medium mb-2">Secondary Buttons</h3>
                          <div className="space-y-2">
                            <Button variant="outline" size="lg" className={`w-full
                              ${isEffectActive('microInteractions') ? 'transform active:scale-95 transition-transform' : ''}
                              ${isEffectActive('animatedGradients') ? 'bg-gradient-to-r from-gray-100 to-blue-100 hover:from-gray-200 hover:to-blue-200 border-transparent' : ''}
                              ${isEffectActive('neumorphic') ? 'shadow-[3px_3px_6px_rgba(0,0,0,0.1),-2px_-2px_5px_rgba(255,255,255,0.8)]' : ''}
                              ${isEffectActive('depth3d') ? 'hover:translate-y-[-2px] hover:shadow-lg' : ''}
                            `}>
                              View History
                            </Button>
                            
                            <Button variant="outline" size="default" className={`w-full
                              ${isEffectActive('microInteractions') ? 'transform active:scale-95 transition-transform' : ''}
                              ${isEffectActive('animatedGradients') ? 'bg-gradient-to-r from-gray-100 to-blue-100 hover:from-gray-200 hover:to-blue-200 border-transparent' : ''}
                              ${isEffectActive('neumorphic') ? 'shadow-[3px_3px_6px_rgba(0,0,0,0.1),-2px_-2px_5px_rgba(255,255,255,0.8)]' : ''}
                              ${isEffectActive('depth3d') ? 'hover:translate-y-[-2px] hover:shadow-lg' : ''}
                            `}>
                              Save Draft
                            </Button>
                            
                            <Button variant="outline" size="sm" className={`w-full
                              ${isEffectActive('microInteractions') ? 'transform active:scale-95 transition-transform' : ''}
                              ${isEffectActive('animatedGradients') ? 'bg-gradient-to-r from-gray-100 to-blue-100 hover:from-gray-200 hover:to-blue-200 border-transparent' : ''}
                              ${isEffectActive('neumorphic') ? 'shadow-[2px_2px_4px_rgba(0,0,0,0.1),-1px_-1px_3px_rgba(255,255,255,0.8)]' : ''}
                              ${isEffectActive('depth3d') ? 'hover:translate-y-[-1px] hover:shadow-md' : ''}
                            `}>
                              Add Template
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="forms" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className={`
                        ${isEffectActive('typography') ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-2xl font-bold' : ''}
                      `}>
                        Form Elements
                      </CardTitle>
                      <CardDescription>Input fields and form controls with applied effects</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form className="space-y-4 p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="name">Document Title</Label>
                            <input
                              type="text"
                              id="name"
                              placeholder="Enter document title"
                              className={`w-full px-3 py-2 border rounded-md
                                ${isEffectActive('glassmorphism') ? 'bg-opacity-50 backdrop-blur-sm' : ''}
                                ${isEffectActive('depth3d') ? 'focus:translate-y-[-2px] focus:shadow-md transition-all' : ''}
                                ${isEffectActive('neumorphic') ? 'shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.5)]' : ''}
                                ${isEffectActive('microInteractions') ? 'transition-all duration-300 focus:ring-2 focus:ring-blue-400' : ''}
                              `}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="author">Author Name</Label>
                            <input
                              type="text"
                              id="author"
                              placeholder="Enter author name"
                              className={`w-full px-3 py-2 border rounded-md
                                ${isEffectActive('glassmorphism') ? 'bg-opacity-50 backdrop-blur-sm' : ''}
                                ${isEffectActive('depth3d') ? 'focus:translate-y-[-2px] focus:shadow-md transition-all' : ''}
                                ${isEffectActive('neumorphic') ? 'shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.5)]' : ''}
                                ${isEffectActive('microInteractions') ? 'transition-all duration-300 focus:ring-2 focus:ring-blue-400' : ''}
                              `}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="content">Document Content</Label>
                          <textarea
                            id="content"
                            rows={5}
                            placeholder="Enter document content or LaTeX code"
                            className={`w-full px-3 py-2 border rounded-md
                              ${isEffectActive('glassmorphism') ? 'bg-opacity-50 backdrop-blur-sm' : ''}
                              ${isEffectActive('depth3d') ? 'focus:translate-y-[-2px] focus:shadow-md transition-all' : ''}
                              ${isEffectActive('neumorphic') ? 'shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.5)]' : ''}
                              ${isEffectActive('microInteractions') ? 'transition-all duration-300 focus:ring-2 focus:ring-blue-400' : ''}
                            `}
                          ></textarea>
                        </div>
                        
                        <div className="pt-4">
                          <Button className={`w-full md:w-auto
                            ${isEffectActive('microInteractions') ? 'transform active:scale-95 transition-transform' : ''}
                            ${isEffectActive('animatedGradients') ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-transparent' : ''}
                            ${isEffectActive('neumorphic') ? 'shadow-[3px_3px_6px_rgba(0,0,0,0.1),-2px_-2px_5px_rgba(255,255,255,0.8)]' : ''}
                            ${isEffectActive('depth3d') ? 'hover:translate-y-[-2px] hover:shadow-lg' : ''}
                          `}>
                            Generate LaTeX Document
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <Button variant="outline" onClick={() => navigate("/")}>Return to Application</Button>
          </div>
        </div>
      </div>
      
      {/* Add custom styles for the effects */}
      <style dangerouslySetInnerHTML={{ __html: `
        ${isEffectActive('glassmorphism') ? `
          .bg-opacity-70 {
            background-color: rgba(255, 255, 255, 0.7);
          }
          .backdrop-blur-md {
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
          }
          body {
            background-image: linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1));
            background-attachment: fixed;
          }
        ` : ''}
        
        ${isEffectActive('animatedGradients') ? `
          .animated-gradient {
            background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
            background-size: 400% 400%;
            animation: gradient 15s ease infinite;
          }
          .animated-gradient-2 {
            background: linear-gradient(-45deg, #43a047, #1de9b6, #1e88e5, #00acc1);
            background-size: 400% 400%;
            animation: gradient 15s ease infinite;
          }
          @keyframes gradient {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }
        ` : ''}
        
        ${isEffectActive('customCursor') ? `
          button {
            cursor: pointer;
          }
          input, textarea {
            cursor: text;
          }
          a {
            cursor: pointer;
          }
        ` : ''}
      ` }} />
    </SiteLayout>
  );
}