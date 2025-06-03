// 为CSS模块添加类型声明
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

// 为图像文件添加类型声明
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.svg' {
  import React from 'react';
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

// 为环境变量添加类型声明
interface ProcessEnv {
  NODE_ENV: 'development' | 'production' | 'test';
  REACT_APP_API_URL?: string;
} 