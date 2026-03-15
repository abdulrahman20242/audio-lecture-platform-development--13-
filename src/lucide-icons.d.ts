// Type declarations for lucide-react direct icon imports
// This enables importing from 'lucide-react/dist/esm/icons/*' without TS errors
declare module 'lucide-react/dist/esm/icons/*' {
  import { LucideIcon } from 'lucide-react';
  const icon: LucideIcon;
  export default icon;
}
