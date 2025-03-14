import React, { useState, useRef, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import axios from 'axios';
import './PDFEditor.css';

// TinyMCE API key
const TINYMCE_API_KEY = 'd82n2xgn8fpsa3ke9l002fw8vii39huovw6refauw5xpdw37';

// API base URL
const API_BASE_URL = 'http://localhost:5001';

const PDFEditor = ({ pdfFile, pdfName, onBack }) => {
  const editorRef = useRef(null);
  const iframeRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [editorReady, setEditorReady] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [initialContentSet, setInitialContentSet] = useState(false);
  const [pdfViewMode, setPdfViewMode] = useState('embed'); // 'embed' or 'download'

  // Load PDF content when component mounts
  useEffect(() => {
    const loadPdfContent = async () => {
      try {
        setLoading(true);
        setError('');
        setPdfError(false);
        
        // Set the PDF URL for preview
        const pdfViewUrl = `${API_BASE_URL}/api/pdf/${pdfFile}`;
        setPdfUrl(pdfViewUrl);
        
        // Try to fetch metadata to verify the PDF exists
        try {
          const metadataResponse = await axios.get(`${API_BASE_URL}/api/pdf/metadata/${pdfFile}`);
          console.log('PDF metadata:', metadataResponse.data);
          
          if (!metadataResponse.data.success) {
            throw new Error(metadataResponse.data.error || 'Failed to get PDF metadata');
          }
        } catch (metadataErr) {
          console.error('Error fetching PDF metadata:', metadataErr);
          // Continue anyway, as this is just for verification
        }
        
        // Extract the actual content from the PDF
        try {
          const extractResponse = await axios.get(`${API_BASE_URL}/api/pdf/extract/${pdfFile}`);
          console.log('PDF content extracted:', extractResponse.data);
          
          if (extractResponse.data.success && extractResponse.data.content) {
            // Use the HTML content from the extraction
            const extractedHtml = extractResponse.data.content.html;
            
            // Create a formatted HTML content with the PDF name and extracted content
            const formattedContent = `
              <h1>AcroBet_Anuzzz - ${pdfName}</h1>
              <p>This is an editable version of your PDF document: <strong>${pdfName}</strong></p>
              <p>You can modify this content using the editor tools above, and then export it back to PDF format.</p>
              <hr />
              ${extractedHtml}
            `;
            
            setEditorContent(formattedContent);
          } else {
            throw new Error(extractResponse.data.error || 'Failed to extract content from PDF');
          }
        } catch (extractErr) {
          console.error('Error extracting PDF content:', extractErr);
          
          // Fallback to placeholder content if extraction fails
          const placeholderContent = `
            <h1>AcroBet_Anuzzz - ${pdfName}</h1>
            <p>This is an editable version of your PDF document: <strong>${pdfName}</strong></p>
            <p>You can modify this content using the editor tools above, and then export it back to PDF format.</p>
            <hr />
            <h2>Could not extract content from your PDF</h2>
            <p>We were unable to extract the text content from your PDF. This could be because:</p>
            <ul>
              <li>The PDF contains only images or scanned content</li>
              <li>The PDF has security restrictions</li>
              <li>The PDF format is not supported for text extraction</li>
            </ul>
            <p>You can still edit this text and save it as a new PDF, or refer to the original PDF preview on the right.</p>
          `;
          
          setEditorContent(placeholderContent);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading PDF content:', err);
        setError('Failed to load PDF content. Please try again or upload a different PDF.');
        setLoading(false);
      }
    };

    if (pdfFile && pdfName) {
      loadPdfContent();
    } else {
      setError('No PDF file selected. Please upload a PDF first.');
      setLoading(false);
    }
  }, [pdfFile, pdfName]);

  // Check if PDF preview is working
  useEffect(() => {
    if (iframeRef.current && pdfUrl && pdfViewMode === 'embed') {
      // Set a timeout to check if the iframe loaded correctly
      const timer = setTimeout(() => {
        try {
          // Try to access iframe content - if it fails, the PDF didn't load
          const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
          if (!iframeDoc || iframeDoc.body.innerHTML === '') {
            console.log('PDF preview not loaded correctly, showing fallback');
            setPdfError(true);
          }
        } catch (e) {
          console.error('Error checking iframe content:', e);
          setPdfError(true);
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [pdfUrl, pdfViewMode]);

  const handleEditorChange = (content) => {
    // Only update the content, don't reset the editor
    // This prevents cursor from jumping
    if (editorReady) {
      // We don't need to call setEditorContent here
      // The editor will maintain its own state
    }
  };

  const handleEditorInit = (evt, editor) => {
    editorRef.current = editor;
    setEditorReady(true);
    
    // Set the initial content only once after editor is initialized
    if (!initialContentSet && editorContent) {
      editor.setContent(editorContent);
      setInitialContentSet(true);
    }
    
    console.log('Editor initialized:', editor);
  };

  const handlePdfError = () => {
    console.error('Error loading PDF preview');
    setPdfError(true);
  };

  const handleSaveAsPdf = async () => {
    if (!editorRef.current) {
      setError('Editor not initialized. Please try again.');
      return;
    }
    
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      const content = editorRef.current.getContent();
      console.log('Saving content:', content.substring(0, 100) + '...');
      
      if (!content || content.trim() === '') {
        setError('Cannot save empty content. Please add some text to the editor.');
        setSaving(false);
        return;
      }
      
      const response = await axios.post(`${API_BASE_URL}/api/pdf/convert`, {
        html: content,
        fileName: pdfName || 'document.pdf'
      });
      
      if (response.data.success) {
        setSuccess('PDF saved successfully! Downloading...');
        // Provide download link
        const pdfUrl = `${API_BASE_URL}/uploads/${response.data.pdfPath}`;
        console.log('PDF URL:', pdfUrl);
        
        // Create a download link instead of opening in a new tab
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = response.data.pdfPath;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        setError('Failed to save PDF: ' + (response.data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error saving PDF:', err);
      setError(
        err.response?.data?.error || 
        'Error saving PDF. Please check your connection and try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadOriginal = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = pdfName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleViewInNewTab = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  const togglePdfViewMode = () => {
    setPdfViewMode(prevMode => prevMode === 'embed' ? 'download' : 'embed');
    setPdfError(false);
  };

  return (
    <div className="editor-page">
      <div className="editor-header">
        <h2>Editing: {pdfName}</h2>
        <div className="editor-actions">
          <button className="btn btn-secondary" onClick={onBack}>
            Back
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSaveAsPdf}
            disabled={saving || loading || !editorReady}
          >
            {saving ? 'Saving...' : 'Save as PDF'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="editor-layout">
        <div className="editor-wrapper">
          {loading ? (
            <div className="loading">Loading editor...</div>
          ) : (
            <Editor
              apiKey={TINYMCE_API_KEY}
              onInit={handleEditorInit}
              value={initialContentSet ? undefined : editorContent}
              onEditorChange={handleEditorChange}
              init={{
                height: 600,
                menubar: true,
                plugins: [
                  'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                  'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                  'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                ],
                toolbar: 'undo redo | blocks | ' +
                  'bold italic forecolor | alignleft aligncenter ' +
                  'alignright alignjustify | bullist numlist outdent indent | ' +
                  'removeformat | help',
                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                branding: false,
                statusbar: false,
                resize: true,
                setup: (editor) => {
                  // This prevents the cursor from jumping
                  editor.on('NodeChange', (e) => {
                    e.preventDefault();
                  });
                }
              }}
            />
          )}
        </div>
        
        <div className="pdf-preview">
          <div className="pdf-preview-header">
            <h3>Original PDF</h3>
            <div className="pdf-preview-actions">
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={togglePdfViewMode}
                disabled={!pdfUrl}
              >
                {pdfViewMode === 'embed' ? 'Switch to Download Mode' : 'Try Embedded View'}
              </button>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={handleViewInNewTab}
                disabled={!pdfUrl}
              >
                View in New Tab
              </button>
              <button 
                className="btn btn-primary btn-sm" 
                onClick={handleDownloadOriginal}
                disabled={!pdfUrl}
              >
                Download
              </button>
            </div>
          </div>
          
          {pdfUrl ? (
            pdfViewMode === 'download' || pdfError ? (
              <div className="pdf-fallback">
                <div className="pdf-fallback-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </div>
                <h3>PDF Preview Not Available</h3>
                {pdfError ? (
                  <p>Your browser cannot display the PDF preview directly.</p>
                ) : (
                  <p>You've selected download mode for this PDF.</p>
                )}
                <p>Please use one of these options:</p>
                <div className="pdf-fallback-actions">
                  <button 
                    className="btn btn-secondary" 
                    onClick={handleViewInNewTab}
                  >
                    View in New Tab
                  </button>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleDownloadOriginal}
                  >
                    Download PDF
                  </button>
                  {pdfError && (
                    <button 
                      className="btn btn-secondary" 
                      onClick={togglePdfViewMode}
                    >
                      Try Download Mode
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <iframe 
                ref={iframeRef}
                src={`${pdfUrl}#toolbar=0&navpanes=0`}
                className="pdf-iframe"
                title="PDF Preview"
                onError={handlePdfError}
              />
            )
          ) : (
            <div className="loading">Loading PDF preview...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFEditor; 