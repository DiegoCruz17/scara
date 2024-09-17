'use client';

import React, { useState,useEffect } from 'react';
import { useConfigurator } from '../contexts/Configurator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { Label } from "@/app/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group"

const ScaraRobotControl = () => {
  const attrs = useConfigurator();
  const [limitsEnabled1, setLimitsEnabled1] = useState(false);
  const [limitsEnabled2, setLimitsEnabled2] = useState(false);
  const [limitsEnabled3, setLimitsEnabled3] = useState(false);
  const [limitsEnabled4, setLimitsEnabled4] = useState(false);
  const [limitsEnabled5, setLimitsEnabled5] = useState(false);

  const resetToDefaults = () => {
    attrs.setBase(0);
    attrs.setSegmento1(0);
    attrs.setZAxis(100);
    attrs.setSegmento2(0);
    attrs.setGripper(0);
    attrs.setBaseMin(-180);
    attrs.setBaseMax(180);
    attrs.setZMin(100);
    attrs.setZMax(230);
    attrs.setSegmento1Min(-150);
    attrs.setSegmento1Max(150);
    attrs.setSegmento2Min(-150);
    attrs.setSegmento2Max(150);
    attrs.setGripperMin(0);
    attrs.setGripperMax(90);

    setLimitsEnabled1(false);
    setLimitsEnabled2(false);
    setLimitsEnabled3(false);
    setLimitsEnabled4(false);
    setLimitsEnabled5(false);
  };
  // useEffect(()=>{
  const sendInstructions = async () => {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify(attrs);

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/", requestOptions);
      let res = await response.json();
      attrs.setMatrix(res.matrix);
      attrs.setMatrix1(res.matrix1);
      attrs.setMatrix2(res.matrix2);
      attrs.setMatrix3(res.matrix3);
      attrs.setMatrix4(res.matrix4);
      
    } catch (error) {
      console.error(error);
    }
  };

  //   sendInstructions();

  // },[attrs.base, attrs.segmento1, attrs.segmento2, attrs.zAxis])

  return (
    <div className="flex flex-row gap-0 w-[100%] relative">
      <Tabs defaultValue="forward" orientation="vertical" className="flex w-[100%] min-w-[100%]">
        <TabsList className="flex flex-col h-full bg-gray-100 p-0 justify-start">
          <TabsTrigger value="forward" className="font-bold rotate-180 [writing-mode:vertical-lr]">Forward</TabsTrigger>
          <TabsTrigger value="inverse" className="font-bold rotate-180 [writing-mode:vertical-lr]">Inverse</TabsTrigger>
        </TabsList>
        <div className="flex flex-col flex-grow">
          <div className="min-w-[100%] flex-grow max-w-[800px] bg-white p-[16px]">
          <TabsContent value="forward">
            <ControlGroup
            title="Base"
            value={attrs.base}
            setValue={attrs.setBase}
            min={attrs.baseMin}
            max={attrs.baseMax}
            setMin={attrs.setBaseMin}
            setMax={attrs.setBaseMax}
            unit="°"
            limitsEnabled={limitsEnabled1}
            setLimitsEnabled={setLimitsEnabled1}
          />

          <ControlGroup
            title="Eje Z"
            value={attrs.zAxis}
            setValue={attrs.setZAxis}
            min={attrs.zMin}
            max={attrs.zMax}
            setMin={attrs.setZMin}
            setMax={attrs.setZMax}
            unit="mm"
            limitsEnabled={limitsEnabled2}
            setLimitsEnabled={setLimitsEnabled2}
          />

          <ControlGroup
            title="Segmento 1"
            value={attrs.segmento1}
            setValue={attrs.setSegmento1}
            min={attrs.segmento1Min}
            max={attrs.segmento1Max}
            setMin={attrs.setSegmento1Min}
            setMax={attrs.setSegmento1Max}
            unit="°"
            limitsEnabled={limitsEnabled3}
            setLimitsEnabled={setLimitsEnabled3}
          />

          <ControlGroup
            title="Segmento 2"
            value={attrs.segmento2}
            setValue={attrs.setSegmento2}
            min={attrs.segmento2Min}
            max={attrs.segmento2Max}
            setMin={attrs.setSegmento2Min}
            setMax={attrs.setSegmento2Max}
            unit="°"
            limitsEnabled={limitsEnabled5}
            setLimitsEnabled={setLimitsEnabled5}
          />

          <ControlGroup
            title="Gripper"
            value={attrs.gripper}
            setValue={attrs.setGripper}
            min={attrs.gripperMin}
            max={attrs.gripperMax}
            setMin={attrs.setGripperMin}
            setMax={attrs.setGripperMax}
            unit="°"
            limitsEnabled={limitsEnabled4}
            setLimitsEnabled={setLimitsEnabled4}
          />
              <div className="mt-8 flex justify-center space-x-4">
                <button onClick={sendInstructions} className="bg-[#5e7029] text-white font-normal py-2 px-4 rounded-[4px]">
                  Execute
                </button>
                <button onClick={resetToDefaults} className="bg-[#5e2129] text-white font-normal py-2 px-4 rounded-[4px]">
                  Reset
                </button>
              </div>
          </TabsContent>
          <TabsContent value="inverse">
            <RadioGroup defaultValue={attrs.mode} 
            onValueChange={(value) => {
              attrs.setMode(value);
            }} 
            className="grid grid-cols-3">
              <div className="flex items-center space-x-2 justify-center">
                <RadioGroupItem value="geometrico" id="geometrico" />
                <Label htmlFor="geometrico">Geometrico</Label>
              </div>
              <div className="flex items-center space-x-2 justify-center">
                <RadioGroupItem value="algebraico" id="algebraico" />
                <Label htmlFor="algebraico">Algebraico</Label>
              </div>
              <div className="flex items-center space-x-2 justify-center">
                <RadioGroupItem value="mth" id="mth" />
                <Label htmlFor="mth">MTH</Label>
              </div>
              <div className="flex items-center space-x-2 justify-center">
                <RadioGroupItem value="newton" id="newton" />
                <Label htmlFor="newton">Newton</Label>
              </div>
              <div className="flex items-center space-x-2 justify-center">
                <RadioGroupItem value="gradiente" id="gradiente" />
                <Label htmlFor="gradiente">Gradiente</Label>
              </div>
            </RadioGroup>
            <PositionControlGroup title={"X"} value={attrs.x} setValue={attrs.setX} min={0} max={100} unit={"mm"}/>
            <PositionControlGroup title={"Y"} value={attrs.y} setValue={attrs.setY} min={0} max={100} unit={"mm"}/>
            <PositionControlGroup title={"Z"} value={attrs.z} setValue={attrs.setZ} min={0} max={100} unit={"mm"}/>
              <div className="mt-8 flex justify-center space-x-4">
                <button onClick={sendInstructions} className="bg-[#5e7029] text-white font-normal py-2 px-4 rounded-[4px]">
                  Execute
                </button>
                <button onClick={resetToDefaults} className="bg-[#5e2129] text-white font-normal py-2 px-4 rounded-[4px]">
                  Reset
                </button>
              </div>
          </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
};

const ControlGroup = ({ title, value, setValue, min, max, unit, limitsEnabled, setLimitsEnabled, setMin, setMax }) => {

  const handleValueChange = (newValue) => {
    const clampedValue = Math.max(min, Math.min(max, newValue));
    setValue(clampedValue);
  };

  return (
    <div className="space-y-2 text-black mt-[8px] m-[8px]">
      <div className="flex flex-row justify-between items-center">
        <h2 className="text-xl font-semibold text-[#000]">{title}</h2>
        <label className="flex items-center space-x-2">
          <input 
            type="checkbox" 
            checked={limitsEnabled}
            onChange={() => setLimitsEnabled(!limitsEnabled)}
          />
          <span>Habilitar Límites</span>
        </label>
      </div>
      <div className="flex justify-between items-center space-x-2 text-black">
        <div className="flex items-center">
          <input 
            type="number" 
            value={min} 
            onChange={(e) => setMin(Number(e.target.value))}
            className="w-16 p-1 border rounded"
            disabled={!limitsEnabled}
          />
          <span className="ml-1">{unit}</span>
        </div>
        <input 
          type="range" 
          min={min} 
          max={max} 
          value={value} 
          onChange={(e) => handleValueChange(Number(e.target.value))}
          className="flex-1"
        />
        <div className="flex items-center">
          <input 
            type="number" 
            value={max} 
            onChange={(e) => setMax(Number(e.target.value))}
            className="w-16 p-1 border rounded"
            disabled={!limitsEnabled}
          />
          <span className="ml-1">{unit}</span>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <button 
          onClick={() => handleValueChange(value - 1)}
          className="bg-[#5e2129] text-white hover:bg-gray-400 text-gray-800 font-normal py-1 px-3 rounded-[4px]"
        >
          -1
        </button>
        <div className="flex items-center">
          <input 
            type="number" 
            value={value} 
            onChange={(e) => handleValueChange(Number(e.target.value))}
            className="w-20 p-1 border rounded text-center"
          />
          <span className="ml-1">{unit}</span>
        </div>
        <button 
          onClick={() => handleValueChange(value + 1)}
          className="bg-[#5e2129] text-white hover:bg-gray-400 text-gray-800 font-normal py-1 px-3 rounded-[4px]"
        >
          +1
        </button>
      </div>
    </div>
  );
};
const PositionControlGroup = ({ title, value, setValue, min, max, unit }) => {

  const handleValueChange = (newValue) => {
    const clampedValue = Math.max(min, Math.min(max, newValue));
    setValue(clampedValue);
  };

  return (
    <div className="space-y-2 text-black mt-[8px] m-[8px]">
      <div className="flex flex-row justify-between items-center">
        <h2 className="text-xl font-semibold text-[#000]">{title}</h2>
      </div>
      <div className="flex justify-between items-center space-x-2 text-black">
        <input 
          type="range" 
          min={min} 
          max={max} 
          value={value} 
          onChange={(e) => handleValueChange(Number(e.target.value))}
          className="flex-1"
        />
      </div>
      <div className="flex justify-between items-center">
        <button 
          onClick={() => handleValueChange(value - 1)}
          className="bg-[#5e2129] text-white hover:bg-gray-400 text-gray-800 font-normal py-1 px-3 rounded-[4px]"
        >
          -1
        </button>
        <div className="flex items-center">
          <input 
            type="number" 
            value={value} 
            onChange={(e) => handleValueChange(Number(e.target.value))}
            className="w-20 p-1 border rounded text-center"
          />
          <span className="ml-1">{unit}</span>
        </div>
        <button 
          onClick={() => handleValueChange(value + 1)}
          className="bg-[#5e2129] text-white hover:bg-gray-400 text-gray-800 font-normal py-1 px-3 rounded-[4px]"
        >
          +1
        </button>
      </div>
    </div>
  );
};

export default ScaraRobotControl;

