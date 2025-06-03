import React, { useEffect, useState } from 'react';

// 只在开发环境中导入StagewiseToolbar
const StagewiseToolbar = process.env.NODE_ENV === 'development' 
  ? require('@stagewise/toolbar-react').StagewiseToolbar 
  : null;

const stagewiseConfig = {
  plugins: []
};

const StagewiseToolbarWrapper: React.FC = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // 只在开发环境中渲染工具栏
  if (process.env.NODE_ENV !== 'development' || !mounted || !StagewiseToolbar) {
    return null;
  }

  return <StagewiseToolbar config={stagewiseConfig} />;
};

export default StagewiseToolbarWrapper; 