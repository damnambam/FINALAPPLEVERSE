import React, { useState } from "react";

export default function PictureGrid({ rows }) {
  const [imageErrors, setImageErrors] = useState({});

  const handleImageError = (index) => {
    setImageErrors(prev => ({ ...prev, [index]: true }));
  };

  // Try to construct image URL - adjust based on your backend image structure
  const getImageUrl = (row, index) => {
    // If there's an image field in the row, use it
    if (row?.IMAGE_URL || row?.image || row?.imageUrl) {
      return row.IMAGE_URL || row.image || row.imageUrl;
    }
    // Otherwise try backend images endpoint
    if (row?.ACNO) {
      return `/images/${row.ACNO}.jpg`;
    }
    return null;
  };

  if (!rows?.length) {
    return (
      <div className="grid-wrap">
        <div className="empty">No pictures to show.</div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="grid-result-title">Result</h3>
      <div className="grid-wrap">
        {rows.map((r, i) => {
          const imageUrl = getImageUrl(r, i);
          const hasError = imageErrors[i];
          
          return (
            <div className="grid-card" key={i}>
              <div className={`thumb ${!imageUrl || hasError ? 'no-image' : ''}`}>
                {imageUrl && !hasError ? (
                  <img 
                    src={imageUrl} 
                    alt={r?.CULTIVAR_NAME || "Apple variety"}
                    onError={() => handleImageError(i)}
                    loading="lazy"
                  />
                ) : null}
              </div>
              <div className="title">{r?.CULTIVAR_NAME || "Unknown"}</div>
              <div className="sub">{r?.ACCESSION || ""}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
