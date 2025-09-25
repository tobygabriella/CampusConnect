import { useState, useEffect, useRef } from 'react';

/**
 * AnimatedElement - A component that applies animations to its children when they enter the viewport.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The content to be animated
 * @param {string} props.animation - Animation type: 'fade-in', 'fade-in-up', 'scale-in', 'slide-in-right', 'slide-in-left', 'float'
 * @param {string} props.className - Additional CSS classes
 * @param {number} props.delay - Delay in seconds before animation starts
 * @param {number} props.duration - Duration of animation in seconds (overrides default)
 * @param {boolean} props.animateOnce - Whether animation should only happen once (true) or every time element enters viewport (false)
 * @param {number} props.threshold - Value from 0 to 1 indicating how much of element must be visible to trigger animation
 * @returns {React.ReactElement}
 */
const AnimatedElement = ({
  children,
  animation = 'fade-in',
  className = '',
  delay = 0,
  duration,
  animateOnce = true,
  threshold = 0.1,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);
  const wasAnimatedRef = useRef(false);

  useEffect(() => {
    const currentElement = elementRef.current;
    
    // Set up Intersection Observer to detect when element is in viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        // If we only want to animate once and it's already been animated, do nothing
        if (animateOnce && wasAnimatedRef.current) return;
        
        if (entry.isIntersecting) {
          setIsVisible(true);
          wasAnimatedRef.current = true;
        } else if (!animateOnce) {
          setIsVisible(false);
        }
      },
      { threshold }
    );

    if (currentElement) {
      observer.observe(currentElement);
    }

    // Clean up
    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [animateOnce, threshold]);

  // Generate animation style
  let animationClass = '';
  let customStyles = {};
  
  if (animation === 'custom') {
    // For custom animations, rely on className only
    animationClass = '';
  } else {
    animationClass = `animate-${animation}`;
    customStyles = {
      opacity: isVisible ? 1 : 0,
      animationDelay: `${delay}s`,
      animationDuration: duration ? `${duration}s` : undefined,
      animationFillMode: 'forwards',
    };
  }

  return (
    <div
      ref={elementRef}
      className={`${className} ${isVisible ? animationClass : ''}`}
      style={isVisible ? customStyles : { opacity: 0 }}
    >
      {children}
    </div>
  );
};

export default AnimatedElement;
