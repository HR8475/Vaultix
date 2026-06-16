import React from 'react';

const Skeleton = ({ className, style }) => {
  return <div className={`skeleton ${className || ''}`} style={style} />;
};

export const SkeletonText = ({ lines = 1, className }) => {
  return (
    <div className={`skeleton-text-wrapper ${className || ''}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="skeleton-line" />
      ))}
    </div>
  );
};

export const SkeletonCard = () => {
  return (
    <div className="skeleton-card">
      <Skeleton className="skeleton-card-header" />
      <SkeletonText lines={3} />
      <div className="skeleton-card-footer">
        <Skeleton className="skeleton-btn" />
      </div>
    </div>
  );
};

export default Skeleton;
