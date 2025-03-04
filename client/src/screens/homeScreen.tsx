// src/screens/homeScreen.tsx
import { useNavigate } from 'react-router-dom';

const HomeScreen = () => {
  const navigate = useNavigate();

  return (
    <div>
      {/* Header row: title on the left, upload button on the right */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Beranda</h1>
        <button
          onClick={() => navigate('/upload')}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Upload faktur
        </button>
      </div>

      <p>Welcome to the homepage of Ai_Webapp!</p>
    </div>
  );
};

export default HomeScreen;
