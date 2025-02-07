'use client'
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const LoadingSpinner = () => {
  return (
    <DotLottieReact
      src="/data.json"
      loop
      autoplay
    />
  );
};
export default LoadingSpinner