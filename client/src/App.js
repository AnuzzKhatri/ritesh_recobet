import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import PDFUploader from './components/PDFUploader';
import PDFEditor from './components/PDFEditor';
import './App.css';

function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfName, setPdfName] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const handleFileUpload = (file, name) => {
    console.log('File uploaded:', file, 'Name:', name);
    setPdfFile(file);
    setPdfName(name);
    setIsEditing(true);
  };

  const handleBackToUpload = () => {
    setIsEditing(false);
    // Don't clear the file state immediately to avoid flashing
    // The user might want to go back to editing the same file
  };

  return (
    <Router>
      <div className="app">
        <Header />
        <main className="main-content">
          <Routes>
            <Route 
              path="/" 
              element={
                isEditing && pdfFile ? (
                  <PDFEditor 
                    pdfFile={pdfFile} 
                    pdfName={pdfName}
                    onBack={handleBackToUpload}
                  />
                ) : (
                  <PDFUploader onFileUpload={handleFileUpload} />
                )
              } 
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App; 