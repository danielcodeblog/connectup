import React from 'react';

export const IconWrapper = ({ icon: Icon, size = 24, className, ...props }: any) => {
  return (
    <div className={className} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={size} {...props} />
    </div>
  );
};
