import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// StrictMode removed — CesiumJS viewer/tilesets are not compatible
// with double-mount behavior (async resource fetching conflicts)
createRoot(document.getElementById('root')).render(<App />);
