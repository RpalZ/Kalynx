import { Toaster } from 'sonner';
import { FridgeCamera } from './components/FridgeCamera';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />
      <main className="container mx-auto px-4 py-8">
        <FridgeCamera />
      </main>
    </div>
  );
}

export default App; 