
/**
 * Utility functions for debugging the application
 */

/**
 * Log object with highlighting for important fields
 * @param title The title for the log
 * @param obj The object to log
 * @param highlightFields Array of field names to highlight 
 */
export const logObject = (title: string, obj: any, highlightFields: string[] = []) => {
  console.group(`🔍 ${title}`);
  
  if (!obj) {
    console.log('Object is null or undefined');
    console.groupEnd();
    return;
  }
  
  // Log the full object first
  console.log('Full object:', obj);
  
  // Then log highlighted fields separately
  if (highlightFields.length > 0) {
    console.group('Highlighted fields:');
    highlightFields.forEach(field => {
      const hasField = field in obj;
      const value = hasField ? obj[field] : 'NOT PRESENT';
      
      if (hasField) {
        console.log(`%c${field}: ${JSON.stringify(value)}`, 'color: blue; font-weight: bold');
      } else {
        console.log(`%c${field}: ${value}`, 'color: red; font-weight: bold');
      }
    });
    console.groupEnd();
  }
  
  console.groupEnd();
};

/**
 * Create a function that will log when a component renders with its props
 * @param componentName The name of the component
 */
export const createRenderLogger = (componentName: string) => {
  return (props: any) => {
    console.log(`🔄 ${componentName} rendering with props:`, props);
    return props;
  };
};

/**
 * Log state updates in a component
 * @param componentName The name of the component
 * @param prevState The previous state
 * @param nextState The new state
 */
export const logStateChange = (componentName: string, prevState: any, nextState: any) => {
  console.group(`📝 ${componentName} state change`);
  
  const allKeys = new Set([...Object.keys(prevState || {}), ...Object.keys(nextState || {})]);
  
  allKeys.forEach(key => {
    const prevValue = prevState?.[key];
    const nextValue = nextState?.[key];
    
    if (JSON.stringify(prevValue) !== JSON.stringify(nextValue)) {
      console.log(`${key}:`, {
        from: prevValue,
        to: nextValue
      });
    }
  });
  
  console.groupEnd();
};
