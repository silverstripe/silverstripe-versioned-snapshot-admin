import React, { useEffect } from 'react';
import useResizeAware from 'react-resize-aware';

const ResizeAwareHoc = ({ children, className, onResize }) => {
  const [resizeListener, sizes] = useResizeAware();

  useEffect(() => {
    onResize({ width: sizes?.width, height: sizes?.height });
  }, [sizes?.width, sizes?.height]);

  return (
    <div className={className}>
      {resizeListener}
      {children}
    </div>
  );
};

export default ResizeAwareHoc;
