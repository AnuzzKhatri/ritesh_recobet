import React, { useState } from 'react';
import axios from 'axios';
import './PDFUploader.css';

// API base URL
const API_BASE_URL = 'http://localhost:5001';

const PDFUploader = ({ onFileUpload }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (selectedFile) => {
    setError('');
    
    if (!selectedFile) {
      return;
    }

    // Check file type
    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    // Check file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit');
      return;
    }

    setFile(selectedFile);
    console.log(`File selected: ${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setLoading(true);
    setError('');
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/pdf/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      console.log('Upload response:', response.data);

      if (response.data.success) {
        // Check if we have the correct file information in the response
        if (response.data.file && response.data.file.filename) {
          // Pass the filename to the parent component
          onFileUpload(response.data.file.filename, file.name);
        } else if (response.data.filePath) {
          // Backward compatibility with older API response format
          onFileUpload(response.data.filePath, file.name);
        } else {
          setError('Invalid server response. File information missing.');
        }
      } else {
        setError(response.data.error || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setError(error.response.data.error || `Server error: ${error.response.status}`);
      } else if (error.request) {
        // The request was made but no response was received
        setError('No response from server. Please check your connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="uploader-container">
      <div className="card">
        <h2>Upload PDF Document</h2>
        <p className="description">
          Upload a PDF file to edit its content. The document will be converted to an editable format.
        </p>

        <form onSubmit={handleSubmit} className="upload-form">
          <div 
            className={`drop-area ${dragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              id="file-upload" 
              className="file-input" 
              accept=".pdf" 
              onChange={handleFileChange}
            />
            <label htmlFor="file-upload" className="file-label">
              {file ? (
                <>
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <span>Drag & drop your PDF here or click to browse</span>
                </>
              )}
            </label>
          </div>

          {error && <div className="error-message">{error}</div>}
          
          {loading && (
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <div className="progress-text">{uploadProgress}% Uploaded</div>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary upload-btn" 
            disabled={!file || loading}
          >
            {loading ? 'Uploading...' : 'Upload and Edit'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PDFUploader; 