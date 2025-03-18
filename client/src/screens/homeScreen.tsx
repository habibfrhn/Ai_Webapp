// homeScreen.tsx
import { useNavigate } from 'react-router-dom';
import { theme } from '../theme';

const HomeScreen = () => {
  const navigate = useNavigate();

  return (
    <div style={{ background: theme.background, minHeight: '100vh' }} className="p-4">
      {/* Header row: title on the left, upload button on the right */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Beranda</h1>
        <button
          onClick={() => navigate('/upload')}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Upload faktur
        </button>
      </div>
    </div>
  );
};

export default HomeScreen;
