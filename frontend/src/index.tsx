import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
// @ts-ignore
import App from './App';
import { store } from './store';
// @ts-ignore
import reportWebVitals from './reportWebVitals';
// 导入Stagewise工具栏包装器
import StagewiseToolbarWrapper from './components/StagewiseToolbarWrapper';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);

// 只在开发环境中创建并渲染Stagewise工具栏
if (process.env.NODE_ENV === 'development') {
  const toolbarRoot = document.createElement('div');
  toolbarRoot.id = 'stagewise-toolbar-root';
  document.body.appendChild(toolbarRoot);
  
  const stagewiseRoot = ReactDOM.createRoot(toolbarRoot);
  stagewiseRoot.render(<StagewiseToolbarWrapper />);
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(); 