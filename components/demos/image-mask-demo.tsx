import React from 'react';
import ImageMask from '@/components/ui/image-mask';

const ComponentDemo = () => {
  return (
    <div className='flex flex-col gap-8 p-4'>
      <div className='p-4 border rounded-lg bg-gray-50 dark:bg-gray-900'>
        <ImageMask />
      </div>
    </div>
  );
};

export { ComponentDemo };
