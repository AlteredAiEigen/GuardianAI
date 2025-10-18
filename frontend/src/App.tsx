import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Documentation from './pages/Documentation';
import Playground from './pages/Playground';
import Dashboard from './pages/Dashboard';
import Setup from './pages/Setup';
import Monitoring from './pages/Monitoring';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-white text-gray-900">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/docs" element={<Documentation />} />
            <Route path="/playground" element={<Playground />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="/monitoring" element={<Monitoring />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
