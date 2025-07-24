import React, { useState, useRef } from 'react';

// File Upload Component
const FileUpload = ({ onFileSelect, accept = "image/*", className = "", placeholder = "Upload file" }) => {
  const [preview, setPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (file) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        setPreview(base64);
        onFileSelect(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    handleFileChange(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  return (
    <div className={`file-upload ${className}`}>
      <div
        className={`upload-area ${dragActive ? 'drag-active' : ''}`}
        onDrop={handleDrop}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onClick={() => fileInputRef.current?.click()}
      >
        {preview ? (
          <div className="preview">
            <img src={preview} alt="Preview" className="preview-image" />
            <p className="preview-text">Click to change</p>
          </div>
        ) : (
          <div className="upload-prompt">
            <div className="upload-icon">📁</div>
            <p>{placeholder}</p>
            <p className="upload-hint">Click or drag to upload</p>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={(e) => handleFileChange(e.target.files[0])}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default FileUpload;