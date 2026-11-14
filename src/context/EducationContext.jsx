import { createContext, useContext, useState } from 'react';

const EducationContext = createContext({ on: false, toggle: () => {} });

export function EducationProvider({ children }) {
  const [on, setOn] = useState(false);
  return <EducationContext.Provider value={{ on, toggle: () => setOn((v) => !v) }}>{children}</EducationContext.Provider>;
}

export function useEducation() {
  return useContext(EducationContext);
}
